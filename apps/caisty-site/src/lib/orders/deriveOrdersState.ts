import { formatMinorUnits } from "../money/formatMinorUnits";
import {
  deriveOnlinePaymentCards as buildOnlinePaymentCards,
  deriveOnlineRevenueHeader,
  derivePosPaymentCards as buildPosPaymentCards,
} from "../portal/derivePaymentSummaryCards";
import {
  formatPortalOrderStatus,
  formatPortalPaymentMethod,
} from "../portal/portalSalesLabels";
import type { PortalOpenShiftRecord } from "../portalApi";
import type {
  DeriveOrdersInput,
  OrdersDerivedState,
  OrdersKpi,
  PortalOrderRecord,
  PortalReceiptRecord,
  PosOrderRow,
  ProviderOrderRow,
  PaymentMethodCard,
} from "./types";

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

function formatFiscalStatus(status: string, dash: string): string {
  const s = status.trim();
  if (!s) return dash;
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function waitingKpi(id: string, label: string, hint: string, dash: string): OrdersKpi {
  return { id, label, value: dash, hint };
}

function hasSyncedSalesData(sales: NonNullable<DeriveOrdersInput["data"]["sales"]>): boolean {
  return (
    sales.summary.allOrdersCount > 0 ||
    sales.summary.receiptsCount > 0 ||
    sales.orders.length > 0 ||
    sales.providerOrders.length > 0 ||
    sales.receipts.length > 0
  );
}

function derivePosPaymentCards(input: DeriveOrdersInput): PaymentMethodCard[] {
  const o = input.t.orders;
  const dash = input.t.labels.dash;
  const sales = input.data.sales;

  return buildPosPaymentCards({
    summary: sales?.summary.paymentSummary,
    labels: {
      paymentCash: o.paymentCash,
      paymentCard: o.paymentCard,
      paymentVoucher: o.paymentVoucher,
      paymentOther: o.paymentOther,
    },
    locale: input.locale,
    dash,
    hasData: Boolean(sales && hasSyncedSalesData(sales)),
  });
}

function deriveOnlineRevenueHeaderState(input: DeriveOrdersInput) {
  const o = input.t.orders;
  const dash = input.t.labels.dash;
  const sales = input.data.sales;
  const currency =
    sales?.summary.paymentSummary.currency ||
    sales?.summary.onlinePaymentSummary?.currency ||
    "EUR";

  return deriveOnlineRevenueHeader({
    onlineRevenueCents: sales?.summary.onlineRevenueCents ?? 0,
    currency,
    labels: {
      kpiOnlineRevenue: o.kpiOnlineRevenue,
      kpiOnlineRevenueInfo: o.kpiOnlineRevenueInfo,
    },
    locale: input.locale,
    dash,
    hasData: Boolean(sales && hasSyncedSalesData(sales)),
  });
}

function deriveOnlinePaymentCards(input: DeriveOrdersInput): PaymentMethodCard[] {
  const o = input.t.orders;
  const dash = input.t.labels.dash;
  const sales = input.data.sales;

  return buildOnlinePaymentCards({
    summary: sales?.summary.onlinePaymentSummary,
    labels: {
      onlineCashPaid: o.onlineCashPaid,
      onlineCardPaid: o.onlineCardPaid,
      onlinePaidOnline: o.onlinePaidOnline,
      onlinePending: o.onlinePending,
      onlinePaidTotal: o.onlinePaidTotal,
    },
    locale: input.locale,
    dash,
    hasData: Boolean(sales && hasSyncedSalesData(sales)),
  });
}

function deriveOrderKpis(input: DeriveOrdersInput): OrdersKpi[] {
  const o = input.t.orders;
  const dash = input.t.labels.dash;
  const sales = input.data.sales;

  if (!sales || !hasSyncedSalesData(sales)) {
    const hint = o.waitingPosSyncShort;
    return [
      waitingKpi("all_orders", o.kpiAllOrders, hint, dash),
      waitingKpi("pos_orders", o.kpiPosOrders, hint, dash),
      waitingKpi("online_orders", o.kpiOnlineOrders, hint, dash),
      waitingKpi("receipts", o.kpiReceipts, hint, dash),
      waitingKpi("refunds", o.kpiRefunds, hint, dash),
      waitingKpi("open_shift", o.kpiOpenShift, hint, dash),
    ];
  }

  const { summary } = sales;
  const openShiftValue = formatOpenShiftKpi(summary.openShift, o);

  return [
    {
      id: "all_orders",
      label: o.kpiAllOrders,
      value: String(summary.allOrdersCount),
    },
    {
      id: "pos_orders",
      label: o.kpiPosOrders,
      value: String(summary.liveOrdersCount),
    },
    {
      id: "online_orders",
      label: o.kpiOnlineOrders,
      value: String(summary.onlineOrdersCount),
    },
    { id: "receipts", label: o.kpiReceipts, value: String(summary.receiptsCount) },
    { id: "refunds", label: o.kpiRefunds, value: String(summary.refundsCount) },
    { id: "open_shift", label: o.kpiOpenShift, ...openShiftValue },
  ];
}

function deriveRevenueKpis(input: DeriveOrdersInput): OrdersKpi[] {
  const o = input.t.orders;
  const dash = input.t.labels.dash;
  const sales = input.data.sales;

  if (!sales || !hasSyncedSalesData(sales)) {
    const hint = o.waitingPosSyncShort;
    return [
      waitingKpi("pos_revenue", o.kpiPosRevenue, hint, dash),
      waitingKpi("online_revenue", o.kpiOnlineRevenue, hint, dash),
      waitingKpi("total_revenue", o.kpiTotalRevenue, hint, dash),
    ];
  }

  const { summary } = sales;
  const currency = summary.paymentSummary.currency || "EUR";

  return [
    {
      id: "pos_revenue",
      label: o.kpiPosRevenue,
      value: formatMoney(summary.posRevenueCents, currency, input.locale),
    },
    {
      id: "online_revenue",
      label: o.kpiOnlineRevenue,
      value: formatMoney(summary.onlineRevenueCents, currency, input.locale),
    },
    {
      id: "total_revenue",
      label: o.kpiTotalRevenue,
      value: formatMoney(summary.revenueCents, currency, input.locale),
    },
  ];
}

function formatOpenShiftKpi(
  openShift: PortalOpenShiftRecord | null | undefined,
  o: DeriveOrdersInput["t"]["orders"],
): { value: string; hint?: string } {
  if (!openShift) {
    return { value: o.openShiftNo };
  }

  const parts = [
    openShift.cashier?.trim(),
    openShift.deviceName?.trim(),
  ].filter(Boolean);

  return {
    value: o.openShiftYes,
    hint:
      parts.length > 0
        ? parts.join(" · ")
        : `${openShift.durationMinutes} min`,
  };
}

function mapProviderOrderRow(
  order: PortalOrderRecord,
  input: DeriveOrdersInput,
): ProviderOrderRow {
  const dash = input.t.labels.dash;
  const o = input.t.orders;
  const timezone = input.data.sales?.timezone ?? "Europe/Berlin";

  return {
    id: order.id,
    time: formatTime(order.soldAt, input.locale, timezone),
    orderNumber: order.localOrderId || dash,
    provider:
      order.providerName?.trim() ||
      (order.platform?.trim() ? order.platform.trim() : o.unknownProvider),
    customer: order.customerName?.trim() || dash,
    details: order.detailsSummary?.trim() || dash,
    status: formatPortalOrderStatus(
      order.normalizedStatus ?? order.status,
      input.t,
    ),
    statusKey: order.normalizedStatus ?? order.status ?? "completed",
    payment: order.paymentDisplay || formatPortalPaymentMethod(order.paymentMethod, input.t),
    amount: formatMoney(order.amountCents, order.currency, input.locale),
    source: order,
  };
}

function mapOrderRow(
  order: PortalOrderRecord,
  input: DeriveOrdersInput,
): PosOrderRow {
  const dash = input.t.labels.dash;
  const timezone = input.data.sales?.timezone ?? "Europe/Berlin";

  return {
    id: order.id,
    time: formatTime(order.soldAt, input.locale, timezone),
    orderNumber: order.localOrderId || dash,
    status: formatPortalOrderStatus(
      order.normalizedStatus ?? order.status,
      input.t,
    ),
    statusKey: order.normalizedStatus ?? order.status ?? "completed",
    payment: order.paymentDisplay || formatPortalPaymentMethod(order.paymentMethod, input.t),
    amount: formatMoney(order.amountCents, order.currency, input.locale),
    cashier: order.cashier?.trim() || dash,
    device: order.deviceName?.trim() || dash,
    receiptId: order.receiptId,
    receiptNumber: order.receiptNumber?.trim() || dash,
    receiptStatus: order.receiptStatus,
    refundedAmountCents: order.refundedAmountCents,
    hasPaymentChange: order.hasPaymentChange,
    source: order,
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
    payment: formatPortalPaymentMethod(receipt.paymentMethod, input.t),
    fiscal: formatFiscalStatus(receipt.fiscalStatus, dash),
    amount: formatMoney(receipt.amountCents, receipt.currency, input.locale),
    items: mapReceiptLineItems(receipt, input),
    source: receipt,
  };
}

function hasSalesData(
  orders: OrdersDerivedState["orders"],
  providerOrders: OrdersDerivedState["providerOrders"],
  receipts: OrdersDerivedState["receipts"],
): boolean {
  return orders.length > 0 || providerOrders.length > 0 || receipts.length > 0;
}

export function deriveOrdersState(input: DeriveOrdersInput): OrdersDerivedState {
  const sales = input.data.sales;
  const orders = sales?.orders.map((order) => mapOrderRow(order, input)) ?? [];
  const providerOrders =
    sales?.providerOrders.map((order) => mapProviderOrderRow(order, input)) ?? [];
  const receipts =
    sales?.receipts.map((receipt) => mapReceiptRow(receipt, input)) ?? [];

  return {
    orderKpis: deriveOrderKpis(input),
    revenueKpis: deriveRevenueKpis(input),
    posPaymentCards: derivePosPaymentCards(input),
    onlinePaymentCards: deriveOnlinePaymentCards(input),
    onlineRevenueHeader: deriveOnlineRevenueHeaderState(input),
    orders,
    providerOrders,
    receipts,
    hasSalesData: hasSalesData(orders, providerOrders, receipts),
  };
}
