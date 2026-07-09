import { describe, expect, it } from "vitest";

import {
  isHourlyRevenueSeries,
  normalizeSalesByHour,
  resolveNormalizedHourlyReportPoints,
} from "./salesByHour";

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

  it("detects hourly revenue series buckets", () => {
    expect(
      isHourlyRevenueSeries([
        {
          label: "10:00",
          bucketStart: "1970-01-01T10:00:00.000Z",
        },
      ]),
    ).toBe(true);
    expect(
      isHourlyRevenueSeries([
        {
          label: "2026-07-08",
          bucketStart: "2026-07-08T00:00:00.000Z",
        },
      ]),
    ).toBe(false);
  });

  it("normalizes sparse hourly revenue series to 24 rows", () => {
    const normalized = resolveNormalizedHourlyReportPoints([], [
      {
        label: "08:00",
        bucketStart: "1970-01-01T08:00:00.000Z",
        revenueMinor: 1200,
        ordersCount: 2,
      },
      {
        label: "22:00",
        bucketStart: "1970-01-01T22:00:00.000Z",
        revenueMinor: 500,
        ordersCount: 1,
      },
    ]);

    expect(normalized).toHaveLength(24);
    expect(normalized[8]?.revenueMinor).toBe(1200);
    expect(normalized[0]?.ordersCount).toBe(0);
    expect(normalized[23]?.hour).toBe(23);
  });
});
