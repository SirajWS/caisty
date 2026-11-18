import { describe, expect, it } from "vitest";
import {
  applyCustomDraft,
  customChartGranularity,
  customPickerDraft,
  formatCustomRangeLabel,
  getReportsPeriodFilters,
  mapReportsPeriodToApi,
  validateCustomReportRange,
} from "./reportsPeriod";
import { portalEn } from "../translations/portal/en";

const now = new Date("2026-11-17T12:00:00.000Z");

describe("getReportsPeriodFilters", () => {
  it("enables custom without a coming-soon badge", () => {
    const filters = getReportsPeriodFilters(portalEn.reports);

    expect(filters.map((f) => f.id)).toEqual([
      "today",
      "yesterday",
      "week",
      "month",
      "year",
      "all",
      "custom",
    ]);
    expect(filters.find((f) => f.id === "custom")?.disabled).toBeUndefined();
  });
});

describe("mapReportsPeriodToApi", () => {
  it("maps presets without from/to and custom with both dates", () => {
    expect(mapReportsPeriodToApi({ period: "today" })).toEqual({ period: "today" });
    expect(mapReportsPeriodToApi({ period: "week" })).toEqual({
      period: "this_week",
    });
    expect(
      mapReportsPeriodToApi({
        period: "custom",
        from: "2026-11-01",
        to: "2026-11-15",
      }),
    ).toEqual({
      period: "custom",
      from: "2026-11-01",
      to: "2026-11-15",
    });
  });
});

describe("validateCustomReportRange", () => {
  it("accepts a single day and a multi-day range", () => {
    expect(validateCustomReportRange("2026-11-15", "2026-11-15", now)).toEqual({
      ok: true,
      from: "2026-11-15",
      to: "2026-11-15",
    });
    expect(validateCustomReportRange("2026-11-01", "2026-11-15", now).ok).toBe(
      true,
    );
  });

  it("blocks apply without dates, inverted ranges, future dates, and oversized spans", () => {
    const missing = validateCustomReportRange("", "", now);
    expect(missing.ok).toBe(false);
    if (!missing.ok) expect(missing.code).toBe("invalid_custom_range");

    const inverted = validateCustomReportRange("2026-11-16", "2026-11-15", now);
    expect(inverted.ok).toBe(false);
    if (!inverted.ok) expect(inverted.code).toBe("invalid_range_order");

    const future = validateCustomReportRange("2026-11-18", "2026-11-18", now);
    expect(future.ok).toBe(false);
    if (!future.ok) expect(future.code).toBe("future_date_not_allowed");

    const oversized = validateCustomReportRange("2024-01-01", "2025-01-01", now);
    expect(oversized.ok).toBe(false);
    if (!oversized.ok) expect(oversized.code).toBe("range_too_large");
  });
});

describe("applyCustomDraft", () => {
  it("prevents apply without a valid range", () => {
    const result = applyCustomDraft("", "", portalEn.reports, now);
    expect(result.ok).toBe(false);
  });

  it("returns an applied custom period for a valid day", () => {
    const result = applyCustomDraft(
      "2026-11-15",
      "2026-11-15",
      portalEn.reports,
      now,
    );
    expect(result).toEqual({
      ok: true,
      applied: { period: "custom", from: "2026-11-15", to: "2026-11-15" },
    });
  });
});

describe("customPickerDraft", () => {
  it("restores the applied custom range and otherwise clears the draft", () => {
    expect(
      customPickerDraft({ period: "custom", from: "2026-11-01", to: "2026-11-15" }),
    ).toEqual({ from: "2026-11-01", to: "2026-11-15" });
    expect(customPickerDraft({ period: "today" })).toEqual({ from: "", to: "" });
  });
});

describe("custom labels and granularity", () => {
  it("formats single-day and range PDF/UI labels", () => {
    expect(formatCustomRangeLabel("2026-11-15", "2026-11-15", "en-GB")).toBe(
      "15 November 2026",
    );
    expect(formatCustomRangeLabel("2026-11-01", "2026-11-15", "en-GB")).toBe(
      "1 November 2026–15 November 2026",
    );
  });

  it("uses hour/day/month grains matching the backend", () => {
    expect(customChartGranularity("2026-11-15", "2026-11-15")).toBe("hour");
    expect(customChartGranularity("2026-11-01", "2026-11-15")).toBe("day");
    expect(customChartGranularity("2026-01-01", "2026-04-01")).toBe("month");
  });
});
