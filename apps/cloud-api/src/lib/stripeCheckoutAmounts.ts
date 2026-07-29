import type { Currency } from "../config/pricing.js";
import { PORTAL_CHECKOUT_VAT_RATE } from "../config/pricing.js";
import { parseBillingPeriodFromPlanId } from "./billingPeriod.js";
import {
  catalogNetTaxGrossCents,
  correctLegacyInvoiceAmounts,
} from "./vatAmountBreakdown.js";

export interface StripeAmountBreakdown {
  grossCents: number;
  netCents: number;
  taxCents: number;
}

function parsePlanFromPlanId(
  planId: string | undefined,
): { plan: "starter" | "pro" | "business"; period: "monthly" | "yearly" } | null {
  if (!planId) return null;
  const raw = planId.toLowerCase();
  const plan = raw.startsWith("business")
    ? "business"
    : raw.startsWith("pro")
      ? "pro"
      : raw.startsWith("starter")
        ? "starter"
        : null;
  if (!plan) return null;
  return { plan, period: parseBillingPeriodFromPlanId(planId) };
}

function normalizeInclusiveAmounts(
  amounts: StripeAmountBreakdown,
  planId: string | undefined,
  currency: Currency,
): StripeAmountBreakdown {
  const grossCents = amounts.grossCents;
  if (grossCents <= 0) return amounts;

  const parsed = parsePlanFromPlanId(planId);
  if (parsed && currency === "EUR") {
    const catalog = catalogNetTaxGrossCents(parsed.plan, currency, parsed.period);
    if (Math.abs(grossCents - catalog.grossCents) <= 2) {
      return {
        grossCents: catalog.grossCents,
        netCents: catalog.netCents,
        taxCents: catalog.taxCents,
      };
    }
    if (parsed.plan === "starter" || parsed.plan === "pro") {
      const legacy = correctLegacyInvoiceAmounts(
        grossCents,
        amounts.netCents,
        amounts.taxCents,
        parsed.plan,
        currency,
        parsed.period,
      );
      if (legacy) {
        return {
          grossCents: legacy.grossCents,
          netCents: legacy.netCents,
          taxCents: legacy.taxCents,
        };
      }
    }
  }

  if (amounts.taxCents > 0 && amounts.netCents > 0) {
    const parsed = parsePlanFromPlanId(planId);
    if (
      parsed &&
      (parsed.plan === "starter" || parsed.plan === "pro") &&
      currency === "EUR"
    ) {
      const legacy = correctLegacyInvoiceAmounts(
        grossCents,
        amounts.netCents,
        amounts.taxCents,
        parsed.plan,
        currency,
        parsed.period,
      );
      if (legacy) {
        return {
          grossCents: legacy.grossCents,
          netCents: legacy.netCents,
          taxCents: legacy.taxCents,
        };
      }
    }
  }

  const netCents = Math.round(grossCents / (1 + PORTAL_CHECKOUT_VAT_RATE));
  return {
    grossCents,
    netCents,
    taxCents: grossCents - netCents,
  };
}

export function amountsFromStripeCheckoutSession(
  session: Record<string, unknown>,
  planId?: string,
): StripeAmountBreakdown {
  const grossCents = Number(session.amount_total ?? 0);
  const totalDetails = session.total_details as
    | { amount_tax?: number }
    | undefined;
  const taxFromStripe = Number(totalDetails?.amount_tax ?? 0);
  const subtotal = Number(session.amount_subtotal ?? 0);
  const currency = String(session.currency ?? "eur").toUpperCase() as Currency;
  const cur: Currency = currency === "TND" ? "TND" : "EUR";

  const metadata = session.metadata as Record<string, string> | undefined;
  const effectivePlanId = planId ?? metadata?.planId;

  let netCents = subtotal > 0 ? subtotal : Math.max(0, grossCents - taxFromStripe);
  let taxCents = taxFromStripe;

  if (taxFromStripe > 0 && subtotal > 0 && subtotal + taxFromStripe <= grossCents + 2) {
    netCents = subtotal;
    taxCents = taxFromStripe;
  } else if (taxFromStripe <= 0 && grossCents > 0) {
    netCents = Math.round(grossCents / (1 + PORTAL_CHECKOUT_VAT_RATE));
    taxCents = grossCents - netCents;
  }

  return normalizeInclusiveAmounts(
    { grossCents, netCents, taxCents },
    effectivePlanId,
    cur,
  );
}

export function amountsFromStripeInvoice(
  invoice: Record<string, unknown>,
  planId?: string,
): StripeAmountBreakdown {
  const grossCents = Number(invoice.amount_paid ?? invoice.total ?? 0);
  const taxAmounts = invoice.total_tax_amounts as
    | Array<{ amount?: number }>
    | undefined;
  const taxFromLines = taxAmounts?.[0]?.amount;
  const taxFromStripe = Number(invoice.tax ?? taxFromLines ?? 0);
  const subtotal = Number(invoice.subtotal ?? 0);
  const currency = String(invoice.currency ?? "eur").toUpperCase() as Currency;
  const cur: Currency = currency === "TND" ? "TND" : "EUR";

  const metadata = invoice.metadata as Record<string, string> | undefined;
  const effectivePlanId = planId ?? metadata?.planId;

  let netCents = subtotal > 0 ? subtotal : Math.max(0, grossCents - taxFromStripe);
  let taxCents = taxFromStripe;

  if (taxFromStripe <= 0 && grossCents > 0) {
    netCents = Math.round(grossCents / (1 + PORTAL_CHECKOUT_VAT_RATE));
    taxCents = grossCents - netCents;
  }

  return normalizeInclusiveAmounts(
    { grossCents, netCents, taxCents },
    effectivePlanId,
    cur,
  );
}

export function invoiceAmountFieldsFromBreakdown(amounts: StripeAmountBreakdown) {
  return {
    amountCents: amounts.grossCents,
    amountGrossCents: amounts.grossCents,
    amountNetCents: amounts.netCents,
    amountTaxCents: amounts.taxCents,
  };
}
