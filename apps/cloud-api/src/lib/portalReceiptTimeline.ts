/**
 * Customer-portal receipt timeline (Phase 7 Sprint 2).
 * Excludes internal admin metadata.
 */

import {
  formatPaymentMethodLabel,
  isRefundEventType,
  resolveRefundReasonLabel,
  sanitizeEventForPortal,
  type PaymentMethodBucket,
  type RefundReasonCode,
} from "./receiptEventPayload.js";
import { RECEIPT_EVENT_TYPES } from "./receiptEventTypes.js";
import type { PortalReceiptEventRecord } from "./portalReceiptEvents.js";

export type PortalReceiptTimelineEntry = {
  id: string;
  kind: string;
  label: string;
  occurredAt: string;
  actor: string | null;
  summary: string | null;
};

const PORTAL_LABELS: Record<string, string> = {
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

function formatMinorForSummary(amountCents: number, currency: string): string {
  return new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: currency || "EUR",
  }).format(amountCents / 100);
}

function mapPortalTimelineEntry(
  event: PortalReceiptEventRecord,
  currency: string,
): PortalReceiptTimelineEntry | null {
  const label = PORTAL_LABELS[event.eventType];
  if (!label) return null;

  const payload = event.payload ?? {};
  let summary: string | null = null;

  if (event.eventType === RECEIPT_EVENT_TYPES.PAYMENT_CHANGED) {
    const prev =
      readString(payload, "previousMethod") ??
      readString(payload, "previousMethodRaw");
    const next =
      readString(payload, "newMethod") ?? readString(payload, "newMethodRaw");
    if (prev && next) {
      const prevLabel = (["cash", "card", "voucher", "other"] as string[]).includes(
        prev,
      )
        ? formatPaymentMethodLabel(prev as PaymentMethodBucket)
        : prev;
      const nextLabel = (["cash", "card", "voucher", "other"] as string[]).includes(
        next,
      )
        ? formatPaymentMethodLabel(next as PaymentMethodBucket)
        : next;
      summary = `${prevLabel} → ${nextLabel}`;
    }
  }

  if (isRefundEventType(event.eventType)) {
    const amount = payload.amountCents;
    const code = readString(payload, "reasonCode");
    const reason =
      code && (["customer_request", "wrong_item", "duplicate_payment", "product_issue", "order_cancelled", "other"] as string[]).includes(code)
        ? resolveRefundReasonLabel(code as RefundReasonCode, null)
        : readString(payload, "reasonLabel");

    const parts: string[] = [];
    if (typeof amount === "number" && Number.isInteger(amount)) {
      parts.push(formatMinorForSummary(amount, currency));
    }
    if (reason) parts.push(reason);
    summary = parts.length > 0 ? parts.join(" · ") : null;
  }

  return {
    id: event.id,
    kind: event.eventType,
    label,
    occurredAt: event.occurredAt,
    actor: event.actor?.trim() || null,
    summary,
  };
}

export function buildPortalReceiptTimeline(input: {
  soldAt: Date;
  currency: string;
  events: PortalReceiptEventRecord[];
}): PortalReceiptTimelineEntry[] {
  const sanitized = input.events.map(sanitizeEventForPortal);

  const createdEvent = sanitized.find(
    (event) => event.eventType === RECEIPT_EVENT_TYPES.CREATED,
  );

  const mapped = sanitized
    .map((event) => mapPortalTimelineEntry(event, input.currency))
    .filter((entry): entry is PortalReceiptTimelineEntry => entry !== null);

  const hasCreated = mapped.some((entry) => entry.kind === "created");
  if (!hasCreated) {
    mapped.unshift({
      id: createdEvent?.id ?? "created-fallback",
      kind: "created",
      label: PORTAL_LABELS.created,
      occurredAt: createdEvent?.occurredAt ?? input.soldAt.toISOString(),
      actor: createdEvent?.actor?.trim() || null,
      summary: null,
    });
  }

  return mapped.sort(
    (a, b) =>
      new Date(a.occurredAt).getTime() - new Date(b.occurredAt).getTime(),
  );
}
