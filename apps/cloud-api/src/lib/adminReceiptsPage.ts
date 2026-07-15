/**
 * Admin POS receipt list/detail queries (Phase 7 Sprint 1).
 * Cross-customer scope; reuses portal DTO mappers where possible.
 */

import {
  and,
  asc,
  desc,
  eq,
  gte,
  ilike,
  inArray,
  lte,
  or,
  sql,
  type SQL,
} from "drizzle-orm";

import { db } from "../db/client.js";
import { customers } from "../db/schema/customers.js";
import { devices } from "../db/schema/devices.js";
import {
  posOrderLines,
  posOrders,
  posReceiptEvents,
  posReceipts,
  posSalePayments,
} from "../db/schema/posSync.js";
import {
  adminReceiptStatusLabel,
  adminStatusFilterToDbValues,
  mapAdminReceiptDisplayStatus,
  parseAdminReceiptStatusFilter,
  type AdminReceiptDisplayStatus,
  type AdminReceiptStatusFilter,
} from "./adminReceiptStatus.js";
import {
  buildAdminReceiptTimeline,
  type AdminReceiptTimelineEntry,
} from "./adminReceiptTimeline.js";
import { mapPortalReceiptEventRecord } from "./portalReceiptEvents.js";
import {
  aggregateEffectivePaymentSummary,
  appendOrderPaymentRow,
  bucketPaymentMethod,
  pickPrimaryPaymentMethod,
  PORTAL_ORDERS_TIMEZONE,
  type OrderPaymentRow,
  type PaymentBucket,
} from "./portalOrders.js";
import {
  mapPortalReceiptRecord,
  toPortalReceiptIso,
} from "./portalReceipts.js";
import {
  parsePortalReportsPeriod,
  sqlInPeriodBerlin,
  type PortalReportsPeriod,
} from "./portalReportsPeriod.js";
import {
  computeRefundableAmountCents,
  computeRefundedAmountCents,
  receiptHasPaymentChange,
} from "./receiptEventPayload.js";
import {
  deriveChangePaymentActionAvailability,
  deriveRefundActionAvailability,
} from "./receiptMutationService.js";
import { buildLatestPrintPayloads } from "./receiptPrintPayloads.js";
import { RECEIPT_EVENT_TYPES } from "./receiptEventTypes.js";

export type AdminReceiptRefundSummary = {
  originalAmountCents: number;
  refundedAmountCents: number;
  refundableAmountCents: number;
  currency: string;
};

export type AdminReceiptPrintPayloads = {
  latestRefund: Record<string, unknown> | null;
  latestPaymentChange: Record<string, unknown> | null;
};

export type AdminReceiptSort = "newest" | "oldest";

export type AdminReceiptListItem = {
  id: string;
  receiptNumber: string | null;
  issuedAt: string | null;
  storeName: string | null;
  cashier: string | null;
  customerId: string | null;
  customerName: string | null;
  retailCustomer: string | null;
  paymentMethod: string | null;
  displayStatus: AdminReceiptDisplayStatus;
  statusLabel: string;
  amountCents: number;
  currency: string;
};

export type AdminReceiptsSummary = {
  receiptsCount: number;
  paymentSummary: {
    cashCents: number;
    cardCents: number;
    voucherCents: number;
    otherCents: number;
    currency: string;
  };
};

export type AdminReceiptLineItem = {
  productName: string | null;
  sku: string | null;
  quantity: number;
  unitPriceCents: number;
  lineTotalCents: number;
  discountCents: number | null;
  taxRateBps: number | null;
};

export type AdminReceiptActionAvailability = {
  available: boolean;
  reason: string | null;
};

export type AdminReceiptDetailData = {
  receipt: {
    id: string;
    receiptNumber: string | null;
    issuedAt: string | null;
    businessName: string | null;
    customerId: string | null;
    customerName: string | null;
    customerEmail: string | null;
    storeName: string | null;
    deviceId: string;
    cashier: string | null;
    retailCustomer: string | null;
    localReceiptId: string;
    localOrderId: string | null;
    displayStatus: AdminReceiptDisplayStatus;
    statusLabel: string;
    paymentMethod: string | null;
    netCents: number;
    taxCents: number;
    grossCents: number;
    currency: string;
    items: AdminReceiptLineItem[];
  };
  payments: Array<{
    method: string;
    amountCents: number;
    currency: string;
    paidAt: string | null;
  }>;
  timeline: AdminReceiptTimelineEntry[];
  refundSummary: AdminReceiptRefundSummary;
  hasPaymentChange: boolean;
  printPayloads: AdminReceiptPrintPayloads;
  actions: {
    reprint: AdminReceiptActionAvailability;
    refund: AdminReceiptActionAvailability;
    changePayment: AdminReceiptActionAvailability;
  };
};

export type FetchAdminReceiptsInput = {
  period?: string;
  from?: string;
  to?: string;
  customerId?: string;
  customerSearch?: string;
  paymentMethod?: string;
  status?: string;
  search?: string;
  cashier?: string;
  amountMin?: number;
  amountMax?: number;
  sort?: string;
  limit?: number;
  offset?: number;
};

export type AdminReceiptsPageData = {
  timezone: string;
  period: PortalReportsPeriod;
  summary: AdminReceiptsSummary;
  receipts: AdminReceiptListItem[];
  total: number;
  limit: number;
  offset: number;
};

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const COMING_SOON = "Coming in a future sprint";

function parseReceiptSort(raw: string | undefined): AdminReceiptSort {
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

function parseDateRange(
  from: string | undefined,
  to: string | undefined,
): SQL | undefined {
  const fromValue = from?.trim();
  const toValue = to?.trim();
  if (!fromValue && !toValue) return undefined;

  const tz = PORTAL_ORDERS_TIMEZONE;
  const localDate = sql`(${posReceipts.soldAt} AT TIME ZONE ${tz})::date`;
  const clauses: SQL[] = [];

  if (fromValue && DATE_RE.test(fromValue)) {
    clauses.push(sql`${localDate} >= ${fromValue}::date`);
  }
  if (toValue && DATE_RE.test(toValue)) {
    clauses.push(sql`${localDate} <= ${toValue}::date`);
  }

  if (clauses.length === 0) return undefined;
  return and(...clauses);
}

function statusClause(filter: AdminReceiptStatusFilter): SQL | undefined {
  if (filter === "payment_changed") {
    return sql`EXISTS (
      SELECT 1 FROM pos_receipt_events e
      WHERE e.receipt_id = ${posReceipts.id}
        AND e.event_type = ${RECEIPT_EVENT_TYPES.PAYMENT_CHANGED}
    )`;
  }

  const dbValues = adminStatusFilterToDbValues(filter);
  if (!dbValues || dbValues.length === 0) return undefined;
  return inArray(posReceipts.status, dbValues);
}

function cashierFilterClause(cashier: string): SQL {
  const pattern = `%${cashier.trim()}%`;
  return sql`EXISTS (
    SELECT 1 FROM pos_receipt_events e
    WHERE e.receipt_id = ${posReceipts.id}
      AND e.event_type = ${RECEIPT_EVENT_TYPES.CREATED}
      AND e.actor ILIKE ${pattern}
  )`;
}

async function loadCreatedEventCashiers(
  receiptIds: string[],
): Promise<Map<string, string | null>> {
  const map = new Map<string, string | null>();
  if (receiptIds.length === 0) return map;

  const rows = await db
    .select({
      receiptId: posReceiptEvents.receiptId,
      actor: posReceiptEvents.actor,
    })
    .from(posReceiptEvents)
    .where(
      and(
        inArray(posReceiptEvents.receiptId, receiptIds),
        eq(posReceiptEvents.eventType, RECEIPT_EVENT_TYPES.CREATED),
      ),
    );

  for (const row of rows) {
    map.set(row.receiptId, row.actor?.trim() || null);
  }

  return map;
}

function buildActions(input: {
  status: string | null | undefined;
  refundableAmountCents: number;
  hasPayment: boolean;
}) {
  return {
    reprint: { available: false, reason: COMING_SOON },
    refund: deriveRefundActionAvailability({
      status: input.status,
      refundableAmountCents: input.refundableAmountCents,
    }),
    changePayment: deriveChangePaymentActionAvailability({
      status: input.status,
      hasPayment: input.hasPayment,
    }),
  };
}

export async function fetchAdminReceiptsPage(
  input: FetchAdminReceiptsInput,
): Promise<AdminReceiptsPageData> {
  const period = parsePortalReportsPeriod(input.period ?? "30_days");
  const sort = parseReceiptSort(input.sort);
  const paymentFilter = parsePaymentFilter(input.paymentMethod);
  const statusFilter = parseAdminReceiptStatusFilter(input.status);
  const search = input.search?.trim() ?? "";
  const customerSearch = input.customerSearch?.trim() ?? "";
  const cashier = input.cashier?.trim() ?? "";
  const limit = Math.min(Math.max(input.limit ?? 50, 1), 200);
  const offset = Math.max(input.offset ?? 0, 0);

  const searchClause: SQL | undefined = search
    ? or(
        ilike(posReceipts.receiptNumber, `%${search}%`),
        ilike(posReceipts.localReceiptId, `%${search}%`),
      )
    : undefined;

  const customerIdClause: SQL | undefined = input.customerId?.trim()
    ? eq(devices.customerId, input.customerId.trim())
    : undefined;

  const customerSearchClause: SQL | undefined = customerSearch
    ? or(
        ilike(customers.name, `%${customerSearch}%`),
        ilike(customers.email, `%${customerSearch}%`),
      )
    : undefined;

  const dateClause =
    parseDateRange(input.from, input.to) ??
    sqlInPeriodBerlin(posReceipts.soldAt, period);

  const amountClauses: SQL[] = [];
  if (
    typeof input.amountMin === "number" &&
    Number.isInteger(input.amountMin) &&
    input.amountMin >= 0
  ) {
    amountClauses.push(gte(posReceipts.grossCents, input.amountMin));
  }
  if (
    typeof input.amountMax === "number" &&
    Number.isInteger(input.amountMax) &&
    input.amountMax >= 0
  ) {
    amountClauses.push(lte(posReceipts.grossCents, input.amountMax));
  }

  const whereClause = and(
    dateClause,
    statusClause(statusFilter),
    searchClause,
    customerIdClause,
    customerSearchClause,
    cashier ? cashierFilterClause(cashier) : undefined,
    amountClauses.length > 0 ? and(...amountClauses) : undefined,
  );

  const [countRow] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(posReceipts)
    .innerJoin(devices, eq(posReceipts.deviceId, devices.id))
    .leftJoin(customers, eq(devices.customerId, customers.id))
    .where(whereClause);

  const receiptRows = await db
    .select({
      id: posReceipts.id,
      orgId: posReceipts.orgId,
      deviceId: posReceipts.deviceId,
      localReceiptId: posReceipts.localReceiptId,
      receiptNumber: posReceipts.receiptNumber,
      soldAt: posReceipts.soldAt,
      grossCents: posReceipts.grossCents,
      currency: posReceipts.currency,
      status: posReceipts.status,
      localOrderId: posReceipts.localOrderId,
      deviceName: devices.name,
      customerId: customers.id,
      customerName: customers.name,
    })
    .from(posReceipts)
    .innerJoin(devices, eq(posReceipts.deviceId, devices.id))
    .leftJoin(customers, eq(devices.customerId, customers.id))
    .where(whereClause)
    .orderBy(
      sort === "oldest" ? asc(posReceipts.soldAt) : desc(posReceipts.soldAt),
    )
    .limit(limit)
    .offset(offset);

  const receiptIds = receiptRows.map((row) => row.id);
  const cashierByReceipt = await loadCreatedEventCashiers(receiptIds);

  const localReceiptIds = receiptRows.map((row) => row.localReceiptId);
  const localOrderIds = receiptRows
    .map((row) => row.localOrderId)
    .filter((id): id is string => Boolean(id));

  const paymentRows =
    receiptRows.length === 0
      ? []
      : await db
          .select({
            orgId: posSalePayments.orgId,
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
          .where(
            and(
              inArray(
                posSalePayments.orgId,
                [...new Set(receiptRows.map((row) => row.orgId))],
              ),
              or(
                localReceiptIds.length > 0
                  ? inArray(posSalePayments.localReceiptId, localReceiptIds)
                  : sql`false`,
                localOrderIds.length > 0
                  ? inArray(posSalePayments.localOrderId, localOrderIds)
                  : sql`false`,
              ),
            ),
          );

  const paymentsByOrder = new Map<string, OrderPaymentRow[]>();
  const paymentsByReceipt = new Map<string, OrderPaymentRow[]>();
  const scopedPaymentAmounts: OrderPaymentRow[] = [];

  for (const payment of paymentRows) {
    const row: OrderPaymentRow = {
      deviceId: payment.deviceId,
      localOrderId: payment.localOrderId,
      localReceiptId: payment.localReceiptId,
      localPaymentId: payment.localPaymentId,
      method: payment.method,
      amountCents: payment.amountCents,
      paidAt: payment.paidAt,
      updatedAt: payment.updatedAt,
    };
    if (payment.localOrderId) {
      appendOrderPaymentRow(paymentsByOrder, payment.localOrderId, row);
    }
    if (payment.localReceiptId) {
      appendOrderPaymentRow(paymentsByReceipt, payment.localReceiptId, row);
    }
  }

  const receipts: AdminReceiptListItem[] = [];

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

    const displayStatus = mapAdminReceiptDisplayStatus(row.status);

    const matchingPayments = paymentRows
      .filter(
        (payment) =>
          payment.orgId === row.orgId &&
          (payment.localReceiptId === row.localReceiptId ||
            (row.localOrderId && payment.localOrderId === row.localOrderId)),
      )
      .map((payment) => ({
        deviceId: payment.deviceId,
        localOrderId: payment.localOrderId,
        localReceiptId: payment.localReceiptId,
        localPaymentId: payment.localPaymentId,
        method: payment.method,
        amountCents: payment.amountCents,
        paidAt: payment.paidAt,
        updatedAt: payment.updatedAt,
      }));
    scopedPaymentAmounts.push(...matchingPayments);

    receipts.push({
      id: row.id,
      receiptNumber: row.receiptNumber,
      issuedAt: toPortalReceiptIso(row.soldAt),
      storeName: row.deviceName,
      cashier: cashierByReceipt.get(row.id) ?? null,
      customerId: row.customerId,
      customerName: row.customerName,
      retailCustomer: null,
      paymentMethod,
      displayStatus,
      statusLabel: adminReceiptStatusLabel(displayStatus),
      amountCents: row.grossCents,
      currency: row.currency,
    });
  }

  const currency =
    receiptRows[0]?.currency ?? paymentRows[0]?.currency ?? "EUR";

  return {
    timezone: PORTAL_ORDERS_TIMEZONE,
    period,
    summary: {
      receiptsCount: receipts.length,
      paymentSummary: {
        ...aggregateEffectivePaymentSummary(scopedPaymentAmounts),
        currency,
      },
    },
    receipts,
    total: countRow?.count ?? 0,
    limit,
    offset,
  };
}

export async function fetchAdminReceiptDetail(
  receiptId: string,
): Promise<AdminReceiptDetailData | null> {
  const [row] = await db
    .select({
      id: posReceipts.id,
      orgId: posReceipts.orgId,
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
      customerId: customers.id,
      customerName: customers.name,
      customerEmail: customers.email,
    })
    .from(posReceipts)
    .innerJoin(devices, eq(posReceipts.deviceId, devices.id))
    .leftJoin(customers, eq(devices.customerId, customers.id))
    .where(eq(posReceipts.id, receiptId))
    .limit(1);

  if (!row) return null;

  const lineRows = row.localOrderId
    ? await db
        .select({
          productName: posOrderLines.productName,
          sku: posOrderLines.sku,
          quantity: posOrderLines.quantity,
          unitPriceCents: posOrderLines.unitPriceCents,
          lineTotalCents: posOrderLines.lineTotalCents,
          taxRateBps: posOrderLines.taxRateBps,
        })
        .from(posOrderLines)
        .innerJoin(posOrders, eq(posOrderLines.orderId, posOrders.id))
        .where(
          and(
            eq(posOrders.orgId, row.orgId),
            eq(posOrders.deviceId, row.deviceId),
            eq(posOrders.localOrderId, row.localOrderId),
          ),
        )
        .orderBy(posOrderLines.lineIndex)
    : [];

  const items: AdminReceiptLineItem[] = lineRows.map((line) => ({
    productName: line.productName,
    sku: line.sku,
    quantity: line.quantity,
    unitPriceCents: line.unitPriceCents,
    lineTotalCents: line.lineTotalCents,
    discountCents: null,
    taxRateBps: line.taxRateBps,
  }));

  const paymentRows = await db
    .select({
      method: posSalePayments.method,
      amountCents: posSalePayments.amountCents,
      currency: posSalePayments.currency,
      paidAt: posSalePayments.paidAt,
    })
    .from(posSalePayments)
    .where(
      and(
        eq(posSalePayments.orgId, row.orgId),
        or(
          eq(posSalePayments.localReceiptId, row.localReceiptId),
          row.localOrderId
            ? eq(posSalePayments.localOrderId, row.localOrderId)
            : sql`false`,
        ),
      ),
    );

  const mapped = mapPortalReceiptRecord({
    row: {
      id: row.id,
      deviceId: row.deviceId,
      localReceiptId: row.localReceiptId,
      receiptNumber: row.receiptNumber,
      soldAt: row.soldAt,
      grossCents: row.grossCents,
      currency: row.currency,
      fiscalStatus: row.fiscalStatus,
      status: row.status,
      localOrderId: row.localOrderId,
    },
    paymentMethod: pickPrimaryPaymentMethod(
      paymentRows.map((payment) => payment.method),
    ),
    items: items.map((item) => ({
      productName: item.productName,
      sku: item.sku,
      quantity: item.quantity,
      unitPriceCents: item.unitPriceCents,
      lineTotalCents: item.lineTotalCents,
    })),
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
        eq(posReceiptEvents.orgId, row.orgId),
        eq(posReceiptEvents.receiptId, receiptId),
      ),
    )
    .orderBy(asc(posReceiptEvents.occurredAt), asc(posReceiptEvents.createdAt));

  const events = eventRows.map(mapPortalReceiptEventRecord);
  const createdActor =
    events.find((event) => event.eventType === RECEIPT_EVENT_TYPES.CREATED)
      ?.actor ?? null;

  const displayStatus = mapAdminReceiptDisplayStatus(row.status);
  const refundedAmountCents = computeRefundedAmountCents(events);
  const refundableAmountCents = computeRefundableAmountCents(
    row.grossCents,
    refundedAmountCents,
  );
  const printPayloads = buildLatestPrintPayloads({
    receipt: {
      receiptNumber: row.receiptNumber,
      businessName: row.customerName,
      registerName: row.deviceName,
      grossCents: row.grossCents,
      currency: row.currency,
      shiftId: null,
    },
    events,
  });

  return {
    receipt: {
      id: mapped.id,
      receiptNumber: mapped.receiptNumber,
      issuedAt: mapped.issuedAt,
      businessName: row.customerName,
      customerId: row.customerId,
      customerName: row.customerName,
      customerEmail: row.customerEmail,
      storeName: row.deviceName,
      deviceId: row.deviceId,
      cashier: createdActor?.trim() || null,
      retailCustomer: mapped.customer,
      localReceiptId: mapped.localReceiptId,
      localOrderId: row.localOrderId,
      displayStatus,
      statusLabel: adminReceiptStatusLabel(displayStatus),
      paymentMethod: mapped.paymentMethod,
      netCents: row.netCents,
      taxCents: row.taxCents,
      grossCents: row.grossCents,
      currency: row.currency,
      items,
    },
    payments: paymentRows.map((payment) => ({
      method: payment.method,
      amountCents: payment.amountCents,
      currency: payment.currency,
      paidAt: payment.paidAt ? payment.paidAt.toISOString() : null,
    })),
    timeline: buildAdminReceiptTimeline({
      soldAt: row.soldAt,
      events,
    }),
    refundSummary: {
      originalAmountCents: row.grossCents,
      refundedAmountCents,
      refundableAmountCents,
      currency: row.currency,
    },
    hasPaymentChange: receiptHasPaymentChange(events),
    printPayloads: {
      latestRefund: printPayloads.latestRefund,
      latestPaymentChange: printPayloads.latestPaymentChange,
    },
    actions: buildActions({
      status: row.status,
      refundableAmountCents,
      hasPayment: paymentRows.length > 0,
    }),
  };
}
