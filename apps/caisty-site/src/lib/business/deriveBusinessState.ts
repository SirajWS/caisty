import { formatProviderLabel } from "../caistyTerminology";
import { deriveFiscalVisibility } from "../useFiscalVisibility";
import type {
  BusinessData,
  BusinessDerivedState,
  BusinessField,
  BusinessSetupProgress,
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

function field(id: string, label: string, value: string): BusinessField {
  return { id, label, value };
}

function deriveSetup(data: BusinessData, t: DeriveBusinessInput["t"]): BusinessSetupProgress {
  const c = t.business.center;
  const { business } = data;

  if (!business) {
    return {
      percent: 0,
      missingItems: [c.setupMissingProfile],
      complete: false,
    };
  }

  const fiscal = deriveFiscalVisibility(business);
  const addr = business.businessAddress;

  const checks: Array<{ label: string; done: boolean }> = [
    { label: c.fieldCompanyName, done: Boolean(business.companyName?.trim()) },
    { label: c.fieldCountry, done: Boolean(business.country?.trim()) },
    { label: c.fieldStoreCurrency, done: Boolean(business.currency?.trim()) },
    { label: c.fieldStreet, done: Boolean(addr?.street?.trim()) },
    { label: c.fieldCity, done: Boolean(addr?.city?.trim()) },
    { label: c.fieldZip, done: Boolean(addr?.zip?.trim()) },
  ];

  if (fiscal.fiscalRequired) {
    checks.push(
      { label: c.fieldVatId, done: Boolean(business.vatId?.trim()) },
      { label: c.fieldTaxNumber, done: Boolean(business.taxId?.trim()) },
      { label: c.setupMissingFiscal, done: fiscal.isActive },
    );
  }

  const doneCount = checks.filter((item) => item.done).length;
  const missingItems = checks.filter((item) => !item.done).map((item) => item.label);
  const percent = Math.round((doneCount / checks.length) * 100);

  return {
    percent,
    missingItems,
    complete: missingItems.length === 0,
  };
}

function deriveFiscalSummary(input: DeriveBusinessInput): BusinessField[] {
  const c = input.t.business.center;
  const { business } = input.data;
  const nc = notConfigured(input.t);

  if (!business) {
    return [
      field("country", c.fieldCountry, nc),
      field("provider", c.fieldFiscalProvider, nc),
      field("status", c.fieldFiscalStatus, nc),
      field("receipt_mode", c.fieldReceiptMode, nc),
      field("vat_status", c.fieldVatStatus, c.vatStatusNotConfigured),
    ];
  }

  const provider = formatProviderLabel(
    business.fiscalProvider,
    business.providerLabel ?? business.fiscalConfigurationLabel,
  );

  const vatStatus = business.vatId?.trim()
    ? c.vatStatusConfigured
    : c.vatStatusNotConfigured;

  const fields: BusinessField[] = [
    field("country", c.fieldCountry, countryLabel(business.country, input.t)),
    field("provider", c.fieldFiscalProvider, provider),
    field("status", c.fieldFiscalStatus, fiscalStatusLabel(business.fiscalStatus, input.t)),
    field("receipt_mode", c.fieldReceiptMode, receiptModeLabel(business.receiptMode, input.t)),
    field("vat_status", c.fieldVatStatus, vatStatus),
  ];

  return fields;
}

export function deriveBusinessState(input: DeriveBusinessInput): BusinessDerivedState {
  return {
    setup: deriveSetup(input.data, input.t),
    fiscalSummary: deriveFiscalSummary(input),
    hasProfile: Boolean(input.data.business),
  };
}
