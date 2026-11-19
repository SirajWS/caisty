import type { PortalTranslations } from "../translations/portal";
import {
  formatCustomRangeLabel,
  getReportsPeriodLabel,
  mapReportsPeriodToApi,
  type AppliedReportsPeriod,
  type ReportsPeriodId,
} from "../reports/reportsPeriod";

export type ReceiptsPeriodId = ReportsPeriodId;
export type ReceiptsSortId = "newest" | "oldest";
export type ReceiptsPaymentFilter = "all" | "cash" | "card" | "voucher" | "other";
export type ReceiptsStatusFilter =
  | "all"
  | "active"
  | "refunded"
  | "partial_refund"
  | "voided";

export type AppliedReceiptsPeriod = AppliedReportsPeriod;

export const DEFAULT_RECEIPTS_PERIOD: ReceiptsPeriodId = "today";
export const DEFAULT_APPLIED_RECEIPTS_PERIOD: AppliedReceiptsPeriod = {
  period: "today",
};
export const DEFAULT_RECEIPTS_SORT: ReceiptsSortId = "newest";

export function mapReceiptsPeriodToApi(
  applied: AppliedReceiptsPeriod,
): { period: string; from?: string; to?: string } {
  return mapReportsPeriodToApi(applied);
}

export function getReceiptsPeriodLabel(
  applied: AppliedReceiptsPeriod,
  r: PortalTranslations["receipts"],
  reports: PortalTranslations["reports"],
  locale = "en",
): string {
  if (applied.period === "today") return r.kpiReceiptsToday;
  if (applied.period === "custom") {
    return `${r.kpiReceiptsPeriod} — ${formatCustomRangeLabel(applied.from, applied.to, locale)}`;
  }
  return `${r.kpiReceiptsPeriod} — ${getReportsPeriodLabel(applied.period, reports, undefined, locale)}`;
}

export function getReceiptsCountKpiLabel(
  period: string,
  r: PortalTranslations["receipts"],
  reports: PortalTranslations["reports"],
  range?: { from?: string; to?: string },
  locale = "en",
): string {
  if (period === "today") return r.kpiReceiptsToday;
  if (period === "custom" && range?.from && range.to) {
    return `${r.kpiReceiptsPeriod} — ${formatCustomRangeLabel(range.from, range.to, locale)}`;
  }
  const uiPeriod =
    period === "this_week"
      ? "week"
      : period === "this_month"
        ? "month"
        : period === "all_time"
          ? "all"
          : period === "yesterday"
            ? "yesterday"
            : "custom";
  if (uiPeriod === "custom") return r.kpiReceiptsPeriod;
  return `${r.kpiReceiptsPeriod} — ${getReportsPeriodLabel(uiPeriod, reports, undefined, locale)}`;
}

export type ReceiptsPeriodFilterOption = {
  id: ReceiptsPeriodId;
  label: string;
  disabled?: boolean;
  hint?: string;
};

export function getReceiptsPeriodFilters(
  reports: PortalTranslations["reports"],
): ReceiptsPeriodFilterOption[] {
  return [
    { id: "today" as const, label: reports.filterToday },
    { id: "yesterday" as const, label: reports.filterYesterday },
    { id: "week" as const, label: reports.filterThisWeek },
    { id: "month" as const, label: reports.filterThisMonth },
    { id: "all" as const, label: reports.revenueRanges.allTime },
    { id: "custom" as const, label: reports.filterCustom },
  ];
}

export function isIncompatibleCustomReceiptsResponse(
  applied: AppliedReceiptsPeriod,
  page: { period: string; from?: string; to?: string },
): boolean {
  if (applied.period !== "custom") return false;
  if (page.period !== "custom") return true;
  return page.from !== applied.from || page.to !== applied.to;
}
