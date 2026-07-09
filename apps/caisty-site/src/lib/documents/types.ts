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
  paymentMethods: string;
  paymentCash: string;
  paymentCard: string;
  paymentVoucher: string;
  paymentOther: string;
  topProducts: string;
  colProduct: string;
  colQuantity: string;
  colCategory: string;
  topEmployees: string;
  colEmployee: string;
  colOrders: string;
  colAvgOrder: string;
  topEmployeesEmpty: string;
  taxes: string;
  taxNetRevenue: string;
  taxVat: string;
  taxGrossRevenue: string;
  taxFiscalReceipts: string;
  businessTrends: string;
  trendBestDay: string;
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
  summary: string;
  kpiOrders: string;
  kpiReceipts: string;
  kpiRefunds: string;
  paymentSummary: string;
  paymentCash: string;
  paymentCard: string;
  paymentVoucher: string;
  paymentOther: string;
  allOrders: string;
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
  colFiscal: string;
  ordersEmpty: string;
  receiptsEmpty: string;
  dash: string;
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
