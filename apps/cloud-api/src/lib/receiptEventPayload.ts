/**
 * Structured receipt event payloads and refund calculations (Phase 7 Sprint 2).
 */

import { bucketPaymentMethod, type PaymentBucket } from "./portalOrders.js";
import type { PortalReceiptEventRecord } from "./portalReceiptEvents.js";
import { RECEIPT_EVENT_TYPES, type ReceiptEventType } from "./receiptEventTypes.js";

export const REFUND_REASON_CODES = [
  "customer_request",
  "wrong_item",
  "duplicate_payment",
  "product_issue",
  "order_cancelled",
  "other",
] as const;

export type RefundReasonCode = (typeof REFUND_REASON_CODES)[number];

export const REFUND_REASON_LABELS: Record<RefundReasonCode, string> = {
  customer_request: "Customer request",
  wrong_item: "Wrong item",
  duplicate_payment: "Duplicate payment",
  product_issue: "Product issue",
  order_cancelled: "Order cancelled",
  other: "Other",
};

export const PAYMENT_METHOD_BUCKETS = [
  "cash",
  "card",
  "voucher",
  "other",
] as const;

export type PaymentMethodBucket = (typeof PAYMENT_METHOD_BUCKETS)[number];

export type RefundEventPayload = {
  amountCents: number;
  currency: string;
  reasonCode: RefundReasonCode;
  reasonLabel: string;
  reasonText?: string | null;
  refundPaymentMethod: PaymentMethodBucket;
  paymentReference?: string | null;
  internalNote?: string | null;
  adminUserId?: string | null;
};

export type PaymentChangedEventPayload = {
  previousMethod: PaymentMethodBucket;
  newMethod: PaymentMethodBucket;
  previousMethodRaw: string;
  newMethodRaw: string;
  amountCents: number;
  currency: string;
  reason: string;
  internalNote?: string | null;
  adminUserId?: string | null;
  paymentReference?: string | null;
};

export function isRefundReasonCode(value: string): value is RefundReasonCode {
  return (REFUND_REASON_CODES as readonly string[]).includes(value);
}

export function normalizePaymentMethodBucket(
  value: string,
): PaymentMethodBucket | null {
  const trimmed = value.trim().toLowerCase();
  if ((PAYMENT_METHOD_BUCKETS as readonly string[]).includes(trimmed)) {
    return trimmed as PaymentMethodBucket;
  }
  const bucket = bucketPaymentMethod(trimmed);
  return bucket;
}

export function formatPaymentMethodLabel(bucket: PaymentMethodBucket): string {
  switch (bucket) {
    case "cash":
      return "Cash";
    case "card":
      return "Card";
    case "voucher":
      return "Voucher";
    default:
      return "Other";
  }
}

export function isRefundEventType(eventType: string): boolean {
  return (
    eventType === RECEIPT_EVENT_TYPES.REFUND ||
    eventType === RECEIPT_EVENT_TYPES.PARTIAL_REFUND
  );
}

export function computeRefundedAmountCents(
  events: Array<{ eventType: string; payload: Record<string, unknown> }>,
): number {
  let total = 0;
  for (const event of events) {
    if (!isRefundEventType(event.eventType)) continue;
    const amount = event.payload.amountCents;
    if (typeof amount === "number" && Number.isInteger(amount) && amount > 0) {
      total += amount;
    }
  }
  return total;
}

export function computeRefundableAmountCents(
  grossCents: number,
  refundedAmountCents: number,
): number {
  return Math.max(grossCents - refundedAmountCents, 0);
}

export function resolveRefundReasonLabel(
  code: RefundReasonCode,
  reasonText?: string | null,
): string {
  if (code === "other" && reasonText?.trim()) {
    return reasonText.trim();
  }
  return REFUND_REASON_LABELS[code];
}

/** Strip admin-only fields before portal exposure. */
export function sanitizeEventForPortal(
  event: PortalReceiptEventRecord,
): PortalReceiptEventRecord {
  const payload = { ...event.payload };

  if (payload.internalNote !== undefined) {
    delete payload.internalNote;
  }
  if (payload.adminUserId !== undefined) {
    delete payload.adminUserId;
  }

  if (
    isRefundEventType(event.eventType) &&
    typeof payload.reasonCode === "string" &&
    isRefundReasonCode(payload.reasonCode)
  ) {
    payload.reasonLabel = resolveRefundReasonLabel(
      payload.reasonCode,
      typeof payload.reasonText === "string" ? payload.reasonText : null,
    );
    delete payload.reasonText;
  }

  return {
    ...event,
    payload,
  };
}

export function receiptHasPaymentChange(
  events: Array<{ eventType: string }>,
): boolean {
  return events.some(
    (event) => event.eventType === RECEIPT_EVENT_TYPES.PAYMENT_CHANGED,
  );
}

export function pickRefundEventType(
  amountCents: number,
  remainingBeforeCents: number,
): ReceiptEventType {
  return amountCents >= remainingBeforeCents
    ? RECEIPT_EVENT_TYPES.REFUND
    : RECEIPT_EVENT_TYPES.PARTIAL_REFUND;
}

export function pickReceiptStatusAfterRefund(
  totalRefundedAfterCents: number,
  grossCents: number,
): "refunded" | "partial_refund" {
  return totalRefundedAfterCents >= grossCents ? "refunded" : "partial_refund";
}
