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
  subscriptionSummary: SubscriptionSummaryView;
  paymentPlaceholders: BillingField[];
  vatFields: BillingField[];
  quickActions: BillingPlaceholderAction[];
  downloadActions: BillingPlaceholderAction[];
  showUpgradePlans: boolean;
};

/** Compact subscription view for the billing center header card. */
export type SubscriptionSummaryView = {
  hasLicense: boolean;
  planLabel: string;
  statusLabel: string;
  intervalLabel: string | null;
  validUntilLabel: string;
  licenseKey: string | null;
  showPaymentEmpty: boolean;
  showManageSubscription: boolean;
};

export type DeriveBillingInput = {
  customer: PortalCustomer;
  primaryLicense: PortalLicense | null;
  licenses: PortalLicense[];
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
