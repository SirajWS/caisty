const KNOWN_PAYMENT_METHODS = new Set(["cash", "card", "provider", "online"]);

/** Merge payment status on POS order sync — paid beats stale pending. */
export function mergePaymentStatusForSync(
  existing: string | null | undefined,
  incoming: string | null | undefined,
): string | null {
  const current = (existing ?? "").trim().toLowerCase();
  const next = (incoming ?? "").trim().toLowerCase();

  if (current === "paid") return "paid";
  if (next === "paid") return "paid";
  if (next === "pending") return "pending";
  if (current === "pending") return "pending";
  return next || current || null;
}

export function mergePaymentMethodForSync(
  existing: string | null | undefined,
  incoming: string | null | undefined,
): string {
  const current = normalizePaymentMethodValue(existing);
  const next = normalizePaymentMethodValue(incoming);

  if (current && KNOWN_PAYMENT_METHODS.has(current)) {
    if (next && KNOWN_PAYMENT_METHODS.has(next)) return next;
    return current;
  }
  if (next && KNOWN_PAYMENT_METHODS.has(next)) return next;
  return next ?? current ?? "unknown";
}

function normalizePaymentMethodValue(
  value: string | null | undefined,
): string | null {
  const raw = (value ?? "").trim().toLowerCase();
  if (!raw || raw === "unknown") return null;
  return raw;
}
