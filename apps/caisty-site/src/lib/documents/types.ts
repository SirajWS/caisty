import type { PortalOrdersResponse, PortalReportsSummary } from "../portalApi";

/** Opaque period label — PDF layer does not interpret period ids. */
export type DocumentPeriod = {
  label: string;
};

export type DocumentIdentity = {
  businessName: string;
  storeName: string;
};

export type DocumentMeta = DocumentIdentity &
  DocumentPeriod & {
    generatedAt: Date;
    timezone: string;
    currency: string;
    locale: string;
  };

export type PdfDocumentLabels = {
  brandCloud: string;
  generatedAt: string;
  timezone: string;
  currency: string;
  business: string;
  store: string;
  period: string;
  date: string;
  executiveSummary: string;
  generatedBy: string;
  website: string;
  totals: string;
  hour: string;
  colRevenue: string;
  colOrders: string;
  segment: string;
  noData: string;
};

export type ReportsDocumentLabels = PdfDocumentLabels & {
  docTitle: string;
  kpiRevenue: string;
  kpiOrders: string;
  kpiReceipts: string;
  kpiRefunds: string;
  kpiAverageOrder: string;
  kpiVat: string;
  revenueBreakdownTitle: string;
  ordersBreakdownTitle: string;
  kpiPosRevenue: string;
  kpiOnlineRevenue: string;
  kpiTotalRevenue: string;
  kpiAllOrders: string;
  kpiPosOrders: string;
  kpiOnlineOrders: string;
  paymentMethods: string;
  paymentPosTitle: string;
  paymentOnlineTitle: string;
  paymentScopeNote: string;
  paymentCash: string;
  paymentCard: string;
  paymentVoucher: string;
  paymentOther: string;
  onlineCashPaid: string;
  onlineCardPaid: string;
  onlinePaidOnline: string;
  onlinePending: string;
  onlinePaidTotal: string;
  onlineRevenueInfo: string;
  topProducts: string;
  colRank: string;
  colProduct: string;
  colQuantity: string;
  colShare: string;
  colCategory: string;
  topEmployees: string;
  colEmployee: string;
  colOrders: string;
  colAvgOrder: string;
  topEmployeesEmpty: string;
  taxes: string;
  taxesScopeNote: string;
  taxNetRevenue: string;
  taxVat: string;
  taxGrossRevenue: string;
  taxFiscalReceipts: string;
  businessTrends: string;
  trendBestDay: string;
  trendBestMonth: string;
  trendBestHour: string;
  trendLargestReceipt: string;
  trendTopPayment: string;
  trendTopProduct: string;
  salesByHour: string;
  revenueSection: string;
  dash: string;
};

export type OrdersDocumentLabels = PdfDocumentLabels & {
  docTitle: string;
  ordersSummary: string;
  revenueSummary: string;
  posPaymentSummaryTitle: string;
  onlinePaymentSummaryTitle: string;
  onlineRevenueHint: string;
  paymentTotal: string;
  kpiAllOrders: string;
  kpiPosOrders: string;
  kpiOnlineOrders: string;
  kpiOrders: string;
  kpiReceipts: string;
  kpiRefunds: string;
  kpiOpenShift: string;
  kpiPosRevenue: string;
  kpiOnlineRevenue: string;
  kpiTotalRevenue: string;
  openShiftYes: string;
  openShiftNo: string;
  paymentCash: string;
  paymentCard: string;
  paymentVoucher: string;
  paymentOther: string;
  onlineCashPaid: string;
  onlineCardPaid: string;
  onlinePaidOnline: string;
  onlinePending: string;
  onlinePaidTotal: string;
  posOrdersTitle: string;
  onlineOrdersTitle: string;
  onlineOrdersEmpty: string;
  unknownProvider: string;
  allReceipts: string;
  colTime: string;
  colOrderNumber: string;
  colStatus: string;
  colPayment: string;
  colAmount: string;
  colCashier: string;
  colDevice: string;
  colReceipt: string;
  colCustomer: string;
  colProvider: string;
  colFiscal: string;
  ordersEmpty: string;
  receiptsEmpty: string;
  dash: string;
  statusLabels: {
    new: string;
    accepted: string;
    open: string;
    in_progress: string;
    ready: string;
    delivered: string;
    completed: string;
    cancelled: string;
    refunded: string;
  };
};

export type ReportsDocumentInput = {
  meta: DocumentMeta;
  labels: ReportsDocumentLabels;
  summary: PortalReportsSummary;
};

export type OrdersDocumentInput = {
  meta: DocumentMeta;
  labels: OrdersDocumentLabels;
  sales: PortalOrdersResponse;
};

export type ReceiptDocumentLabels = PdfDocumentLabels & {
  docTitle: string;
  receiptDetails: string;
  fiscalPendingNote: string;
  itemsTitle: string;
  itemsEmpty: string;
  colProduct: string;
  colQuantity: string;
  colUnitPrice: string;
  colLineTotal: string;
  colReceipt: string;
  colTime: string;
  colCustomer: string;
  colPayment: string;
  colFiscal: string;
  colAmount: string;
  colDevice: string;
  paymentCash: string;
  paymentCard: string;
  paymentVoucher: string;
  paymentOther: string;
  dash: string;
};

export type ReceiptDocumentInput = {
  meta: DocumentMeta;
  labels: ReceiptDocumentLabels;
  receipt: import("../portalApi").PortalReceiptRecord;
};

/** Reserved for a future print action alongside export. */
export type DocumentDeliveryMode = "export" | "print";
