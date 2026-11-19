import { describe, expect, it } from "vitest";

import { resolveReceiptsReportWindow } from "../portalReceiptsPage.js";
import {
  parsePortalReportsSummaryQuery,
  PortalReportsQueryError,
  sqlInReportWindow,
} from "../portalReportsPeriod.js";

const now = new Date("2026-11-17T12:00:00.000Z");

describe("resolveReceiptsReportWindow", () => {
  it("accepts a single calendar day and a multi-day custom window", () => {
    expect(
      resolveReceiptsReportWindow({
        period: "custom",
        from: "2026-11-15",
        to: "2026-11-15",
      }),
    ).toEqual({
      kind: "custom",
      period: "custom",
      from: "2026-11-15",
      to: "2026-11-15",
    });
    expect(
      resolveReceiptsReportWindow({
        period: "custom",
        from: "2026-11-01",
        to: "2026-11-15",
      }),
    ).toEqual({
      kind: "custom",
      period: "custom",
      from: "2026-11-01",
      to: "2026-11-15",
    });
  });

  it("does not map custom to today or 30_days", () => {
    expect(() =>
      resolveReceiptsReportWindow({ period: "custom" }),
    ).toThrow(PortalReportsQueryError);
    const window = resolveReceiptsReportWindow({
      period: "custom",
      from: "2026-11-01",
      to: "2026-11-15",
    });
    expect(window.period).not.toBe("30_days");
    expect(window.period).not.toBe("today");
  });

  it("keeps existing receipt presets unchanged", () => {
    expect(resolveReceiptsReportWindow({ period: "today" })).toEqual({
      kind: "preset",
      period: "today",
    });
    expect(resolveReceiptsReportWindow({ period: "yesterday" })).toEqual({
      kind: "preset",
      period: "yesterday",
    });
    expect(resolveReceiptsReportWindow({ period: "this_week" })).toEqual({
      kind: "preset",
      period: "this_week",
    });
    expect(resolveReceiptsReportWindow({ period: "this_month" })).toEqual({
      kind: "preset",
      period: "this_month",
    });
    expect(resolveReceiptsReportWindow({ period: "all_time" })).toEqual({
      kind: "preset",
      period: "all_time",
    });
    expect(resolveReceiptsReportWindow({})).toEqual({
      kind: "preset",
      period: "today",
    });
  });

  it("rejects invalid dates, inverted ranges, future dates, and ranges over 366 days", () => {
    expect(() =>
      resolveReceiptsReportWindow({
        period: "custom",
        from: "2026-02-31",
        to: "2026-02-31",
      }),
    ).toThrow(PortalReportsQueryError);
    try {
      resolveReceiptsReportWindow({
        period: "custom",
        from: "2026-11-16",
        to: "2026-11-15",
      });
    } catch (err) {
      expect((err as PortalReportsQueryError).code).toBe("invalid_range_order");
    }
    try {
      resolveReceiptsReportWindow({
        period: "custom",
        from: "2099-01-01",
        to: "2099-01-01",
      });
    } catch (err) {
      expect((err as PortalReportsQueryError).code).toBe(
        "future_date_not_allowed",
      );
    }
    try {
      resolveReceiptsReportWindow({
        period: "custom",
        from: "2024-01-01",
        to: "2025-01-02",
      });
    } catch (err) {
      expect((err as PortalReportsQueryError).code).toBe("range_too_large");
    }
  });

  it("allows exactly 366 inclusive days", () => {
    expect(
      resolveReceiptsReportWindow({
        period: "custom",
        from: "2024-01-01",
        to: "2024-12-31",
      }),
    ).toEqual({
      kind: "custom",
      period: "custom",
      from: "2024-01-01",
      to: "2024-12-31",
    });
  });

  it("rejects duplicate query parameters via the shared parser", () => {
    expect(() =>
      parsePortalReportsSummaryQuery(
        {
          period: "custom",
          from: ["2026-11-01", "2026-11-02"],
          to: "2026-11-15",
        },
        now,
      ),
    ).toThrow(PortalReportsQueryError);
  });

  it("does not take tenant identifiers from the query string", () => {
    const window = resolveReceiptsReportWindow({
      period: "custom",
      from: "2026-11-01",
      to: "2026-11-01",
    });
    expect(JSON.stringify(window)).not.toContain("orgId");
    expect(JSON.stringify(window)).not.toContain("customerId");
  });
});

describe("receipts custom SQL window", () => {
  it("uses inclusive from and exclusive start of the following day in Europe/Berlin", () => {
    const sql = sqlInReportWindow("sold_at", {
      kind: "custom",
      period: "custom",
      from: "2026-03-29",
      to: "2026-10-25",
    });
    const serialized = JSON.stringify(sql);
    expect(serialized).toContain("2026-03-29");
    expect(serialized).toContain("2026-10-25");
    expect(serialized).toMatch(/\+ 1/);
    expect(serialized).toMatch(/AT TIME ZONE/i);
  });
});
