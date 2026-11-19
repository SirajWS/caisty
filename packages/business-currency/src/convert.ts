import {
  getCurrencyMinorUnitFactor,
  isSupportedBusinessCurrency,
  POS_MONEY_INT32_MAX,
  POS_MONEY_INT32_MIN,
} from "./catalog";

export type MinorUnitConversion =
  | { ok: true; minor: number }
  | { ok: false; error: "unsupported_currency" | "invalid_amount" | "out_of_range" };

export type MajorUnitConversion =
  | { ok: true; major: number }
  | { ok: false; error: "unsupported_currency" | "invalid_amount" };

export function toMinorUnits(
  major: number,
  currency: string | null | undefined,
): MinorUnitConversion {
  if (!isSupportedBusinessCurrency(currency)) {
    return { ok: false, error: "unsupported_currency" };
  }
  if (!Number.isFinite(major)) {
    return { ok: false, error: "invalid_amount" };
  }
  const factor = getCurrencyMinorUnitFactor(currency);
  if (factor == null) return { ok: false, error: "unsupported_currency" };
  const minor = Math.round(major * factor);
  if (!Number.isSafeInteger(minor) || minor > POS_MONEY_INT32_MAX || minor < POS_MONEY_INT32_MIN) {
    return { ok: false, error: "out_of_range" };
  }
  return { ok: true, minor };
}

export function fromMinorUnits(
  minor: number,
  currency: string | null | undefined,
): MajorUnitConversion {
  if (!isSupportedBusinessCurrency(currency)) {
    return { ok: false, error: "unsupported_currency" };
  }
  if (!Number.isFinite(minor)) {
    return { ok: false, error: "invalid_amount" };
  }
  const factor = getCurrencyMinorUnitFactor(currency);
  if (factor == null) return { ok: false, error: "unsupported_currency" };
  return { ok: true, major: minor / factor };
}
