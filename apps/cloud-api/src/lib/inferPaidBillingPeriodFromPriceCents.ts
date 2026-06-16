import type { Currency } from "../config/pricing.js";
import { grossPlanAmountCents } from "../config/pricing.js";

/**
 * Maps stored subscription.priceCents (gross incl. VAT) back to monthly vs yearly,
 * using the same grossPlanAmountCents rules as checkout.
 */
export function inferPaidBillingPeriodFromPriceCents(
  plan: "starter" | "pro",
  currency: Currency,
  priceCents: number,
): "monthly" | "yearly" | null {
  const monthlyGross = grossPlanAmountCents(plan, currency, "monthly");
  const yearlyGross = grossPlanAmountCents(plan, currency, "yearly");
  if (Math.abs(priceCents - monthlyGross) <= 2) return "monthly";
  if (Math.abs(priceCents - yearlyGross) <= 2) return "yearly";
  return null;
}
