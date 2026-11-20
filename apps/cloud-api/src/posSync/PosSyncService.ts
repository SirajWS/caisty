import { and, eq } from "drizzle-orm";
import {
  isPosMoneyInteger,
  isSupportedBusinessCurrency,
} from "../../../../packages/business-currency/src/index.ts";

import { IdempotencyService } from "../billing/IdempotencyService.js";
import { db } from "../db/client.js";
import { businessProfiles } from "../db/schema/businessProfiles.js";
import { devices } from "../db/schema/devices.js";
import {
  posOrderLines,
  posOrders,
  posReceipts,
  posSalePayments,
  posSyncBatches,
  posSyncEvents,
} from "../db/schema/posSync.js";
import type { PosDeviceAuthContext } from "../lib/posDeviceAuth.js";
import { receiptEventService } from "../lib/receiptEventService.js";
import { shiftService } from "../lib/shiftService.js";
import { channelSyncService } from "./channelSyncService.js";
import { DEFAULT_RECEIPT_STATUS } from "../lib/receiptStatus.js";
import { parseStationReceiptNumber } from "../lib/stationCode.js";
import { parseIsoDate } from "./validateSyncBatch.js";
import { normalizeProviderSyncOrderPayment } from "../lib/normalizeProviderOrderPayment.js";
import { traceProviderOrderStage } from "../lib/providerOrderTrace.js";
import { mergePaymentMethodForSync, mergePaymentStatusForSync } from "./orderPaymentMerge.js";
import { mergeOrderStatusForSync } from "./orderStatusMerge.js";
import {
  confirmManualPosOrderPayment,
  isManualPosSettlementPayment,
} from "./manualPosPaymentSettlement.js";
import type {
  PosSyncBatchRequest,
  PosSyncBatchResponse,
  PosSyncEvent,
  PosSyncFailedEvent,
  PosSyncOrderPayload,
  PosSyncPaymentPayload,
  PosSyncReceiptEventPayload,
  PosSyncReceiptPayload,
  PosSyncShiftPayload,
  PosSyncChannelPayload,
  POS_SYNC_IDEMPOTENCY_SCOPE,
} from "./types.js";

const IDEMPOTENCY_SCOPE: typeof POS_SYNC_IDEMPOTENCY_SCOPE = "pos.sync.batch";

const SYNC_EVENT_UNIQUE_CONSTRAINT = "uq_pos_sync_events_org_sync_event_id";

type ChannelSyncTx = Pick<typeof db, "select" | "insert">;

class SyncEventDuplicateError extends Error {
  constructor() {
    super("Sync event already exists for organization.");
    this.name = "SyncEventDuplicateError";
  }
}

const RECEIPT_NUMBER_UNIQUE_CONSTRAINT =
  "uq_pos_receipts_org_station_receipt_number";

function isUniqueViolation(err: unknown): boolean {
  return (
    typeof err === "object" &&
    err !== null &&
    "code" in err &&
    (err as { code?: string }).code === "23505"
  );
}

function isReceiptNumberUniqueViolation(err: unknown): boolean {
  if (!isUniqueViolation(err)) return false;
  const typed = err as { constraint?: string; message?: string; detail?: string };
  if (typed.constraint === RECEIPT_NUMBER_UNIQUE_CONSTRAINT) return true;
  const blob = `${typed.message ?? ""} ${typed.detail ?? ""}`;
  return blob.includes(RECEIPT_NUMBER_UNIQUE_CONSTRAINT);
}

function isSyncEventUniqueViolation(err: unknown): boolean {
  if (!isUniqueViolation(err)) {
    return false;
  }
  const constraint = (err as { constraint?: string }).constraint;
  if (typeof constraint === "string" && constraint.length > 0) {
    return constraint === SYNC_EVENT_UNIQUE_CONSTRAINT;
  }
  return true;
}

export class PosSyncService {
  constructor(private readonly idempotency = new IdempotencyService()) {}

  async processBatch(
    request: PosSyncBatchRequest,
    auth: PosDeviceAuthContext,
    idempotencyKey?: string,
  ): Promise<PosSyncBatchResponse> {
    if (idempotencyKey) {
      const requestHash = IdempotencyService.hash({
        deviceId: auth.deviceId,
        batch: request.batch,
        events: request.events,
      });

      const cached = await this.idempotency.get<PosSyncBatchResponse>(
        idempotencyKey,
        requestHash,
        auth.orgId,
      );
      if (cached.hit) {
        return cached.value;
      }
    }

    const existingBatch = await this.findExistingBatch(auth, request.batch.batchId);
    if (existingBatch) {
      return this.buildDuplicateBatchResponse(existingBatch);
    }

    const response = await this.ingestBatch(request, auth, idempotencyKey);

    if (idempotencyKey) {
      const requestHash = IdempotencyService.hash({
        deviceId: auth.deviceId,
        batch: request.batch,
        events: request.events,
      });
      await this.idempotency.set(
        idempotencyKey,
        requestHash,
        response,
        auth.orgId,
        IDEMPOTENCY_SCOPE,
      );
    }

    return response;
  }

  private async findExistingBatch(
    auth: PosDeviceAuthContext,
    posBatchId: string,
  ) {
    const [batch] = await db
      .select()
      .from(posSyncBatches)
      .where(
        and(
          eq(posSyncBatches.orgId, auth.orgId),
          eq(posSyncBatches.deviceId, auth.deviceId),
          eq(posSyncBatches.posBatchId, posBatchId),
        ),
      )
      .limit(1);

    return batch ?? null;
  }

  private buildDuplicateBatchResponse(
    batch: typeof posSyncBatches.$inferSelect,
  ): PosSyncBatchResponse {
    return {
      ok: true,
      batchId: batch.id,
      posBatchId: batch.posBatchId,
      status: "duplicate_batch",
      accepted: [],
      duplicate: [],
      failed: [],
      counts: {
        accepted: batch.acceptedCount,
        duplicate: batch.duplicateCount,
        failed: batch.failedCount,
      },
    };
  }

  private async ingestBatch(
    request: PosSyncBatchRequest,
    auth: PosDeviceAuthContext,
    idempotencyKey?: string,
  ): Promise<PosSyncBatchResponse> {
    const accepted: string[] = [];
    const duplicate: string[] = [];
    const failed: PosSyncFailedEvent[] = [];

    const [batch] = await db
      .insert(posSyncBatches)
      .values({
        orgId: auth.orgId,
        customerId: auth.customerId,
        deviceId: auth.deviceId,
        posBatchId: request.batch.batchId,
        batchSequence: request.batch.sequence ?? 1,
        status: "processing",
        eventCount: request.events.length,
        idempotencyKey: idempotencyKey ?? null,
        sentAt: request.batch.sentAt
          ? parseIsoDate(request.batch.sentAt, "batch.sentAt")
          : null,
      })
      .returning();

    const businessCurrency = await this.loadBusinessCurrency(auth.orgId);
    const needsStationCode = request.events.some(
      (event) => event.type === "receipt" && !event.ingestError,
    );
    const stationCode = needsStationCode
      ? await this.loadDeviceStationCode(auth.deviceId)
      : null;

    for (const event of request.events) {
      const outcome = await this.processEvent(
        event,
        auth,
        batch.id,
        businessCurrency,
        stationCode,
      );
      if (outcome.status === "accepted") {
        accepted.push(event.eventId);
      } else if (outcome.status === "duplicate") {
        duplicate.push(event.eventId);
      } else {
        failed.push({
          eventId: event.eventId,
          code: outcome.code,
          error: outcome.error,
        });
      }
    }

    const completedAt = new Date();
    await db
      .update(posSyncBatches)
      .set({
        status: "completed",
        acceptedCount: accepted.length,
        duplicateCount: duplicate.length,
        failedCount: failed.length,
        completedAt,
      })
      .where(eq(posSyncBatches.id, batch.id));

    await this.updateDeviceTelemetry(auth.deviceId, request, completedAt);

    return {
      ok: true,
      batchId: batch.id,
      posBatchId: request.batch.batchId,
      status: "completed",
      accepted,
      duplicate,
      failed,
      counts: {
        accepted: accepted.length,
        duplicate: duplicate.length,
        failed: failed.length,
      },
    };
  }

  private async updateDeviceTelemetry(
    deviceId: string,
    request: PosSyncBatchRequest,
    syncedAt: Date,
  ) {
    const telemetry = request.telemetry ?? {};
    await db
      .update(devices)
      .set({
        lastSalesSyncAt: syncedAt,
        ...(telemetry.appVersion ? { appVersion: telemetry.appVersion } : {}),
        ...(typeof telemetry.offlineQueueCount === "number"
          ? { offlineQueueCount: telemetry.offlineQueueCount }
          : {}),
      })
      .where(eq(devices.id, deviceId));
  }

  private async findExistingSyncEvent(
    orgId: string,
    syncEventId: string,
    dbClient: ChannelSyncTx = db,
  ) {
    const [existingEvent] = await dbClient
      .select({ id: posSyncEvents.id, status: posSyncEvents.status })
      .from(posSyncEvents)
      .where(
        and(
          eq(posSyncEvents.syncEventId, syncEventId),
          eq(posSyncEvents.orgId, orgId),
        ),
      )
      .limit(1);

    return existingEvent ?? null;
  }

  private async loadDeviceStationCode(deviceId: string): Promise<string | null> {
    const [row] = await db
      .select({ stationCode: devices.stationCode })
      .from(devices)
      .where(eq(devices.id, deviceId))
      .limit(1);
    return row?.stationCode ?? null;
  }

  private receiptNumberConflict(message: string) {
    return {
      status: "failed" as const,
      code: "receipt_number_conflict",
      error: message,
    };
  }

  private validateIncomingReceiptNumber(
    receiptNumber: string | undefined,
    stationCode: string | null,
  ): { status: "failed"; code: string; error: string } | { receiptNumber?: string } {
    if (!receiptNumber) return {};
    const trimmed = receiptNumber.trim();
    const parsed = parseStationReceiptNumber(trimmed);
    if (!parsed) {
      if (/^R\d{8}-K/i.test(trimmed)) {
        return {
          status: "failed",
          code: "receipt_number_invalid",
          error: "Receipt number does not match RYYYYMMDD-Kxx-NNNN.",
        };
      }
      return { receiptNumber: trimmed };
    }
    if (!stationCode) {
      return {
        status: "failed",
        code: "receipt_number_invalid",
        error: "Device has no station code for the new receipt number format.",
      };
    }
    if (parsed.stationCode !== stationCode) {
      return {
        status: "failed",
        code: "receipt_number_mismatch",
        error: `Receipt number station ${parsed.stationCode} does not match device ${stationCode}.`,
      };
    }
    return { receiptNumber };
  }

  private async loadBusinessCurrency(orgId: string): Promise<string | null> {
    const [row] = await db
      .select({ currency: businessProfiles.currency })
      .from(businessProfiles)
      .where(eq(businessProfiles.orgId, orgId))
      .limit(1);
    return row?.currency ?? null;
  }

  private rejectEventCurrency(
    payloadCurrency: string | undefined,
    businessCurrency: string | null,
  ): { status: "failed"; code: string; error: string } | { currency: string } {
    const raw = payloadCurrency?.trim().toUpperCase() ?? "";
    if (!raw) {
      return {
        status: "failed",
        code: "currency_required",
        error: "currency is required.",
      };
    }
    if (!isSupportedBusinessCurrency(raw)) {
      return {
        status: "failed",
        code: "unsupported_currency",
        error: `Unsupported currency ${raw}.`,
      };
    }
    if (!businessCurrency || !isSupportedBusinessCurrency(businessCurrency)) {
      return {
        status: "failed",
        code: "business_currency_invalid",
        error: "Business currency is not configured.",
      };
    }
    if (raw !== businessCurrency) {
      return {
        status: "failed",
        code: "currency_mismatch",
        error: `Currency ${raw} does not match business currency ${businessCurrency}.`,
      };
    }
    return { currency: raw };
  }

  private async processEvent(
    event: PosSyncEvent,
    auth: PosDeviceAuthContext,
    batchId: string,
    businessCurrency: string | null,
    stationCode: string | null,
  ): Promise<
    | { status: "accepted" | "duplicate" }
    | { status: "failed"; code: string; error: string }
  > {
    const existingEvent = await this.findExistingSyncEvent(
      auth.orgId,
      event.eventId,
    );

    if (existingEvent && existingEvent.status !== "failed") {
      return this.duplicateFinancialEvent(
        event,
        auth,
        businessCurrency,
        stationCode,
      );
    }

    if (event.ingestError) {
      // Payload errors are per-event; do not enter channel/entity upserts.
    } else if (event.type === "channel") {
      return this.processChannelEventTransactional(event, auth, batchId);
    }

    if (existingEvent?.status === "failed") {
      return this.retryFailedFinancialEvent(
        event,
        auth,
        batchId,
        businessCurrency,
        existingEvent.id,
        stationCode,
      );
    }

    try {
      const entityOutcome = event.ingestError
        ? {
            status: "failed" as const,
            code: event.ingestError.code,
            error: event.ingestError.error,
          }
        : await this.upsertEntity(
            event,
            auth,
            batchId,
            businessCurrency,
            stationCode,
          );
      await db.insert(posSyncEvents).values({
        syncEventId: event.eventId,
        batchId,
        orgId: auth.orgId,
        deviceId: auth.deviceId,
        eventType: event.type,
        entityLocalId: this.entityLocalId(event),
        status: entityOutcome.status,
        errorCode: entityOutcome.status === "failed" ? entityOutcome.code : null,
        errorMessage:
          entityOutcome.status === "failed" ? entityOutcome.error : null,
      });
      return entityOutcome.status === "failed"
        ? entityOutcome
        : { status: entityOutcome.status };
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Unknown error";
      await db.insert(posSyncEvents).values({
        syncEventId: event.eventId,
        batchId,
        orgId: auth.orgId,
        deviceId: auth.deviceId,
        eventType: event.type,
        entityLocalId: this.entityLocalId(event),
        status: "failed",
        errorCode: "server_error",
        errorMessage: message,
      });
      return { status: "failed", code: "server_error", error: message };
    }
  }

  private async retryFailedFinancialEvent(
    event: PosSyncEvent,
    auth: PosDeviceAuthContext,
    batchId: string,
    businessCurrency: string | null,
    existingEventId: string,
    stationCode: string | null,
  ): Promise<
    | { status: "accepted" | "duplicate" }
    | { status: "failed"; code: string; error: string }
  > {
    try {
      const entityOutcome = event.ingestError
        ? {
            status: "failed" as const,
            code: event.ingestError.code,
            error: event.ingestError.error,
          }
        : await this.upsertEntity(
            event,
            auth,
            batchId,
            businessCurrency,
            stationCode,
          );
      await db
        .update(posSyncEvents)
        .set({
          batchId,
          status: entityOutcome.status,
          errorCode: entityOutcome.status === "failed" ? entityOutcome.code : null,
          errorMessage:
            entityOutcome.status === "failed" ? entityOutcome.error : null,
        })
        .where(eq(posSyncEvents.id, existingEventId));
      return entityOutcome.status === "failed"
        ? entityOutcome
        : { status: entityOutcome.status };
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Unknown error";
      await db
        .update(posSyncEvents)
        .set({
          batchId,
          status: "failed",
          errorCode: "server_error",
          errorMessage: message,
        })
        .where(eq(posSyncEvents.id, existingEventId));
      return { status: "failed", code: "server_error", error: message };
    }
  }

  private async processChannelEventTransactional(
    event: PosSyncEvent,
    auth: PosDeviceAuthContext,
    batchId: string,
  ): Promise<
    | { status: "accepted" | "duplicate" }
    | { status: "failed"; code: string; error: string }
  > {
    try {
      return await db.transaction(async (tx) => {
        const existingEvent = await this.findExistingSyncEvent(
          auth.orgId,
          event.eventId,
          tx,
        );
        if (existingEvent && existingEvent.status !== "failed") {
          return { status: "duplicate" as const };
        }

        const outcome = await channelSyncService.processChannelEvent(
          event.payload as PosSyncChannelPayload,
          auth,
          batchId,
          tx,
        );

        const eventStatus = {
          batchId,
          status: outcome.status === "failed" ? "failed" : outcome.status,
          errorCode: outcome.status === "failed" ? outcome.code : null,
          errorMessage:
            outcome.status === "failed" ? outcome.error : null,
        };

        try {
          if (existingEvent?.status === "failed") {
            await tx
              .update(posSyncEvents)
              .set(eventStatus)
              .where(eq(posSyncEvents.id, existingEvent.id));
          } else {
            await tx.insert(posSyncEvents).values({
              syncEventId: event.eventId,
              orgId: auth.orgId,
              deviceId: auth.deviceId,
              eventType: event.type,
              entityLocalId: this.entityLocalId(event),
              ...eventStatus,
            });
          }
        } catch (err: unknown) {
          if (isSyncEventUniqueViolation(err)) {
            throw new SyncEventDuplicateError();
          }
          throw err;
        }

        if (outcome.status === "failed") {
          return outcome;
        }
        return { status: outcome.status };
      });
    } catch (err: unknown) {
      if (err instanceof SyncEventDuplicateError) {
        return { status: "duplicate" };
      }
      const message = err instanceof Error ? err.message : "Unknown error";
      return { status: "failed", code: "server_error", error: message };
    }
  }

  private entityLocalId(event: PosSyncEvent): string | null {
    if (event.type === "order") {
      return (event.payload as PosSyncOrderPayload).localOrderId;
    }
    if (event.type === "receipt") {
      return (event.payload as PosSyncReceiptPayload).localReceiptId;
    }
    if (event.type === "receipt_event") {
      return (event.payload as PosSyncReceiptEventPayload).localReceiptId;
    }
    if (event.type === "shift") {
      return (event.payload as PosSyncShiftPayload).localShiftId;
    }
    if (event.type === "channel") {
      return (event.payload as PosSyncChannelPayload).channelId;
    }
    return (event.payload as PosSyncPaymentPayload).localPaymentId;
  }

  private async duplicateFinancialEvent(
    event: PosSyncEvent,
    auth: PosDeviceAuthContext,
    businessCurrency: string | null,
    stationCode: string | null,
  ): Promise<
    | { status: "accepted" | "duplicate" }
    | { status: "failed"; code: string; error: string }
  > {
    if (event.type === "channel" || event.type === "receipt_event") {
      return { status: "duplicate" };
    }
    if (event.type === "order") {
      return this.conflictOrDuplicateOrder(
        event.payload as PosSyncOrderPayload,
        auth,
        businessCurrency,
      );
    }
    if (event.type === "receipt") {
      return this.conflictOrDuplicateReceipt(
        event.payload as PosSyncReceiptPayload,
        auth,
        businessCurrency,
        stationCode,
      );
    }
    if (event.type === "payment") {
      return this.conflictOrDuplicatePayment(
        event.payload as PosSyncPaymentPayload,
        auth,
        businessCurrency,
      );
    }
    if (event.type === "shift") {
      return this.conflictOrDuplicateShift(
        event.payload as PosSyncShiftPayload,
        auth,
        businessCurrency,
      );
    }
    return { status: "duplicate" };
  }

  private financialConflict(entity: string) {
    return {
      status: "failed" as const,
      code: "financial_conflict",
      error: `${entity} was already synced with different financial data.`,
    };
  }

  private async upsertEntity(
    event: PosSyncEvent,
    auth: PosDeviceAuthContext,
    batchId: string,
    businessCurrency: string | null,
    stationCode: string | null,
  ): Promise<
    | { status: "accepted" | "duplicate" }
    | { status: "failed"; code: string; error: string }
  > {
    if (event.type === "order") {
      return this.upsertOrder(
        event.payload as PosSyncOrderPayload,
        auth,
        batchId,
        businessCurrency,
      );
    }
    if (event.type === "receipt") {
      return this.upsertReceipt(
        event.payload as PosSyncReceiptPayload,
        auth,
        batchId,
        businessCurrency,
        stationCode,
      );
    }
    if (event.type === "receipt_event") {
      return this.appendReceiptEvent(
        event.payload as PosSyncReceiptEventPayload,
        auth,
        batchId,
      );
    }
    if (event.type === "shift") {
      return this.upsertShift(
        event.payload as PosSyncShiftPayload,
        auth,
        batchId,
        businessCurrency,
      );
    }
    if (event.type === "channel") {
      return channelSyncService.processChannelEvent(
        event.payload as PosSyncChannelPayload,
        auth,
        batchId,
      );
    }
    return this.upsertPayment(
      event.payload as PosSyncPaymentPayload,
      auth,
      batchId,
      businessCurrency,
    );
  }

  private orderProviderFields(
    payload: PosSyncOrderPayload,
    existingPaymentStatus?: string | null,
  ) {
    const normalizedIncoming = normalizeProviderSyncOrderPayment({
      platform: payload.platform,
      paymentStatus: payload.paymentStatus,
      providerOrderId: payload.providerOrderId,
      localOrderId: payload.localOrderId,
    });

    traceProviderOrderStage(payload.localOrderId, "pos_sync_order_before_db", {
      localOrderId: payload.localOrderId,
      providerOrderId: payload.providerOrderId ?? null,
      platform: payload.platform ?? null,
      source: "pos_sync_batch",
      paymentStatus: normalizedIncoming,
      incomingPaymentStatus: payload.paymentStatus ?? null,
    });

    return {
      platform: payload.platform ?? null,
      providerOrderId: payload.providerOrderId ?? null,
      customerName: payload.customerName ?? null,
      customerPhone: payload.customerPhone ?? null,
      customerEmail: payload.customerEmail ?? null,
      deliveryAddress: payload.deliveryAddress ?? null,
      customerNote: payload.customerNote ?? null,
      paymentStatus: mergePaymentStatusForSync(
        existingPaymentStatus,
        normalizedIncoming,
      ),
    };
  }

  private async findExistingOrderSnapshot(
    auth: PosDeviceAuthContext,
    localOrderId: string,
  ): Promise<{
    status: string;
    paymentStatus: string | null;
    totalCents: number;
    currency: string;
  } | null> {
    const [row] = await db
      .select({
        status: posOrders.status,
        paymentStatus: posOrders.paymentStatus,
        totalCents: posOrders.totalCents,
        currency: posOrders.currency,
      })
      .from(posOrders)
      .where(
        and(
          eq(posOrders.orgId, auth.orgId),
          eq(posOrders.deviceId, auth.deviceId),
          eq(posOrders.localOrderId, localOrderId),
        ),
      )
      .limit(1);
    return row ?? null;
  }

  private async conflictOrDuplicateOrder(
    payload: PosSyncOrderPayload,
    auth: PosDeviceAuthContext,
    businessCurrency: string | null,
  ) {
    const currencyResult = this.rejectEventCurrency(
      payload.currency,
      businessCurrency,
    );
    if ("status" in currencyResult) return currencyResult;
    const existing = await this.findExistingOrderSnapshot(
      auth,
      payload.localOrderId,
    );
    if (!existing) return { status: "duplicate" as const };
    if (
      existing.totalCents !== payload.totalCents ||
      existing.currency !== currencyResult.currency
    ) {
      return this.financialConflict("Order");
    }
    return { status: "duplicate" as const };
  }

  private async upsertOrder(
    payload: PosSyncOrderPayload,
    auth: PosDeviceAuthContext,
    batchId: string,
    businessCurrency: string | null,
  ) {
    const soldAt = parseIsoDate(payload.soldAt, "soldAt");
    if (!soldAt) {
      return {
        status: "failed" as const,
        code: "invalid_payload",
        error: "soldAt is invalid",
      };
    }

    const currencyResult = this.rejectEventCurrency(
      payload.currency,
      businessCurrency,
    );
    if ("status" in currencyResult) return currencyResult;
    if (!isPosMoneyInteger(payload.totalCents)) {
      return {
        status: "failed" as const,
        code: "invalid_amount",
        error: "totalCents must be an integer within PostgreSQL int32 limits.",
      };
    }

    const existingSnapshot = await this.findExistingOrderSnapshot(
      auth,
      payload.localOrderId,
    );
    const mergedStatus = mergeOrderStatusForSync(
      existingSnapshot?.status,
      payload.status ?? "closed",
    );
    const providerFields = this.orderProviderFields(
      payload,
      existingSnapshot?.paymentStatus,
    );

    if (payload.lines?.length) {
      for (const line of payload.lines) {
        if (
          !isPosMoneyInteger(line.unitPriceCents) ||
          !isPosMoneyInteger(line.lineTotalCents)
        ) {
          return {
            status: "failed" as const,
            code: "invalid_amount",
            error: "Order line money amounts must be integer minor units.",
          };
        }
      }
    }

    if (existingSnapshot) {
      if (
        existingSnapshot.totalCents !== payload.totalCents ||
        existingSnapshot.currency !== currencyResult.currency
      ) {
        return this.financialConflict("Order");
      }
      await db
        .update(posOrders)
        .set({
          status: mergedStatus,
          syncBatchId: batchId,
          updatedAt: new Date(),
          ...providerFields,
        })
        .where(
          and(
            eq(posOrders.orgId, auth.orgId),
            eq(posOrders.deviceId, auth.deviceId),
            eq(posOrders.localOrderId, payload.localOrderId),
          ),
        );
      return { status: "accepted" as const };
    }

    try {
      return await db.transaction(async (tx) => {
        const [order] = await tx
          .insert(posOrders)
          .values({
            orgId: auth.orgId,
            customerId: auth.customerId,
            deviceId: auth.deviceId,
            localOrderId: payload.localOrderId,
            status: mergedStatus,
            totalCents: payload.totalCents,
            currency: currencyResult.currency,
            soldAt,
            syncBatchId: batchId,
            ...providerFields,
          })
          .returning();

        if (payload.lines?.length) {
          await tx.insert(posOrderLines).values(
            payload.lines.map((line) => ({
              orderId: order.id,
              orgId: auth.orgId,
              lineIndex: line.lineIndex,
              productName: line.productName ?? null,
              sku: line.sku ?? null,
              quantity: String(line.quantity),
              unitPriceCents: line.unitPriceCents,
              lineTotalCents: line.lineTotalCents,
              taxRateBps: line.taxRateBps ?? null,
            })),
          );
        }

        return { status: "accepted" as const };
      });
    } catch (err: unknown) {
      if (isUniqueViolation(err)) {
        return this.conflictOrDuplicateOrder(payload, auth, businessCurrency);
      }
      throw err;
    }
  }

  private async conflictOrDuplicateReceipt(
    payload: PosSyncReceiptPayload,
    auth: PosDeviceAuthContext,
    businessCurrency: string | null,
    stationCode: string | null,
  ) {
    const currencyResult = this.rejectEventCurrency(
      payload.currency,
      businessCurrency,
    );
    if ("status" in currencyResult) return currencyResult;
    const numberCheck = this.validateIncomingReceiptNumber(
      payload.receiptNumber,
      stationCode,
    );
    if ("status" in numberCheck) return numberCheck;
    const [existing] = await db
      .select({
        netCents: posReceipts.netCents,
        taxCents: posReceipts.taxCents,
        grossCents: posReceipts.grossCents,
        currency: posReceipts.currency,
        receiptNumber: posReceipts.receiptNumber,
      })
      .from(posReceipts)
      .where(
        and(
          eq(posReceipts.orgId, auth.orgId),
          eq(posReceipts.deviceId, auth.deviceId),
          eq(posReceipts.localReceiptId, payload.localReceiptId),
        ),
      )
      .limit(1);
    if (!existing) return { status: "duplicate" as const };
    const taxCents = payload.taxCents ?? 0;
    if (
      existing.netCents !== payload.netCents ||
      existing.taxCents !== taxCents ||
      existing.grossCents !== payload.grossCents ||
      existing.currency !== currencyResult.currency
    ) {
      return this.financialConflict("Receipt");
    }
    if (
      existing.receiptNumber &&
      payload.receiptNumber &&
      existing.receiptNumber !== payload.receiptNumber
    ) {
      return this.receiptNumberConflict(
        "Receipt was already synced with a different receipt number.",
      );
    }
    return { status: "duplicate" as const };
  }

  private async upsertReceipt(
    payload: PosSyncReceiptPayload,
    auth: PosDeviceAuthContext,
    batchId: string,
    businessCurrency: string | null,
    stationCode: string | null,
  ) {
    const soldAt = parseIsoDate(payload.soldAt, "soldAt");
    if (!soldAt) {
      return {
        status: "failed" as const,
        code: "invalid_payload",
        error: "soldAt is invalid",
      };
    }

    const currencyResult = this.rejectEventCurrency(
      payload.currency,
      businessCurrency,
    );
    if ("status" in currencyResult) return currencyResult;
    const taxCents = payload.taxCents ?? 0;
    if (
      !isPosMoneyInteger(payload.netCents) ||
      !isPosMoneyInteger(taxCents) ||
      !isPosMoneyInteger(payload.grossCents)
    ) {
      return {
        status: "failed" as const,
        code: "invalid_amount",
        error: "Receipt money amounts must be integer minor units.",
      };
    }

    const numberCheck = this.validateIncomingReceiptNumber(
      payload.receiptNumber,
      stationCode,
    );
    if ("status" in numberCheck) return numberCheck;

    const existingCheck = await this.conflictOrDuplicateReceipt(
      payload,
      auth,
      businessCurrency,
      stationCode,
    );
    if (existingCheck.status === "failed") return existingCheck;
    if (existingCheck.status === "duplicate") {
      const [existing] = await db
        .select({
          id: posReceipts.id,
          receiptNumber: posReceipts.receiptNumber,
        })
        .from(posReceipts)
        .where(
          and(
            eq(posReceipts.orgId, auth.orgId),
            eq(posReceipts.deviceId, auth.deviceId),
            eq(posReceipts.localReceiptId, payload.localReceiptId),
          ),
        )
        .limit(1);
      if (existing) {
        await db
          .update(posReceipts)
          .set({
            localOrderId: payload.localOrderId ?? null,
            receiptNumber: existing.receiptNumber ?? payload.receiptNumber ?? null,
            fiscalStatus: payload.fiscalStatus ?? "pending",
            syncBatchId: batchId,
            updatedAt: new Date(),
          })
          .where(eq(posReceipts.id, existing.id));
        return { status: "accepted" as const };
      }
    }

    try {
      await db.insert(posReceipts).values({
        orgId: auth.orgId,
        customerId: auth.customerId,
        deviceId: auth.deviceId,
        localReceiptId: payload.localReceiptId,
        localOrderId: payload.localOrderId ?? null,
        receiptNumber: payload.receiptNumber ?? null,
        netCents: payload.netCents,
        taxCents,
        grossCents: payload.grossCents,
        currency: currencyResult.currency,
        soldAt,
        fiscalStatus: payload.fiscalStatus ?? "pending",
        status: DEFAULT_RECEIPT_STATUS,
        syncBatchId: batchId,
      });
      return { status: "accepted" as const };
    } catch (err: unknown) {
      if (isReceiptNumberUniqueViolation(err)) {
        return this.receiptNumberConflict(
          "Receipt number is already used by another sale in this organization.",
        );
      }
      if (isUniqueViolation(err)) {
        const existingCheck = await this.conflictOrDuplicateReceipt(
          payload,
          auth,
          businessCurrency,
          stationCode,
        );
        if (existingCheck.status === "failed") return existingCheck;
        const [existing] = await db
          .select({ id: posReceipts.id })
          .from(posReceipts)
          .where(
            and(
              eq(posReceipts.orgId, auth.orgId),
              eq(posReceipts.deviceId, auth.deviceId),
              eq(posReceipts.localReceiptId, payload.localReceiptId),
            ),
          )
          .limit(1);
        if (existing) return existingCheck;
        if (parseStationReceiptNumber(payload.receiptNumber)) {
          return this.receiptNumberConflict(
            "Receipt number is already used by another sale in this organization.",
          );
        }
        return existingCheck;
      }
      throw err;
    }
  }

  private async conflictOrDuplicatePayment(
    payload: PosSyncPaymentPayload,
    auth: PosDeviceAuthContext,
    businessCurrency: string | null,
  ) {
    const currencyResult = this.rejectEventCurrency(
      payload.currency,
      businessCurrency,
    );
    if ("status" in currencyResult) return currencyResult;
    const [existing] = await db
      .select({
        amountCents: posSalePayments.amountCents,
        currency: posSalePayments.currency,
      })
      .from(posSalePayments)
      .where(
        and(
          eq(posSalePayments.orgId, auth.orgId),
          eq(posSalePayments.deviceId, auth.deviceId),
          eq(posSalePayments.localPaymentId, payload.localPaymentId),
        ),
      )
      .limit(1);
    if (!existing) return { status: "duplicate" as const };
    if (
      existing.amountCents !== payload.amountCents ||
      existing.currency !== currencyResult.currency
    ) {
      return this.financialConflict("Payment");
    }
    return { status: "duplicate" as const };
  }

  private async upsertPayment(
    payload: PosSyncPaymentPayload,
    auth: PosDeviceAuthContext,
    batchId: string,
    businessCurrency: string | null,
  ) {
    const paidAt = parseIsoDate(payload.paidAt, "paidAt");
    if (!paidAt) {
      return {
        status: "failed" as const,
        code: "invalid_payload",
        error: "paidAt is invalid",
      };
    }

    const currencyResult = this.rejectEventCurrency(
      payload.currency,
      businessCurrency,
    );
    if ("status" in currencyResult) return currencyResult;
    if (!isPosMoneyInteger(payload.amountCents)) {
      return {
        status: "failed" as const,
        code: "invalid_amount",
        error: "amountCents must be an integer within PostgreSQL int32 limits.",
      };
    }

    const manualSettlement = isManualPosSettlementPayment(payload);

    try {
      await db.transaction(async (tx) => {
        try {
          await tx.insert(posSalePayments).values({
            orgId: auth.orgId,
            customerId: auth.customerId,
            deviceId: auth.deviceId,
            localPaymentId: payload.localPaymentId,
            localOrderId: payload.localOrderId ?? null,
            localReceiptId: payload.localReceiptId ?? null,
            method: payload.method,
            amountCents: payload.amountCents,
            currency: currencyResult.currency,
            paidAt,
            syncBatchId: batchId,
          });
        } catch (err: unknown) {
          if (!isUniqueViolation(err)) {
            throw err;
          }

          const [existing] = await tx
            .select({
              method: posSalePayments.method,
              amountCents: posSalePayments.amountCents,
              currency: posSalePayments.currency,
            })
            .from(posSalePayments)
            .where(
              and(
                eq(posSalePayments.orgId, auth.orgId),
                eq(posSalePayments.deviceId, auth.deviceId),
                eq(posSalePayments.localPaymentId, payload.localPaymentId),
              ),
            )
            .limit(1);

          if (
            existing &&
            (existing.amountCents !== payload.amountCents ||
              existing.currency !== currencyResult.currency)
          ) {
            throw Object.assign(new Error("financial_conflict"), {
              code: "financial_conflict",
            });
          }

          await tx
            .update(posSalePayments)
            .set({
              localOrderId: payload.localOrderId ?? null,
              localReceiptId: payload.localReceiptId ?? null,
              method: mergePaymentMethodForSync(existing?.method, payload.method),
              paidAt,
              syncBatchId: batchId,
              updatedAt: new Date(),
            })
            .where(
              and(
                eq(posSalePayments.orgId, auth.orgId),
                eq(posSalePayments.deviceId, auth.deviceId),
                eq(posSalePayments.localPaymentId, payload.localPaymentId),
              ),
            );
        }

        if (manualSettlement && payload.localOrderId) {
          await confirmManualPosOrderPayment(tx, {
            orgId: auth.orgId,
            deviceId: auth.deviceId,
            localOrderId: payload.localOrderId,
          });
        }
      });
      return { status: "accepted" as const };
    } catch (err: unknown) {
      if (
        typeof err === "object" &&
        err &&
        "code" in err &&
        (err as { code?: string }).code === "financial_conflict"
      ) {
        return this.financialConflict("Payment");
      }
      throw err;
    }
  }

  private async appendReceiptEvent(
    payload: PosSyncReceiptEventPayload,
    auth: PosDeviceAuthContext,
    batchId: string,
  ) {
    const occurredAt = parseIsoDate(payload.occurredAt, "occurredAt");
    if (!occurredAt) {
      return {
        status: "failed" as const,
        code: "invalid_payload",
        error: "occurredAt is invalid",
      };
    }

    const receipt = await receiptEventService.findReceiptByLocalId(
      auth.orgId,
      auth.deviceId,
      payload.localReceiptId,
    );

    if (!receipt) {
      return {
        status: "failed" as const,
        code: "receipt_not_found",
        error: `Receipt ${payload.localReceiptId} was not found for this device.`,
      };
    }

    return receiptEventService.appendEvent({
      orgId: auth.orgId,
      customerId: auth.customerId,
      deviceId: auth.deviceId,
      receiptId: receipt.id,
      receiptNumber: payload.receiptNumber ?? receipt.receiptNumber,
      eventId: payload.eventId,
      eventType: payload.eventType,
      occurredAt,
      actor: payload.actor ?? null,
      payload: payload.payload,
      schemaVersion: payload.schemaVersion,
      syncBatchId: batchId,
    });
  }

  private async conflictOrDuplicateShift(
    payload: PosSyncShiftPayload,
    auth: PosDeviceAuthContext,
    businessCurrency: string | null,
  ) {
    const currencyResult = this.rejectEventCurrency(
      payload.currency,
      businessCurrency,
    );
    if ("status" in currencyResult) return currencyResult;
    return { status: "duplicate" as const };
  }

  private async upsertShift(
    payload: PosSyncShiftPayload,
    auth: PosDeviceAuthContext,
    batchId: string,
    businessCurrency: string | null,
  ) {
    const startedAt = parseIsoDate(payload.startedAt, "startedAt");
    if (!startedAt) {
      return {
        status: "failed" as const,
        code: "invalid_payload",
        error: "startedAt is invalid",
      };
    }

    const endedAt =
      payload.endedAt != null
        ? parseIsoDate(payload.endedAt, "endedAt")
        : null;
    if (payload.status === "closed" && !endedAt) {
      return {
        status: "failed" as const,
        code: "invalid_payload",
        error: "endedAt is invalid",
      };
    }

    const currencyResult = this.rejectEventCurrency(
      payload.currency,
      businessCurrency,
    );
    if ("status" in currencyResult) return currencyResult;
    const moneyFields = [
      payload.openingFloatMinor,
      payload.closingFloatMinor,
      payload.previousClosingFloatMinor,
    ];
    for (const amount of moneyFields) {
      if (amount != null && !isPosMoneyInteger(amount)) {
        return {
          status: "failed" as const,
          code: "invalid_amount",
          error: "Shift amounts must be integer minor units.",
        };
      }
    }

    return shiftService.upsertShiftSnapshot({
      orgId: auth.orgId,
      customerId: auth.customerId,
      deviceId: auth.deviceId,
      syncBatchId: batchId,
      localShiftId: payload.localShiftId,
      status: payload.status,
      cashier: payload.cashier ?? null,
      businessDate: payload.businessDate,
      startedAt,
      endedAt,
      openingFloatMinor: payload.openingFloatMinor,
      closingFloatMinor: payload.closingFloatMinor ?? null,
      previousClosingFloatMinor: payload.previousClosingFloatMinor ?? null,
      currency: currencyResult.currency,
      schemaVersion: payload.schemaVersion,
    });
  }
}

export const posSyncService = new PosSyncService();
