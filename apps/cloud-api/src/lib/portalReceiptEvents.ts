/**
 * Portal-facing receipt event DTOs for future GET /portal/receipts/{receiptId}/events.
 * No route exposure in Sprint 5.2B — reusable mappers only.
 */

import type { ReceiptEventType } from "./receiptEventTypes.js";

export type PortalReceiptEventRecord = {
  id: string;
  receiptId: string;
  eventType: ReceiptEventType;
  occurredAt: string;
  actor: string | null;
  payload: Record<string, unknown>;
  schemaVersion: number;
};

export type PortalReceiptEventDbRow = {
  id: string;
  receiptId: string;
  eventType: string;
  occurredAt: Date;
  actor: string | null;
  payload: unknown;
  schemaVersion: number;
};

export function mapPortalReceiptEventRecord(
  row: PortalReceiptEventDbRow,
): PortalReceiptEventRecord {
  const payload =
    row.payload &&
    typeof row.payload === "object" &&
    !Array.isArray(row.payload)
      ? (row.payload as Record<string, unknown>)
      : {};

  return {
    id: row.id,
    receiptId: row.receiptId,
    eventType: row.eventType as ReceiptEventType,
    occurredAt: row.occurredAt.toISOString(),
    actor: row.actor,
    payload,
    schemaVersion: row.schemaVersion,
  };
}
