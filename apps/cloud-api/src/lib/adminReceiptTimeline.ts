/**
 * Admin receipt timeline builder (Phase 7 Sprint 2).
 */

import {
  formatPaymentMethodLabel,
  isRefundEventType,
  REFUND_REASON_LABELS,
  resolveRefundReasonLabel,
  type PaymentMethodBucket,
  type RefundReasonCode,
} from "./receiptEventPayload.js";
import { RECEIPT_EVENT_TYPES } from "./receiptEventTypes.js";
import type { PortalReceiptEventRecord } from "./portalReceiptEvents.js";

export type AdminReceiptTimelineKind =
  | "created"
  | "printed"
  | "reprinted"
  | "refund"
  | "partial_refund"
  | "payment_changed"
  | "voided";

export type AdminReceiptTimelineEntry = {
  id: string;
  kind: AdminReceiptTimelineKind;
  label: string;
  occurredAt: string;
  actor: string | null;
  details: string | null;
  amountCents: number | null;
  previousValue: string | null;
  newValue: string | null;
  reason: string | null;
};

const TIMELINE_LABELS: Record<AdminReceiptTimelineKind, string> = {
  created: "Created",
  printed: "Printed",
  reprinted: "Reprinted",
  refund: "Refunded",
  partial_refund: "Partial refund",
  payment_changed: "Payment changed",
  voided: "Voided",
};

function readString(payload: Record<string, unknown>, key: string): string | null {
  const value = payload[key];
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function readAmount(payload: Record<string, unknown>): number | null {
  const value = payload.amountCents;
  return typeof value === "number" && Number.isInteger(value) ? value : null;
}

function mapEventKind(eventType: string): AdminReceiptTimelineKind | null {
  switch (eventType) {
    case RECEIPT_EVENT_TYPES.CREATED:
      return "created";
    case RECEIPT_EVENT_TYPES.PRINTED:
      return "printed";
    case RECEIPT_EVENT_TYPES.REPRINTED:
      return "reprinted";
    case RECEIPT_EVENT_TYPES.REFUND:
      return "refund";
    case RECEIPT_EVENT_TYPES.PARTIAL_REFUND:
      return "partial_refund";
    case RECEIPT_EVENT_TYPES.PAYMENT_CHANGED:
      return "payment_changed";
    case RECEIPT_EVENT_TYPES.VOIDED:
      return "voided";
    default:
      return null;
  }
}

function formatRefundReason(payload: Record<string, unknown>): string | null {
  const code = readString(payload, "reasonCode");
  if (code && (REFUND_REASON_LABELS as Record<string, string>)[code]) {
    return resolveRefundReasonLabel(
      code as RefundReasonCode,
      readString(payload, "reasonText"),
    );
  }
  return readString(payload, "reasonLabel") ?? readString(payload, "reason");
}

function formatPaymentBucket(value: string | null): string | null {
  if (!value) return null;
  if ((["cash", "card", "voucher", "other"] as string[]).includes(value)) {
    return formatPaymentMethodLabel(value as PaymentMethodBucket);
  }
  return value;
}

function mapEventToTimelineEntry(
  event: PortalReceiptEventRecord,
): AdminReceiptTimelineEntry | null {
  const kind = mapEventKind(event.eventType);
  if (!kind) return null;

  const payload = event.payload ?? {};
  const amountCents = readAmount(payload);
  const reason = isRefundEventType(event.eventType)
    ? formatRefundReason(payload)
    : readString(payload, "reason");

  const previousRaw =
    readString(payload, "previousMethod") ??
    readString(payload, "previousMethodRaw");
  const newRaw =
    readString(payload, "newMethod") ?? readString(payload, "newMethodRaw");

  const previousValue = formatPaymentBucket(previousRaw);
  const newValue = formatPaymentBucket(newRaw);

  let details: string | null = null;
  if (kind === "payment_changed" && previousValue && newValue) {
    details = `${previousValue} → ${newValue}`;
  } else if (isRefundEventType(event.eventType) && amountCents !== null) {
    details = reason ? `Reason: ${reason}` : null;
  }

  return {
    id: event.id,
    kind,
    label: TIMELINE_LABELS[kind],
    occurredAt: event.occurredAt,
    actor: event.actor?.trim() || null,
    details,
    amountCents,
    previousValue,
    newValue,
    reason,
  };
}

export function buildAdminReceiptTimeline(input: {
  soldAt: Date;
  events: PortalReceiptEventRecord[];
}): AdminReceiptTimelineEntry[] {
  const createdEvent = input.events.find(
    (event) => event.eventType === RECEIPT_EVENT_TYPES.CREATED,
  );

  const mapped = input.events
    .map(mapEventToTimelineEntry)
    .filter((entry): entry is AdminReceiptTimelineEntry => entry !== null);

  const hasCreated = mapped.some((entry) => entry.kind === "created");
  if (!hasCreated) {
    mapped.unshift({
      id: createdEvent?.id ?? "created-fallback",
      kind: "created",
      label: TIMELINE_LABELS.created,
      occurredAt: createdEvent?.occurredAt ?? input.soldAt.toISOString(),
      actor: createdEvent?.actor?.trim() || null,
      details: null,
      amountCents: null,
      previousValue: null,
      newValue: null,
      reason: null,
    });
  }

  return mapped.sort(
    (a, b) =>
      new Date(a.occurredAt).getTime() - new Date(b.occurredAt).getTime(),
  );
}
