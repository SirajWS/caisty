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

  it("falls back to 2 decimals for unknown currencies", () => {
    expect(minorUnitExponent("XYZ")).toBe(2);
    expect(minorUnitDivisor("")).toBe(100);
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

  it("defaults to EUR when currency is empty", () => {
    const out = formatMinorUnits(600, "", "en-GB");
    expect(out).toContain("6.00");
  });
});
