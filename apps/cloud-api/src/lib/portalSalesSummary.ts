/**
 * Shared portal sales aggregation (Phase 7 Sprint 3).
 * Single source for dashboard, orders, and reports KPI alignment.
 */

import { and, eq, sql, type SQL } from "drizzle-orm";

import { db } from "../db/client.js";
import { devices } from "../db/schema/devices.js";
import {
  posOrders,
  posReceipts,
  posSalePayments,
} from "../db/schema/posSync.js";
import {
  aggregatePaymentSummary,
  PORTAL_ORDERS_TIMEZONE,
  sqlIsTodayBerlin,
  type PaymentSummaryCents,
} from "./portalOrders.js";
import { POS_NATIVE_PLATFORMS_LIST } from "./orderSource.js";
import {
  sqlInPeriodBerlin,
  type PortalReportsPeriod,
} from "./portalReportsPeriod.js";

export function customerDeviceScope(orgId: string, customerId: string) {
  return and(eq(devices.orgId, orgId), eq(devices.customerId, customerId));
}

/** Receipts that contribute to revenue / receipt KPI counts. */
export function sqlReceiptContributesToKpis(
  statusColumn: typeof posReceipts.status = posReceipts.status,
): SQL {
  return sql`coalesce(${statusColumn}, 'active') not in ('refunded', 'partial_refund', 'voided')`;
}

export function sqlReceiptIsRefunded(
  statusColumn: typeof posReceipts.status = posReceipts.status,
): SQL {
  return sql`coalesce(${statusColumn}, 'active') in ('refunded', 'partial_refund')`;
}

export function averageOrderMinor(revenueMinor: number, ordersCount: number): number {
  if (ordersCount <= 0) return 0;
  return Math.round(revenueMinor / ordersCount);
}

export type PortalSalesPeriodStats = {
  ordersCount: number;
  liveOrdersCount: number;
  onlineOrdersCount: number;
  receiptsCount: number;
  kpiReceiptsCount: number;
  revenueCents: number;
  refundsCount: number;
  currency: string;
  paymentSummary: PaymentSummaryCents;
};

/** SQL predicate matching `isLiveOrderPlatform` / `!isProviderOrder`. */
export function sqlIsLiveOrderPlatform(
  platformColumn: typeof posOrders.platform,
): SQL {
  const nativeList = sql.join(
    POS_NATIVE_PLATFORMS_LIST.map((platform) => sql`${platform}`),
    sql`, `,
  );
  return sql`(
    coalesce(trim(lower(${platformColumn})), '') = ''
    or trim(lower(${platformColumn})) in (${nativeList})
  )`;
}

function receiptPeriodScope(
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

function orderPeriodScope(
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

/**
 * Payments aligned to receipt sold_at when a receipt link exists;
 * otherwise falls back to payment paid_at for the period window.
 */
export async function fetchPaymentsForSalesPeriod(input: {
  orgId: string;
  customerId: string;
  period: PortalReportsPeriod;
}): Promise<Array<{ method: string; amountCents: number; currency: string }>> {
  const { orgId, customerId, period } = input;
  const periodSql = sqlInPeriodBerlin(posReceipts.soldAt, period);
  const paidAtPeriodSql = sqlInPeriodBerlin(posSalePayments.paidAt, period);

  const rows = await db
    .select({
      method: posSalePayments.method,
      amountCents: posSalePayments.amountCents,
      currency: posSalePayments.currency,
    })
    .from(posSalePayments)
    .innerJoin(devices, eq(posSalePayments.deviceId, devices.id))
    .leftJoin(
      posReceipts,
      and(
        eq(posSalePayments.orgId, posReceipts.orgId),
        eq(posSalePayments.deviceId, posReceipts.deviceId),
        eq(posSalePayments.localReceiptId, posReceipts.localReceiptId),
      ),
    )
    .where(
      and(
        eq(posSalePayments.orgId, orgId),
        customerDeviceScope(orgId, customerId),
        sql`(
          (${posReceipts.id} is not null and ${periodSql})
          or (${posReceipts.id} is null and ${paidAtPeriodSql})
        )`,
        sqlReceiptContributesToKpis(posReceipts.status),
      ),
    );

  return rows;
}

export async function fetchPortalSalesPeriodStats(input: {
  orgId: string;
  customerId: string;
  period: PortalReportsPeriod;
}): Promise<PortalSalesPeriodStats> {
  const { orgId, customerId, period } = input;

  const [orderStats] = await db
    .select({
      count: sql<number>`count(*)::int`,
      liveCount: sql<number>`count(*) filter (where ${sqlIsLiveOrderPlatform(posOrders.platform)})::int`,
    })
    .from(posOrders)
    .innerJoin(devices, eq(posOrders.deviceId, devices.id))
    .where(orderPeriodScope(orgId, customerId, period));

  const totalOrders = orderStats?.count ?? 0;
  const liveOrdersCount = orderStats?.liveCount ?? 0;
  const onlineOrdersCount = Math.max(0, totalOrders - liveOrdersCount);

  const [receiptStats] = await db
    .select({
      count: sql<number>`count(*)::int`,
      kpiCount: sql<number>`count(*) filter (where ${sqlReceiptContributesToKpis()})::int`,
      revenue: sql<number>`coalesce(sum(${posReceipts.grossCents}) filter (where ${sqlReceiptContributesToKpis()}), 0)::int`,
      refundsCount: sql<number>`count(*) filter (where ${sqlReceiptIsRefunded()})::int`,
    })
    .from(posReceipts)
    .innerJoin(devices, eq(posReceipts.deviceId, devices.id))
    .where(receiptPeriodScope(orgId, customerId, period));

  const paymentRows = await fetchPaymentsForSalesPeriod({
    orgId,
    customerId,
    period,
  });

  const [currencyRow] = await db
    .select({ currency: posReceipts.currency })
    .from(posReceipts)
    .innerJoin(devices, eq(posReceipts.deviceId, devices.id))
    .where(receiptPeriodScope(orgId, customerId, period))
    .orderBy(sql`${posReceipts.soldAt} desc`)
    .limit(1);

  let currency = currencyRow?.currency?.trim().toUpperCase() ?? "";
  if (!currency) {
    const [orderCurrencyRow] = await db
      .select({ currency: posOrders.currency })
      .from(posOrders)
      .innerJoin(devices, eq(posOrders.deviceId, devices.id))
      .where(orderPeriodScope(orgId, customerId, period))
      .orderBy(sql`${posOrders.soldAt} desc`)
      .limit(1);
    currency = orderCurrencyRow?.currency?.trim().toUpperCase() ?? "EUR";
  }

  const paymentSummary = aggregatePaymentSummary(paymentRows);

  return {
    ordersCount: totalOrders,
    liveOrdersCount,
    onlineOrdersCount,
    receiptsCount: receiptStats?.count ?? 0,
    kpiReceiptsCount: receiptStats?.kpiCount ?? 0,
    revenueCents: receiptStats?.revenue ?? 0,
    refundsCount: receiptStats?.refundsCount ?? 0,
    currency,
    paymentSummary: { ...paymentSummary, currency },
  };
}

export async function fetchPortalTodaySalesStats(input: {
  orgId: string;
  customerId: string;
}): Promise<PortalSalesPeriodStats> {
  return fetchPortalSalesPeriodStats({
    ...input,
    period: "today",
  });
}

export { PORTAL_ORDERS_TIMEZONE, sqlIsTodayBerlin };
