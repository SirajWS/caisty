/**
 * Portal orders page data layer (Phase 7 Sprint 3).
 * Shared fetch for /portal/orders and order detail.
 */

import { and, desc, eq, inArray, sql } from "drizzle-orm";

import { db } from "../db/client.js";
import { devices } from "../db/schema/devices.js";
import {
  posOrderLines,
  posOrders,
  posReceiptEvents,
  posReceipts,
  posSalePayments,
} from "../db/schema/posSync.js";
import {
  normalizePortalOrderStatus,
  portalOrderStatusLabel,
  type PortalOrderStatus,
} from "./orderStatus.js";
import {
  formatOrderPaymentDisplay,
  formatProviderLabel,
  isProviderOrder,
  normalizeOrderSource,
  resolveOrderPaymentStatus,
  summarizeOrderLines,
  type OrderSource,
  type ResolvedPaymentStatus,
} from "./orderSource.js";
import {
  buildPortalOrderTimeline,
  type PortalOrderTimelineEntry,
} from "./portalOrderTimeline.js";
import {
  averageOrderMinor,
  customerDeviceScope,
  fetchPortalTodaySalesStats,
  PORTAL_ORDERS_TIMEZONE,
  sqlIsTodayBerlin,
} from "./portalSalesSummary.js";
import {
  groupOrderLinesByDeviceLocalId,
  orderLinesLookupKey,
  pickPrimaryPaymentMethod,
  resolveReceiptLineItems,
  type PortalReceiptLineItem,
} from "./portalOrders.js";
import {
  mapPortalReceiptRecord,
  toPortalReceiptIso,
  type PortalReceiptRecord,
} from "./portalReceipts.js";
import { buildPortalReceiptTimeline } from "./portalReceiptTimeline.js";
import { computeRefundedAmountCents } from "./receiptEventPayload.js";
import { mapPortalReceiptEventRecord } from "./portalReceiptEvents.js";
import { normalizeReceiptStatus } from "./receiptStatus.js";
import { shiftService } from "./shiftService.js";

export type PortalOrderPaymentRecord = {
  method: string;
  amountCents: number;
  currency: string;
  paidAt: string | null;
};

export type PortalOrderRecord = {
  id: string;
  localOrderId: string;
  deviceId: string;
  soldAt: string | null;
  businessDate: string | null;
  rawStatus: string;
  normalizedStatus: PortalOrderStatus;
  statusLabel: string;
  paymentMethod: string | null;
  paymentStatus: ResolvedPaymentStatus;
  paymentDisplay: string;
  amountCents: number;
  currency: string;
  cashier: string | null;
  deviceName: string;
  receiptId: string | null;
  receiptNumber: string | null;
  receiptStatus: string | null;
  refundedAmountCents: number;
  hasPaymentChange: boolean;
  lines: PortalReceiptLineItem[];
  timeline: PortalOrderTimelineEntry[];
  orderSource: OrderSource;
  isProviderOrder: boolean;
  platform: string | null;
  providerName: string | null;
  providerOrderId: string | null;
  customerName: string | null;
  customerPhone: string | null;
  customerEmail: string | null;
  deliveryAddress: string | null;
  customerNote: string | null;
  detailsSummary: string | null;
};

export type PortalOrdersPageData = {
  timezone: string;
  period: "today";
  summary: {
    allOrdersCount: number;
    liveOrdersCount: number;
    onlineOrdersCount: number;
    receiptsCount: number;
    refundsCount: number;
    hasOpenShift: boolean;
    /** @deprecated Use allOrdersCount */
    ordersCount: number;
    revenueCents: number;
    averageOrderMinor: number;
    openShift: Awaited<ReturnType<typeof shiftService.getOpenShiftForCustomer>>;
    paymentSummary: {
      cashCents: number;
      cardCents: number;
      voucherCents: number;
      otherCents: number;
      currency: string;
    };
  };
  orders: PortalOrderRecord[];
  providerOrders: PortalOrderRecord[];
  receipts: PortalReceiptRecord[];
  recentOrders: PortalOrderRecord[];
};

export type PortalOrderDetailData = PortalOrderRecord & {
  payments: PortalOrderPaymentRecord[];
  receipt: PortalReceiptRecord | null;
  receiptTimeline: ReturnType<typeof buildPortalReceiptTimeline>;
  discountCents: number;
  taxCents: number;
  netCents: number;
  queueNumber: string | null;
  tableName: string | null;
  customerName: string | null;
  notes: string | null;
  platform: string | null;
  providerOrderId: string | null;
  providerName: string | null;
  orderSource: OrderSource;
  isProviderOrder: boolean;
  customerPhone: string | null;
  customerEmail: string | null;
  deliveryAddress: string | null;
  customerNote: string | null;
  paymentStatus: ResolvedPaymentStatus;
  paymentDisplay: string;
};

type LinkedReceiptRow = {
  id: string;
  deviceId: string;
  localReceiptId: string;
  receiptNumber: string | null;
  soldAt: Date;
  grossCents: number;
  netCents: number;
  taxCents: number;
  currency: string;
  fiscalStatus: string;
  status: string | null;
  localOrderId: string | null;
};

function orderReceiptKey(deviceId: string, localOrderId: string): string {
  return `${deviceId}:${localOrderId}`;
}

async function loadReceiptEventsByReceiptId(
  receiptIds: string[],
): Promise<Map<string, ReturnType<typeof mapPortalReceiptEventRecord>[]>> {
  if (!receiptIds.length) return new Map();

  const rows = await db
    .select({
      id: posReceiptEvents.id,
      receiptId: posReceiptEvents.receiptId,
      eventId: posReceiptEvents.eventId,
      eventType: posReceiptEvents.eventType,
      occurredAt: posReceiptEvents.occurredAt,
      actor: posReceiptEvents.actor,
      payload: posReceiptEvents.payload,
      schemaVersion: posReceiptEvents.schemaVersion,
    })
    .from(posReceiptEvents)
    .where(inArray(posReceiptEvents.receiptId, receiptIds))
    .orderBy(posReceiptEvents.occurredAt);

  const map = new Map<string, ReturnType<typeof mapPortalReceiptEventRecord>[]>();
  for (const row of rows) {
    const list = map.get(row.receiptId) ?? [];
    list.push(mapPortalReceiptEventRecord(row));
    map.set(row.receiptId, list);
  }
  return map;
}

function resolveCashier(input: {
  openShiftCashier: string | null;
  receiptEvents: ReturnType<typeof mapPortalReceiptEventRecord>[] | undefined;
}): string | null {
  const fromEvent = input.receiptEvents?.find((e) => e.eventType === "created")?.actor;
  if (fromEvent?.trim()) return fromEvent.trim();
  return input.openShiftCashier?.trim() || null;
}

function resolveRefundedAt(
  events: ReturnType<typeof mapPortalReceiptEventRecord>[] | undefined,
): string | null {
  if (!events?.length) return null;
  const refundEvent = [...events]
    .reverse()
    .find((e) => e.eventType === "refund" || e.eventType === "partial_refund");
  return refundEvent?.occurredAt ?? null;
}

function hasPaymentChangeEvent(
  events: ReturnType<typeof mapPortalReceiptEventRecord>[] | undefined,
): boolean {
  return Boolean(events?.some((e) => e.eventType === "payment_changed"));
}

export async function fetchPortalOrdersPage(input: {
  orgId: string;
  customerId: string;
}): Promise<PortalOrdersPageData> {
  const { orgId, customerId } = input;
  const scope = and(
    eq(posOrders.orgId, orgId),
    customerDeviceScope(orgId, customerId),
    sqlIsTodayBerlin(posOrders.soldAt),
  );

  const [periodStats, openShift] = await Promise.all([
    fetchPortalTodaySalesStats({ orgId, customerId }),
    shiftService.getOpenShiftForCustomer(orgId, customerId),
  ]);

  const orderRows = await db
    .select({
      id: posOrders.id,
      deviceId: posOrders.deviceId,
      localOrderId: posOrders.localOrderId,
      soldAt: posOrders.soldAt,
      status: posOrders.status,
      totalCents: posOrders.totalCents,
      currency: posOrders.currency,
      deviceName: devices.name,
      platform: posOrders.platform,
      providerOrderId: posOrders.providerOrderId,
      customerName: posOrders.customerName,
      customerPhone: posOrders.customerPhone,
      customerEmail: posOrders.customerEmail,
      deliveryAddress: posOrders.deliveryAddress,
      customerNote: posOrders.customerNote,
      paymentStatus: posOrders.paymentStatus,
    })
    .from(posOrders)
    .innerJoin(devices, eq(posOrders.deviceId, devices.id))
    .where(scope)
    .orderBy(desc(posOrders.soldAt));

  const lineRows = await db
    .select({
      deviceId: posOrders.deviceId,
      localOrderId: posOrders.localOrderId,
      lineIndex: posOrderLines.lineIndex,
      productName: posOrderLines.productName,
      sku: posOrderLines.sku,
      quantity: posOrderLines.quantity,
      unitPriceCents: posOrderLines.unitPriceCents,
      lineTotalCents: posOrderLines.lineTotalCents,
    })
    .from(posOrderLines)
    .innerJoin(posOrders, eq(posOrderLines.orderId, posOrders.id))
    .innerJoin(devices, eq(posOrders.deviceId, devices.id))
    .where(scope)
    .orderBy(posOrderLines.lineIndex);

  const linesByOrderKey = groupOrderLinesByDeviceLocalId(lineRows);

  const receiptRows = await db
    .select({
      id: posReceipts.id,
      deviceId: posReceipts.deviceId,
      localReceiptId: posReceipts.localReceiptId,
      receiptNumber: posReceipts.receiptNumber,
      soldAt: posReceipts.soldAt,
      grossCents: posReceipts.grossCents,
      netCents: posReceipts.netCents,
      taxCents: posReceipts.taxCents,
      currency: posReceipts.currency,
      fiscalStatus: posReceipts.fiscalStatus,
      status: posReceipts.status,
      localOrderId: posReceipts.localOrderId,
    })
    .from(posReceipts)
    .innerJoin(devices, eq(posReceipts.deviceId, devices.id))
    .where(
      and(
        eq(posReceipts.orgId, orgId),
        customerDeviceScope(orgId, customerId),
        sqlIsTodayBerlin(posReceipts.soldAt),
      ),
    )
    .orderBy(desc(posReceipts.soldAt));

  const paymentRows = await db
    .select({
      localOrderId: posSalePayments.localOrderId,
      localReceiptId: posSalePayments.localReceiptId,
      method: posSalePayments.method,
      amountCents: posSalePayments.amountCents,
      currency: posSalePayments.currency,
      paidAt: posSalePayments.paidAt,
    })
    .from(posSalePayments)
    .innerJoin(devices, eq(posSalePayments.deviceId, devices.id))
    .where(
      and(
        eq(posSalePayments.orgId, orgId),
        customerDeviceScope(orgId, customerId),
        sqlIsTodayBerlin(posSalePayments.paidAt),
      ),
    );

  const paymentsByOrder = new Map<string, string[]>();
  const paymentsByReceipt = new Map<string, string[]>();
  const paidAtByOrder = new Map<string, string>();
  const paidAtByReceipt = new Map<string, string>();

  for (const payment of paymentRows) {
    const paidIso = toPortalReceiptIso(payment.paidAt);
    if (payment.localOrderId) {
      const list = paymentsByOrder.get(payment.localOrderId) ?? [];
      list.push(payment.method);
      paymentsByOrder.set(payment.localOrderId, list);
      if (paidIso) paidAtByOrder.set(payment.localOrderId, paidIso);
    }
    if (payment.localReceiptId) {
      const list = paymentsByReceipt.get(payment.localReceiptId) ?? [];
      list.push(payment.method);
      paymentsByReceipt.set(payment.localReceiptId, list);
      if (paidIso) paidAtByReceipt.set(payment.localReceiptId, paidIso);
    }
  }

  const receiptByOrderKey = new Map<string, LinkedReceiptRow>();
  for (const row of receiptRows) {
    if (!row.localOrderId) continue;
    receiptByOrderKey.set(orderReceiptKey(row.deviceId, row.localOrderId), row);
  }

  const receiptIds = receiptRows.map((r) => r.id);
  const eventsByReceiptId = await loadReceiptEventsByReceiptId(receiptIds);
  const openShiftCashier = openShift?.cashier ?? null;

  const allOrders: PortalOrderRecord[] = orderRows.map((row) => {
    const receipt = receiptByOrderKey.get(
      orderReceiptKey(row.deviceId, row.localOrderId),
    );
    const receiptEvents = receipt
      ? eventsByReceiptId.get(receipt.id)
      : undefined;
    const normalizedStatus = normalizePortalOrderStatus({
      rawOrderStatus: row.status,
      receiptStatus: receipt?.status,
    });
    const soldAtIso = toPortalReceiptIso(row.soldAt);
    const paymentMethods =
      paymentsByOrder.get(row.localOrderId) ??
      (receipt ? paymentsByReceipt.get(receipt.localReceiptId) ?? [] : []);
    const paidAt =
      paidAtByOrder.get(row.localOrderId) ??
      (receipt ? paidAtByReceipt.get(receipt.localReceiptId) : null) ??
      null;

    const lines =
      linesByOrderKey.get(orderLinesLookupKey(row.deviceId, row.localOrderId)) ??
      [];

    const cashier = resolveCashier({ openShiftCashier, receiptEvents });
    const provider = isProviderOrder(row.platform);
    const resolvedPaymentStatus = resolveOrderPaymentStatus({
      paymentStatus: row.paymentStatus,
      hasPayments: paymentMethods.length > 0,
    });
    const paymentMethod = pickPrimaryPaymentMethod(paymentMethods);

    return {
      id: row.id,
      localOrderId: row.localOrderId,
      deviceId: row.deviceId,
      soldAt: soldAtIso,
      businessDate: soldAtIso ? soldAtIso.slice(0, 10) : null,
      rawStatus: row.status,
      normalizedStatus,
      status: normalizedStatus,
      statusLabel: portalOrderStatusLabel(normalizedStatus),
      paymentMethod,
      paymentStatus: resolvedPaymentStatus,
      paymentDisplay: formatOrderPaymentDisplay({
        paymentMethod,
        paymentStatus: resolvedPaymentStatus,
      }),
      amountCents: row.totalCents,
      currency: row.currency,
      cashier,
      deviceName: row.deviceName,
      receiptId: receipt?.id ?? null,
      receiptNumber: receipt?.receiptNumber ?? null,
      receiptStatus: receipt ? normalizeReceiptStatus(receipt.status) : null,
      refundedAmountCents: computeRefundedAmountCents(receiptEvents ?? []),
      hasPaymentChange: hasPaymentChangeEvent(receiptEvents),
      lines,
      timeline: buildPortalOrderTimeline({
        orderId: row.id,
        soldAt: soldAtIso ?? new Date().toISOString(),
        rawOrderStatus: row.status,
        normalizedStatus,
        hasPayment: paymentMethods.length > 0,
        hasReceipt: Boolean(receipt),
        paidAt,
        receiptStatus: receipt?.status,
        cashier,
        refundedAt: resolveRefundedAt(receiptEvents),
      }),
      orderSource: normalizeOrderSource(row.platform),
      isProviderOrder: provider,
      platform: row.platform,
      providerName: provider ? formatProviderLabel(row.platform) : null,
      providerOrderId: row.providerOrderId,
      customerName: row.customerName,
      customerPhone: row.customerPhone,
      customerEmail: row.customerEmail,
      deliveryAddress: row.deliveryAddress,
      customerNote: row.customerNote,
      detailsSummary: summarizeOrderLines(lines),
    };
  });

  const liveOrders = allOrders.filter((order) => !order.isProviderOrder);
  const providerOrders = allOrders.filter((order) => order.isProviderOrder);

  const receipts: PortalReceiptRecord[] = receiptRows.map((row) =>
    mapPortalReceiptRecord({
      row,
      paymentMethod: pickPrimaryPaymentMethod(
        paymentsByReceipt.get(row.localReceiptId) ??
          (row.localOrderId
            ? paymentsByOrder.get(row.localOrderId) ?? []
            : []),
      ),
      items: resolveReceiptLineItems(
        linesByOrderKey,
        row.deviceId,
        row.localOrderId,
      ),
    }),
  );

  return {
    timezone: PORTAL_ORDERS_TIMEZONE,
    period: "today",
    summary: {
      allOrdersCount: periodStats.ordersCount,
      liveOrdersCount: periodStats.liveOrdersCount,
      onlineOrdersCount: periodStats.onlineOrdersCount,
      receiptsCount: periodStats.receiptsCount,
      refundsCount: periodStats.refundsCount,
      hasOpenShift: openShift !== null,
      ordersCount: periodStats.ordersCount,
      revenueCents: periodStats.revenueCents,
      averageOrderMinor: averageOrderMinor(
        periodStats.revenueCents,
        periodStats.kpiReceiptsCount,
      ),
      openShift,
      paymentSummary: periodStats.paymentSummary,
    },
    orders: liveOrders,
    providerOrders,
    receipts,
    recentOrders: allOrders.slice(0, 5),
  };
}

export async function fetchPortalOrderDetail(input: {
  orgId: string;
  customerId: string;
  orderId: string;
}): Promise<PortalOrderDetailData | null> {
  const page = await fetchPortalOrdersPage({
    orgId: input.orgId,
    customerId: input.customerId,
  });

  const order =
    page.orders.find((row) => row.id === input.orderId) ??
    page.providerOrders.find((row) => row.id === input.orderId);
  if (!order) return null;

  const receipt = order.receiptId
    ? page.receipts.find((r) => r.id === order.receiptId) ?? null
    : null;

  const paymentScope = receipt
    ? and(
        eq(posSalePayments.orgId, input.orgId),
        customerDeviceScope(input.orgId, input.customerId),
        sql`(
          ${posSalePayments.localOrderId} = ${order.localOrderId}
          or ${posSalePayments.localReceiptId} = ${receipt.localReceiptId}
        )`,
      )
    : and(
        eq(posSalePayments.orgId, input.orgId),
        customerDeviceScope(input.orgId, input.customerId),
        eq(posSalePayments.localOrderId, order.localOrderId),
      );

  const paymentDetailRows = await db
    .select({
      method: posSalePayments.method,
      amountCents: posSalePayments.amountCents,
      currency: posSalePayments.currency,
      paidAt: posSalePayments.paidAt,
    })
    .from(posSalePayments)
    .innerJoin(devices, eq(posSalePayments.deviceId, devices.id))
    .where(paymentScope);

  const receiptEvents = order.receiptId
    ? (await loadReceiptEventsByReceiptId([order.receiptId])).get(order.receiptId)
    : undefined;

  const lineTotal = order.lines.reduce((sum, line) => sum + line.lineTotalCents, 0);
  const gross = receipt?.amountCents ?? order.amountCents;
  const discountCents = Math.max(0, lineTotal - gross);

  let taxCents = 0;
  let netCents = gross;
  if (order.receiptId) {
    const [receiptRow] = await db
      .select({
        netCents: posReceipts.netCents,
        taxCents: posReceipts.taxCents,
        grossCents: posReceipts.grossCents,
      })
      .from(posReceipts)
      .innerJoin(devices, eq(posReceipts.deviceId, devices.id))
      .where(
        and(
          eq(posReceipts.id, order.receiptId),
          eq(posReceipts.orgId, input.orgId),
          customerDeviceScope(input.orgId, input.customerId),
        ),
      )
      .limit(1);
    if (receiptRow) {
      taxCents = receiptRow.taxCents ?? 0;
      netCents = receiptRow.netCents ?? gross;
    }
  }

  return {
    ...order,
    payments: paymentDetailRows.map((row) => ({
      method: row.method,
      amountCents: row.amountCents,
      currency: row.currency,
      paidAt: toPortalReceiptIso(row.paidAt),
    })),
    receipt,
    receiptTimeline: receipt
      ? buildPortalReceiptTimeline({
          events: receiptEvents ?? [],
          soldAt: new Date(receipt.issuedAt ?? order.soldAt ?? Date.now()),
          currency: receipt.currency,
        })
      : [],
    discountCents,
    taxCents,
    netCents,
    queueNumber: null,
    tableName: null,
    customerName: order.customerName ?? receipt?.customer ?? null,
    notes: order.customerNote ?? null,
    platform: order.platform,
    providerOrderId: order.providerOrderId,
    providerName: order.providerName,
    orderSource: order.orderSource,
    isProviderOrder: order.isProviderOrder,
    customerPhone: order.customerPhone,
    customerEmail: order.customerEmail,
    deliveryAddress: order.deliveryAddress,
    customerNote: order.customerNote,
    paymentStatus: order.paymentStatus,
    paymentDisplay: order.paymentDisplay,
  };
}

export async function orderBelongsToCustomer(input: {
  orgId: string;
  customerId: string;
  orderId: string;
}): Promise<boolean> {
  const [row] = await db
    .select({ id: posOrders.id })
    .from(posOrders)
    .innerJoin(devices, eq(posOrders.deviceId, devices.id))
    .where(
      and(
        eq(posOrders.id, input.orderId),
        eq(posOrders.orgId, input.orgId),
        eq(devices.customerId, input.customerId),
      ),
    )
    .limit(1);
  return Boolean(row);
}
