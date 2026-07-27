import { and, eq } from "drizzle-orm";

import { db } from "../db/client.js";
import { devices } from "../db/schema/devices.js";
import {
  posOrderLines,
  posOrders,
  posReceipts,
} from "../db/schema/posSync.js";
import {
  aggregateEffectivePaymentSummary,
  aggregatePaymentSummary,
  orderLinesLookupKey,
  PORTAL_ORDERS_TIMEZONE,
  type OnlinePaymentSummaryCents,
  type PaymentBucket,
} from "./portalOrders.js";
import { isProviderOrder } from "./orderSource.js";
import {
  dedupeProviderOrders,
  type ProviderOrderDedupFields,
} from "./dedupeProviderOrders.js";
import {
  averageOrderMinor,
  fetchPaymentsForSalesPeriod,
  fetchPortalSalesPeriodStats,
} from "./portalSalesSummary.js";
import {
  parsePortalReportsPeriod,
  revenueSeriesGranularity,
  sqlInPeriodBerlin,
  type PortalReportsPeriod,
  type RevenueSeriesGranularity,
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
  /** Same split as Dashboard/Orders — from fetchPortalSalesPeriodStats. */
  posRevenueCents: number;
  onlineRevenueCents: number;
  liveOrdersCount: number;
  onlineOrdersCount: number;
  revenueSeries: PortalReportsRevenuePoint[];
  salesByHour: PortalReportsHourlyPoint[];
  paymentMethods: PortalReportsPaymentMethods;
  onlinePaymentSummary: OnlinePaymentSummaryCents & { currency: string };
  topProducts: PortalReportsTopProduct[];
  topEmployees: [];
  taxes: PortalReportsTaxes;
  businessTrends: PortalReportsBusinessTrends;
};

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

function averageOrderMinorLocal(revenueMinor: number, ordersCount: number): number {
  return averageOrderMinor(revenueMinor, ordersCount);
}

function formatHourLabel(hour: number): string {
  return `${String(hour).padStart(2, "0")}:00`;
}

function formatBucketLabel(
  bucketStart: string,
  granularity: RevenueSeriesGranularity,
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

export type ReportOrderAggregateRow = ProviderOrderDedupFields & {
  deviceId: string;
  localOrderId: string;
};

export type ReportReceiptAggregateRow = {
  deviceId: string;
  localOrderId: string | null;
  orderId: string | null;
  platform: string | null;
  soldAt: Date | string;
  grossCents: number;
  netCents: number;
  taxCents: number;
  status: string | null;
  fiscalStatus: string | null;
};

export type ReportOrderLineAggregateRow = {
  orderId: string;
  productName: string | null;
  quantity: number;
  lineTotalCents: number;
};

/** Live POS rows + provider winners (central dedupeProviderOrders). */
export function selectReportOrderWinners<T extends ReportOrderAggregateRow>(
  rows: readonly T[],
): T[] {
  const live = rows.filter((row) => !isProviderOrder(row.platform));
  const provider = rows.filter((row) => isProviderOrder(row.platform));
  return [...live, ...dedupeProviderOrders(provider)];
}

export function reportWinnerOrderIds(
  winners: readonly ReportOrderAggregateRow[],
): Set<string> {
  return new Set(winners.map((row) => row.id));
}

export function reportWinnerOrderKeys(
  winners: readonly ReportOrderAggregateRow[],
): Set<string> {
  return new Set(
    winners.map((row) => orderLinesLookupKey(row.deviceId, row.localOrderId)),
  );
}

/** Orphan/live receipts always count; provider receipts only for winner device+order. */
export function receiptIncludedInReportAggregates(
  receipt: Pick<
    ReportReceiptAggregateRow,
    "orderId" | "platform" | "deviceId" | "localOrderId"
  >,
  winnerKeys: Set<string>,
): boolean {
  if (!receipt.orderId) return true;
  if (!isProviderOrder(receipt.platform)) return true;
  if (!receipt.localOrderId) return false;
  return winnerKeys.has(
    orderLinesLookupKey(receipt.deviceId, receipt.localOrderId),
  );
}

export function receiptContributesToKpis(status: string | null | undefined): boolean {
  const normalized = (status ?? "active").trim().toLowerCase();
  return (
    normalized !== "refunded" &&
    normalized !== "partial_refund" &&
    normalized !== "voided"
  );
}

export function getBerlinDateParts(value: Date | string): {
  year: number;
  month: number;
  day: number;
  hour: number;
} {
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) {
    return { year: 1970, month: 1, day: 1, hour: 0 };
  }
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: PORTAL_ORDERS_TIMEZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    hour12: false,
  }).formatToParts(date);
  const read = (type: Intl.DateTimeFormatPartTypes): string =>
    parts.find((part) => part.type === type)?.value ?? "0";
  let hour = Number(read("hour"));
  if (hour === 24) hour = 0;
  return {
    year: Number(read("year")),
    month: Number(read("month")),
    day: Number(read("day")),
    hour,
  };
}

export function berlinHourBucket(value: Date | string): number {
  return getBerlinDateParts(value).hour;
}

export function berlinDayBucketKey(value: Date | string): string {
  const parts = getBerlinDateParts(value);
  return `${String(parts.year).padStart(4, "0")}-${String(parts.month).padStart(2, "0")}-${String(parts.day).padStart(2, "0")}`;
}

export function berlinMonthBucketKey(value: Date | string): string {
  const parts = getBerlinDateParts(value);
  return `${String(parts.year).padStart(4, "0")}-${String(parts.month).padStart(2, "0")}-01`;
}

function incrementCount(map: Map<string | number, number>, key: string | number) {
  map.set(key, (map.get(key) ?? 0) + 1);
}

function addAmount(map: Map<string | number, number>, key: string | number, amount: number) {
  map.set(key, (map.get(key) ?? 0) + amount);
}

export function countOrdersByBerlinHour(
  winners: readonly { soldAt: Date | string | null | undefined }[],
): Map<number, number> {
  const counts = new Map<number, number>();
  for (const row of winners) {
    if (row.soldAt == null) continue;
    incrementCount(counts, berlinHourBucket(row.soldAt));
  }
  return counts;
}

export function countOrdersByBerlinDay(
  winners: readonly { soldAt: Date | string | null | undefined }[],
): Map<string, number> {
  const counts = new Map<string, number>();
  for (const row of winners) {
    if (row.soldAt == null) continue;
    incrementCount(counts, berlinDayBucketKey(row.soldAt));
  }
  return counts;
}

export function countOrdersByBerlinMonth(
  winners: readonly { soldAt: Date | string | null | undefined }[],
): Map<string, number> {
  const counts = new Map<string, number>();
  for (const row of winners) {
    if (row.soldAt == null) continue;
    incrementCount(counts, berlinMonthBucketKey(row.soldAt));
  }
  return counts;
}

export function sumReceiptRevenueByBerlinHour(
  receipts: readonly ReportReceiptAggregateRow[],
  options: { kpiOnly: boolean },
): Map<number, number> {
  const totals = new Map<number, number>();
  for (const row of receipts) {
    if (options.kpiOnly && !receiptContributesToKpis(row.status)) continue;
    addAmount(totals, berlinHourBucket(row.soldAt), row.grossCents);
  }
  return totals;
}

export function sumReceiptRevenueByBerlinDay(
  receipts: readonly ReportReceiptAggregateRow[],
  options: { kpiOnly: boolean },
): Map<string, number> {
  const totals = new Map<string, number>();
  for (const row of receipts) {
    if (options.kpiOnly && !receiptContributesToKpis(row.status)) continue;
    addAmount(totals, berlinDayBucketKey(row.soldAt), row.grossCents);
  }
  return totals;
}

export function sumReceiptRevenueByBerlinMonth(
  receipts: readonly ReportReceiptAggregateRow[],
  options: { kpiOnly: boolean },
): Map<string, number> {
  const totals = new Map<string, number>();
  for (const row of receipts) {
    if (options.kpiOnly && !receiptContributesToKpis(row.status)) continue;
    addAmount(totals, berlinMonthBucketKey(row.soldAt), row.grossCents);
  }
  return totals;
}

export function aggregateReportTaxStats(
  receipts: readonly ReportReceiptAggregateRow[],
): {
  net: number;
  vat: number;
  largest: number;
  fiscalCount: number;
} {
  let net = 0;
  let vat = 0;
  let largest = 0;
  let fiscalCount = 0;
  for (const row of receipts) {
    if (!receiptContributesToKpis(row.status)) continue;
    net += row.netCents;
    vat += row.taxCents;
    if (row.grossCents > largest) largest = row.grossCents;
    const fiscal = (row.fiscalStatus ?? "").trim().toLowerCase();
    if (fiscal && fiscal !== "pending") fiscalCount += 1;
  }
  return { net, vat, largest, fiscalCount };
}

export function aggregateTopProductsFromWinnerLines(
  lines: readonly ReportOrderLineAggregateRow[],
  winnerOrderIds: Set<string>,
  limit = 10,
): PortalReportsTopProduct[] {
  const byName = new Map<string, { quantity: number; revenueMinor: number }>();
  for (const line of lines) {
    if (!winnerOrderIds.has(line.orderId)) continue;
    const name = line.productName?.trim() || "—";
    const current = byName.get(name) ?? { quantity: 0, revenueMinor: 0 };
    current.quantity += line.quantity;
    current.revenueMinor += line.lineTotalCents;
    byName.set(name, current);
  }
  return [...byName.entries()]
    .map(([productName, stats]) => ({
      productName,
      quantity: stats.quantity,
      revenueMinor: stats.revenueMinor,
      category: null,
    }))
    .sort((a, b) => b.revenueMinor - a.revenueMinor || a.productName.localeCompare(b.productName))
    .slice(0, limit);
}

export function buildRevenueSeriesFromBuckets(input: {
  granularity: RevenueSeriesGranularity;
  revenueByHour: Map<number, number>;
  ordersByHour: Map<number, number>;
  revenueByDay: Map<string, number>;
  ordersByDay: Map<string, number>;
  revenueByMonth: Map<string, number>;
  ordersByMonth: Map<string, number>;
}): PortalReportsRevenuePoint[] {
  const { granularity } = input;
  if (granularity === "hour") {
    const hours = [...new Set([...input.revenueByHour.keys(), ...input.ordersByHour.keys()])].sort(
      (a, b) => a - b,
    );
    return hours.map((hour) => {
      const bucketStart = new Date(Date.UTC(1970, 0, 1, hour, 0, 0)).toISOString();
      return {
        label: formatHourLabel(hour),
        bucketStart,
        revenueMinor: input.revenueByHour.get(hour) ?? 0,
        ordersCount: input.ordersByHour.get(hour) ?? 0,
      };
    });
  }
  if (granularity === "day") {
    const days = [...new Set([...input.revenueByDay.keys(), ...input.ordersByDay.keys()])].sort();
    return days.map((day) => {
      const bucketStart = new Date(`${day}T00:00:00.000Z`).toISOString();
      return {
        label: formatBucketLabel(bucketStart, granularity),
        bucketStart,
        revenueMinor: input.revenueByDay.get(day) ?? 0,
        ordersCount: input.ordersByDay.get(day) ?? 0,
      };
    });
  }
  const months = [...new Set([...input.revenueByMonth.keys(), ...input.ordersByMonth.keys()])].sort();
  return months.map((month) => {
    const bucketStart = new Date(`${month}T00:00:00.000Z`).toISOString();
    return {
      label: formatBucketLabel(bucketStart, granularity),
      bucketStart,
      revenueMinor: input.revenueByMonth.get(month) ?? 0,
      ordersCount: input.ordersByMonth.get(month) ?? 0,
    };
  });
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
  posRevenueCents: number;
  onlineRevenueCents: number;
  liveOrdersCount: number;
  onlineOrdersCount: number;
  revenueSeries: PortalReportsRevenuePoint[];
  salesByHour: PortalReportsHourlyPoint[];
  paymentMethods: PortalReportsPaymentMethods;
  onlinePaymentSummary: OnlinePaymentSummaryCents & { currency: string };
  topProducts: PortalReportsTopProduct[];
  taxes: PortalReportsTaxes;
  businessTrends: PortalReportsBusinessTrends;
}): PortalReportsSummaryData {
  const hasSalesData =
    input.overview.ordersCount > 0 ||
    input.overview.receiptsCount > 0 ||
    input.overview.revenueMinor > 0 ||
    input.posRevenueCents > 0 ||
    input.onlineRevenueCents > 0;

  return {
    timezone: PORTAL_ORDERS_TIMEZONE,
    period: input.period,
    hasSalesData,
    overview: input.overview,
    posRevenueCents: input.posRevenueCents,
    onlineRevenueCents: input.onlineRevenueCents,
    liveOrdersCount: input.liveOrdersCount,
    onlineOrdersCount: input.onlineOrdersCount,
    revenueSeries: input.revenueSeries,
    salesByHour: input.salesByHour,
    paymentMethods: input.paymentMethods,
    onlinePaymentSummary: input.onlinePaymentSummary,
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

  const [periodStats, paymentRows, orderRows, receiptRows, topProductLineRows] =
    await Promise.all([
      fetchPortalSalesPeriodStats({ orgId, customerId, period }),
      fetchPaymentsForSalesPeriod({ orgId, customerId, period }),
      db
        .select({
          id: posOrders.id,
          deviceId: posOrders.deviceId,
          localOrderId: posOrders.localOrderId,
          platform: posOrders.platform,
          providerOrderId: posOrders.providerOrderId,
          status: posOrders.status,
          updatedAt: posOrders.updatedAt,
          soldAt: posOrders.soldAt,
        })
        .from(posOrders)
        .innerJoin(devices, eq(posOrders.deviceId, devices.id))
        .where(orderScope(orgId, customerId, period)),
      db
        .select({
          deviceId: posReceipts.deviceId,
          localOrderId: posReceipts.localOrderId,
          orderId: posOrders.id,
          platform: posOrders.platform,
          soldAt: posReceipts.soldAt,
          grossCents: posReceipts.grossCents,
          netCents: posReceipts.netCents,
          taxCents: posReceipts.taxCents,
          status: posReceipts.status,
          fiscalStatus: posReceipts.fiscalStatus,
        })
        .from(posReceipts)
        .innerJoin(devices, eq(posReceipts.deviceId, devices.id))
        .leftJoin(
          posOrders,
          and(
            eq(posReceipts.orgId, posOrders.orgId),
            eq(posReceipts.deviceId, posOrders.deviceId),
            eq(posReceipts.localOrderId, posOrders.localOrderId),
          ),
        )
        .where(receiptScope(orgId, customerId, period)),
      db
        .select({
          orderId: posOrders.id,
          productName: posOrderLines.productName,
          quantity: posOrderLines.quantity,
          lineTotalCents: posOrderLines.lineTotalCents,
        })
        .from(posOrderLines)
        .innerJoin(posOrders, eq(posOrderLines.orderId, posOrders.id))
        .innerJoin(devices, eq(posOrders.deviceId, devices.id))
        .where(orderScope(orgId, customerId, period)),
    ]);

  const winners = selectReportOrderWinners(orderRows);
  const winnerOrderIds = reportWinnerOrderIds(winners);
  const winnerKeys = reportWinnerOrderKeys(winners);

  const includedReceipts = receiptRows.filter((row) =>
    receiptIncludedInReportAggregates(row, winnerKeys),
  );

  const taxStats = aggregateReportTaxStats(includedReceipts);
  const currency = periodStats.currency;

  const ordersCount = periodStats.ordersCount;
  const receiptsCount = periodStats.receiptsCount;
  const revenueMinor = periodStats.revenueCents;
  const vatMinor = taxStats.vat;
  const netRevenueMinor = taxStats.net;
  const grossRevenueMinor = revenueMinor;
  const largestReceiptMinor = taxStats.largest;
  const fiscalReceiptsCount = taxStats.fiscalCount;

  const paymentSummary = aggregateEffectivePaymentSummary(paymentRows);

  const ordersByHour = countOrdersByBerlinHour(winners);
  const ordersByDay = countOrdersByBerlinDay(winners);
  const ordersByMonth = countOrdersByBerlinMonth(winners);

  const kpiRevenueByHour = sumReceiptRevenueByBerlinHour(includedReceipts, {
    kpiOnly: true,
  });
  const kpiRevenueByDay = sumReceiptRevenueByBerlinDay(includedReceipts, {
    kpiOnly: true,
  });
  const kpiRevenueByMonth = sumReceiptRevenueByBerlinMonth(includedReceipts, {
    kpiOnly: true,
  });
  // salesByHour historically summed all receipt gross (not KPI-filtered).
  const allRevenueByHour = sumReceiptRevenueByBerlinHour(includedReceipts, {
    kpiOnly: false,
  });

  const revenueSeries = buildRevenueSeriesFromBuckets({
    granularity,
    revenueByHour: kpiRevenueByHour,
    ordersByHour,
    revenueByDay: kpiRevenueByDay,
    ordersByDay,
    revenueByMonth: kpiRevenueByMonth,
    ordersByMonth,
  });

  const salesByHour = fillSalesByHour24(
    Array.from({ length: 24 }, (_, hour) => ({
      hour,
      revenueMinor: allRevenueByHour.get(hour) ?? 0,
      ordersCount: ordersByHour.get(hour) ?? 0,
    })),
  );

  const topProducts = aggregateTopProductsFromWinnerLines(
    topProductLineRows,
    winnerOrderIds,
  );

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
    refundsCount: periodStats.refundsCount,
    averageOrderMinor: averageOrderMinorLocal(
      revenueMinor,
      periodStats.kpiReceiptsCount,
    ),
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
    posRevenueCents: periodStats.posRevenueCents,
    onlineRevenueCents: periodStats.onlineRevenueCents,
    liveOrdersCount: periodStats.liveOrdersCount,
    onlineOrdersCount: periodStats.onlineOrdersCount,
    revenueSeries,
    salesByHour,
    paymentMethods,
    onlinePaymentSummary: {
      ...periodStats.onlinePaymentSummary,
      currency: periodStats.onlinePaymentSummary.currency || currency,
    },
    topProducts,
    taxes,
    businessTrends,
  });
}
