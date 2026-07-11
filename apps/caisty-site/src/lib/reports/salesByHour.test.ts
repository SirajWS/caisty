import { describe, expect, it } from "vitest";

import { normalizeSalesByHour } from "./salesByHour";

describe("normalizeSalesByHour", () => {
  it("fills missing hours with zero revenue and orders", () => {
    const normalized = normalizeSalesByHour([
      { hour: 8, revenueMinor: 1200, ordersCount: 2 },
      { hour: 22, revenueMinor: 500, ordersCount: 1 },
    ]);

    expect(normalized).toHaveLength(24);
    expect(normalized[0]).toEqual({
      hour: 0,
      revenueMinor: 0,
      ordersCount: 0,
    });
    expect(normalized[8]).toEqual({
      hour: 8,
      revenueMinor: 1200,
      ordersCount: 2,
    });
    expect(normalized[22]).toEqual({
      hour: 22,
      revenueMinor: 500,
      ordersCount: 1,
    });
    expect(normalized[23].hour).toBe(23);
  });

  it("returns 24 zero buckets for an empty input", () => {
    const normalized = normalizeSalesByHour([]);
    expect(normalized).toHaveLength(24);
    expect(normalized.every((point) => point.revenueMinor === 0)).toBe(true);
    expect(normalized.map((point) => point.hour)).toEqual(
      Array.from({ length: 24 }, (_, hour) => hour),
    );
  });
});
