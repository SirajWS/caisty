import { countOnlineDevices } from "../dashboard/deriveDashboardState";
import {
  isStepCompanyDone,
  isStepInstallDone,
  isStepLicensePlanDone,
} from "../derivePortalSetupSteps";
import { formatProviderLabel } from "../caistyTerminology";
import { deriveFiscalVisibility } from "../useFiscalVisibility";
import type {
  BusinessData,
  BusinessDerivedState,
  BusinessField,
  BusinessKpi,
  ChecklistItem,
  ChecklistStatus,
  DeriveBusinessInput,
} from "./types";

function notConfigured(t: DeriveBusinessInput["t"]): string {
  return t.business.center.notConfigured;
}

function countryLabel(code: string | null | undefined, t: DeriveBusinessInput["t"]): string {
  if (!code?.trim()) return notConfigured(t);
  const key = code.trim() as keyof typeof t.business.countries;
  return t.business.countries[key] ?? code;
}

function fiscalStatusLabel(
  status: string | null | undefined,
  t: DeriveBusinessInput["t"],
): string {
  if (!status?.trim()) return notConfigured(t);
  const key = status as keyof typeof t.business.statusFiscal;
  return t.business.statusFiscal[key] ?? status;
}

function complianceLabel(
  status: string | null | undefined,
  t: DeriveBusinessInput["t"],
): string {
  if (!status?.trim()) return notConfigured(t);
  const key = status as keyof typeof t.business.statusCompliance;
  return t.business.statusCompliance[key] ?? status;
}

function receiptModeLabel(mode: string | null | undefined, t: DeriveBusinessInput["t"]): string {
  switch (mode) {
    case "standard":
      return t.business.receiptModeStandard;
    case "certified":
      return t.business.receiptModeCertified;
    case "standard_until_certified":
      return t.business.receiptModeStandardUntilCertified;
    case "certified_germany":
      return t.business.receiptModeCertifiedGermany;
    default:
      return mode?.trim() ? mode : notConfigured(t);
  }
}

function languageLabel(code: string | null | undefined, t: DeriveBusinessInput["t"]): string {
  if (!code?.trim()) return notConfigured(t);
  const key = code as keyof typeof t.business.languages;
  return t.business.languages[key] ?? code;
}

function field(id: string, label: string, value: string): BusinessField {
  return { id, label, value };
}

function configured(value: string | null | undefined, t: DeriveBusinessInput["t"]): string {
  const trimmed = value?.trim();
  return trimmed ? trimmed : notConfigured(t);
}

function checklistStatusLabel(
  status: ChecklistStatus,
  t: DeriveBusinessInput["t"],
): string {
  const c = t.business.center;
  if (status === "complete") return c.checklistComplete;
  if (status === "pending") return c.checklistPending;
  return c.checklistIncomplete;
}

function deriveCompletion(data: BusinessData, t: DeriveBusinessInput["t"]): ChecklistItem[] {
  const c = t.business.center;
  const { business, licenses, devices, invoices, customer, error, loading } = data;
  const fiscal = deriveFiscalVisibility(business);

  const profileStatus: ChecklistStatus = !business
    ? "incomplete"
    : isStepCompanyDone(business)
      ? "complete"
      : "pending";

  let fiscalStatus: ChecklistStatus = "incomplete";
  if (!business) {
    fiscalStatus = "incomplete";
  } else if (!fiscal.fiscalRequired || fiscal.isActive) {
    fiscalStatus = "complete";
  } else if (fiscal.isPendingSetup) {
    fiscalStatus = "pending";
  }

  const licenseStatus: ChecklistStatus = isStepLicensePlanDone(
    licenses,
    customer,
    invoices,
  )
    ? "complete"
    : "incomplete";

  const deviceStatus: ChecklistStatus = isStepInstallDone(devices.length)
    ? "complete"
    : "incomplete";

  let cloudStatus: ChecklistStatus = "incomplete";
  if (loading) {
    cloudStatus = "pending";
  } else if (!error) {
    cloudStatus = "complete";
  }

  const addr = business?.businessAddress;
  const hasAddress =
    Boolean(addr?.street?.trim()) &&
    Boolean(addr?.city?.trim()) &&
    Boolean(addr?.zip?.trim());
  const partialAddress =
    Boolean(addr?.street?.trim()) ||
    Boolean(addr?.city?.trim()) ||
    Boolean(addr?.zip?.trim());
  const addressStatus: ChecklistStatus = hasAddress
    ? "complete"
    : partialAddress
      ? "pending"
      : "incomplete";

  let vatStatus: ChecklistStatus = "incomplete";
  if (business?.vatId?.trim()) {
    vatStatus = "complete";
  } else if (fiscal.fiscalRequired) {
    vatStatus = "pending";
  }

  const contactStatus: ChecklistStatus = customer.email?.trim()
    ? "pending"
    : "incomplete";

  const items: Array<{ id: string; label: string; status: ChecklistStatus }> = [
    { id: "profile", label: c.checklistProfile, status: profileStatus },
    { id: "fiscal", label: c.checklistFiscal, status: fiscalStatus },
    { id: "license", label: c.checklistLicense, status: licenseStatus },
    { id: "device", label: c.checklistDevice, status: deviceStatus },
    { id: "cloud", label: c.checklistCloud, status: cloudStatus },
    { id: "address", label: c.checklistAddress, status: addressStatus },
    { id: "vat", label: c.checklistVat, status: vatStatus },
    { id: "contact", label: c.checklistContact, status: contactStatus },
  ];

  return items.map((item) => ({
    ...item,
    statusLabel: checklistStatusLabel(item.status, t),
  }));
}

function deriveOverview(
  input: DeriveBusinessInput,
  checklist: ChecklistItem[],
): BusinessKpi[] {
  const c = input.t.business.center;
  const { business } = input.data;
  const dash = input.t.labels.dash;
  const completeCount = checklist.filter((i) => i.status === "complete").length;
  const completionPercent = Math.round((completeCount / checklist.length) * 100);

  const provider = business
    ? formatProviderLabel(
        business.fiscalProvider,
        business.providerLabel ?? business.fiscalConfigurationLabel,
      )
    : notConfigured(input.t);

  return [
    {
      id: "name",
      label: c.kpiBusinessName,
      value: business?.companyName?.trim() || notConfigured(input.t),
    },
    {
      id: "status",
      label: c.kpiBusinessStatus,
      value: business
        ? complianceLabel(business.complianceStatus, input.t)
        : notConfigured(input.t),
    },
    {
      id: "country",
      label: c.kpiCountry,
      value: countryLabel(business?.country, input.t),
    },
    {
      id: "currency",
      label: c.kpiCurrency,
      value: business?.currency?.trim() || notConfigured(input.t),
    },
    {
      id: "fiscal_provider",
      label: c.kpiFiscalProvider,
      value: provider,
    },
    {
      id: "completion",
      label: c.kpiCompletion,
      value: business ? `${completionPercent}%` : dash,
      hint: business ? undefined : c.waitingProfile,
    },
  ];
}

function deriveCompany(input: DeriveBusinessInput): BusinessField[] {
  const c = input.t.business.center;
  const { business } = input.data;
  const nc = notConfigured(input.t);

  return [
    field("company_name", c.fieldCompanyName, configured(business?.companyName, input.t)),
    field("legal_name", c.fieldLegalName, configured(business?.legalName, input.t)),
    field("owner", c.fieldOwner, nc),
    field("vat_id", c.fieldVatId, configured(business?.vatId, input.t)),
    field("tax_number", c.fieldTaxNumber, configured(business?.taxId, input.t)),
    field("registration", c.fieldRegistration, nc),
    field("business_type", c.fieldBusinessType, nc),
    field("founded", c.fieldFounded, nc),
    field("timezone", c.fieldTimezone, nc),
  ];
}

function deriveAddress(input: DeriveBusinessInput): BusinessField[] {
  const c = input.t.business.center;
  const addr = input.data.business?.businessAddress;
  const nc = notConfigured(input.t);

  return [
    field("street", c.fieldStreet, configured(addr?.street, input.t)),
    field("zip", c.fieldZip, configured(addr?.zip, input.t)),
    field("city", c.fieldCity, configured(addr?.city, input.t)),
    field("state", c.fieldState, nc),
    field(
      "country",
      c.fieldCountry,
      countryLabel(addr?.country ?? input.data.business?.country, input.t),
    ),
  ];
}

function deriveFiscal(input: DeriveBusinessInput): BusinessField[] {
  const c = input.t.business.center;
  const { business } = input.data;
  const nc = notConfigured(input.t);

  if (!business) {
    return [
      field("provider", c.fieldFiscalProvider, nc),
      field("country", c.fieldFiscalCountry, nc),
      field("status", c.fieldFiscalStatus, nc),
      field("signature", c.fieldSignatureStatus, nc),
      field("profile", c.fieldBusinessProfile, nc),
      field("receipt_mode", c.fieldReceiptMode, nc),
      field("vat_config", c.fieldVatConfiguration, nc),
    ];
  }

  const provider = formatProviderLabel(
    business.fiscalProvider,
    business.providerLabel ?? business.fiscalConfigurationLabel,
  );

  return [
    field("provider", c.fieldFiscalProvider, provider),
    field("country", c.fieldFiscalCountry, countryLabel(business.country, input.t)),
    field("status", c.fieldFiscalStatus, fiscalStatusLabel(business.fiscalStatus, input.t)),
    field("signature", c.fieldSignatureStatus, nc),
    field(
      "profile",
      c.fieldBusinessProfile,
      configured(
        business.fiscalConfigurationLabel ?? business.fiscalProfileKey ?? business.fiscalPackage,
        input.t,
      ),
    ),
    field("receipt_mode", c.fieldReceiptMode, receiptModeLabel(business.receiptMode, input.t)),
    field(
      "vat_config",
      c.fieldVatConfiguration,
      business.vatId?.trim() ? business.vatId.trim() : nc,
    ),
  ];
}

function deriveContact(input: DeriveBusinessInput): BusinessField[] {
  const c = input.t.business.center;
  const { customer } = input.data;
  const nc = notConfigured(input.t);

  return [
    field(
      "email",
      c.fieldBusinessEmail,
      customer.email?.trim() || nc,
    ),
    field("phone", c.fieldPhone, nc),
    field("website", c.fieldWebsite, nc),
    field("support_email", c.fieldSupportEmail, nc),
  ];
}

function deriveStore(input: DeriveBusinessInput): BusinessField[] {
  const c = input.t.business.center;
  const { business } = input.data;
  const nc = notConfigured(input.t);

  return [
    field("store_name", c.fieldStoreName, configured(business?.companyName, input.t)),
    field("store_id", c.fieldStoreId, nc),
    field("environment", c.fieldEnvironment, input.environmentLabel),
    field(
      "language",
      c.fieldLanguage,
      languageLabel(business?.defaultLanguage, input.t),
    ),
    field("currency", c.fieldStoreCurrency, configured(business?.currency, input.t)),
    field("region", c.fieldRegion, countryLabel(business?.country, input.t)),
  ];
}

function deriveCloud(input: DeriveBusinessInput): BusinessDerivedState["cloud"] {
  const c = input.t.business.center;
  const { error, loading, lastSyncedAt, devices } = input.data;
  const nc = notConfigured(input.t);
  const { online, total } = countOnlineDevices(devices);

  let cloudConnected = nc;
  if (!loading) {
    cloudConnected = error ? c.cloudDisconnected : c.cloudConnected;
  }

  const lastSync = lastSyncedAt
    ? lastSyncedAt.toLocaleString(input.locale)
    : nc;

  let posConnected = nc;
  if (total > 0) {
    posConnected = online > 0 ? c.posConnectedYes : c.posConnectedNo;
  } else if (!loading) {
    posConnected = c.posConnectedNo;
  }

  let apiStatus = nc;
  if (!loading) {
    apiStatus = error ? c.apiError : c.apiOk;
  }

  return {
    cloudConnected,
    lastSync,
    posConnected,
    apiStatus,
  };
}

function deriveQuickActions(input: DeriveBusinessInput): BusinessDerivedState["quickActions"] {
  const c = input.t.business.center;
  const badge = c.comingSoon;

  return [
    { id: "edit", label: c.actionEdit, disabled: false, action: "scroll_to_edit" },
    { id: "fiscal", label: c.actionFiscal, disabled: true, badge },
    { id: "download", label: c.actionDownload, disabled: true, badge },
    { id: "export", label: c.actionExport, disabled: true, badge },
    { id: "print", label: c.actionPrint, disabled: true, badge },
  ];
}

function deriveFutureModules(input: DeriveBusinessInput): BusinessDerivedState["futureModules"] {
  const c = input.t.business.center;
  return [
    { id: "multi_store", label: c.moduleMultiStore },
    { id: "branches", label: c.moduleBranches },
    { id: "warehouse", label: c.moduleWarehouse },
    { id: "accounting", label: c.moduleAccounting },
    { id: "crm", label: c.moduleCrm },
    { id: "loyalty", label: c.moduleLoyalty },
    { id: "gift_cards", label: c.moduleGiftCards },
  ];
}

export function deriveBusinessState(input: DeriveBusinessInput): BusinessDerivedState {
  const checklist = deriveCompletion(input.data, input.t);
  const completeCount = checklist.filter((i) => i.status === "complete").length;
  const completionPercent = Math.round((completeCount / checklist.length) * 100);

  return {
    overview: deriveOverview(input, checklist),
    company: deriveCompany(input),
    address: deriveAddress(input),
    fiscal: deriveFiscal(input),
    contact: deriveContact(input),
    store: deriveStore(input),
    cloud: deriveCloud(input),
    checklist,
    completionPercent: input.data.business ? completionPercent : 0,
    quickActions: deriveQuickActions(input),
    futureModules: deriveFutureModules(input),
    hasProfile: Boolean(input.data.business),
  };
}
