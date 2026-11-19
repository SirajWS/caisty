import { pickOperationalPaymentCurrency } from "@caisty/business-currency";
import { formatDocumentMoney, formatHourLabel, formatPaymentMethodLabel } from "./formatters";
import { normalizeSalesByHour } from "../reports/salesByHour";
import type { ReportsDocumentInput, ReportsDocumentLabels } from "./types";

export type ReportsPdfKeyValue = [string, string];

export type ReportsPdfBarPoint = {
  label: string;
  value: number;
  displayValue: string;
};

export type ReportsPdfModel = {
  executiveSummary: ReportsPdfKeyValue[];
  revenueBreakdown: ReportsPdfKeyValue[];
  ordersBreakdown: ReportsPdfKeyValue[];
  posPaymentSummary: ReportsPdfKeyValue[];
  onlinePaymentSummary: ReportsPdfKeyValue[];
  onlineRevenueHeader: ReportsPdfKeyValue | null;
  onlinePaymentInfo: string;
  businessTrends: ReportsPdfKeyValue[];
  revenueBars: ReportsPdfBarPoint[];
  salesByHourBars: ReportsPdfBarPoint[];
  showSalesByHour: boolean;
  topProducts: {
    head: string[];
    body: string[][];
    emptyMessage: string;
  };
  taxes: ReportsPdfKeyValue[];
  taxesScopeNote: string;
};

function hasSeriesData(
  points: ReportsDocumentInput["summary"]["revenueSeries"],
): boolean {
  return points.some((point) => point.revenueMinor > 0 || point.ordersCount > 0);
}

function hasHourlyData(
  points: ReportsDocumentInput["summary"]["salesByHour"],
): boolean {
  return points.some((point) => point.revenueMinor > 0 || point.ordersCount > 0);
}

function isHourlyPeriod(period: string, from?: string, to?: string): boolean {
  if (period === "today" || period === "yesterday") return true;
  return period === "custom" && Boolean(from) && from === to;
}

function isMonthlyPeriod(period: string): boolean {
  return (
    period === "12_months" ||
    period === "this_year" ||
    period === "all_time" ||
    period === "12m" ||
    period === "year" ||
    period === "all"
  );
}

function peakBucketLabel(
  labels: ReportsDocumentLabels,
  period: string,
): string {
  if (isMonthlyPeriod(period)) return labels.trendBestMonth;
  return labels.trendBestDay;
}

export function buildReportsPdfModel(
  input: ReportsDocumentInput,
): ReportsPdfModel {
  const { meta, labels, summary } = input;
  const { overview, paymentMethods, topProducts, taxes, businessTrends } =
    summary;
  const currency =
    summary.financialCurrency || overview.currency || meta.currency;
  const { locale } = meta;
  const dash = labels.dash;
  const money = (amount: number, code = currency) =>
    currency
      ? formatDocumentMoney(amount, code, locale)
      : dash;
  const paymentLabels = {
    cash: labels.paymentCash,
    card: labels.paymentCard,
    voucher: labels.paymentVoucher,
    other: labels.paymentOther,
    dash,
  };

  const period = summary.period;
  const hourGrain = isHourlyPeriod(period, summary.from, summary.to);
  const online = summary.onlinePaymentSummary;
  const onlineHasAmounts =
    (online?.cashPaidCents ?? 0) > 0 ||
    (online?.cardPaidCents ?? 0) > 0 ||
    (online?.onlinePaidCents ?? 0) > 0 ||
    (online?.pendingCents ?? 0) > 0;
  const onlineCurrency = pickOperationalPaymentCurrency({
    recordedCurrency: online?.currency,
    fallbackCurrency: currency || meta.currency,
    hasRecordedAmounts: onlineHasAmounts,
  });

  const executiveSummary: ReportsPdfKeyValue[] = [
    [labels.kpiRevenue, money(overview.revenueMinor)],
    [labels.kpiOrders, String(overview.ordersCount)],
    [labels.kpiReceipts, String(overview.receiptsCount)],
    [labels.kpiRefunds, String(overview.refundsCount)],
    [labels.kpiAverageOrder, money(overview.averageOrderMinor)],
    [labels.kpiVat, money(overview.vatMinor)],
  ];

  const revenueBreakdown: ReportsPdfKeyValue[] = [
    [labels.kpiPosRevenue, money(summary.posRevenueCents ?? 0)],
    [labels.kpiOnlineRevenue, money(summary.onlineRevenueCents ?? 0)],
    [labels.kpiTotalRevenue, money(overview.revenueMinor)],
  ];

  const ordersBreakdown: ReportsPdfKeyValue[] = [
    [labels.kpiAllOrders, String(overview.ordersCount)],
    [labels.kpiPosOrders, String(summary.liveOrdersCount ?? 0)],
    [labels.kpiOnlineOrders, String(summary.onlineOrdersCount ?? 0)],
  ];

  const posPaymentSummary: ReportsPdfKeyValue[] = [
    [labels.paymentCash, money(paymentMethods.cashMinor)],
    [labels.paymentCard, money(paymentMethods.cardMinor)],
    [labels.paymentVoucher, money(paymentMethods.voucherMinor)],
    [labels.paymentOther, money(paymentMethods.otherMinor)],
  ];

  const cashPaid = online?.cashPaidCents ?? 0;
  const cardPaid = online?.cardPaidCents ?? 0;
  const onlinePaid = online?.onlinePaidCents ?? 0;
  const pending = online?.pendingCents ?? 0;
  const paidTotal = cashPaid + cardPaid + onlinePaid;

  const onlinePaymentSummary: ReportsPdfKeyValue[] = [
    [labels.onlineCashPaid, money(cashPaid, onlineCurrency)],
    [labels.onlineCardPaid, money(cardPaid, onlineCurrency)],
    [labels.onlinePaidOnline, money(onlinePaid, onlineCurrency)],
    [labels.onlinePending, money(pending, onlineCurrency)],
    [labels.onlinePaidTotal, money(paidTotal, onlineCurrency)],
  ];

  const onlineRevenueHeader: ReportsPdfKeyValue = [
    labels.kpiOnlineRevenue,
    money(summary.onlineRevenueCents ?? 0, onlineCurrency),
  ];

  const trendRows: ReportsPdfKeyValue[] = [];
  if (!hourGrain && businessTrends.bestSalesDay?.trim()) {
    trendRows.push([
      peakBucketLabel(labels, period),
      businessTrends.bestSalesDay.trim(),
    ]);
  }
  if (businessTrends.bestSalesHour?.trim()) {
    trendRows.push([labels.trendBestHour, businessTrends.bestSalesHour.trim()]);
  }
  if (businessTrends.largestReceiptMinor > 0) {
    trendRows.push([
      labels.trendLargestReceipt,
      money(businessTrends.largestReceiptMinor),
    ]);
  }
  if (businessTrends.mostUsedPayment?.trim()) {
    trendRows.push([
      labels.trendTopPayment,
      formatPaymentMethodLabel(businessTrends.mostUsedPayment, paymentLabels),
    ]);
  }
  if (businessTrends.mostSoldProduct?.trim()) {
    trendRows.push([
      labels.trendTopProduct,
      businessTrends.mostSoldProduct.trim(),
    ]);
  }

  const totalProductRevenue = topProducts.reduce(
    (sum, product) => sum + product.revenueMinor,
    0,
  );

  const revenueBars: ReportsPdfBarPoint[] = hasSeriesData(summary.revenueSeries)
    ? summary.revenueSeries.map((point) => ({
        label: point.label,
        value: point.revenueMinor,
        displayValue: money(point.revenueMinor),
      }))
    : [];

  const salesByHourBars: ReportsPdfBarPoint[] =
    !hourGrain && hasHourlyData(summary.salesByHour)
      ? normalizeSalesByHour(summary.salesByHour)
          .filter((point) => point.revenueMinor > 0)
          .map((point) => ({
            label: formatHourLabel(point.hour),
            value: point.revenueMinor,
            displayValue: money(point.revenueMinor),
          }))
      : [];

  return {
    executiveSummary,
    revenueBreakdown,
    ordersBreakdown,
    posPaymentSummary,
    onlinePaymentSummary,
    onlineRevenueHeader,
    onlinePaymentInfo: labels.onlineRevenueInfo,
    businessTrends: trendRows,
    revenueBars,
    salesByHourBars,
    showSalesByHour: salesByHourBars.length > 0,
    topProducts: {
      head: [
        labels.colRank,
        labels.colProduct,
        labels.colQuantity,
        labels.colRevenue,
        labels.colShare,
      ],
      body: topProducts.map((product, index) => {
        const share =
          totalProductRevenue > 0
            ? `${Math.round((product.revenueMinor / totalProductRevenue) * 100)}%`
            : dash;
        return [
          String(index + 1),
          product.productName,
          String(product.quantity),
          money(product.revenueMinor),
          share,
        ];
      }),
      emptyMessage: labels.noData,
    },
    taxes: [
      [labels.taxNetRevenue, money(taxes.netRevenueMinor)],
      [labels.taxVat, money(taxes.vatMinor)],
      [labels.taxGrossRevenue, money(taxes.grossRevenueMinor)],
      [labels.taxFiscalReceipts, String(taxes.fiscalReceiptsCount)],
    ],
    taxesScopeNote: labels.taxesScopeNote,
  };
}
