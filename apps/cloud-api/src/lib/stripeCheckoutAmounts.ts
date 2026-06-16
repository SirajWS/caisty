import type { Currency } from "../config/pricing.js";
import { parseBillingPeriodFromPlanId } from "./billingPeriod.js";
import { correctNetOnlyToGrossCents } from "./vatAmountBreakdown.js";

export interface StripeAmountBreakdown {
  grossCents: number;
  netCents: number;
  taxCents: number;
}

function parsePlanFromPlanId(
  planId: string | undefined,
): { plan: "starter" | "pro"; period: "monthly" | "yearly" } | null {
  if (!planId) return null;
  const raw = planId.toLowerCase();
  const plan = raw.startsWith("pro") ? "pro" : raw.startsWith("starter") ? "starter" : null;
  if (!plan) return null;
  return { plan, period: parseBillingPeriodFromPlanId(planId) };
}

function applyNetOnlyCorrection(
  amounts: StripeAmountBreakdown,
  planId: string | undefined,
  currency: Currency = "EUR",
): StripeAmountBreakdown {
  if (amounts.taxCents > 0) return amounts;
  const parsed = parsePlanFromPlanId(planId);
  if (!parsed || currency !== "EUR") return amounts;
  const corrected = correctNetOnlyToGrossCents(
    amounts.grossCents,
    parsed.plan,
    currency,
    parsed.period,
  );
  if (!corrected) return amounts;
  return {
    grossCents: corrected.grossCents,
    netCents: corrected.netCents,
    taxCents: corrected.taxCents,
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
  const taxCents = Number(totalDetails?.amount_tax ?? 0);
  const subtotal = Number(session.amount_subtotal ?? 0);
  const netCents = subtotal > 0 ? subtotal : Math.max(0, grossCents - taxCents);
  const currency = String(session.currency ?? "eur").toUpperCase() as Currency;

  const metadata = session.metadata as Record<string, string> | undefined;
  const effectivePlanId = planId ?? metadata?.planId;

  return applyNetOnlyCorrection(
    { grossCents, netCents, taxCents },
    effectivePlanId,
    currency === "TND" ? "TND" : "EUR",
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
  const taxCents = Number(invoice.tax ?? taxFromLines ?? 0);
  const subtotal = Number(invoice.subtotal ?? 0);
  const netCents = subtotal > 0 ? subtotal : Math.max(0, grossCents - taxCents);
  const currency = String(invoice.currency ?? "eur").toUpperCase() as Currency;

  const metadata = invoice.metadata as Record<string, string> | undefined;
  const effectivePlanId = planId ?? metadata?.planId;

  return applyNetOnlyCorrection(
    { grossCents, netCents, taxCents },
    effectivePlanId,
    currency === "TND" ? "TND" : "EUR",
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
