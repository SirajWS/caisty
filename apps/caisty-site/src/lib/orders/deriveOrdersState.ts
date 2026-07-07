import type {
  DeriveOrdersInput,
  OrdersDerivedState,
  OrdersKpi,
  PaymentMethodCard,
} from "./types";

function waitingKpi(id: string, label: string, hint: string, dash: string): OrdersKpi {
  return { id, label, value: dash, hint };
}

function deriveSummary(input: DeriveOrdersInput): OrdersKpi[] {
  const o = input.t.orders;
  const dash = input.t.labels.dash;
  const hint = o.waitingPosSyncShort;

  return [
    waitingKpi("orders", o.kpiOrders, hint, dash),
    waitingKpi("receipts", o.kpiReceipts, hint, dash),
    waitingKpi("refunds", o.kpiRefunds, hint, dash),
    waitingKpi("open_shift", o.kpiOpenShift, hint, dash),
  ];
}

function derivePayments(input: DeriveOrdersInput): PaymentMethodCard[] {
  const o = input.t.orders;
  const dash = input.t.labels.dash;

  return [
    { id: "cash", label: o.paymentCash, value: dash, tone: "unknown" },
    { id: "card", label: o.paymentCard, value: dash, tone: "unknown" },
    { id: "voucher", label: o.paymentVoucher, value: dash, tone: "unknown" },
    { id: "other", label: o.paymentOther, value: dash, tone: "unknown" },
  ];
}

function hasSalesData(orders: OrdersDerivedState["orders"], receipts: OrdersDerivedState["receipts"]): boolean {
  return orders.length > 0 || receipts.length > 0;
}

export function deriveOrdersState(input: DeriveOrdersInput): OrdersDerivedState {
  const orders: OrdersDerivedState["orders"] = [];
  const receipts: OrdersDerivedState["receipts"] = [];

  return {
    summary: deriveSummary(input),
    orders,
    receipts,
    payments: derivePayments(input),
    hasSalesData: hasSalesData(orders, receipts),
  };
}
