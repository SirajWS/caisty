/** Display-only VAT rate for EUR portal prices (matches Stripe inclusive catalog). */
export const PORTAL_DISPLAY_VAT_RATE = 0.19;

/** Extract included VAT from a tax-inclusive gross price. */
export function breakdownVatInclusive(
  grossAmount: number,
  vatRate = PORTAL_DISPLAY_VAT_RATE,
): { gross: number; includedVat: number; vatRatePercent: number } {
  const includedVat = grossAmount * (vatRate / (1 + vatRate));
  return {
    gross: grossAmount,
    includedVat: Math.round(includedVat * 100) / 100,
    vatRatePercent: Math.round(vatRate * 100),
  };
}
