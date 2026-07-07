import type { PortalTranslations } from "../translations/portal";
import type { PosReleaseConfig } from "../../config/posConfig";
import type {
  PortalBusinessProfile,
  PortalCustomer,
  PortalDevice,
  PortalInvoice,
  PortalLicense,
} from "../portalApi";

export type PosHubTone = "ok" | "attention" | "action_required" | "unknown";

export type PosHubNotification = {
  id: string;
  tone: PosHubTone;
  message: string;
  href?: string;
};

export type PosHubReadinessItem = {
  id: string;
  label: string;
  statusLabel: string;
  tone: PosHubTone;
  done: boolean;
  href: string;
};

export type PosHubLicenseView = {
  planLabel: string;
  statusLabel: string;
  statusTone: PosHubTone;
  validUntilLabel: string;
  showUpgrade: boolean;
  upgradeHref: string;
  maxDevices: number | null;
};

export type PosHubVersionView = {
  installed: string | null;
  installedLabel: string;
  latest: string;
  updateStatusLabel: string;
  updateTone: PosHubTone;
  updateAvailable: boolean;
};

export type PosHubSystemStatus = {
  cloudApiLabel: string;
  cloudApiTone: PosHubTone;
  portalLabel: string;
  portalTone: PosHubTone;
  environmentLabel: string;
  lastSyncLabel: string;
};

export type PosHubSummaryView = {
  posStatusLabel: string;
  posStatusTone: PosHubTone;
  licensePlanLabel: string;
  devicesShortLabel: string;
};

export type PosHubData = {
  licenses: PortalLicense[];
  devices: PortalDevice[];
  invoices: PortalInvoice[];
  business: PortalBusinessProfile | null;
  customer: PortalCustomer;
  loading: boolean;
  error: boolean;
  lastSyncedAt: Date | null;
};

export type DerivePosHubInput = {
  data: PosHubData;
  release: PosReleaseConfig;
  t: PortalTranslations;
  environmentLabel: string;
};

export type PosHubDerivedState = {
  release: PosReleaseConfig;
  summary: PosHubSummaryView;
  version: PosHubVersionView;
  license: PosHubLicenseView;
  readiness: PosHubReadinessItem[];
  notifications: PosHubNotification[];
  system: PosHubSystemStatus;
};
