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

  it("defaults to EUR when currency is empty", () => {
    const out = formatMinorUnits(600, "", "en-GB");
    expect(out).toContain("6.00");
  });
});
