/**
 * POS receipt business lifecycle status (distinct from fiscal_status and sync transport status).
 *
 * Sprint 5.1: only `active` is persisted. Future sprints add transitions via receipt events.
 */

export const RECEIPT_STATUS = {
  ACTIVE: "active",
  REFUNDED: "refunded",
  PARTIAL_REFUND: "partial_refund",
  VOIDED: "voided",
} as const;

export type ReceiptStatus =
  (typeof RECEIPT_STATUS)[keyof typeof RECEIPT_STATUS];

export const DEFAULT_RECEIPT_STATUS: ReceiptStatus = RECEIPT_STATUS.ACTIVE;

const RECEIPT_STATUS_SET = new Set<string>(Object.values(RECEIPT_STATUS));

export function isReceiptStatus(value: string): value is ReceiptStatus {
  return RECEIPT_STATUS_SET.has(value);
}

/** Normalize DB/API values; unknown legacy rows fall back to active. */
export function normalizeReceiptStatus(
  value: string | null | undefined,
): ReceiptStatus {
  const trimmed = value?.trim();
  if (trimmed && isReceiptStatus(trimmed)) {
    return trimmed;
  }
  return DEFAULT_RECEIPT_STATUS;
}

/**
 * Whether a receipt contributes to revenue / receipt-count KPIs.
 * Sprint 5.1: only active receipts count (identical to today when all rows are active).
 */
export function receiptCountsTowardKpis(status: string | null | undefined): boolean {
  return normalizeReceiptStatus(status) === RECEIPT_STATUS.ACTIVE;
}
