import type { Currency } from "../config/pricing.js";
import {
  getPlanPrice,
  grossPlanAmountCents,
  PORTAL_CHECKOUT_VAT_RATE,
} from "../config/pricing.js";

/**
 * Portal list/detail/HTML: show current catalog gross for **open** Starter/Pro
 * invoices when stored cents are legacy (e.g. net-only or old €14.99 rows).
 * Paid / other statuses keep stored amounts. If `amount_gross_cents` is set, it wins.
 */
const RECONCILE_STATUSES = new Set(["open", "draft", "pending"]);

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

export interface PortalInvoiceAmountBreakdown {
  grossCents: number;
  netCents: number;
  taxCents: number;
  /** e.g. 0.19 */
  vatRate: number;
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
  },
  subscriptionPlan?: string | null,
): number {
  const explicitGross = Number(inv.amountGrossCents ?? 0);
  if (explicitGross > 0) return explicitGross;

  const stored = Number(inv.amountCents ?? 0);
  const st = String(inv.status ?? "").toLowerCase();
  if (!RECONCILE_STATUSES.has(st)) return stored;

  const plan = inferStarterPro(inv.planName, subscriptionPlan);
  if (!plan) return stored;

  const cur = (inv.currency === "TND" ? "TND" : "EUR") as Currency;
  // Portal checkout is monthly for Starter/Pro in this product phase
  return grossPlanAmountCents(plan, cur, "monthly");
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
  },
  subscriptionPlan?: string | null,
): PortalInvoiceAmountBreakdown {
  const grossCents = portalInvoiceDisplayAmountCents(inv, subscriptionPlan);
  const rate = PORTAL_CHECKOUT_VAT_RATE;

  const explicitNet =
    inv.amountNetCents != null ? Number(inv.amountNetCents) : null;
  const explicitTax =
    inv.amountTaxCents != null ? Number(inv.amountTaxCents) : null;

  if (
    explicitNet != null &&
    explicitNet >= 0 &&
    explicitTax != null &&
    explicitTax >= 0 &&
    explicitNet + explicitTax === grossCents
  ) {
    return {
      grossCents,
      netCents: explicitNet,
      taxCents: explicitTax,
      vatRate: rate,
    };
  }

  const st = String(inv.status ?? "").toLowerCase();
  const plan = inferStarterPro(inv.planName, subscriptionPlan);
  const cur = (inv.currency === "TND" ? "TND" : "EUR") as Currency;
  const explicitGross = Number(inv.amountGrossCents ?? 0);

  if (plan && RECONCILE_STATUSES.has(st) && explicitGross <= 0) {
    const netCents = Math.round(getPlanPrice(plan, cur, "monthly") * 100);
    return {
      grossCents,
      netCents,
      taxCents: Math.max(0, grossCents - netCents),
      vatRate: rate,
    };
  }

  const netCents = Math.round(grossCents / (1 + rate));
  return {
    grossCents,
    netCents,
    taxCents: grossCents - netCents,
    vatRate: rate,
  };
}
