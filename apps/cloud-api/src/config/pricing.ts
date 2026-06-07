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
      monthly: 9.99,
      yearly: 102, // ~15% Rabatt: 9.99 * 12 * 0.85
    },
    pro: {
      monthly: 19.99,
      yearly: 204, // ~15% Rabatt: 19.99 * 12 * 0.85
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
 * VAT rate applied in the customer portal checkout (must match caisty-site).
 * Invoice amounts and PayPal capture use gross (net × (1 + rate)).
 */
export const PORTAL_CHECKOUT_VAT_RATE = 0.19;

/** Gross amount in cents charged to the customer (incl. VAT). */
export function grossPlanAmountCents(
  plan: "starter" | "pro",
  currency: Currency = "EUR",
  period: "monthly" | "yearly" = "monthly",
): number {
  const net = getPlanPrice(plan, currency, period);
  return Math.round(net * (1 + PORTAL_CHECKOUT_VAT_RATE) * 100);
}

