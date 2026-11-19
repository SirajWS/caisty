import { describe, expect, it } from "vitest";
import {
  getReceiptsCountKpiLabel,
  getReceiptsPeriodFilters,
  isIncompatibleCustomReceiptsResponse,
  mapReceiptsPeriodToApi,
} from "./receiptsPeriod";
import { portalEn } from "../translations/portal/en";

describe("getReceiptsPeriodFilters", () => {
  it("enables custom without a coming-soon badge", () => {
    const filters = getReceiptsPeriodFilters(portalEn.reports);
    expect(filters.map((f) => f.id)).toEqual([
      "today",
      "yesterday",
      "week",
      "month",
      "all",
      "custom",
    ]);
    expect(filters.find((f) => f.id === "custom")?.disabled).toBeUndefined();
  });
});

describe("mapReceiptsPeriodToApi", () => {
  it("maps existing presets and custom ranges without falling back to 30_days", () => {
    expect(mapReceiptsPeriodToApi({ period: "today" })).toEqual({
      period: "today",
    });
    expect(mapReceiptsPeriodToApi({ period: "yesterday" })).toEqual({
      period: "yesterday",
    });
    expect(mapReceiptsPeriodToApi({ period: "week" })).toEqual({
      period: "this_week",
    });
    expect(mapReceiptsPeriodToApi({ period: "month" })).toEqual({
      period: "this_month",
    });
    expect(mapReceiptsPeriodToApi({ period: "all" })).toEqual({
      period: "all_time",
    });
    expect(
      mapReceiptsPeriodToApi({
        period: "custom",
        from: "2026-11-15",
        to: "2026-11-15",
      }),
    ).toEqual({
      period: "custom",
      from: "2026-11-15",
      to: "2026-11-15",
    });
    expect(
      mapReceiptsPeriodToApi({
        period: "custom",
        from: "2026-11-01",
        to: "2026-11-15",
      }).period,
    ).not.toBe("30_days");
  });
});

describe("isIncompatibleCustomReceiptsResponse", () => {
  it("flags older APIs that echo a preset instead of the requested custom window", () => {
    expect(
      isIncompatibleCustomReceiptsResponse(
        { period: "custom", from: "2026-11-01", to: "2026-11-15" },
        { period: "30_days" },
      ),
    ).toBe(true);
    expect(
      isIncompatibleCustomReceiptsResponse(
        { period: "custom", from: "2026-11-01", to: "2026-11-15" },
        { period: "custom", from: "2026-11-01", to: "2026-11-14" },
      ),
    ).toBe(true);
    expect(
      isIncompatibleCustomReceiptsResponse(
        { period: "custom", from: "2026-11-01", to: "2026-11-15" },
        { period: "custom", from: "2026-11-01", to: "2026-11-15" },
      ),
    ).toBe(false);
    expect(
      isIncompatibleCustomReceiptsResponse(
        { period: "today" },
        { period: "today" },
      ),
    ).toBe(false);
  });
});

describe("getReceiptsCountKpiLabel", () => {
  it("keeps Receipts today for the today preset and uses a range for custom", () => {
    expect(
      getReceiptsCountKpiLabel("today", portalEn.receipts, portalEn.reports),
    ).toBe("Receipts today");
    expect(
      getReceiptsCountKpiLabel(
        "custom",
        portalEn.receipts,
        portalEn.reports,
        { from: "2026-11-01", to: "2026-11-15" },
        "en-US",
      ),
    ).toMatch(/November/);
  });
});
