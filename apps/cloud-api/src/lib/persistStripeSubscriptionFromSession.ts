import { eq } from "drizzle-orm";
import { db } from "../db/client.js";
import { customers } from "../db/schema/customers.js";
import { subscriptions } from "../db/schema/subscriptions.js";

export type StripeProviderEnv = "test" | "live";

/**
 * Stripe Checkout Session returns `customer` and `subscription` as either
 * an id string or an expanded object with `id`.
 */
export function stripeCheckoutRefId(
  ref: string | { id?: string } | null | undefined,
): string | undefined {
  if (ref == null) return undefined;
  if (typeof ref === "string" && ref.length > 0) return ref;
  if (typeof ref === "object" && typeof ref.id === "string" && ref.id.length > 0) {
    return ref.id;
  }
  return undefined;
}

/**
 * After a successful Stripe Checkout (subscription mode), persist Stripe IDs
 * on `customers` and `subscriptions` so webhooks and Billing Portal can resolve rows.
 * Safe to call multiple times (idempotent updates).
 */
export async function persistStripeSubscriptionAfterCheckoutSession(params: {
  portalCustomerId: string | null | undefined;
  internalSubscriptionId: string | null | undefined;
  session: { customer?: unknown; subscription?: unknown };
  providerEnv: StripeProviderEnv;
}): Promise<void> {
  const stripeCustomerId = stripeCheckoutRefId(params.session.customer as never);
  const stripeSubscriptionId = stripeCheckoutRefId(params.session.subscription as never);

  const cid = params.portalCustomerId ? String(params.portalCustomerId).trim() : "";
  const sid = params.internalSubscriptionId ? String(params.internalSubscriptionId).trim() : "";

  if (stripeCustomerId && cid) {
    await db
      .update(customers as any)
      .set({ stripeCustomerId } as any)
      .where(eq(customers.id as any, cid as any));
  }

  if (stripeSubscriptionId && sid) {
    await db
      .update(subscriptions as any)
      .set({
        provider: "stripe",
        providerEnv: params.providerEnv,
        providerSubscriptionId: stripeSubscriptionId,
      } as any)
      .where(eq(subscriptions.id as any, sid as any));
  }
}

export function invoiceProviderEnvToStripeEnv(
  providerEnv: string | null | undefined,
): StripeProviderEnv {
  return providerEnv === "live" ? "live" : "test";
}
