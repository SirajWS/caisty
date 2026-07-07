import type { PosHubTone } from "../posHub/types";
import type { PosReleaseConfig } from "../../config/posConfig";
import type {
  PortalBusinessProfile,
  PortalCustomer,
  PortalDevice,
  PortalLicense,
} from "../portalApi";

export type DeviceKpi = {
  id: string;
  label: string;
  value: string;
  hint?: string;
};

export type DeviceCardStatus = "online" | "offline" | "warning";

export type DeviceCardView = {
  id: string;
  name: string;
  platform: string;
  version: string;
  currentUser: string;
  heartbeat: string;
  lastSync: string;
  connection: string;
  cloudStatus: string;
  environment: string;
  license: string;
  store: string;
  status: DeviceCardStatus;
  statusLabel: string;
  statusTone: PosHubTone;
  source: PortalDevice;
};

/** Compact seat/plan summary for the Device Management header. */
export type DeviceSeatSummaryView = {
  plan: string;
  planLabel: string;
  hasLicense: boolean;
  maxDevices: number;
  usedDevices: number;
  availableSlots: number;
  percent: number;
};

/** A single slot in the device management grid: a registered device or a free seat. */
export type DeviceSlotView =
  | { kind: "device"; id: string; card: DeviceCardView }
  | { kind: "empty"; id: string };

export type DeviceDetailView = {
  deviceId: string;
  hostname: string;
  platform: string;
  architecture: string;
  installedVersion: string;
  latestVersion: string;
  lastHeartbeat: string;
  cloudConnected: string;
  environment: string;
  license: string;
  store: string;
  business: string;
};

export type DeviceTimelineEvent = {
  id: string;
  kind:
    | "pos_started"
    | "pos_closed"
    | "cloud_synced"
    | "device_connected"
    | "device_disconnected"
    | "update_installed"
    | "printer_connected"
    | "fiscal_connected";
  label: string;
  at: string;
};

export type DeviceHealthStatus = "online" | "offline" | "unknown";

export type DeviceHealthItem = {
  id: string;
  label: string;
  status: DeviceHealthStatus;
  statusLabel: string;
};

export type RemoteAction = {
  id: string;
  label: string;
  disabled: boolean;
  badge?: string;
  action?: "desktop_protocol";
};

export type VersionManagementView = {
  latestVersion: string;
  installedVersion: string;
  updateAvailable: boolean;
  updateAvailableLabel: string;
  releaseDate: string;
  downloadUrl: string;
  releaseNotes: string;
  releaseNotesUrl?: string;
  updateTone: PosHubTone;
};

export type DeviceAlert = {
  id: string;
  tone: PosHubTone;
  message: string;
};

export type MultiStorePlaceholder = {
  title: string;
  description: string;
  stores: string[];
};

export type DevicesData = {
  licenses: PortalLicense[];
  devices: PortalDevice[];
  business: PortalBusinessProfile | null;
  customer: PortalCustomer;
  loading: boolean;
  error: boolean;
  lastSyncedAt: Date | null;
};

/** Serializable snapshot — ready for WebSocket merge later. */
export type DevicesDerivedState = {
  overview: DeviceKpi[];
  devices: DeviceCardView[];
  alerts: DeviceAlert[];
  version: VersionManagementView;
  multiStore: MultiStorePlaceholder;
  health: DeviceHealthItem[];
  hasDevices: boolean;
  seats: DeviceSeatSummaryView;
  slots: DeviceSlotView[];
};

export type DeriveDevicesInput = {
  data: DevicesData;
  release: PosReleaseConfig;
  environmentLabel: string;
  locale: string;
  t: import("../translations/portal").PortalTranslations;
};
