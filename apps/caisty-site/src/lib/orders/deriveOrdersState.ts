import { formatMinorUnits } from "../money/formatMinorUnits";
import type {
  DeriveOrdersInput,
  OrdersDerivedState,
  OrdersKpi,
  PaymentMethodCard,
  PortalOrderRecord,
  PortalReceiptRecord,
} from "./types";

// POS Sales amounts are ISO 4217 minor units (Cent for EUR, Millime for TND).
function formatMoney(minor: number, currency: string, locale: string): string {
  return formatMinorUnits(minor, currency, locale);
}

function formatTime(iso: string | null, locale: string, timezone: string): string {
  if (!iso) return "—";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleTimeString(locale, {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: timezone,
  });
}

function formatPaymentLabel(
  method: string | null | undefined,
  t: DeriveOrdersInput["t"],
): string {
  if (!method?.trim()) return "—";
  const m = method.trim().toLowerCase();
  if (m === "cash" || m.includes("cash")) return t.orders.paymentCash;
  if (
    m === "card" ||
    m.includes("card") ||
    m === "credit" ||
    m === "debit"
  ) {
    return t.orders.paymentCard;
  }
  if (m === "voucher" || m.includes("voucher") || m.includes("gift")) {
    return t.orders.paymentVoucher;
  }
  return t.orders.paymentOther;
}

function formatStatus(status: string, dash: string): string {
  const s = status.trim();
  if (!s) return dash;
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function formatFiscalStatus(status: string, dash: string): string {
  const s = status.trim();
  if (!s) return dash;
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function waitingKpi(id: string, label: string, hint: string, dash: string): OrdersKpi {
  return { id, label, value: dash, hint };
}

function deriveSummary(input: DeriveOrdersInput): OrdersKpi[] {
  const o = input.t.orders;
  const dash = input.t.labels.dash;
  const sales = input.data.sales;

  if (!sales || (sales.orders.length === 0 && sales.receipts.length === 0)) {
    const hint = o.waitingPosSyncShort;
    return [
      waitingKpi("orders", o.kpiOrders, hint, dash),
      waitingKpi("receipts", o.kpiReceipts, hint, dash),
      waitingKpi("refunds", o.kpiRefunds, hint, dash),
      waitingKpi("open_shift", o.kpiOpenShift, hint, dash),
    ];
  }

  const { summary } = sales;
  const openShiftValue =
    summary.openShift === true
      ? "Yes"
      : summary.openShift === false
        ? "No"
        : dash;

  return [
    { id: "orders", label: o.kpiOrders, value: String(summary.ordersCount) },
    { id: "receipts", label: o.kpiReceipts, value: String(summary.receiptsCount) },
    { id: "refunds", label: o.kpiRefunds, value: String(summary.refundsCount) },
    { id: "open_shift", label: o.kpiOpenShift, value: openShiftValue },
  ];
}

function derivePayments(input: DeriveOrdersInput): PaymentMethodCard[] {
  const o = input.t.orders;
  const dash = input.t.labels.dash;
  const sales = input.data.sales;

  if (!sales || (sales.orders.length === 0 && sales.receipts.length === 0)) {
    return [
      { id: "cash", label: o.paymentCash, value: dash, tone: "unknown" },
      { id: "card", label: o.paymentCard, value: dash, tone: "unknown" },
      { id: "voucher", label: o.paymentVoucher, value: dash, tone: "unknown" },
      { id: "other", label: o.paymentOther, value: dash, tone: "unknown" },
    ];
  }

  const { paymentSummary } = sales.summary;
  const currency = paymentSummary.currency || "EUR";

  const card = (
    id: PaymentMethodCard["id"],
    label: string,
    cents: number,
  ): PaymentMethodCard => ({
    id,
    label,
    value: formatMoney(cents, currency, input.locale),
    tone: cents > 0 ? "ok" : "unknown",
  });

  return [
    card("cash", o.paymentCash, paymentSummary.cashCents),
    card("card", o.paymentCard, paymentSummary.cardCents),
    card("voucher", o.paymentVoucher, paymentSummary.voucherCents),
    card("other", o.paymentOther, paymentSummary.otherCents),
  ];
}

function mapOrderRow(
  order: PortalOrderRecord,
  input: DeriveOrdersInput,
): OrdersDerivedState["orders"][number] {
  const dash = input.t.labels.dash;
  const timezone = input.data.sales?.timezone ?? "Europe/Berlin";

  return {
    id: order.id,
    time: formatTime(order.soldAt, input.locale, timezone),
    orderNumber: order.localOrderId || dash,
    status: formatStatus(order.status, dash),
    payment: formatPaymentLabel(order.paymentMethod, input.t),
    amount: formatMoney(order.amountCents, order.currency, input.locale),
    cashier: order.cashier?.trim() || dash,
    device: order.deviceName?.trim() || dash,
  };
}

function mapReceiptLineItems(
  receipt: PortalReceiptRecord,
  input: DeriveOrdersInput,
): OrdersDerivedState["receipts"][number]["items"] {
  const dash = input.t.labels.dash;
  return (receipt.items ?? []).map((line) => ({
    product:
      line.productName?.trim() || line.sku?.trim() || dash,
    quantity: String(line.quantity),
    unitPrice:
      line.unitPriceCents != null
        ? formatMoney(line.unitPriceCents, receipt.currency, input.locale)
        : dash,
    total: formatMoney(line.lineTotalCents, receipt.currency, input.locale),
  }));
}

function mapReceiptRow(
  receipt: PortalReceiptRecord,
  input: DeriveOrdersInput,
): OrdersDerivedState["receipts"][number] {
  const dash = input.t.labels.dash;
  const timezone = input.data.sales?.timezone ?? "Europe/Berlin";

  return {
    id: receipt.id,
    receiptNumber:
      receipt.receiptNumber?.trim() || receipt.localReceiptId || dash,
    time: formatTime(receipt.issuedAt, input.locale, timezone),
    customer: receipt.customer?.trim() || dash,
    payment: formatPaymentLabel(receipt.paymentMethod, input.t),
    fiscal: formatFiscalStatus(receipt.fiscalStatus, dash),
    amount: formatMoney(receipt.amountCents, receipt.currency, input.locale),
    items: mapReceiptLineItems(receipt, input),
    source: receipt,
  };
}

function hasSalesData(
  orders: OrdersDerivedState["orders"],
  receipts: OrdersDerivedState["receipts"],
): boolean {
  return orders.length > 0 || receipts.length > 0;
}

export function deriveOrdersState(input: DeriveOrdersInput): OrdersDerivedState {
  const sales = input.data.sales;
  const orders = sales?.orders.map((order) => mapOrderRow(order, input)) ?? [];
  const receipts =
    sales?.receipts.map((receipt) => mapReceiptRow(receipt, input)) ?? [];

  return {
    summary: deriveSummary(input),
    orders,
    receipts,
    payments: derivePayments(input),
    hasSalesData: hasSalesData(orders, receipts),
  };
}
