/** Period windows for portal reports (Europe/Berlin). */

import { sql, type SQL } from "drizzle-orm";

import { PORTAL_ORDERS_TIMEZONE } from "./portalOrders.js";

export const REPORTS_TIMEZONE = PORTAL_ORDERS_TIMEZONE;
export const CUSTOM_REPORTS_MAX_INCLUSIVE_DAYS = 366;

export type PortalReportsPeriod =
  | "today"
  | "yesterday"
  | "this_week"
  | "7_days"
  | "30_days"
  | "this_month"
  | "12_months"
  | "this_year"
  | "all_time";

export type PortalReportsPeriodResponse = PortalReportsPeriod | "custom";

export type PortalReportsWindow =
  | { kind: "preset"; period: PortalReportsPeriod }
  | { kind: "custom"; period: "custom"; from: string; to: string };

export type SalesPeriodInput = PortalReportsPeriod | PortalReportsWindow;

export type PortalReportsQueryErrorCode =
  | "invalid_custom_range"
  | "invalid_date"
  | "invalid_range_order"
  | "range_too_large"
  | "future_date_not_allowed";

export class PortalReportsQueryError extends Error {
  readonly code: PortalReportsQueryErrorCode;
  readonly statusCode = 400;

  constructor(code: PortalReportsQueryErrorCode, message: string) {
    super(message);
    this.name = "PortalReportsQueryError";
    this.code = code;
  }
}

const VALID_PERIODS = new Set<string>([
  "today",
  "yesterday",
  "this_week",
  "7_days",
  "30_days",
  "this_month",
  "12_months",
  "this_year",
  "all_time",
]);

const ISO_DATE = /^(\d{4})-(\d{2})-(\d{2})$/;

export function parsePortalReportsPeriod(
  raw: string | undefined,
): PortalReportsPeriod {
  const value = (raw ?? "today").trim().toLowerCase();
  if (VALID_PERIODS.has(value)) {
    return value as PortalReportsPeriod;
  }
  return "today";
}

export function asReportWindow(period: SalesPeriodInput): PortalReportsWindow {
  if (typeof period === "object" && period && "kind" in period) {
    return period;
  }
  return { kind: "preset", period };
}

export function calendarDateInTimeZone(
  instant: Date,
  timeZone: string = REPORTS_TIMEZONE,
): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(instant);
}

export function reportsTodayIso(now: Date = new Date()): string {
  return calendarDateInTimeZone(now, REPORTS_TIMEZONE);
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

export function enumerateIsoDates(fromIso: string, toIso: string): string[] {
  const days = inclusiveCalendarDays(fromIso, toIso);
  if (days <= 0) return [];
  const dates: string[] = [];
  const [year, month, day] = fromIso.split("-").map(Number);
  const cursor = new Date(Date.UTC(year, month - 1, day));
  for (let i = 0; i < days; i++) {
    dates.push(cursor.toISOString().slice(0, 10));
    cursor.setUTCDate(cursor.getUTCDate() + 1);
  }
  return dates;
}

export function enumerateYearMonthKeys(fromIso: string, toIso: string): string[] {
  const dates = enumerateIsoDates(fromIso, toIso);
  const keys: string[] = [];
  const seen = new Set<string>();
  for (const date of dates) {
    const key = `${date.slice(0, 7)}-01`;
    if (seen.has(key)) continue;
    seen.add(key);
    keys.push(key);
  }
  return keys;
}

function readSingleQueryParam(
  value: unknown,
  field: "from" | "to",
): string {
  if (value == null || value === "") {
    throw new PortalReportsQueryError(
      "invalid_custom_range",
      `Custom reports require both from and to (${field} is missing).`,
    );
  }
  if (Array.isArray(value)) {
    if (value.length !== 1) {
      throw new PortalReportsQueryError(
        "invalid_custom_range",
        `Query parameter ${field} must be provided exactly once.`,
      );
    }
    return readSingleQueryParam(value[0], field);
  }
  if (typeof value !== "string") {
    throw new PortalReportsQueryError(
      "invalid_date",
      `Query parameter ${field} must be an ISO calendar date (YYYY-MM-DD).`,
    );
  }
  return value;
}

export function parseCustomReportRange(
  fromRaw: string,
  toRaw: string,
  now: Date = new Date(),
): { from: string; to: string } {
  const from = parseIsoCalendarDate(fromRaw);
  const to = parseIsoCalendarDate(toRaw);
  if (!from || !to) {
    throw new PortalReportsQueryError(
      "invalid_date",
      "from and to must be valid ISO calendar dates (YYYY-MM-DD).",
    );
  }
  if (from > to) {
    throw new PortalReportsQueryError(
      "invalid_range_order",
      "from must be on or before to.",
    );
  }
  const today = reportsTodayIso(now);
  if (from > today || to > today) {
    throw new PortalReportsQueryError(
      "future_date_not_allowed",
      "Custom report dates cannot be in the future.",
    );
  }
  const days = inclusiveCalendarDays(from, to);
  if (days > CUSTOM_REPORTS_MAX_INCLUSIVE_DAYS) {
    throw new PortalReportsQueryError(
      "range_too_large",
      `Custom reports are limited to ${CUSTOM_REPORTS_MAX_INCLUSIVE_DAYS} inclusive calendar days.`,
    );
  }
  return { from, to };
}

function readPeriodQueryParam(value: unknown): string | undefined {
  if (value == null || value === "") return undefined;
  if (Array.isArray(value)) {
    if (value.length === 0) return undefined;
    if (value.length !== 1) {
      throw new PortalReportsQueryError(
        "invalid_custom_range",
        "Query parameter period must be provided exactly once.",
      );
    }
    return readPeriodQueryParam(value[0]);
  }
  if (typeof value !== "string") {
    throw new PortalReportsQueryError(
      "invalid_custom_range",
      "Query parameter period must be a single period name.",
    );
  }
  return value.trim().toLowerCase();
}

export function parsePortalReportsSummaryQuery(
  query: { period?: unknown; from?: unknown; to?: unknown },
  now: Date = new Date(),
): PortalReportsWindow {
  const periodValue = readPeriodQueryParam(query.period) ?? "today";

  if (periodValue === "custom") {
    const from = readSingleQueryParam(query.from, "from");
    const to = readSingleQueryParam(query.to, "to");
    const range = parseCustomReportRange(from, to, now);
    return { kind: "custom", period: "custom", from: range.from, to: range.to };
  }

  return {
    kind: "preset",
    period: parsePortalReportsPeriod(periodValue),
  };
}

/** PostgreSQL filter: timestamp column falls within the selected period in Europe/Berlin. */
export function sqlInPeriodBerlin(
  column: unknown,
  period: PortalReportsPeriod,
): SQL {
  const tz = PORTAL_ORDERS_TIMEZONE;
  const localDate = sql`(${column} AT TIME ZONE ${tz})::date`;
  const today = sql`(NOW() AT TIME ZONE ${tz})::date`;

  switch (period) {
    case "today":
      return sql`${localDate} = ${today}`;
    case "yesterday":
      return sql`${localDate} = (${today} - interval '1 day')`;
    case "this_week":
      return sql`${localDate} >= date_trunc('week', ${today})::date`;
    case "7_days":
      return sql`${localDate} >= (${today} - interval '6 days')`;
    case "30_days":
      return sql`${localDate} >= (${today} - interval '29 days')`;
    case "this_month":
      return sql`${localDate} >= date_trunc('month', ${today})::date`;
    case "12_months":
      return sql`${column} AT TIME ZONE ${tz} >= (NOW() AT TIME ZONE ${tz}) - interval '12 months'`;
    case "this_year":
      return sql`${localDate} >= date_trunc('year', ${today})::date`;
    case "all_time":
      return sql`true`;
  }
}

/**
 * Inclusive start-of-from through exclusive start-of-(to+1) in the reports timezone.
 * Parameterized dates — never concatenate user input into SQL.
 */
export function sqlInReportWindow(
  column: unknown,
  window: PortalReportsWindow,
): SQL {
  if (window.kind === "preset") {
    return sqlInPeriodBerlin(column, window.period);
  }
  const tz = PORTAL_ORDERS_TIMEZONE;
  return sql`${column} >= (${window.from}::date::timestamp AT TIME ZONE ${tz})
    AND ${column} < ((${window.to}::date + 1)::timestamp AT TIME ZONE ${tz})`;
}

export type RevenueSeriesGranularity = "hour" | "day" | "month";

export function revenueSeriesGranularity(
  period: PortalReportsPeriod,
): RevenueSeriesGranularity {
  switch (period) {
    case "today":
    case "yesterday":
      return "hour";
    case "7_days":
    case "30_days":
    case "this_week":
    case "this_month":
      return "day";
    case "12_months":
    case "this_year":
    case "all_time":
      return "month";
  }
}

export function revenueSeriesGranularityForWindow(
  window: PortalReportsWindow,
): RevenueSeriesGranularity {
  if (window.kind === "preset") {
    return revenueSeriesGranularity(window.period);
  }
  const days = inclusiveCalendarDays(window.from, window.to);
  if (days <= 1) return "hour";
  if (days <= 62) return "day";
  return "month";
}
