import {
  and,
  asc,
  eq,
  gt,
  inArray,
  or,
  type SQL,
} from "drizzle-orm";

import { db } from "../db/client.js";
import {
  posOrderLines,
  posOrders,
  posReceiptEvents,
  posReceipts,
  posSalePayments,
  posShifts,
} from "../db/schema/posSync.js";
import type { PosDeviceAuthContext } from "../lib/posDeviceAuth.js";
import { InvalidPullCursorError } from "./pullErrors.js";
import { decodePullCursor, encodePullCursor } from "./pullCursor.js";
import {
  deviceLocalKey,
  latestLocalPaymentIdByDeviceReceipt,
  latestPaymentMethodByDeviceOrder,
  type PullPaymentRefCandidate,
} from "./pullLocalRefs.js";
import type {
  PosPullEntityType,
  PosPullOrderLineSnapshot,
  PosPullOrderSnapshot,
  PosPullReceiptEventSnapshot,
  PosPullReceiptSnapshot,
  PosPullRequest,
  PosPullResponse,
  PosPullShiftSnapshot,
  PosPullPaymentSnapshot,
} from "./types.js";

type EntityPage<T> = {
  items: T[];
  hasMore: boolean;
  nextCursor: string | null;
};

export class PosPullService {
  async pullChanges(
    request: PosPullRequest,
    auth: PosDeviceAuthContext,
  ): Promise<PosPullResponse> {
    const [ordersPage, receiptsPage, paymentsPage, receiptEventsPage, shiftsPage] =
      await Promise.all([
        this.pullOrders(auth.orgId, request.cursors.orders, request.limit),
        this.pullReceipts(auth.orgId, request.cursors.receipts, request.limit),
        this.pullPayments(auth.orgId, request.cursors.payments, request.limit),
        this.pullReceiptEvents(auth.orgId, request.cursors.receiptEvents, request.limit),
        this.pullShifts(auth.orgId, request.cursors.shifts, request.limit),
      ]);

    return {
      ok: true,
      schemaVersion: 1,
      serverTime: new Date().toISOString(),
      scope: {
        orgId: auth.orgId,
        deviceId: auth.deviceId,
      },
      changes: {
        orders: ordersPage.items,
        receipts: receiptsPage.items,
        payments: paymentsPage.items,
        receiptEvents: receiptEventsPage.items,
        shifts: shiftsPage.items,
      },
      nextCursors: {
        orders: ordersPage.nextCursor,
        receipts: receiptsPage.nextCursor,
        payments: paymentsPage.nextCursor,
        receiptEvents: receiptEventsPage.nextCursor,
        shifts: shiftsPage.nextCursor,
      },
      hasMore: {
        orders: ordersPage.hasMore,
        receipts: receiptsPage.hasMore,
        payments: paymentsPage.hasMore,
        receiptEvents: receiptEventsPage.hasMore,
        shifts: shiftsPage.hasMore,
      },
    };
  }

  private async pullOrders(
    orgId: string,
    encodedCursor: string | null,
    limit: number,
  ): Promise<EntityPage<PosPullOrderSnapshot>> {
    const cursorFilter = this.buildCursorFilter(
      encodedCursor,
      posOrders.updatedAt,
      posOrders.id,
    );

    const rows = await db
      .select()
      .from(posOrders)
      .where(and(eq(posOrders.orgId, orgId), cursorFilter))
      .orderBy(asc(posOrders.updatedAt), asc(posOrders.id))
      .limit(limit + 1);

    const pageRows = rows.slice(0, limit);
    const orderIds = pageRows.map((row) => row.id);
    const localOrderIds = [...new Set(pageRows.map((row) => row.localOrderId))];
    const deviceIds = [...new Set(pageRows.map((row) => row.deviceId))];

    const orderLines =
      orderIds.length > 0
        ? await db
            .select()
            .from(posOrderLines)
            .where(and(eq(posOrderLines.orgId, orgId), inArray(posOrderLines.orderId, orderIds)))
            .orderBy(asc(posOrderLines.orderId), asc(posOrderLines.lineIndex), asc(posOrderLines.id))
        : [];

    const paymentsByOrder =
      localOrderIds.length > 0 && deviceIds.length > 0
        ? await db
            .select({
              id: posSalePayments.id,
              deviceId: posSalePayments.deviceId,
              localPaymentId: posSalePayments.localPaymentId,
              localOrderId: posSalePayments.localOrderId,
              localReceiptId: posSalePayments.localReceiptId,
              method: posSalePayments.method,
              paidAt: posSalePayments.paidAt,
              updatedAt: posSalePayments.updatedAt,
            })
            .from(posSalePayments)
            .where(
              and(
                eq(posSalePayments.orgId, orgId),
                inArray(posSalePayments.deviceId, deviceIds),
                inArray(posSalePayments.localOrderId, localOrderIds),
              ),
            )
        : [];

    const linesByOrderId = new Map<string, PosPullOrderLineSnapshot[]>();
    for (const line of orderLines) {
      const existing = linesByOrderId.get(line.orderId) ?? [];
      existing.push({
        id: line.id,
        lineIndex: line.lineIndex,
        productName: line.productName,
        sku: line.sku,
        quantity: line.quantity,
        unitPriceCents: line.unitPriceCents,
        lineTotalCents: line.lineTotalCents,
        taxRateBps: line.taxRateBps,
        createdAt: line.createdAt.toISOString(),
      });
      linesByOrderId.set(line.orderId, existing);
    }

    const latestPaymentMethodByDeviceOrderKey = latestPaymentMethodByDeviceOrder(
      paymentsByOrder as PullPaymentRefCandidate[],
    );

    const snapshots: PosPullOrderSnapshot[] = pageRows.map((row) => ({
      id: row.id,
      localOrderId: row.localOrderId,
      providerOrderId: row.providerOrderId,
      platform: row.platform,
      sourceDeviceId: row.deviceId,
      status: row.status,
      paymentStatus: row.paymentStatus,
      paymentMethod:
        latestPaymentMethodByDeviceOrderKey.get(
          deviceLocalKey(row.deviceId, row.localOrderId),
        ) ?? null,
      totalCents: row.totalCents,
      currency: row.currency,
      soldAt: row.soldAt.toISOString(),
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
      lines: linesByOrderId.get(row.id) ?? [],
    }));

    return this.buildPageFromRows("orders", rows, snapshots, limit, (row) => ({
      timestamp: row.updatedAt.toISOString(),
      id: row.id,
    }));
  }

  private async pullReceipts(
    orgId: string,
    encodedCursor: string | null,
    limit: number,
  ): Promise<EntityPage<PosPullReceiptSnapshot>> {
    const cursorFilter = this.buildCursorFilter(
      encodedCursor,
      posReceipts.updatedAt,
      posReceipts.id,
    );

    const rows = await db
      .select()
      .from(posReceipts)
      .where(and(eq(posReceipts.orgId, orgId), cursorFilter))
      .orderBy(asc(posReceipts.updatedAt), asc(posReceipts.id))
      .limit(limit + 1);

    const pageRows = rows.slice(0, limit);
    const localReceiptIds = [
      ...new Set(pageRows.map((row) => row.localReceiptId)),
    ];
    const deviceIds = [...new Set(pageRows.map((row) => row.deviceId))];

    const paymentsByReceipt =
      localReceiptIds.length > 0 && deviceIds.length > 0
        ? await db
            .select({
              id: posSalePayments.id,
              deviceId: posSalePayments.deviceId,
              localPaymentId: posSalePayments.localPaymentId,
              localOrderId: posSalePayments.localOrderId,
              localReceiptId: posSalePayments.localReceiptId,
              method: posSalePayments.method,
              paidAt: posSalePayments.paidAt,
              updatedAt: posSalePayments.updatedAt,
            })
            .from(posSalePayments)
            .where(
              and(
                eq(posSalePayments.orgId, orgId),
                inArray(posSalePayments.deviceId, deviceIds),
                inArray(posSalePayments.localReceiptId, localReceiptIds),
              ),
            )
        : [];

    const latestPaymentByDeviceReceiptKey = latestLocalPaymentIdByDeviceReceipt(
      paymentsByReceipt as PullPaymentRefCandidate[],
    );

    const snapshots: PosPullReceiptSnapshot[] = pageRows.map((row) => ({
      id: row.id,
      localReceiptId: row.localReceiptId,
      localOrderId: row.localOrderId,
      localPaymentId:
        latestPaymentByDeviceReceiptKey.get(
          deviceLocalKey(row.deviceId, row.localReceiptId),
        ) ?? null,
      sourceDeviceId: row.deviceId,
      receiptNumber: row.receiptNumber,
      netCents: row.netCents,
      taxCents: row.taxCents,
      grossCents: row.grossCents,
      currency: row.currency,
      fiscalStatus: row.fiscalStatus,
      status: row.status,
      soldAt: row.soldAt.toISOString(),
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
    }));

    return this.buildPageFromRows("receipts", rows, snapshots, limit, (row) => ({
      timestamp: row.updatedAt.toISOString(),
      id: row.id,
    }));
  }

  private async pullPayments(
    orgId: string,
    encodedCursor: string | null,
    limit: number,
  ): Promise<EntityPage<PosPullPaymentSnapshot>> {
    const cursorFilter = this.buildCursorFilter(
      encodedCursor,
      posSalePayments.updatedAt,
      posSalePayments.id,
    );

    const rows = await db
      .select()
      .from(posSalePayments)
      .where(and(eq(posSalePayments.orgId, orgId), cursorFilter))
      .orderBy(asc(posSalePayments.updatedAt), asc(posSalePayments.id))
      .limit(limit + 1);

    const snapshots: PosPullPaymentSnapshot[] = rows
      .slice(0, limit)
      .map((row) => ({
        id: row.id,
        localPaymentId: row.localPaymentId,
        localOrderId: row.localOrderId,
        localReceiptId: row.localReceiptId,
        sourceDeviceId: row.deviceId,
        method: row.method,
        amountCents: row.amountCents,
        currency: row.currency,
        paidAt: row.paidAt.toISOString(),
        createdAt: row.createdAt.toISOString(),
        updatedAt: row.updatedAt.toISOString(),
      }));

    return this.buildPageFromRows("payments", rows, snapshots, limit, (row) => ({
      timestamp: row.updatedAt.toISOString(),
      id: row.id,
    }));
  }

  private async pullReceiptEvents(
    orgId: string,
    encodedCursor: string | null,
    limit: number,
  ): Promise<EntityPage<PosPullReceiptEventSnapshot>> {
    const cursorFilter = this.buildCursorFilter(
      encodedCursor,
      posReceiptEvents.createdAt,
      posReceiptEvents.id,
    );

    const rows = await db
      .select({
        id: posReceiptEvents.id,
        eventId: posReceiptEvents.eventId,
        receiptId: posReceiptEvents.receiptId,
        localReceiptId: posReceipts.localReceiptId,
        sourceDeviceId: posReceiptEvents.deviceId,
        eventType: posReceiptEvents.eventType,
        occurredAt: posReceiptEvents.occurredAt,
        createdAt: posReceiptEvents.createdAt,
        metadata: posReceiptEvents.payload,
      })
      .from(posReceiptEvents)
      .leftJoin(
        posReceipts,
        and(
          eq(posReceipts.id, posReceiptEvents.receiptId),
          eq(posReceipts.orgId, orgId),
        ),
      )
      .where(and(eq(posReceiptEvents.orgId, orgId), cursorFilter))
      .orderBy(asc(posReceiptEvents.createdAt), asc(posReceiptEvents.id))
      .limit(limit + 1);

    const snapshots: PosPullReceiptEventSnapshot[] = rows
      .slice(0, limit)
      .map((row) => ({
        id: row.id,
        eventId: row.eventId,
        receiptId: row.receiptId,
        localReceiptId: row.localReceiptId,
        sourceDeviceId: row.sourceDeviceId,
        eventType: row.eventType,
        occurredAt: row.occurredAt.toISOString(),
        createdAt: row.createdAt.toISOString(),
        metadata: (row.metadata ?? {}) as Record<string, unknown>,
      }));

    return this.buildPageFromRows("receiptEvents", rows, snapshots, limit, (row) => ({
      timestamp: row.createdAt.toISOString(),
      id: row.id,
    }));
  }

  private async pullShifts(
    orgId: string,
    encodedCursor: string | null,
    limit: number,
  ): Promise<EntityPage<PosPullShiftSnapshot>> {
    const cursorFilter = this.buildCursorFilter(
      encodedCursor,
      posShifts.updatedAt,
      posShifts.id,
    );

    const rows = await db
      .select()
      .from(posShifts)
      .where(and(eq(posShifts.orgId, orgId), cursorFilter))
      .orderBy(asc(posShifts.updatedAt), asc(posShifts.id))
      .limit(limit + 1);

    const snapshots: PosPullShiftSnapshot[] = rows
      .slice(0, limit)
      .map((row) => ({
        id: row.id,
        localShiftId: row.localShiftId,
        sourceDeviceId: row.deviceId,
        cashier: row.cashier,
        status: row.status,
        openingFloatMinor: row.openingFloatMinor,
        closingFloatMinor: row.closingFloatMinor,
        previousClosingFloatMinor: row.previousClosingFloatMinor,
        currency: row.currency,
        businessDate: row.businessDate,
        openedAt: row.startedAt.toISOString(),
        closedAt: row.endedAt ? row.endedAt.toISOString() : null,
        createdAt: row.createdAt.toISOString(),
        updatedAt: row.updatedAt.toISOString(),
      }));

    return this.buildPageFromRows("shifts", rows, snapshots, limit, (row) => ({
      timestamp: row.updatedAt.toISOString(),
      id: row.id,
    }));
  }

  private buildCursorFilter(
    encodedCursor: string | null,
    timestampColumn: SQL | { name?: string },
    idColumn: SQL | { name?: string },
  ) {
    if (!encodedCursor) {
      return undefined;
    }
    const decoded = decodePullCursor(encodedCursor);
    if (!decoded) {
      throw new InvalidPullCursorError(
        "Pull cursor could not be decoded.",
      );
    }
    const ts = new Date(decoded.timestamp);
    return or(
      gt(timestampColumn as never, ts),
      and(eq(timestampColumn as never, ts), gt(idColumn as never, decoded.id)),
    );
  }

  private buildPageFromRows<TRow, TSnapshot>(
    _entity: PosPullEntityType,
    rows: TRow[],
    snapshots: TSnapshot[],
    limit: number,
    cursorSelector: (row: TRow) => { timestamp: string; id: string },
  ): EntityPage<TSnapshot> {
    const hasMore = rows.length > limit;
    const lastItem =
      snapshots.length > 0 ? rows[Math.min(limit, rows.length) - 1] : null;
    const nextCursor =
      hasMore && lastItem
        ? encodePullCursor(cursorSelector(lastItem))
        : null;

    return {
      items: snapshots,
      hasMore,
      nextCursor,
    };
  }
}

export const posPullService = new PosPullService();
