import { CaistyPdfDocument } from "./baseDocument";
import {
  formatDocumentDateTime,
  formatDocumentMoney,
  formatPaymentMethodLabel,
  formatStatusLabel,
  sanitizeFilenamePart,
} from "./formatters";
import type { ReceiptDocumentInput } from "./types";

export function buildReceiptPdfFilename(
  receiptLabel: string,
  generatedAt: Date,
): string {
  const stamp = generatedAt.toISOString().slice(0, 10);
  return `caisty-receipt-${sanitizeFilenamePart(receiptLabel)}-${stamp}.pdf`;
}

function isFiscalPending(status: string): boolean {
  return status.trim().toLowerCase() === "pending";
}

export function exportReceiptPdf(input: ReceiptDocumentInput): void {
  const { meta, labels, receipt } = input;
  const currency = receipt.currency || meta.currency;
  const { locale, timezone } = meta;
  const dash = labels.dash;
  const paymentLabels = {
    cash: labels.paymentCash,
    card: labels.paymentCard,
    voucher: labels.paymentVoucher,
    other: labels.paymentOther,
    dash,
  };

  const receiptLabel =
    receipt.receiptNumber?.trim() || receipt.localReceiptId || dash;

  const pdf = new CaistyPdfDocument();
  pdf.setFooterLabels({
    generatedBy: labels.generatedBy,
    website: labels.website,
  });

  pdf.drawBrandHeader(labels.brandCloud, labels.docTitle);
  pdf.drawMetaBlock(meta, labels, { includeDate: true });

  pdf.drawSectionTitle(labels.receiptDetails);
  pdf.drawKeyValueRows([
    [labels.colReceipt, receiptLabel],
    [
      labels.colTime,
      receipt.issuedAt
        ? formatDocumentDateTime(
            new Date(receipt.issuedAt),
            locale,
            timezone,
          )
        : dash,
    ],
    [labels.colCustomer, receipt.customer?.trim() || dash],
    [
      labels.colPayment,
      formatPaymentMethodLabel(receipt.paymentMethod, paymentLabels),
    ],
    [
      labels.colFiscal,
      formatStatusLabel(receipt.fiscalStatus, dash),
    ],
    [
      labels.colAmount,
      formatDocumentMoney(receipt.amountCents, currency, locale),
    ],
    [labels.colDevice, dash],
  ]);

  if (isFiscalPending(receipt.fiscalStatus)) {
    pdf.drawSectionTitle(labels.colFiscal);
    pdf.drawKeyValueRows([[labels.colFiscal, labels.fiscalPendingNote]]);
  }

  pdf.save(buildReceiptPdfFilename(receiptLabel, meta.generatedAt));
}
