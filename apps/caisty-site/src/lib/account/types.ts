import type { PortalCustomer } from "../portalApi";

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

export type LegalDocumentLink = {
  id: string;
  title: string;
  path: string;
};

export type AccountDerivedState = {
  overview: AccountKpi[];
  session: AccountField[];
  preferences: AccountField[];
  checklist: SecurityChecklistItem[];
  legalDocuments: LegalDocumentLink[];
  dataActions: AccountPlaceholderAction[];
};

export type DeriveAccountInput = {
  customer: PortalCustomer;
  languageLabel: string;
  themeLabel: string;
  securityStatusLabel: string;
  emailStatusLabel: string;
  roleLabel: string;
  browserLabel: string | null;
  t: import("../translations/portal").PortalTranslations;
};

export type AccountData = {
  customer: PortalCustomer;
};
