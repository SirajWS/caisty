import { describe, expect, it } from "vitest";

import {
  CUSTOM_REPORTS_MAX_INCLUSIVE_DAYS,
  calendarDateInTimeZone,
  enumerateIsoDates,
  enumerateYearMonthKeys,
  inclusiveCalendarDays,
  parseCustomReportRange,
  parseIsoCalendarDate,
  parsePortalReportsPeriod,
  parsePortalReportsSummaryQuery,
  PortalReportsQueryError,
  reportsTodayIso,
  revenueSeriesGranularity,
  revenueSeriesGranularityForWindow,
  sqlInPeriodBerlin,
  sqlInReportWindow,
} from "../portalReportsPeriod.js";

const noonUtc = (isoDate: string) => new Date(`${isoDate}T12:00:00.000Z`);

describe("parsePortalReportsPeriod", () => {
  it("leaves presets unchanged and still falls unknown values back to today", () => {
    expect(parsePortalReportsPeriod("today")).toBe("today");
    expect(parsePortalReportsPeriod("this_week")).toBe("this_week");
    expect(parsePortalReportsPeriod("all_time")).toBe("all_time");
    expect(parsePortalReportsPeriod("custom")).toBe("today");
    expect(parsePortalReportsPeriod("invalid")).toBe("today");
  });
});

describe("parseIsoCalendarDate", () => {
  it("accepts valid ISO dates and rejects impossible calendars", () => {
    expect(parseIsoCalendarDate("2026-11-15")).toBe("2026-11-15");
    expect(parseIsoCalendarDate(" 2026-01-01 ")).toBe("2026-01-01");
    expect(parseIsoCalendarDate("2026-02-31")).toBeNull();
    expect(parseIsoCalendarDate("15.11.2026")).toBeNull();
    expect(parseIsoCalendarDate("2026-11-15T00:00:00Z")).toBeNull();
  });
});

describe("inclusiveCalendarDays / enumerate", () => {
  it("counts inclusive days across month and year boundaries", () => {
    expect(inclusiveCalendarDays("2026-11-15", "2026-11-15")).toBe(1);
    expect(inclusiveCalendarDays("2026-11-01", "2026-11-15")).toBe(15);
    expect(inclusiveCalendarDays("2026-01-31", "2026-02-01")).toBe(2);
    expect(inclusiveCalendarDays("2025-12-31", "2026-01-01")).toBe(2);
    expect(inclusiveCalendarDays("2026-01-01", "2026-12-31")).toBe(365);
  });

  it("enumerates dates and year-month keys without inventing sales", () => {
    expect(enumerateIsoDates("2026-11-14", "2026-11-16")).toEqual([
      "2026-11-14",
      "2026-11-15",
      "2026-11-16",
    ]);
    expect(enumerateYearMonthKeys("2026-11-15", "2027-01-02")).toEqual([
      "2026-11-01",
      "2026-12-01",
      "2027-01-01",
    ]);
  });
});

describe("parseCustomReportRange", () => {
  const now = noonUtc("2026-11-17");

  it("accepts a single day and a multi-day range", () => {
    expect(parseCustomReportRange("2026-11-15", "2026-11-15", now)).toEqual({
      from: "2026-11-15",
      to: "2026-11-15",
    });
    expect(parseCustomReportRange("2026-11-01", "2026-11-15", now)).toEqual({
      from: "2026-11-01",
      to: "2026-11-15",
    });
  });

  it("rejects missing-equivalent invalid dates, order, future dates, and oversized ranges", () => {
    expect(() => parseCustomReportRange("nope", "2026-11-15", now)).toThrow(
      PortalReportsQueryError,
    );
    try {
      parseCustomReportRange("2026-11-16", "2026-11-15", now);
    } catch (err) {
      expect(err).toBeInstanceOf(PortalReportsQueryError);
      expect((err as PortalReportsQueryError).code).toBe("invalid_range_order");
    }
    try {
      parseCustomReportRange("2026-11-18", "2026-11-18", now);
    } catch (err) {
      expect((err as PortalReportsQueryError).code).toBe("future_date_not_allowed");
    }
    try {
      parseCustomReportRange("2025-01-01", "2026-01-02", now);
    } catch (err) {
      expect((err as PortalReportsQueryError).code).toBe("range_too_large");
    }
  });

  it("allows exactly 366 inclusive days and rejects 367", () => {
    const from = "2024-01-01";
    const to366 = "2024-12-31";
    expect(inclusiveCalendarDays(from, to366)).toBe(366);
    expect(parseCustomReportRange(from, to366, noonUtc("2026-11-17"))).toEqual({
      from,
      to: to366,
    });
    expect(CUSTOM_REPORTS_MAX_INCLUSIVE_DAYS).toBe(366);
    expect(() =>
      parseCustomReportRange("2024-01-01", "2025-01-01", now),
    ).toThrowError(/366/);
  });
});

describe("parsePortalReportsSummaryQuery", () => {
  const now = noonUtc("2026-11-17");

  it("parses presets without requiring from/to", () => {
    expect(
      parsePortalReportsSummaryQuery({ period: "this_month" }, now),
    ).toEqual({ kind: "preset", period: "this_month" });
    expect(parsePortalReportsSummaryQuery({}, now)).toEqual({
      kind: "preset",
      period: "today",
    });
  });

  it("does not silently map custom to today or 30_days", () => {
    try {
      parsePortalReportsSummaryQuery({ period: "custom" }, now);
      throw new Error("expected throw");
    } catch (err) {
      expect(err).toBeInstanceOf(PortalReportsQueryError);
      expect((err as PortalReportsQueryError).code).toBe("invalid_custom_range");
      expect((err as PortalReportsQueryError).statusCode).toBe(400);
    }
  });

  it("parses custom from/to and rejects duplicate parameters", () => {
    expect(
      parsePortalReportsSummaryQuery(
        { period: "custom", from: "2026-11-01", to: "2026-11-15" },
        now,
      ),
    ).toEqual({
      kind: "custom",
      period: "custom",
      from: "2026-11-01",
      to: "2026-11-15",
    });
    expect(() =>
      parsePortalReportsSummaryQuery(
        { period: "custom", from: ["2026-11-01", "2026-11-02"], to: "2026-11-15" },
        now,
      ),
    ).toThrow(PortalReportsQueryError);
  });

  it("unwraps a single period array and never treats ambiguous custom as today", () => {
    expect(
      parsePortalReportsSummaryQuery(
        { period: ["custom"], from: "2026-11-15", to: "2026-11-15" },
        now,
      ),
    ).toEqual({
      kind: "custom",
      period: "custom",
      from: "2026-11-15",
      to: "2026-11-15",
    });
    expect(
      parsePortalReportsSummaryQuery({ period: ["this_week"] }, now),
    ).toEqual({ kind: "preset", period: "this_week" });
    try {
      parsePortalReportsSummaryQuery(
        { period: ["custom", "today"], from: "2026-11-15", to: "2026-11-15" },
        now,
      );
      throw new Error("expected throw");
    } catch (err) {
      expect(err).toBeInstanceOf(PortalReportsQueryError);
      expect((err as PortalReportsQueryError).code).toBe("invalid_custom_range");
    }
  });

  it("ignores extra from/to on presets so existing clients keep working", () => {
    expect(
      parsePortalReportsSummaryQuery(
        { period: "today", from: "2026-11-01", to: "2026-11-15" },
        now,
      ),
    ).toEqual({ kind: "preset", period: "today" });
  });

  it("does not take tenant identifiers from the query string", () => {
    const window = parsePortalReportsSummaryQuery(
      {
        period: "custom",
        from: "2026-11-01",
        to: "2026-11-01",
        orgId: "other-org",
        customerId: "other-customer",
      } as { period: string; from: string; to: string },
      now,
    );
    expect(window).toEqual({
      kind: "custom",
      period: "custom",
      from: "2026-11-01",
      to: "2026-11-01",
    });
    expect(JSON.stringify(window)).not.toContain("other-org");
  });
});

describe("revenueSeriesGranularityForWindow", () => {
  it("keeps preset granularities", () => {
    expect(revenueSeriesGranularity("today")).toBe("hour");
    expect(revenueSeriesGranularity("this_month")).toBe("day");
    expect(revenueSeriesGranularity("all_time")).toBe("month");
  });

  it("uses hour/day/month for custom spans", () => {
    expect(
      revenueSeriesGranularityForWindow({
        kind: "custom",
        period: "custom",
        from: "2026-11-15",
        to: "2026-11-15",
      }),
    ).toBe("hour");
    expect(
      revenueSeriesGranularityForWindow({
        kind: "custom",
        period: "custom",
        from: "2026-11-01",
        to: "2026-11-15",
      }),
    ).toBe("day");
    expect(
      revenueSeriesGranularityForWindow({
        kind: "custom",
        period: "custom",
        from: "2026-01-01",
        to: "2026-04-01",
      }),
    ).toBe("month");
  });
});

describe("sqlInReportWindow", () => {
  it("reuses preset SQL and parameterizes custom bounds with timezone conversion", () => {
    const preset = sqlInPeriodBerlin("sold_at", "today");
    const viaWindow = sqlInReportWindow("sold_at", {
      kind: "preset",
      period: "today",
    });
    expect(viaWindow).toEqual(preset);

    const custom = sqlInReportWindow("sold_at", {
      kind: "custom",
      period: "custom",
      from: "2026-11-01",
      to: "2026-11-15",
    });
    const serialized = JSON.stringify(custom);
    expect(serialized).toMatch(/AT TIME ZONE/i);
    expect(serialized).toContain("2026-11-01");
    expect(serialized).toContain("2026-11-15");
  });
});

describe("reports timezone calendar", () => {
  it("formats Europe/Berlin calendar dates across CET/CEST", () => {
    expect(calendarDateInTimeZone(new Date("2026-01-15T23:30:00.000Z"))).toBe(
      "2026-01-16",
    );
    expect(calendarDateInTimeZone(new Date("2026-07-15T21:30:00.000Z"))).toBe(
      "2026-07-15",
    );
    expect(reportsTodayIso(new Date("2026-03-29T01:30:00.000Z"))).toBe(
      "2026-03-29",
    );
    expect(reportsTodayIso(new Date("2026-10-25T00:30:00.000Z"))).toBe(
      "2026-10-25",
    );
  });
});
