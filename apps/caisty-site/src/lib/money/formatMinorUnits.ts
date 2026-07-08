/**
 * Currency-aware money formatting for POS sales values.
 *
 * POS Sync stores monetary amounts as ISO 4217 minor units. The field names use
 * the `amountCents` / `totalCents` / `grossCents` suffix for historical reasons,
 * but the actual scale depends on the currency's ISO exponent:
 *   - EUR → exponent 2 → 100 minor units per unit (Cent)
 *   - TND → exponent 3 → 1000 minor units per unit (Millime)
 *
 * Do not assume 2 decimals. Always divide by the currency divisor before
 * formatting so TND 6.000 (stored as 6000) renders as "TND 6.000", not
 * "TND 60.000".
 */

const CURRENCY_MINOR_UNIT_EXPONENT: Record<string, number> = {
  EUR: 2,
  USD: 2,
  GBP: 2,
  TND: 3,
};

const DEFAULT_EXPONENT = 2;

export function minorUnitExponent(currency: string): number {
  const code = (currency || "EUR").trim().toUpperCase();
  return CURRENCY_MINOR_UNIT_EXPONENT[code] ?? DEFAULT_EXPONENT;
}

export function minorUnitDivisor(currency: string): number {
  return 10 ** minorUnitExponent(currency);
}

/**
 * Format an ISO minor-unit amount into a localized currency string.
 *
 * @param amountMinor Amount in ISO 4217 minor units (Cent for EUR, Millime for TND).
 * @param currency ISO 4217 currency code (e.g. "EUR", "TND").
 * @param locale BCP 47 locale tag for number formatting.
 */
export function formatMinorUnits(
  amountMinor: number,
  currency: string,
  locale: string,
): string {
  const code = (currency || "EUR").trim().toUpperCase();
  const divisor = minorUnitDivisor(code);
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency: code,
  }).format(amountMinor / divisor);
}
