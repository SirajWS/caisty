import type {
  PortalBusinessProfile,
  PortalCustomer,
  PortalDevice,
  PortalInvoice,
  PortalLicense,
} from "../portalApi";

export type BusinessField = {
  id: string;
  label: string;
  value: string;
};

export type BusinessSetupProgress = {
  percent: number;
  missingItems: string[];
  complete: boolean;
};

export type BusinessData = {
  business: PortalBusinessProfile | null;
  licenses: PortalLicense[];
  devices: PortalDevice[];
  invoices: PortalInvoice[];
  customer: PortalCustomer;
  loading: boolean;
  error: boolean;
  lastSyncedAt: Date | null;
};

/** Serializable snapshot — ready for WebSocket merge later. */
export type BusinessDerivedState = {
  setup: BusinessSetupProgress;
  fiscalSummary: BusinessField[];
  hasProfile: boolean;
};

export type DeriveBusinessInput = {
  data: BusinessData;
  environmentLabel: string;
  locale: string;
  t: import("../translations/portal").PortalTranslations;
};

/** @deprecated Legacy types kept for unused components — not used by deriveBusinessState. */
export type BusinessKpi = {
  id: string;
  label: string;
  value: string;
  hint?: string;
};

export type ChecklistStatus = "complete" | "incomplete" | "pending";

export type ChecklistItem = {
  id: string;
  label: string;
  status: ChecklistStatus;
  statusLabel: string;
};

export type BusinessQuickAction = {
  id: string;
  label: string;
  disabled: boolean;
  badge?: string;
  action?: "scroll_to_edit";
};

export type FutureModule = {
  id: string;
  label: string;
};

export type CloudStatusView = {
  cloudConnected: string;
  lastSync: string;
  posConnected: string;
  apiStatus: string;
};
