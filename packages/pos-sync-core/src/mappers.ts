import { isProviderCloudOrder } from "./pullDeviceMatch.js";
import type { PosPullOrderSnapshot } from "./types.js";

function parseTs(value: unknown) {
  if (value == null) return null;
  const n = Number(value);
  if (Number.isFinite(n) && String(value).trim() !== "") return n;
  const parsed = Date.parse(String(value));
  return Number.isFinite(parsed) ? parsed : null;
}

function mapCloudStatusToLocal(status: string) {
  const raw = String(status || "new").trim().toLowerCase();
  if (raw === "cancelled") return "canceled";
  if (raw === "closed") return "delivered";
  return raw;
}

export function mapCloudOrderToLocal(snapshot: PosPullOrderSnapshot) {
  if (!isProviderCloudOrder(snapshot)) return null;

  const updatedAt = parseTs(snapshot.updatedAt) ?? Date.now();
  const createdAt = parseTs(snapshot.createdAt) ?? updatedAt;
  const localOrderId = String(snapshot.localOrderId || "").trim();
  const providerOrderId = snapshot.providerOrderId
    ? String(snapshot.providerOrderId).trim()
    : null;
  const cloudId = String(snapshot.id || "").trim();
  const id = providerOrderId || localOrderId || cloudId;
  if (!id) return null;

  return {
    id,
    cloudId: cloudId || undefined,
    localOrderId: localOrderId || id,
    providerOrderId: providerOrderId || undefined,
    sourceDeviceId: snapshot.sourceDeviceId,
    platform: String(snapshot.platform || "").trim().toLowerCase(),
    status: mapCloudStatusToLocal(snapshot.status),
    totalCents: snapshot.totalCents,
    currency: snapshot.currency,
    paymentStatus: snapshot.paymentStatus || undefined,
    paymentMethod: snapshot.paymentMethod || undefined,
    payment:
      snapshot.paymentMethod || snapshot.paymentStatus
        ? {
            method: snapshot.paymentMethod || undefined,
            status: snapshot.paymentStatus || undefined,
          }
        : undefined,
    paid: snapshot.paymentStatus === "paid",
    lines: snapshot.lines,
    createdAt,
    updatedAt,
    soldAt: parseTs(snapshot.soldAt) ?? createdAt,
    _ts: createdAt,
    _pullSource: "cloud",
  };
}

export function mapCloudReceiptToLocal(snapshot: {
  id: string;
  localReceiptId: string;
  localOrderId: string | null;
  sourceDeviceId: string;
  grossCents: number;
  netCents: number;
  taxCents: number;
  currency: string;
  status: string;
  soldAt: string;
  createdAt: string;
  updatedAt: string;
}) {
  const updatedAt = parseTs(snapshot.updatedAt) ?? Date.now();
  const timestamp = parseTs(snapshot.soldAt) ?? parseTs(snapshot.createdAt) ?? updatedAt;
  return {
    id: snapshot.id,
    cloudReceiptId: snapshot.id,
    localReceiptId: snapshot.localReceiptId,
    localOrderId: snapshot.localOrderId,
    sourceDeviceId: snapshot.sourceDeviceId,
    grossCents: snapshot.grossCents,
    netCents: snapshot.netCents,
    taxCents: snapshot.taxCents,
    currency: snapshot.currency,
    status: snapshot.status,
    timestamp,
    updatedAt,
  };
}

export function mapCloudPaymentToLocal(snapshot: {
  id: string;
  localPaymentId: string;
  localOrderId: string | null;
  localReceiptId: string | null;
  sourceDeviceId: string;
  method: string;
  amountCents: number;
  currency: string;
  paidAt: string;
  createdAt: string;
  updatedAt: string;
}) {
  return {
    cloudPaymentId: snapshot.id,
    localPaymentId: snapshot.localPaymentId,
    localOrderId: snapshot.localOrderId,
    localReceiptId: snapshot.localReceiptId,
    sourceDeviceId: snapshot.sourceDeviceId,
    method: snapshot.method,
    amountCents: snapshot.amountCents,
    currency: snapshot.currency,
    paidAt: snapshot.paidAt,
    updatedAt: snapshot.updatedAt,
  };
}

export function mapCloudShiftToLocal(snapshot: {
  id: string;
  localShiftId: string;
  sourceDeviceId: string;
  cashier: string | null;
  status: string;
  openingFloatMinor: number;
  closingFloatMinor: number | null;
  currency: string;
  businessDate: string;
  openedAt: string;
  closedAt: string | null;
  createdAt: string;
  updatedAt: string;
}) {
  return {
    cloudId: snapshot.id,
    shiftId: snapshot.localShiftId,
    localShiftId: snapshot.localShiftId,
    sourceDeviceId: snapshot.sourceDeviceId,
    deviceId: snapshot.sourceDeviceId,
    cashier: snapshot.cashier,
    status: snapshot.status,
    openingFloatMinor: snapshot.openingFloatMinor,
    closingFloatMinor: snapshot.closingFloatMinor,
    currency: snapshot.currency,
    businessDate: snapshot.businessDate,
    startedAt: snapshot.openedAt,
    openedAt: snapshot.openedAt,
    endedAt: snapshot.closedAt,
    closedAt: snapshot.closedAt,
    createdAt: snapshot.createdAt,
    updatedAt: snapshot.updatedAt,
  };
}

export function mapCloudReceiptEventToLocal(snapshot: {
  id: string;
  eventId: string;
  receiptId: string;
  localReceiptId: string | null;
  sourceDeviceId: string;
  eventType: string;
  occurredAt: string;
  createdAt: string;
  metadata: Record<string, unknown>;
}) {
  return {
    id: snapshot.eventId || snapshot.id,
    receiptId: snapshot.receiptId,
    localReceiptId: snapshot.localReceiptId,
    sourceDeviceId: snapshot.sourceDeviceId,
    eventType: snapshot.eventType,
    occurredAt: snapshot.occurredAt,
    createdAt: snapshot.createdAt,
    metadata: snapshot.metadata,
  };
}
