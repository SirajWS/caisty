/**
 * Customer-portal order timeline (Phase 7 Sprint 3).
 * Only emits steps backed by synced cloud data — no synthetic milestones.
 */

import {
  PORTAL_ORDER_STATUS,
  type PortalOrderStatus,
} from "./orderStatus.js";
import { RECEIPT_STATUS } from "./receiptStatus.js";

export type PortalOrderTimelineKind =
  | "created"
  | "preparing"
  | "ready"
  | "paid"
  | "completed"
  | "cancelled"
  | "refunded";

export type PortalOrderTimelineEntry = {
  id: string;
  kind: PortalOrderTimelineKind;
  label: string;
  occurredAt: string;
  actor: string | null;
  summary: string | null;
};

const TIMELINE_LABELS: Record<PortalOrderTimelineKind, string> = {
  created: "Created",
  preparing: "Preparing",
  ready: "Ready",
  paid: "Paid",
  completed: "Completed",
  cancelled: "Cancelled",
  refunded: "Refunded",
};

function rawIndicatesPreparing(rawStatus: string): boolean {
  const s = rawStatus.trim().toLowerCase();
  return (
    s === "in_progress" ||
    s === "inprogress" ||
    s === "preparing" ||
    s === "in preparation"
  );
}

function rawIndicatesReady(rawStatus: string): boolean {
  return rawStatus.trim().toLowerCase() === "ready";
}

export function buildPortalOrderTimeline(input: {
  orderId: string;
  soldAt: string;
  rawOrderStatus: string;
  normalizedStatus: PortalOrderStatus;
  hasPayment: boolean;
  hasReceipt: boolean;
  paidAt?: string | null;
  receiptStatus?: string | null;
  cashier?: string | null;
  refundedAt?: string | null;
}): PortalOrderTimelineEntry[] {
  const entries: PortalOrderTimelineEntry[] = [];
  const actor = input.cashier?.trim() || null;

  entries.push({
    id: `${input.orderId}:created`,
    kind: "created",
    label: TIMELINE_LABELS.created,
    occurredAt: input.soldAt,
    actor,
    summary: null,
  });

  if (rawIndicatesPreparing(input.rawOrderStatus)) {
    entries.push({
      id: `${input.orderId}:preparing`,
      kind: "preparing",
      label: TIMELINE_LABELS.preparing,
      occurredAt: input.soldAt,
      actor,
      summary: null,
    });
  }

  if (rawIndicatesReady(input.rawOrderStatus)) {
    entries.push({
      id: `${input.orderId}:ready`,
      kind: "ready",
      label: TIMELINE_LABELS.ready,
      occurredAt: input.soldAt,
      actor,
      summary: null,
    });
  }

  if (input.hasPayment || input.hasReceipt) {
    entries.push({
      id: `${input.orderId}:paid`,
      kind: "paid",
      label: TIMELINE_LABELS.paid,
      occurredAt: input.paidAt ?? input.soldAt,
      actor,
      summary: null,
    });
  }

  if (
    input.normalizedStatus === PORTAL_ORDER_STATUS.COMPLETED ||
    input.normalizedStatus === PORTAL_ORDER_STATUS.REFUNDED
  ) {
    if (input.hasReceipt || input.rawOrderStatus.trim().toLowerCase() === "closed") {
      entries.push({
        id: `${input.orderId}:completed`,
        kind: "completed",
        label: TIMELINE_LABELS.completed,
        occurredAt: input.paidAt ?? input.soldAt,
        actor,
        summary: null,
      });
    }
  }

  if (input.normalizedStatus === PORTAL_ORDER_STATUS.CANCELLED) {
    entries.push({
      id: `${input.orderId}:cancelled`,
      kind: "cancelled",
      label: TIMELINE_LABELS.cancelled,
      occurredAt: input.soldAt,
      actor,
      summary: null,
    });
  }

  const receiptStatus = (input.receiptStatus ?? "").trim().toLowerCase();
  if (
    input.normalizedStatus === PORTAL_ORDER_STATUS.REFUNDED ||
    receiptStatus === RECEIPT_STATUS.REFUNDED ||
    receiptStatus === RECEIPT_STATUS.PARTIAL_REFUND
  ) {
    entries.push({
      id: `${input.orderId}:refunded`,
      kind: "refunded",
      label: TIMELINE_LABELS.refunded,
      occurredAt: input.refundedAt ?? input.paidAt ?? input.soldAt,
      actor,
      summary:
        receiptStatus === RECEIPT_STATUS.PARTIAL_REFUND
          ? "Partial refund"
          : null,
    });
  }

  return entries.sort(
    (a, b) => new Date(a.occurredAt).getTime() - new Date(b.occurredAt).getTime(),
  );
}
