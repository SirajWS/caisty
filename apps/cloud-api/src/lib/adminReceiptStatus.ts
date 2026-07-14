/**
 * Admin-facing receipt status labels (Phase 7 Sprint 1).
 * Maps DB lifecycle values to operator-friendly labels.
 */

import {
  normalizeReceiptStatus,
  RECEIPT_STATUS,
  type ReceiptStatus,
} from "./receiptStatus.js";

export type AdminReceiptStatusFilter =
  | "all"
  | "completed"
  | "refunded"
  | "payment_changed"
  | "voided";

export type AdminReceiptDisplayStatus =
  | "completed"
  | "refunded"
  | "partial_refund"
  | "payment_changed"
  | "voided";

const ADMIN_STATUS_FILTER_SET = new Set<string>([
  "all",
  "completed",
  "refunded",
  "payment_changed",
  "voided",
]);

export function parseAdminReceiptStatusFilter(
  raw: string | undefined,
): AdminReceiptStatusFilter {
  const value = raw?.trim().toLowerCase();
  if (value && ADMIN_STATUS_FILTER_SET.has(value)) {
    return value as AdminReceiptStatusFilter;
  }
  return "all";
}

/** Map admin filter values to DB status column values. */
export function adminStatusFilterToDbValues(
  filter: AdminReceiptStatusFilter,
): string[] | null {
  switch (filter) {
    case "completed":
      return [RECEIPT_STATUS.ACTIVE];
    case "refunded":
      return [RECEIPT_STATUS.REFUNDED, RECEIPT_STATUS.PARTIAL_REFUND];
    case "payment_changed":
      return null;
    case "voided":
      return [RECEIPT_STATUS.VOIDED];
    default:
      return null;
  }
}

export function mapAdminReceiptDisplayStatus(
  dbStatus: string | null | undefined,
): AdminReceiptDisplayStatus {
  const normalized = normalizeReceiptStatus(dbStatus);
  switch (normalized) {
    case RECEIPT_STATUS.ACTIVE:
      return "completed";
    case RECEIPT_STATUS.REFUNDED:
      return "refunded";
    case RECEIPT_STATUS.PARTIAL_REFUND:
      return "partial_refund";
    case RECEIPT_STATUS.VOIDED:
      return "voided";
    default:
      return "completed";
  }
}

export function adminReceiptStatusLabel(
  displayStatus: AdminReceiptDisplayStatus,
): string {
  switch (displayStatus) {
    case "completed":
      return "Completed";
    case "refunded":
      return "Refunded";
    case "partial_refund":
      return "Partial refund";
    case "payment_changed":
      return "Payment changed";
    case "voided":
      return "Voided";
    default:
      return "Completed";
  }
}
