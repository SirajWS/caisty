// Country rules and derived fields for org business profiles (portal + admin).

export type BusinessCountryCode =
  | "DE"
  | "AT"
  | "FR"
  | "IT"
  | "ES"
  | "PT"
  | "NL"
  | "BE"
  | "CH"
  | "GB"
  | "IE"
  | "TN"
  | "MA"
  | "DZ"
  | "LY"
  | "US"
  | "OTHER";

export type BusinessCurrency =
  | "EUR"
  | "TND"
  | "MAD"
  | "DZD"
  | "LYD"
  | "USD"
  | "GBP"
  | "CHF";

export type FiscalStatusInternal =
  | "not_required"
  | "required"
  | "required_soon"
  | "pending_setup"
  | "active"
  | "error";

export type FiscalProviderInternal = "none" | "fiskaly";

export type FiscalEnvironmentInternal =
  | "not_configured"
  | "sandbox"
  | "live";

export type ComplianceStatusInternal =
  | "incomplete"
  | "ready"
  | "action_required";

export type PosConfigurationStatusInternal = "not_ready" | "ready";

export type ReceiptModeInternal =
  | "standard"
  | "certified_germany"
  | "standard_until_certified";

export type BusinessAddress = {
  street?: string;
  city?: string;
  zip?: string;
  country?: string;
};

export type DefaultLanguage = "en" | "de" | "fr" | "ar";

/** Display order: Europe → MENA → Other (matches portal dropdown). */
export const SUPPORTED_COUNTRIES: BusinessCountryCode[] = [
  "DE",
  "AT",
  "FR",
  "IT",
  "ES",
  "PT",
  "NL",
  "BE",
  "CH",
  "GB",
  "IE",
  "TN",
  "MA",
  "DZ",
  "LY",
  "US",
  "OTHER",
];

export const SUPPORTED_LANGUAGES: DefaultLanguage[] = [
  "en",
  "de",
  "fr",
  "ar",
];

const EU_STRICT_SOON: BusinessCountryCode[] = [
  "AT",
  "FR",
  "IT",
  "ES",
  "PT",
  "NL",
  "BE",
];

export function normalizeCountryCode(
  value: string | null | undefined,
): BusinessCountryCode | null {
  if (!value || typeof value !== "string") return null;
  const upper = value.trim().toUpperCase();
  if (upper === "OTHER") return "OTHER";
  if (upper.length !== 2) return null;
  if ((SUPPORTED_COUNTRIES as string[]).includes(upper)) {
    return upper as BusinessCountryCode;
  }
  return null;
}

export function defaultCurrencyForCountry(
  country: BusinessCountryCode | null,
): BusinessCurrency {
  switch (country) {
    case "TN":
      return "TND";
    case "MA":
      return "MAD";
    case "DZ":
      return "DZD";
    case "LY":
      return "LYD";
    case "US":
      return "USD";
    case "GB":
      return "GBP";
    case "CH":
      return "CHF";
    default:
      return "EUR";
  }
}

export function allowedCurrenciesForCountry(
  country: BusinessCountryCode | null,
): BusinessCurrency[] {
  switch (country) {
    case "TN":
      return ["TND"];
    case "MA":
      return ["MAD"];
    case "DZ":
      return ["DZD"];
    case "LY":
      return ["LYD"];
    case "US":
      return ["USD"];
    case "GB":
      return ["GBP"];
    case "CH":
      return ["CHF", "EUR"];
    default:
      return ["EUR"];
  }
}

export function isCurrencyAllowedForCountry(
  country: BusinessCountryCode | null,
  currency: string,
): boolean {
  const cur = currency.trim().toUpperCase() as BusinessCurrency;
  return allowedCurrenciesForCountry(country).includes(cur);
}

export function applyCountryFiscalRules(country: BusinessCountryCode | null): {
  fiscalStatus: FiscalStatusInternal;
  fiscalProvider: FiscalProviderInternal;
  fiscalEnvironment: FiscalEnvironmentInternal;
} {
  if (!country) {
    return {
      fiscalStatus: "not_required",
      fiscalProvider: "none",
      fiscalEnvironment: "not_configured",
    };
  }

  if (country === "DE") {
    return {
      fiscalStatus: "pending_setup",
      fiscalProvider: "fiskaly",
      fiscalEnvironment: "not_configured",
    };
  }

  if (EU_STRICT_SOON.includes(country)) {
    return {
      fiscalStatus: "required_soon",
      fiscalProvider: "none",
      fiscalEnvironment: "not_configured",
    };
  }

  return {
    fiscalStatus: "not_required",
    fiscalProvider: "none",
    fiscalEnvironment: "not_configured",
  };
}

/** Country is source of truth; preserve active/error from DB when applicable. */
export function resolveFiscalFields(
  country: BusinessCountryCode | null,
  storedStatus?: string | null,
  storedProvider?: string | null,
): {
  fiscalStatus: FiscalStatusInternal;
  fiscalProvider: FiscalProviderInternal;
  fiscalEnvironment: FiscalEnvironmentInternal;
} {
  const rules = applyCountryFiscalRules(country);

  if (storedStatus === "error") {
    return { ...rules, fiscalStatus: "error" };
  }

  if (
    storedStatus === "active" &&
    country === "DE" &&
    (storedProvider === "fiskaly" ||
      storedProvider === "caisty_fiscal_germany_fiskaly" ||
      rules.fiscalProvider === "fiskaly")
  ) {
    return {
      fiscalStatus: "active",
      fiscalProvider: "fiskaly",
      fiscalEnvironment: rules.fiscalEnvironment,
    };
  }

  return rules;
}

export function deriveReceiptMode(
  country: BusinessCountryCode | null,
  fiscalStatus: FiscalStatusInternal,
): ReceiptModeInternal {
  if (country === "DE" && fiscalStatus !== "not_required") {
    return "certified_germany";
  }
  if (country && EU_STRICT_SOON.includes(country)) {
    return "standard_until_certified";
  }
  return "standard";
}

export function deriveFiscalProfileKey(
  country: BusinessCountryCode | null,
  provider: FiscalProviderInternal,
): string {
  if (country === "DE" && provider === "fiskaly") {
    return "de_fiskaly_api";
  }
  if (country && EU_STRICT_SOON.includes(country)) {
    return `${country.toLowerCase()}_coming_soon`;
  }
  return "generic_standard";
}

/** @deprecated Use deriveFiscalProfileKey — cloud configuration profile, not a download. */
export function deriveFiscalPackage(
  country: BusinessCountryCode | null,
  provider: FiscalProviderInternal,
): string {
  return deriveFiscalProfileKey(country, provider);
}

export function computeComplianceStatus(input: {
  country: BusinessCountryCode | null;
  companyName: string | null;
  legalName: string | null;
  businessAddress: BusinessAddress;
  fiscalStatus: FiscalStatusInternal;
}): ComplianceStatusInternal {
  const { country, companyName, legalName, businessAddress, fiscalStatus } =
    input;

  if (!country || !companyName?.trim()) {
    return "incomplete";
  }

  const hasAddress =
    Boolean(businessAddress.street?.trim()) &&
    Boolean(businessAddress.city?.trim()) &&
    Boolean(businessAddress.zip?.trim());

  if (!legalName?.trim() || !hasAddress) {
    return "incomplete";
  }

  if (
    fiscalStatus === "error" ||
    fiscalStatus === "pending_setup" ||
    fiscalStatus === "required"
  ) {
    return "action_required";
  }

  return "ready";
}

export function computePosConfigurationStatus(input: {
  country: BusinessCountryCode | null;
  fiscalStatus: FiscalStatusInternal;
  complianceStatus: ComplianceStatusInternal;
}): PosConfigurationStatusInternal {
  const { country, fiscalStatus, complianceStatus } = input;

  if (!country) {
    return "not_ready";
  }

  if (complianceStatus === "incomplete") {
    return "not_ready";
  }

  if (
    country === "DE" &&
    (fiscalStatus === "pending_setup" ||
      fiscalStatus === "required" ||
      fiscalStatus === "error")
  ) {
    return "not_ready";
  }

  return "ready";
}

export function sanitizeBusinessAddress(
  raw: unknown,
  countryFallback: string | null,
): BusinessAddress {
  if (!raw || typeof raw !== "object") {
    return countryFallback ? { country: countryFallback } : {};
  }
  const obj = raw as Record<string, unknown>;
  const trim = (v: unknown, max: number) => {
    if (typeof v !== "string") return undefined;
    const s = v.trim().slice(0, max);
    return s || undefined;
  };
  return {
    street: trim(obj.street, 255),
    city: trim(obj.city, 128),
    zip: trim(obj.zip, 32),
    country: trim(obj.country, 5) ?? countryFallback ?? undefined,
  };
}

export function customerFacingFiscalStatus(
  status: FiscalStatusInternal,
): string {
  switch (status) {
    case "not_required":
      return "not_required";
    case "required":
      return "required";
    case "required_soon":
      return "required_coming_soon";
    case "pending_setup":
      return "pending_setup";
    case "active":
      return "active";
    case "error":
      return "error";
    default:
      return "not_required";
  }
}

export function customerFacingFiscalProvider(
  provider: FiscalProviderInternal,
  country: BusinessCountryCode | null,
): string {
  if (
    provider === "fiskaly" ||
    provider === ("caisty_fiscal_germany_fiskaly" as FiscalProviderInternal) ||
    (country === "DE" && provider !== "none")
  ) {
    return "fiskaly";
  }
  return "none";
}

export function fiscalProviderDisplayKey(
  provider: FiscalProviderInternal | string,
  country: BusinessCountryCode | null,
): string {
  const normalized =
    provider === "caisty_fiscal_germany_fiskaly" ? "fiskaly" : provider;
  const facing = customerFacingFiscalProvider(
    normalized as FiscalProviderInternal,
    country,
  );
  if (facing === "fiskaly") return "fiskaly";
  return "none";
}
