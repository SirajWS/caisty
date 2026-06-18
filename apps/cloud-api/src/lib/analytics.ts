import { sql, type SQL } from "drizzle-orm";
import { invoices } from "../db/schema/invoices.js";
import { subscriptions } from "../db/schema/subscriptions.js";

/** Paid revenue only — real invoices, never payments/subscriptions. */
export const PAID_INVOICE_SQL: SQL = sql`(
  ${invoices.status} = 'paid'
  OR ${invoices.paidAt} IS NOT NULL
) AND lower(coalesce(${invoices.status}, '')) NOT IN ('open', 'draft', 'canceled', 'cancelled')`;

export function invoiceGrossCentsSql(): SQL {
  return sql`coalesce(${invoices.amountGrossCents}, ${invoices.amountCents}, 0)`;
}

export const ACTIVE_SUBSCRIPTION_SQL: SQL = sql`lower(${subscriptions.status}) = 'active'
  AND lower(${subscriptions.plan}) IN ('starter', 'pro')`;

/** Monthly recurring value for one subscription row. */
export function subscriptionMrrCentsSql(): SQL {
  return sql`CASE
    WHEN lower(coalesce(${subscriptions.billingPeriod}, 'monthly')) = 'yearly'
      THEN round(${subscriptions.priceCents}::numeric / 12.0)
    ELSE ${subscriptions.priceCents}
  END`;
}

export type AnalyticsPreset = "7d" | "30d" | "12m" | "ytd" | "year" | "all" | "custom";

export type DateRange = { from: Date; to: Date; preset: AnalyticsPreset };

export function parseAnalyticsPreset(
  raw?: string,
): AnalyticsPreset {
  const p = (raw ?? "30d").toLowerCase();
  if (p === "year") return "ytd";
  if (["7d", "30d", "12m", "ytd", "all", "custom"].includes(p)) {
    return p as AnalyticsPreset;
  }
  return "30d";
}

export function resolveDateRange(
  preset: AnalyticsPreset,
  fromStr?: string,
  toStr?: string,
): DateRange {
  const to = toStr ? endOfDay(new Date(toStr)) : endOfDay(new Date());
  let from: Date;

  switch (preset) {
    case "7d":
      from = startOfDay(addDays(to, -6));
      break;
    case "30d":
      from = startOfDay(addDays(to, -29));
      break;
    case "12m":
      from = startOfDay(addMonths(to, -11));
      break;
    case "ytd":
      from = new Date(to.getFullYear(), 0, 1, 0, 0, 0, 0);
      break;
    case "all":
      from = new Date(2000, 0, 1, 0, 0, 0, 0);
      break;
    case "custom":
      from = fromStr
        ? startOfDay(new Date(fromStr))
        : startOfDay(addDays(to, -29));
      break;
    default:
      from = startOfDay(addDays(to, -29));
  }

  return { from, to, preset };
}

export type Granularity = "day" | "week" | "month";

export function parseGranularity(
  preset: AnalyticsPreset,
  raw?: string,
): Granularity {
  if (raw === "day" || raw === "week" || raw === "month") return raw;
  if (preset === "7d" || preset === "30d") return "day";
  if (preset === "12m" || preset === "ytd") return "month";
  return "month";
}

function startOfDay(d: Date): Date {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

function endOfDay(d: Date): Date {
  const x = new Date(d);
  x.setHours(23, 59, 59, 999);
  return x;
}

function addDays(d: Date, days: number): Date {
  const x = new Date(d);
  x.setDate(x.getDate() + days);
  return x;
}

function addMonths(d: Date, months: number): Date {
  const x = new Date(d);
  x.setMonth(x.getMonth() + months);
  return x;
}

export function paidInvoiceDateSql(): SQL {
  return sql`coalesce(${invoices.paidAt}, ${invoices.issuedAt})`;
}

/** Composable filter for raw analytics queries (invoices table). */
export const PAID_REVENUE_STATUS_FILTER = sql`
  (status = 'paid' OR paid_at IS NOT NULL)
  AND lower(coalesce(status, '')) NOT IN ('open', 'draft', 'canceled', 'cancelled')
`;

export const PAID_REVENUE_INVOICE_I_FILTER = sql`
  (i.status = 'paid' OR i.paid_at IS NOT NULL)
  AND lower(coalesce(i.status, '')) NOT IN ('open', 'draft', 'canceled', 'cancelled')
`;
