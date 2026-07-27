/**
 * Local POS IDs are unique only within a device (and org), never org-wide.
 * Always pair deviceId + localId when resolving cross-entity references.
 */
export function deviceLocalKey(deviceId: string, localId: string): string {
  return `${deviceId}|${localId}`;
}

export type PullPaymentRefCandidate = {
  id: string;
  deviceId: string;
  method: string;
  localPaymentId: string;
  localOrderId: string | null;
  localReceiptId: string | null;
  paidAt: Date | null;
  updatedAt: Date;
};

/**
 * Deterministic ranking for best-effort paymentMethod / localPaymentId.
 * Winner = latest by paidAt ASC overwrite, then updatedAt, then id.
 * Null paidAt sorts before any concrete paidAt (treated as earliest).
 * No payment status is inferred — table has none.
 */
export function comparePaymentRefCandidates(
  a: PullPaymentRefCandidate,
  b: PullPaymentRefCandidate,
): number {
  const aPaid = a.paidAt?.getTime() ?? Number.NEGATIVE_INFINITY;
  const bPaid = b.paidAt?.getTime() ?? Number.NEGATIVE_INFINITY;
  if (aPaid !== bPaid) {
    return aPaid - bPaid;
  }
  const aUpdated = a.updatedAt.getTime();
  const bUpdated = b.updatedAt.getTime();
  if (aUpdated !== bUpdated) {
    return aUpdated - bUpdated;
  }
  return a.id.localeCompare(b.id);
}

/**
 * Build map: deviceLocalKey(deviceId, localOrderId) → latest payment method.
 */
export function latestPaymentMethodByDeviceOrder(
  payments: PullPaymentRefCandidate[],
): Map<string, string> {
  const sorted = [...payments].sort(comparePaymentRefCandidates);
  const map = new Map<string, string>();
  for (const payment of sorted) {
    if (!payment.localOrderId) {
      continue;
    }
    map.set(deviceLocalKey(payment.deviceId, payment.localOrderId), payment.method);
  }
  return map;
}

/**
 * Build map: deviceLocalKey(deviceId, localReceiptId) → latest localPaymentId.
 */
export function latestLocalPaymentIdByDeviceReceipt(
  payments: PullPaymentRefCandidate[],
): Map<string, string> {
  const sorted = [...payments].sort(comparePaymentRefCandidates);
  const map = new Map<string, string>();
  for (const payment of sorted) {
    if (!payment.localReceiptId) {
      continue;
    }
    map.set(
      deviceLocalKey(payment.deviceId, payment.localReceiptId),
      payment.localPaymentId,
    );
  }
  return map;
}
