import type { Currency } from "../config/pricing.js";
import {
  getPlanPrice,
  grossPlanAmountCents,
  PORTAL_CHECKOUT_VAT_RATE,
} from "../config/pricing.js";
import type { BillingPeriod } from "./billingPeriod.js";
import {
  catalogNetTaxGrossCents,
  isNetOnlyStripeAmountCents,
} from "./vatAmountBreakdown.js";

const OPEN_INVOICE_STATUSES = new Set(["open", "draft", "pending"]);

/** Legacy gross cents (102 € / 204 € net + 19 % VAT) from pre-2026-06 pricing. */
export const LEGACY_GROSS_CENTS: Partial<
  Record<"starter" | "pro", Partial<Record<BillingPeriod, number>>>
> = {
  starter: { yearly: 12138 },
  pro: { yearly: 24276 },
};

function inferStarterPro(
  planName: string | null | undefined,
  subscriptionPlan: string | null | undefined,
): "starter" | "pro" | null {
  const sp = (subscriptionPlan || "").toLowerCase().trim();
  if (sp === "starter" || sp === "pro") return sp;

  const raw = (planName || "").trim().toLowerCase();
  if (!raw) return null;
  if (raw.includes("starter")) return "starter";
  if (raw === "pro" || /\bpro\b/i.test(raw)) return "pro";
  return null;
}

function inferBillingPeriodFromStoredGross(
  plan: "starter" | "pro",
  currency: Currency,
  grossCents: number,
): BillingPeriod | null {
  for (const period of ["monthly", "yearly"] as const) {
    const catalogGross = grossPlanAmountCents(plan, currency, period);
    if (Math.abs(grossCents - catalogGross) <= 2) return period;

    const catalogNet = Math.round(getPlanPrice(plan, currency, period) * 100);
    if (Math.abs(grossCents - catalogNet) <= 2) return period;

    const legacy = LEGACY_GROSS_CENTS[plan]?.[period];
    if (legacy != null && Math.abs(grossCents - legacy) <= 2) return period;
  }
  return null;
}

function resolveBillingPeriod(
  billingPeriod: BillingPeriod | null | undefined,
  subscriptionBillingPeriod: BillingPeriod | null | undefined,
  plan: "starter" | "pro" | null,
  currency: Currency,
  grossCents: number,
): BillingPeriod | null {
  if (billingPeriod === "monthly" || billingPeriod === "yearly") {
    return billingPeriod;
  }
  if (subscriptionBillingPeriod === "monthly" || subscriptionBillingPeriod === "yearly") {
    return subscriptionBillingPeriod;
  }
  if (!plan || grossCents <= 0) return null;
  return inferBillingPeriodFromStoredGross(plan, currency, grossCents);
}

export interface PortalInvoiceAmountBreakdown {
  grossCents: number;
  netCents: number;
  taxCents: number;
  vatRate: number;
  billingPeriod: BillingPeriod | null;
}

/**
 * Open/pending invoices: catalog net + 19 % VAT from plan + billingPeriod.
 * Paid invoices: stored Stripe amounts (with net-only / legacy corrections).
 */
export function portalInvoiceDisplayBreakdown(
  inv: {
    status?: string | null;
    amountCents?: number | null;
    amountGrossCents?: number | null;
    amountNetCents?: number | null;
    amountTaxCents?: number | null;
    planName?: string | null;
    currency?: string | null;
    billingPeriod?: string | null;
  },
  subscriptionPlan?: string | null,
  subscriptionBillingPeriod?: BillingPeriod | null,
): PortalInvoiceAmountBreakdown {
  const rate = PORTAL_CHECKOUT_VAT_RATE;
  const st = String(inv.status ?? "").toLowerCase();
  const plan = inferStarterPro(inv.planName, subscriptionPlan);
  const cur = (inv.currency === "TND" ? "TND" : "EUR") as Currency;
  const storedGross = Number(
    inv.amountGrossCents ?? inv.amountCents ?? 0,
  );

  const billingPeriod = resolveBillingPeriod(
    inv.billingPeriod as BillingPeriod | null,
    subscriptionBillingPeriod ?? null,
    plan,
    cur,
    storedGross,
  );

  // Open invoices: always show current catalog for known plan + period
  if (plan && billingPeriod && OPEN_INVOICE_STATUSES.has(st)) {
    const catalog = catalogNetTaxGrossCents(plan, cur, billingPeriod);
    return {
      grossCents: catalog.grossCents,
      netCents: catalog.netCents,
      taxCents: catalog.taxCents,
      vatRate: rate,
      billingPeriod,
    };
  }

  const explicitGross = Number(inv.amountGrossCents ?? inv.amountCents ?? 0);
  const explicitNet =
    inv.amountNetCents != null ? Number(inv.amountNetCents) : null;
  const explicitTax =
    inv.amountTaxCents != null ? Number(inv.amountTaxCents) : null;

  const grossCents =
    explicitGross > 0
      ? explicitGross
      : plan && billingPeriod
        ? catalogNetTaxGrossCents(plan, cur, billingPeriod).grossCents
        : storedGross;

  if (
    explicitNet != null &&
    explicitNet >= 0 &&
    explicitTax != null &&
    explicitTax >= 0 &&
    explicitNet + explicitTax === grossCents
  ) {
    if (
      plan &&
      billingPeriod &&
      explicitTax === 0 &&
      isNetOnlyStripeAmountCents(explicitNet, plan, cur, billingPeriod)
    ) {
      const corrected = catalogNetTaxGrossCents(plan, cur, billingPeriod);
      return {
        grossCents: corrected.grossCents,
        netCents: corrected.netCents,
        taxCents: corrected.taxCents,
        vatRate: rate,
        billingPeriod,
      };
    }

    return {
      grossCents,
      netCents: explicitNet,
      taxCents: explicitTax,
      vatRate: rate,
      billingPeriod,
    };
  }

  if (plan && billingPeriod) {
    const catalog = catalogNetTaxGrossCents(plan, cur, billingPeriod);
    return {
      grossCents: catalog.grossCents,
      netCents: catalog.netCents,
      taxCents: catalog.taxCents,
      vatRate: rate,
      billingPeriod,
    };
  }

  const netCents = Math.round(grossCents / (1 + rate));
  return {
    grossCents,
    netCents,
    taxCents: grossCents - netCents,
    vatRate: rate,
    billingPeriod,
  };
}

export function portalInvoiceDisplayAmountCents(
  inv: Parameters<typeof portalInvoiceDisplayBreakdown>[0],
  subscriptionPlan?: string | null,
  subscriptionBillingPeriod?: BillingPeriod | null,
): number {
  return portalInvoiceDisplayBreakdown(
    inv,
    subscriptionPlan,
    subscriptionBillingPeriod,
  ).grossCents;
}
