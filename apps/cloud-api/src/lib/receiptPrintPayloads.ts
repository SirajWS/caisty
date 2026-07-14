/**
 * Print view-models for refund and payment-change receipts (Phase 7 Sprint 2).
 * No fiscal fields; structured payloads only — no print job dispatch.
 */

import {
  formatPaymentMethodLabel,
  resolveRefundReasonLabel,
  type PaymentMethodBucket,
  type RefundReasonCode,
} from "./receiptEventPayload.js";
import type { PortalReceiptEventRecord } from "./portalReceiptEvents.js";
import { RECEIPT_EVENT_TYPES } from "./receiptEventTypes.js";

export type RefundReceiptPrintPayload = {
  documentType: "REFUND";
  originalReceiptNumber: string | null;
  refundDate: string;
  refundAmountCents: number;
  currency: string;
  refundReason: string;
  refundPaymentMethod: string;
  actor: string | null;
  businessName: string | null;
  registerName: string | null;
  shiftId: string | null;
};

export type PaymentChangeReceiptPrintPayload = {
  documentType: "PAYMENT CHANGED";
  receiptNumber: string | null;
  changeDate: string;
  oldPaymentMethod: string;
  newPaymentMethod: string;
  amountCents: number;
  currency: string;
  actor: string | null;
  businessName: string | null;
  registerName: string | null;
  shiftId: string | null;
};

type ReceiptContext = {
  receiptNumber: string | null;
  businessName: string | null;
  registerName: string | null;
  grossCents: number;
  currency: string;
  shiftId?: string | null;
};

export function buildRefundReceiptPrintPayload(input: {
  receipt: ReceiptContext;
  event: PortalReceiptEventRecord;
}): RefundReceiptPrintPayload | null {
  if (
    input.event.eventType !== RECEIPT_EVENT_TYPES.REFUND &&
    input.event.eventType !== RECEIPT_EVENT_TYPES.PARTIAL_REFUND
  ) {
    return null;
  }

  const payload = input.event.payload ?? {};
  const amountCents = payload.amountCents;
  if (typeof amountCents !== "number" || !Number.isInteger(amountCents)) {
    return null;
  }

  const reasonCode =
    typeof payload.reasonCode === "string" ? payload.reasonCode : "other";
  const reasonText =
    typeof payload.reasonText === "string" ? payload.reasonText : null;
  const refundMethod =
    typeof payload.refundPaymentMethod === "string"
      ? payload.refundPaymentMethod
      : "other";

  return {
    documentType: "REFUND",
    originalReceiptNumber: input.receipt.receiptNumber,
    refundDate: input.event.occurredAt,
    refundAmountCents: amountCents,
    currency: input.receipt.currency,
    refundReason: isRefundReasonCode(reasonCode)
      ? resolveRefundReasonLabel(reasonCode, reasonText)
      : String(reasonCode),
    refundPaymentMethod: (["cash", "card", "voucher", "other"] as string[]).includes(
      refundMethod,
    )
      ? formatPaymentMethodLabel(refundMethod as PaymentMethodBucket)
      : refundMethod,
    actor: input.event.actor,
    businessName: input.receipt.businessName,
    registerName: input.receipt.registerName,
    shiftId: input.receipt.shiftId ?? null,
  };
}

export function buildPaymentChangeReceiptPrintPayload(input: {
  receipt: ReceiptContext;
  event: PortalReceiptEventRecord;
}): PaymentChangeReceiptPrintPayload | null {
  if (input.event.eventType !== RECEIPT_EVENT_TYPES.PAYMENT_CHANGED) {
    return null;
  }

  const payload = input.event.payload ?? {};
  const previous =
    typeof payload.previousMethod === "string"
      ? payload.previousMethod
      : typeof payload.previousMethodRaw === "string"
        ? payload.previousMethodRaw
        : null;
  const next =
    typeof payload.newMethod === "string"
      ? payload.newMethod
      : typeof payload.newMethodRaw === "string"
        ? payload.newMethodRaw
        : null;

  if (!previous || !next) return null;

  const formatMethod = (value: string) =>
    (["cash", "card", "voucher", "other"] as string[]).includes(value)
      ? formatPaymentMethodLabel(value as PaymentMethodBucket)
      : value;

  return {
    documentType: "PAYMENT CHANGED",
    receiptNumber: input.receipt.receiptNumber,
    changeDate: input.event.occurredAt,
    oldPaymentMethod: formatMethod(previous),
    newPaymentMethod: formatMethod(next),
    amountCents: input.receipt.grossCents,
    currency: input.receipt.currency,
    actor: input.event.actor,
    businessName: input.receipt.businessName,
    registerName: input.receipt.registerName,
    shiftId: input.receipt.shiftId ?? null,
  };
}

function isRefundReasonCode(value: string): value is RefundReasonCode {
  return (
    [
      "customer_request",
      "wrong_item",
      "duplicate_payment",
      "product_issue",
      "order_cancelled",
      "other",
    ] as string[]
  ).includes(value);
}

export function buildLatestPrintPayloads(input: {
  receipt: ReceiptContext;
  events: PortalReceiptEventRecord[];
}): {
  latestRefund: RefundReceiptPrintPayload | null;
  latestPaymentChange: PaymentChangeReceiptPrintPayload | null;
} {
  let latestRefund: RefundReceiptPrintPayload | null = null;
  let latestPaymentChange: PaymentChangeReceiptPrintPayload | null = null;

  for (const event of input.events) {
    const refundPayload = buildRefundReceiptPrintPayload({
      receipt: input.receipt,
      event,
    });
    if (refundPayload) latestRefund = refundPayload;

    const changePayload = buildPaymentChangeReceiptPrintPayload({
      receipt: input.receipt,
      event,
    });
    if (changePayload) latestPaymentChange = changePayload;
  }

  return { latestRefund, latestPaymentChange };
}
