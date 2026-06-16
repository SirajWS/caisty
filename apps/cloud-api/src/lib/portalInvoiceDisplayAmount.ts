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

/**
 * Portal list/detail/HTML: show current catalog gross for **open** Starter/Pro
 * invoices when stored cents are legacy (e.g. net-only or old €14.99 rows).
 * Paid / other statuses keep stored amounts. If `amount_gross_cents` is set, it wins.
 */
const RECONCILE_STATUSES = new Set(["open", "draft", "pending"]);

/** Legacy yearly gross (102 € net + 19% VAT) from pre-2026-06 pricing. */
const LEGACY_STARTER_YEARLY_GROSS_CENTS = 12138;
/** Current yearly gross (99 € net + 19% VAT). */
const CURRENT_STARTER_YEARLY_GROSS_CENTS = 11781;

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

function resolveBillingPeriod(
  billingPeriod: BillingPeriod | null | undefined,
  plan: "starter" | "pro" | null,
  currency: Currency,
  grossCents: number,
): BillingPeriod {
  if (billingPeriod === "monthly" || billingPeriod === "yearly") {
    return billingPeriod;
  }
  if (!plan) return "monthly";
  const monthlyGross = grossPlanAmountCents(plan, currency, "monthly");
  const yearlyGross = grossPlanAmountCents(plan, currency, "yearly");
  const monthlyNet = Math.round(getPlanPrice(plan, currency, "monthly") * 100);
  const yearlyNet = Math.round(getPlanPrice(plan, currency, "yearly") * 100);
  if (Math.abs(grossCents - yearlyGross) <= 2) return "yearly";
  if (Math.abs(grossCents - monthlyGross) <= 2) return "monthly";
  if (Math.abs(grossCents - yearlyNet) <= 2) return "yearly";
  if (Math.abs(grossCents - monthlyNet) <= 2) return "monthly";
  if (Math.abs(grossCents - LEGACY_STARTER_YEARLY_GROSS_CENTS) <= 2) {
    return "yearly";
  }
  return grossCents >= Math.min(monthlyGross, yearlyGross) * 5 ? "yearly" : "monthly";
}

export interface PortalInvoiceAmountBreakdown {
  grossCents: number;
  netCents: number;
  taxCents: number;
  /** e.g. 0.19 */
  vatRate: number;
  billingPeriod: BillingPeriod | null;
}

export function portalInvoiceDisplayAmountCents(
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
): number {
  const plan = inferStarterPro(inv.planName, subscriptionPlan);
  const cur = (inv.currency === "TND" ? "TND" : "EUR") as Currency;
  const stored = Number(inv.amountGrossCents ?? inv.amountCents ?? 0);
  const period = resolveBillingPeriod(
    (inv.billingPeriod as BillingPeriod | null) ?? subscriptionBillingPeriod,
    plan,
    cur,
    stored,
  );

  const explicitGross = Number(inv.amountGrossCents ?? 0);
  if (explicitGross > 0) {
    const explicitTax = Number(inv.amountTaxCents ?? 0);
    const explicitNet = Number(inv.amountNetCents ?? 0);
    if (
      plan &&
      explicitTax === 0 &&
      (explicitNet === explicitGross || explicitNet === 0) &&
      isNetOnlyStripeAmountCents(explicitGross, plan, cur, period)
    ) {
      return catalogNetTaxGrossCents(plan, cur, period).grossCents;
    }
    return explicitGross;
  }

  const st = String(inv.status ?? "").toLowerCase();
  if (!RECONCILE_STATUSES.has(st)) return stored;

  if (!plan) return stored;

  return grossPlanAmountCents(plan, cur, period);
}

/**
 * Net / VAT / gross lines for portal invoice detail, list hints, and HTML/PDF.
 * Uses stored net+tax when they sum to the display gross; otherwise catalog net
 * for reconciled Starter/Pro; else splits gross by {@link PORTAL_CHECKOUT_VAT_RATE}.
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
  const explicitGross = Number(inv.amountGrossCents ?? 0);
  const storedGross = explicitGross > 0 ? explicitGross : Number(inv.amountCents ?? 0);
  const rate = PORTAL_CHECKOUT_VAT_RATE;

  const explicitNet =
    inv.amountNetCents != null ? Number(inv.amountNetCents) : null;
  const explicitTax =
    inv.amountTaxCents != null ? Number(inv.amountTaxCents) : null;

  const plan = inferStarterPro(inv.planName, subscriptionPlan);
  const cur = (inv.currency === "TND" ? "TND" : "EUR") as Currency;
  const billingPeriod = resolveBillingPeriod(
    (inv.billingPeriod as BillingPeriod | null) ?? subscriptionBillingPeriod,
    plan,
    cur,
    storedGross,
  );

  const grossCents = portalInvoiceDisplayAmountCents(
    inv,
    subscriptionPlan,
    billingPeriod,
  );

  if (
    explicitNet != null &&
    explicitNet >= 0 &&
    explicitTax != null &&
    explicitTax >= 0 &&
    explicitNet + explicitTax === grossCents
  ) {
    // Stripe synced net-only (tax=0, gross=net=catalog net) — show correct VAT
    if (
      plan &&
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

  const st = String(inv.status ?? "").toLowerCase();

  if (plan && RECONCILE_STATUSES.has(st) && explicitGross <= 0) {
    const netCents = Math.round(getPlanPrice(plan, cur, billingPeriod) * 100);
    return {
      grossCents,
      netCents,
      taxCents: Math.max(0, grossCents - netCents),
      vatRate: rate,
      billingPeriod,
    };
  }

  // Legacy paid yearly starter: stored gross 12138 but Stripe charged 11781
  if (
    plan === "starter" &&
    billingPeriod === "yearly" &&
    Math.abs(storedGross - LEGACY_STARTER_YEARLY_GROSS_CENTS) <= 2
  ) {
    const netCents = Math.round(getPlanPrice(plan, cur, "yearly") * 100);
    const taxCents = CURRENT_STARTER_YEARLY_GROSS_CENTS - netCents;
    return {
      grossCents: CURRENT_STARTER_YEARLY_GROSS_CENTS,
      netCents,
      taxCents,
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
