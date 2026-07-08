/** Period windows for portal reports (Europe/Berlin). */

import { sql, type SQL } from "drizzle-orm";

import { PORTAL_ORDERS_TIMEZONE } from "./portalOrders.js";

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

export function parsePortalReportsPeriod(
  raw: string | undefined,
): PortalReportsPeriod {
  const value = (raw ?? "today").trim().toLowerCase();
  if (VALID_PERIODS.has(value)) {
    return value as PortalReportsPeriod;
  }
  return "today";
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
