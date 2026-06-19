import type { Currency } from "../config/pricing.js";
import {
  grossPlanAmountCents,
  PORTAL_CHECKOUT_VAT_RATE,
} from "../config/pricing.js";
import type { BillingPeriod } from "./billingPeriod.js";
import {
  catalogNetTaxGrossCents,
  correctLegacyInvoiceAmounts,
  isLegacyAdditiveVatBreakdown,
  legacyAddedVatGrossCents,
  oldCatalogAddedVatGrossCents,
} from "./vatAmountBreakdown.js";

const OPEN_INVOICE_STATUSES = new Set(["open", "draft", "pending"]);

/** Legacy wrong gross cents for period inference (old net×1.19 and new gross×1.19). */
export const LEGACY_GROSS_CENTS: Partial<
  Record<"starter" | "pro", Partial<Record<BillingPeriod, number>>>
> = {
  starter: { monthly: 1189, yearly: 11781 },
  pro: { monthly: 2379, yearly: 23681 },
};

const NEW_LEGACY_GROSS_CENTS: Partial<
  Record<"starter" | "pro", Partial<Record<BillingPeriod, number>>>
> = {
  starter: { monthly: 1784, yearly: 17731 },
  pro: { monthly: 2974, yearly: 35581 },
};

export interface PortalInvoiceInput {
  status?: string | null;
  amountCents?: number | null;
  amountGrossCents?: number | null;
  amountNetCents?: number | null;
  amountTaxCents?: number | null;
  planName?: string | null;
  currency?: string | null;
  billingPeriod?: string | null;
  provider?: string | null;
}

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

    const legacyWrong = legacyAddedVatGrossCents(plan, currency, period);
    if (Math.abs(grossCents - legacyWrong) <= 2) return period;

    const oldLegacyWrong = oldCatalogAddedVatGrossCents(plan, currency, period);
    if (Math.abs(grossCents - oldLegacyWrong) <= 2) return period;

    const legacy = LEGACY_GROSS_CENTS[plan]?.[period];
    if (legacy != null && Math.abs(grossCents - legacy) <= 2) return period;

    const newLegacy = NEW_LEGACY_GROSS_CENTS[plan]?.[period];
    if (newLegacy != null && Math.abs(grossCents - newLegacy) <= 2) return period;
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
 * Display breakdown for portal/admin/HTML invoices.
 * Catalog EUR prices are VAT-inclusive; legacy rows that added VAT on top are corrected.
 */
export function portalInvoiceDisplayBreakdown(
  inv: PortalInvoiceInput,
  subscriptionPlan?: string | null,
  subscriptionBillingPeriod?: BillingPeriod | null,
): PortalInvoiceAmountBreakdown {
  const rate = PORTAL_CHECKOUT_VAT_RATE;
  const st = String(inv.status ?? "").toLowerCase();
  const provider = String(inv.provider ?? "").toLowerCase();
  const plan = inferStarterPro(inv.planName, subscriptionPlan);
  const cur = (inv.currency === "TND" ? "TND" : "EUR") as Currency;

  const storedGross = Number(inv.amountGrossCents ?? inv.amountCents ?? 0);
  const explicitNet =
    inv.amountNetCents != null ? Number(inv.amountNetCents) : null;
  const explicitTax =
    inv.amountTaxCents != null ? Number(inv.amountTaxCents) : null;

  const billingPeriod = resolveBillingPeriod(
    inv.billingPeriod as BillingPeriod | null,
    subscriptionBillingPeriod ?? null,
    plan,
    cur,
    storedGross,
  );

  if (plan && billingPeriod && cur === "EUR") {
    const catalog = catalogNetTaxGrossCents(plan, cur, billingPeriod);

    const legacyCorrected = correctLegacyInvoiceAmounts(
      storedGross,
      explicitNet ?? 0,
      explicitTax ?? 0,
      plan,
      cur,
      billingPeriod,
    );
    if (legacyCorrected) {
      return { ...legacyCorrected, billingPeriod };
    }

    if (provider === "stripe" && OPEN_INVOICE_STATUSES.has(st)) {
      return { ...catalog, billingPeriod };
    }

    if (
      provider === "stripe" &&
      explicitNet != null &&
      explicitTax != null &&
      isLegacyAdditiveVatBreakdown(
        storedGross,
        explicitNet,
        explicitTax,
        plan,
        cur,
        billingPeriod,
      )
    ) {
      return { ...catalog, billingPeriod };
    }

    if (Math.abs(storedGross - catalog.grossCents) <= 2) {
      if (
        explicitNet != null &&
        explicitTax != null &&
        explicitNet + explicitTax === storedGross &&
        Math.abs(explicitNet - catalog.netCents) <= 2 &&
        Math.abs(explicitTax - catalog.taxCents) <= 2
      ) {
        return {
          grossCents: storedGross,
          netCents: explicitNet,
          taxCents: explicitTax,
          vatRate: rate,
          billingPeriod,
        };
      }
      return { ...catalog, billingPeriod };
    }
  }

  if (plan && billingPeriod && cur === "EUR" && OPEN_INVOICE_STATUSES.has(st)) {
    const catalog = catalogNetTaxGrossCents(plan, cur, billingPeriod);
    return { ...catalog, billingPeriod };
  }

  const grossCents =
    storedGross > 0
      ? storedGross
      : plan && billingPeriod
        ? catalogNetTaxGrossCents(plan, cur, billingPeriod).grossCents
        : 0;

  if (
    plan &&
    billingPeriod &&
    explicitNet != null &&
    explicitTax != null &&
    explicitNet + explicitTax === grossCents
  ) {
    const legacyCorrected = correctLegacyInvoiceAmounts(
      grossCents,
      explicitNet,
      explicitTax,
      plan,
      cur,
      billingPeriod,
    );
    if (legacyCorrected) {
      return { ...legacyCorrected, billingPeriod };
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
    return { ...catalog, billingPeriod };
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
  inv: PortalInvoiceInput,
  subscriptionPlan?: string | null,
  subscriptionBillingPeriod?: BillingPeriod | null,
): number {
  return portalInvoiceDisplayBreakdown(
    inv,
    subscriptionPlan,
    subscriptionBillingPeriod,
  ).grossCents;
}
