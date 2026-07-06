import type {
  PortalBusinessProfile,
  PortalCustomer,
  PortalDevice,
  PortalLicense,
  PortalSupportMessage,
} from "../portalApi";

export type SupportKpi = {
  id: string;
  label: string;
  value: string;
  hint?: string;
};

export type ServiceStatusTone = "operational" | "coming_soon" | "unknown" | "not_configured";

export type ServiceStatusItem = {
  id: string;
  label: string;
  value: string;
  tone: ServiceStatusTone;
};

export type HelpCategory = {
  id: string;
  label: string;
  badge: string;
  href?: string;
};

export type SupportPlaceholderAction = {
  id: string;
  label: string;
  disabled: boolean;
  badge?: string;
  href?: string;
  onClickId?: string;
};

export type SupportContactOption = {
  id: string;
  label: string;
  value: string;
  href?: string;
};

export type KnowledgeBaseItem = {
  id: string;
  label: string;
  badge: string;
};

export type RemoteSupportItem = {
  id: string;
  label: string;
  status: string;
  tone: ServiceStatusTone;
};

export type SupportDerivedState = {
  overview: SupportKpi[];
  helpCategories: HelpCategory[];
  quickActions: SupportPlaceholderAction[];
  systemStatus: ServiceStatusItem[];
  remoteSupport: RemoteSupportItem[];
  contactOptions: SupportContactOption[];
  knowledgeBase: KnowledgeBaseItem[];
};

export type DeriveSupportInput = {
  customer: PortalCustomer;
  messages: PortalSupportMessage[];
  messagesLoading: boolean;
  messagesError: boolean;
  licenses: PortalLicense[];
  licensesLoading: boolean;
  devices: PortalDevice[];
  devicesLoading: boolean;
  business: PortalBusinessProfile | null;
  businessLoading: boolean;
  locale: string;
  t: import("../translations/portal").PortalTranslations;
};
