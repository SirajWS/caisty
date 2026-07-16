import { CaistyPdfDocument } from "./baseDocument";
import {
  buildReceiptDetailPdfModel,
  type ReceiptDetailDocumentLabels,
} from "./buildReceiptDetailPdfModel";
import {
  formatDocumentDateTime,
  formatDocumentMoney,
  formatPaymentMethodLabel,
  formatStatusLabel,
  sanitizeFilenamePart,
} from "./formatters";
import type { DocumentMeta, ReceiptDocumentInput } from "./types";
import type { PortalReceiptDetailResponse } from "../portalApi";

export type ReceiptDetailDocumentInput = {
  meta: DocumentMeta;
  labels: ReceiptDetailDocumentLabels;
  detail: PortalReceiptDetailResponse;
};

export function buildReceiptPdfFilename(
  receiptLabel: string,
  generatedAt: Date,
): string {
  const stamp = generatedAt.toISOString().slice(0, 10);
  return `caisty-receipt-${sanitizeFilenamePart(receiptLabel)}-${stamp}.pdf`;
}

/** Primary single-receipt export — uses full detail payload. */
export function exportReceiptDetailPdf(
  input: ReceiptDetailDocumentInput,
): void {
  const model = buildReceiptDetailPdfModel(input);
  const { meta, labels } = input;

  const pdf = new CaistyPdfDocument();
  pdf.setFooterLabels({
    generatedBy: labels.generatedBy,
    website: labels.website,
  });

  pdf.drawBrandHeader(labels.brandCloud, labels.docTitle);
  pdf.drawMetaBlock(meta, labels, { includeDate: true });

  pdf.drawSectionTitle(labels.receiptDetails);
  pdf.drawKeyValueRows(model.summary);

  pdf.drawSectionTitle(labels.itemsTitle);
  pdf.drawTable({
    head: model.products.head,
    body: model.products.body,
    emptyMessage: model.products.empty,
  });

  pdf.drawSectionTitle(labels.totalsTitle);
  pdf.drawKeyValueRows(model.totals);

  pdf.drawSectionTitle(labels.sectionPayment);
  pdf.drawKeyValueRows(model.payment);

  pdf.drawSectionTitle(labels.sectionFiscal);
  pdf.drawKeyValueRows(model.fiscal);
  if (model.showFiscalPending) {
    pdf.drawMutedNote(labels.fiscalPendingNote);
  }

  pdf.drawSectionTitle(labels.sectionPrintStats);
  pdf.drawKeyValueRows(model.printStats);

  pdf.drawSectionTitle(labels.sectionActivity);
  if (model.activity.length > 0) {
    pdf.drawKeyValueRows(model.activity);
  } else {
    pdf.drawMutedNote(labels.activityEmpty);
  }

  pdf.save(buildReceiptPdfFilename(model.receiptLabel, meta.generatedAt));
}

/**
 * Lightweight single-receipt export from list record (items only).
 * Prefer exportReceiptDetailPdf when detail API data is available.
 */
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
        ? formatDocumentDateTime(new Date(receipt.issuedAt), locale, timezone)
        : dash,
    ],
    [labels.colCustomer, receipt.customer?.trim() || dash],
    [
      labels.colPayment,
      formatPaymentMethodLabel(receipt.paymentMethod, paymentLabels),
    ],
    [labels.colFiscal, formatStatusLabel(receipt.fiscalStatus, dash)],
    [
      labels.colAmount,
      formatDocumentMoney(receipt.amountCents, currency, locale),
    ],
    [labels.colDevice, dash],
  ]);

  if (receipt.fiscalStatus.trim().toLowerCase() === "pending") {
    pdf.drawMutedNote(labels.fiscalPendingNote);
  }

  pdf.drawSectionTitle(labels.itemsTitle);
  pdf.drawTable({
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
        ? formatDocumentMoney(line.unitPriceCents, currency, locale)
        : dash,
      formatDocumentMoney(line.lineTotalCents, currency, locale),
    ]),
    emptyMessage: labels.itemsEmpty,
  });

  pdf.save(buildReceiptPdfFilename(receiptLabel, meta.generatedAt));
}

export { buildReceiptDetailPdfModel };
export type { ReceiptDetailDocumentLabels };
