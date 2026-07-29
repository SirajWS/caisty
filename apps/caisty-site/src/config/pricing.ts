// Zentrale Pricing-Konfiguration für alle Währungen

export type Currency = "EUR" | "TND";

export const DEFAULT_BILLING_CURRENCY: Currency = "EUR";
export const SUPPORTED_DISPLAY_CURRENCIES: Currency[] = ["EUR", "TND"];
export const DISPLAY_CONVERSION = {
  EUR_TO_TND_FACTOR: 2.6,
};

export type PlanPriceEntry = {
  monthly?: number;
  yearly?: number;
};

export type PaidPlanKey = "starter" | "pro" | "business";

/** Prefer local currency; fall back to EUR when a Business price is missing. */
export function resolvePlanPrice(
  plan: PaidPlanKey,
  period: "monthly" | "yearly",
  currency: Currency,
): { amount: number; currency: Currency } | null {
  const local = PRICING[currency][plan][period];
  if (typeof local === "number" && Number.isFinite(local)) {
    return { amount: local, currency };
  }
  if (currency !== "EUR") {
    const eur = PRICING.EUR[plan][period];
    if (typeof eur === "number" && Number.isFinite(eur)) {
      return { amount: eur, currency: "EUR" };
    }
  }
  return null;
}

export function devicesLabelForPlan(
  plan: PaidPlanKey,
  unlimitedLabel: string,
  countedLabel: (count: number) => string,
): string {
  const max = MAX_DEVICES[plan];
  if (max === null) return unlimitedLabel;
  return countedLabel(max);
}

export const PRICING: Record<
  Currency,
  {
    starter: { monthly: number; yearly: number };
    pro: { monthly: number; yearly: number };
    business: PlanPriceEntry;
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
      monthly: 29,
      yearly: 296,
    },
    pro: {
      monthly: 49,
      yearly: 500,
    },
    business: {
      // TND Business price not confirmed — UI falls back to EUR
    },
    trial: {
      monthly: 0,
      yearly: 0,
    },
  },
};

export const TRIAL_DAYS = 3;

/** Positive integer = hard cap. null = unlimited (Business). */
export const MAX_DEVICES: Record<
  "trial" | "starter" | "pro" | "business",
  number | null
> = {
  starter: 1,
  pro: 3,
  trial: 1,
  business: null,
};

export function isYearlyPlanAvailable(
  plan: "starter" | "pro" | "business",
  currency: Currency = "EUR",
): boolean {
  return resolvePlanPrice(plan, "yearly", currency) != null;
}

export const CURRENCY_SYMBOLS: Record<Currency, string> = {
  EUR: "€",
  TND: "TND",
};

export function formatPrice(amount: number, currency: Currency): string {
  const symbol = CURRENCY_SYMBOLS[currency];
  if (currency === "EUR") {
    return `${amount.toFixed(2)} ${symbol}`;
  }
  return `${amount} ${symbol}`;
}

type DisplayLanguage = "en" | "fr" | "de" | "ar";

export function formatPlanDisplayAmount(
  amount: number,
  language: DisplayLanguage,
  period: "monthly" | "yearly",
): string {
  const wholeNumber = period === "yearly" && Number.isInteger(amount);
  if (wholeNumber) {
    return String(Math.round(amount));
  }
  const useComma = language === "de" || language === "fr";
  const fixed = amount.toFixed(2);
  return useComma ? fixed.replace(".", ",") : fixed;
}

export function formatLandingPlanPriceLine(
  amount: number,
  currency: Currency,
  language: DisplayLanguage,
  period: "monthly" | "yearly",
  periodSuffix: string,
): string {
  const symbol = CURRENCY_SYMBOLS[currency];
  const formatted = formatPlanDisplayAmount(amount, language, period);
  if (currency === "TND") {
    return `${formatted} ${symbol}${periodSuffix}`;
  }
  return `${formatted} ${symbol}${periodSuffix}`;
}
