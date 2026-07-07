import type { PortalTranslations } from "../translations/portal";

/** UI-only period control — shared across Reports analytics blocks. */
export type ReportsPeriodId =
  | "today"
  | "yesterday"
  | "week"
  | "7d"
  | "30d"
  | "month"
  | "12m"
  | "year"
  | "all"
  | "custom";

export const DEFAULT_REPORTS_PERIOD: ReportsPeriodId = "today";

export function getReportsPeriodLabel(
  period: ReportsPeriodId,
  r: PortalTranslations["reports"],
): string {
  switch (period) {
    case "today":
      return r.filterToday;
    case "yesterday":
      return r.filterYesterday;
    case "week":
      return r.filterThisWeek;
    case "7d":
      return r.revenueRanges.days7;
    case "30d":
      return r.revenueRanges.days30;
    case "month":
      return r.filterThisMonth;
    case "12m":
      return r.revenueRanges.months12;
    case "year":
      return r.filterThisYear;
    case "all":
      return r.revenueRanges.allTime;
    case "custom":
      return r.filterCustom;
  }
}

export function getReportsPeriodFilters(
  r: PortalTranslations["reports"],
): { id: ReportsPeriodId; label: string }[] {
  return [
    { id: "today", label: r.filterToday },
    { id: "yesterday", label: r.filterYesterday },
    { id: "week", label: r.filterThisWeek },
    { id: "7d", label: r.revenueRanges.days7 },
    { id: "30d", label: r.revenueRanges.days30 },
    { id: "month", label: r.filterThisMonth },
    { id: "12m", label: r.revenueRanges.months12 },
    { id: "year", label: r.filterThisYear },
    { id: "all", label: r.revenueRanges.allTime },
    { id: "custom", label: r.filterCustom },
  ];
}
