import { CaistyPdfDocument } from "./baseDocument";
import { buildOrdersPdfModel } from "./buildOrdersPdfModel";
import { sanitizeFilenamePart } from "./formatters";
import type { OrdersDocumentInput } from "./types";

export function buildOrdersPdfFilename(generatedAt: Date, periodLabel: string): string {
  const stamp = generatedAt.toISOString().slice(0, 10);
  return `caisty-orders-${sanitizeFilenamePart(periodLabel)}-${stamp}.pdf`;
}

export { buildOrdersPdfModel } from "./buildOrdersPdfModel";

export function exportOrdersPdf(input: OrdersDocumentInput): void {
  const model = buildOrdersPdfModel(input);
  const { meta, labels } = input;

  const pdf = new CaistyPdfDocument();
  pdf.setFooterLabels({
    generatedBy: labels.generatedBy,
    website: labels.website,
  });

  pdf.drawBrandHeader(labels.brandCloud, labels.docTitle);
  pdf.drawMetaBlock(meta, labels, { includeDate: true });

  pdf.drawSectionTitle(labels.ordersSummary);
  pdf.drawKeyValueRows(model.orderSummary);

  pdf.drawSectionTitle(labels.revenueSummary);
  pdf.drawKeyValueRows(model.revenueSummary);

  pdf.drawSectionTitle(labels.posPaymentSummaryTitle);
  pdf.drawKeyValueRows(model.posPaymentSummary);

  pdf.drawSectionTitle(labels.onlinePaymentSummaryTitle);
  pdf.drawKeyValueRows(model.onlinePaymentSummary);
  if (model.onlineRevenueHint) {
    pdf.drawMutedNote(model.onlineRevenueHint);
  }

  pdf.drawSectionTitle(model.posOrders.title);
  pdf.drawTable({
    head: model.posOrders.head,
    body: model.posOrders.body,
    emptyMessage: model.posOrders.emptyMessage,
  });

  pdf.drawSectionTitle(model.onlineOrders.title);
  pdf.drawTable({
    head: model.onlineOrders.head,
    body: model.onlineOrders.body,
    emptyMessage: model.onlineOrders.emptyMessage,
  });

  pdf.drawSectionTitle(model.receipts.title);
  pdf.drawTable({
    head: model.receipts.head,
    body: model.receipts.body,
    emptyMessage: model.receipts.emptyMessage,
  });

  pdf.save(buildOrdersPdfFilename(meta.generatedAt, meta.label));
}
