import type { Currency } from "../config/pricing.js";
import {
  grossPlanAmountCents,
  PORTAL_CHECKOUT_VAT_RATE,
} from "../config/pricing.js";
import type { BillingPeriod } from "./billingPeriod.js";

/** Pre–2026-06 EUR list prices stored/treated as net before VAT was added on top. */
export const OLD_CATALOG_NET_CENTS: Record<
  "starter" | "pro",
  Record<BillingPeriod, number>
> = {
  starter: { monthly: 999, yearly: 9900 },
  pro: { monthly: 1999, yearly: 19900 },
};

/** Wrong gross when old net catalog price had 19% VAT added on top (e.g. 9.99 → 11.89). */
export function oldCatalogAddedVatGrossCents(
  plan: "starter" | "pro",
  currency: Currency,
  period: BillingPeriod,
): number {
  if (currency !== "EUR") {
    return OLD_CATALOG_NET_CENTS[plan][period];
  }
  const oldNet = OLD_CATALOG_NET_CENTS[plan][period];
  return Math.round(oldNet * (1 + PORTAL_CHECKOUT_VAT_RATE));
}

export interface NetTaxGrossCents {
  netCents: number;
  taxCents: number;
  grossCents: number;
  vatRate: number;
}

/** Catalog prices are VAT-inclusive; extract net and tax from gross. */
export function catalogNetTaxGrossCents(
  plan: "starter" | "pro" | "business",
  currency: Currency,
  period: BillingPeriod,
): NetTaxGrossCents {
  const grossCents = grossPlanAmountCents(plan, currency, period);
  if (grossCents == null) {
    throw new Error(`Missing catalog price for ${plan}/${period}/${currency}`);
  }
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
  if (inclusiveGross == null) {
    throw new Error(`Missing catalog price for ${plan}/${period}/${currency}`);
  }
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

  const oldNet = OLD_CATALOG_NET_CENTS[plan][period];
  const oldTax = Math.round(oldNet * PORTAL_CHECKOUT_VAT_RATE);
  const oldGross = oldNet + oldTax;
  if (
    Math.abs(netCents - oldNet) <= 2 &&
    Math.abs(taxCents - oldTax) <= 2 &&
    Math.abs(grossCents - oldGross) <= 2
  ) {
    return true;
  }
  if (Math.abs(grossCents - oldCatalogAddedVatGrossCents(plan, currency, period)) <= 2) {
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
