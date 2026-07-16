import type { PortalOrdersResponse, PortalOrderRecord } from "../portalApi";
import {
  formatDocumentMoney,
  formatDocumentTime,
  formatPaymentMethodLabel,
  type PaymentMethodLabels,
} from "./formatters";
import type { OrdersDocumentInput, OrdersDocumentLabels } from "./types";

export type OrdersPdfKeyValue = [label: string, value: string];

export type OrdersPdfTable = {
  title: string;
  head: string[];
  body: string[][];
  emptyMessage: string;
};

export type OrdersPdfModel = {
  orderSummary: OrdersPdfKeyValue[];
  revenueSummary: OrdersPdfKeyValue[];
  posPaymentSummary: OrdersPdfKeyValue[];
  onlinePaymentSummary: OrdersPdfKeyValue[];
  onlineRevenueHint: string;
  posOrders: OrdersPdfTable;
  onlineOrders: OrdersPdfTable;
  receipts: OrdersPdfTable;
  /** True when export uses full API arrays (not client pagination). */
  exportsFullOrderLists: boolean;
};

function formatOpenShiftValue(
  summary: PortalOrdersResponse["summary"],
  labels: OrdersDocumentLabels,
): string {
  const openShift = summary.openShift;
  if (!openShift && !summary.hasOpenShift) {
    return labels.openShiftNo;
  }
  if (!openShift) {
    return labels.openShiftYes;
  }
  const parts = [
    openShift.cashier?.trim(),
    openShift.deviceName?.trim(),
  ].filter(Boolean);
  if (parts.length > 0) {
    return `${labels.openShiftYes} · ${parts.join(" · ")}`;
  }
  return `${labels.openShiftYes} · ${openShift.durationMinutes} min`;
}

function formatOrderStatus(
  order: PortalOrderRecord,
  labels: OrdersDocumentLabels,
): string {
  const key = (order.normalizedStatus ?? order.status ?? "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "_");
  const mapped = labels.statusLabels[key as keyof typeof labels.statusLabels];
  if (mapped) return mapped;
  const raw = (order.normalizedStatus ?? order.status ?? "").trim();
  if (!raw) return labels.dash;
  return raw.charAt(0).toUpperCase() + raw.slice(1);
}

function formatOrderPayment(
  order: PortalOrderRecord,
  paymentLabels: PaymentMethodLabels,
): string {
  const display = order.paymentDisplay?.trim();
  if (display) return display;
  return formatPaymentMethodLabel(order.paymentMethod, paymentLabels);
}

function truncateOrderId(value: string, max = 28): string {
  const trimmed = value.trim();
  if (trimmed.length <= max) return trimmed;
  return `${trimmed.slice(0, max - 1)}…`;
}

/**
 * Pure model builder for the Orders PDF — same source data as the portal page.
 * Does not invent revenue or payment rules; mirrors portal summary fields.
 */
export function buildOrdersPdfModel(
  input: OrdersDocumentInput,
): OrdersPdfModel {
  const { meta, labels, sales } = input;
  const { summary, orders, providerOrders, receipts } = sales;
  const currency =
    summary.paymentSummary.currency ||
    summary.onlinePaymentSummary?.currency ||
    meta.currency;
  const { locale, timezone } = meta;
  const dash = labels.dash;
  const paymentLabels: PaymentMethodLabels = {
    cash: labels.paymentCash,
    card: labels.paymentCard,
    voucher: labels.paymentVoucher,
    other: labels.paymentOther,
    dash,
  };

  const pos = summary.paymentSummary;
  const online = summary.onlinePaymentSummary;
  const posTotalCents =
    (pos?.cashCents ?? 0) +
    (pos?.cardCents ?? 0) +
    (pos?.voucherCents ?? 0) +
    (pos?.otherCents ?? 0);

  const cashPaidCents = online?.cashPaidCents ?? 0;
  const cardPaidCents = online?.cardPaidCents ?? 0;
  const onlinePaidCents = online?.onlinePaidCents ?? 0;
  const pendingCents = online?.pendingCents ?? 0;
  /** Same Paid Total as portal: cash + card + online paid (excludes pending). */
  const paidTotalCents = cashPaidCents + cardPaidCents + onlinePaidCents;

  const money = (cents: number) =>
    formatDocumentMoney(cents, currency, locale);

  return {
    exportsFullOrderLists: true,
    orderSummary: [
      [labels.kpiAllOrders, String(summary.allOrdersCount)],
      [labels.kpiPosOrders, String(summary.liveOrdersCount)],
      [labels.kpiOnlineOrders, String(summary.onlineOrdersCount)],
      [labels.kpiReceipts, String(summary.receiptsCount)],
      [labels.kpiRefunds, String(summary.refundsCount)],
      [labels.kpiOpenShift, formatOpenShiftValue(summary, labels)],
    ],
    revenueSummary: [
      [labels.kpiPosRevenue, money(summary.posRevenueCents)],
      [labels.kpiOnlineRevenue, money(summary.onlineRevenueCents)],
      [labels.kpiTotalRevenue, money(summary.revenueCents)],
    ],
    posPaymentSummary: [
      [labels.paymentCash, money(pos?.cashCents ?? 0)],
      [labels.paymentCard, money(pos?.cardCents ?? 0)],
      [labels.paymentVoucher, money(pos?.voucherCents ?? 0)],
      [labels.paymentOther, money(pos?.otherCents ?? 0)],
      [labels.paymentTotal, money(posTotalCents)],
    ],
    onlinePaymentSummary: [
      [labels.kpiOnlineRevenue, money(summary.onlineRevenueCents)],
      [labels.onlineCashPaid, money(cashPaidCents)],
      [labels.onlineCardPaid, money(cardPaidCents)],
      [labels.onlinePaidOnline, money(onlinePaidCents)],
      [labels.onlinePending, money(pendingCents)],
      [labels.onlinePaidTotal, money(paidTotalCents)],
    ],
    onlineRevenueHint: labels.onlineRevenueHint,
    posOrders: {
      title: labels.posOrdersTitle,
      head: [
        labels.colTime,
        labels.colOrderNumber,
        labels.colStatus,
        labels.colPayment,
        labels.colReceipt,
        labels.colAmount,
        labels.colCashier,
        labels.colDevice,
      ],
      body: orders.map((order) => [
        formatDocumentTime(order.soldAt, locale, timezone, dash),
        truncateOrderId(order.localOrderId || dash),
        formatOrderStatus(order, labels),
        formatOrderPayment(order, paymentLabels),
        order.receiptNumber?.trim() || dash,
        formatDocumentMoney(
          order.amountCents,
          order.currency || currency,
          locale,
        ),
        order.cashier?.trim() || dash,
        order.deviceName?.trim() || dash,
      ]),
      emptyMessage: labels.ordersEmpty,
    },
    onlineOrders: {
      title: labels.onlineOrdersTitle,
      head: [
        labels.colTime,
        labels.colOrderNumber,
        labels.colProvider,
        labels.colCustomer,
        labels.colStatus,
        labels.colPayment,
        labels.colAmount,
      ],
      body: providerOrders.map((order) => [
        formatDocumentTime(order.soldAt, locale, timezone, dash),
        truncateOrderId(order.localOrderId || dash),
        order.providerName?.trim() ||
          order.platform?.trim() ||
          labels.unknownProvider,
        order.customerName?.trim() || dash,
        formatOrderStatus(order, labels),
        formatOrderPayment(order, paymentLabels),
        formatDocumentMoney(
          order.amountCents,
          order.currency || currency,
          locale,
        ),
      ]),
      emptyMessage: labels.onlineOrdersEmpty,
    },
    receipts: {
      title: labels.allReceipts,
      head: [
        labels.colReceipt,
        labels.colTime,
        labels.colCustomer,
        labels.colPayment,
        labels.colFiscal,
        labels.colAmount,
      ],
      body: receipts.map((receipt) => [
        receipt.receiptNumber?.trim() || receipt.localReceiptId || dash,
        formatDocumentTime(receipt.issuedAt, locale, timezone, dash),
        receipt.customer?.trim() || dash,
        formatPaymentMethodLabel(receipt.paymentMethod, paymentLabels),
        (() => {
          const s = receipt.fiscalStatus.trim();
          if (!s) return dash;
          return s.charAt(0).toUpperCase() + s.slice(1);
        })(),
        formatDocumentMoney(
          receipt.amountCents,
          receipt.currency || currency,
          locale,
        ),
      ]),
      emptyMessage: labels.receiptsEmpty,
    },
  };
}
