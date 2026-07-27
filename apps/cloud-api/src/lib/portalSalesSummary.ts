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
  aggregateEffectivePaymentSummary,
  aggregateOnlinePaymentSummary,
  appendOrderPaymentRow,
  orderLinesLookupKey,
  type OnlinePaymentSummaryCents,
  type OrderPaymentRow,
  type PaymentSummaryCents,
} from "./portalOrders.js";
import { POS_NATIVE_PLATFORMS_LIST, isProviderOrder } from "./orderSource.js";
import { dedupeProviderOrders } from "./dedupeProviderOrders.js";
import {
  normalizePortalOrderStatus,
  PORTAL_ORDER_STATUS,
} from "./orderStatus.js";
import {
  sqlInPeriodBerlin,
  type PortalReportsPeriod,
} from "./portalReportsPeriod.js";

function receiptStatusContributesToKpis(status: string | null | undefined): boolean {
  const normalized = (status ?? "active").trim().toLowerCase();
  return (
    normalized !== "refunded" &&
    normalized !== "partial_refund" &&
    normalized !== "voided"
  );
}

function receiptStatusIsRefunded(status: string | null | undefined): boolean {
  const normalized = (status ?? "active").trim().toLowerCase();
  return normalized === "refunded" || normalized === "partial_refund";
}

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
  posRevenueCents: number;
  onlineRevenueCents: number;
  /** Total revenue = POS + Online (minor units). */
  revenueCents: number;
  refundsCount: number;
  currency: string;
  paymentSummary: PaymentSummaryCents & { currency: string };
  onlinePaymentSummary: OnlinePaymentSummaryCents & { currency: string };
};

/** Orders excluded from online revenue totals. */
export function sqlOrderIsCancelled(
  statusColumn: typeof posOrders.status = posOrders.status,
): SQL {
  return sql`coalesce(lower(trim(${statusColumn})), '') in ('cancelled', 'canceled', 'refunded')`;
}

/** Provider / online channel (non-empty platform, not POS-native). */
export function sqlIsProviderOrderPlatform(
  platformColumn: typeof posOrders.platform = posOrders.platform,
): SQL {
  return sql`(
    coalesce(trim(lower(${platformColumn})), '') <> ''
    and not (${sqlIsLiveOrderPlatform(platformColumn)})
  )`;
}

export function combineRevenueMinor(
  posRevenueCents: number,
  onlineRevenueCents: number,
): number {
  return posRevenueCents + onlineRevenueCents;
}

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
 * POS sale payments only — excludes provider/online order payments without a
 * live POS receipt. `pos_sale_payments` rows are POS-synced; this filter keeps
 * provider-channel settlements out of the dashboard payment summary.
 */
export async function fetchPosPaymentsForSalesPeriod(input: {
  orgId: string;
  customerId: string;
  period: PortalReportsPeriod;
}): Promise<OrderPaymentRow[]> {
  const { orgId, customerId, period } = input;
  const periodSql = sqlInPeriodBerlin(posReceipts.soldAt, period);
  const paidAtPeriodSql = sqlInPeriodBerlin(posSalePayments.paidAt, period);

  const rows = await db
    .select({
      deviceId: posSalePayments.deviceId,
      localOrderId: posSalePayments.localOrderId,
      localReceiptId: posSalePayments.localReceiptId,
      localPaymentId: posSalePayments.localPaymentId,
      method: posSalePayments.method,
      amountCents: posSalePayments.amountCents,
      currency: posSalePayments.currency,
      paidAt: posSalePayments.paidAt,
      updatedAt: posSalePayments.updatedAt,
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
    .leftJoin(
      posOrders,
      and(
        eq(posSalePayments.orgId, posOrders.orgId),
        eq(posSalePayments.deviceId, posOrders.deviceId),
        eq(posSalePayments.localOrderId, posOrders.localOrderId),
      ),
    )
    .where(
      and(
        eq(posSalePayments.orgId, orgId),
        customerDeviceScope(orgId, customerId),
        sql`(
          (
            ${posReceipts.id} is not null
            and ${periodSql}
            and ${sqlReceiptContributesToKpis(posReceipts.status)}
            and (
              ${posOrders.id} is null
              or ${sqlIsLiveOrderPlatform(posOrders.platform)}
            )
          )
          or (
            ${posReceipts.id} is null
            and ${paidAtPeriodSql}
            and (
              ${posOrders.id} is null
              or ${sqlIsLiveOrderPlatform(posOrders.platform)}
            )
          )
        )`,
      ),
    );

  return rows.map((row) => ({
    deviceId: row.deviceId,
    localOrderId: row.localOrderId,
    localReceiptId: row.localReceiptId,
    localPaymentId: row.localPaymentId,
    method: row.method,
    amountCents: row.amountCents,
    paidAt: row.paidAt,
    updatedAt: row.updatedAt,
  }));
}

/** @deprecated Use fetchPosPaymentsForSalesPeriod for dashboard POS payment summary. */
export async function fetchPaymentsForSalesPeriod(input: {
  orgId: string;
  customerId: string;
  period: PortalReportsPeriod;
}): Promise<OrderPaymentRow[]> {
  return fetchPosPaymentsForSalesPeriod(input);
}

function isOrderExcludedFromOnlinePaymentSummary(
  orderStatus: string,
  paymentStatus: string | null,
): boolean {
  const normalized = normalizePortalOrderStatus({
    orderStatus,
    paymentStatus,
  });
  return (
    normalized === PORTAL_ORDER_STATUS.CANCELLED ||
    normalized === PORTAL_ORDER_STATUS.REFUNDED
  );
}

export async function fetchPosRevenueCentsForPeriod(input: {
  orgId: string;
  customerId: string;
  period: PortalReportsPeriod;
}): Promise<number> {
  const { orgId, customerId, period } = input;
  const receiptOrderJoin = and(
    eq(posReceipts.orgId, posOrders.orgId),
    eq(posReceipts.deviceId, posOrders.deviceId),
    eq(posReceipts.localOrderId, posOrders.localOrderId),
  );

  const [row] = await db
    .select({
      revenue: sql<number>`coalesce(sum(${posReceipts.grossCents}) filter (where ${sqlReceiptContributesToKpis()}), 0)::int`,
    })
    .from(posReceipts)
    .innerJoin(devices, eq(posReceipts.deviceId, devices.id))
    .leftJoin(posOrders, receiptOrderJoin)
    .where(
      and(
        receiptPeriodScope(orgId, customerId, period),
        sql`(
          ${posOrders.id} is null
          or ${sqlIsLiveOrderPlatform(posOrders.platform)}
        )`,
      ),
    );

  return row?.revenue ?? 0;
}

export async function fetchOnlinePaymentSummaryForPeriod(input: {
  orgId: string;
  customerId: string;
  period: PortalReportsPeriod;
}): Promise<OnlinePaymentSummaryCents & { currency: string }> {
  const { orgId, customerId, period } = input;

  const orderRows = await db
    .select({
      id: posOrders.id,
      deviceId: posOrders.deviceId,
      localOrderId: posOrders.localOrderId,
      totalCents: posOrders.totalCents,
      currency: posOrders.currency,
      paymentStatus: posOrders.paymentStatus,
      status: posOrders.status,
      platform: posOrders.platform,
      providerOrderId: posOrders.providerOrderId,
      updatedAt: posOrders.updatedAt,
      soldAt: posOrders.soldAt,
    })
    .from(posOrders)
    .innerJoin(devices, eq(posOrders.deviceId, devices.id))
    .where(
      and(
        orderPeriodScope(orgId, customerId, period),
        sqlIsProviderOrderPlatform(posOrders.platform),
      ),
    );

  const dedupedOrderRows = dedupeProviderOrders(orderRows);
  const winnerKeys = new Set(
    dedupedOrderRows.map((order) =>
      orderLinesLookupKey(order.deviceId, order.localOrderId),
    ),
  );

  const paymentRows = await db
    .select({
      deviceId: posSalePayments.deviceId,
      localOrderId: posSalePayments.localOrderId,
      localReceiptId: posSalePayments.localReceiptId,
      localPaymentId: posSalePayments.localPaymentId,
      method: posSalePayments.method,
      amountCents: posSalePayments.amountCents,
      paidAt: posSalePayments.paidAt,
      updatedAt: posSalePayments.updatedAt,
    })
    .from(posSalePayments)
    .innerJoin(devices, eq(posSalePayments.deviceId, devices.id))
    .innerJoin(
      posOrders,
      and(
        eq(posSalePayments.orgId, posOrders.orgId),
        eq(posSalePayments.deviceId, posOrders.deviceId),
        eq(posSalePayments.localOrderId, posOrders.localOrderId),
      ),
    )
    .where(
      and(
        eq(posSalePayments.orgId, orgId),
        customerDeviceScope(orgId, customerId),
        orderPeriodScope(orgId, customerId, period),
        sqlIsProviderOrderPlatform(posOrders.platform),
      ),
    );

  const paymentsByOrder = new Map<string, OrderPaymentRow[]>();
  for (const row of paymentRows) {
    if (!row.localOrderId) continue;
    const key = orderLinesLookupKey(row.deviceId, row.localOrderId);
    if (!winnerKeys.has(key)) continue;
    appendOrderPaymentRow(
      paymentsByOrder,
      key,
      {
        deviceId: row.deviceId,
        localOrderId: row.localOrderId,
        localReceiptId: row.localReceiptId,
        localPaymentId: row.localPaymentId,
        method: row.method,
        amountCents: row.amountCents,
        paidAt: row.paidAt,
        updatedAt: row.updatedAt,
      },
    );
  }

  const kpiReceiptRows = await db
    .select({
      deviceId: posOrders.deviceId,
      localOrderId: posOrders.localOrderId,
      grossCents: posReceipts.grossCents,
      currency: posReceipts.currency,
      paymentStatus: posOrders.paymentStatus,
      status: posOrders.status,
    })
    .from(posReceipts)
    .innerJoin(devices, eq(posReceipts.deviceId, devices.id))
    .innerJoin(
      posOrders,
      and(
        eq(posReceipts.orgId, posOrders.orgId),
        eq(posReceipts.deviceId, posOrders.deviceId),
        eq(posReceipts.localOrderId, posOrders.localOrderId),
      ),
    )
    .where(
      and(
        receiptPeriodScope(orgId, customerId, period),
        sqlReceiptContributesToKpis(posReceipts.status),
        sqlIsProviderOrderPlatform(posOrders.platform),
      ),
    );

  const winnerKpiReceiptRows = kpiReceiptRows.filter((row) =>
    winnerKeys.has(orderLinesLookupKey(row.deviceId, row.localOrderId)),
  );

  const ordersWithKpiReceipt = new Set<string>();
  for (const row of winnerKpiReceiptRows) {
    ordersWithKpiReceipt.add(orderLinesLookupKey(row.deviceId, row.localOrderId));
  }

  let currency =
    dedupedOrderRows[0]?.currency?.trim().toUpperCase() ??
    winnerKpiReceiptRows[0]?.currency?.trim().toUpperCase() ??
    "EUR";

  const summary = aggregateOnlinePaymentSummary({
    orders: dedupedOrderRows.map((order) => {
      const key = orderLinesLookupKey(order.deviceId, order.localOrderId);
      return {
        totalCents: order.totalCents,
        orderStatus: order.status,
        paymentStatus: order.paymentStatus,
        paymentRows: paymentsByOrder.get(key) ?? [],
        hasKpiReceipt: ordersWithKpiReceipt.has(key),
        excluded: isOrderExcludedFromOnlinePaymentSummary(
          order.status,
          order.paymentStatus,
        ),
      };
    }),
    providerReceipts: winnerKpiReceiptRows.map((receipt) => {
      const key = orderLinesLookupKey(receipt.deviceId, receipt.localOrderId);
      return {
        grossCents: receipt.grossCents,
        orderStatus: receipt.status,
        paymentStatus: receipt.paymentStatus,
        paymentRows: paymentsByOrder.get(key) ?? [],
        excluded: isOrderExcludedFromOnlinePaymentSummary(
          receipt.status,
          receipt.paymentStatus,
        ),
      };
    }),
  });

  return { ...summary, currency };
}

export async function fetchPortalSalesPeriodStats(input: {
  orgId: string;
  customerId: string;
  period: PortalReportsPeriod;
}): Promise<PortalSalesPeriodStats> {
  const { orgId, customerId, period } = input;

  const [orderStats] = await db
    .select({
      liveCount: sql<number>`count(*) filter (where ${sqlIsLiveOrderPlatform(posOrders.platform)})::int`,
    })
    .from(posOrders)
    .innerJoin(devices, eq(posOrders.deviceId, devices.id))
    .where(orderPeriodScope(orgId, customerId, period));

  const liveOrdersCount = orderStats?.liveCount ?? 0;

  const providerOrderRows = await db
    .select({
      id: posOrders.id,
      deviceId: posOrders.deviceId,
      localOrderId: posOrders.localOrderId,
      platform: posOrders.platform,
      providerOrderId: posOrders.providerOrderId,
      status: posOrders.status,
      updatedAt: posOrders.updatedAt,
      soldAt: posOrders.soldAt,
      totalCents: posOrders.totalCents,
      paymentStatus: posOrders.paymentStatus,
    })
    .from(posOrders)
    .innerJoin(devices, eq(posOrders.deviceId, devices.id))
    .where(
      and(
        orderPeriodScope(orgId, customerId, period),
        sqlIsProviderOrderPlatform(posOrders.platform),
      ),
    );

  const providerWinners = dedupeProviderOrders(providerOrderRows);
  const onlineOrdersCount = providerWinners.length;
  const totalOrders = liveOrdersCount + onlineOrdersCount;
  const winnerOrderKeys = new Set(
    providerWinners.map((order) =>
      orderLinesLookupKey(order.deviceId, order.localOrderId),
    ),
  );

  const receiptOrderJoinForCounts = and(
    eq(posReceipts.orgId, posOrders.orgId),
    eq(posReceipts.deviceId, posOrders.deviceId),
    eq(posReceipts.localOrderId, posOrders.localOrderId),
  );

  // Count receipts safely: live/orphan always; provider only when linked to a winner key.
  const receiptCountRows = await db
    .select({
      deviceId: posReceipts.deviceId,
      localOrderId: posReceipts.localOrderId,
      status: posReceipts.status,
      platform: posOrders.platform,
      orderId: posOrders.id,
    })
    .from(posReceipts)
    .innerJoin(devices, eq(posReceipts.deviceId, devices.id))
    .leftJoin(posOrders, receiptOrderJoinForCounts)
    .where(receiptPeriodScope(orgId, customerId, period));

  let receiptsCount = 0;
  let kpiReceiptsCount = 0;
  let refundsCount = 0;
  for (const row of receiptCountRows) {
    if (row.orderId && isProviderOrder(row.platform)) {
      if (!row.localOrderId) continue;
      if (
        !winnerOrderKeys.has(
          orderLinesLookupKey(row.deviceId, row.localOrderId),
        )
      ) {
        continue;
      }
    }
    receiptsCount += 1;
    if (receiptStatusContributesToKpis(row.status)) kpiReceiptsCount += 1;
    if (receiptStatusIsRefunded(row.status)) refundsCount += 1;
  }

  const paymentRows = await fetchPosPaymentsForSalesPeriod({
    orgId,
    customerId,
    period,
  });

  const receiptOrderJoin = and(
    eq(posReceipts.orgId, posOrders.orgId),
    eq(posReceipts.deviceId, posOrders.deviceId),
    eq(posReceipts.localOrderId, posOrders.localOrderId),
  );

  const [posReceiptRevenueRow] = await db
    .select({
      revenue: sql<number>`coalesce(sum(${posReceipts.grossCents}) filter (where ${sqlReceiptContributesToKpis()}), 0)::int`,
    })
    .from(posReceipts)
    .innerJoin(devices, eq(posReceipts.deviceId, devices.id))
    .leftJoin(posOrders, receiptOrderJoin)
    .where(
      and(
        receiptPeriodScope(orgId, customerId, period),
        sql`(
          ${posOrders.id} is null
          or ${sqlIsLiveOrderPlatform(posOrders.platform)}
        )`,
      ),
    );

  const providerKpiReceiptRows = await db
    .select({
      deviceId: posOrders.deviceId,
      localOrderId: posOrders.localOrderId,
      grossCents: posReceipts.grossCents,
    })
    .from(posReceipts)
    .innerJoin(devices, eq(posReceipts.deviceId, devices.id))
    .innerJoin(posOrders, receiptOrderJoin)
    .where(
      and(
        receiptPeriodScope(orgId, customerId, period),
        sqlReceiptContributesToKpis(posReceipts.status),
        sqlIsProviderOrderPlatform(posOrders.platform),
      ),
    );

  const receiptRevenueByWinnerKey = new Map<string, number>();
  for (const row of providerKpiReceiptRows) {
    const key = orderLinesLookupKey(row.deviceId, row.localOrderId);
    if (!winnerOrderKeys.has(key)) continue;
    receiptRevenueByWinnerKey.set(
      key,
      (receiptRevenueByWinnerKey.get(key) ?? 0) + row.grossCents,
    );
  }

  // Online paid fallback uses winner.paymentStatus only.
  // Do NOT intersect POS-only paymentRows with provider winner keys — that set
  // was always empty (fetchPosPaymentsForSalesPeriod excludes provider channels).

  let onlineReceiptRevenueCents = 0;
  let onlineOrderRevenueCents = 0;
  for (const winner of providerWinners) {
    const key = orderLinesLookupKey(winner.deviceId, winner.localOrderId);
    const receiptRevenue = receiptRevenueByWinnerKey.get(key) ?? 0;
    const status = (winner.status ?? "").trim().toLowerCase();
    const cancelled =
      status === "cancelled" || status === "canceled" || status === "refunded";
    if (receiptRevenue > 0) {
      onlineReceiptRevenueCents += receiptRevenue;
      continue;
    }
    const paymentStatus = (winner.paymentStatus ?? "").trim().toLowerCase();
    if (!cancelled && paymentStatus === "paid") {
      onlineOrderRevenueCents += winner.totalCents;
    }
  }

  const posRevenueCents = posReceiptRevenueRow?.revenue ?? 0;
  const onlineRevenueCents = onlineReceiptRevenueCents + onlineOrderRevenueCents;
  const revenueCents = combineRevenueMinor(posRevenueCents, onlineRevenueCents);

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

  const paymentSummary = aggregateEffectivePaymentSummary(paymentRows);
  const onlinePaymentSummary = await fetchOnlinePaymentSummaryForPeriod({
    orgId,
    customerId,
    period,
  });

  return {
    ordersCount: totalOrders,
    liveOrdersCount,
    onlineOrdersCount,
    receiptsCount,
    kpiReceiptsCount,
    posRevenueCents,
    onlineRevenueCents,
    revenueCents,
    refundsCount,
    currency,
    paymentSummary: { ...paymentSummary, currency },
    onlinePaymentSummary: {
      ...onlinePaymentSummary,
      currency: onlinePaymentSummary.currency || currency,
    },
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

export { PORTAL_ORDERS_TIMEZONE, sqlIsTodayBerlin } from "./portalOrders.js";
