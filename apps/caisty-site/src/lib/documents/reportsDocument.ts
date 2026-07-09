import { CaistyPdfDocument } from "./baseDocument";
import {
  formatDocumentMoney,
  formatHourLabel,
  formatPaymentMethodLabel,
  sanitizeFilenamePart,
} from "./formatters";
import {
  isHourlyRevenueSeries,
  resolveNormalizedHourlyReportPoints,
} from "../reports/salesByHour";
import type { PortalReportsHourlyPoint } from "../portalApi";
import type { ReportsDocumentInput } from "./types";

type TopEmployeeRow = {
  employeeName: string;
  ordersCount: number;
  revenueMinor: number;
  averageOrderMinor: number;
};

function hasHourlyData(
  points: ReportsDocumentInput["summary"]["salesByHour"],
): boolean {
  return points.some((point) => point.revenueMinor > 0 || point.ordersCount > 0);
}

function hasRevenueSeriesData(
  points: ReportsDocumentInput["summary"]["revenueSeries"],
): boolean {
  return points.some((point) => point.revenueMinor > 0 || point.ordersCount > 0);
}

function hourlyReportTableRow(
  point: PortalReportsHourlyPoint,
  currency: string,
  locale: string,
): [string, string, string] {
  return [
    formatHourLabel(point.hour),
    formatDocumentMoney(point.revenueMinor, currency, locale),
    String(point.ordersCount),
  ];
}

export function buildReportsPdfFilename(
  periodLabel: string,
  generatedAt: Date,
): string {
  const stamp = generatedAt.toISOString().slice(0, 10);
  return `caisty-reports-${sanitizeFilenamePart(periodLabel)}-${stamp}.pdf`;
}

export function exportReportsPdf(input: ReportsDocumentInput): void {
  const { meta, labels, summary } = input;
  const { overview, paymentMethods, topProducts, taxes, businessTrends } =
    summary;
  const currency = overview.currency || meta.currency;
  const { locale } = meta;
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
  pdf.drawMetaBlock(meta, labels);

  pdf.drawSectionTitle(labels.executiveSummary);
  pdf.drawKeyValueRows([
    [labels.kpiRevenue, formatDocumentMoney(overview.revenueMinor, currency, locale)],
    [labels.kpiOrders, String(overview.ordersCount)],
    [labels.kpiReceipts, String(overview.receiptsCount)],
    [labels.kpiRefunds, String(overview.refundsCount)],
    [
      labels.kpiAverageOrder,
      formatDocumentMoney(overview.averageOrderMinor, currency, locale),
    ],
    [labels.kpiVat, formatDocumentMoney(overview.vatMinor, currency, locale)],
  ]);

  pdf.drawSectionTitle(labels.paymentMethods);
  pdf.drawKeyValueRows([
    [
      labels.paymentCash,
      formatDocumentMoney(paymentMethods.cashMinor, currency, locale),
    ],
    [
      labels.paymentCard,
      formatDocumentMoney(paymentMethods.cardMinor, currency, locale),
    ],
    [
      labels.paymentVoucher,
      formatDocumentMoney(paymentMethods.voucherMinor, currency, locale),
    ],
    [
      labels.paymentOther,
      formatDocumentMoney(paymentMethods.otherMinor, currency, locale),
    ],
  ]);

  pdf.drawSectionTitle(labels.topProducts);
  pdf.drawTable({
    head: [
      labels.colProduct,
      labels.colQuantity,
      labels.colRevenue,
      labels.colCategory,
    ],
    body: topProducts.map((product) => [
      product.productName,
      String(product.quantity),
      formatDocumentMoney(product.revenueMinor, currency, locale),
      product.category?.trim() || dash,
    ]),
    emptyMessage: labels.noData,
  });

  pdf.drawSectionTitle(labels.topEmployees);
  const employeeRows = summary.topEmployees as unknown as TopEmployeeRow[];
  pdf.drawTable({
    head: [
      labels.colEmployee,
      labels.colOrders,
      labels.colRevenue,
      labels.colAvgOrder,
    ],
    body: employeeRows.map((employee) => [
      employee.employeeName,
      String(employee.ordersCount),
      formatDocumentMoney(employee.revenueMinor, currency, locale),
      formatDocumentMoney(employee.averageOrderMinor, currency, locale),
    ]),
    emptyMessage: labels.topEmployeesEmpty,
  });

  pdf.drawSectionTitle(labels.taxes);
  pdf.drawKeyValueRows([
    [
      labels.taxNetRevenue,
      formatDocumentMoney(taxes.netRevenueMinor, currency, locale),
    ],
    [labels.taxVat, formatDocumentMoney(taxes.vatMinor, currency, locale)],
    [
      labels.taxGrossRevenue,
      formatDocumentMoney(taxes.grossRevenueMinor, currency, locale),
    ],
    [labels.taxFiscalReceipts, String(taxes.fiscalReceiptsCount)],
  ]);

  pdf.drawSectionTitle(labels.businessTrends);
  pdf.drawKeyValueRows([
    [labels.trendBestDay, businessTrends.bestSalesDay?.trim() || dash],
    [labels.trendBestHour, businessTrends.bestSalesHour?.trim() || dash],
    [
      labels.trendLargestReceipt,
      businessTrends.largestReceiptMinor > 0
        ? formatDocumentMoney(businessTrends.largestReceiptMinor, currency, locale)
        : dash,
    ],
    [
      labels.trendTopPayment,
      formatPaymentMethodLabel(businessTrends.mostUsedPayment, paymentLabels),
    ],
    [labels.trendTopProduct, businessTrends.mostSoldProduct?.trim() || dash],
  ]);

  if (hasHourlyData(summary.salesByHour)) {
    const salesByHour = resolveNormalizedHourlyReportPoints(
      summary.salesByHour,
      summary.revenueSeries,
    );
    pdf.drawSectionTitle(labels.salesByHour);
    pdf.drawTable({
      head: [labels.hour, labels.colRevenue, labels.colOrders],
      body: salesByHour.map((point) =>
        hourlyReportTableRow(point, currency, locale),
      ),
    });
  }

  if (hasRevenueSeriesData(summary.revenueSeries)) {
    pdf.drawSectionTitle(labels.revenueSection);
    const revenueBody = isHourlyRevenueSeries(summary.revenueSeries)
      ? resolveNormalizedHourlyReportPoints(
          summary.salesByHour,
          summary.revenueSeries,
        ).map((point) => hourlyReportTableRow(point, currency, locale))
      : summary.revenueSeries.map((point) => [
          point.label,
          formatDocumentMoney(point.revenueMinor, currency, locale),
          String(point.ordersCount),
        ]);
    pdf.drawTable({
      head: [labels.segment, labels.colRevenue, labels.colOrders],
      body: revenueBody,
    });
  }

  pdf.save(buildReportsPdfFilename(meta.label, meta.generatedAt));
}
