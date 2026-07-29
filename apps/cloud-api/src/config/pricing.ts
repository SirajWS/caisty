// Zentrale Pricing-Konfiguration für Backend (muss mit Frontend übereinstimmen)

export type Currency = "EUR" | "TND";
export type PaidCatalogPlan = "starter" | "pro" | "business";

export const PRICING: Record<
  Currency,
  {
    starter: { monthly: number; yearly: number };
    pro: { monthly: number; yearly: number };
    business: { monthly?: number; yearly?: number };
    trial: { monthly: number; yearly: number };
  }
> = {
  EUR: {
    starter: {
      monthly: 14.99,
      yearly: 149,
    },
    pro: {
      monthly: 24.99,
      yearly: 299,
    },
    business: {
      monthly: 34.99,
      yearly: 349,
    },
    trial: {
      monthly: 0,
      yearly: 0,
    },
  },
  TND: {
    starter: {
      monthly: 39,
      yearly: 398,
    },
    pro: {
      monthly: 99,
      yearly: 1010,
    },
    business: {
      // TND Business price not confirmed — do not invent
    },
    trial: {
      monthly: 0,
      yearly: 0,
    },
  },
};

export function isYearlyPriceAvailable(
  plan: PaidCatalogPlan,
  currency: Currency = "EUR",
): boolean {
  const entry = PRICING[currency][plan];
  return typeof entry.yearly === "number" && Number.isFinite(entry.yearly);
}

export function getPlanPrice(
  plan: PaidCatalogPlan,
  currency: Currency = "EUR",
  period: "monthly" | "yearly" = "monthly",
): number | null {
  const entry = PRICING[currency][plan];
  if (period === "yearly") {
    return typeof entry.yearly === "number" ? entry.yearly : null;
  }
  return typeof entry.monthly === "number" ? entry.monthly : null;
}

export const PORTAL_CHECKOUT_VAT_RATE = 0.19;

export function grossPlanAmountCents(
  plan: PaidCatalogPlan,
  currency: Currency = "EUR",
  period: "monthly" | "yearly" = "monthly",
): number | null {
  const price = getPlanPrice(plan, currency, period);
  if (price === null) return null;
  return Math.round(price * 100);
}

export function netPlanAmountCents(
  plan: PaidCatalogPlan,
  currency: Currency = "EUR",
  period: "monthly" | "yearly" = "monthly",
): number | null {
  const grossCents = grossPlanAmountCents(plan, currency, period);
  if (grossCents === null) return null;
  return Math.round(grossCents / (1 + PORTAL_CHECKOUT_VAT_RATE));
}
