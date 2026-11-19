import { getCurrencyMinorUnitFactor, getCurrencyPrecision, isSupportedBusinessCurrency } from "./catalog";

/**
 * Format ISO minor units with Intl currency style.
 * Unknown / empty codes do not fall back to EUR or 2 decimals.
 */
export function formatMinorUnits(
  amountMinor: number,
  currency: string | null | undefined,
  locale: string,
): string {
  const code = (currency ?? "").trim().toUpperCase();
  if (!isSupportedBusinessCurrency(code)) {
    const amount = Number.isFinite(amountMinor) ? String(amountMinor) : "—";
    return code ? `${amount} ${code}` : amount;
  }
  const factor = getCurrencyMinorUnitFactor(code);
  const digits = getCurrencyPrecision(code);
  if (factor == null || digits == null) {
    const amount = Number.isFinite(amountMinor) ? String(amountMinor) : "—";
    return `${amount} ${code}`;
  }
  const major = Number.isFinite(amountMinor) ? amountMinor / factor : 0;
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency: code,
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  }).format(major);
}
