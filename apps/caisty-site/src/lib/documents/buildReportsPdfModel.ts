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

function isHourlyPeriod(period: string): boolean {
  return period === "today" || period === "yesterday";
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

  const period = summary.period;
  const hourGrain = isHourlyPeriod(period);
  const online = summary.onlinePaymentSummary;
  const onlineCurrency = online?.currency || currency;

  const executiveSummary: ReportsPdfKeyValue[] = [
    [labels.kpiRevenue, formatDocumentMoney(overview.revenueMinor, currency, locale)],
    [labels.kpiOrders, String(overview.ordersCount)],
    [labels.kpiReceipts, String(overview.receiptsCount)],
    [labels.kpiRefunds, String(overview.refundsCount)],
    [
      labels.kpiAverageOrder,
      formatDocumentMoney(overview.averageOrderMinor, currency, locale),
    ],
    [labels.kpiVat, formatDocumentMoney(overview.vatMinor, currency, locale)],
  ];

  const revenueBreakdown: ReportsPdfKeyValue[] = [
    [
      labels.kpiPosRevenue,
      formatDocumentMoney(summary.posRevenueCents ?? 0, currency, locale),
    ],
    [
      labels.kpiOnlineRevenue,
      formatDocumentMoney(summary.onlineRevenueCents ?? 0, currency, locale),
    ],
    [
      labels.kpiTotalRevenue,
      formatDocumentMoney(overview.revenueMinor, currency, locale),
    ],
  ];

  const ordersBreakdown: ReportsPdfKeyValue[] = [
    [labels.kpiAllOrders, String(overview.ordersCount)],
    [labels.kpiPosOrders, String(summary.liveOrdersCount ?? 0)],
    [labels.kpiOnlineOrders, String(summary.onlineOrdersCount ?? 0)],
  ];

  const posPaymentSummary: ReportsPdfKeyValue[] = [
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
  ];

  const cashPaid = online?.cashPaidCents ?? 0;
  const cardPaid = online?.cardPaidCents ?? 0;
  const onlinePaid = online?.onlinePaidCents ?? 0;
  const pending = online?.pendingCents ?? 0;
  const paidTotal = cashPaid + cardPaid + onlinePaid;

  const onlinePaymentSummary: ReportsPdfKeyValue[] = [
    [labels.onlineCashPaid, formatDocumentMoney(cashPaid, onlineCurrency, locale)],
    [labels.onlineCardPaid, formatDocumentMoney(cardPaid, onlineCurrency, locale)],
    [
      labels.onlinePaidOnline,
      formatDocumentMoney(onlinePaid, onlineCurrency, locale),
    ],
    [labels.onlinePending, formatDocumentMoney(pending, onlineCurrency, locale)],
    [
      labels.onlinePaidTotal,
      formatDocumentMoney(paidTotal, onlineCurrency, locale),
    ],
  ];

  const onlineRevenueHeader: ReportsPdfKeyValue = [
    labels.kpiOnlineRevenue,
    formatDocumentMoney(summary.onlineRevenueCents ?? 0, onlineCurrency, locale),
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
      formatDocumentMoney(
        businessTrends.largestReceiptMinor,
        currency,
        locale,
      ),
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
        displayValue: formatDocumentMoney(point.revenueMinor, currency, locale),
      }))
    : [];

  const salesByHourBars: ReportsPdfBarPoint[] =
    !hourGrain && hasHourlyData(summary.salesByHour)
      ? normalizeSalesByHour(summary.salesByHour)
          .filter((point) => point.revenueMinor > 0)
          .map((point) => ({
            label: formatHourLabel(point.hour),
            value: point.revenueMinor,
            displayValue: formatDocumentMoney(
              point.revenueMinor,
              currency,
              locale,
            ),
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
          formatDocumentMoney(product.revenueMinor, currency, locale),
          share,
        ];
      }),
      emptyMessage: labels.noData,
    },
    taxes: [
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
    ],
    taxesScopeNote: labels.taxesScopeNote,
  };
}
