import { and, eq } from "drizzle-orm";

import { db } from "../db/client.js";
import { devices } from "../db/schema/devices.js";
import {
  averageOrderMinor,
  fetchPortalTodaySalesStats,
  PORTAL_ORDERS_TIMEZONE,
} from "./portalSalesSummary.js";
import { fetchPortalOrdersPage } from "./portalOrdersPage.js";

export type PortalTodaySalesSummary = {
  todayRevenueCents: number;
  ordersToday: number;
  liveOrdersCount: number;
  onlineOrdersCount: number;
  receiptsToday: number;
  refundsCount: number;
  averageOrderMinor: number;
  currency: string;
  lastSynchronizationAt: string | null;
};

function toIso(value: Date | null | undefined): string | null {
  if (!value) return null;
  return value.toISOString();
}

function maxIso(dates: Array<string | null>): string | null {
  let latest: number | null = null;
  let result: string | null = null;
  for (const iso of dates) {
    if (!iso) continue;
    const ts = new Date(iso).getTime();
    if (Number.isFinite(ts) && (latest === null || ts > latest)) {
      latest = ts;
      result = iso;
    }
  }
  return result;
}

async function fetchLastSynchronizationAt(input: {
  orgId: string;
  customerId: string;
}): Promise<string | null> {
  const scope = and(
    eq(devices.orgId, input.orgId),
    eq(devices.customerId, input.customerId),
  );

  const deviceSyncRows = await db
    .select({
      lastSalesSyncAt: devices.lastSalesSyncAt,
      lastHeartbeatAt: devices.lastHeartbeatAt,
      lastSeenAt: devices.lastSeenAt,
    })
    .from(devices)
    .where(scope);

  return maxIso(
    deviceSyncRows.flatMap((row) => [
      toIso(row.lastSalesSyncAt),
      toIso(row.lastHeartbeatAt),
      toIso(row.lastSeenAt),
    ]),
  );
}

export async function fetchPortalTodaySalesSummary(input: {
  orgId: string;
  customerId: string;
}): Promise<PortalTodaySalesSummary> {
  const [stats, lastSynchronizationAt] = await Promise.all([
    fetchPortalTodaySalesStats(input),
    fetchLastSynchronizationAt(input),
  ]);

  return {
    todayRevenueCents: stats.revenueCents,
    ordersToday: stats.ordersCount,
    liveOrdersCount: stats.liveOrdersCount,
    onlineOrdersCount: stats.onlineOrdersCount,
    receiptsToday: stats.receiptsCount,
    refundsCount: stats.refundsCount,
    averageOrderMinor: averageOrderMinor(
      stats.revenueCents,
      stats.kpiReceiptsCount,
    ),
    currency: stats.currency,
    lastSynchronizationAt,
  };
}

export function buildPortalDashboardSummaryResponse(
  summary: PortalTodaySalesSummary,
  recentOrders: Awaited<ReturnType<typeof fetchPortalOrdersPage>>["recentOrders"],
  paymentSummary: Awaited<
    ReturnType<typeof fetchPortalTodaySalesStats>
  >["paymentSummary"],
) {
  const hasSalesData = summary.ordersToday > 0 || summary.receiptsToday > 0;
  return {
    timezone: PORTAL_ORDERS_TIMEZONE,
    period: "today" as const,
    todayRevenueCents: summary.todayRevenueCents,
    ordersToday: summary.ordersToday,
    liveOrdersCount: summary.liveOrdersCount,
    onlineOrdersCount: summary.onlineOrdersCount,
    receiptsToday: summary.receiptsToday,
    refundsCount: summary.refundsCount,
    averageOrderMinor: summary.averageOrderMinor,
    currency: summary.currency,
    lastSynchronizationAt: summary.lastSynchronizationAt,
    hasSalesData,
    paymentSummary: {
      ...paymentSummary,
      currency: summary.currency,
    },
    recentOrders: recentOrders.map((order) => ({
      id: order.id,
      localOrderId: order.localOrderId,
      soldAt: order.soldAt,
      normalizedStatus: order.normalizedStatus,
      statusLabel: order.statusLabel,
      paymentMethod: order.paymentMethod,
      paymentDisplay: order.paymentDisplay,
      amountCents: order.amountCents,
      currency: order.currency,
      receiptId: order.receiptId,
      receiptNumber: order.receiptNumber,
      receiptStatus: order.receiptStatus,
      isProviderOrder: order.isProviderOrder,
      providerName: order.providerName,
    })),
  };
}

export async function fetchPortalDashboardBundle(input: {
  orgId: string;
  customerId: string;
}) {
  const [summary, ordersPage] = await Promise.all([
    fetchPortalTodaySalesSummary(input),
    fetchPortalOrdersPage(input),
  ]);

  return buildPortalDashboardSummaryResponse(
    summary,
    ordersPage.recentOrders,
    ordersPage.summary.paymentSummary,
  );
}
