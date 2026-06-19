// Zentrale Pricing-Konfiguration für Backend (muss mit Frontend übereinstimmen)

export type Currency = "EUR" | "TND";

export const PRICING: Record<Currency, {
  starter: {
    monthly: number;
    yearly: number;
  };
  pro: {
    monthly: number;
    yearly: number;
  };
  trial: {
    monthly: number;
    yearly: number;
  };
}> = {
  EUR: {
    starter: {
      monthly: 14.99,
      yearly: 149,
    },
    pro: {
      monthly: 24.99,
      yearly: 299,
    },
    trial: {
      monthly: 0,
      yearly: 0,
    },
  },
  TND: {
    starter: {
      monthly: 39,
      yearly: 398, // ~15% Rabatt: 39 * 12 * 0.85
    },
    pro: {
      monthly: 99,
      yearly: 1010, // ~15% Rabatt: 99 * 12 * 0.85
    },
    trial: {
      monthly: 0,
      yearly: 0,
    },
  },
};

// Helper: Hole Preis für Plan und Währung
export function getPlanPrice(
  plan: "starter" | "pro",
  currency: Currency = "EUR",
  period: "monthly" | "yearly" = "monthly"
): number {
  return PRICING[currency][plan][period];
}

/**
 * VAT rate for extracting included tax from catalog gross prices (EUR).
 */
export const PORTAL_CHECKOUT_VAT_RATE = 0.19;

/** Catalog list price in cents — VAT-inclusive (matches Stripe live prices). */
export function grossPlanAmountCents(
  plan: "starter" | "pro",
  currency: Currency = "EUR",
  period: "monthly" | "yearly" = "monthly",
): number {
  return Math.round(getPlanPrice(plan, currency, period) * 100);
}

/** Net portion extracted from VAT-inclusive catalog gross. */
export function netPlanAmountCents(
  plan: "starter" | "pro",
  currency: Currency = "EUR",
  period: "monthly" | "yearly" = "monthly",
): number {
  const grossCents = grossPlanAmountCents(plan, currency, period);
  return Math.round(grossCents / (1 + PORTAL_CHECKOUT_VAT_RATE));
}

