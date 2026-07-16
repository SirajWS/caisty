import type { PosHubTone } from "../posHub/types";
import type { PaymentMethodCard } from "../orders/types";
import type { PaymentSummaryRevenueHeader } from "../portal/derivePaymentSummaryCards";
import type { PortalCustomer, PortalDevice, PortalReportsSummary } from "../portalApi";
import type { ReportsPeriodId } from "./reportsPeriod";

export type ReportsKpi = {
  id: string;
  label: string;
  value: string;
  hint?: string;
};

export type RevenueTimeRange = "today" | "7d" | "30d" | "12m" | "all";

export type RevenueSeriesGranularity = "hour" | "day" | "month";

export type RevenueSeriesPoint = {
  label: string;
  bucketStart: string;
  revenueMinor: number;
  ordersCount: number;
};

export type RevenueChartState = {
  range: RevenueTimeRange;
  hasData: boolean;
  placeholderMessage: string;
  series: RevenueSeriesPoint[];
  totalValue: string;
  currency: string;
  locale: string;
  granularity: RevenueSeriesGranularity;
  granularityLabel: string;
  ordersLabel: string;
  ariaLabel: string;
};

export type HourlyBar = {
  hour: string;
  value: number | null;
  tooltip?: string;
};

export type HourlySalesState = {
  bars: HourlyBar[];
  placeholderMessage: string;
};

/** @deprecated Prefer PaymentMethodCard from shared payment helpers. */
export type PaymentMethodStat = {
  id: string;
  label: string;
  value: string;
  tone: PosHubTone;
};

export type TopProductRow = {
  id: string;
  rank: number;
  name: string;
  quantity: string;
  revenue: string;
  share: string;
};

export type TopEmployeeRow = {
  id: string;
  name: string;
  orders: string;
  revenue: string;
  avgOrder: string;
};

export type TaxCard = {
  id: string;
  label: string;
  value: string;
  tone: PosHubTone;
};

export type TrendCard = {
  id: string;
  label: string;
  value: string;
};

export type ReportExportAction = {
  id: string;
  label: string;
  disabled: boolean;
  badge?: string;
};

/** Serializable snapshot — ready for WebSocket merge later. */
export type ReportsDerivedState = {
  overview: ReportsKpi[];
  revenueBreakdown: ReportsKpi[];
  orderBreakdown: ReportsKpi[];
  revenueChart: RevenueChartState;
  hourlySales: HourlySalesState;
  showHourlySales: boolean;
  posPaymentCards: PaymentMethodCard[];
  onlinePaymentCards: PaymentMethodCard[];
  onlineRevenueHeader: PaymentSummaryRevenueHeader;
  topProducts: TopProductRow[];
  topEmployees: TopEmployeeRow[];
  taxes: TaxCard[];
  trends: TrendCard[];
  exports: ReportExportAction[];
  hasPosSync: boolean;
};

export type ReportsData = {
  devices: PortalDevice[];
  reportsSummary: PortalReportsSummary | null;
  customer: PortalCustomer;
  period: ReportsPeriodId;
  loading: boolean;
  error: boolean;
  lastSyncedAt: Date | null;
};

export type DeriveReportsInput = {
  data: ReportsData;
  t: import("../translations/portal").PortalTranslations;
  locale: string;
};
