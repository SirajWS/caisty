import type {
  DeriveReportsInput,
  HourlyBar,
  PaymentMethodStat,
  ReportExportAction,
  ReportsDerivedState,
  ReportsKpi,
  TaxCard,
  TrendCard,
} from "./types";

function waitingKpi(id: string, label: string, hint: string, dash: string): ReportsKpi {
  return { id, label, value: dash, hint };
}

function deriveOverview(input: DeriveReportsInput): ReportsKpi[] {
  const r = input.t.reports;
  const dash = input.t.labels.dash;
  const hint = r.waitingPosSync;

  return [
    waitingKpi("revenue", r.kpiRevenue, hint, dash),
    waitingKpi("orders", r.kpiOrders, hint, dash),
    waitingKpi("receipts", r.kpiReceipts, hint, dash),
    waitingKpi("refunds", r.kpiRefunds, hint, dash),
    waitingKpi("avg_order", r.kpiAvgOrder, hint, dash),
    waitingKpi("vat", r.kpiVat, hint, dash),
  ];
}

function deriveHourlyBars(): HourlyBar[] {
  return ["08", "09", "10", "11", "12", "13", "14"].map((hour) => ({
    hour,
    value: null,
  }));
}

function derivePaymentMethods(input: DeriveReportsInput): PaymentMethodStat[] {
  const r = input.t.reports;
  const waiting = r.waitingPosSync;

  return [
    { id: "cash", label: r.paymentCash, value: waiting, tone: "unknown" },
    { id: "card", label: r.paymentCard, value: waiting, tone: "unknown" },
    { id: "voucher", label: r.paymentVoucher, value: waiting, tone: "unknown" },
    { id: "other", label: r.paymentOther, value: waiting, tone: "unknown" },
  ];
}

function deriveTaxes(input: DeriveReportsInput): TaxCard[] {
  const r = input.t.reports;
  const waiting = r.waitingFiscalSync;

  return [
    { id: "net", label: r.taxNetRevenue, value: waiting, tone: "unknown" },
    { id: "vat", label: r.taxVat, value: waiting, tone: "unknown" },
    { id: "gross", label: r.taxGrossRevenue, value: waiting, tone: "unknown" },
    { id: "fiscal_receipts", label: r.taxFiscalReceipts, value: waiting, tone: "unknown" },
  ];
}

function deriveTrends(input: DeriveReportsInput): TrendCard[] {
  const r = input.t.reports;
  const dash = input.t.labels.dash;

  return [
    { id: "best_day", label: r.trendBestDay, value: dash },
    { id: "best_hour", label: r.trendBestHour, value: dash },
    { id: "largest_receipt", label: r.trendLargestReceipt, value: dash },
    { id: "top_payment", label: r.trendTopPayment, value: dash },
    { id: "top_product", label: r.trendTopProduct, value: dash },
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

  return {
    overview: deriveOverview(input),
    revenueChart: {
      range: "today",
      hasData: false,
      placeholderMessage: r.chartPlaceholder,
    },
    hourlySales: {
      bars: deriveHourlyBars(),
      placeholderMessage: r.waitingPosSync,
    },
    paymentMethods: derivePaymentMethods(input),
    topProducts: [],
    topEmployees: [],
    taxes: deriveTaxes(input),
    trends: deriveTrends(input),
    exports: deriveExports(input),
    hasPosSync: hasPosSync(input),
  };
}
