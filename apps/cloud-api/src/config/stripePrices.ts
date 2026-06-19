// Stripe Price ID Mapping
// Diese Price IDs musst du in deinem Stripe Dashboard anlegen:
// Dashboard → Products → Create Product → Add Price → Copy Price ID

export type StripePriceId = string;

export const STRIPE_PRICES: Record<
  "EUR" | "TND",
  {
    starter: {
      monthly: StripePriceId;
      yearly: StripePriceId;
    };
    pro: {
      monthly: StripePriceId;
      yearly: StripePriceId;
    };
  }
> = {
  EUR: {
    starter: {
      monthly: process.env.STRIPE_PRICE_STARTER_MONTHLY_EUR || "", // z.B. "price_1234567890"
      yearly: process.env.STRIPE_PRICE_STARTER_YEARLY_EUR || "",
    },
    pro: {
      monthly: process.env.STRIPE_PRICE_PRO_MONTHLY_EUR || "",
      yearly: process.env.STRIPE_PRICE_PRO_YEARLY_EUR || "",
    },
  },
  TND: {
    starter: {
      monthly: process.env.STRIPE_PRICE_STARTER_MONTHLY_TND || "",
      yearly: process.env.STRIPE_PRICE_STARTER_YEARLY_TND || "",
    },
    pro: {
      monthly: process.env.STRIPE_PRICE_PRO_MONTHLY_TND || "",
      yearly: process.env.STRIPE_PRICE_PRO_YEARLY_TND || "",
    },
  },
};

export function getStripePriceEnvVarName(
  plan: "starter" | "pro",
  currency: "EUR" | "TND",
  period: "monthly" | "yearly",
): string {
  return `STRIPE_PRICE_${plan.toUpperCase()}_${period.toUpperCase()}_${currency}`;
}

/** Safe for logs — never log full price IDs in production. */
export function formatStripePriceIdPrefix(priceId: string | null | undefined): string {
  const id = String(priceId ?? "").trim();
  if (!id) return "(empty)";
  return id.length <= 16 ? id : `${id.slice(0, 16)}…`;
}

export interface StripePriceSelectionDebug {
  planId: string;
  plan: "starter" | "pro";
  billingPeriod: "monthly" | "yearly";
  currency: "EUR" | "TND";
  envVarName: string;
  priceIdPrefix: string;
}

/**
 * Get Stripe Price ID for a plan
 * @param plan - "starter" | "pro"
 * @param currency - "EUR" | "TND"
 * @param period - "monthly" | "yearly"
 * @returns Stripe Price ID (e.g. "price_1234567890")
 */
export function getStripePriceId(
  plan: "starter" | "pro",
  currency: "EUR" | "TND" = "EUR",
  period: "monthly" | "yearly" = "monthly"
): StripePriceId | null {
  const priceId = STRIPE_PRICES[currency][plan][period];
  return priceId || null;
}

export function describeStripePriceSelection(params: {
  planId: string;
  plan: "starter" | "pro";
  billingPeriod: "monthly" | "yearly";
  currency?: "EUR" | "TND";
}): StripePriceSelectionDebug {
  const currency = params.currency ?? "EUR";
  const priceId = getStripePriceId(params.plan, currency, params.billingPeriod);
  return {
    planId: params.planId,
    plan: params.plan,
    billingPeriod: params.billingPeriod,
    currency,
    envVarName: getStripePriceEnvVarName(params.plan, currency, params.billingPeriod),
    priceIdPrefix: formatStripePriceIdPrefix(priceId),
  };
}

