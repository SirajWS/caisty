import type { PosPullOrderSnapshot } from "./types.js";

export function deviceLocalKey(deviceId: string, localId: string) {
  return `${deviceId}|${localId}`;
}

export function findPullOrderIndex(
  orders: Array<Record<string, unknown>>,
  incoming: Record<string, unknown>,
) {
  const cloudId = String(incoming.cloudId || "").trim();
  const localOrderId = String(incoming.localOrderId || "").trim();
  const providerOrderId = String(incoming.providerOrderId || "").trim();
  const sourceDeviceId = String(incoming.sourceDeviceId || "").trim();

  return orders.findIndex((order) => {
    if (cloudId && String(order.cloudId || "") === cloudId) return true;
    if (
      providerOrderId &&
      String(order.providerOrderId || "") === providerOrderId &&
      (!sourceDeviceId || String(order.sourceDeviceId || "") === sourceDeviceId)
    ) {
      return true;
    }
    if (
      localOrderId &&
      String(order.localOrderId || "") === localOrderId &&
      sourceDeviceId &&
      String(order.sourceDeviceId || "") === sourceDeviceId
    ) {
      return true;
    }
    return String(order.id || "") === String(incoming.id || "");
  });
}

export function saleMatchesPullReceipt(
  sale: Record<string, unknown>,
  incoming: Record<string, unknown>,
) {
  const sourceDeviceId = String(incoming.sourceDeviceId || "").trim();
  const localReceiptId = String(incoming.localReceiptId || incoming.id || "").trim();
  if (
    incoming.cloudReceiptId &&
    String(sale.cloudReceiptId || "") === String(incoming.cloudReceiptId)
  ) {
    return true;
  }
  if (
    localReceiptId &&
    sourceDeviceId &&
    String(sale.localReceiptId || sale.id || "") === localReceiptId &&
    String(sale.sourceDeviceId || "") === sourceDeviceId
  ) {
    return true;
  }
  return false;
}

export function orderMatchesPullPayment(
  order: Record<string, unknown>,
  payment: Record<string, unknown>,
) {
  const sourceDeviceId = String(payment.sourceDeviceId || "").trim();
  const localOrderId = String(payment.localOrderId || "").trim();
  if (!localOrderId || !sourceDeviceId) return false;
  return (
    String(order.localOrderId || "") === localOrderId &&
    String(order.sourceDeviceId || "") === sourceDeviceId
  );
}

export function saleMatchesPullPayment(
  sale: Record<string, unknown>,
  payment: Record<string, unknown>,
) {
  const sourceDeviceId = String(payment.sourceDeviceId || "").trim();
  const localReceiptId = String(payment.localReceiptId || "").trim();
  if (
    localReceiptId &&
    sourceDeviceId &&
    String(sale.localReceiptId || sale.id || "") === localReceiptId &&
    String(sale.sourceDeviceId || "") === sourceDeviceId
  ) {
    return true;
  }
  return false;
}

export function findPullShiftIndex(
  shifts: Array<Record<string, unknown>>,
  incoming: Record<string, unknown>,
) {
  const localShiftId = String(incoming.localShiftId || incoming.shiftId || "").trim();
  const sourceDeviceId = String(incoming.sourceDeviceId || "").trim();
  return shifts.findIndex((shift) => {
    if (
      localShiftId &&
      String(shift.localShiftId || shift.shiftId || "") === localShiftId &&
      sourceDeviceId &&
      String(shift.sourceDeviceId || shift.deviceId || "") === sourceDeviceId
    ) {
      return true;
    }
    return String(shift.cloudId || "") === String(incoming.cloudId || "");
  });
}

export function isProviderCloudOrder(snapshot: PosPullOrderSnapshot) {
  const platform = String(snapshot.platform || "").trim().toLowerCase();
  return Boolean(platform && platform !== "unknown");
}
