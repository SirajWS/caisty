import { and, eq } from "drizzle-orm";

import { IdempotencyService } from "../billing/IdempotencyService.js";
import { db } from "../db/client.js";
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
import { parseIsoDate } from "./validateSyncBatch.js";
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

function isUniqueViolation(err: unknown): boolean {
  return (
    typeof err === "object" &&
    err !== null &&
    "code" in err &&
    (err as { code?: string }).code === "23505"
  );
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

    for (const event of request.events) {
      const outcome = await this.processEvent(event, auth, batch.id);
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
      .select({ id: posSyncEvents.id })
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

  private async processEvent(
    event: PosSyncEvent,
    auth: PosDeviceAuthContext,
    batchId: string,
  ): Promise<
    | { status: "accepted" | "duplicate" }
    | { status: "failed"; code: string; error: string }
  > {
    const existingEvent = await this.findExistingSyncEvent(
      auth.orgId,
      event.eventId,
    );

    if (existingEvent) {
      if (event.type === "channel") {
        return { status: "duplicate" };
      }
      if (event.type === "order") {
        const outcome = await this.upsertOrder(
          event.payload as PosSyncOrderPayload,
          auth,
          batchId,
        );
        return outcome.status === "failed" ? outcome : { status: "duplicate" };
      }
      if (event.type === "payment") {
        const outcome = await this.upsertPayment(
          event.payload as PosSyncPaymentPayload,
          auth,
          batchId,
        );
        return outcome.status === "failed" ? outcome : { status: "duplicate" };
      }
      if (event.type === "receipt") {
        const outcome = await this.upsertReceipt(
          event.payload as PosSyncReceiptPayload,
          auth,
          batchId,
        );
        return outcome.status === "failed" ? outcome : { status: "duplicate" };
      }
      if (event.type === "receipt_event") {
        const outcome = await this.appendReceiptEvent(
          event.payload as PosSyncReceiptEventPayload,
          auth,
          batchId,
        );
        return outcome.status === "failed" ? outcome : { status: "duplicate" };
      }
      if (event.type === "shift") {
        const outcome = await this.upsertShift(
          event.payload as PosSyncShiftPayload,
          auth,
          batchId,
        );
        return outcome.status === "failed" ? outcome : { status: "duplicate" };
      }
      return { status: "duplicate" };
    }

    if (event.type === "channel") {
      return this.processChannelEventTransactional(event, auth, batchId);
    }

    try {
      const entityOutcome = await this.upsertEntity(event, auth, batchId);
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
        if (existingEvent) {
          return { status: "duplicate" as const };
        }

        const outcome = await channelSyncService.processChannelEvent(
          event.payload as PosSyncChannelPayload,
          auth,
          batchId,
          tx,
        );

        try {
          await tx.insert(posSyncEvents).values({
            syncEventId: event.eventId,
            batchId,
            orgId: auth.orgId,
            deviceId: auth.deviceId,
            eventType: event.type,
            entityLocalId: this.entityLocalId(event),
            status: outcome.status === "failed" ? "failed" : outcome.status,
            errorCode: outcome.status === "failed" ? outcome.code : null,
            errorMessage:
              outcome.status === "failed" ? outcome.error : null,
          });
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

  private async upsertEntity(
    event: PosSyncEvent,
    auth: PosDeviceAuthContext,
    batchId: string,
  ): Promise<
    | { status: "accepted" | "duplicate" }
    | { status: "failed"; code: string; error: string }
  > {
    if (event.type === "order") {
      return this.upsertOrder(
        event.payload as PosSyncOrderPayload,
        auth,
        batchId,
      );
    }
    if (event.type === "receipt") {
      return this.upsertReceipt(
        event.payload as PosSyncReceiptPayload,
        auth,
        batchId,
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
    );
  }

  private orderProviderFields(
    payload: PosSyncOrderPayload,
    existingPaymentStatus?: string | null,
  ) {
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
        payload.paymentStatus,
      ),
    };
  }

  private async findExistingOrderSnapshot(
    auth: PosDeviceAuthContext,
    localOrderId: string,
  ): Promise<{ status: string; paymentStatus: string | null } | null> {
    const [row] = await db
      .select({
        status: posOrders.status,
        paymentStatus: posOrders.paymentStatus,
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

  private async upsertOrder(
    payload: PosSyncOrderPayload,
    auth: PosDeviceAuthContext,
    batchId: string,
  ) {
    const soldAt = parseIsoDate(payload.soldAt, "soldAt");
    if (!soldAt) {
      return {
        status: "failed" as const,
        code: "invalid_payload",
        error: "soldAt is invalid",
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

    try {
      const [order] = await db
        .insert(posOrders)
        .values({
          orgId: auth.orgId,
          customerId: auth.customerId,
          deviceId: auth.deviceId,
          localOrderId: payload.localOrderId,
          status: mergedStatus,
          totalCents: payload.totalCents,
          currency: payload.currency ?? "EUR",
          soldAt,
          syncBatchId: batchId,
          ...providerFields,
        })
        .returning();

      if (payload.lines?.length) {
        await db.insert(posOrderLines).values(
          payload.lines.map((line) => ({
            orderId: order.id,
            orgId: auth.orgId,
            lineIndex: line.lineIndex,
            productName: line.productName ?? null,
            sku: line.sku ?? null,
            quantity: line.quantity,
            unitPriceCents: line.unitPriceCents,
            lineTotalCents: line.lineTotalCents,
            taxRateBps: line.taxRateBps ?? null,
          })),
        );
      }

      return { status: "accepted" as const };
    } catch (err: unknown) {
      if (isUniqueViolation(err)) {
        await db
          .update(posOrders)
          .set({
            status: mergedStatus,
            totalCents: payload.totalCents,
            currency: payload.currency ?? "EUR",
            soldAt,
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
      throw err;
    }
  }

  private async upsertReceipt(
    payload: PosSyncReceiptPayload,
    auth: PosDeviceAuthContext,
    batchId: string,
  ) {
    const soldAt = parseIsoDate(payload.soldAt, "soldAt");
    if (!soldAt) {
      return {
        status: "failed" as const,
        code: "invalid_payload",
        error: "soldAt is invalid",
      };
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
        taxCents: payload.taxCents ?? 0,
        grossCents: payload.grossCents,
        currency: payload.currency ?? "EUR",
        soldAt,
        fiscalStatus: payload.fiscalStatus ?? "pending",
        status: DEFAULT_RECEIPT_STATUS,
        syncBatchId: batchId,
      });
      return { status: "accepted" as const };
    } catch (err: unknown) {
      if (isUniqueViolation(err)) {
        await db
          .update(posReceipts)
          .set({
            localOrderId: payload.localOrderId ?? null,
            receiptNumber: payload.receiptNumber ?? null,
            netCents: payload.netCents,
            taxCents: payload.taxCents ?? 0,
            grossCents: payload.grossCents,
            currency: payload.currency ?? "EUR",
            soldAt,
            fiscalStatus: payload.fiscalStatus ?? "pending",
            syncBatchId: batchId,
            updatedAt: new Date(),
          })
          .where(
            and(
              eq(posReceipts.orgId, auth.orgId),
              eq(posReceipts.deviceId, auth.deviceId),
              eq(posReceipts.localReceiptId, payload.localReceiptId),
            ),
          );
        return { status: "accepted" as const };
      }
      throw err;
    }
  }

  private async upsertPayment(
    payload: PosSyncPaymentPayload,
    auth: PosDeviceAuthContext,
    batchId: string,
  ) {
    const paidAt = parseIsoDate(payload.paidAt, "paidAt");
    if (!paidAt) {
      return {
        status: "failed" as const,
        code: "invalid_payload",
        error: "paidAt is invalid",
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
            currency: payload.currency ?? "EUR",
            paidAt,
            syncBatchId: batchId,
          });
        } catch (err: unknown) {
          if (!isUniqueViolation(err)) {
            throw err;
          }

          const [existing] = await tx
            .select({ method: posSalePayments.method })
            .from(posSalePayments)
            .where(
              and(
                eq(posSalePayments.orgId, auth.orgId),
                eq(posSalePayments.deviceId, auth.deviceId),
                eq(posSalePayments.localPaymentId, payload.localPaymentId),
              ),
            )
            .limit(1);

          await tx
            .update(posSalePayments)
            .set({
              localOrderId: payload.localOrderId ?? null,
              localReceiptId: payload.localReceiptId ?? null,
              method: mergePaymentMethodForSync(existing?.method, payload.method),
              amountCents: payload.amountCents,
              currency: payload.currency ?? "EUR",
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

  private async upsertShift(
    payload: PosSyncShiftPayload,
    auth: PosDeviceAuthContext,
    batchId: string,
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
      currency: payload.currency ?? "EUR",
      schemaVersion: payload.schemaVersion,
    });
  }
}

export const posSyncService = new PosSyncService();
