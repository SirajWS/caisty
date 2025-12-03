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
      yearly: 152, // ~15% Rabatt: 14.99 * 12 * 0.85
    },
    pro: {
      monthly: 29.99,
      yearly: 306, // ~15% Rabatt: 29.99 * 12 * 0.85
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

