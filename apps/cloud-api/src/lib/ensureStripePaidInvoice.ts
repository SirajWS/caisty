import { eq } from "drizzle-orm";
import { db } from "../db/client.js";
import { invoices } from "../db/schema/invoices.js";
import { subscriptions } from "../db/schema/subscriptions.js";
import { parseCheckoutPlanId } from "./billingPeriod.js";
import {
  amountsFromStripeCheckoutSession,
  invoiceAmountFieldsFromBreakdown,
} from "./stripeCheckoutAmounts.js";
import { syncPaidInvoiceFromStripeCheckoutSession } from "./syncPaidInvoiceFromStripe.js";

function generateInvoiceNumber(): string {
  const year = new Date().getFullYear();
  const rand = Math.floor(Math.random() * 1_000_000)
    .toString()
    .padStart(6, "0");
  return `INV-${year}-${rand}`;
}

/**
 * Idempotent: find or create a paid invoice after Stripe Checkout succeeds.
 * Stripe checkout no longer pre-creates open invoices — subscriptionId lives in session metadata.
 */
export async function ensureStripePaidInvoiceFromCheckoutSession(params: {
  session: Record<string, unknown>;
  providerEnv: "test" | "live";
}): Promise<{ invoiceId: string; created: boolean; subscriptionId: string | null }> {
  const session = params.session;
  const sessionId = String(session.id ?? "");
  const metadata = (session.metadata ?? {}) as Record<string, string>;

  if (sessionId) {
    const [byRef] = await db
      .select()
      .from(invoices)
      .where(eq(invoices.providerRef as any, sessionId))
      .limit(1);
    if (byRef?.id) {
      await syncPaidInvoiceFromStripeCheckoutSession({
        invoiceId: String(byRef.id),
        subscriptionId: byRef.subscriptionId,
        session,
        providerRef: sessionId,
        markPaid: byRef.status !== "paid",
      });
      return {
        invoiceId: String(byRef.id),
        created: false,
        subscriptionId: byRef.subscriptionId ? String(byRef.subscriptionId) : null,
      };
    }
  }

  const legacyInvoiceId = metadata.invoiceId?.trim();
  if (legacyInvoiceId) {
    const [legacyInv] = await db
      .select()
      .from(invoices)
      .where(eq(invoices.id, legacyInvoiceId))
      .limit(1);
    if (legacyInv?.id) {
      await syncPaidInvoiceFromStripeCheckoutSession({
        invoiceId: String(legacyInv.id),
        subscriptionId: legacyInv.subscriptionId,
        session,
        providerRef: sessionId || undefined,
        markPaid: legacyInv.status !== "paid",
      });
      return {
        invoiceId: String(legacyInv.id),
        created: false,
        subscriptionId: legacyInv.subscriptionId
          ? String(legacyInv.subscriptionId)
          : null,
      };
    }
  }

  const subscriptionId = metadata.subscriptionId?.trim();
  if (!subscriptionId) {
    throw new Error(
      "Stripe session metadata missing subscriptionId (and no legacy invoiceId)",
    );
  }

  const [sub] = await db
    .select()
    .from(subscriptions)
    .where(eq(subscriptions.id, subscriptionId as any))
    .limit(1);

  if (!sub?.id) {
    throw new Error(`Subscription ${subscriptionId} not found for Stripe checkout`);
  }

  const planId =
    metadata.planId?.trim() ||
    `${String(sub.plan ?? "starter")}_${String(sub.billingPeriod ?? "monthly")}`;
  const { plan, period } = parseCheckoutPlanId(planId);
  const amounts = amountsFromStripeCheckoutSession(session, planId);
  const planName = plan === "starter" ? "Starter" : "Pro";
  const now = new Date();

  const [created] = await db
    .insert(invoices)
    .values({
      orgId: sub.orgId,
      customerId: sub.customerId,
      subscriptionId: sub.id,
      number: generateInvoiceNumber(),
      ...invoiceAmountFieldsFromBreakdown(amounts),
      currency: String(sub.currency ?? "EUR"),
      status: "paid",
      issuedAt: now,
      paidAt: now,
      dueAt: null,
      provider: "stripe",
      providerEnv: params.providerEnv,
      providerRef: sessionId || null,
      planName,
      billingPeriod: period,
      paymentMethod: "card",
    } as any)
    .returning();

  if (!created?.id) {
    throw new Error("Failed to create paid invoice from Stripe session");
  }

  return {
    invoiceId: String(created.id),
    created: true,
    subscriptionId: String(sub.id),
  };
}
