import { pickPrimaryPortalLicense } from "../portalLicensePick";
import { PORTAL_LEGAL_DOCUMENTS } from "../../config/portalLegalDocuments";
import type {
  DeriveSupportInput,
  ServiceStatusItem,
  ServiceStatusTone,
  SupportDerivedState,
} from "./types";

function c(input: DeriveSupportInput) {
  return input.t.support.center;
}

function comingSoon(input: DeriveSupportInput): string {
  return c(input).comingSoon;
}

function notConfigured(input: DeriveSupportInput): string {
  return c(input).notConfigured;
}

function noRequestsYet(input: DeriveSupportInput): string {
  return c(input).noRequestsYet;
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

function planLabel(plan: string | undefined, input: DeriveSupportInput): string {
  if (!plan) return notConfigured(input);
  if (plan === "trial") return input.t.plan.trialTitle;
  if (plan === "starter") return "Starter";
  if (plan === "pro") return "Pro";
  return plan;
}

function statusLabel(tone: ServiceStatusTone, input: DeriveSupportInput): string {
  const labels = c(input);
  if (tone === "operational") return labels.statusOperational;
  if (tone === "coming_soon") return labels.comingSoon;
  if (tone === "not_configured") return labels.notConfigured;
  return labels.statusUnknown;
}

function deriveOverview(input: DeriveSupportInput): SupportDerivedState["overview"] {
  const labels = c(input);
  const openCount = input.messages.filter(
    (m) => m.status === "open" || m.status === "in_progress",
  ).length;
  const latest = input.messages[0] ?? null;

  let supportStatus = noRequestsYet(input);
  if (input.messages.length > 0) {
    supportStatus = openCount > 0 ? labels.supportStatusActive : labels.supportStatusAvailable;
  }

  const primary =
    input.customer.primaryLicense ??
    pickPrimaryPortalLicense(input.licenses);

  const lastRequest =
    input.messagesLoading
      ? input.t.labels.dash
      : latest
        ? formatDate(latest.createdAt, input.locale, input.t.labels.dash)
        : noRequestsYet(input);

  return [
    {
      id: "open",
      label: labels.kpiOpenRequests,
      value: input.messagesLoading
        ? input.t.labels.dash
        : String(openCount),
    },
    {
      id: "last",
      label: labels.kpiLastRequest,
      value: lastRequest,
    },
    {
      id: "status",
      label: labels.kpiSupportStatus,
      value: input.messagesLoading ? input.t.labels.dash : supportStatus,
    },
    {
      id: "response",
      label: labels.kpiResponseTime,
      value: comingSoon(input),
    },
    {
      id: "plan",
      label: labels.kpiAccountPlan,
      value: input.licensesLoading
        ? input.t.labels.dash
        : primary
          ? planLabel(primary.plan, input)
          : notConfigured(input),
    },
    {
      id: "remote",
      label: labels.kpiRemoteSupport,
      value: comingSoon(input),
    },
  ];
}

function deriveSystemStatus(input: DeriveSupportInput): ServiceStatusItem[] {
  const labels = c(input);

  const portal: ServiceStatusItem = {
    id: "portal",
    label: labels.servicePortal,
    value: statusLabel("operational", input),
    tone: "operational",
  };

  const cloudApi: ServiceStatusItem = {
    id: "cloud_api",
    label: labels.serviceCloudApi,
    value: input.messagesLoading
      ? input.t.labels.dash
      : input.messagesError
        ? statusLabel("unknown", input)
        : statusLabel("operational", input),
    tone: input.messagesError ? "unknown" : "operational",
  };

  let posTone: ServiceStatusTone = "not_configured";
  if (!input.devicesLoading) {
    if (input.devices.length === 0) {
      posTone = "not_configured";
    } else if (input.devices.some((d) => d.status === "online")) {
      posTone = "operational";
    } else {
      posTone = "unknown";
    }
  }

  const posSync: ServiceStatusItem = {
    id: "pos_sync",
    label: labels.servicePosSync,
    value: input.devicesLoading ? input.t.labels.dash : statusLabel(posTone, input),
    tone: posTone,
  };

  const hasBilling =
    !!input.customer.stripeBillingPortalEligible ||
    input.licenses.some((l) => l.plan === "starter" || l.plan === "pro");
  const billingTone: ServiceStatusTone = input.licensesLoading
    ? "unknown"
    : hasBilling
      ? "operational"
      : "not_configured";

  const billing: ServiceStatusItem = {
    id: "billing",
    label: labels.serviceBilling,
    value: input.licensesLoading ? input.t.labels.dash : statusLabel(billingTone, input),
    tone: billingTone,
  };

  let fiscalTone: ServiceStatusTone = "not_configured";
  let fiscalValue = notConfigured(input);
  if (!input.businessLoading && input.business) {
    const provider =
      input.business.providerLabel?.trim() ||
      input.business.fiscalConfigurationLabel?.trim() ||
      input.business.fiscalProvider?.trim();
    if (provider) {
      fiscalValue = provider;
      fiscalTone =
        input.business.fiscalStatus === "active" ? "operational" : "unknown";
    }
  }

  const fiscal: ServiceStatusItem = {
    id: "fiscal",
    label: labels.serviceFiscal,
    value: input.businessLoading ? input.t.labels.dash : fiscalValue,
    tone: fiscalTone,
  };

  return [portal, cloudApi, posSync, billing, fiscal];
}

function deriveHelpCategories(input: DeriveSupportInput): SupportDerivedState["helpCategories"] {
  const labels = c(input);
  const badge = comingSoon(input);

  return [
    { id: "start", label: labels.categoryGettingStarted, badge, href: "/portal" },
    { id: "install", label: labels.categoryPosInstall, badge, href: "/portal/install" },
    { id: "license", label: labels.categoryLicense, badge, href: "/portal/licenses" },
    { id: "billing", label: labels.categoryBilling, badge, href: "/portal/billing" },
    { id: "fiscal", label: labels.categoryFiscal, badge, href: "/portal/business" },
    { id: "devices", label: labels.categoryDevices, badge, href: "/portal/devices" },
    { id: "reports", label: labels.categoryReports, badge, href: "/portal/reports" },
    { id: "account", label: labels.categoryAccount, badge, href: "/portal/account" },
  ];
}

function deriveQuickActions(input: DeriveSupportInput): SupportDerivedState["quickActions"] {
  const labels = c(input);
  const soon = comingSoon(input);
  const supportEmail =
    import.meta.env.VITE_PUBLIC_SUPPORT_EMAIL ?? "support@caisty.com";
  const billingEmail = import.meta.env.VITE_PUBLIC_BILLING_EMAIL as string | undefined;

  const actions: SupportDerivedState["quickActions"] = [
    {
      id: "open_request",
      label: labels.actionOpenRequest,
      disabled: false,
      onClickId: "scroll-form",
    },
    {
      id: "email",
      label: labels.actionEmailSupport,
      disabled: false,
      href: `mailto:${supportEmail}`,
    },
    {
      id: "docs",
      label: labels.actionDocumentation,
      disabled: true,
      badge: soon,
    },
    {
      id: "diagnostics",
      label: labels.actionDiagnostics,
      disabled: true,
      badge: soon,
    },
    {
      id: "remote",
      label: labels.actionRemoteSupport,
      disabled: true,
      badge: soon,
    },
  ];

  if (billingEmail?.trim()) {
    actions.push({
      id: "billing",
      label: labels.actionContactBilling,
      disabled: false,
      href: `mailto:${billingEmail.trim()}`,
    });
  } else {
    actions.push({
      id: "billing",
      label: labels.actionContactBilling,
      disabled: false,
      href: "/portal/billing",
    });
  }

  return actions;
}

function deriveRemoteSupport(input: DeriveSupportInput): SupportDerivedState["remoteSupport"] {
  const labels = c(input);
  const soon = comingSoon(input);

  return [
    { id: "diagnostics", label: labels.remoteDiagnostics, status: soon, tone: "coming_soon" },
    { id: "session", label: labels.remoteSession, status: soon, tone: "coming_soon" },
    { id: "pos_logs", label: labels.remotePosLogs, status: soon, tone: "coming_soon" },
    { id: "cloud_logs", label: labels.remoteCloudLogs, status: soon, tone: "coming_soon" },
    { id: "pin", label: labels.remoteSupportPin, status: soon, tone: "coming_soon" },
  ];
}

function deriveContactOptions(input: DeriveSupportInput): SupportDerivedState["contactOptions"] {
  const labels = c(input);
  const supportEmail =
    import.meta.env.VITE_PUBLIC_SUPPORT_EMAIL ?? "support@caisty.com";
  const billingEmail = import.meta.env.VITE_PUBLIC_BILLING_EMAIL as string | undefined;

  const options: SupportDerivedState["contactOptions"] = [
    {
      id: "support",
      label: labels.contactSupport,
      value: supportEmail,
      href: `mailto:${supportEmail}`,
    },
    {
      id: "billing",
      label: labels.contactBilling,
      value: billingEmail?.trim() || comingSoon(input),
      href: billingEmail?.trim() ? `mailto:${billingEmail.trim()}` : undefined,
    },
  ];

  for (const doc of PORTAL_LEGAL_DOCUMENTS) {
    if (doc.id === "terms" || doc.id === "privacy" || doc.id === "imprint") {
      options.push({
        id: doc.id,
        label: input.t.legal.documents[doc.id].title,
        value: labels.contactLegalLink,
        href: doc.path,
      });
    }
  }

  return options;
}

function deriveKnowledgeBase(input: DeriveSupportInput): SupportDerivedState["knowledgeBase"] {
  const labels = c(input);
  const badge = comingSoon(input);

  return [
    { id: "docs", label: labels.kbDocumentation, badge },
    { id: "guides", label: labels.kbSetupGuides, badge },
    { id: "faq", label: labels.kbFaq, badge },
  ];
}

export function deriveSupportState(input: DeriveSupportInput): SupportDerivedState {
  return {
    overview: deriveOverview(input),
    helpCategories: deriveHelpCategories(input),
    quickActions: deriveQuickActions(input),
    systemStatus: deriveSystemStatus(input),
    remoteSupport: deriveRemoteSupport(input),
    contactOptions: deriveContactOptions(input),
    knowledgeBase: deriveKnowledgeBase(input),
  };
}

export function sortSupportMessages(
  messages: import("../portalApi").PortalSupportMessage[],
): import("../portalApi").PortalSupportMessage[] {
  return [...messages].sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
}

export function supportMessageLastUpdate(
  message: import("../portalApi").PortalSupportMessage,
): string {
  return message.repliedAt ?? message.createdAt;
}
