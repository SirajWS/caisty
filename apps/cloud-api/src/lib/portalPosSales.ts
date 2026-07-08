import { and, desc, eq, sql } from "drizzle-orm";

import { db } from "../db/client.js";
import { devices } from "../db/schema/devices.js";
import { posOrders, posReceipts } from "../db/schema/posSync.js";
import {
  PORTAL_ORDERS_TIMEZONE,
  sqlIsTodayBerlin,
} from "./portalOrders.js";

export type PortalTodaySalesSummary = {
  todayRevenueCents: number;
  ordersToday: number;
  receiptsToday: number;
  currency: string;
  lastSynchronizationAt: string | null;
};

function customerDeviceScope(orgId: string, customerId: string) {
  return and(
    eq(devices.orgId, orgId),
    eq(devices.customerId, customerId),
  );
}

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

export async function fetchPortalTodaySalesSummary(input: {
  orgId: string;
  customerId: string;
}): Promise<PortalTodaySalesSummary> {
  const scope = customerDeviceScope(input.orgId, input.customerId);

  const [orderStats] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(posOrders)
    .innerJoin(devices, eq(posOrders.deviceId, devices.id))
    .where(and(eq(posOrders.orgId, input.orgId), scope, sqlIsTodayBerlin(posOrders.soldAt)));

  const [receiptStats] = await db
    .select({
      count: sql<number>`count(*)::int`,
      revenue: sql<number>`coalesce(sum(${posReceipts.grossCents}), 0)::int`,
    })
    .from(posReceipts)
    .innerJoin(devices, eq(posReceipts.deviceId, devices.id))
    .where(
      and(eq(posReceipts.orgId, input.orgId), scope, sqlIsTodayBerlin(posReceipts.soldAt)),
    );

  const [currencyRow] = await db
    .select({ currency: posReceipts.currency })
    .from(posReceipts)
    .innerJoin(devices, eq(posReceipts.deviceId, devices.id))
    .where(
      and(eq(posReceipts.orgId, input.orgId), scope, sqlIsTodayBerlin(posReceipts.soldAt)),
    )
    .orderBy(desc(posReceipts.soldAt))
    .limit(1);

  let currency = currencyRow?.currency ?? null;
  if (!currency) {
    const [orderCurrencyRow] = await db
      .select({ currency: posOrders.currency })
      .from(posOrders)
      .innerJoin(devices, eq(posOrders.deviceId, devices.id))
      .where(
        and(eq(posOrders.orgId, input.orgId), scope, sqlIsTodayBerlin(posOrders.soldAt)),
      )
      .orderBy(desc(posOrders.soldAt))
      .limit(1);
    currency = orderCurrencyRow?.currency ?? "EUR";
  }

  const deviceSyncRows = await db
    .select({
      lastSalesSyncAt: devices.lastSalesSyncAt,
      lastHeartbeatAt: devices.lastHeartbeatAt,
      lastSeenAt: devices.lastSeenAt,
    })
    .from(devices)
    .where(scope);

  const lastSynchronizationAt = maxIso(
    deviceSyncRows.flatMap((row) => [
      toIso(row.lastSalesSyncAt),
      toIso(row.lastHeartbeatAt),
      toIso(row.lastSeenAt),
    ]),
  );

  return {
    todayRevenueCents: receiptStats?.revenue ?? 0,
    ordersToday: orderStats?.count ?? 0,
    receiptsToday: receiptStats?.count ?? 0,
    currency,
    lastSynchronizationAt,
  };
}

export function buildPortalDashboardSummaryResponse(
  summary: PortalTodaySalesSummary,
) {
  const hasSalesData = summary.ordersToday > 0 || summary.receiptsToday > 0;
  return {
    timezone: PORTAL_ORDERS_TIMEZONE,
    period: "today" as const,
    todayRevenueCents: summary.todayRevenueCents,
    ordersToday: summary.ordersToday,
    receiptsToday: summary.receiptsToday,
    currency: summary.currency,
    lastSynchronizationAt: summary.lastSynchronizationAt,
    hasSalesData,
  };
}
