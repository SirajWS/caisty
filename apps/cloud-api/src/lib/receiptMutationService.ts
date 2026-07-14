/**
 * Admin receipt mutations: refund and payment change (Phase 7 Sprint 2).
 */

import { and, eq, or, sql } from "drizzle-orm";
import { randomUUID } from "node:crypto";

import { db } from "../db/client.js";
import { devices } from "../db/schema/devices.js";
import {
  posReceiptEvents,
  posReceipts,
  posSalePayments,
} from "../db/schema/posSync.js";
import {
  computeRefundableAmountCents,
  computeRefundedAmountCents,
  isRefundReasonCode,
  normalizePaymentMethodBucket,
  pickReceiptStatusAfterRefund,
  pickRefundEventType,
  resolveRefundReasonLabel,
  type PaymentMethodBucket,
  type RefundReasonCode,
} from "./receiptEventPayload.js";
import { mapPortalReceiptEventRecord } from "./portalReceiptEvents.js";
import { RECEIPT_EVENT_TYPES } from "./receiptEventTypes.js";
import { RECEIPT_STATUS, normalizeReceiptStatus } from "./receiptStatus.js";

export type MutationResult =
  | { ok: true; receiptId: string; eventId: string }
  | { ok: false; code: string; message: string; statusCode: number };

export type RefundReceiptInput = {
  receiptId: string;
  amountCents: number;
  reasonCode: RefundReasonCode;
  reasonText?: string | null;
  refundPaymentMethod: string;
  internalNote?: string | null;
  idempotencyKey: string;
  adminUserId: string;
  adminEmail?: string | null;
};

export type ChangeReceiptPaymentInput = {
  receiptId: string;
  newPaymentMethod: string;
  reason: string;
  internalNote?: string | null;
  idempotencyKey: string;
  adminUserId: string;
  adminEmail?: string | null;
};

type ReceiptRow = {
  id: string;
  orgId: string;
  customerId: string | null;
  deviceId: string;
  localReceiptId: string;
  localOrderId: string | null;
  receiptNumber: string | null;
  grossCents: number;
  currency: string;
  status: string | null;
};

function isUniqueViolation(err: unknown): boolean {
  return (
    typeof err === "object" &&
    err !== null &&
    "code" in err &&
    (err as { code?: string }).code === "23505"
  );
}

function invalid(code: string, message: string, statusCode = 400): MutationResult {
  return { ok: false, code, message, statusCode };
}

async function loadReceiptForMutation(
  receiptId: string,
): Promise<ReceiptRow | null> {
  const [row] = await db
    .select({
      id: posReceipts.id,
      orgId: posReceipts.orgId,
      customerId: posReceipts.customerId,
      deviceId: posReceipts.deviceId,
      localReceiptId: posReceipts.localReceiptId,
      localOrderId: posReceipts.localOrderId,
      receiptNumber: posReceipts.receiptNumber,
      grossCents: posReceipts.grossCents,
      currency: posReceipts.currency,
      status: posReceipts.status,
    })
    .from(posReceipts)
    .where(eq(posReceipts.id, receiptId))
    .limit(1);

  return row ?? null;
}

async function loadReceiptEvents(receiptId: string, orgId: string) {
  const rows = await db
    .select({
      id: posReceiptEvents.id,
      receiptId: posReceiptEvents.receiptId,
      eventType: posReceiptEvents.eventType,
      occurredAt: posReceiptEvents.occurredAt,
      actor: posReceiptEvents.actor,
      payload: posReceiptEvents.payload,
      schemaVersion: posReceiptEvents.schemaVersion,
      eventId: posReceiptEvents.eventId,
    })
    .from(posReceiptEvents)
    .where(
      and(
        eq(posReceiptEvents.orgId, orgId),
        eq(posReceiptEvents.receiptId, receiptId),
      ),
    );

  return rows.map((row) => ({
    mapped: mapPortalReceiptEventRecord(row),
    eventId: row.eventId,
  }));
}

async function findIdempotentEvent(eventId: string) {
  const [row] = await db
    .select({ receiptId: posReceiptEvents.receiptId })
    .from(posReceiptEvents)
    .where(eq(posReceiptEvents.eventId, eventId))
    .limit(1);
  return row ?? null;
}

function validateRefundInput(input: RefundReceiptInput): MutationResult | null {
  if (!input.idempotencyKey?.trim()) {
    return invalid("missing_idempotency_key", "idempotencyKey is required.");
  }

  if (!Number.isInteger(input.amountCents) || input.amountCents <= 0) {
    return invalid("invalid_amount", "Refund amount must be a positive integer.");
  }

  if (!isRefundReasonCode(input.reasonCode)) {
    return invalid("invalid_reason", "Invalid refund reason.");
  }

  if (
    input.reasonCode === "other" &&
    !input.reasonText?.trim()
  ) {
    return invalid(
      "missing_reason_text",
      "Reason text is required when reason is Other.",
    );
  }

  const refundMethod = normalizePaymentMethodBucket(input.refundPaymentMethod);
  if (!refundMethod) {
    return invalid(
      "invalid_payment_method",
      "Refund payment method must be cash, card, voucher, or other.",
    );
  }

  return null;
}

function validatePaymentChangeInput(
  input: ChangeReceiptPaymentInput,
): MutationResult | null {
  if (!input.idempotencyKey?.trim()) {
    return invalid("missing_idempotency_key", "idempotencyKey is required.");
  }

  if (!input.reason?.trim()) {
    return invalid("missing_reason", "Reason is required.");
  }

  const newMethod = normalizePaymentMethodBucket(input.newPaymentMethod);
  if (!newMethod) {
    return invalid(
      "invalid_payment_method",
      "New payment method must be cash, card, voucher, or other.",
    );
  }

  return null;
}

function canRefundStatus(status: string | null | undefined): MutationResult | null {
  const normalized = normalizeReceiptStatus(status);
  if (normalized === RECEIPT_STATUS.VOIDED) {
    return invalid("receipt_voided", "Voided receipts cannot be refunded.", 409);
  }
  if (normalized === RECEIPT_STATUS.REFUNDED) {
    return invalid(
      "receipt_fully_refunded",
      "This receipt is already fully refunded.",
      409,
    );
  }
  return null;
}

function canChangePaymentStatus(
  status: string | null | undefined,
): MutationResult | null {
  const normalized = normalizeReceiptStatus(status);
  if (normalized === RECEIPT_STATUS.VOIDED) {
    return invalid(
      "receipt_voided",
      "Voided receipts cannot change payment method.",
      409,
    );
  }
  if (
    normalized === RECEIPT_STATUS.REFUNDED ||
    normalized === RECEIPT_STATUS.PARTIAL_REFUND
  ) {
    return invalid(
      "receipt_refunded",
      "Refunded receipts cannot change payment method.",
      409,
    );
  }
  return null;
}

export async function refundReceipt(
  input: RefundReceiptInput,
): Promise<MutationResult> {
  const validationError = validateRefundInput(input);
  if (validationError) return validationError;

  const existing = await findIdempotentEvent(input.idempotencyKey.trim());
  if (existing) {
    return {
      ok: true,
      receiptId: existing.receiptId,
      eventId: input.idempotencyKey.trim(),
    };
  }

  const receipt = await loadReceiptForMutation(input.receiptId);
  if (!receipt) {
    return invalid("receipt_not_found", "Receipt not found.", 404);
  }

  const statusError = canRefundStatus(receipt.status);
  if (statusError) return statusError;

  const events = await loadReceiptEvents(receipt.id, receipt.orgId);
  const refundedSoFar = computeRefundedAmountCents(
    events.map((event) => event.mapped),
  );
  const refundable = computeRefundableAmountCents(
    receipt.grossCents,
    refundedSoFar,
  );

  if (refundable <= 0) {
    return invalid(
      "receipt_fully_refunded",
      "No refundable amount remains on this receipt.",
      409,
    );
  }

  if (input.amountCents > refundable) {
    return invalid(
      "refund_exceeds_remaining",
      `Refund amount exceeds remaining refundable amount (${refundable} minor units).`,
    );
  }

  const refundMethod = normalizePaymentMethodBucket(
    input.refundPaymentMethod,
  ) as PaymentMethodBucket;
  const eventType = pickRefundEventType(input.amountCents, refundable);
  const totalAfter = refundedSoFar + input.amountCents;
  const nextStatus = pickReceiptStatusAfterRefund(
    totalAfter,
    receipt.grossCents,
  );

  const actor = input.adminEmail?.trim() || `admin:${input.adminUserId}`;
  const occurredAt = new Date();
  const eventId = input.idempotencyKey.trim();

  const payload = {
    amountCents: input.amountCents,
    currency: receipt.currency,
    reasonCode: input.reasonCode,
    reasonLabel: resolveRefundReasonLabel(input.reasonCode, input.reasonText),
    reasonText:
      input.reasonCode === "other" ? input.reasonText?.trim() ?? null : null,
    refundPaymentMethod: refundMethod,
    internalNote: input.internalNote?.trim() || null,
    adminUserId: input.adminUserId,
  };

  try {
    await db.transaction(async (tx) => {
      await tx.insert(posReceiptEvents).values({
        orgId: receipt.orgId,
        customerId: receipt.customerId,
        deviceId: receipt.deviceId,
        receiptId: receipt.id,
        receiptNumber: receipt.receiptNumber,
        eventId,
        eventType,
        occurredAt,
        actor,
        payload,
        schemaVersion: 1,
        syncBatchId: null,
      });

      await tx
        .update(posReceipts)
        .set({
          status: nextStatus,
          updatedAt: new Date(),
        })
        .where(eq(posReceipts.id, receipt.id));
    });
  } catch (err: unknown) {
    if (isUniqueViolation(err)) {
      const raced = await findIdempotentEvent(eventId);
      if (raced) {
        return { ok: true, receiptId: raced.receiptId, eventId };
      }
    }
    throw err;
  }

  return { ok: true, receiptId: receipt.id, eventId };
}

export async function changeReceiptPayment(
  input: ChangeReceiptPaymentInput,
): Promise<MutationResult> {
  const validationError = validatePaymentChangeInput(input);
  if (validationError) return validationError;

  const existing = await findIdempotentEvent(input.idempotencyKey.trim());
  if (existing) {
    return {
      ok: true,
      receiptId: existing.receiptId,
      eventId: input.idempotencyKey.trim(),
    };
  }

  const receipt = await loadReceiptForMutation(input.receiptId);
  if (!receipt) {
    return invalid("receipt_not_found", "Receipt not found.", 404);
  }

  const statusError = canChangePaymentStatus(receipt.status);
  if (statusError) return statusError;

  const paymentRows = await db
    .select({
      id: posSalePayments.id,
      method: posSalePayments.method,
      amountCents: posSalePayments.amountCents,
      localPaymentId: posSalePayments.localPaymentId,
    })
    .from(posSalePayments)
    .where(
      and(
        eq(posSalePayments.orgId, receipt.orgId),
        eq(posSalePayments.deviceId, receipt.deviceId),
        or(
          eq(posSalePayments.localReceiptId, receipt.localReceiptId),
          receipt.localOrderId
            ? eq(posSalePayments.localOrderId, receipt.localOrderId)
            : sql`false`,
        ),
      ),
    )
    .limit(1);

  const payment = paymentRows[0];
  if (!payment) {
    return invalid(
      "payment_not_found",
      "No payment record found for this receipt.",
      409,
    );
  }

  const previousBucket = normalizePaymentMethodBucket(payment.method);
  const newBucket = normalizePaymentMethodBucket(input.newPaymentMethod);

  if (!previousBucket || !newBucket) {
    return invalid("invalid_payment_method", "Invalid payment method.");
  }

  if (previousBucket === newBucket) {
    return invalid(
      "same_payment_method",
      "New payment method must differ from the current method.",
    );
  }

  const actor = input.adminEmail?.trim() || `admin:${input.adminUserId}`;
  const occurredAt = new Date();
  const eventId = input.idempotencyKey.trim();

  const payload = {
    previousMethod: previousBucket,
    newMethod: newBucket,
    previousMethodRaw: payment.method,
    newMethodRaw: newBucket,
    amountCents: payment.amountCents,
    currency: receipt.currency,
    reason: input.reason.trim(),
    internalNote: input.internalNote?.trim() || null,
    adminUserId: input.adminUserId,
    paymentReference: payment.localPaymentId,
  };

  try {
    await db.transaction(async (tx) => {
      await tx
        .update(posSalePayments)
        .set({
          method: newBucket,
          updatedAt: new Date(),
        })
        .where(eq(posSalePayments.id, payment.id));

      await tx.insert(posReceiptEvents).values({
        orgId: receipt.orgId,
        customerId: receipt.customerId,
        deviceId: receipt.deviceId,
        receiptId: receipt.id,
        receiptNumber: receipt.receiptNumber,
        eventId,
        eventType: RECEIPT_EVENT_TYPES.PAYMENT_CHANGED,
        occurredAt,
        actor,
        payload,
        schemaVersion: 1,
        syncBatchId: null,
      });
    });
  } catch (err: unknown) {
    if (isUniqueViolation(err)) {
      const raced = await findIdempotentEvent(eventId);
      if (raced) {
        return { ok: true, receiptId: raced.receiptId, eventId };
      }
    }
    throw err;
  }

  return { ok: true, receiptId: receipt.id, eventId };
}

export function deriveRefundActionAvailability(input: {
  status: string | null | undefined;
  refundableAmountCents: number;
}): { available: boolean; reason: string | null } {
  const statusError = canRefundStatus(input.status);
  if (statusError) {
    return { available: false, reason: statusError.message };
  }
  if (input.refundableAmountCents <= 0) {
    return { available: false, reason: "No refundable amount remains." };
  }
  return { available: true, reason: null };
}

export function deriveChangePaymentActionAvailability(input: {
  status: string | null | undefined;
  hasPayment: boolean;
}): { available: boolean; reason: string | null } {
  const statusError = canChangePaymentStatus(input.status);
  if (statusError) {
    return { available: false, reason: statusError.message };
  }
  if (!input.hasPayment) {
    return { available: false, reason: "No payment record found for this receipt." };
  }
  return { available: true, reason: null };
}

/** Verify receipt belongs to customer scope (portal safety helper). */
export async function receiptBelongsToCustomer(
  receiptId: string,
  orgId: string,
  customerId: string,
): Promise<boolean> {
  const [row] = await db
    .select({ id: posReceipts.id })
    .from(posReceipts)
    .innerJoin(devices, eq(posReceipts.deviceId, devices.id))
    .where(
      and(
        eq(posReceipts.id, receiptId),
        eq(posReceipts.orgId, orgId),
        eq(devices.customerId, customerId),
      ),
    )
    .limit(1);

  return Boolean(row);
}

export function generateIdempotencyKey(): string {
  return randomUUID();
}
