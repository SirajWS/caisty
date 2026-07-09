import { CaistyPdfDocument } from "./baseDocument";
import {
  formatDocumentMoney,
  formatDocumentTime,
  formatPaymentMethodLabel,
  formatStatusLabel,
  sanitizeFilenamePart,
} from "./formatters";
import type { OrdersDocumentInput } from "./types";

export function buildOrdersPdfFilename(generatedAt: Date, periodLabel: string): string {
  const stamp = generatedAt.toISOString().slice(0, 10);
  return `caisty-orders-${sanitizeFilenamePart(periodLabel)}-${stamp}.pdf`;
}

export function exportOrdersPdf(input: OrdersDocumentInput): void {
  const { meta, labels, sales } = input;
  const { summary, orders, receipts } = sales;
  const currency = summary.paymentSummary.currency || meta.currency;
  const { locale, timezone } = meta;
  const dash = labels.dash;
  const paymentLabels = {
    cash: labels.paymentCash,
    card: labels.paymentCard,
    voucher: labels.paymentVoucher,
    other: labels.paymentOther,
    dash,
  };

  const pdf = new CaistyPdfDocument();
  pdf.setFooterLabels({
    generatedBy: labels.generatedBy,
    website: labels.website,
  });

  pdf.drawBrandHeader(labels.brandCloud, labels.docTitle);
  pdf.drawMetaBlock(meta, labels, { includeDate: true });

  pdf.drawSectionTitle(labels.summary);
  pdf.drawKeyValueRows([
    [labels.kpiOrders, String(summary.ordersCount)],
    [labels.kpiReceipts, String(summary.receiptsCount)],
    [labels.kpiRefunds, String(summary.refundsCount)],
  ]);

  pdf.drawSectionTitle(labels.paymentSummary);
  pdf.drawKeyValueRows([
    [
      labels.paymentCash,
      formatDocumentMoney(summary.paymentSummary.cashCents, currency, locale),
    ],
    [
      labels.paymentCard,
      formatDocumentMoney(summary.paymentSummary.cardCents, currency, locale),
    ],
    [
      labels.paymentVoucher,
      formatDocumentMoney(summary.paymentSummary.voucherCents, currency, locale),
    ],
    [
      labels.paymentOther,
      formatDocumentMoney(summary.paymentSummary.otherCents, currency, locale),
    ],
  ]);

  const totalRevenueMinor =
    summary.paymentSummary.cashCents +
    summary.paymentSummary.cardCents +
    summary.paymentSummary.voucherCents +
    summary.paymentSummary.otherCents;

  pdf.drawSectionTitle(labels.totals);
  pdf.drawKeyValueRows([
    [
      labels.paymentCash,
      formatDocumentMoney(summary.paymentSummary.cashCents, currency, locale),
    ],
    [
      labels.paymentCard,
      formatDocumentMoney(summary.paymentSummary.cardCents, currency, locale),
    ],
    [
      labels.paymentVoucher,
      formatDocumentMoney(summary.paymentSummary.voucherCents, currency, locale),
    ],
    [
      labels.paymentOther,
      formatDocumentMoney(summary.paymentSummary.otherCents, currency, locale),
    ],
    [labels.colRevenue, formatDocumentMoney(totalRevenueMinor, currency, locale)],
  ]);

  pdf.drawSectionTitle(labels.allOrders);
  pdf.drawTable({
    head: [
      labels.colTime,
      labels.colOrderNumber,
      labels.colStatus,
      labels.colPayment,
      labels.colAmount,
      labels.colCashier,
      labels.colDevice,
    ],
    body: orders.map((order) => [
      formatDocumentTime(order.soldAt, locale, timezone, dash),
      order.localOrderId || dash,
      formatStatusLabel(order.status, dash),
      formatPaymentMethodLabel(order.paymentMethod, paymentLabels),
      formatDocumentMoney(order.amountCents, order.currency || currency, locale),
      order.cashier?.trim() || dash,
      order.deviceName?.trim() || dash,
    ]),
    emptyMessage: labels.ordersEmpty,
  });

  pdf.drawSectionTitle(labels.allReceipts);
  pdf.drawTable({
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
      formatStatusLabel(receipt.fiscalStatus, dash),
      formatDocumentMoney(receipt.amountCents, receipt.currency || currency, locale),
    ]),
    emptyMessage: labels.receiptsEmpty,
  });

  pdf.save(buildOrdersPdfFilename(meta.generatedAt, meta.label));
}
