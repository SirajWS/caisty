import type { PortalReceiptsResponse } from "../portalApi";
import {
  formatDocumentDateTime,
  formatDocumentMoney,
  formatDocumentTime,
  formatPaymentMethodLabel,
  formatStatusLabel,
  type PaymentMethodLabels,
} from "./formatters";
import type { DocumentMeta } from "./types";

export type ReceiptsListDocumentLabels = {
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
  receiptSummary: string;
  paymentSummary: string;
  paymentTotal: string;
  kpiPosRevenue: string;
  kpiReceipts: string;
  kpiActiveReceipts: string;
  kpiPrinted: string;
  kpiReprinted: string;
  kpiRefunds: string;
  paymentCash: string;
  paymentCard: string;
  paymentVoucher: string;
  paymentOther: string;
  tableTitle: string;
  tableEmpty: string;
  colReceiptNumber: string;
  colDate: string;
  colTime: string;
  colCashier: string;
  colPayment: string;
  colAmount: string;
  colStatus: string;
  colFiscal: string;
  colPrintCount: string;
  colLastEvent: string;
  statusActive: string;
  statusRefunded: string;
  statusPartialRefund: string;
  statusVoided: string;
  dash: string;
};

export type ReceiptsListPdfModel = {
  summary: Array<[string, string]>;
  payments: Array<[string, string]>;
  table: {
    title: string;
    head: string[];
    body: string[][];
    empty: string;
  };
  exportsFullList: boolean;
};

function statusLabel(
  status: string,
  labels: ReceiptsListDocumentLabels,
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

export function buildReceiptsListPdfModel(input: {
  meta: DocumentMeta;
  labels: ReceiptsListDocumentLabels;
  page: PortalReceiptsResponse;
}): ReceiptsListPdfModel {
  const { meta, labels, page } = input;
  const { summary } = page;
  const currency = summary.paymentSummary.currency || meta.currency;
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

  const pos = summary.paymentSummary;
  const paymentTotal =
    (pos.cashCents ?? 0) +
    (pos.cardCents ?? 0) +
    (pos.voucherCents ?? 0) +
    (pos.otherCents ?? 0);

  return {
    exportsFullList: true,
    summary: [
      [labels.kpiPosRevenue, money(summary.posRevenueCents)],
      [labels.kpiReceipts, String(summary.receiptsCount)],
      [labels.kpiActiveReceipts, String(summary.activeCount)],
      [labels.kpiPrinted, String(summary.printedCount)],
      [labels.kpiReprinted, String(summary.reprintedCount)],
      [labels.kpiRefunds, String(summary.refundsCount)],
    ],
    payments: [
      [labels.paymentCash, money(pos.cashCents)],
      [labels.paymentCard, money(pos.cardCents)],
      [labels.paymentVoucher, money(pos.voucherCents)],
      [labels.paymentOther, money(pos.otherCents)],
      [labels.paymentTotal, money(paymentTotal)],
    ],
    table: {
      title: labels.tableTitle,
      head: [
        labels.colReceiptNumber,
        labels.colDate,
        labels.colTime,
        labels.colCashier,
        labels.colPayment,
        labels.colAmount,
        labels.colStatus,
        labels.colFiscal,
        labels.colPrintCount,
        labels.colLastEvent,
      ],
      body: page.receipts.map((receipt) => {
        const issued = receipt.issuedAt;
        return [
          receipt.receiptNumber?.trim() || receipt.localReceiptId || dash,
          issued
            ? formatDocumentDateTime(new Date(issued), locale, timezone)
                .split(",")[0]
                ?.trim() || dash
            : dash,
          formatDocumentTime(issued, locale, timezone, dash),
          receipt.cashier?.trim() || dash,
          formatPaymentMethodLabel(receipt.paymentMethod, paymentLabels),
          money(receipt.amountCents),
          statusLabel(receipt.status, labels),
          formatStatusLabel(receipt.fiscalStatus, dash),
          String(receipt.printCount ?? 0),
          receipt.lastEventType?.trim() || dash,
        ];
      }),
      empty: labels.tableEmpty,
    },
  };
}
