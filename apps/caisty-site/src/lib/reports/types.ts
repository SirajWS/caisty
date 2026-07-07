import type { PosHubTone } from "../posHub/types";
import type { DashboardData } from "../dashboard/types";

export type ReportsKpi = {
  id: string;
  label: string;
  value: string;
  hint?: string;
};

export type RevenueTimeRange = "today" | "7d" | "30d" | "12m" | "all";

export type RevenueChartState = {
  range: RevenueTimeRange;
  hasData: boolean;
  placeholderMessage: string;
};

export type HourlyBar = {
  hour: string;
  value: number | null;
};

export type HourlySalesState = {
  bars: HourlyBar[];
  placeholderMessage: string;
};

export type PaymentMethodStat = {
  id: string;
  label: string;
  value: string;
  tone: PosHubTone;
};

export type TopProductRow = {
  id: string;
  name: string;
  quantity: string;
  revenue: string;
  category: string;
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
  revenueChart: RevenueChartState;
  hourlySales: HourlySalesState;
  paymentMethods: PaymentMethodStat[];
  topProducts: TopProductRow[];
  topEmployees: TopEmployeeRow[];
  taxes: TaxCard[];
  trends: TrendCard[];
  exports: ReportExportAction[];
  hasPosSync: boolean;
};

export type DeriveReportsInput = {
  data: DashboardData;
  t: import("../translations/portal").PortalTranslations;
};
