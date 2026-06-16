import { eq } from "drizzle-orm";
import { db } from "../db/client.js";
import { invoices } from "../db/schema/invoices.js";
import { subscriptions } from "../db/schema/subscriptions.js";
import {
  parseBillingPeriodFromPlanId,
  type BillingPeriod,
} from "./billingPeriod.js";
import {
  amountsFromStripeCheckoutSession,
  amountsFromStripeInvoice,
  invoiceAmountFieldsFromBreakdown,
} from "./stripeCheckoutAmounts.js";

/**
 * After Stripe Checkout or invoice.paid, align internal invoice/subscription
 * amounts with Stripe (source of truth) and persist billing period.
 */
export async function syncPaidInvoiceFromStripeCheckoutSession(params: {
  invoiceId: string;
  subscriptionId?: string | null;
  session: Record<string, unknown>;
  providerRef?: string;
  markPaid?: boolean;
}): Promise<void> {
  const amounts = amountsFromStripeCheckoutSession(params.session);
  if (amounts.grossCents <= 0) return;

  const metadata = params.session.metadata as Record<string, string> | undefined;
  const billingPeriod = parseBillingPeriodFromPlanId(metadata?.planId);

  const invoiceUpdate: Record<string, unknown> = {
    ...invoiceAmountFieldsFromBreakdown(amounts),
    billingPeriod,
  };
  if (params.providerRef) invoiceUpdate.providerRef = params.providerRef;
  if (params.markPaid) {
    invoiceUpdate.status = "paid";
    invoiceUpdate.paidAt = new Date();
    invoiceUpdate.dueAt = null;
  }

  await db
    .update(invoices as any)
    .set(invoiceUpdate as any)
    .where(eq(invoices.id, params.invoiceId));

  const sid = params.subscriptionId?.trim();
  if (sid) {
    await db
      .update(subscriptions as any)
      .set({
        priceCents: amounts.grossCents,
        billingPeriod,
      } as any)
      .where(eq(subscriptions.id, sid as any));
  }
}

export async function syncPaidInvoiceFromStripeInvoice(params: {
  invoiceId: string;
  subscriptionId?: string | null;
  stripeInvoice: Record<string, unknown>;
  billingPeriod?: BillingPeriod | null;
  markPaid?: boolean;
}): Promise<void> {
  const amounts = amountsFromStripeInvoice(params.stripeInvoice);
  if (amounts.grossCents <= 0) return;

  const invoiceUpdate: Record<string, unknown> = {
    ...invoiceAmountFieldsFromBreakdown(amounts),
  };
  if (params.billingPeriod) invoiceUpdate.billingPeriod = params.billingPeriod;
  if (params.markPaid) {
    invoiceUpdate.status = "paid";
    invoiceUpdate.paidAt = new Date();
    invoiceUpdate.dueAt = null;
  }

  await db
    .update(invoices as any)
    .set(invoiceUpdate as any)
    .where(eq(invoices.id, params.invoiceId));

  const sid = params.subscriptionId?.trim();
  if (sid) {
    const subUpdate: Record<string, unknown> = {
      priceCents: amounts.grossCents,
    };
    if (params.billingPeriod) subUpdate.billingPeriod = params.billingPeriod;
    await db
      .update(subscriptions as any)
      .set(subUpdate as any)
      .where(eq(subscriptions.id, sid as any));
  }
}
