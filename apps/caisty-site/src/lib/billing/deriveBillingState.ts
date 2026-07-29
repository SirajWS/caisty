import { getActivePaidPlanTier, pickPrimaryPortalLicense } from "../portalLicensePick";
import type { BillingDerivedState, DeriveBillingInput, SubscriptionSummaryView } from "./types";

function notConfigured(t: DeriveBillingInput["t"]): string {
  return t.billing.center.notConfigured;
}

function planLabel(plan: string | undefined, t: DeriveBillingInput["t"]): string {
  if (!plan) return notConfigured(t);
  const p = plan.trim().toLowerCase();
  if (p === "trial") return t.plan.trialTitle;
  if (p === "starter") return t.pos.planStarter;
  if (p === "pro") return t.pos.planPro;
  if (p === "business") return t.pos.planBusiness;
  if (p === "enterprise") return t.pos.planEnterprise;
  return plan;
}

function licenseStatusLabel(status: string, t: DeriveBillingInput["t"]): string {
  const s = status.trim().toLowerCase();
  const l = t.licenses;
  if (s === "active") return l.statusActive;
  if (s === "revoked" || s === "blocked") return l.statusRevoked;
  if (s === "expired") return l.statusExpired;
  if (s === "inactive") return l.statusInactive;
  return status.trim() || l.statusUnknown;
}

function billingIntervalLabel(
  period: "monthly" | "yearly" | null | undefined,
  t: DeriveBillingInput["t"],
): string {
  if (period === "yearly") return t.labels.yearly;
  if (period === "monthly") return t.labels.monthly;
  return notConfigured(t);
}

function providerLabel(input: DeriveBillingInput): string {
  if (input.customer.stripeBillingPortalEligible) return "Stripe";
  return notConfigured(input.t);
}

function formatDate(
  value: string | null | undefined,
  locale: string,
  dash: string,
): string {
  if (!value) return dash;
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return dash;
  return d.toLocaleString(locale);
}

function deriveOverview(input: DeriveBillingInput): BillingDerivedState["overview"] {
  const c = input.t.billing.center;
  const license = input.primaryLicense;
  const dash = input.t.labels.dash;

  if (input.licensesLoading) {
    return [
      { id: "plan", label: c.kpiCurrentPlan, value: dash },
      { id: "status", label: c.kpiStatus, value: dash },
      { id: "key", label: c.kpiLicenseKey, value: dash },
      { id: "valid", label: c.kpiValidUntil, value: dash },
      { id: "interval", label: c.kpiBillingInterval, value: dash },
      { id: "provider", label: c.kpiProvider, value: dash },
    ];
  }

  return [
    {
      id: "plan",
      label: c.kpiCurrentPlan,
      value: license ? planLabel(license.plan, input.t) : notConfigured(input.t),
    },
    {
      id: "status",
      label: c.kpiStatus,
      value: license?.status?.trim() || notConfigured(input.t),
    },
    {
      id: "key",
      label: c.kpiLicenseKey,
      value: license?.key?.trim() || notConfigured(input.t),
    },
    {
      id: "valid",
      label: c.kpiValidUntil,
      value: formatDate(license?.validUntil, input.locale, dash),
    },
    {
      id: "interval",
      label: c.kpiBillingInterval,
      value:
        license &&
        (license.plan === "starter" ||
          license.plan === "pro" ||
          license.plan === "business")
          ? billingIntervalLabel(input.customer.paidBillingPeriod, input.t)
          : notConfigured(input.t),
    },
    {
      id: "provider",
      label: c.kpiProvider,
      value: providerLabel(input),
    },
  ];
}

function deriveVatFields(input: DeriveBillingInput): BillingDerivedState["vatFields"] {
  const c = input.t.billing.center;
  const b = input.business;

  if (input.businessLoading) {
    return [
      { id: "vat", label: c.fieldVatConfiguration, value: input.t.labels.dash },
      { id: "country", label: c.fieldBillingCountry, value: input.t.labels.dash },
      { id: "currency", label: c.fieldCurrency, value: input.t.labels.dash },
      { id: "tax", label: c.fieldTaxMode, value: input.t.labels.dash },
    ];
  }

  const vatConfigured = b?.vatId?.trim();
  const country = b?.country?.trim();
  const currency = b?.currency?.trim() || input.currency;
  const taxMode =
    b?.receiptMode === "certified" || b?.receiptMode === "certified_germany"
      ? c.taxModeCertified
      : b?.receiptMode === "standard_until_certified"
        ? c.taxModeStandardUntilCertified
        : b?.receiptMode === "standard"
          ? c.taxModeStandard
          : notConfigured(input.t);

  return [
    {
      id: "vat",
      label: c.fieldVatConfiguration,
      value: vatConfigured || notConfigured(input.t),
    },
    {
      id: "country",
      label: c.fieldBillingCountry,
      value: country
        ? (input.t.business.countries[
            country as keyof typeof input.t.business.countries
          ] ?? country)
        : notConfigured(input.t),
    },
    {
      id: "currency",
      label: c.fieldCurrency,
      value: currency || notConfigured(input.t),
    },
    {
      id: "tax",
      label: c.fieldTaxMode,
      value: b ? taxMode : notConfigured(input.t),
    },
  ];
}

function derivePaymentPlaceholders(
  input: DeriveBillingInput,
): BillingDerivedState["paymentPlaceholders"] {
  const c = input.t.billing.center;
  const comingSoon = c.comingSoon;

  return [
    { id: "method", label: c.paymentMethod, value: comingSoon },
    { id: "stripe", label: "Stripe", value: comingSoon },
    { id: "paypal", label: "PayPal", value: comingSoon },
    { id: "sepa", label: "SEPA", value: comingSoon },
  ];
}

function deriveQuickActions(input: DeriveBillingInput): BillingDerivedState["quickActions"] {
  const c = input.t.billing.center;
  const comingSoon = c.comingSoon;
  const supportEmail =
    import.meta.env.VITE_PUBLIC_SUPPORT_EMAIL ?? "support@caisty.com";

  const actions: BillingDerivedState["quickActions"] = [
    {
      id: "upgrade",
      label: c.actionUpgradePlan,
      disabled: false,
      href: "#billing-plans",
    },
  ];

  if (input.customer.stripeBillingPortalEligible) {
    actions.push({
      id: "manage",
      label: input.t.plan.manageSubscription,
      disabled: false,
    });
  } else {
    actions.push({
      id: "manage",
      label: c.actionManageSubscription,
      disabled: true,
      badge: comingSoon,
    });
  }

  actions.push(
    {
      id: "portal",
      label: c.actionBillingPortal,
      disabled: !input.customer.stripeBillingPortalEligible,
      badge: input.customer.stripeBillingPortalEligible ? undefined : comingSoon,
    },
    {
      id: "contact",
      label: c.actionContactBilling,
      disabled: false,
      href: `mailto:${supportEmail}`,
    },
  );

  return actions;
}

function deriveDownloadActions(input: DeriveBillingInput): BillingDerivedState["downloadActions"] {
  const c = input.t.billing.center;
  const comingSoon = c.comingSoon;

  return [
    { id: "invoice", label: c.downloadInvoice, disabled: true, badge: comingSoon },
    { id: "receipt", label: c.downloadReceipt, disabled: true, badge: comingSoon },
    { id: "export", label: c.exportBillingHistory, disabled: true, badge: comingSoon },
  ];
}

/** Always show the catalog plan cards (active plan is marked on the cards). */
export function shouldShowUpgradePlans(
  _licenses: DeriveBillingInput["licenses"],
  _paidPeriod: "monthly" | "yearly" | null | undefined,
): boolean {
  return true;
}

function deriveSubscriptionSummary(input: DeriveBillingInput): SubscriptionSummaryView {
  const c = input.t.billing.center;
  const license = input.primaryLicense;
  const dash = input.t.labels.dash;
  const stripeEligible = !!input.customer.stripeBillingPortalEligible;
  const activePaid = getActivePaidPlanTier(input.licenses);

  if (input.licensesLoading) {
    return {
      hasLicense: false,
      planLabel: dash,
      statusLabel: dash,
      intervalLabel: null,
      validUntilLabel: dash,
      licenseKey: null,
      showPaymentEmpty: false,
      showManageSubscription: stripeEligible,
    };
  }

  return {
    hasLicense: Boolean(license),
    planLabel: license ? planLabel(license.plan, input.t) : c.noActivePlan,
    statusLabel: license ? licenseStatusLabel(license.status ?? "", input.t) : dash,
    intervalLabel:
      license &&
      (license.plan === "starter" ||
        license.plan === "pro" ||
        license.plan === "business")
        ? billingIntervalLabel(input.customer.paidBillingPeriod, input.t)
        : null,
    validUntilLabel: formatDate(license?.validUntil, input.locale, dash),
    licenseKey: license?.key?.trim() || null,
    showPaymentEmpty: !stripeEligible && !activePaid,
    showManageSubscription: stripeEligible,
  };
}

export function deriveBillingState(input: DeriveBillingInput): BillingDerivedState {
  return {
    overview: deriveOverview(input),
    subscriptionSummary: deriveSubscriptionSummary(input),
    paymentPlaceholders: derivePaymentPlaceholders(input),
    vatFields: deriveVatFields(input),
    quickActions: deriveQuickActions(input),
    downloadActions: deriveDownloadActions(input),
    showUpgradePlans: shouldShowUpgradePlans(input.licenses, input.customer.paidBillingPeriod),
  };
}

export function pickBillingPrimaryLicense(
  licenses: import("../portalApi").PortalLicense[],
): import("../portalApi").PortalLicense | null {
  return pickPrimaryPortalLicense(licenses);
}
