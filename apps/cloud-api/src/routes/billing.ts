import type { FastifyInstance, FastifyRequest } from "fastify";
import { billingService } from "../billing/billingServiceInstance.js";
import { verifyPortalToken } from "../lib/portalJwt.js";
import type { CheckoutRequest } from "../billing/types.js";
import { PayPalProvider } from "../billing/providers/paypal/PayPalProvider.js";
import { StripeProvider } from "../billing/providers/stripe/StripeProvider.js";
import { db } from "../db/client.js";
import { customers } from "../db/schema/customers.js";
import { subscriptions } from "../db/schema/subscriptions.js";
import { invoices } from "../db/schema/invoices.js";
import { notificationService } from "../billing/NotificationService.js";
import { payments } from "../db/schema/payments.js";
import { and, eq } from "drizzle-orm";
import { addDays, addMonths } from "date-fns";
import { ENV } from "../config/env.js";
import { type Currency } from "../config/pricing.js";
import { parseCheckoutPlanId } from "../lib/billingPeriod.js";
import { catalogNetTaxGrossCents } from "../lib/vatAmountBreakdown.js";
import {
  getActivePaidLicenseTierForCustomer,
  getActivePaidSubscriptionPlanPeriodForCustomer,
} from "../lib/hasUsablePaidLicense.js";
import {
  evaluateCheckoutEligibility,
  type PaidPlanContext,
} from "../lib/checkoutPlanEligibility.js";
import { ensurePaidLicenseAfterSuccessfulPayment } from "../lib/finalizePaidLicenseAfterPayment.js";
import { persistStripeSubscriptionAfterCheckoutSession } from "../lib/persistStripeSubscriptionFromSession.js";
import { ensureStripePaidInvoiceFromCheckoutSession } from "../lib/ensureStripePaidInvoice.js";

interface PortalJwtPayload {
  customerId: string;
  orgId: string;
  iat: number;
  exp: number;
}

function getPortalAuth(request: FastifyRequest): PortalJwtPayload {
  const auth = request.headers.authorization;
  if (!auth || !auth.startsWith("Bearer ")) {
    throw new Error("Missing portal token");
  }
  const token = auth.slice("Bearer ".length);
  return verifyPortalToken(token) as PortalJwtPayload;
}

async function generateInvoiceNumber(): Promise<string> {
  const now = new Date();
  const year = now.getFullYear();
  const rand = Math.floor(Math.random() * 1_000_000)
    .toString()
    .padStart(6, "0");
  return `INV-${year}-${rand}`;
}

function normalizePortalBaseUrl(): string {
  return String(ENV.PORTAL_BASE_URL ?? "").replace(/\/+$/, "");
}

/**
 * Only allow return URLs on our configured portal origin (open redirect protection).
 */
function resolveBillingPortalReturnUrl(bodyReturnUrl: unknown): string {
  const base = normalizePortalBaseUrl() || "http://localhost:5173";
  const fallback = `${base}/portal/plan`;
  if (typeof bodyReturnUrl !== "string" || !bodyReturnUrl.trim()) {
    return fallback;
  }
  const trimmed = bodyReturnUrl.trim();
  if (!/^https?:\/\//i.test(trimmed)) {
    return fallback;
  }
  const baseLower = base.toLowerCase();
  if (!trimmed.toLowerCase().startsWith(baseLower)) {
    return fallback;
  }
  return trimmed;
}

export async function registerBillingRoutes(app: FastifyInstance) {
  const paypalProvider = new PayPalProvider();
  const stripeProvider = new StripeProvider();

  // POST /api/billing/checkout
  app.post<{
    Body: CheckoutRequest;
  }>("/api/billing/checkout", async (request, reply) => {
    let payload: PortalJwtPayload;

    try {
      payload = getPortalAuth(request);
    } catch (err) {
      app.log.warn({ err }, "billing/checkout: invalid portal token");
      reply.code(401);
      return {
        ok: false,
        error: "unauthorized",
        message: "Invalid or missing portal token",
      };
    }

    const body = request.body;
    const idempotencyKey = request.headers["idempotency-key"] as string | undefined;

    // Generate idempotency key if not provided
    const finalIdempotencyKey = idempotencyKey || `checkout:${payload.orgId}:${body.planId}:${body.provider}:${Date.now()}`;

    try {
      // 1) Create subscription and invoice in DB first
      const [customer] = await db
        .select()
        .from(customers)
        .where(eq(customers.id, payload.customerId))
        .limit(1);

      if (!customer || !customer.orgId) {
        reply.code(400);
        return {
          ok: false,
          error: "customer_not_found",
          message: "Customer not found or missing orgId",
        };
      }

      // Parse planId (starter_monthly, starter_yearly, pro_monthly, pro_yearly)
      const { plan, period } = parseCheckoutPlanId(body.planId);
      const currency = (body.currency ?? "EUR") as Currency;

      const paidTier = await getActivePaidLicenseTierForCustomer(
        String(payload.customerId),
      );

      const subPlanPeriod =
        await getActivePaidSubscriptionPlanPeriodForCustomer(
          String(payload.customerId),
        );

      const activeCheckout: PaidPlanContext | null = subPlanPeriod
        ? { tier: subPlanPeriod.tier, period: subPlanPeriod.period }
        : paidTier
          ? { tier: paidTier, period: null }
          : null;

      const eligibility = evaluateCheckoutEligibility(
        activeCheckout,
        plan,
        period,
      );

      if (!eligibility.ok) {
        reply.code(400);
        if (eligibility.code === "downgrade_not_allowed") {
          return {
            ok: false,
            error: "downgrade_not_allowed",
            message:
              "Downgrading from Pro to Starter is not available in self-service checkout. Please contact support.",
          };
        }
        if (eligibility.code === "interval_downgrade_not_allowed") {
          return {
            ok: false,
            error: "interval_downgrade_not_allowed",
            message:
              "Switching from yearly to monthly billing is not available in checkout. Please use the billing portal or contact support.",
          };
        }
        return {
          ok: false,
          error: "already_have_plan",
          message:
            "You already have this plan and billing interval. Choose yearly to switch billing, upgrade tier, or manage billing in the portal.",
        };
      }

      // No usable paid license: clear orphan "active" subscription rows (e.g. licenses
      // removed in admin while subscriptions stayed active). Prevents duplicate active subs.
      // Skip when upgrading Starter → Pro so the existing Starter subscription stays active until payment completes.
      if (paidTier === null) {
        await db
          .update(subscriptions as any)
          .set({
            status: "cancelled",
            canceledAt: new Date(),
          } as any)
          .where(
            and(
              eq(subscriptions.customerId as any, payload.customerId),
              eq(subscriptions.status as any, "active"),
            ),
          );
      }

      // Cleanup pending subscriptions and abandoned Stripe checkout invoices
      await db
        .update(subscriptions as any)
        .set({ status: "cancelled" } as any)
        .where(
          and(
            eq(subscriptions.customerId as any, payload.customerId),
            eq(subscriptions.status as any, "pending"),
          ),
        );

      if (body.provider === "stripe") {
        await db
          .update(invoices as any)
          .set({ status: "canceled", dueAt: null } as any)
          .where(
            and(
              eq(invoices.customerId as any, payload.customerId),
              eq(invoices.status as any, "open"),
              eq(invoices.provider as any, "stripe"),
            ),
          );
      }

      const amounts = catalogNetTaxGrossCents(plan, currency, period);
      const priceCents = amounts.grossCents;
      const now = new Date();
      const currentPeriodEnd = period === "yearly" ? addMonths(now, 12) : addMonths(now, 1);

      const subscriptionProvider =
        body.provider === "stripe" ? "stripe" : "paypal";
      const subscriptionProviderEnv =
        body.provider === "stripe" ? stripeProvider.env : paypalProvider.env;

      const [sub] = await db
        .insert(subscriptions)
        .values({
          orgId: customer.orgId,
          customerId: payload.customerId,
          plan,
          status: "pending",
          billingPeriod: period,
          priceCents,
          currency,
          startedAt: now,
          currentPeriodEnd,
          provider: subscriptionProvider,
          providerEnv: subscriptionProviderEnv,
        } as any)
        .returning();

      if (!sub || !sub.id) {
        throw new Error("Failed to create subscription");
      }

      const planName = plan === "starter" ? "Starter" : plan === "pro" ? "Pro" : plan;
      const paymentMethod = body.provider === "stripe" ? "card" : "paypal";

      const checkoutMetadata: Record<string, string> = {
        ...(body.metadata ?? {}),
        subscriptionId: String(sub.id),
        planId: body.planId,
        customerId: String(payload.customerId),
      };

      let invoiceId: string | undefined;

      // PayPal: pre-create open invoice (legacy capture flow). Stripe: invoice only after payment.
      if (body.provider !== "stripe") {
        const invoiceNumber = await generateInvoiceNumber();
        const dueAt = addDays(now, 14);

        const [inv] = await db
          .insert(invoices)
          .values({
            orgId: customer.orgId,
            customerId: payload.customerId,
            subscriptionId: sub.id,
            number: invoiceNumber,
            amountCents: amounts.grossCents,
            amountGrossCents: amounts.grossCents,
            amountNetCents: amounts.netCents,
            amountTaxCents: amounts.taxCents,
            currency,
            status: "open",
            issuedAt: now,
            dueAt,
            provider: body.provider,
            providerEnv: paypalProvider.env,
            planName,
            billingPeriod: period,
            paymentMethod,
          } as any)
          .returning();

        if (!inv?.id) {
          throw new Error("Failed to create invoice");
        }
        invoiceId = String(inv.id);
        checkoutMetadata.invoiceId = invoiceId;
      }

      const result = await billingService.checkout(
        {
          ...body,
          customerId: payload.customerId,
          metadata: checkoutMetadata,
        },
        finalIdempotencyKey,
        payload.orgId,
      );

      return {
        ok: true,
        checkoutUrl: result.checkoutUrl,
        provider: result.provider,
        providerEnv: result.providerEnv,
        subscriptionId: String(sub.id),
        ...(invoiceId ? { invoiceId } : {}),
      };
    } catch (err: any) {
      app.log.error({ err, body, customerId: payload.customerId }, "billing/checkout failed");
      reply.code(500);
      return {
        ok: false,
        error: "checkout_failed",
        message: err?.message ?? "Checkout konnte nicht gestartet werden.",
      };
    }
  });

  // POST /api/billing/portal — Stripe Customer Billing Portal (manage card, cancel, invoices)
  app.post<{
    Body: { returnUrl?: string };
  }>("/api/billing/portal", async (request, reply) => {
    let payload: PortalJwtPayload;

    try {
      payload = getPortalAuth(request);
    } catch (err) {
      app.log.warn({ err }, "billing/portal: invalid portal token");
      reply.code(401);
      return {
        ok: false,
        error: "unauthorized",
        message: "Invalid or missing portal token",
      };
    }

    const [customerRow] = await db
      .select()
      .from(customers)
      .where(eq(customers.id as any, payload.customerId))
      .limit(1);

    if (!customerRow) {
      reply.code(404);
      return {
        ok: false,
        error: "not_found",
        message: "Customer not found.",
      };
    }

    const stripeCustomerId = customerRow.stripeCustomerId?.trim();
    if (!stripeCustomerId) {
      reply.code(400);
      return {
        ok: false,
        error: "no_stripe_customer",
        message: "No Stripe customer found for this account.",
      };
    }

    const secretKey =
      stripeProvider.env === "live"
        ? ENV.STRIPE_SECRET_KEY_LIVE
        : ENV.STRIPE_SECRET_KEY_TEST;

    if (!secretKey) {
      reply.code(500);
      return {
        ok: false,
        error: "stripe_not_configured",
        message: "Stripe is not configured.",
      };
    }

    const returnUrl = resolveBillingPortalReturnUrl(request.body?.returnUrl);

    const params = new URLSearchParams({
      customer: stripeCustomerId,
      return_url: returnUrl,
    });

    const sessionRes = await fetch("https://api.stripe.com/v1/billing_portal/sessions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${secretKey}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: params.toString(),
    });

    if (!sessionRes.ok) {
      const errText = await sessionRes.text();
      app.log.error(
        { status: sessionRes.status, errText },
        "billing/portal: Stripe billing portal session failed",
      );
      reply.code(502);
      return {
        ok: false,
        error: "portal_session_failed",
        message: "Could not open billing portal.",
      };
    }

    const sessionJson = (await sessionRes.json()) as { url?: string };
    if (!sessionJson?.url) {
      reply.code(502);
      return {
        ok: false,
        error: "portal_no_url",
        message: "Stripe returned no portal URL.",
      };
    }

    return { ok: true, url: sessionJson.url };
  });

  // POST /api/billing/capture - Handle PayPal/Stripe return after payment
  app.post<{
    Body: {
      orderId?: string; // PayPal order token
      sessionId?: string; // Stripe session ID
      invoiceId?: string; // Optional fallback
      provider?: "paypal" | "stripe"; // Optional: auto-detect if not provided
    };
  }>("/api/billing/capture", async (request, reply) => {
    let payload: PortalJwtPayload;

    try {
      payload = getPortalAuth(request);
    } catch (err) {
      app.log.warn({ err }, "billing/capture: invalid portal token");
      reply.code(401);
      return {
        ok: false,
        error: "unauthorized",
        message: "Invalid or missing portal token",
      };
    }

    const { orderId, sessionId, invoiceId, provider } = request.body;

    // Determine provider: Stripe if sessionId, PayPal if orderId, or use explicit provider
    const actualProvider: "paypal" | "stripe" | null = provider || (sessionId ? "stripe" : orderId ? "paypal" : null);

    if (!actualProvider) {
      reply.code(400);
      return {
        ok: false,
        error: "missing_params",
        message: "Either orderId (PayPal) or sessionId (Stripe) is required",
      };
    }

    try {
      let finalInvoiceId: string | undefined = invoiceId;
      let paymentId: string;
      let stripeCheckoutSession: { customer?: unknown; subscription?: unknown } | undefined;

      if (actualProvider === "stripe") {
        if (!sessionId) {
          reply.code(400);
          return {
            ok: false,
            error: "missing_params",
            message: "sessionId is required for Stripe",
          };
        }

        // Retrieve Stripe session
        const sessionRes = await fetch(`https://api.stripe.com/v1/checkout/sessions/${sessionId}`, {
          method: "GET",
          headers: {
            "Authorization": `Bearer ${stripeProvider["secretKey"]}`,
          },
        });

        if (!sessionRes.ok) {
          const errorText = await sessionRes.text();
          throw new Error(`Stripe session retrieval failed: ${sessionRes.status} ${errorText}`);
        }

        const session = await sessionRes.json();
        stripeCheckoutSession = session;

        // Check if session is complete
        if (session.payment_status !== "paid" && session.status !== "complete") {
          reply.code(400);
          return {
            ok: false,
            error: "payment_not_complete",
            message: `Stripe session status: ${session.status}, payment_status: ${session.payment_status}`,
          };
        }

        const metadata = session.metadata || {};
        paymentId = session.id;

        const ensured = await ensureStripePaidInvoiceFromCheckoutSession({
          session: session as Record<string, unknown>,
          providerEnv: stripeProvider.env,
        });
        finalInvoiceId = ensured.invoiceId;
      } else {
        // PayPal flow
        if (!orderId) {
          reply.code(400);
          return {
            ok: false,
            error: "missing_params",
            message: "orderId is required for PayPal",
          };
        }

        // Capture PayPal order (returns invoiceId from order metadata)
        const captureResult = await paypalProvider.captureOrder(orderId);

        if (!captureResult.success) {
          reply.code(400);
          return {
            ok: false,
            error: "capture_failed",
            message: "PayPal order capture failed",
          };
        }

        // Use invoiceId from capture result or from request body
        finalInvoiceId = captureResult.invoiceId || invoiceId;
        paymentId = orderId;

        if (!finalInvoiceId) {
          reply.code(400);
          return {
            ok: false,
            error: "invoice_id_missing",
            message: "Invoice ID could not be determined from PayPal order",
          };
        }
      }

      // Get invoice using finalInvoiceId
      const [inv] = await db
        .select()
        .from(invoices)
        .where(eq(invoices.id, finalInvoiceId))
        .limit(1);

      if (!inv || inv.customerId !== payload.customerId) {
        reply.code(404);
        return {
          ok: false,
          error: "invoice_not_found",
          message: "Invoice not found or access denied",
        };
      }

      if (actualProvider === "stripe" && stripeCheckoutSession) {
        await persistStripeSubscriptionAfterCheckoutSession({
          portalCustomerId: inv.customerId,
          internalSubscriptionId: inv.subscriptionId,
          session: stripeCheckoutSession,
          providerEnv: stripeProvider.env,
        });
      } else {
        // Update invoice to paid (PayPal / non-Stripe)
        await db
          .update(invoices as any)
          .set({ 
            status: "paid", 
            paidAt: new Date(),
            dueAt: null,
            providerRef: paymentId,
          } as any)
          .where(eq(invoices.id, finalInvoiceId));
      }

      // Get subscription (reload invoice after Stripe sync for correct amounts)
      const [invAfterSync] = await db
        .select()
        .from(invoices)
        .where(eq(invoices.id, finalInvoiceId))
        .limit(1);
      const paidInv = invAfterSync ?? inv;

      if (paidInv.subscriptionId) {
        const [sub] = await db
          .select()
          .from(subscriptions)
          .where(eq(subscriptions.id, paidInv.subscriptionId))
          .limit(1);

        if (sub && sub.status !== "active") {
          // Activate subscription
          await db
            .update(subscriptions as any)
            .set({ status: "active" } as any)
            .where(eq(subscriptions.id, paidInv.subscriptionId));

          const paymentAmount =
            actualProvider === "stripe" && stripeCheckoutSession
              ? Number((stripeCheckoutSession as { amount_total?: number }).amount_total ?? paidInv.amountCents)
              : paidInv.amountCents;

          // Create payment record
          await db.insert(payments).values({
            orgId: paidInv.orgId,
            customerId: paidInv.customerId,
            subscriptionId: paidInv.subscriptionId,
            provider: actualProvider,
            providerEnv: actualProvider === "stripe" ? stripeProvider.env : paypalProvider.env,
            providerPaymentId: paymentId,
            providerStatus: actualProvider === "stripe" ? "paid" : "COMPLETED",
            amountCents: paymentAmount,
            currency: paidInv.currency || "EUR",
            status: "succeeded",
            amountGrossCents: paymentAmount,
          } as any);

          if (paidInv.customerId && paidInv.orgId && paidInv.subscriptionId) {
            await ensurePaidLicenseAfterSuccessfulPayment({
              orgId: String(paidInv.orgId),
              customerId: String(paidInv.customerId),
              subscriptionId: String(paidInv.subscriptionId),
              invoiceId: String(paidInv.id),
              source: "portal_payment",
              sessionId: actualProvider === "stripe" ? paymentId : undefined,
              orderId: actualProvider === "paypal" ? paymentId : undefined,
            });
          }
        }
      }

      return {
        ok: true,
        message: "Payment captured successfully",
        invoiceId: finalInvoiceId,
      };
    } catch (err: any) {
      app.log.error({ err, orderId, invoiceId }, "billing/capture failed");
      reply.code(500);
      return {
        ok: false,
        error: "capture_failed",
        message: err?.message ?? "Capture konnte nicht verarbeitet werden.",
      };
    }
  });
}

