/**
 * Portal order status normalization (Phase 7 Sprint 3).
 * Maps POS / DB status strings to a stable portal vocabulary without renaming DB values.
 */

import { normalizeReceiptStatus, type ReceiptStatus } from "./receiptStatus.js";

export const PORTAL_ORDER_STATUS = {
  OPEN: "open",
  IN_PROGRESS: "in_progress",
  READY: "ready",
  DELIVERED: "delivered",
  COMPLETED: "completed",
  CANCELLED: "cancelled",
  REFUNDED: "refunded",
} as const;

export type PortalOrderStatus =
  (typeof PORTAL_ORDER_STATUS)[keyof typeof PORTAL_ORDER_STATUS];

const PORTAL_ORDER_STATUS_SET = new Set<string>(Object.values(PORTAL_ORDER_STATUS));

export function isPortalOrderStatus(value: string): value is PortalOrderStatus {
  return PORTAL_ORDER_STATUS_SET.has(value);
}

/** Map raw POS order status to portal-normalized status. */
export function mapRawOrderStatusToPortal(raw: string | null | undefined): PortalOrderStatus {
  const s = (raw ?? "").trim().toLowerCase();
  if (!s) return PORTAL_ORDER_STATUS.COMPLETED;

  switch (s) {
    case "open":
      return PORTAL_ORDER_STATUS.OPEN;
    case "in_progress":
    case "inprogress":
    case "preparing":
    case "in preparation":
      return PORTAL_ORDER_STATUS.IN_PROGRESS;
    case "ready":
      return PORTAL_ORDER_STATUS.READY;
    case "delivered":
      return PORTAL_ORDER_STATUS.DELIVERED;
    case "closed":
    case "completed":
    case "paid":
      return PORTAL_ORDER_STATUS.COMPLETED;
    case "cancelled":
    case "canceled":
      return PORTAL_ORDER_STATUS.CANCELLED;
    case "refunded":
      return PORTAL_ORDER_STATUS.REFUNDED;
    default:
      if (isPortalOrderStatus(s)) return s;
      return PORTAL_ORDER_STATUS.COMPLETED;
  }
}

/**
 * Derive portal order status from order row + linked receipt lifecycle.
 * Receipt refund status takes precedence over a stale `closed` order row.
 */
export function normalizePortalOrderStatus(input: {
  rawOrderStatus: string | null | undefined;
  receiptStatus?: string | null | undefined;
}): PortalOrderStatus {
  const receipt = normalizeReceiptStatus(input.receiptStatus);
  if (receipt === "refunded" || receipt === "partial_refund") {
    return PORTAL_ORDER_STATUS.REFUNDED;
  }
  if (receipt === "voided") {
    return PORTAL_ORDER_STATUS.CANCELLED;
  }

  const fromOrder = mapRawOrderStatusToPortal(input.rawOrderStatus);
  if (fromOrder === PORTAL_ORDER_STATUS.CANCELLED) {
    return PORTAL_ORDER_STATUS.CANCELLED;
  }

  return fromOrder;
}

export function portalOrderStatusLabel(status: PortalOrderStatus): string {
  switch (status) {
    case PORTAL_ORDER_STATUS.OPEN:
      return "Open";
    case PORTAL_ORDER_STATUS.IN_PROGRESS:
      return "In Progress";
    case PORTAL_ORDER_STATUS.READY:
      return "Ready";
    case PORTAL_ORDER_STATUS.DELIVERED:
      return "Delivered";
    case PORTAL_ORDER_STATUS.COMPLETED:
      return "Completed";
    case PORTAL_ORDER_STATUS.CANCELLED:
      return "Cancelled";
    case PORTAL_ORDER_STATUS.REFUNDED:
      return "Refunded";
    default:
      return status;
  }
}

export type ReceiptStatusForOrder = ReceiptStatus;
