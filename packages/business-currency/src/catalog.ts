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

export function isPosMoneyInteger(value: unknown): value is number {
  return (
    typeof value === "number" &&
    Number.isInteger(value) &&
    value >= POS_MONEY_INT32_MIN &&
    value <= POS_MONEY_INT32_MAX
  );
}

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

/** Recorded currency may join active-currency totals only when both codes are known and equal. */
export function matchesActiveBusinessCurrency(
  recorded: string | null | undefined,
  active: string | null | undefined,
): boolean {
  const recordedCode = normalizeCurrencyCode(recorded);
  const activeCode = normalizeCurrencyCode(active);
  if (!recordedCode || !activeCode) return false;
  if (!isSupportedBusinessCurrency(recordedCode)) return false;
  if (!isSupportedBusinessCurrency(activeCode)) return false;
  return recordedCode === activeCode;
}

export type SaleFinancialInclusion = {
  included: boolean;
  inconsistent: boolean;
  recordedCurrencies: string[];
};

/**
 * A sale joins active-currency money totals only when every provided source
 * (receipt, order, payment) is a supported code equal to the active currency.
 * Missing, unknown, or conflicting codes are excluded and flagged.
 */
export function evaluateSaleFinancialInclusion(input: {
  activeCurrency: string | null | undefined;
  sources: Array<{ currency: string | null | undefined }>;
}): SaleFinancialInclusion {
  const active = normalizeCurrencyCode(input.activeCurrency);
  const recordedCurrencies: string[] = [];
  let inconsistent = false;

  if (!isSupportedBusinessCurrency(active) || input.sources.length === 0) {
    for (const source of input.sources) {
      const code = normalizeCurrencyCode(source.currency);
      if (code) recordedCurrencies.push(code);
      else inconsistent = true;
    }
    return { included: false, inconsistent: true, recordedCurrencies };
  }

  for (const source of input.sources) {
    const code = normalizeCurrencyCode(source.currency);
    if (!code) {
      inconsistent = true;
      continue;
    }
    recordedCurrencies.push(code);
    if (!isSupportedBusinessCurrency(code)) inconsistent = true;
  }

  const unique = [...new Set(recordedCurrencies)];
  if (unique.length > 1) inconsistent = true;

  const included =
    !inconsistent &&
    unique.length === 1 &&
    matchesActiveBusinessCurrency(unique[0], active);

  return { included, inconsistent, recordedCurrencies };
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
