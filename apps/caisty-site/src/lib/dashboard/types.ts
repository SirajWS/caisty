import type { PosReleaseConfig } from "../../config/posConfig";
import type { PosHubNotification, PosHubTone } from "../posHub/types";
import type { PortalTranslations } from "../translations/portal";
import type {
  PortalBusinessProfile,
  PortalCustomer,
  PortalDashboardSummary,
  PortalDevice,
  PortalInvoice,
  PortalLicense,
} from "../portalApi";

export type DashboardKpiStatus = "value" | "coming_soon" | "waiting_sync" | "empty";

export type DashboardKpi = {
  id: string;
  label: string;
  value: string;
  hint?: string;
  hintAccent?: boolean;
  status: DashboardKpiStatus;
  href?: string;
};

export type DashboardHealthItem = {
  id: string;
  label: string;
  done: boolean;
  tone: PosHubTone;
};

export type DashboardHealth = {
  score: number;
  items: DashboardHealthItem[];
};

export type DashboardActivityKind =
  | "invoice_paid"
  | "invoice_open"
  | "device_connected"
  | "license_activated"
  | "cloud_synced"
  | "pos_connected";

export type DashboardActivity = {
  id: string;
  kind: DashboardActivityKind;
  label: string;
  at: string;
  href?: string;
};

export type DashboardQuickAction = {
  id: string;
  label: string;
  href?: string;
  disabled?: boolean;
  badge?: string;
  external?: boolean;
  onClick?: "desktop_protocol";
};

export type DashboardRoadmapModule = {
  id: string;
  label: string;
  href: string;
  available: boolean;
};

export type LiveStoreStatusItem = {
  id: string;
  label: string;
  value: string;
  tone: PosHubTone;
};

export type BusinessAlert = {
  id: string;
  severity: PosHubTone;
  icon: "update" | "license" | "fiscal" | "device" | "sync" | "profile" | "cloud";
  message: string;
  actionLabel?: string;
  href?: string;
};

export type RemoteAction = {
  id: string;
  label: string;
  description: string;
  enabled: boolean;
  onClick?: "desktop_protocol";
  href?: string;
  badge?: string;
};

export type StoreSnapshot = {
  storeName: string;
  country: string;
  currency: string;
  fiscalProvider: string;
  license: string;
  posVersion: string;
  environment: string;
  cloudStatus: string;
  cloudTone: PosHubTone;
  profileStatus: string;
  profileTone: PosHubTone;
};

export type LiveDeviceCard = {
  id: string;
  name: string;
  platform: string;
  version: string;
  lastHeartbeat: string;
  status: string;
  license: string;
  environment: string;
  statusTone: PosHubTone;
};

export type LiveReleaseCenter = {
  latestVersion: string;
  installedVersion: string;
  releaseDate: string;
  installerName: string;
  installerSize: string;
  updateStatus: string;
  updateTone: PosHubTone;
  releaseNotes: string;
  downloadUrl: string;
  releaseNotesUrl?: string;
};

export type SystemHealthItem = {
  id: string;
  label: string;
  value: string;
  tone: PosHubTone;
  healthy: boolean;
};

export type PortalDashboardRecentOrder = {
  id: string;
  time: string;
  orderNumber: string;
  status: string;
  statusKey: string;
  payment: string;
  amount: string;
  receiptNumber: string;
  isProviderOrder?: boolean;
  providerName?: string | null;
};

export type DashboardData = {
  licenses: PortalLicense[];
  devices: PortalDevice[];
  invoices: PortalInvoice[];
  business: PortalBusinessProfile | null;
  customer: PortalCustomer;
  salesSummary: PortalDashboardSummary | null;
  salesSummaryError: boolean;
  loading: boolean;
  error: boolean;
  lastSyncedAt: Date | null;
};

export type DeriveDashboardInput = {
  data: DashboardData;
  release: PosReleaseConfig;
  t: PortalTranslations;
  environmentLabel: string;
  locale: string;
};

export type DashboardDerivedState = {
  businessName: string;
  businessOnline: boolean;
  kpis: DashboardKpi[];
  health: DashboardHealth;
  activities: DashboardActivity[];
  notifications: PosHubNotification[];
  quickActions: DashboardQuickAction[];
  roadmap: DashboardRoadmapModule[];
  release: PosReleaseConfig;
  storeStatus: LiveStoreStatusItem[];
  alerts: BusinessAlert[];
  remoteActions: RemoteAction[];
  snapshot: StoreSnapshot;
  liveDevices: LiveDeviceCard[];
  releaseCenter: LiveReleaseCenter;
  systemHealth: SystemHealthItem[];
  recentOrders: PortalDashboardRecentOrder[];
  paymentSummary: import("../portalApi").PortalOrdersPaymentSummary | null;
  onlinePaymentSummary: import("../portalApi").PortalOnlinePaymentSummary | null;
  onlineRevenueHeader: import("../portal/derivePaymentSummaryCards").PaymentSummaryRevenueHeader;
  paymentCards: import("../orders/types").PaymentMethodCard[];
  onlinePaymentCards: import("../orders/types").PaymentMethodCard[];
  hasSalesData: boolean;
};
