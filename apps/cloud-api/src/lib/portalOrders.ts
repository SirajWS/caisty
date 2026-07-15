/** POS portal orders helpers (timezone day window + payment buckets). */

import { sql } from "drizzle-orm";

export const PORTAL_ORDERS_TIMEZONE = "Europe/Berlin";

export type PaymentBucket = "cash" | "card" | "voucher" | "other";

export type PaymentSummaryCents = {
  cashCents: number;
  cardCents: number;
  voucherCents: number;
  otherCents: number;
};

/** PostgreSQL filter: timestamp column falls on today in Europe/Berlin. */
export function sqlIsTodayBerlin(column: unknown) {
  const tz = PORTAL_ORDERS_TIMEZONE;
  return sql`(${column} AT TIME ZONE ${tz})::date = (NOW() AT TIME ZONE ${tz})::date`;
}

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

export type OrderPaymentRow = {
  method: string;
  amountCents: number;
  paidAt?: Date | string | null;
  updatedAt?: Date | string | null;
  localOrderId?: string | null;
  localReceiptId?: string | null;
  deviceId?: string | null;
  localPaymentId?: string | null;
};

function parsePaymentTimestamp(value: Date | string | null | undefined): number {
  if (!value) return 0;
  const ts = value instanceof Date ? value.getTime() : new Date(value).getTime();
  return Number.isFinite(ts) ? ts : 0;
}

/** Newest payment row first (paidAt, then updatedAt). */
export function comparePaymentRowsByRecency(
  a: OrderPaymentRow,
  b: OrderPaymentRow,
): number {
  const paidDiff = parsePaymentTimestamp(b.paidAt) - parsePaymentTimestamp(a.paidAt);
  if (paidDiff !== 0) return paidDiff;
  return parsePaymentTimestamp(b.updatedAt) - parsePaymentTimestamp(a.updatedAt);
}

export function pickPrimaryPaymentRow(
  rows: OrderPaymentRow[],
): OrderPaymentRow | null {
  if (!rows.length) return null;
  return [...rows].sort(comparePaymentRowsByRecency)[0] ?? null;
}

export function orderPaymentGroupKey(row: OrderPaymentRow): string | null {
  if (!row.localOrderId?.trim()) return null;
  const device = row.deviceId?.trim() ?? "";
  return `${device}:${row.localOrderId.trim()}`;
}

/** Same order + same amount on multiple rows = manual method change, not split tender. */
export function isLikelyMethodChangeGroup(rows: OrderPaymentRow[]): boolean {
  if (rows.length <= 1) return true;
  const amounts = new Set(rows.map((row) => row.amountCents));
  return amounts.size === 1;
}

/** One effective payment per method-change group; all rows kept for split payments. */
export function effectivePaymentsForSummary(
  payments: OrderPaymentRow[],
): Array<{ method: string; amountCents: number }> {
  const standalone: OrderPaymentRow[] = [];
  const byOrder = new Map<string, OrderPaymentRow[]>();

  for (const row of payments) {
    const key = orderPaymentGroupKey(row);
    if (!key) {
      standalone.push(row);
      continue;
    }
    const list = byOrder.get(key) ?? [];
    list.push(row);
    byOrder.set(key, list);
  }

  const effective: OrderPaymentRow[] = [...standalone];
  for (const group of byOrder.values()) {
    if (isLikelyMethodChangeGroup(group)) {
      const primary = pickPrimaryPaymentRow(group);
      if (primary) effective.push(primary);
    } else {
      effective.push(...group);
    }
  }

  return effective.map((row) => ({
    method: row.method,
    amountCents: row.amountCents,
  }));
}

export function aggregateEffectivePaymentSummary(
  payments: OrderPaymentRow[],
): PaymentSummaryCents {
  return aggregatePaymentSummary(effectivePaymentsForSummary(payments));
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
  methods: string[] | OrderPaymentRow[],
): string | null {
  if (!methods.length) return null;
  if (typeof methods[0] === "string") {
    return (methods as string[])[0]?.trim() || null;
  }
  return pickPrimaryPaymentRow(methods as OrderPaymentRow[])?.method?.trim() || null;
}

export function appendOrderPaymentRow(
  map: Map<string, OrderPaymentRow[]>,
  key: string,
  row: OrderPaymentRow,
): void {
  const list = map.get(key) ?? [];
  list.push(row);
  map.set(key, list);
}

export type PortalReceiptLineItem = {
  productName: string | null;
  sku: string | null;
  quantity: number;
  unitPriceCents: number;
  lineTotalCents: number;
};

export type OrderLineLookupRow = PortalReceiptLineItem & {
  deviceId: string;
  localOrderId: string;
  lineIndex: number;
};

/** Join key: receipt.deviceId + receipt.localOrderId → pos_orders → pos_order_lines */
export function orderLinesLookupKey(
  deviceId: string,
  localOrderId: string,
): string {
  return `${deviceId}:${localOrderId}`;
}

export function groupOrderLinesByDeviceLocalId(
  lines: OrderLineLookupRow[],
): Map<string, PortalReceiptLineItem[]> {
  const map = new Map<string, PortalReceiptLineItem[]>();
  for (const line of lines) {
    const key = orderLinesLookupKey(line.deviceId, line.localOrderId);
    const list = map.get(key) ?? [];
    list.push({
      productName: line.productName,
      sku: line.sku,
      quantity: line.quantity,
      unitPriceCents: line.unitPriceCents,
      lineTotalCents: line.lineTotalCents,
    });
    map.set(key, list);
  }
  return map;
}

export function resolveReceiptLineItems(
  linesByKey: Map<string, PortalReceiptLineItem[]>,
  deviceId: string,
  localOrderId: string | null | undefined,
): PortalReceiptLineItem[] {
  if (!localOrderId) return [];
  return linesByKey.get(orderLinesLookupKey(deviceId, localOrderId)) ?? [];
}
