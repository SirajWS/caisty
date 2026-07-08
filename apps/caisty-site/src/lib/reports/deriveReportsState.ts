import { formatMinorUnits } from "../money/formatMinorUnits";
import type {
  DeriveReportsInput,
  HourlyBar,
  PaymentMethodStat,
  ReportExportAction,
  ReportsDerivedState,
  ReportsKpi,
  RevenueTimeRange,
  TaxCard,
  TopProductRow,
  TrendCard,
} from "./types";

// POS Sales amounts are ISO 4217 minor units (Cent for EUR, Millime for TND).
function formatMoney(minor: number, currency: string, locale: string): string {
  return formatMinorUnits(minor, currency, locale);
}

function waitingKpi(id: string, label: string, hint: string, dash: string): ReportsKpi {
  return { id, label, value: dash, hint };
}

function mapPeriodToChartRange(
  period: DeriveReportsInput["data"]["period"],
): RevenueTimeRange {
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

function paymentTone(amountMinor: number): PaymentMethodStat["tone"] {
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

function deriveHourlyBars(input: DeriveReportsInput): HourlyBar[] {
  const summary = input.data.reportsSummary;
  if (!summary?.hasSalesData || summary.salesByHour.length === 0) {
    return ["08", "09", "10", "11", "12", "13", "14"].map((hour) => ({
      hour,
      value: null,
    }));
  }

  return summary.salesByHour.map((point) => ({
    hour: String(point.hour).padStart(2, "0"),
    value: point.revenueMinor > 0 ? point.revenueMinor : null,
  }));
}

function derivePaymentMethods(input: DeriveReportsInput): PaymentMethodStat[] {
  const r = input.t.reports;
  const waiting = r.waitingPosSync;
  const summary = input.data.reportsSummary;

  if (!summary?.hasSalesData) {
    return [
      { id: "cash", label: r.paymentCash, value: waiting, tone: "unknown" },
      { id: "card", label: r.paymentCard, value: waiting, tone: "unknown" },
      { id: "voucher", label: r.paymentVoucher, value: waiting, tone: "unknown" },
      { id: "other", label: r.paymentOther, value: waiting, tone: "unknown" },
    ];
  }

  const { paymentMethods } = summary;
  const currency = paymentMethods.currency || summary.overview.currency || "EUR";

  return [
    {
      id: "cash",
      label: r.paymentCash,
      value: formatMoney(paymentMethods.cashMinor, currency, input.locale),
      tone: paymentTone(paymentMethods.cashMinor),
    },
    {
      id: "card",
      label: r.paymentCard,
      value: formatMoney(paymentMethods.cardMinor, currency, input.locale),
      tone: paymentTone(paymentMethods.cardMinor),
    },
    {
      id: "voucher",
      label: r.paymentVoucher,
      value: formatMoney(paymentMethods.voucherMinor, currency, input.locale),
      tone: paymentTone(paymentMethods.voucherMinor),
    },
    {
      id: "other",
      label: r.paymentOther,
      value: formatMoney(paymentMethods.otherMinor, currency, input.locale),
      tone: paymentTone(paymentMethods.otherMinor),
    },
  ];
}

function deriveTopProducts(input: DeriveReportsInput): TopProductRow[] {
  const summary = input.data.reportsSummary;
  if (!summary?.hasSalesData) return [];

  const currency = summary.overview.currency || "EUR";
  const dash = input.t.labels.dash;

  return summary.topProducts.map((product, index) => ({
    id: `product-${index}`,
    name: product.productName,
    quantity: String(product.quantity),
    revenue: formatMoney(product.revenueMinor, currency, input.locale),
    category: product.category?.trim() || dash,
  }));
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
      { id: "fiscal_receipts", label: r.taxFiscalReceipts, value: waiting, tone: "unknown" },
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
  const dash = input.t.labels.dash;
  const summary = input.data.reportsSummary;

  if (!summary?.hasSalesData) {
    return [
      { id: "best_day", label: r.trendBestDay, value: dash },
      { id: "best_hour", label: r.trendBestHour, value: dash },
      { id: "largest_receipt", label: r.trendLargestReceipt, value: dash },
      { id: "top_payment", label: r.trendTopPayment, value: dash },
      { id: "top_product", label: r.trendTopProduct, value: dash },
    ];
  }

  const { businessTrends } = summary;
  const currency = businessTrends.currency || summary.overview.currency || "EUR";

  return [
    {
      id: "best_day",
      label: r.trendBestDay,
      value: businessTrends.bestSalesDay || dash,
    },
    {
      id: "best_hour",
      label: r.trendBestHour,
      value: businessTrends.bestSalesHour || dash,
    },
    {
      id: "largest_receipt",
      label: r.trendLargestReceipt,
      value:
        businessTrends.largestReceiptMinor > 0
          ? formatMoney(
              businessTrends.largestReceiptMinor,
              currency,
              input.locale,
            )
          : dash,
    },
    {
      id: "top_payment",
      label: r.trendTopPayment,
      value: formatPaymentTrendLabel(businessTrends.mostUsedPayment, input.t),
    },
    {
      id: "top_product",
      label: r.trendTopProduct,
      value: businessTrends.mostSoldProduct || dash,
    },
  ];
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

export function deriveReportsState(input: DeriveReportsInput): ReportsDerivedState {
  const r = input.t.reports;
  const summary = input.data.reportsSummary;
  const hasSalesData = Boolean(summary?.hasSalesData);

  return {
    overview: deriveOverview(input),
    revenueChart: {
      range: mapPeriodToChartRange(input.data.period),
      hasData: hasSalesData && (summary?.revenueSeries.length ?? 0) > 0,
      placeholderMessage: r.chartPlaceholder,
      series: summary?.revenueSeries ?? [],
    },
    hourlySales: {
      bars: deriveHourlyBars(input),
      placeholderMessage: r.waitingPosSync,
    },
    paymentMethods: derivePaymentMethods(input),
    topProducts: deriveTopProducts(input),
    topEmployees: [],
    taxes: deriveTaxes(input),
    trends: deriveTrends(input),
    exports: deriveExports(input),
    hasPosSync: hasPosSync(input),
  };
}
