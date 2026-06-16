import type { Currency } from "../config/pricing.js";
import {
  getPlanPrice,
  grossPlanAmountCents,
  PORTAL_CHECKOUT_VAT_RATE,
} from "../config/pricing.js";
import type { BillingPeriod } from "./billingPeriod.js";

export interface NetTaxGrossCents {
  netCents: number;
  taxCents: number;
  grossCents: number;
  vatRate: number;
}

export function catalogNetTaxGrossCents(
  plan: "starter" | "pro",
  currency: Currency,
  period: BillingPeriod,
): NetTaxGrossCents {
  const netCents = Math.round(getPlanPrice(plan, currency, period) * 100);
  const grossCents = grossPlanAmountCents(plan, currency, period);
  return {
    netCents,
    taxCents: grossCents - netCents,
    grossCents,
    vatRate: PORTAL_CHECKOUT_VAT_RATE,
  };
}

/** Stripe charged catalog net with no tax line (pre–tax-rate checkout). */
export function isNetOnlyStripeAmountCents(
  amountCents: number,
  plan: "starter" | "pro",
  currency: Currency,
  period: BillingPeriod,
): boolean {
  const netCents = Math.round(getPlanPrice(plan, currency, period) * 100);
  return Math.abs(amountCents - netCents) <= 2;
}

export function correctNetOnlyToGrossCents(
  amountCents: number,
  plan: "starter" | "pro",
  currency: Currency,
  period: BillingPeriod,
): NetTaxGrossCents | null {
  if (!isNetOnlyStripeAmountCents(amountCents, plan, currency, period)) {
    return null;
  }
  return catalogNetTaxGrossCents(plan, currency, period);
}
