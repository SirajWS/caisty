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

export type ReportsPresetId = Exclude<ReportsPeriodId, "custom">;

export type AppliedReportsPeriod =
  | { period: ReportsPresetId }
  | { period: "custom"; from: string; to: string };

export const DEFAULT_REPORTS_PERIOD: ReportsPeriodId = "today";
export const DEFAULT_APPLIED_REPORTS_PERIOD: AppliedReportsPeriod = {
  period: "today",
};
export const REPORTS_TIMEZONE = "Europe/Berlin";
export const CUSTOM_REPORTS_MAX_INCLUSIVE_DAYS = 366;

const ISO_DATE = /^(\d{4})-(\d{2})-(\d{2})$/;

export type CustomRangeErrorCode =
  | "invalid_custom_range"
  | "invalid_date"
  | "invalid_range_order"
  | "range_too_large"
  | "future_date_not_allowed";

export function reportsTodayIso(now: Date = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: REPORTS_TIMEZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now);
}

export function parseIsoCalendarDate(raw: string): string | null {
  const trimmed = raw.trim();
  const match = ISO_DATE.exec(trimmed);
  if (!match) return null;
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const utc = new Date(Date.UTC(year, month - 1, day));
  if (
    utc.getUTCFullYear() !== year ||
    utc.getUTCMonth() !== month - 1 ||
    utc.getUTCDate() !== day
  ) {
    return null;
  }
  return `${String(year).padStart(4, "0")}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

export function inclusiveCalendarDays(fromIso: string, toIso: string): number {
  const from = Date.parse(`${fromIso}T00:00:00.000Z`);
  const to = Date.parse(`${toIso}T00:00:00.000Z`);
  return Math.floor((to - from) / 86_400_000) + 1;
}

export function validateCustomReportRange(
  fromRaw: string,
  toRaw: string,
  now: Date = new Date(),
): { ok: true; from: string; to: string } | { ok: false; code: CustomRangeErrorCode } {
  if (!fromRaw.trim() || !toRaw.trim()) {
    return { ok: false, code: "invalid_custom_range" };
  }
  const from = parseIsoCalendarDate(fromRaw);
  const to = parseIsoCalendarDate(toRaw);
  if (!from || !to) return { ok: false, code: "invalid_date" };
  if (from > to) return { ok: false, code: "invalid_range_order" };
  const today = reportsTodayIso(now);
  if (from > today || to > today) return { ok: false, code: "future_date_not_allowed" };
  if (inclusiveCalendarDays(from, to) > CUSTOM_REPORTS_MAX_INCLUSIVE_DAYS) {
    return { ok: false, code: "range_too_large" };
  }
  return { ok: true, from, to };
}

export function customRangeErrorMessage(
  code: CustomRangeErrorCode,
  r: PortalTranslations["reports"],
): string {
  switch (code) {
    case "invalid_date":
      return r.filterInvalidDate;
    case "invalid_range_order":
      return r.filterInvalidRange;
    case "range_too_large":
      return r.filterRangeTooLarge;
    case "future_date_not_allowed":
      return r.filterFutureDate;
    default:
      return r.filterInvalidCustom;
  }
}

export function getReportsPeriodLabel(
  period: ReportsPeriodId,
  r: PortalTranslations["reports"],
  range?: { from: string; to: string },
  locale = "en",
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
      if (range?.from && range.to) {
        return formatCustomRangeLabel(range.from, range.to, locale);
      }
      return r.filterCustom;
  }
}

export function formatCustomRangeLabel(
  fromIso: string,
  toIso: string,
  locale: string,
): string {
  const from = formatIsoDateLabel(fromIso, locale);
  if (fromIso === toIso) return from;
  return `${from}–${formatIsoDateLabel(toIso, locale)}`;
}

export function formatIsoDateLabel(iso: string, locale: string): string {
  const parsed = parseIsoCalendarDate(iso);
  if (!parsed) return iso;
  const [year, month, day] = parsed.split("-").map(Number);
  return new Intl.DateTimeFormat(locale, {
    year: "numeric",
    month: "long",
    day: "numeric",
    timeZone: "UTC",
  }).format(new Date(Date.UTC(year, month - 1, day)));
}

export function appliedPeriodLabel(
  applied: AppliedReportsPeriod,
  r: PortalTranslations["reports"],
  locale: string,
): string {
  if (applied.period === "custom") {
    return formatCustomRangeLabel(applied.from, applied.to, locale);
  }
  return getReportsPeriodLabel(applied.period, r, undefined, locale);
}

/** Map UI period filter to GET /portal/reports/summary query values. */
export function mapReportsPeriodToApi(
  applied: AppliedReportsPeriod,
): { period: string; from?: string; to?: string } {
  switch (applied.period) {
    case "today":
      return { period: "today" };
    case "yesterday":
      return { period: "yesterday" };
    case "week":
      return { period: "this_week" };
    case "7d":
      return { period: "7_days" };
    case "30d":
      return { period: "30_days" };
    case "month":
      return { period: "this_month" };
    case "12m":
      return { period: "12_months" };
    case "year":
      return { period: "this_year" };
    case "all":
      return { period: "all_time" };
    case "custom":
      return { period: "custom", from: applied.from, to: applied.to };
  }
}

export type ReportsPeriodFilterOption = {
  id: ReportsPeriodId;
  label: string;
  disabled?: boolean;
  hint?: string;
};

export function getReportsPeriodFilters(
  r: PortalTranslations["reports"],
): ReportsPeriodFilterOption[] {
  return [
    { id: "today", label: r.filterToday },
    { id: "yesterday", label: r.filterYesterday },
    { id: "week", label: r.filterThisWeek },
    { id: "month", label: r.filterThisMonth },
    { id: "year", label: r.filterThisYear },
    { id: "all", label: r.revenueRanges.allTime },
    { id: "custom", label: r.filterCustom },
  ];
}

export function customSpanDays(from: string, to: string): number {
  return inclusiveCalendarDays(from, to);
}

export function customChartGranularity(from: string, to: string): "hour" | "day" | "month" {
  const days = inclusiveCalendarDays(from, to);
  if (days <= 1) return "hour";
  if (days <= 62) return "day";
  return "month";
}

export function customPickerDraft(applied: AppliedReportsPeriod): {
  from: string;
  to: string;
} {
  if (applied.period === "custom") {
    return { from: applied.from, to: applied.to };
  }
  return { from: "", to: "" };
}

export function applyCustomDraft(
  from: string,
  to: string,
  r: PortalTranslations["reports"],
  now?: Date,
): { ok: true; applied: AppliedReportsPeriod } | { ok: false; error: string } {
  const result = validateCustomReportRange(from, to, now);
  if (!result.ok) {
    return { ok: false, error: customRangeErrorMessage(result.code, r) };
  }
  return {
    ok: true,
    applied: { period: "custom", from: result.from, to: result.to },
  };
}

export function isReportsPeriodId(value: string): value is ReportsPeriodId {
  return (
    value === "today" ||
    value === "yesterday" ||
    value === "week" ||
    value === "month" ||
    value === "year" ||
    value === "all" ||
    value === "custom"
  );
}
