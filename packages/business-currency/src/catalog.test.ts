import { describe, expect, it } from "vitest";
import {
  BUSINESS_CURRENCIES,
  evaluateSaleFinancialInclusion,
  fromMinorUnits,
  getCurrencyPrecision,
  isSupportedBusinessCurrency,
  matchesActiveBusinessCurrency,
  pickOperationalPaymentCurrency,
  resolvePeriodCurrencies,
  toMinorUnits,
} from "./index";

describe("business currency catalog", () => {
  it("maps ISO exponents for all eight Core 1.0 currencies", () => {
    expect(BUSINESS_CURRENCIES).toEqual([
      "EUR",
      "USD",
      "CHF",
      "GBP",
      "MAD",
      "DZD",
      "TND",
      "LYD",
    ]);
    expect(getCurrencyPrecision("EUR")).toBe(2);
    expect(getCurrencyPrecision("USD")).toBe(2);
    expect(getCurrencyPrecision("CHF")).toBe(2);
    expect(getCurrencyPrecision("GBP")).toBe(2);
    expect(getCurrencyPrecision("MAD")).toBe(2);
    expect(getCurrencyPrecision("DZD")).toBe(2);
    expect(getCurrencyPrecision("TND")).toBe(3);
    expect(getCurrencyPrecision("LYD")).toBe(3);
  });

  it("rejects missing, blank, and unknown codes without EUR/2 fallback", () => {
    expect(isSupportedBusinessCurrency(undefined)).toBe(false);
    expect(isSupportedBusinessCurrency("")).toBe(false);
    expect(isSupportedBusinessCurrency("XYZ")).toBe(false);
    expect(getCurrencyPrecision("XYZ")).toBeNull();
    expect(getCurrencyPrecision("")).toBeNull();
    expect(getCurrencyPrecision(null)).toBeNull();
  });

  it("converts documented minor-unit examples", () => {
    expect(toMinorUnits(13.12, "EUR")).toEqual({ ok: true, minor: 1312 });
    expect(toMinorUnits(13.125, "TND")).toEqual({ ok: true, minor: 13125 });
    expect(toMinorUnits(13.125, "LYD")).toEqual({ ok: true, minor: 13125 });
    expect(toMinorUnits(0.333, "TND")).toEqual({ ok: true, minor: 333 });
    expect(toMinorUnits(1.005, "TND")).toEqual({ ok: true, minor: 1005 });
    expect(toMinorUnits(13.12, "CHF")).toEqual({ ok: true, minor: 1312 });
    expect(fromMinorUnits(13125, "TND")).toEqual({ ok: true, major: 13.125 });
  });

  it("rejects unsupported currency conversion and overflow", () => {
    expect(toMinorUnits(1, "JPY").ok).toBe(false);
    expect(toMinorUnits(Number.MAX_VALUE, "EUR").ok).toBe(false);
    expect(toMinorUnits(NaN, "EUR").ok).toBe(false);
    expect(toMinorUnits(1.0044, "TND")).toEqual({ ok: true, minor: 1004 });
    expect(toMinorUnits(1.0046, "TND")).toEqual({ ok: true, minor: 1005 });
  });

  it("detects mixed period currencies", () => {
    expect(resolvePeriodCurrencies(["eur", "EUR"])).toEqual({
      mixedCurrency: false,
      currency: "EUR",
    });
    expect(resolvePeriodCurrencies(["EUR", "TND"])).toEqual({
      mixedCurrency: true,
      currency: null,
    });
    expect(resolvePeriodCurrencies(["TND", "LYD"])).toEqual({
      mixedCurrency: true,
      currency: null,
    });
    expect(resolvePeriodCurrencies([null, "", undefined])).toEqual({
      mixedCurrency: false,
      currency: null,
    });
  });

  it("includes a sale only when every source matches the active currency", () => {
    expect(matchesActiveBusinessCurrency("tnd", "TND")).toBe(true);
    expect(matchesActiveBusinessCurrency("DZD", "TND")).toBe(false);
    expect(matchesActiveBusinessCurrency("", "TND")).toBe(false);
    expect(matchesActiveBusinessCurrency("XYZ", "TND")).toBe(false);

    const tndSale = evaluateSaleFinancialInclusion({
      activeCurrency: "TND",
      sources: [
        { currency: "TND" },
        { currency: "TND" },
        { currency: "TND" },
      ],
    });
    expect(tndSale).toEqual({
      included: true,
      inconsistent: false,
      recordedCurrencies: ["TND", "TND", "TND"],
    });

    const dzdSale = evaluateSaleFinancialInclusion({
      activeCurrency: "TND",
      sources: [{ currency: "DZD" }, { currency: "DZD" }],
    });
    expect(dzdSale.included).toBe(false);
    expect(dzdSale.inconsistent).toBe(false);

    const mismatch = evaluateSaleFinancialInclusion({
      activeCurrency: "TND",
      sources: [{ currency: "TND" }, { currency: "DZD" }],
    });
    expect(mismatch.included).toBe(false);
    expect(mismatch.inconsistent).toBe(true);

    const missing = evaluateSaleFinancialInclusion({
      activeCurrency: "TND",
      sources: [{ currency: "TND" }, { currency: "" }],
    });
    expect(missing.included).toBe(false);
    expect(missing.inconsistent).toBe(true);

    const unknown = evaluateSaleFinancialInclusion({
      activeCurrency: "TND",
      sources: [{ currency: "XYZ" }],
    });
    expect(unknown.included).toBe(false);
    expect(unknown.inconsistent).toBe(true);
  });

  it("uses business currency for empty operational payment summaries", () => {
    expect(
      pickOperationalPaymentCurrency({
        recordedCurrency: "EUR",
        fallbackCurrency: "TND",
        hasRecordedAmounts: false,
      }),
    ).toBe("TND");
    expect(
      pickOperationalPaymentCurrency({
        recordedCurrency: "TND",
        fallbackCurrency: "TND",
        hasRecordedAmounts: true,
      }),
    ).toBe("TND");
    expect(
      pickOperationalPaymentCurrency({
        recordedCurrency: "EUR",
        fallbackCurrency: "TND",
        hasRecordedAmounts: true,
      }),
    ).toBe("EUR");
  });
});
