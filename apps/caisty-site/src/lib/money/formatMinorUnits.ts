/**
 * Portal display helper for POS / reports amounts stored as ISO minor units.
 * Delegates to the shared business-currency catalog — no silent EUR or 2-decimal fallback.
 */
export {
  formatMinorUnits,
  fromMinorUnits,
  getCurrencyMinorUnitFactor,
  getCurrencyPrecision,
  isSupportedBusinessCurrency,
  pickOperationalPaymentCurrency,
  toMinorUnits,
} from "@caisty/business-currency";

export { getCurrencyPrecision as minorUnitExponent } from "@caisty/business-currency";
export { getCurrencyMinorUnitFactor as minorUnitDivisor } from "@caisty/business-currency";
