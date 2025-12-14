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
import { licenses } from "../db/schema/licenses.js";
import { licenseEvents } from "../db/schema/licenseEvents.js";
import { notificationService } from "../billing/NotificationService.js";
import { payments } from "../db/schema/payments.js";
import { and, eq, ne } from "drizzle-orm";
import { addDays, addMonths } from "date-fns";
import { generateLicenseKey } from "../lib/licenseKey.js";
import { getPlanPrice, type Currency } from "../config/pricing.js";

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

      // Parse planId
      const planIdParts = body.planId.split("_");
      const plan = planIdParts[0] as "starter" | "pro";
      const period = body.planId.includes("yearly") ? "yearly" : "monthly";
      const currency = (body.currency ?? "EUR") as Currency;

      // Check for existing active subscription
      const [existingActive] = await db
        .select()
        .from(subscriptions)
        .where(
          and(
            eq(subscriptions.customerId, payload.customerId),
            eq(subscriptions.status as any, "active"),
          ),
        )
        .limit(1);

      if (existingActive) {
        reply.code(400);
        return {
          ok: false,
          error: "active_subscription_exists",
          message: "Für dieses Konto existiert bereits ein aktiver Plan.",
        };
      }

      // Cleanup pending subscriptions
      await db
        .update(subscriptions as any)
        .set({ status: "cancelled" } as any)
        .where(
          and(
            eq(subscriptions.customerId as any, payload.customerId),
            eq(subscriptions.status as any, "pending"),
          ),
        );

      // Create subscription
      const price = getPlanPrice(plan, currency, period);
      const priceCents = Math.round(price * 100);
      const now = new Date();
      const currentPeriodEnd = period === "yearly" ? addMonths(now, 12) : addMonths(now, 1);

      const [sub] = await db
        .insert(subscriptions)
        .values({
          orgId: customer.orgId,
          customerId: payload.customerId,
          plan,
          status: "pending",
          priceCents,
          currency,
          startedAt: now,
          currentPeriodEnd,
          provider: "paypal",
          providerEnv: paypalProvider.env,
        } as any)
        .returning();

      if (!sub || !sub.id) {
        throw new Error("Failed to create subscription");
      }

      // Create invoice
      const invoiceNumber = await generateInvoiceNumber();
      const planName = plan === "starter" ? "Starter" : plan === "pro" ? "Pro" : plan;
      const paymentMethod = body.provider === "stripe" ? "card" : "paypal";
      
      // Fälligkeitsdatum nur setzen bei "open" Status (nicht bei "paid")
      const invoiceStatus = "open";
      const dueAt = invoiceStatus === "open" ? addDays(now, 14) : null;
      
      const [inv] = await db
        .insert(invoices)
        .values({
          orgId: customer.orgId,
          customerId: payload.customerId,
          subscriptionId: sub.id,
          number: invoiceNumber,
          amountCents: priceCents,
          currency,
          status: invoiceStatus,
          issuedAt: now,
          dueAt: dueAt, // Nur bei "open" Status, sonst null
          provider: body.provider,
          providerEnv: body.provider === "stripe" ? stripeProvider.env : paypalProvider.env,
          planName: planName,
          paymentMethod: paymentMethod,
        } as any)
        .returning();

      if (!inv || !inv.id) {
        throw new Error("Failed to create invoice");
      }

      // 2) Get checkout URL from provider
      // Store invoiceId in metadata so PayPal can return it
      const result = await billingService.checkout(
        {
          ...body,
          customerId: payload.customerId,
          metadata: {
            ...body.metadata,
            invoiceId: inv.id,
          },
        },
        finalIdempotencyKey,
        payload.orgId
      );

      return {
        ok: true,
        checkoutUrl: result.checkoutUrl,
        provider: result.provider,
        providerEnv: result.providerEnv,
        invoiceId: inv.id, // Return invoiceId for frontend
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

        // Check if session is complete
        if (session.payment_status !== "paid" && session.status !== "complete") {
          reply.code(400);
          return {
            ok: false,
            error: "payment_not_complete",
            message: `Stripe session status: ${session.status}, payment_status: ${session.payment_status}`,
          };
        }

        // Extract invoiceId from metadata (Stripe metadata is flat key/value, not JSON)
        const metadata = session.metadata || {};
        finalInvoiceId = metadata.invoiceId || invoiceId;
        paymentId = session.id;

        if (!finalInvoiceId) {
          reply.code(400);
          return {
            ok: false,
            error: "invoice_id_missing",
            message: "Invoice ID could not be determined from Stripe session metadata",
          };
        }
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

      // Update invoice to paid
      // Bei bezahlten Rechnungen: dueDate auf null setzen (nicht mehr relevant)
      await db
        .update(invoices as any)
        .set({ 
          status: "paid", 
          paidAt: new Date(),
          dueAt: null, // Bei bezahlten Rechnungen kein Fälligkeitsdatum
          providerRef: paymentId, // PayPal orderId oder Stripe sessionId
        } as any)
        .where(eq(invoices.id, finalInvoiceId));

      // Get subscription
      if (inv.subscriptionId) {
        const [sub] = await db
          .select()
          .from(subscriptions)
          .where(eq(subscriptions.id, inv.subscriptionId))
          .limit(1);

        if (sub && sub.status !== "active") {
          // Activate subscription
          await db
            .update(subscriptions as any)
            .set({ status: "active" } as any)
            .where(eq(subscriptions.id, inv.subscriptionId));

          // Create payment record
          await db.insert(payments).values({
            orgId: inv.orgId,
            customerId: inv.customerId,
            subscriptionId: inv.subscriptionId,
            provider: actualProvider,
            providerEnv: actualProvider === "stripe" ? stripeProvider.env : paypalProvider.env,
            providerPaymentId: paymentId,
            providerStatus: actualProvider === "stripe" ? "paid" : "COMPLETED",
            amountCents: inv.amountCents,
            currency: inv.currency || "EUR",
            status: "succeeded",
            amountGrossCents: inv.amountCents,
          } as any);

          // Create license if none exists
          if (inv.customerId && inv.orgId) {
            const [existingPaidLicense] = await db
              .select()
              .from(licenses)
              .where(
                and(
                  eq(licenses.customerId as any, inv.customerId),
                  ne(licenses.plan as any, "trial"),
                  eq(licenses.status as any, "active"),
                ),
              )
              .limit(1);

            if (!existingPaidLicense) {
              const now = new Date();
              const maxDevices = sub.plan === "starter" ? 1 : sub.plan === "pro" ? 3 : 1;
              const licenseKey = generateLicenseKey("CSTY");

              const [createdLicense] = await db
                .insert(licenses)
                .values({
                  orgId: String(inv.orgId),
                  customerId: String(inv.customerId),
                  subscriptionId: String(inv.subscriptionId),
                  plan: sub.plan,
                  status: "active",
                  key: licenseKey,
                  maxDevices,
                  validFrom: now,
                  validUntil: sub.currentPeriodEnd || addMonths(now, 1),
                } as any)
                .returning();

              if (createdLicense) {
                await db.insert(licenseEvents).values({
                  orgId: String(inv.orgId),
                  licenseId: createdLicense.id,
                  type: "created",
                  metadata: {
                    source: "portal_payment",
                    invoiceId: String(inv.id),
                    subscriptionId: String(inv.subscriptionId),
                  },
                });

                // Revoke trial licenses
                await db
                  .update(licenses as any)
                  .set({ status: "revoked" } as any)
                  .where(
                    and(
                      eq(licenses.customerId as any, inv.customerId),
                      eq(licenses.plan as any, "trial"),
                      eq(licenses.status as any, "active"),
                    ),
                  );
              }
            }
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

