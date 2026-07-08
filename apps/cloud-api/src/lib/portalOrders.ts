/** POS portal orders helpers (timezone day window + payment buckets). */

export const PORTAL_ORDERS_TIMEZONE = "Europe/Berlin";

export type PaymentBucket = "cash" | "card" | "voucher" | "other";

export type PaymentSummaryCents = {
  cashCents: number;
  cardCents: number;
  voucherCents: number;
  otherCents: number;
};

export function bucketPaymentMethod(method: string): PaymentBucket {
  const m = method.trim().toLowerCase();
  if (!m) return "other";
  if (m === "cash" || m.includes("cash")) return "cash";
  if (
    m === "voucher" ||
    m === "gift" ||
    m.includes("voucher") ||
    m.includes("gift")
  ) {
    return "voucher";
  }
  if (
    m === "card" ||
    m === "credit" ||
    m === "debit" ||
    m.includes("card") ||
    m.includes("credit") ||
    m.includes("debit") ||
    m === "ec" ||
    m === "girocard"
  ) {
    return "card";
  }
  return "other";
}

export function emptyPaymentSummary(): PaymentSummaryCents {
  return {
    cashCents: 0,
    cardCents: 0,
    voucherCents: 0,
    otherCents: 0,
  };
}

export function aggregatePaymentSummary(
  payments: Array<{ method: string; amountCents: number }>,
): PaymentSummaryCents {
  const summary = emptyPaymentSummary();
  for (const payment of payments) {
    const bucket = bucketPaymentMethod(payment.method);
    const key = `${bucket}Cents` as keyof PaymentSummaryCents;
    summary[key] += payment.amountCents;
  }
  return summary;
}

export function pickPrimaryPaymentMethod(
  methods: string[],
): string | null {
  if (!methods.length) return null;
  return methods[0]?.trim() || null;
}
