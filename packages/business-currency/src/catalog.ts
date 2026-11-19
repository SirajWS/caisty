/** Supported operational POS / business-profile currencies (not SaaS billing). */
export const BUSINESS_CURRENCIES = [
  "EUR",
  "USD",
  "CHF",
  "GBP",
  "MAD",
  "DZD",
  "TND",
  "LYD",
] as const;

export type BusinessCurrencyCode = (typeof BUSINESS_CURRENCIES)[number];

/** ISO 4217 minor-unit exponents for Core 1.0 business currencies. */
export const BUSINESS_CURRENCY_PRECISION: Record<BusinessCurrencyCode, number> = {
  EUR: 2,
  USD: 2,
  CHF: 2,
  GBP: 2,
  MAD: 2,
  DZD: 2,
  TND: 3,
  LYD: 3,
};

/** PostgreSQL `integer` inclusive maximum used by POS money columns. */
export const POS_MONEY_INT32_MAX = 2_147_483_647;
export const POS_MONEY_INT32_MIN = -2_147_483_648;

export function normalizeCurrencyCode(
  value: string | null | undefined,
): string {
  return (value ?? "").trim().toUpperCase();
}

export function isSupportedBusinessCurrency(
  value: string | null | undefined,
): value is BusinessCurrencyCode {
  const code = normalizeCurrencyCode(value);
  return (BUSINESS_CURRENCIES as readonly string[]).includes(code);
}

export function getCurrencyPrecision(
  value: string | null | undefined,
): number | null {
  const code = normalizeCurrencyCode(value);
  if (!isSupportedBusinessCurrency(code)) return null;
  return BUSINESS_CURRENCY_PRECISION[code];
}

export function getCurrencyMinorUnitFactor(
  value: string | null | undefined,
): number | null {
  const precision = getCurrencyPrecision(value);
  if (precision == null) return null;
  return 10 ** precision;
}

export function resolvePeriodCurrencies(
  codes: Array<string | null | undefined>,
): { mixedCurrency: boolean; currency: string | null } {
  const unique: string[] = [];
  for (const raw of codes) {
    const code = normalizeCurrencyCode(raw);
    if (!code) continue;
    if (!unique.includes(code)) unique.push(code);
  }
  if (unique.length === 0) return { mixedCurrency: false, currency: null };
  if (unique.length === 1) {
    return { mixedCurrency: false, currency: unique[0] ?? null };
  }
  return { mixedCurrency: true, currency: null };
}

/**
 * Empty operational payment summaries use the business/period currency.
 * Non-zero historical rows keep the currency recorded on those rows.
 */
export function pickOperationalPaymentCurrency(input: {
  recordedCurrency?: string | null;
  fallbackCurrency?: string | null;
  hasRecordedAmounts: boolean;
}): string {
  const recorded = normalizeCurrencyCode(input.recordedCurrency);
  const fallback = normalizeCurrencyCode(input.fallbackCurrency);
  if (input.hasRecordedAmounts) {
    return recorded || fallback;
  }
  if (isSupportedBusinessCurrency(fallback)) return fallback;
  if (isSupportedBusinessCurrency(recorded)) return recorded;
  return fallback || recorded;
}
