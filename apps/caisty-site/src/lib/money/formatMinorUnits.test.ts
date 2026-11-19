import { describe, expect, it } from "vitest";
import {
  formatMinorUnits,
  minorUnitDivisor,
  minorUnitExponent,
} from "./formatMinorUnits";

describe("minorUnitExponent / minorUnitDivisor", () => {
  it("uses 2 decimals for EUR", () => {
    expect(minorUnitExponent("EUR")).toBe(2);
    expect(minorUnitDivisor("EUR")).toBe(100);
  });

  it("uses 3 decimals for TND", () => {
    expect(minorUnitExponent("TND")).toBe(3);
    expect(minorUnitDivisor("TND")).toBe(1000);
  });

  it("does not fall back to 2 decimals for unknown currencies", () => {
    expect(minorUnitExponent("XYZ")).toBeNull();
    expect(minorUnitDivisor("")).toBeNull();
    expect(minorUnitExponent("LYD")).toBe(3);
    expect(minorUnitDivisor("LYD")).toBe(1000);
    expect(minorUnitExponent("CHF")).toBe(2);
    expect(minorUnitExponent("MAD")).toBe(2);
    expect(minorUnitExponent("DZD")).toBe(2);
  });

  it("is case-insensitive", () => {
    expect(minorUnitDivisor("tnd")).toBe(1000);
  });
});

describe("formatMinorUnits", () => {
  it("formats TND millimes with 3 decimals (6000 → 6.000)", () => {
    const out = formatMinorUnits(6000, "TND", "en-GB");
    // 6000 millimes / 1000 = 6.000; not 60
    expect(out).toContain("6.000");
    expect(out).not.toContain("60.000");
  });

  it("formats EUR cents with 2 decimals (600 → 6.00)", () => {
    const out = formatMinorUnits(600, "EUR", "en-GB");
    expect(out).toContain("6.00");
  });

  it("formats larger TND amounts correctly", () => {
    const out = formatMinorUnits(572800, "TND", "en-GB");
    // 572800 / 1000 = 572.800
    expect(out).toContain("572.800");
  });

  it("formats TND payment totals without factor-10 scaling error", () => {
    expect(formatMinorUnits(12000, "TND", "en-GB")).toContain("12.000");
    expect(formatMinorUnits(441000, "TND", "en-GB")).toContain("441.000");
    expect(formatMinorUnits(453000, "TND", "en-GB")).toContain("453.000");
  });

  it("formats EUR cents with 2 decimals (1200 → 12.00)", () => {
    expect(formatMinorUnits(1200, "EUR", "en-GB")).toContain("12.00");
  });

  it("does not default empty or unknown codes to EUR", () => {
    expect(formatMinorUnits(600, "", "en-GB")).toBe("600");
    expect(formatMinorUnits(600, "XYZ", "en-GB")).toBe("600 XYZ");
  });

  it("formats LYD millimes with 3 decimals", () => {
    expect(formatMinorUnits(13125, "LYD", "en-GB")).toContain("13.125");
  });

  it("formats zero amounts with catalog precision for all eight currencies", () => {
    expect(formatMinorUnits(0, "EUR", "en-GB")).toContain("0.00");
    expect(formatMinorUnits(0, "USD", "en-GB")).toContain("0.00");
    expect(formatMinorUnits(0, "CHF", "en-GB")).toContain("0.00");
    expect(formatMinorUnits(0, "GBP", "en-GB")).toContain("0.00");
    expect(formatMinorUnits(0, "MAD", "en-GB")).toContain("0.00");
    expect(formatMinorUnits(0, "DZD", "en-GB")).toContain("0.00");
    expect(formatMinorUnits(0, "TND", "en-GB")).toContain("0.000");
    expect(formatMinorUnits(0, "LYD", "en-GB")).toContain("0.000");
  });
});
