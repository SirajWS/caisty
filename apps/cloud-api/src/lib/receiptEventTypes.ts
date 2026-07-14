/**
 * Receipt event types — POS sync subset vs full lifecycle (Phase 7 Sprint 2).
 */

export const RECEIPT_EVENT_TYPES = {
  CREATED: "created",
  PRINTED: "printed",
  REPRINTED: "reprinted",
  REFUND: "refund",
  PARTIAL_REFUND: "partial_refund",
  PAYMENT_CHANGED: "payment_changed",
  VOIDED: "voided",
} as const;

export type ReceiptEventType =
  (typeof RECEIPT_EVENT_TYPES)[keyof typeof RECEIPT_EVENT_TYPES];

/** Event types accepted from POS sync batches (Sprint 5.2B). */
export const POS_SYNC_RECEIPT_EVENT_TYPES = [
  RECEIPT_EVENT_TYPES.CREATED,
  RECEIPT_EVENT_TYPES.PRINTED,
  RECEIPT_EVENT_TYPES.REPRINTED,
] as const;

export type PosSyncReceiptEventType =
  (typeof POS_SYNC_RECEIPT_EVENT_TYPES)[number];

export const ALL_RECEIPT_EVENT_TYPES: readonly ReceiptEventType[] = [
  RECEIPT_EVENT_TYPES.CREATED,
  RECEIPT_EVENT_TYPES.PRINTED,
  RECEIPT_EVENT_TYPES.REPRINTED,
  RECEIPT_EVENT_TYPES.REFUND,
  RECEIPT_EVENT_TYPES.PARTIAL_REFUND,
  RECEIPT_EVENT_TYPES.PAYMENT_CHANGED,
  RECEIPT_EVENT_TYPES.VOIDED,
];

/** @deprecated Use POS_SYNC_RECEIPT_EVENT_TYPES for sync validation. */
export const SUPPORTED_RECEIPT_EVENT_TYPES = POS_SYNC_RECEIPT_EVENT_TYPES;

export const SUPPORTED_RECEIPT_EVENT_SCHEMA_VERSIONS = [1] as const;

export type ReceiptEventSchemaVersion =
  (typeof SUPPORTED_RECEIPT_EVENT_SCHEMA_VERSIONS)[number];

const ALL_EVENT_TYPE_SET = new Set<string>(ALL_RECEIPT_EVENT_TYPES);
const POS_SYNC_EVENT_TYPE_SET = new Set<string>(POS_SYNC_RECEIPT_EVENT_TYPES);

export function isReceiptEventType(value: string): value is ReceiptEventType {
  return ALL_EVENT_TYPE_SET.has(value);
}

export function isPosSyncReceiptEventType(
  value: string,
): value is PosSyncReceiptEventType {
  return POS_SYNC_EVENT_TYPE_SET.has(value);
}

export function isSupportedReceiptEventSchemaVersion(
  value: number,
): value is ReceiptEventSchemaVersion {
  return (SUPPORTED_RECEIPT_EVENT_SCHEMA_VERSIONS as readonly number[]).includes(
    value,
  );
}

export function normalizeReceiptEventType(value: string): ReceiptEventType | null {
  const trimmed = value.trim().toLowerCase();
  return isReceiptEventType(trimmed) ? trimmed : null;
}
