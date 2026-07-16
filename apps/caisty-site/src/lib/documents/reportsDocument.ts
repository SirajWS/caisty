import { CaistyPdfDocument } from "./baseDocument";
import { buildReportsPdfModel } from "./buildReportsPdfModel";
import { sanitizeFilenamePart } from "./formatters";
import type { ReportsDocumentInput } from "./types";

export function buildReportsPdfFilename(
  periodLabel: string,
  generatedAt: Date,
): string {
  const stamp = generatedAt.toISOString().slice(0, 10);
  return `caisty-reports-${sanitizeFilenamePart(periodLabel)}-${stamp}.pdf`;
}

export function exportReportsPdf(input: ReportsDocumentInput): void {
  const { meta, labels } = input;
  const model = buildReportsPdfModel(input);

  const pdf = new CaistyPdfDocument();
  pdf.setFooterLabels({
    generatedBy: labels.generatedBy,
    website: labels.website,
  });

  // —— Page 1: Executive overview ——
  pdf.drawBrandHeader(labels.brandCloud, labels.docTitle);
  pdf.drawMetaBlock(meta, labels);

  pdf.drawSectionTitle(labels.executiveSummary);
  pdf.drawKeyValueRows(model.executiveSummary);

  pdf.drawSectionTitle(labels.revenueBreakdownTitle);
  pdf.drawKeyValueRows(model.revenueBreakdown);

  pdf.drawSectionTitle(labels.ordersBreakdownTitle);
  pdf.drawKeyValueRows(model.ordersBreakdown);

  pdf.drawSectionTitle(labels.paymentPosTitle);
  pdf.drawKeyValueRows(model.posPaymentSummary);

  pdf.drawSectionTitle(labels.paymentOnlineTitle);
  if (model.onlineRevenueHeader) {
    pdf.drawKeyValueRows([model.onlineRevenueHeader]);
    pdf.drawMutedNote(model.onlinePaymentInfo);
  }
  pdf.drawKeyValueRows(model.onlinePaymentSummary);

  if (model.businessTrends.length > 0) {
    pdf.drawSectionTitle(labels.businessTrends);
    pdf.drawKeyValueRows(model.businessTrends);
  }

  // —— Page 2: Charts & detail ——
  pdf.addPage();
  pdf.drawSectionTitle(labels.revenueSection);
  if (model.revenueBars.length > 0) {
    pdf.drawBarChart(model.revenueBars);
  } else {
    pdf.drawMutedNote(labels.noData);
  }

  if (model.showSalesByHour) {
    pdf.drawSectionTitle(labels.salesByHour);
    pdf.drawBarChart(model.salesByHourBars);
  }

  pdf.drawSectionTitle(labels.topProducts);
  pdf.drawTable({
    head: model.topProducts.head,
    body: model.topProducts.body,
    emptyMessage: model.topProducts.emptyMessage,
  });

  pdf.drawSectionTitle(labels.taxes);
  pdf.drawKeyValueRows(model.taxes);
  pdf.drawMutedNote(model.taxesScopeNote);

  pdf.save(buildReportsPdfFilename(meta.label, meta.generatedAt));
}
