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

/** Pre–2026-06 bug: VAT was added on top of catalog price (catalog × 1.19). */
export function legacyAddedVatGrossCents(
  plan: "starter" | "pro",
  currency: Currency,
  period: BillingPeriod,
): number {
  const inclusiveGross = grossPlanAmountCents(plan, currency, period);
  return Math.round(inclusiveGross * (1 + PORTAL_CHECKOUT_VAT_RATE));
}

/**
 * Detect invoices where catalog gross was stored as "net" and 19% VAT added on top.
 * Example: net 1499, tax 285, gross 1784 (should be gross 1499, net 1260, tax 239).
 */
export function isLegacyAdditiveVatBreakdown(
  grossCents: number,
  netCents: number,
  taxCents: number,
  plan: "starter" | "pro",
  currency: Currency,
  period: BillingPeriod,
): boolean {
  const catalog = catalogNetTaxGrossCents(plan, currency, period);
  const wrongGross = legacyAddedVatGrossCents(plan, currency, period);

  if (Math.abs(grossCents - wrongGross) <= 2) {
    return true;
  }

  const additiveTax = Math.round(catalog.grossCents * PORTAL_CHECKOUT_VAT_RATE);
  if (
    Math.abs(netCents - catalog.grossCents) <= 2 &&
    Math.abs(taxCents - additiveTax) <= 2 &&
    Math.abs(grossCents - catalog.grossCents - additiveTax) <= 2
  ) {
    return true;
  }

  return false;
}

export function isLegacyMisclassifiedAmountCents(
  amountCents: number,
  plan: "starter" | "pro",
  currency: Currency,
  period: BillingPeriod,
): boolean {
  return (
    Math.abs(amountCents - legacyAddedVatGrossCents(plan, currency, period)) <= 2 ||
    Math.abs(amountCents - catalogNetTaxGrossCents(plan, currency, period).grossCents) <= 2
  );
}

export function correctLegacyInvoiceAmounts(
  grossCents: number,
  netCents: number,
  taxCents: number,
  plan: "starter" | "pro",
  currency: Currency,
  period: BillingPeriod,
): NetTaxGrossCents | null {
  if (
    !isLegacyAdditiveVatBreakdown(grossCents, netCents, taxCents, plan, currency, period) &&
    !isLegacyMisclassifiedAmountCents(grossCents, plan, currency, period)
  ) {
    return null;
  }
  return catalogNetTaxGrossCents(plan, currency, period);
}

/** @deprecated */
export function isNetOnlyStripeAmountCents(
  amountCents: number,
  plan: "starter" | "pro",
  currency: Currency,
  period: BillingPeriod,
): boolean {
  return isLegacyMisclassifiedAmountCents(amountCents, plan, currency, period);
}

/** @deprecated */
export function correctNetOnlyToGrossCents(
  amountCents: number,
  plan: "starter" | "pro",
  currency: Currency,
  period: BillingPeriod,
): NetTaxGrossCents | null {
  return correctLegacyInvoiceAmounts(amountCents, amountCents, 0, plan, currency, period);
}
