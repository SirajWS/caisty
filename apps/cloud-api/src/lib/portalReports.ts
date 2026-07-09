import { and, desc, eq, sql, type AnyColumn } from "drizzle-orm";

import { db } from "../db/client.js";
import { devices } from "../db/schema/devices.js";
import {
  posOrderLines,
  posOrders,
  posReceipts,
  posSalePayments,
} from "../db/schema/posSync.js";
import {
  aggregatePaymentSummary,
  PORTAL_ORDERS_TIMEZONE,
  type PaymentBucket,
} from "./portalOrders.js";
import {
  parsePortalReportsPeriod,
  revenueSeriesGranularity,
  sqlInPeriodBerlin,
  type PortalReportsPeriod,
} from "./portalReportsPeriod.js";

export type { PortalReportsPeriod };
export { parsePortalReportsPeriod };

export type PortalReportsOverview = {
  revenueMinor: number;
  ordersCount: number;
  receiptsCount: number;
  refundsCount: number;
  averageOrderMinor: number;
  vatMinor: number;
  currency: string;
};

export type PortalReportsRevenuePoint = {
  label: string;
  bucketStart: string;
  revenueMinor: number;
  ordersCount: number;
};

export type PortalReportsHourlyPoint = {
  hour: number;
  revenueMinor: number;
  ordersCount: number;
};

export type PortalReportsPaymentMethods = {
  cashMinor: number;
  cardMinor: number;
  voucherMinor: number;
  otherMinor: number;
  currency: string;
};

export type PortalReportsTopProduct = {
  productName: string;
  quantity: number;
  revenueMinor: number;
  category: string | null;
};

export type PortalReportsTaxes = {
  netRevenueMinor: number;
  vatMinor: number;
  grossRevenueMinor: number;
  fiscalReceiptsCount: number;
  currency: string;
};

export type PortalReportsBusinessTrends = {
  bestSalesDay: string | null;
  bestSalesHour: string | null;
  largestReceiptMinor: number;
  mostUsedPayment: string | null;
  mostSoldProduct: string | null;
  currency: string;
};

export type PortalReportsSummaryData = {
  timezone: string;
  period: PortalReportsPeriod;
  hasSalesData: boolean;
  overview: PortalReportsOverview;
  revenueSeries: PortalReportsRevenuePoint[];
  salesByHour: PortalReportsHourlyPoint[];
  paymentMethods: PortalReportsPaymentMethods;
  topProducts: PortalReportsTopProduct[];
  topEmployees: [];
  taxes: PortalReportsTaxes;
  businessTrends: PortalReportsBusinessTrends;
};

/**
 * Berlin TZ as SQL literal for GROUP BY / ORDER BY expressions.
 * Drizzle binds `${tz}` separately per clause ($1, $2, …); PostgreSQL 16 then
 * rejects SELECT vs GROUP BY as non-matching ("sold_at must appear in GROUP BY").
 */
const berlinTzSql = sql.raw(`'${PORTAL_ORDERS_TIMEZONE}'`);

function soldAtBerlinHour(column: AnyColumn) {
  return sql`extract(hour from ${column} AT TIME ZONE ${berlinTzSql})::int`;
}

function soldAtBerlinDate(column: AnyColumn) {
  return sql`(${column} AT TIME ZONE ${berlinTzSql})::date`;
}

function soldAtBerlinMonth(column: AnyColumn) {
  return sql`date_trunc('month', ${column} AT TIME ZONE ${berlinTzSql})::date`;
}

function customerDeviceScope(orgId: string, customerId: string) {
  return and(eq(devices.orgId, orgId), eq(devices.customerId, customerId));
}

function receiptScope(
  orgId: string,
  customerId: string,
  period: PortalReportsPeriod,
) {
  return and(
    eq(posReceipts.orgId, orgId),
    customerDeviceScope(orgId, customerId),
    sqlInPeriodBerlin(posReceipts.soldAt, period),
  );
}

function orderScope(
  orgId: string,
  customerId: string,
  period: PortalReportsPeriod,
) {
  return and(
    eq(posOrders.orgId, orgId),
    customerDeviceScope(orgId, customerId),
    sqlInPeriodBerlin(posOrders.soldAt, period),
  );
}

function paymentScope(
  orgId: string,
  customerId: string,
  period: PortalReportsPeriod,
) {
  return and(
    eq(posSalePayments.orgId, orgId),
    customerDeviceScope(orgId, customerId),
    sqlInPeriodBerlin(posSalePayments.paidAt, period),
  );
}

function averageOrderMinor(revenueMinor: number, ordersCount: number): number {
  if (ordersCount <= 0) return 0;
  return Math.round(revenueMinor / ordersCount);
}

function formatHourLabel(hour: number): string {
  return `${String(hour).padStart(2, "0")}:00`;
}

function formatBucketLabel(
  bucketStart: string,
  granularity: ReturnType<typeof revenueSeriesGranularity>,
): string {
  const date = new Date(bucketStart);
  if (Number.isNaN(date.getTime())) return bucketStart;
  if (granularity === "hour") {
    return formatHourLabel(date.getUTCHours());
  }
  if (granularity === "month") {
    return date.toISOString().slice(0, 7);
  }
  return date.toISOString().slice(0, 10);
}

function pickCurrency(
  rows: Array<{ currency?: string | null }>,
  fallback = "EUR",
): string {
  for (const row of rows) {
    if (row.currency?.trim()) return row.currency.trim().toUpperCase();
  }
  return fallback;
}

function paymentBucketLabel(bucket: PaymentBucket): string {
  switch (bucket) {
    case "cash":
      return "cash";
    case "card":
      return "card";
    case "voucher":
      return "voucher";
    default:
      return "other";
  }
}

function pickMostUsedPayment(summary: ReturnType<typeof aggregatePaymentSummary>): string | null {
  const entries: Array<[PaymentBucket, number]> = [
    ["cash", summary.cashCents],
    ["card", summary.cardCents],
    ["voucher", summary.voucherCents],
    ["other", summary.otherCents],
  ];
  let best: PaymentBucket | null = null;
  let bestValue = 0;
  for (const [bucket, value] of entries) {
    if (value > bestValue) {
      bestValue = value;
      best = bucket;
    }
  }
  return best ? paymentBucketLabel(best) : null;
}

export function fillSalesByHour24(
  points: PortalReportsHourlyPoint[],
): PortalReportsHourlyPoint[] {
  const byHour = new Map(points.map((point) => [point.hour, point]));
  const filled: PortalReportsHourlyPoint[] = [];
  for (let hour = 0; hour <= 23; hour++) {
    filled.push(
      byHour.get(hour) ?? {
        hour,
        revenueMinor: 0,
        ordersCount: 0,
      },
    );
  }
  return filled;
}

export function buildPortalReportsResponse(input: {
  period: PortalReportsPeriod;
  overview: PortalReportsOverview;
  revenueSeries: PortalReportsRevenuePoint[];
  salesByHour: PortalReportsHourlyPoint[];
  paymentMethods: PortalReportsPaymentMethods;
  topProducts: PortalReportsTopProduct[];
  taxes: PortalReportsTaxes;
  businessTrends: PortalReportsBusinessTrends;
}): PortalReportsSummaryData {
  const hasSalesData =
    input.overview.ordersCount > 0 ||
    input.overview.receiptsCount > 0 ||
    input.overview.revenueMinor > 0;

  return {
    timezone: PORTAL_ORDERS_TIMEZONE,
    period: input.period,
    hasSalesData,
    overview: input.overview,
    revenueSeries: input.revenueSeries,
    salesByHour: input.salesByHour,
    paymentMethods: input.paymentMethods,
    topProducts: input.topProducts,
    topEmployees: [],
    taxes: input.taxes,
    businessTrends: input.businessTrends,
  };
}

export async function fetchPortalReportsSummary(input: {
  orgId: string;
  customerId: string;
  period: PortalReportsPeriod;
}): Promise<PortalReportsSummaryData> {
  const { orgId, customerId, period } = input;
  const granularity = revenueSeriesGranularity(period);

  const [orderStats] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(posOrders)
    .innerJoin(devices, eq(posOrders.deviceId, devices.id))
    .where(orderScope(orgId, customerId, period));

  const [receiptStats] = await db
    .select({
      count: sql<number>`count(*)::int`,
      revenue: sql<number>`coalesce(sum(${posReceipts.grossCents}), 0)::int`,
      net: sql<number>`coalesce(sum(${posReceipts.netCents}), 0)::int`,
      vat: sql<number>`coalesce(sum(${posReceipts.taxCents}), 0)::int`,
      largest: sql<number>`coalesce(max(${posReceipts.grossCents}), 0)::int`,
      fiscalCount: sql<number>`count(*) filter (where ${posReceipts.fiscalStatus} is distinct from 'pending')::int`,
    })
    .from(posReceipts)
    .innerJoin(devices, eq(posReceipts.deviceId, devices.id))
    .where(receiptScope(orgId, customerId, period));

  const paymentRows = await db
    .select({
      method: posSalePayments.method,
      amountCents: posSalePayments.amountCents,
      currency: posSalePayments.currency,
    })
    .from(posSalePayments)
    .innerJoin(devices, eq(posSalePayments.deviceId, devices.id))
    .where(paymentScope(orgId, customerId, period));

  const [currencyRow] = await db
    .select({ currency: posReceipts.currency })
    .from(posReceipts)
    .innerJoin(devices, eq(posReceipts.deviceId, devices.id))
    .where(receiptScope(orgId, customerId, period))
    .orderBy(desc(posReceipts.soldAt))
    .limit(1);

  const currency = pickCurrency(
    [
      currencyRow ?? {},
      ...paymentRows,
      ...(orderStats ? [{ currency: null }] : []),
    ],
    "EUR",
  );

  const ordersCount = orderStats?.count ?? 0;
  const receiptsCount = receiptStats?.count ?? 0;
  const revenueMinor = receiptStats?.revenue ?? 0;
  const vatMinor = receiptStats?.vat ?? 0;
  const netRevenueMinor = receiptStats?.net ?? 0;
  const grossRevenueMinor = revenueMinor;
  const largestReceiptMinor = receiptStats?.largest ?? 0;
  const fiscalReceiptsCount = receiptStats?.fiscalCount ?? 0;

  const paymentSummary = aggregatePaymentSummary(paymentRows);

  let revenueSeries: PortalReportsRevenuePoint[] = [];
  if (granularity === "hour") {
    const receiptHourExpr = soldAtBerlinHour(posReceipts.soldAt);
    const rows = await db
      .select({
        hour: receiptHourExpr,
        revenue: sql<number>`coalesce(sum(${posReceipts.grossCents}), 0)::int`,
      })
      .from(posReceipts)
      .innerJoin(devices, eq(posReceipts.deviceId, devices.id))
      .where(receiptScope(orgId, customerId, period))
      .groupBy(receiptHourExpr)
      .orderBy(receiptHourExpr);

    const orderHourExpr = soldAtBerlinHour(posOrders.soldAt);
    const orderHourRows = await db
      .select({
        hour: orderHourExpr,
        count: sql<number>`count(*)::int`,
      })
      .from(posOrders)
      .innerJoin(devices, eq(posOrders.deviceId, devices.id))
      .where(orderScope(orgId, customerId, period))
      .groupBy(orderHourExpr);

    const ordersByHour = new Map(
      orderHourRows.map((row) => [row.hour, row.count]),
    );

    revenueSeries = rows.map((row) => {
      const bucketStart = new Date(Date.UTC(1970, 0, 1, row.hour, 0, 0)).toISOString();
      return {
        label: formatHourLabel(row.hour),
        bucketStart,
        revenueMinor: row.revenue,
        ordersCount: ordersByHour.get(row.hour) ?? 0,
      };
    });
  } else if (granularity === "day") {
    const receiptDayExpr = soldAtBerlinDate(posReceipts.soldAt);
    const rows = await db
      .select({
        bucket: receiptDayExpr,
        revenue: sql<number>`coalesce(sum(${posReceipts.grossCents}), 0)::int`,
      })
      .from(posReceipts)
      .innerJoin(devices, eq(posReceipts.deviceId, devices.id))
      .where(receiptScope(orgId, customerId, period))
      .groupBy(receiptDayExpr)
      .orderBy(receiptDayExpr);

    const orderDayExpr = soldAtBerlinDate(posOrders.soldAt);
    const orderDayRows = await db
      .select({
        bucket: orderDayExpr,
        count: sql<number>`count(*)::int`,
      })
      .from(posOrders)
      .innerJoin(devices, eq(posOrders.deviceId, devices.id))
      .where(orderScope(orgId, customerId, period))
      .groupBy(orderDayExpr);

    const ordersByDay = new Map(
      orderDayRows.map((row) => [String(row.bucket), row.count]),
    );

    revenueSeries = rows.map((row) => {
      const bucketStart = new Date(`${row.bucket}T00:00:00.000Z`).toISOString();
      return {
        label: formatBucketLabel(bucketStart, granularity),
        bucketStart,
        revenueMinor: row.revenue,
        ordersCount: ordersByDay.get(String(row.bucket)) ?? 0,
      };
    });
  } else {
    const receiptMonthExpr = soldAtBerlinMonth(posReceipts.soldAt);
    const rows = await db
      .select({
        bucket: receiptMonthExpr,
        revenue: sql<number>`coalesce(sum(${posReceipts.grossCents}), 0)::int`,
      })
      .from(posReceipts)
      .innerJoin(devices, eq(posReceipts.deviceId, devices.id))
      .where(receiptScope(orgId, customerId, period))
      .groupBy(receiptMonthExpr)
      .orderBy(receiptMonthExpr);

    const orderMonthExpr = soldAtBerlinMonth(posOrders.soldAt);
    const orderMonthRows = await db
      .select({
        bucket: orderMonthExpr,
        count: sql<number>`count(*)::int`,
      })
      .from(posOrders)
      .innerJoin(devices, eq(posOrders.deviceId, devices.id))
      .where(orderScope(orgId, customerId, period))
      .groupBy(orderMonthExpr);

    const ordersByMonth = new Map(
      orderMonthRows.map((row) => [String(row.bucket), row.count]),
    );

    revenueSeries = rows.map((row) => {
      const bucketStart = new Date(`${row.bucket}T00:00:00.000Z`).toISOString();
      return {
        label: formatBucketLabel(bucketStart, granularity),
        bucketStart,
        revenueMinor: row.revenue,
        ordersCount: ordersByMonth.get(String(row.bucket)) ?? 0,
      };
    });
  }

  const receiptHourlyExpr = soldAtBerlinHour(posReceipts.soldAt);
  const hourlyReceiptRows = await db
    .select({
      hour: receiptHourlyExpr,
      revenue: sql<number>`coalesce(sum(${posReceipts.grossCents}), 0)::int`,
    })
    .from(posReceipts)
    .innerJoin(devices, eq(posReceipts.deviceId, devices.id))
    .where(receiptScope(orgId, customerId, period))
    .groupBy(receiptHourlyExpr);

  const orderHourlyExpr = soldAtBerlinHour(posOrders.soldAt);
  const hourlyOrderRows = await db
    .select({
      hour: orderHourlyExpr,
      count: sql<number>`count(*)::int`,
    })
    .from(posOrders)
    .innerJoin(devices, eq(posOrders.deviceId, devices.id))
    .where(orderScope(orgId, customerId, period))
    .groupBy(orderHourlyExpr);

  const revenueByHour = new Map(
    hourlyReceiptRows.map((row) => [row.hour, row.revenue]),
  );
  const ordersByHour = new Map(
    hourlyOrderRows.map((row) => [row.hour, row.count]),
  );

  const salesByHour = fillSalesByHour24(
    Array.from({ length: 24 }, (_, hour) => ({
      hour,
      revenueMinor: revenueByHour.get(hour) ?? 0,
      ordersCount: ordersByHour.get(hour) ?? 0,
    })),
  );

  const topProductRows = await db
    .select({
      productName: posOrderLines.productName,
      quantity: sql<number>`coalesce(sum(${posOrderLines.quantity}), 0)::int`,
      revenue: sql<number>`coalesce(sum(${posOrderLines.lineTotalCents}), 0)::int`,
    })
    .from(posOrderLines)
    .innerJoin(posOrders, eq(posOrderLines.orderId, posOrders.id))
    .innerJoin(devices, eq(posOrders.deviceId, devices.id))
    .where(orderScope(orgId, customerId, period))
    .groupBy(posOrderLines.productName)
    .orderBy(sql`coalesce(sum(${posOrderLines.lineTotalCents}), 0) desc`)
    .limit(10);

  const topProducts: PortalReportsTopProduct[] = topProductRows.map((row) => ({
    productName: row.productName?.trim() || "—",
    quantity: row.quantity,
    revenueMinor: row.revenue,
    category: null,
  }));

  const bestSeriesPoint = revenueSeries.reduce<PortalReportsRevenuePoint | null>(
    (best, point) => {
      if (!best || point.revenueMinor > best.revenueMinor) return point;
      return best;
    },
    null,
  );

  const bestHourPoint = salesByHour.reduce<PortalReportsHourlyPoint | null>(
    (best, point) => {
      if (!best || point.revenueMinor > best.revenueMinor) return point;
      return best;
    },
    null,
  );

  const overview: PortalReportsOverview = {
    revenueMinor,
    ordersCount,
    receiptsCount,
    refundsCount: 0,
    averageOrderMinor: averageOrderMinor(revenueMinor, ordersCount),
    vatMinor,
    currency,
  };

  const paymentMethods: PortalReportsPaymentMethods = {
    cashMinor: paymentSummary.cashCents,
    cardMinor: paymentSummary.cardCents,
    voucherMinor: paymentSummary.voucherCents,
    otherMinor: paymentSummary.otherCents,
    currency,
  };

  const taxes: PortalReportsTaxes = {
    netRevenueMinor,
    vatMinor,
    grossRevenueMinor,
    fiscalReceiptsCount,
    currency,
  };

  const businessTrends: PortalReportsBusinessTrends = {
    bestSalesDay: bestSeriesPoint?.label ?? null,
    bestSalesHour: bestHourPoint ? formatHourLabel(bestHourPoint.hour) : null,
    largestReceiptMinor,
    mostUsedPayment: pickMostUsedPayment(paymentSummary),
    mostSoldProduct: topProducts[0]?.productName ?? null,
    currency,
  };

  return buildPortalReportsResponse({
    period,
    overview,
    revenueSeries,
    salesByHour,
    paymentMethods,
    topProducts,
    taxes,
    businessTrends,
  });
}
