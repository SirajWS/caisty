import type { PortalOrderDetailResponse } from "../portalApi";
import {
  formatDocumentDateTime,
  formatDocumentMoney,
  formatDocumentTime,
  formatPaymentMethodLabel,
  type PaymentMethodLabels,
} from "./formatters";
import type { DocumentMeta } from "./types";

export type OrderDetailDocumentLabels = {
  brandCloud: string;
  docTitle: string;
  generatedBy: string;
  website: string;
  business: string;
  store: string;
  period: string;
  date: string;
  generatedAt: string;
  timezone: string;
  currency: string;
  orderNumber: string;
  status: string;
  payment: string;
  orderSource: string;
  provider: string;
  platform: string;
  receipt: string;
  cashier: string;
  device: string;
  businessDate: string;
  customer: string;
  phone: string;
  sectionOverview: string;
  sectionCustomer: string;
  sectionProducts: string;
  sectionTotals: string;
  sectionPayment: string;
  sectionActivity: string;
  productsEmpty: string;
  activityEmpty: string;
  discounts: string;
  net: string;
  tax: string;
  gross: string;
  colProduct: string;
  colQuantity: string;
  colUnitPrice: string;
  colLineTotal: string;
  colAmount: string;
  paymentCash: string;
  paymentCard: string;
  paymentVoucher: string;
  paymentOther: string;
  dash: string;
  sourceOrder: string;
  sourceReceipt: string;
  statusLabels: Record<string, string>;
};

export type OrderDetailPdfModel = {
  overview: Array<[string, string]>;
  customer: Array<[string, string]>;
  amount: string;
  status: string;
  payment: string;
  products: { head: string[]; body: string[][]; empty: string };
  totals: Array<[string, string]>;
  payments: Array<[string, string]>;
  activity: Array<[string, string]>;
};

function formatStatus(
  order: PortalOrderDetailResponse,
  labels: OrderDetailDocumentLabels,
): string {
  const key = (order.normalizedStatus ?? order.status ?? "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "_");
  return labels.statusLabels[key] ?? (order.statusLabel || labels.dash);
}

export function buildOrderDetailPdfModel(input: {
  meta: DocumentMeta;
  labels: OrderDetailDocumentLabels;
  order: PortalOrderDetailResponse;
}): OrderDetailPdfModel {
  const { meta, labels, order } = input;
  const currency = order.currency || meta.currency;
  const { locale, timezone } = meta;
  const dash = labels.dash;
  const money = (cents: number) =>
    formatDocumentMoney(cents, currency, locale);
  const paymentLabels: PaymentMethodLabels = {
    cash: labels.paymentCash,
    card: labels.paymentCard,
    voucher: labels.paymentVoucher,
    other: labels.paymentOther,
    dash,
  };

  const paymentDisplay =
    order.paymentDisplay?.trim() ||
    formatPaymentMethodLabel(order.paymentMethod, paymentLabels);

  const status = formatStatus(order, labels);
  const soldAt = order.soldAt
    ? formatDocumentDateTime(new Date(order.soldAt), locale, timezone)
    : dash;

  const overview: Array<[string, string]> = [
    [labels.orderNumber, order.localOrderId || dash],
    [labels.status, status],
    [labels.payment, paymentDisplay],
    [labels.gross, money(order.amountCents)],
    [labels.date, soldAt],
    [labels.businessDate, order.businessDate ?? dash],
    [labels.orderSource, order.orderSource || dash],
    [
      order.isProviderOrder ? labels.provider : labels.device,
      order.isProviderOrder
        ? order.providerName?.trim() || order.platform?.trim() || dash
        : order.deviceName?.trim() || dash,
    ],
    [labels.cashier, order.cashier?.trim() || dash],
    [labels.receipt, order.receiptNumber?.trim() || dash],
  ];

  const customer: Array<[string, string]> = [];
  if (order.isProviderOrder || order.customerName?.trim()) {
    if (order.providerName?.trim()) {
      customer.push([labels.provider, order.providerName.trim()]);
    }
    if (order.platform?.trim()) {
      customer.push([labels.platform, order.platform.trim()]);
    }
    if (order.customerName?.trim()) {
      customer.push([labels.customer, order.customerName.trim()]);
    }
    if (order.customerPhone?.trim()) {
      customer.push([labels.phone, order.customerPhone.trim()]);
    }
    customer.push([labels.orderSource, order.orderSource || dash]);
  }

  const activity: Array<[string, string]> = [];
  for (const event of order.timeline ?? []) {
    activity.push([
      formatDocumentTime(event.occurredAt, locale, timezone, dash),
      `${event.label}${event.summary ? ` — ${event.summary}` : ""}`,
    ]);
  }
  for (const event of order.receiptTimeline ?? []) {
    activity.push([
      formatDocumentTime(event.occurredAt, locale, timezone, dash),
      `${event.label}${event.summary ? ` — ${event.summary}` : ""}`,
    ]);
  }
  activity.sort((a, b) => a[0].localeCompare(b[0]));

  return {
    amount: money(order.amountCents),
    status,
    payment: paymentDisplay,
    overview,
    customer,
    products: {
      head: [
        labels.colProduct,
        labels.colQuantity,
        labels.colUnitPrice,
        labels.colLineTotal,
      ],
      body: (order.lines ?? []).map((line) => [
        line.productName?.trim() || line.sku?.trim() || dash,
        String(line.quantity),
        money(line.unitPriceCents),
        money(line.lineTotalCents),
      ]),
      empty: labels.productsEmpty,
    },
    totals: [
      [labels.discounts, money(order.discountCents ?? 0)],
      [labels.net, money(order.netCents ?? order.amountCents)],
      [labels.tax, money(order.taxCents ?? 0)],
      [labels.gross, money(order.amountCents)],
    ],
    payments: (order.payments ?? []).map((payment) => [
      formatPaymentMethodLabel(payment.method, paymentLabels),
      money(payment.amountCents),
    ]),
    activity,
  };
}
