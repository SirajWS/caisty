/**
 * Supported POS receipt event types (Sprint 5.2B).
 * Refunds, void, payment_changed belong to later sprints.
 */

export const RECEIPT_EVENT_TYPES = {
  CREATED: "created",
  PRINTED: "printed",
  REPRINTED: "reprinted",
} as const;

export type ReceiptEventType =
  (typeof RECEIPT_EVENT_TYPES)[keyof typeof RECEIPT_EVENT_TYPES];

export const SUPPORTED_RECEIPT_EVENT_TYPES: readonly ReceiptEventType[] = [
  RECEIPT_EVENT_TYPES.CREATED,
  RECEIPT_EVENT_TYPES.PRINTED,
  RECEIPT_EVENT_TYPES.REPRINTED,
];

export const SUPPORTED_RECEIPT_EVENT_SCHEMA_VERSIONS = [1] as const;

export type ReceiptEventSchemaVersion =
  (typeof SUPPORTED_RECEIPT_EVENT_SCHEMA_VERSIONS)[number];

export function isReceiptEventType(value: string): value is ReceiptEventType {
  return (SUPPORTED_RECEIPT_EVENT_TYPES as readonly string[]).includes(value);
}

export function isSupportedReceiptEventSchemaVersion(
  value: number,
): value is ReceiptEventSchemaVersion {
  return (SUPPORTED_RECEIPT_EVENT_SCHEMA_VERSIONS as readonly number[]).includes(
    value,
  );
}
