import { CaistyPdfDocument } from "./baseDocument";
import { buildReceiptsListPdfModel } from "./buildReceiptsListPdfModel";
import { sanitizeFilenamePart } from "./formatters";
import type { ReceiptsListDocumentLabels } from "./buildReceiptsListPdfModel";
import type { DocumentMeta } from "./types";
import type { PortalReceiptsResponse } from "../portalApi";

export type ReceiptsListDocumentInput = {
  meta: DocumentMeta;
  labels: ReceiptsListDocumentLabels;
  page: PortalReceiptsResponse;
};

export function buildReceiptsListPdfFilename(
  periodLabel: string,
  generatedAt: Date,
): string {
  const stamp = generatedAt.toISOString().slice(0, 10);
  return `caisty-receipts-${sanitizeFilenamePart(periodLabel)}-${stamp}.pdf`;
}

export function exportReceiptsListPdf(input: ReceiptsListDocumentInput): void {
  const model = buildReceiptsListPdfModel(input);
  const { meta, labels } = input;

  const pdf = new CaistyPdfDocument();
  pdf.setFooterLabels({
    generatedBy: labels.generatedBy,
    website: labels.website,
  });

  pdf.drawBrandHeader(labels.brandCloud, labels.docTitle);
  pdf.drawMetaBlock(meta, labels, { includeDate: true });

  pdf.drawSectionTitle(labels.receiptSummary);
  pdf.drawKeyValueRows(model.summary);

  pdf.drawSectionTitle(labels.paymentSummary);
  pdf.drawKeyValueRows(model.payments);

  pdf.drawSectionTitle(model.table.title);
  pdf.drawTable({
    head: model.table.head,
    body: model.table.body,
    emptyMessage: model.table.empty,
  });

  pdf.save(buildReceiptsListPdfFilename(meta.label, meta.generatedAt));
}

export { buildReceiptsListPdfModel };
export type { ReceiptsListDocumentLabels };
