import type { PortalCustomer } from "../portalApi";

export type SecurityStatusTone = "ok" | "attention" | "unknown";

export type SecurityStatusItem = {
  id: string;
  label: string;
  value: string;
  tone: SecurityStatusTone;
};

export type LegalDocumentLink = {
  id: string;
  title: string;
  shortTitle: string;
  path: string;
};

export type AccountDerivedState = {
  securityStatus: SecurityStatusItem[];
  legalDocuments: LegalDocumentLink[];
  supportHref: string;
};

export type DeriveAccountInput = {
  customer: PortalCustomer;
  securityStatusLabel: string;
  emailStatusLabel: string;
  t: import("../translations/portal").PortalTranslations;
};

export type AccountData = {
  customer: PortalCustomer;
};

/** Legacy types — unused by account page after Sprint 1.4 cleanup */
export type AccountKpi = {
  id: string;
  label: string;
  value: string;
  hint?: string;
};

export type AccountField = {
  id: string;
  label: string;
  value: string;
};

export type ChecklistStatus = "complete" | "pending" | "coming_soon";

export type SecurityChecklistItem = {
  id: string;
  label: string;
  status: ChecklistStatus;
  statusLabel: string;
};

export type AccountPlaceholderAction = {
  id: string;
  label: string;
  disabled: boolean;
  badge?: string;
  href?: string;
};
