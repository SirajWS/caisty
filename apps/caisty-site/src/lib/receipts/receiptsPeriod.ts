import type { PortalTranslations } from "../translations/portal";
import {
  getReportsPeriodLabel,
  mapReportsPeriodToApi,
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

export const DEFAULT_RECEIPTS_PERIOD: ReceiptsPeriodId = "today";
export const DEFAULT_RECEIPTS_SORT: ReceiptsSortId = "newest";

export function mapReceiptsPeriodToApi(period: ReceiptsPeriodId): string {
  return mapReportsPeriodToApi(period);
}

export function getReceiptsPeriodLabel(
  period: ReceiptsPeriodId,
  r: PortalTranslations["receipts"],
  reports: PortalTranslations["reports"],
): string {
  if (period === "today") return r.kpiReceiptsToday;
  return `${r.kpiReceiptsPeriod} — ${getReportsPeriodLabel(period, reports)}`;
}

export function getReceiptsPeriodFilters(
  reports: PortalTranslations["reports"],
) {
  return [
    { id: "today" as const, label: reports.filterToday },
    { id: "yesterday" as const, label: reports.filterYesterday },
    { id: "week" as const, label: reports.filterThisWeek },
    { id: "month" as const, label: reports.filterThisMonth },
    { id: "all" as const, label: reports.revenueRanges.allTime },
    {
      id: "custom" as const,
      label: reports.filterCustom,
      disabled: true,
      hint: reports.filterCustomHint,
    },
  ];
}
