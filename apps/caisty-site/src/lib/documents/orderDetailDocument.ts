import { CaistyPdfDocument } from "./baseDocument";
import {
  buildOrderDetailPdfModel,
  type OrderDetailDocumentLabels,
} from "./buildOrderDetailPdfModel";
import { sanitizeFilenamePart } from "./formatters";
import type { DocumentMeta } from "./types";
import type { PortalOrderDetailResponse } from "../portalApi";

export type OrderDetailDocumentInput = {
  meta: DocumentMeta;
  labels: OrderDetailDocumentLabels;
  order: PortalOrderDetailResponse;
};

export function buildOrderDetailPdfFilename(
  orderLabel: string,
  generatedAt: Date,
): string {
  const stamp = generatedAt.toISOString().slice(0, 10);
  return `caisty-order-${sanitizeFilenamePart(orderLabel)}-${stamp}.pdf`;
}

export function exportOrderDetailPdf(input: OrderDetailDocumentInput): void {
  const model = buildOrderDetailPdfModel(input);
  const { meta, labels, order } = input;
  const orderLabel = order.localOrderId || order.id;

  const pdf = new CaistyPdfDocument();
  pdf.setFooterLabels({
    generatedBy: labels.generatedBy,
    website: labels.website,
  });

  pdf.drawBrandHeader(labels.brandCloud, labels.docTitle);
  pdf.drawMetaBlock(meta, labels, { includeDate: true });

  pdf.drawSectionTitle(labels.sectionOverview);
  pdf.drawKeyValueRows([
    [labels.gross, model.amount],
    [labels.status, model.status],
    [labels.payment, model.payment],
    ...model.overview.filter(
      ([label]) =>
        label !== labels.gross &&
        label !== labels.status &&
        label !== labels.payment,
    ),
  ]);

  if (model.customer.length > 0) {
    pdf.drawSectionTitle(labels.sectionCustomer);
    pdf.drawKeyValueRows(model.customer);
  }

  pdf.drawSectionTitle(labels.sectionProducts);
  pdf.drawTable({
    head: model.products.head,
    body: model.products.body,
    emptyMessage: model.products.empty,
  });

  pdf.drawSectionTitle(labels.sectionTotals);
  pdf.drawKeyValueRows(model.totals);

  if (model.payments.length > 0) {
    pdf.drawSectionTitle(labels.sectionPayment);
    pdf.drawKeyValueRows(model.payments);
  }

  if (model.activity.length > 0) {
    pdf.drawSectionTitle(labels.sectionActivity);
    pdf.drawKeyValueRows(model.activity);
  } else {
    pdf.drawSectionTitle(labels.sectionActivity);
    pdf.drawMutedNote(labels.activityEmpty);
  }

  pdf.save(buildOrderDetailPdfFilename(orderLabel, meta.generatedAt));
}

export { buildOrderDetailPdfModel };
export type { OrderDetailDocumentLabels };
