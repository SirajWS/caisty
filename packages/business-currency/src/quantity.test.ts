import { describe, expect, it } from "vitest";

import {
  asPosQuantity,
  formatPosQuantity,
  parsePosSyncQuantity,
} from "./quantity";

describe("parsePosSyncQuantity", () => {
  it("accepts integer and fractional POS quantities", () => {
    expect(parsePosSyncQuantity(3)).toEqual({ ok: true, quantity: 3 });
    expect(parsePosSyncQuantity(1.25)).toEqual({ ok: true, quantity: 1.25 });
    expect(parsePosSyncQuantity(0.125)).toEqual({ ok: true, quantity: 0.125 });
  });

  it("rejects invalid quantities without rounding", () => {
    expect(parsePosSyncQuantity(0).ok).toBe(false);
    expect(parsePosSyncQuantity(-1).ok).toBe(false);
    expect(parsePosSyncQuantity(1.2501).ok).toBe(false);
    expect(parsePosSyncQuantity("1.25").ok).toBe(false);
    expect(parsePosSyncQuantity(Number.NaN).ok).toBe(false);
  });
});

describe("asPosQuantity", () => {
  it("parses numeric database strings without concatenation", () => {
    expect(asPosQuantity("1.25") + asPosQuantity("0.75")).toBe(2);
    expect(asPosQuantity("3")).toBe(3);
  });
});

describe("formatPosQuantity", () => {
  it("keeps integer display without trailing zeros", () => {
    expect(formatPosQuantity(3)).toBe("3");
    expect(formatPosQuantity("3.000")).toBe("3");
    expect(formatPosQuantity(1.25)).toBe("1.25");
    expect(formatPosQuantity(0.125)).toBe("0.125");
  });
});
