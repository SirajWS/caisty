import type { PortalReceiptDetailResponse } from "../portalApi";
import {
  formatDocumentDateTime,
  formatDocumentMoney,
  formatDocumentTime,
  formatPaymentMethodLabel,
  formatStatusLabel,
  type PaymentMethodLabels,
} from "./formatters";
import type { DocumentMeta } from "./types";

export type ReceiptDetailDocumentLabels = {
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
  receiptDetails: string;
  colReceipt: string;
  colTime: string;
  colCustomer: string;
  colPayment: string;
  colFiscal: string;
  colAmount: string;
  colDevice: string;
  colCashier: string;
  colStatus: string;
  colProduct: string;
  colQuantity: string;
  colUnitPrice: string;
  colLineTotal: string;
  itemsTitle: string;
  itemsEmpty: string;
  totalsTitle: string;
  discounts: string;
  netTotal: string;
  taxTotal: string;
  grossTotal: string;
  sectionPayment: string;
  sectionFiscal: string;
  sectionPrintStats: string;
  sectionActivity: string;
  fiscalPendingNote: string;
  originalPrint: string;
  reprintCount: string;
  lastPrintTime: string;
  activityEmpty: string;
  paymentCash: string;
  paymentCard: string;
  paymentVoucher: string;
  paymentOther: string;
  yes: string;
  no: string;
  dash: string;
  statusActive: string;
  statusRefunded: string;
  statusPartialRefund: string;
  statusVoided: string;
};

export type ReceiptDetailPdfModel = {
  summary: Array<[string, string]>;
  products: { head: string[]; body: string[][]; empty: string };
  totals: Array<[string, string]>;
  payment: Array<[string, string]>;
  fiscal: Array<[string, string]>;
  printStats: Array<[string, string]>;
  activity: Array<[string, string]>;
  showFiscalPending: boolean;
  receiptLabel: string;
};

function receiptStatusLabel(
  status: string,
  labels: ReceiptDetailDocumentLabels,
): string {
  switch (status) {
    case "active":
      return labels.statusActive;
    case "refunded":
      return labels.statusRefunded;
    case "partial_refund":
      return labels.statusPartialRefund;
    case "voided":
      return labels.statusVoided;
    default:
      return status || labels.dash;
  }
}

export function buildReceiptDetailPdfModel(input: {
  meta: DocumentMeta;
  labels: ReceiptDetailDocumentLabels;
  detail: PortalReceiptDetailResponse;
}): ReceiptDetailPdfModel {
  const { meta, labels, detail } = input;
  const receipt = detail.receipt;
  const currency = receipt.currency || meta.currency;
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

  const receiptLabel =
    receipt.receiptNumber?.trim() || receipt.localReceiptId || dash;
  const paymentMethod = formatPaymentMethodLabel(
    receipt.paymentMethod,
    paymentLabels,
  );
  const fiscalStatus = formatStatusLabel(receipt.fiscalStatus, dash);
  const showFiscalPending =
    receipt.fiscalStatus.trim().toLowerCase() === "pending";

  const activity = (detail.timeline ?? [])
    .slice()
    .sort(
      (a, b) =>
        new Date(a.occurredAt).getTime() - new Date(b.occurredAt).getTime(),
    )
    .map((event) => [
      formatDocumentTime(event.occurredAt, locale, timezone, dash),
      `${event.label}${event.summary ? ` — ${event.summary}` : ""}`,
    ] as [string, string]);

  return {
    receiptLabel,
    showFiscalPending,
    summary: [
      [labels.colReceipt, receiptLabel],
      [labels.colStatus, receiptStatusLabel(receipt.status, labels)],
      [labels.colPayment, paymentMethod],
      [labels.colFiscal, fiscalStatus],
      [labels.colAmount, money(receipt.grossCents)],
      [
        labels.colTime,
        receipt.issuedAt
          ? formatDocumentDateTime(new Date(receipt.issuedAt), locale, timezone)
          : dash,
      ],
      [labels.colCashier, dash],
      [labels.colDevice, receipt.deviceName?.trim() || dash],
      [labels.colCustomer, receipt.customer?.trim() || dash],
    ],
    products: {
      head: [
        labels.colProduct,
        labels.colQuantity,
        labels.colUnitPrice,
        labels.colLineTotal,
      ],
      body: (receipt.items ?? []).map((line) => [
        line.productName?.trim() || line.sku?.trim() || dash,
        String(line.quantity),
        line.unitPriceCents != null
          ? money(line.unitPriceCents)
          : dash,
        money(line.lineTotalCents),
      ]),
      empty: labels.itemsEmpty,
    },
    totals: [
      [labels.discounts, money(0)],
      [labels.netTotal, money(receipt.netCents)],
      [labels.taxTotal, money(receipt.taxCents)],
      [labels.grossTotal, money(receipt.grossCents)],
    ],
    payment: [
      [labels.colPayment, paymentMethod],
      [labels.colAmount, money(receipt.grossCents)],
      [labels.colStatus, receiptStatusLabel(receipt.status, labels)],
    ],
    fiscal: [[labels.colFiscal, fiscalStatus]],
    printStats: [
      [
        labels.originalPrint,
        detail.printStats.hasOriginalPrint ? labels.yes : labels.no,
      ],
      [labels.reprintCount, String(detail.printStats.reprintCount)],
      [
        labels.lastPrintTime,
        detail.printStats.lastPrintAt
          ? formatDocumentDateTime(
              new Date(detail.printStats.lastPrintAt),
              locale,
              timezone,
            )
          : dash,
      ],
    ],
    activity,
  };
}
