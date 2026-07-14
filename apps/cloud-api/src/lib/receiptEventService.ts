import { and, asc, eq } from "drizzle-orm";

import { db } from "../db/client.js";
import { posReceiptEvents, posReceipts } from "../db/schema/posSync.js";
import { mapPortalReceiptEventRecord } from "./portalReceiptEvents.js";
import type { PortalReceiptEventRecord } from "./portalReceiptEvents.js";
import {
  RECEIPT_EVENT_TYPES,
  type ReceiptEventType,
} from "./receiptEventTypes.js";

function isUniqueViolation(err: unknown): boolean {
  return (
    typeof err === "object" &&
    err !== null &&
    "code" in err &&
    (err as { code?: string }).code === "23505"
  );
}

export type AppendReceiptEventInput = {
  orgId: string;
  customerId: string | null;
  deviceId: string;
  receiptId: string;
  receiptNumber?: string | null;
  eventId: string;
  eventType: ReceiptEventType;
  occurredAt: Date;
  actor?: string | null;
  payload?: Record<string, unknown>;
  schemaVersion: number;
  syncBatchId?: string | null;
};

export type ReceiptEventSummary = {
  totalEvents: number;
  printCount: number;
  reprintCount: number;
  latestEvent: PortalReceiptEventRecord | null;
};

export class ReceiptEventService {
  async findReceiptByLocalId(
    orgId: string,
    deviceId: string,
    localReceiptId: string,
  ) {
    const [receipt] = await db
      .select({
        id: posReceipts.id,
        receiptNumber: posReceipts.receiptNumber,
      })
      .from(posReceipts)
      .where(
        and(
          eq(posReceipts.orgId, orgId),
          eq(posReceipts.deviceId, deviceId),
          eq(posReceipts.localReceiptId, localReceiptId),
        ),
      )
      .limit(1);

    return receipt ?? null;
  }

  async appendEvent(
    input: AppendReceiptEventInput,
  ): Promise<
    | { status: "accepted" }
    | { status: "duplicate" }
    | { status: "failed"; code: string; error: string }
  > {
    try {
      await db.insert(posReceiptEvents).values({
        orgId: input.orgId,
        customerId: input.customerId,
        deviceId: input.deviceId,
        receiptId: input.receiptId,
        receiptNumber: input.receiptNumber ?? null,
        eventId: input.eventId,
        eventType: input.eventType,
        occurredAt: input.occurredAt,
        actor: input.actor ?? null,
        payload: input.payload ?? {},
        schemaVersion: input.schemaVersion,
        syncBatchId: input.syncBatchId ?? null,
      });
      return { status: "accepted" };
    } catch (err: unknown) {
      if (isUniqueViolation(err)) {
        return { status: "duplicate" };
      }
      throw err;
    }
  }

  async fetchReceiptEvents(
    orgId: string,
    receiptId: string,
  ): Promise<PortalReceiptEventRecord[]> {
    const rows = await db
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

    return rows.map(mapPortalReceiptEventRecord);
  }

  async getLatestEvent(
    orgId: string,
    receiptId: string,
  ): Promise<PortalReceiptEventRecord | null> {
    const events = await this.fetchReceiptEvents(orgId, receiptId);
    return events.length > 0 ? events[events.length - 1]! : null;
  }

  async getPrintCount(orgId: string, receiptId: string): Promise<number> {
    const events = await this.fetchReceiptEvents(orgId, receiptId);
    return events.filter((event) => event.eventType === RECEIPT_EVENT_TYPES.PRINTED)
      .length;
  }

  async getReprintCount(orgId: string, receiptId: string): Promise<number> {
    const events = await this.fetchReceiptEvents(orgId, receiptId);
    return events.filter(
      (event) => event.eventType === RECEIPT_EVENT_TYPES.REPRINTED,
    ).length;
  }

  async getEventSummary(
    orgId: string,
    receiptId: string,
  ): Promise<ReceiptEventSummary> {
    const events = await this.fetchReceiptEvents(orgId, receiptId);
    return {
      totalEvents: events.length,
      printCount: events.filter(
        (event) => event.eventType === RECEIPT_EVENT_TYPES.PRINTED,
      ).length,
      reprintCount: events.filter(
        (event) => event.eventType === RECEIPT_EVENT_TYPES.REPRINTED,
      ).length,
      latestEvent: events.length > 0 ? events[events.length - 1]! : null,
    };
  }
}

export const receiptEventService = new ReceiptEventService();
