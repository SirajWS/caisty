/**
 * Client-side preview of fiscal display values from a country code.
 * Mirrors cloud-api fiscal/buildFiscalConfiguration for unsaved form state.
 */

const EU_STRICT_SOON = new Set(["AT", "FR", "IT", "ES", "PT", "NL", "BE"]);

export type PreviewFiscalStatus =
  | "not_required"
  | "required"
  | "required_coming_soon"
  | "pending_setup"
  | "active"
  | "error";

export type PreviewReceiptMode =
  | "standard"
  | "certified"
  | "standard_until_certified";

function normalizeCountry(code: string | null | undefined): string | null {
  if (!code?.trim()) return null;
  return code.trim().toUpperCase();
}

export function previewFiscalStatus(countryCode: string | null): PreviewFiscalStatus {
  const country = normalizeCountry(countryCode);
  if (!country) return "not_required";
  if (country === "DE") return "pending_setup";
  if (EU_STRICT_SOON.has(country)) return "required_coming_soon";
  return "not_required";
}

export function previewFiscalProviderKey(countryCode: string | null): string {
  const country = normalizeCountry(countryCode);
  if (country === "DE") return "fiskaly";
  return "none";
}

export function previewProviderType(countryCode: string | null): string {
  const country = normalizeCountry(countryCode);
  if (country === "DE") return "api_service";
  if (country && EU_STRICT_SOON.has(country)) return "coming_soon";
  return "none";
}

export function previewFiscalConfigurationLabel(
  countryCode: string | null,
): string {
  const country = normalizeCountry(countryCode);
  if (country === "DE") return "Caisty Fiscal Germany powered by Fiskaly";
  if (country && EU_STRICT_SOON.has(country)) {
    return "Fiscal configuration coming soon";
  }
  return "Standard receipt mode";
}

export function previewFiscalProfileKey(countryCode: string | null): string {
  const country = normalizeCountry(countryCode);
  if (country === "DE") return "de_fiskaly_api";
  if (country && EU_STRICT_SOON.has(country)) {
    return `${country.toLowerCase()}_coming_soon`;
  }
  return "generic_standard";
}

/** @deprecated use previewFiscalProfileKey */
export function previewFiscalPackage(countryCode: string | null): string {
  return previewFiscalProfileKey(countryCode);
}

export function previewReceiptMode(countryCode: string | null): PreviewReceiptMode {
  const country = normalizeCountry(countryCode);
  if (country === "DE") return "certified";
  if (country && EU_STRICT_SOON.has(country)) return "standard_until_certified";
  return "standard";
}

export function previewCurrencyForCountry(countryCode: string | null): string {
  const country = normalizeCountry(countryCode);
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

export function previewFiscalNotice(countryCode: string | null): string | null {
  const country = normalizeCountry(countryCode);
  if (country === "DE") {
    return "Fiscal setup pending. Caisty will complete cloud API onboarding — no manual configuration required.";
  }
  if (country && EU_STRICT_SOON.has(country)) {
    return "Certified fiscalization for this country is in preparation. Standard receipt mode applies until the cloud fiscal service is available.";
  }
  return null;
}
