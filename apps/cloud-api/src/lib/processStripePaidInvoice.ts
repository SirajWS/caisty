/**
 * Central idempotent handler for Stripe invoice.paid (renewals + create invoices).
 * Used by webhooks and reconciliation. Never charges Stripe or creates subscriptions.
 */

import { and, desc, eq, gte, sql } from "drizzle-orm";
import type { InferSelectModel } from "drizzle-orm";

import { db } from "../db/client.js";
import { customers } from "../db/schema/customers.js";
import { invoices } from "../db/schema/invoices.js";
import { licenses } from "../db/schema/licenses.js";
import { payments } from "../db/schema/payments.js";
import { subscriptions } from "../db/schema/subscriptions.js";
import { parseBillingPeriodFromPlanId } from "./billingPeriod.js";
import { ensurePaidLicenseAfterSuccessfulPayment } from "./finalizePaidLicenseAfterPayment.js";
import {
  isSubscriptionBackedPaidLicense,
  maxLicenseValidUntil,
} from "./licenseGrantGuard.js";
import {
  amountsFromStripeInvoice,
  invoiceAmountFieldsFromBreakdown,
} from "./stripeCheckoutAmounts.js";
import { syncPaidInvoiceFromStripeInvoice } from "./syncPaidInvoiceFromStripe.js";
import { maxDevicesForPlan } from "../config/licensePlans.js";

export type ProcessStripePaidInvoiceResult = {
  success: boolean;
  /** When false, webhook must be marked failed (not ok). */
  message: string;
  code?:
    | "ok"
    | "already_processed"
    | "unresolved_subscription"
    | "ambiguous_customer"
    | "invalid_invoice"
    | "error";
  updatedInvoiceId?: string;
  updatedSubscriptionId?: string;
  createdPaymentId?: string;
  createdLicenseId?: string;
  extendedLicenseId?: string;
  skippedManualLicenseIds?: string[];
};

function stripeRefId(
  ref: string | { id?: string } | null | undefined,
): string {
  if (ref == null) return "";
  if (typeof ref === "string") return ref.trim();
  if (typeof ref === "object" && typeof ref.id === "string") return ref.id.trim();
  return "";
}

function generateWebhookInvoiceNumber(): string {
  const year = new Date().getFullYear();
  const rand = Math.floor(Math.random() * 1_000_000)
    .toString()
    .padStart(6, "0");
  return `INV-${year}-${rand}`;
}

async function hasRecentStripeCheckoutPaymentForSubscription(
  internalSubscriptionId: string,
  amountCents: number,
): Promise<boolean> {
  const since = new Date(Date.now() - 48 * 60 * 60 * 1000);
  const [row] = await db
    .select({ id: payments.id })
    .from(payments)
    .where(
      and(
        eq(payments.subscriptionId as any, internalSubscriptionId as any),
        eq(payments.provider as any, "stripe"),
        eq(payments.status as any, "succeeded"),
        sql`${payments.providerPaymentId} like 'cs_%'`,
        eq(payments.amountCents as any, amountCents),
        gte(payments.createdAt as any, since),
      ),
    )
    .orderBy(desc(payments.createdAt as any))
    .limit(1);
  return Boolean(row);
}

export async function resolveLocalSubscriptionForStripeInvoice(invoice: {
  subscription?: unknown;
  customer?: unknown;
  metadata?: Record<string, string> | null;
  livemode?: boolean;
}): Promise<
  | { ok: true; sub: InferSelectModel<typeof subscriptions>; backfillProviderSubscriptionId?: string }
  | { ok: false; code: "unresolved_subscription" | "ambiguous_customer"; message: string }
> {
  const stripeSubId = stripeRefId(invoice.subscription as never);
  const stripeCustomerId = stripeRefId(invoice.customer as never);
  const metaInvoiceId = invoice.metadata?.invoiceId?.trim();
  const invoiceEnv =
    typeof invoice.livemode === "boolean"
      ? invoice.livemode
        ? "live"
        : "test"
      : null;

  const envCompatible = (sub: InferSelectModel<typeof subscriptions>) => {
    if (!invoiceEnv || !sub.providerEnv) return true;
    return String(sub.providerEnv) === invoiceEnv;
  };

  if (stripeSubId) {
    const [row] = await db
      .select()
      .from(subscriptions)
      .where(
        and(
          eq(subscriptions.provider as any, "stripe"),
          eq(subscriptions.providerSubscriptionId as any, stripeSubId),
        ),
      )
      .limit(1);
    if (row) {
      if (!envCompatible(row)) {
        return {
          ok: false,
          code: "unresolved_subscription",
          message: `Subscription ${stripeSubId} env mismatch (local=${row.providerEnv}, invoice=${invoiceEnv})`,
        };
      }
      return { ok: true, sub: row };
    }
  }

  if (metaInvoiceId) {
    const [invByMeta] = await db
      .select()
      .from(invoices)
      .where(eq(invoices.id, metaInvoiceId))
      .limit(1);
    if (invByMeta?.subscriptionId) {
      const [row] = await db
        .select()
        .from(subscriptions)
        .where(eq(subscriptions.id, invByMeta.subscriptionId))
        .limit(1);
      if (row) {
        if (!envCompatible(row)) {
          return {
            ok: false,
            code: "unresolved_subscription",
            message: `Subscription from invoice metadata env mismatch (local=${row.providerEnv}, invoice=${invoiceEnv})`,
          };
        }
        return { ok: true, sub: row };
      }
    }
  }

  // Safe fallback: unique local customer by Stripe customer id → exactly one active stripe sub
  if (stripeCustomerId) {
    const matchedCustomers = await db
      .select()
      .from(customers)
      .where(eq(customers.stripeCustomerId as any, stripeCustomerId));

    if (matchedCustomers.length > 1) {
      return {
        ok: false,
        code: "ambiguous_customer",
        message: `Multiple local customers share Stripe customer ${stripeCustomerId}`,
      };
    }
    if (matchedCustomers.length === 1) {
      const cid = String(matchedCustomers[0]!.id);
      const activeSubs = await db
        .select()
        .from(subscriptions)
        .where(
          and(
            eq(subscriptions.customerId, cid as any),
            eq(subscriptions.provider as any, "stripe"),
            sql`lower(${subscriptions.status}) in ('active','past_due','trialing','pending')`,
          ),
        );
      const envFiltered = invoiceEnv
        ? activeSubs.filter(
            (s) => !s.providerEnv || String(s.providerEnv) === invoiceEnv,
          )
        : activeSubs;
      if (envFiltered.length === 1) {
        const sub = envFiltered[0]!;
        // Caller persists backfill only when writes are allowed (not dry-run).
        if (stripeSubId && !sub.providerSubscriptionId) {
          return {
            ok: true,
            sub,
            backfillProviderSubscriptionId: stripeSubId,
          };
        }
        return { ok: true, sub };
      }
      if (envFiltered.length > 1) {
        return {
          ok: false,
          code: "ambiguous_customer",
          message: `Stripe customer ${stripeCustomerId} maps to multiple active subscriptions`,
        };
      }
    }
  }

  return {
    ok: false,
    code: "unresolved_subscription",
    message:
      "invoice.paid could not resolve a local subscription (missing provider_subscription_id / safe customer match)",
  };
}

/**
 * Apply a paid Stripe invoice locally (idempotent).
 */
export async function processStripePaidInvoice(params: {
  invoice: Record<string, unknown>;
  /** When true, only compute planned changes — not used here; see reconcile dry-run. */
  source?: "webhook" | "reconcile";
}): Promise<ProcessStripePaidInvoiceResult> {
  const invoice = params.invoice;
  const stripeInvoiceId = String(invoice.id || "").trim();
  if (!stripeInvoiceId.startsWith("in_")) {
    return {
      success: false,
      code: "invalid_invoice",
      message: "Stripe invoice id missing or invalid",
    };
  }

  const resolved = await resolveLocalSubscriptionForStripeInvoice({
    subscription: invoice.subscription,
    customer: invoice.customer,
    metadata: (invoice.metadata as Record<string, string> | null) ?? null,
    livemode: typeof invoice.livemode === "boolean" ? invoice.livemode : undefined,
  });

  if (!resolved.ok) {
    return {
      success: false,
      code: resolved.code,
      message: resolved.message,
    };
  }

  let sub = resolved.sub;
  const pEnvGuess = invoice.livemode ? "live" : "test";
  const providerEnv = (sub.providerEnv as string) || String(pEnvGuess);
  const periodStartSec = invoice.period_start as number | undefined;
  const periodEndSec = invoice.period_end as number | undefined;
  const periodStart =
    typeof periodStartSec === "number" ? new Date(periodStartSec * 1000) : null;
  const periodEnd =
    typeof periodEndSec === "number" ? new Date(periodEndSec * 1000) : null;

  const priceObj = (invoice.lines as { data?: Array<{ price?: { metadata?: { plan?: string } } }> } | undefined)
    ?.data?.[0]?.price;
  const metaPlan = String(
    priceObj?.metadata?.plan ||
      (invoice.metadata as Record<string, string> | undefined)?.plan ||
      "",
  ).toLowerCase();
  let nextPlan = sub.plan;
  if (metaPlan === "starter" || metaPlan === "pro" || metaPlan === "business") {
    nextPlan = metaPlan;
  }

  const stripeSubId =
    resolved.backfillProviderSubscriptionId ||
    stripeRefId(invoice.subscription as never) ||
    sub.providerSubscriptionId;

  await db
    .update(subscriptions as any)
    .set({
      status: "active",
      plan: nextPlan,
      currentPeriodStart: periodStart ?? sub.currentPeriodStart,
      currentPeriodEnd: periodEnd ?? sub.currentPeriodEnd,
      provider: "stripe",
      providerEnv,
      providerSubscriptionId: stripeSubId,
    } as any)
    .where(eq(subscriptions.id, sub.id));

  if (resolved.backfillProviderSubscriptionId) {
    sub = {
      ...sub,
      providerSubscriptionId: resolved.backfillProviderSubscriptionId,
      provider: "stripe",
    };
  }

  const cid = String(sub.customerId);
  const sid = String(sub.id);

  const customerLicenses = await db
    .select()
    .from(licenses)
    .where(eq(licenses.customerId as any, cid));

  const skippedManualLicenseIds = customerLicenses
    .filter((lic) => !isSubscriptionBackedPaidLicense(lic))
    .map((lic) => String(lic.id));

  const paidLicense = customerLicenses.find(
    (lic) =>
      isSubscriptionBackedPaidLicense(lic) &&
      String(lic.subscriptionId) === sid,
  );

  let extendedLicenseId: string | undefined;
  if (paidLicense && periodEnd) {
    const newUntil = maxLicenseValidUntil(paidLicense.validUntil as Date | null, periodEnd);
    await db
      .update(licenses as any)
      .set({
        validUntil: newUntil,
        updatedAt: new Date(),
        plan:
          nextPlan === "starter" ||
          nextPlan === "pro" ||
          nextPlan === "business"
            ? nextPlan
            : paidLicense.plan,
        maxDevices: maxDevicesForPlan(
          nextPlan === "starter" ||
            nextPlan === "pro" ||
            nextPlan === "business"
            ? String(nextPlan)
            : String(paidLicense.plan),
        ),
      } as any)
      .where(eq(licenses.id, paidLicense.id));
    extendedLicenseId = paidLicense.id;
  }

  const [existingPay] = await db
    .select({ id: payments.id })
    .from(payments)
    .where(
      and(
        eq(payments.provider as any, "stripe"),
        eq(payments.providerEnv as any, providerEnv),
        eq(payments.providerPaymentId as any, stripeInvoiceId),
      ),
    )
    .limit(1);

  const metaInvoiceId = (invoice.metadata as Record<string, string> | undefined)
    ?.invoiceId;
  const billingReason = String(invoice.billing_reason || "");
  const amountPaid = Number(invoice.amount_paid ?? 0);
  const skipPaymentInsert =
    Boolean(existingPay) ||
    (billingReason === "subscription_create" &&
      (Boolean(metaInvoiceId) ||
        (await hasRecentStripeCheckoutPaymentForSubscription(sid, amountPaid))));

  let createdPaymentId: string | undefined = existingPay?.id;
  if (!skipPaymentInsert) {
    try {
      const [payment] = await db
        .insert(payments)
        .values({
          orgId: sub.orgId,
          customerId: sub.customerId,
          subscriptionId: sub.id,
          provider: "stripe",
          providerEnv,
          providerPaymentId: stripeInvoiceId,
          providerStatus: String(invoice.status || "paid"),
          amountCents: amountPaid,
          currency: String(invoice.currency || "eur").toUpperCase(),
          status: "succeeded",
          amountGrossCents: amountPaid,
        } as any)
        .returning();
      createdPaymentId = payment?.id;
    } catch (err: any) {
      if (err?.code === "23505") {
        const [again] = await db
          .select({ id: payments.id })
          .from(payments)
          .where(
            and(
              eq(payments.provider as any, "stripe"),
              eq(payments.providerEnv as any, providerEnv),
              eq(payments.providerPaymentId as any, stripeInvoiceId),
            ),
          )
          .limit(1);
        createdPaymentId = again?.id;
      } else {
        throw err;
      }
    }
  }

  let invForLicense: string | undefined;
  let updatedInvoiceId: string | undefined;

  if (metaInvoiceId) {
    const [metaInv] = await db
      .select()
      .from(invoices)
      .where(eq(invoices.id, metaInvoiceId))
      .limit(1);
    if (metaInv) {
      const billingPeriod =
        (sub.billingPeriod as "monthly" | "yearly" | null) ??
        parseBillingPeriodFromPlanId(
          (invoice.metadata as Record<string, string> | undefined)?.planId,
        );
      await syncPaidInvoiceFromStripeInvoice({
        invoiceId: metaInv.id,
        subscriptionId: sub.id,
        stripeInvoice: invoice,
        billingPeriod,
        markPaid: metaInv.status !== "paid",
      });
      const hostedUrl =
        typeof invoice.hosted_invoice_url === "string"
          ? invoice.hosted_invoice_url
          : typeof invoice.invoice_pdf === "string"
            ? invoice.invoice_pdf
            : null;
      await db
        .update(invoices as any)
        .set({
          providerInvoiceId: stripeInvoiceId,
          provider: "stripe",
          providerEnv: (metaInv.providerEnv as string) || providerEnv,
          ...(hostedUrl ? { pdfUrl: hostedUrl } : {}),
        } as any)
        .where(eq(invoices.id, metaInv.id));
      invForLicense = metaInv.id;
      updatedInvoiceId = metaInv.id;
    }
  }

  if (!invForLicense) {
    const [byProv] = await db
      .select()
      .from(invoices)
      .where(
        and(
          eq(invoices.provider as any, "stripe"),
          eq(invoices.providerEnv as any, providerEnv),
          eq(invoices.providerInvoiceId as any, stripeInvoiceId),
        ),
      )
      .limit(1);

    if (byProv) {
      if (byProv.status !== "paid") {
        await db
          .update(invoices as any)
          .set({
            status: "paid",
            paidAt: new Date(),
            dueAt: null,
          } as any)
          .where(eq(invoices.id, byProv.id));
      }
      invForLicense = byProv.id;
      updatedInvoiceId = byProv.id;
    } else {
      const planName = (nextPlan === "starter" ? "Starter" : "Pro") as string;
      const invNumber = generateWebhookInvoiceNumber();
      const currency = String(invoice.currency || "eur").toUpperCase();
      const billingPeriod =
        (sub.billingPeriod as "monthly" | "yearly" | null) ??
        parseBillingPeriodFromPlanId(
          (invoice.metadata as Record<string, string> | undefined)?.planId,
        );
      const amounts = amountsFromStripeInvoice(invoice);
      const hostedUrl =
        typeof invoice.hosted_invoice_url === "string"
          ? invoice.hosted_invoice_url
          : typeof invoice.invoice_pdf === "string"
            ? invoice.invoice_pdf
            : null;
      const paidAtSec = invoice.status_transitions
        ? (invoice.status_transitions as { paid_at?: number }).paid_at
        : undefined;
      const paidAt =
        typeof paidAtSec === "number"
          ? new Date(paidAtSec * 1000)
          : new Date();

      try {
        const [newInv] = await db
          .insert(invoices)
          .values({
            orgId: sub.orgId,
            customerId: sub.customerId,
            subscriptionId: sub.id,
            number: invNumber,
            currency,
            status: "paid",
            paidAt,
            issuedAt: paidAt,
            dueAt: null,
            provider: "stripe",
            providerEnv,
            providerInvoiceId: stripeInvoiceId,
            planName,
            billingPeriod,
            paymentMethod: "card",
            pdfUrl: hostedUrl,
            ...invoiceAmountFieldsFromBreakdown(amounts),
          } as any)
          .returning();
        invForLicense = newInv?.id;
        updatedInvoiceId = newInv?.id;
      } catch (err: any) {
        if (err?.code !== "23505") throw err;
        const [again] = await db
          .select()
          .from(invoices)
          .where(
            and(
              eq(invoices.provider as any, "stripe"),
              eq(invoices.providerEnv as any, providerEnv),
              eq(invoices.providerInvoiceId as any, stripeInvoiceId),
            ),
          )
          .limit(1);
        if (again) {
          invForLicense = again.id;
          updatedInvoiceId = again.id;
        }
      }
    }
  }

  let createdLicenseId: string | undefined;
  if (invForLicense && (nextPlan === "starter" || nextPlan === "pro" || nextPlan === "business" || sub.plan === "starter" || sub.plan === "pro" || sub.plan === "business")) {
    createdLicenseId = await ensurePaidLicenseAfterSuccessfulPayment({
      orgId: String(sub.orgId),
      customerId: cid,
      subscriptionId: sid,
      invoiceId: invForLicense,
      source: "stripe_webhook",
      periodEnd: periodEnd ?? undefined,
    });
  }

  return {
    success: true,
    code: existingPay && updatedInvoiceId ? "already_processed" : "ok",
    message: `invoice.paid processed for subscription ${sub.id}`,
    updatedSubscriptionId: sub.id,
    updatedInvoiceId,
    createdPaymentId,
    createdLicenseId,
    extendedLicenseId,
    skippedManualLicenseIds,
  };
}
