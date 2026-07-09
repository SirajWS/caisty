import { describe, expect, it } from "vitest";
import { getReportsPeriodFilters } from "./reportsPeriod";
import { portalEn } from "../translations/portal/en";

describe("getReportsPeriodFilters", () => {
  it("shows the simplified period options only", () => {
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
  });

  it("keeps custom disabled until backend supports date ranges", () => {
    const custom = getReportsPeriodFilters(portalEn.reports).find(
      (f) => f.id === "custom",
    );

    expect(custom?.disabled).toBe(true);
    expect(custom?.hint).toBe(portalEn.reports.filterCustomHint);
  });
});
