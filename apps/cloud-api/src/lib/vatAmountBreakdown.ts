import type { Currency } from "../config/pricing.js";
import {
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

/** Catalog prices are VAT-inclusive; extract net and tax from gross. */
export function catalogNetTaxGrossCents(
  plan: "starter" | "pro",
  currency: Currency,
  period: BillingPeriod,
): NetTaxGrossCents {
  const grossCents = grossPlanAmountCents(plan, currency, period);
  const netCents = Math.round(grossCents / (1 + PORTAL_CHECKOUT_VAT_RATE));
  const taxCents = grossCents - netCents;
  return {
    netCents,
    taxCents,
    grossCents,
    vatRate: PORTAL_CHECKOUT_VAT_RATE,
  };
}

/** Pre–2026-06 bug: VAT was added on top of catalog price (gross × 1.19). */
export function legacyAddedVatGrossCents(
  plan: "starter" | "pro",
  currency: Currency,
  period: BillingPeriod,
): number {
  const inclusiveGross = grossPlanAmountCents(plan, currency, period);
  return Math.round(inclusiveGross * (1 + PORTAL_CHECKOUT_VAT_RATE));
}

/** Detect legacy invoice rows that stored catalog price before tax was extracted. */
export function isLegacyMisclassifiedAmountCents(
  amountCents: number,
  plan: "starter" | "pro",
  currency: Currency,
  period: BillingPeriod,
): boolean {
  const catalog = catalogNetTaxGrossCents(plan, currency, period);
  const oldWrongGross = legacyAddedVatGrossCents(plan, currency, period);
  return (
    Math.abs(amountCents - oldWrongGross) <= 2 ||
    Math.abs(amountCents - catalog.grossCents) <= 2
  );
}

export function correctLegacyInvoiceAmounts(
  amountCents: number,
  plan: "starter" | "pro",
  currency: Currency,
  period: BillingPeriod,
): NetTaxGrossCents | null {
  if (!isLegacyMisclassifiedAmountCents(amountCents, plan, currency, period)) {
    return null;
  }
  return catalogNetTaxGrossCents(plan, currency, period);
}

/** @deprecated Use correctLegacyInvoiceAmounts — kept for stripeCheckoutAmounts import. */
export function isNetOnlyStripeAmountCents(
  amountCents: number,
  plan: "starter" | "pro",
  currency: Currency,
  period: BillingPeriod,
): boolean {
  return isLegacyMisclassifiedAmountCents(amountCents, plan, currency, period);
}

/** @deprecated Use correctLegacyInvoiceAmounts */
export function correctNetOnlyToGrossCents(
  amountCents: number,
  plan: "starter" | "pro",
  currency: Currency,
  period: BillingPeriod,
): NetTaxGrossCents | null {
  return correctLegacyInvoiceAmounts(amountCents, plan, currency, period);
}
