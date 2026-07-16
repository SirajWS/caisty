import { formatMinorUnits } from "../money/formatMinorUnits";
import {
  deriveOnlinePaymentCards,
  deriveOnlineRevenueHeader,
  derivePosPaymentCards,
} from "../portal/derivePaymentSummaryCards";
import type {
  DeriveReportsInput,
  HourlyBar,
  ReportExportAction,
  ReportsDerivedState,
  ReportsKpi,
  RevenueSeriesGranularity,
  RevenueTimeRange,
  TaxCard,
  TopProductRow,
  TrendCard,
} from "./types";
import { normalizeSalesByHour } from "./salesByHour";
import type { ReportsPeriodId } from "./reportsPeriod";

// POS Sales amounts are ISO 4217 minor units (Cent for EUR, Millime for TND).
function formatMoney(minor: number, currency: string, locale: string): string {
  return formatMinorUnits(minor, currency, locale);
}

function waitingKpi(id: string, label: string, hint: string, dash: string): ReportsKpi {
  return { id, label, value: dash, hint };
}

function mapPeriodToChartRange(period: ReportsPeriodId): RevenueTimeRange {
  switch (period) {
    case "today":
    case "yesterday":
      return "today";
    case "7d":
    case "week":
      return "7d";
    case "30d":
    case "month":
    case "custom":
      return "30d";
    case "12m":
    case "year":
      return "12m";
    case "all":
      return "all";
  }
}

function mapPeriodToGranularity(period: ReportsPeriodId): RevenueSeriesGranularity {
  switch (period) {
    case "today":
    case "yesterday":
      return "hour";
    case "12m":
    case "year":
    case "all":
      return "month";
    default:
      return "day";
  }
}

function formatPaymentTrendLabel(
  method: string | null | undefined,
  t: DeriveReportsInput["t"],
): string {
  if (!method?.trim()) return "—";
  const m = method.trim().toLowerCase();
  if (m === "cash" || m.includes("cash")) return t.reports.paymentCash;
  if (
    m === "card" ||
    m.includes("card") ||
    m === "credit" ||
    m === "debit"
  ) {
    return t.reports.paymentCard;
  }
  if (m === "voucher" || m.includes("voucher") || m.includes("gift")) {
    return t.reports.paymentVoucher;
  }
  return t.reports.paymentOther;
}

function paymentTone(amountMinor: number): TaxCard["tone"] {
  return amountMinor > 0 ? "ok" : "unknown";
}

function deriveOverview(input: DeriveReportsInput): ReportsKpi[] {
  const r = input.t.reports;
  const dash = input.t.labels.dash;
  const hint = r.waitingPosSync;
  const summary = input.data.reportsSummary;

  if (!summary?.hasSalesData) {
    return [
      waitingKpi("revenue", r.kpiRevenue, hint, dash),
      waitingKpi("orders", r.kpiOrders, hint, dash),
      waitingKpi("receipts", r.kpiReceipts, hint, dash),
      waitingKpi("refunds", r.kpiRefunds, hint, dash),
      waitingKpi("avg_order", r.kpiAvgOrder, hint, dash),
      waitingKpi("vat", r.kpiVat, hint, dash),
    ];
  }

  const { overview } = summary;
  const currency = overview.currency || "EUR";

  return [
    {
      id: "revenue",
      label: r.kpiRevenue,
      value: formatMoney(overview.revenueMinor, currency, input.locale),
    },
    {
      id: "orders",
      label: r.kpiOrders,
      value: String(overview.ordersCount),
    },
    {
      id: "receipts",
      label: r.kpiReceipts,
      value: String(overview.receiptsCount),
    },
    {
      id: "refunds",
      label: r.kpiRefunds,
      value: String(overview.refundsCount),
    },
    {
      id: "avg_order",
      label: r.kpiAvgOrder,
      value: formatMoney(overview.averageOrderMinor, currency, input.locale),
    },
    {
      id: "vat",
      label: r.kpiVat,
      value: formatMoney(overview.vatMinor, currency, input.locale),
    },
  ];
}

function deriveRevenueBreakdown(input: DeriveReportsInput): ReportsKpi[] {
  const o = input.t.orders;
  const dash = input.t.labels.dash;
  const hint = o.waitingPosSyncShort;
  const summary = input.data.reportsSummary;

  if (!summary?.hasSalesData) {
    return [
      waitingKpi("pos_revenue", o.kpiPosRevenue, hint, dash),
      waitingKpi("online_revenue", o.kpiOnlineRevenue, hint, dash),
      waitingKpi("total_revenue", o.kpiTotalRevenue, hint, dash),
    ];
  }

  const currency =
    summary.paymentMethods.currency || summary.overview.currency || "EUR";

  return [
    {
      id: "pos_revenue",
      label: o.kpiPosRevenue,
      value: formatMoney(summary.posRevenueCents, currency, input.locale),
    },
    {
      id: "online_revenue",
      label: o.kpiOnlineRevenue,
      value: formatMoney(summary.onlineRevenueCents, currency, input.locale),
    },
    {
      id: "total_revenue",
      label: o.kpiTotalRevenue,
      value: formatMoney(summary.overview.revenueMinor, currency, input.locale),
    },
  ];
}

function deriveOrderBreakdown(input: DeriveReportsInput): ReportsKpi[] {
  const o = input.t.orders;
  const dash = input.t.labels.dash;
  const hint = o.waitingPosSyncShort;
  const summary = input.data.reportsSummary;

  if (!summary?.hasSalesData) {
    return [
      waitingKpi("all_orders", o.kpiAllOrders, hint, dash),
      waitingKpi("pos_orders", o.kpiPosOrders, hint, dash),
      waitingKpi("online_orders", o.kpiOnlineOrders, hint, dash),
    ];
  }

  return [
    {
      id: "all_orders",
      label: o.kpiAllOrders,
      value: String(summary.overview.ordersCount),
    },
    {
      id: "pos_orders",
      label: o.kpiPosOrders,
      value: String(summary.liveOrdersCount),
    },
    {
      id: "online_orders",
      label: o.kpiOnlineOrders,
      value: String(summary.onlineOrdersCount),
    },
  ];
}

function derivePosPayments(input: DeriveReportsInput) {
  const o = input.t.orders;
  const summary = input.data.reportsSummary;
  const hasData = Boolean(summary?.hasSalesData);
  const methods = summary?.paymentMethods;

  return derivePosPaymentCards({
    summary: methods
      ? {
          cashCents: methods.cashMinor,
          cardCents: methods.cardMinor,
          voucherCents: methods.voucherMinor,
          otherCents: methods.otherMinor,
          currency: methods.currency || summary?.overview.currency || "EUR",
        }
      : null,
    labels: {
      paymentCash: o.paymentCash,
      paymentCard: o.paymentCard,
      paymentVoucher: o.paymentVoucher,
      paymentOther: o.paymentOther,
    },
    locale: input.locale,
    dash: input.t.labels.dash,
    hasData,
  });
}

function deriveOnlinePayments(input: DeriveReportsInput) {
  const o = input.t.orders;
  const summary = input.data.reportsSummary;
  const hasData = Boolean(summary?.hasSalesData);

  return deriveOnlinePaymentCards({
    summary: summary?.onlinePaymentSummary,
    labels: {
      onlineCashPaid: o.onlineCashPaid,
      onlineCardPaid: o.onlineCardPaid,
      onlinePaidOnline: o.onlinePaidOnline,
      onlinePending: o.onlinePending,
      onlinePaidTotal: o.onlinePaidTotal,
    },
    locale: input.locale,
    dash: input.t.labels.dash,
    hasData,
  });
}

function deriveOnlineRevenueHeaderState(input: DeriveReportsInput) {
  const o = input.t.orders;
  const summary = input.data.reportsSummary;
  const hasData = Boolean(summary?.hasSalesData);
  const currency =
    summary?.onlinePaymentSummary.currency ||
    summary?.overview.currency ||
    "EUR";

  return deriveOnlineRevenueHeader({
    onlineRevenueCents: summary?.onlineRevenueCents ?? 0,
    currency,
    labels: {
      kpiOnlineRevenue: o.kpiOnlineRevenue,
      kpiOnlineRevenueInfo: o.kpiOnlineRevenueInfo,
    },
    locale: input.locale,
    dash: input.t.labels.dash,
    hasData,
  });
}

function deriveHourlyBars(input: DeriveReportsInput): HourlyBar[] {
  const summary = input.data.reportsSummary;
  const r = input.t.reports;

  if (!summary?.hasSalesData) {
    return normalizeSalesByHour([]).map((point) => ({
      hour: String(point.hour).padStart(2, "0"),
      value: null,
    }));
  }

  const currency = summary.overview.currency || "EUR";

  return normalizeSalesByHour(summary.salesByHour).map((point) => {
    const hour = String(point.hour).padStart(2, "0");
    const revenue =
      point.revenueMinor > 0
        ? formatMoney(point.revenueMinor, currency, input.locale)
        : null;
    return {
      hour,
      value: point.revenueMinor > 0 ? point.revenueMinor : null,
      tooltip: revenue
        ? `${hour}:00 · ${revenue} · ${r.colOrders}: ${point.ordersCount}`
        : undefined,
    };
  });
}

function deriveTopProducts(input: DeriveReportsInput): TopProductRow[] {
  const summary = input.data.reportsSummary;
  if (!summary?.hasSalesData) return [];

  const currency = summary.overview.currency || "EUR";
  const totalRevenue = summary.topProducts.reduce(
    (sum, product) => sum + product.revenueMinor,
    0,
  );

  return summary.topProducts.map((product, index) => {
    const share =
      totalRevenue > 0
        ? `${Math.round((product.revenueMinor / totalRevenue) * 100)}%`
        : input.t.labels.dash;

    return {
      id: `product-${index}`,
      rank: index + 1,
      name: product.productName,
      quantity: String(product.quantity),
      revenue: formatMoney(product.revenueMinor, currency, input.locale),
      share,
    };
  });
}

function deriveTaxes(input: DeriveReportsInput): TaxCard[] {
  const r = input.t.reports;
  const waiting = r.waitingFiscalSync;
  const summary = input.data.reportsSummary;

  if (!summary?.hasSalesData) {
    return [
      { id: "net", label: r.taxNetRevenue, value: waiting, tone: "unknown" },
      { id: "vat", label: r.taxVat, value: waiting, tone: "unknown" },
      { id: "gross", label: r.taxGrossRevenue, value: waiting, tone: "unknown" },
      {
        id: "fiscal_receipts",
        label: r.taxFiscalReceipts,
        value: waiting,
        tone: "unknown",
      },
    ];
  }

  const { taxes } = summary;
  const currency = taxes.currency || summary.overview.currency || "EUR";

  return [
    {
      id: "net",
      label: r.taxNetRevenue,
      value: formatMoney(taxes.netRevenueMinor, currency, input.locale),
      tone: paymentTone(taxes.netRevenueMinor),
    },
    {
      id: "vat",
      label: r.taxVat,
      value: formatMoney(taxes.vatMinor, currency, input.locale),
      tone: paymentTone(taxes.vatMinor),
    },
    {
      id: "gross",
      label: r.taxGrossRevenue,
      value: formatMoney(taxes.grossRevenueMinor, currency, input.locale),
      tone: paymentTone(taxes.grossRevenueMinor),
    },
    {
      id: "fiscal_receipts",
      label: r.taxFiscalReceipts,
      value: String(taxes.fiscalReceiptsCount),
      tone: taxes.fiscalReceiptsCount > 0 ? "ok" : "unknown",
    },
  ];
}

function deriveTrends(input: DeriveReportsInput): TrendCard[] {
  const r = input.t.reports;
  const summary = input.data.reportsSummary;
  const granularity = mapPeriodToGranularity(input.data.period);

  if (!summary?.hasSalesData) {
    return [];
  }

  const { businessTrends } = summary;
  const currency = businessTrends.currency || summary.overview.currency || "EUR";
  const trends: TrendCard[] = [];

  // bestSalesDay is the peak revenueSeries bucket — only show when the label
  // matches the period grain (day / month). Hour buckets would mislabel as "day".
  if (granularity === "day" && businessTrends.bestSalesDay?.trim()) {
    trends.push({
      id: "best_day",
      label: r.trendBestDay,
      value: businessTrends.bestSalesDay.trim(),
    });
  } else if (granularity === "month" && businessTrends.bestSalesDay?.trim()) {
    trends.push({
      id: "best_month",
      label: r.trendBestMonth,
      value: businessTrends.bestSalesDay.trim(),
    });
  }

  if (businessTrends.bestSalesHour?.trim()) {
    trends.push({
      id: "best_hour",
      label: r.trendBestHour,
      value: businessTrends.bestSalesHour.trim(),
    });
  }

  if (businessTrends.largestReceiptMinor > 0) {
    trends.push({
      id: "largest_receipt",
      label: r.trendLargestReceipt,
      value: formatMoney(
        businessTrends.largestReceiptMinor,
        currency,
        input.locale,
      ),
    });
  }

  if (businessTrends.mostUsedPayment?.trim()) {
    trends.push({
      id: "top_payment",
      label: r.trendTopPayment,
      value: formatPaymentTrendLabel(businessTrends.mostUsedPayment, input.t),
    });
  }

  if (businessTrends.mostSoldProduct?.trim()) {
    trends.push({
      id: "top_product",
      label: r.trendTopProduct,
      value: businessTrends.mostSoldProduct.trim(),
    });
  }

  return trends;
}

function deriveExports(input: DeriveReportsInput): ReportExportAction[] {
  const r = input.t.reports;
  const badge = r.comingSoon;

  return [
    { id: "pdf", label: r.exportPdf, disabled: true, badge },
    { id: "excel", label: r.exportExcel, disabled: true, badge },
    { id: "csv", label: r.exportCsv, disabled: true, badge },
    { id: "print", label: r.exportPrint, disabled: true, badge },
  ];
}

function hasPosSync(input: DeriveReportsInput): boolean {
  return input.data.devices.some((d) => Boolean(d.lastSeenAt?.trim()));
}

function granularityLabel(
  granularity: RevenueSeriesGranularity,
  r: DeriveReportsInput["t"]["reports"],
): string {
  if (granularity === "hour") return r.revenueGranularityHourly;
  if (granularity === "month") return r.revenueGranularityMonthly;
  return r.revenueGranularityDaily;
}

export function deriveReportsState(input: DeriveReportsInput): ReportsDerivedState {
  const r = input.t.reports;
  const summary = input.data.reportsSummary;
  const hasSalesData = Boolean(summary?.hasSalesData);
  const granularity = mapPeriodToGranularity(input.data.period);
  const currency = summary?.overview.currency || "EUR";

  return {
    overview: deriveOverview(input),
    revenueBreakdown: deriveRevenueBreakdown(input),
    orderBreakdown: deriveOrderBreakdown(input),
    revenueChart: {
      range: mapPeriodToChartRange(input.data.period),
      hasData: hasSalesData && (summary?.revenueSeries.length ?? 0) > 0,
      placeholderMessage: r.chartPlaceholder,
      series: summary?.revenueSeries ?? [],
      totalValue: hasSalesData
        ? formatMoney(summary!.overview.revenueMinor, currency, input.locale)
        : input.t.labels.dash,
      currency,
      locale: input.locale,
      granularity,
      granularityLabel: granularityLabel(granularity, r),
      ordersLabel: r.colOrders,
      ariaLabel: r.revenueChartTitle,
    },
    hourlySales: {
      bars: deriveHourlyBars(input),
      placeholderMessage: r.waitingPosSync,
    },
    // Today/yesterday revenue series is already hourly — avoid duplicate chart.
    showHourlySales: granularity !== "hour",
    posPaymentCards: derivePosPayments(input),
    onlinePaymentCards: deriveOnlinePayments(input),
    onlineRevenueHeader: deriveOnlineRevenueHeaderState(input),
    topProducts: deriveTopProducts(input),
    topEmployees: [],
    taxes: deriveTaxes(input),
    trends: deriveTrends(input),
    exports: deriveExports(input),
    hasPosSync: hasPosSync(input),
  };
}
