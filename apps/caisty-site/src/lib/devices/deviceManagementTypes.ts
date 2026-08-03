import type { PortalDeviceAllowedAction } from "./portalDeviceApi";

export type DeviceManagementSeatView = {
  planLabel: string;
  hasLicense: boolean;
  maxDevices: number | null;
  unlimitedDevices: boolean;
  usedDevices: number;
  availableSlots: number;
  percent: number;
  overLimit: boolean;
  activeCount: number;
  blockedCount: number;
  pendingCount: number;
  rejectedCount: number;
  releasedCount: number;
};

export type DeviceManagementCardView = {
  id: string;
  name: string;
  lifecycleStatus: string;
  lifecycleLabel: string;
  lifecycleBadgeClass: string;
  connectivityLabel: string;
  typeLabel: string;
  createdAtLabel: string;
  lastContactLabel: string;
  fingerprintMasked: string | null;
  appVersion: string;
  licensePlan: string;
  statusDescription: string;
  allowedActions: PortalDeviceAllowedAction[];
  isHistorical: boolean;
};

export type DeviceManagementDerivedState = {
  seats: DeviceManagementSeatView;
  devices: DeviceManagementCardView[];
  hasDevices: boolean;
  hasActionableDevices: boolean;
  canApproveNew: boolean;
};

export type DeviceDialogKind =
  | "approve"
  | "reject"
  | "block"
  | "unblock"
  | "release";

export type DeviceDialogState = {
  deviceId: string;
  deviceName: string;
  kind: DeviceDialogKind;
} | null;
