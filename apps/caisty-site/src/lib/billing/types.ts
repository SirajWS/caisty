import type {
  PortalBusinessProfile,
  PortalCustomer,
  PortalInvoice,
  PortalLicense,
} from "../portalApi";

export type BillingKpi = {
  id: string;
  label: string;
  value: string;
  hint?: string;
};

export type BillingField = {
  id: string;
  label: string;
  value: string;
};

export type BillingPlaceholderAction = {
  id: string;
  label: string;
  disabled: boolean;
  badge?: string;
  href?: string;
  onClick?: () => void;
  busy?: boolean;
};

export type BillingDerivedState = {
  overview: BillingKpi[];
  paymentPlaceholders: BillingField[];
  vatFields: BillingField[];
  quickActions: BillingPlaceholderAction[];
  downloadActions: BillingPlaceholderAction[];
};

export type DeriveBillingInput = {
  customer: PortalCustomer;
  primaryLicense: PortalLicense | null;
  licensesLoading: boolean;
  business: PortalBusinessProfile | null;
  businessLoading: boolean;
  currency: string;
  locale: string;
  t: import("../translations/portal").PortalTranslations;
};

export type BillingData = {
  licenses: PortalLicense[];
  invoices: PortalInvoice[];
  business: PortalBusinessProfile | null;
  licensesLoading: boolean;
  invoicesLoading: boolean;
  businessLoading: boolean;
  licensesError: string | null;
  invoicesError: string | null;
};
