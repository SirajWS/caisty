/**
 * Provider/channel order payment normalization at Cloud ingress.
 * Never infers Card/Paid from platform, source, delivery type, or order id alone.
 */

import { isProviderOrder } from "./orderSource.js";

const ONLINE_METHODS = new Set(["platform_card", "online", "card_online"]);
const POS_MANUAL_METHODS = new Set(["cash", "card"]);

export type NormalizedProviderPayment = {
  paymentStatus: "pending" | "paid";
  paymentMethod: string | null;
  paid: boolean;
  paidAt: string | null;
  transactionId: string | null;
  providerPaymentId: string | null;
};

function optionalText(value: unknown): string {
  if (value == null) return "";
  return String(value).trim();
}

function readPaymentObject(
  payment: unknown,
): { method: string; status: string; details: Record<string, unknown> } | null {
  if (!payment || typeof payment !== "object" || Array.isArray(payment)) return null;
  const obj = payment as Record<string, unknown>;
  const method = optionalText(obj.method).toLowerCase();
  const status = optionalText(obj.status).toLowerCase();
  const details =
    obj.details && typeof obj.details === "object" && !Array.isArray(obj.details)
      ? (obj.details as Record<string, unknown>)
      : {};
  if (!method && !status && Object.keys(details).length === 0) return null;
  return { method, status, details };
}

function readTxnProof(input: {
  transactionId?: unknown;
  providerPaymentId?: unknown;
  providerOrderId?: unknown;
  localOrderId?: unknown;
  payment?: { details?: Record<string, unknown> } | null;
}): string | null {
  const details = input.payment?.details ?? {};
  const candidates = [
    details.txnId,
    details.transactionId,
    details.providerPaymentId,
    input.transactionId,
    input.providerPaymentId,
  ];
  const orderTokens = new Set(
    [input.providerOrderId, input.localOrderId]
      .map((value) => optionalText(value))
      .filter(Boolean),
  );

  for (const value of candidates) {
    const text = optionalText(value);
    if (!text) continue;
    if (orderTokens.has(text)) continue;
    if (/^T\d{10,}$/.test(text) && orderTokens.has(text)) continue;
    return text;
  }
  return null;
}

function isOnlineMethod(method: string): boolean {
  if (!method) return false;
  return (
    ONLINE_METHODS.has(method) ||
    method.includes("platform") ||
    method.includes("online")
  );
}

function hasPosSettlementMarker(input: {
  paid?: unknown;
  paidAt?: unknown;
  paymentUpdatedAt?: unknown;
}): boolean {
  return input.paid === true || optionalText(input.paidAt) !== "" || optionalText(input.paymentUpdatedAt) !== "";
}

function pendingPayment(method: string | null = null): NormalizedProviderPayment {
  return {
    paymentStatus: "pending",
    paymentMethod: method && method !== "unknown" ? method : null,
    paid: false,
    paidAt: null,
    transactionId: null,
    providerPaymentId: null,
  };
}

export function normalizeProviderOrderPayment(input: {
  platform?: string | null;
  paymentStatus?: string | null;
  paymentMethod?: string | null;
  paid?: boolean | null;
  paidAt?: string | null;
  paymentUpdatedAt?: string | null;
  transactionId?: string | null;
  providerPaymentId?: string | null;
  providerOrderId?: string | null;
  localOrderId?: string | null;
  payment?: unknown;
}): NormalizedProviderPayment {
  const paymentObj = readPaymentObject(input.payment);
  const flatMethod = optionalText(input.paymentMethod).toLowerCase();
  const flatStatus = optionalText(input.paymentStatus).toLowerCase();
  const nestedMethod = paymentObj?.method ?? "";
  const nestedStatus = paymentObj?.status ?? "";

  const effectiveMethod =
    (nestedMethod && nestedMethod !== "unknown" ? nestedMethod : "") ||
    flatMethod ||
    "unknown";
  const effectiveStatus =
    (nestedStatus && nestedStatus !== "pending" ? nestedStatus : "") ||
    flatStatus ||
    "pending";

  const hasAnyPaymentHint =
    paymentObj != null ||
    Boolean(flatMethod) ||
    Boolean(flatStatus) ||
    input.paid === true ||
    optionalText(input.paidAt) !== "" ||
    optionalText(input.transactionId) !== "" ||
    optionalText(input.providerPaymentId) !== "";

  if (!hasAnyPaymentHint) {
    return pendingPayment();
  }

  const txnProof = readTxnProof({
    transactionId: input.transactionId,
    providerPaymentId: input.providerPaymentId,
    providerOrderId: input.providerOrderId,
    localOrderId: input.localOrderId,
    payment: paymentObj,
  });

  if (isOnlineMethod(effectiveMethod)) {
    const confirmedOnline =
      effectiveStatus === "paid" &&
      (txnProof != null || hasPosSettlementMarker(input));
    if (!confirmedOnline) {
      return pendingPayment(effectiveMethod);
    }
    return {
      paymentStatus: "paid",
      paymentMethod: effectiveMethod,
      paid: true,
      paidAt: optionalText(input.paidAt) || null,
      transactionId: txnProof,
      providerPaymentId: optionalText(input.providerPaymentId) || txnProof,
    };
  }

  if (POS_MANUAL_METHODS.has(effectiveMethod)) {
    const confirmedManual =
      effectiveStatus === "paid" && hasPosSettlementMarker(input);
    if (!confirmedManual) {
      return pendingPayment(effectiveMethod);
    }
    return {
      paymentStatus: "paid",
      paymentMethod: effectiveMethod,
      paid: true,
      paidAt:
        optionalText(input.paidAt) ||
        optionalText(input.paymentUpdatedAt) ||
        null,
      transactionId: null,
      providerPaymentId: null,
    };
  }

  if (effectiveStatus === "paid" && !hasPosSettlementMarker(input) && !txnProof) {
    return pendingPayment();
  }

  if (effectiveStatus === "pending" || effectiveMethod === "unknown") {
    return pendingPayment(effectiveMethod === "unknown" ? null : effectiveMethod);
  }

  return pendingPayment(effectiveMethod);
}

/** Apply provider payment rules to POS sync order payloads. */
export function normalizeProviderSyncOrderPayment(
  payload: {
    platform?: string;
    paymentStatus?: string;
    paymentMethod?: string;
    paid?: boolean;
    paidAt?: string;
    transactionId?: string;
    providerPaymentId?: string;
    providerOrderId?: string;
    localOrderId?: string;
    payment?: unknown;
  },
): string | null {
  if (!isProviderOrder(payload.platform)) {
    const raw = optionalText(payload.paymentStatus).toLowerCase();
    return raw || null;
  }

  const normalized = normalizeProviderOrderPayment(payload);
  return normalized.paymentStatus;
}
