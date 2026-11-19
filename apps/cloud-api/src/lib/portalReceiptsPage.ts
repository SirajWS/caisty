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
  aggregateEffectivePaymentSummary,
  appendOrderPaymentRow,
  groupOrderLinesByDeviceLocalId,
  pickPrimaryPaymentMethod,
  resolveReceiptLineItems,
  type OrderPaymentRow,
  type PaymentBucket,
} from "./portalOrders.js";
import {
  mapPortalReceiptRecord,
  toPortalReceiptIso,
  type PortalReceiptRecord,
} from "./portalReceipts.js";
import {
  evaluateSaleFinancialInclusion,
  resolvePeriodCurrencies,
} from "../../../../packages/business-currency/src/index.ts";
import {
  REPORTS_TIMEZONE,
  asReportWindow,
  parsePortalReportsSummaryQuery,
  sqlInReportWindow,
  type PortalReportsPeriodResponse,
  type PortalReportsWindow,
  type SalesPeriodInput,
} from "./portalReportsPeriod.js";
import {
  fetchPosRevenueCentsForPeriod,
  loadActiveBusinessCurrency,
  paymentRowFinanciallyIncluded,
} from "./portalSalesSummary.js";
import {
  computeRefundableAmountCents,
  computeRefundedAmountCents,
  receiptHasPaymentChange,
  sanitizeEventForPortal,
} from "./receiptEventPayload.js";
import {
  buildPortalReceiptTimeline,
  type PortalReceiptTimelineEntry,
} from "./portalReceiptTimeline.js";
import {
  computeTotalPages,
  parseReceiptPagination,
} from "./portalReceiptPagination.js";
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
  posRevenueCents: number;
  mixedCurrency: boolean;
  financialCurrency: string;
  includedTransactionCount: number;
  excludedTransactionCount: number;
  excludedCurrencies: string[];
  hasCurrencyInconsistencies: boolean;
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
  period: PortalReportsPeriodResponse;
  from?: string;
  to?: string;
  summary: PortalReceiptsSummary;
  receipts: PortalReceiptListItem[];
  pagination: {
    total: number;
    limit: number;
    offset: number;
    page: number;
    totalPages: number;
  };
};

export type PortalReceiptPrintStats = {
  hasOriginalPrint: boolean;
  reprintCount: number;
  lastPrintAt: string | null;
};

export type PortalReceiptRefundSummary = {
  originalAmountCents: number;
  refundedAmountCents: number;
  refundableAmountCents: number;
  currency: string;
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
  timeline: PortalReceiptTimelineEntry[];
  refundSummary: PortalReceiptRefundSummary;
  hasPaymentChange: boolean;
  printStats: PortalReceiptPrintStats;
};

export type FetchPortalReceiptsInput = {
  orgId: string;
  customerId: string;
  period?: string | SalesPeriodInput;
  from?: string;
  to?: string;
  paymentMethod?: string;
  status?: string;
  search?: string;
  sort?: string;
  limit?: string | number;
  offset?: string | number;
  page?: string | number;
};

export function resolveReceiptsReportWindow(
  input: Pick<FetchPortalReceiptsInput, "period" | "from" | "to">,
): PortalReportsWindow {
  if (input.period && typeof input.period === "object" && "kind" in input.period) {
    return input.period;
  }
  return parsePortalReportsSummaryQuery({
    period: input.period,
    from: input.from,
    to: input.to,
  });
}

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
  period: SalesPeriodInput,
) {
  return and(
    eq(posReceipts.orgId, orgId),
    customerDeviceScope(orgId, customerId),
    sqlInReportWindow(posReceipts.soldAt, asReportWindow(period)),
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

function receiptPaymentBucketExists(
  orgId: string,
  customerId: string,
  bucket: PaymentBucket,
): SQL {
  const methodMatch = (() => {
    switch (bucket) {
      case "cash":
        return sql`(
          lower(${posSalePayments.method}) = 'cash'
          or lower(${posSalePayments.method}) like '%cash%'
        )`;
      case "card":
        return sql`(
          lower(${posSalePayments.method}) in ('card', 'credit', 'debit', 'ec', 'girocard')
          or lower(${posSalePayments.method}) like '%card%'
          or lower(${posSalePayments.method}) like '%credit%'
          or lower(${posSalePayments.method}) like '%debit%'
        )`;
      case "voucher":
        return sql`(
          lower(${posSalePayments.method}) in ('voucher', 'gift')
          or lower(${posSalePayments.method}) like '%voucher%'
          or lower(${posSalePayments.method}) like '%gift%'
        )`;
      default:
        return sql`(
          lower(${posSalePayments.method}) not in ('cash', 'card', 'credit', 'debit', 'ec', 'girocard', 'voucher', 'gift')
          and lower(${posSalePayments.method}) not like '%cash%'
          and lower(${posSalePayments.method}) not like '%card%'
          and lower(${posSalePayments.method}) not like '%credit%'
          and lower(${posSalePayments.method}) not like '%debit%'
          and lower(${posSalePayments.method}) not like '%voucher%'
          and lower(${posSalePayments.method}) not like '%gift%'
        )`;
    }
  })();

  return sql`exists (
    select 1
    from ${posSalePayments}
    inner join ${devices} on ${eq(posSalePayments.deviceId, devices.id)}
    where ${eq(posSalePayments.orgId, orgId)}
      and ${eq(devices.customerId, customerId)}
      and (
        ${posSalePayments.localReceiptId} = ${posReceipts.localReceiptId}
        or (
          ${posReceipts.localOrderId} is not null
          and ${posSalePayments.localOrderId} = ${posReceipts.localOrderId}
        )
      )
      and ${methodMatch}
  )`;
}

function buildReceiptWhereClause(input: {
  orgId: string;
  customerId: string;
  period: SalesPeriodInput;
  statusFilter: ReceiptStatus | "all";
  search: string;
  paymentFilter: PaymentBucket | "all";
}): SQL {
  const searchClause: SQL | undefined = input.search
    ? or(
        ilike(posReceipts.receiptNumber, `%${input.search}%`),
        ilike(posReceipts.localReceiptId, `%${input.search}%`),
      )
    : undefined;

  const statusClause: SQL | undefined =
    input.statusFilter === "all"
      ? undefined
      : eq(posReceipts.status, input.statusFilter);

  const paymentClause: SQL | undefined =
    input.paymentFilter === "all"
      ? undefined
      : receiptPaymentBucketExists(
          input.orgId,
          input.customerId,
          input.paymentFilter,
        );

  return and(
    receiptScope(input.orgId, input.customerId, input.period),
    statusClause,
    searchClause,
    paymentClause,
  )!;
}

type ReceiptRowStub = {
  id: string;
  deviceId: string;
  localReceiptId: string;
  receiptNumber: string | null;
  soldAt: Date;
  grossCents: number;
  currency: string;
  fiscalStatus: string;
  status: string | null;
  localOrderId: string | null;
  deviceName: string;
};

async function mapReceiptRowsToListItems(input: {
  orgId: string;
  customerId: string;
  period: SalesPeriodInput;
  rows: ReceiptRowStub[];
}): Promise<PortalReceiptListItem[]> {
  if (!input.rows.length) return [];

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
        sqlInReportWindow(posOrders.soldAt, asReportWindow(input.period)),
      ),
    )
    .orderBy(posOrderLines.lineIndex);

  const linesByOrderKey = groupOrderLinesByDeviceLocalId(lineRows);

  const paymentRows = await db
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
    .where(
      and(
        eq(posSalePayments.orgId, input.orgId),
        customerDeviceScope(input.orgId, input.customerId),
        sqlInReportWindow(posSalePayments.paidAt, asReportWindow(input.period)),
      ),
    );

  const paymentsByOrder = new Map<string, OrderPaymentRow[]>();
  const paymentsByReceipt = new Map<string, OrderPaymentRow[]>();
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

  const eventStats = await loadReceiptEventStats(
    input.orgId,
    input.rows.map((row) => row.id),
  );

  return input.rows.map((row) => {
    const paymentMethod = pickPrimaryPaymentMethod(
      paymentsByReceipt.get(row.localReceiptId) ??
        (row.localOrderId
          ? paymentsByOrder.get(row.localOrderId) ?? []
          : []),
    );
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

    return {
      ...mapped,
      deviceName: row.deviceName,
      printCount: stats?.printCount ?? 0,
      reprintCount: stats?.reprintCount ?? 0,
      lastEventType: stats?.lastEventType ?? null,
      lastEventAt: stats?.lastEventAt
        ? toPortalReceiptIso(stats.lastEventAt)
        : null,
      cashier: stats?.lastActor?.trim() || null,
    };
  });
}

async function buildReceiptsSummary(input: {
  orgId: string;
  customerId: string;
  period: SalesPeriodInput;
  whereClause: SQL;
}): Promise<PortalReceiptsSummary> {
  const filteredRows = await db
    .select({
      id: posReceipts.id,
      status: posReceipts.status,
      localReceiptId: posReceipts.localReceiptId,
      localOrderId: posReceipts.localOrderId,
      currency: posReceipts.currency,
      orderCurrency: posOrders.currency,
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
    .where(input.whereClause);

  const eventStats = await loadReceiptEventStats(
    input.orgId,
    filteredRows.map((row) => row.id),
  );

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
        sqlInReportWindow(posSalePayments.paidAt, asReportWindow(input.period)),
      ),
    );

  const includedReceiptKeys = new Set<string>();
  for (const row of filteredRows) {
    includedReceiptKeys.add(row.localReceiptId);
    if (row.localOrderId) includedReceiptKeys.add(row.localOrderId);
  }

  let activeCount = 0;
  let printedCount = 0;
  let reprintedCount = 0;
  let refundsCount = 0;

  for (const row of filteredRows) {
    if (receiptCountsTowardKpis(row.status)) {
      activeCount += 1;
    }

    const stats = eventStats.get(row.id);
    if ((stats?.printCount ?? 0) > 0) printedCount += 1;
    if ((stats?.reprintCount ?? 0) > 0) reprintedCount += 1;

    const normalizedStatus = normalizeReceiptStatus(row.status);
    if (
      normalizedStatus === "refunded" ||
      normalizedStatus === "partial_refund"
    ) {
      refundsCount += 1;
    }
  }

  const scopedPayments = paymentRows.filter(
    (payment) =>
      (payment.localReceiptId &&
        includedReceiptKeys.has(payment.localReceiptId)) ||
      (payment.localOrderId && includedReceiptKeys.has(payment.localOrderId)),
  );

  const financialCurrency = await loadActiveBusinessCurrency(input.orgId);
  const receiptCurrencyByLocalId = new Map(
    filteredRows.map((row) => [row.localReceiptId, row.currency]),
  );
  const orderCurrencyByLocalId = new Map(
    filteredRows
      .filter((row) => row.localOrderId)
      .map((row) => [row.localOrderId as string, row.orderCurrency]),
  );

  let includedTransactionCount = 0;
  let excludedTransactionCount = 0;
  let hasCurrencyInconsistencies = false;
  const excludedCurrencySet = new Set<string>();

  for (const row of filteredRows) {
    const linkedPayments = scopedPayments.filter(
      (payment) =>
        payment.localReceiptId === row.localReceiptId ||
        (row.localOrderId && payment.localOrderId === row.localOrderId),
    );
    const sources: Array<{ currency: string | null | undefined }> = [
      { currency: row.currency },
    ];
    if (row.localOrderId) sources.push({ currency: row.orderCurrency });
    for (const payment of linkedPayments) {
      sources.push({ currency: payment.currency });
    }
    const inclusion = evaluateSaleFinancialInclusion({
      activeCurrency: financialCurrency,
      sources,
    });
    if (inclusion.inconsistent) hasCurrencyInconsistencies = true;
    if (inclusion.included && receiptCountsTowardKpis(row.status)) {
      includedTransactionCount += 1;
    } else {
      excludedTransactionCount += 1;
      for (const code of inclusion.recordedCurrencies) {
        if (code !== financialCurrency) excludedCurrencySet.add(code);
      }
    }
  }

  const periodCurrencies = resolvePeriodCurrencies([
    ...filteredRows.map((row) => row.currency),
    ...scopedPayments.map((row) => row.currency),
  ]);
  const mixedCurrency =
    periodCurrencies.mixedCurrency || excludedCurrencySet.size > 0;

  const financialPayments = scopedPayments.filter((payment) =>
    paymentRowFinanciallyIncluded(
      {
        ...payment,
        hasReceipt: Boolean(payment.localReceiptId),
        hasOrder: Boolean(payment.localOrderId),
        receiptCurrency: payment.localReceiptId
          ? receiptCurrencyByLocalId.get(payment.localReceiptId)
          : undefined,
        orderCurrency: payment.localOrderId
          ? orderCurrencyByLocalId.get(payment.localOrderId)
          : undefined,
      },
      financialCurrency,
    ),
  );

  const posRevenueCents = await fetchPosRevenueCentsForPeriod({
    orgId: input.orgId,
    customerId: input.customerId,
    period: input.period,
    financialCurrency,
  });

  return {
    receiptsCount: filteredRows.length,
    activeCount,
    printedCount,
    reprintedCount,
    refundsCount,
    posRevenueCents,
    mixedCurrency,
    financialCurrency,
    includedTransactionCount,
    excludedTransactionCount,
    excludedCurrencies: [...excludedCurrencySet],
    hasCurrencyInconsistencies,
    paymentSummary: {
      ...aggregateEffectivePaymentSummary(financialPayments),
      currency: financialCurrency,
    },
  };
}

export async function fetchPortalReceiptsPage(
  input: FetchPortalReceiptsInput,
): Promise<PortalReceiptsPageData> {
  const period = resolveReceiptsReportWindow(input);
  const sort = parseReceiptSort(input.sort);
  const paymentFilter = parsePaymentFilter(input.paymentMethod);
  const statusFilter = parseStatusFilter(input.status);
  const search = input.search?.trim() ?? "";
  const pagination = parseReceiptPagination(input);

  const whereClause = buildReceiptWhereClause({
    orgId: input.orgId,
    customerId: input.customerId,
    period,
    statusFilter,
    search,
    paymentFilter,
  });

  const [countRow] = await db
    .select({ total: sql<number>`count(*)::int` })
    .from(posReceipts)
    .innerJoin(devices, eq(posReceipts.deviceId, devices.id))
    .where(whereClause);

  const total = countRow?.total ?? 0;
  const totalPages = computeTotalPages(total, pagination.limit);
  const effectiveOffset =
    totalPages > 0 && pagination.offset >= total
      ? Math.max(totalPages - 1, 0) * pagination.limit
      : pagination.offset;
  const effectivePage =
    totalPages > 0
      ? Math.min(Math.floor(effectiveOffset / pagination.limit) + 1, totalPages)
      : 1;

  const receiptRows = total
    ? await db
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
        .where(whereClause)
        .orderBy(
          sort === "oldest" ? asc(posReceipts.soldAt) : desc(posReceipts.soldAt),
        )
        .limit(pagination.limit)
        .offset(effectiveOffset)
    : [];

  const [summary, receipts] = await Promise.all([
    buildReceiptsSummary({
      orgId: input.orgId,
      customerId: input.customerId,
      period,
      whereClause,
    }),
    mapReceiptRowsToListItems({
      orgId: input.orgId,
      customerId: input.customerId,
      period,
      rows: receiptRows,
    }),
  ]);

  return {
    timezone: REPORTS_TIMEZONE,
    period: period.period,
    ...(period.kind === "custom" ? { from: period.from, to: period.to } : {}),
    summary,
    receipts,
    pagination: {
      total,
      limit: pagination.limit,
      offset: effectiveOffset,
      page: effectivePage,
      totalPages,
    },
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
  const portalEvents = events.map(sanitizeEventForPortal);
  const refundedAmountCents = computeRefundedAmountCents(events);

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
    events: portalEvents,
    timeline: buildPortalReceiptTimeline({
      soldAt: row.soldAt,
      currency: row.currency,
      events,
    }),
    refundSummary: {
      originalAmountCents: row.grossCents,
      refundedAmountCents,
      refundableAmountCents: computeRefundableAmountCents(
        row.grossCents,
        refundedAmountCents,
      ),
      currency: row.currency,
    },
    hasPaymentChange: receiptHasPaymentChange(events),
    printStats: derivePrintStats(events),
  };
}
