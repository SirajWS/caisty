/**
 * Portal receipts list/detail queries (Sprint 5.2C).
 * Reuses receipt DTO mappers — no duplicated mapping logic.
 */

import { and, asc, desc, eq, ilike, inArray, or, sql, type SQL } from "drizzle-orm";

import { db } from "../db/client.js";
import { devices } from "../db/schema/devices.js";
import {
  posOrderLines,
  posOrders,
  posReceiptEvents,
  posReceipts,
  posSalePayments,
} from "../db/schema/posSync.js";
import { mapPortalReceiptEventRecord } from "./portalReceiptEvents.js";
import type { PortalReceiptEventRecord } from "./portalReceiptEvents.js";
import {
  aggregatePaymentSummary,
  groupOrderLinesByDeviceLocalId,
  pickPrimaryPaymentMethod,
  PORTAL_ORDERS_TIMEZONE,
  resolveReceiptLineItems,
  bucketPaymentMethod,
  type PaymentBucket,
} from "./portalOrders.js";
import {
  mapPortalReceiptRecord,
  toPortalReceiptIso,
  type PortalReceiptRecord,
} from "./portalReceipts.js";
import {
  parsePortalReportsPeriod,
  sqlInPeriodBerlin,
  type PortalReportsPeriod,
} from "./portalReportsPeriod.js";
import { RECEIPT_EVENT_TYPES } from "./receiptEventTypes.js";
import {
  normalizeReceiptStatus,
  receiptCountsTowardKpis,
  type ReceiptStatus,
} from "./receiptStatus.js";

export type PortalReceiptSort = "newest" | "oldest";

export type PortalReceiptListItem = PortalReceiptRecord & {
  deviceName: string | null;
  printCount: number;
  reprintCount: number;
  lastEventType: string | null;
  lastEventAt: string | null;
  cashier: string | null;
};

export type PortalReceiptsSummary = {
  receiptsCount: number;
  activeCount: number;
  printedCount: number;
  reprintedCount: number;
  refundsCount: number;
  paymentSummary: {
    cashCents: number;
    cardCents: number;
    voucherCents: number;
    otherCents: number;
    currency: string;
  };
};

export type PortalReceiptsPageData = {
  timezone: string;
  period: PortalReportsPeriod;
  summary: PortalReceiptsSummary;
  receipts: PortalReceiptListItem[];
};

export type PortalReceiptPrintStats = {
  hasOriginalPrint: boolean;
  reprintCount: number;
  lastPrintAt: string | null;
};

export type PortalReceiptDetailData = {
  receipt: PortalReceiptRecord & {
    deviceName: string | null;
    localOrderId: string | null;
    netCents: number;
    taxCents: number;
    grossCents: number;
  };
  events: PortalReceiptEventRecord[];
  printStats: PortalReceiptPrintStats;
};

export type FetchPortalReceiptsInput = {
  orgId: string;
  customerId: string;
  period?: string;
  paymentMethod?: string;
  status?: string;
  search?: string;
  sort?: string;
};

function parseReceiptSort(raw: string | undefined): PortalReceiptSort {
  return raw?.trim().toLowerCase() === "oldest" ? "oldest" : "newest";
}

function parsePaymentFilter(raw: string | undefined): PaymentBucket | "all" {
  const value = raw?.trim().toLowerCase();
  if (
    value === "cash" ||
    value === "card" ||
    value === "voucher" ||
    value === "other"
  ) {
    return value;
  }
  return "all";
}

function parseStatusFilter(raw: string | undefined): ReceiptStatus | "all" {
  const value = raw?.trim().toLowerCase();
  if (
    value === "active" ||
    value === "refunded" ||
    value === "partial_refund" ||
    value === "voided"
  ) {
    return value;
  }
  return "all";
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

type ReceiptEventStats = {
  printCount: number;
  reprintCount: number;
  lastEventType: string | null;
  lastEventAt: Date | null;
  lastActor: string | null;
};

async function loadReceiptEventStats(
  orgId: string,
  receiptIds: string[],
): Promise<Map<string, ReceiptEventStats>> {
  const stats = new Map<string, ReceiptEventStats>();
  if (receiptIds.length === 0) return stats;

  const rows = await db
    .select({
      receiptId: posReceiptEvents.receiptId,
      eventType: posReceiptEvents.eventType,
      occurredAt: posReceiptEvents.occurredAt,
      actor: posReceiptEvents.actor,
    })
    .from(posReceiptEvents)
    .where(
      and(
        eq(posReceiptEvents.orgId, orgId),
        inArray(posReceiptEvents.receiptId, receiptIds),
      ),
    )
    .orderBy(asc(posReceiptEvents.occurredAt), asc(posReceiptEvents.createdAt));

  for (const row of rows) {
    const current = stats.get(row.receiptId) ?? {
      printCount: 0,
      reprintCount: 0,
      lastEventType: null,
      lastEventAt: null,
      lastActor: null,
    };

    if (row.eventType === RECEIPT_EVENT_TYPES.PRINTED) {
      current.printCount += 1;
    }
    if (row.eventType === RECEIPT_EVENT_TYPES.REPRINTED) {
      current.reprintCount += 1;
    }

    current.lastEventType = row.eventType;
    current.lastEventAt = row.occurredAt;
    current.lastActor = row.actor;

    stats.set(row.receiptId, current);
  }

  return stats;
}

function derivePrintStats(events: PortalReceiptEventRecord[]): PortalReceiptPrintStats {
  let reprintCount = 0;
  let lastPrintAt: string | null = null;
  let hasOriginalPrint = false;

  for (const event of events) {
    if (event.eventType === RECEIPT_EVENT_TYPES.PRINTED) {
      hasOriginalPrint = true;
      lastPrintAt = event.occurredAt;
    }
    if (event.eventType === RECEIPT_EVENT_TYPES.REPRINTED) {
      reprintCount += 1;
      lastPrintAt = event.occurredAt;
    }
  }

  return { hasOriginalPrint, reprintCount, lastPrintAt };
}

export async function fetchPortalReceiptsPage(
  input: FetchPortalReceiptsInput,
): Promise<PortalReceiptsPageData> {
  const period = parsePortalReportsPeriod(input.period);
  const sort = parseReceiptSort(input.sort);
  const paymentFilter = parsePaymentFilter(input.paymentMethod);
  const statusFilter = parseStatusFilter(input.status);
  const search = input.search?.trim() ?? "";

  const searchClause: SQL | undefined = search
    ? or(
        ilike(posReceipts.receiptNumber, `%${search}%`),
        ilike(posReceipts.localReceiptId, `%${search}%`),
      )
    : undefined;

  const statusClause: SQL | undefined =
    statusFilter === "all" ? undefined : eq(posReceipts.status, statusFilter);

  const receiptRows = await db
    .select({
      id: posReceipts.id,
      deviceId: posReceipts.deviceId,
      localReceiptId: posReceipts.localReceiptId,
      receiptNumber: posReceipts.receiptNumber,
      soldAt: posReceipts.soldAt,
      grossCents: posReceipts.grossCents,
      currency: posReceipts.currency,
      fiscalStatus: posReceipts.fiscalStatus,
      status: posReceipts.status,
      localOrderId: posReceipts.localOrderId,
      deviceName: devices.name,
    })
    .from(posReceipts)
    .innerJoin(devices, eq(posReceipts.deviceId, devices.id))
    .where(
      and(
        receiptScope(input.orgId, input.customerId, period),
        statusClause,
        searchClause,
      ),
    )
    .orderBy(
      sort === "oldest" ? asc(posReceipts.soldAt) : desc(posReceipts.soldAt),
    );

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
    .where(
      and(
        eq(posOrders.orgId, input.orgId),
        customerDeviceScope(input.orgId, input.customerId),
        sqlInPeriodBerlin(posOrders.soldAt, period),
      ),
    )
    .orderBy(posOrderLines.lineIndex);

  const linesByOrderKey = groupOrderLinesByDeviceLocalId(lineRows);

  const paymentRows = await db
    .select({
      localOrderId: posSalePayments.localOrderId,
      localReceiptId: posSalePayments.localReceiptId,
      method: posSalePayments.method,
      amountCents: posSalePayments.amountCents,
      currency: posSalePayments.currency,
    })
    .from(posSalePayments)
    .innerJoin(devices, eq(posSalePayments.deviceId, devices.id))
    .where(
      and(
        eq(posSalePayments.orgId, input.orgId),
        customerDeviceScope(input.orgId, input.customerId),
        sqlInPeriodBerlin(posSalePayments.paidAt, period),
      ),
    );

  const paymentsByOrder = new Map<string, string[]>();
  const paymentsByReceipt = new Map<string, string[]>();
  for (const payment of paymentRows) {
    if (payment.localOrderId) {
      const list = paymentsByOrder.get(payment.localOrderId) ?? [];
      list.push(payment.method);
      paymentsByOrder.set(payment.localOrderId, list);
    }
    if (payment.localReceiptId) {
      const list = paymentsByReceipt.get(payment.localReceiptId) ?? [];
      list.push(payment.method);
      paymentsByReceipt.set(payment.localReceiptId, list);
    }
  }

  const eventStats = await loadReceiptEventStats(
    input.orgId,
    receiptRows.map((row) => row.id),
  );

  const currency =
    receiptRows[0]?.currency ?? paymentRows[0]?.currency ?? "EUR";

  const receipts: PortalReceiptListItem[] = [];
  let activeCount = 0;
  let printedCount = 0;
  let reprintedCount = 0;
  const includedReceiptKeys = new Set<string>();

  for (const row of receiptRows) {
    const paymentMethod = pickPrimaryPaymentMethod(
      paymentsByReceipt.get(row.localReceiptId) ??
        (row.localOrderId
          ? paymentsByOrder.get(row.localOrderId) ?? []
          : []),
    );

    if (paymentFilter !== "all") {
      const bucket = bucketPaymentMethod(paymentMethod ?? "");
      if (bucket !== paymentFilter) continue;
    }

    const stats = eventStats.get(row.id);
    const mapped = mapPortalReceiptRecord({
      row,
      paymentMethod,
      items: resolveReceiptLineItems(
        linesByOrderKey,
        row.deviceId,
        row.localOrderId,
      ),
    });

    if (receiptCountsTowardKpis(row.status)) {
      activeCount += 1;
    }

    const printCount = stats?.printCount ?? 0;
    const reprintCount = stats?.reprintCount ?? 0;
    if (printCount > 0) printedCount += 1;
    if (reprintCount > 0) reprintedCount += 1;

    includedReceiptKeys.add(row.localReceiptId);
    if (row.localOrderId) includedReceiptKeys.add(row.localOrderId);

    receipts.push({
      ...mapped,
      deviceName: row.deviceName,
      printCount,
      reprintCount,
      lastEventType: stats?.lastEventType ?? null,
      lastEventAt: stats?.lastEventAt
        ? toPortalReceiptIso(stats.lastEventAt)
        : null,
      cashier: stats?.lastActor?.trim() || null,
    });
  }

  const scopedPayments = paymentRows.filter(
    (payment) =>
      (payment.localReceiptId &&
        includedReceiptKeys.has(payment.localReceiptId)) ||
      (payment.localOrderId && includedReceiptKeys.has(payment.localOrderId)),
  );

  const paymentSummary = aggregatePaymentSummary(scopedPayments);

  return {
    timezone: PORTAL_ORDERS_TIMEZONE,
    period,
    summary: {
      receiptsCount: receipts.length,
      activeCount,
      printedCount,
      reprintedCount,
      refundsCount: 0,
      paymentSummary: {
        ...paymentSummary,
        currency,
      },
    },
    receipts,
  };
}

export async function fetchPortalReceiptDetail(
  orgId: string,
  customerId: string,
  receiptId: string,
): Promise<PortalReceiptDetailData | null> {
  const [row] = await db
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
      deviceName: devices.name,
    })
    .from(posReceipts)
    .innerJoin(devices, eq(posReceipts.deviceId, devices.id))
    .where(
      and(
        eq(posReceipts.id, receiptId),
        eq(posReceipts.orgId, orgId),
        eq(devices.customerId, customerId),
      ),
    )
    .limit(1);

  if (!row) return null;

  const lineRows = row.localOrderId
    ? await db
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
        .where(
          and(
            eq(posOrders.orgId, orgId),
            eq(posOrders.deviceId, row.deviceId),
            eq(posOrders.localOrderId, row.localOrderId),
          ),
        )
        .orderBy(posOrderLines.lineIndex)
    : [];

  const linesByOrderKey = groupOrderLinesByDeviceLocalId(lineRows);

  const paymentRows = await db
    .select({ method: posSalePayments.method })
    .from(posSalePayments)
    .innerJoin(devices, eq(posSalePayments.deviceId, devices.id))
    .where(
      and(
        eq(posSalePayments.orgId, orgId),
        eq(devices.customerId, customerId),
        or(
          eq(posSalePayments.localReceiptId, row.localReceiptId),
          row.localOrderId
            ? eq(posSalePayments.localOrderId, row.localOrderId)
            : sql`false`,
        ),
      ),
    );

  const mapped = mapPortalReceiptRecord({
    row,
    paymentMethod: pickPrimaryPaymentMethod(
      paymentRows.map((payment) => payment.method),
    ),
    items: resolveReceiptLineItems(
      linesByOrderKey,
      row.deviceId,
      row.localOrderId,
    ),
  });

  const eventRows = await db
    .select({
      id: posReceiptEvents.id,
      receiptId: posReceiptEvents.receiptId,
      eventType: posReceiptEvents.eventType,
      occurredAt: posReceiptEvents.occurredAt,
      actor: posReceiptEvents.actor,
      payload: posReceiptEvents.payload,
      schemaVersion: posReceiptEvents.schemaVersion,
    })
    .from(posReceiptEvents)
    .where(
      and(
        eq(posReceiptEvents.orgId, orgId),
        eq(posReceiptEvents.receiptId, receiptId),
      ),
    )
    .orderBy(asc(posReceiptEvents.occurredAt), asc(posReceiptEvents.createdAt));

  const events = eventRows.map(mapPortalReceiptEventRecord);

  return {
    receipt: {
      ...mapped,
      status: normalizeReceiptStatus(row.status),
      deviceName: row.deviceName,
      localOrderId: row.localOrderId,
      netCents: row.netCents,
      taxCents: row.taxCents,
      grossCents: row.grossCents,
    },
    events,
    printStats: derivePrintStats(events),
  };
}
