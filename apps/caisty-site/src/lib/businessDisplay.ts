/**
 * Client-side preview of fiscal display values from a country code.
 * Uses country_config from GET /country-config (via countryConfigClient).
 */

import {
  getCountryConfigByCode,
  type CountryConfigPublic,
} from "./countryConfigClient";

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

function entryFor(countryCode: string | null): CountryConfigPublic {
  return getCountryConfigByCode(countryCode);
}

export function previewFiscalStatus(countryCode: string | null): PreviewFiscalStatus {
  const entry = entryFor(normalizeCountry(countryCode));
  if (!entry.fiscalRequired) return "not_required";
  if (entry.fiscalProvider === "fiskaly") return "pending_setup";
  if (entry.status === "coming_soon") return "required_coming_soon";
  return "required";
}

export function previewFiscalProviderKey(countryCode: string | null): string {
  const entry = entryFor(normalizeCountry(countryCode));
  return entry.fiscalProvider === "fiskaly" ? "fiskaly" : "none";
}

export function previewProviderType(countryCode: string | null): string {
  const entry = entryFor(normalizeCountry(countryCode));
  if (entry.fiscalProvider === "fiskaly") return "api_service";
  if (entry.status === "coming_soon" && entry.fiscalRequired) return "coming_soon";
  return "none";
}

export function previewFiscalConfigurationLabel(
  countryCode: string | null,
): string {
  const country = normalizeCountry(countryCode);
  const entry = entryFor(country);
  if (country === "DE" && entry.fiscalProvider === "fiskaly") {
    return "Caisty Fiscal Germany powered by Fiskaly";
  }
  if (entry.status === "coming_soon" && entry.fiscalRequired) {
    return "Fiscal configuration coming soon";
  }
  return "Standard receipt mode";
}

export function previewFiscalProfileKey(countryCode: string | null): string {
  const country = normalizeCountry(countryCode);
  const entry = entryFor(country);
  if (country === "DE" && entry.fiscalProvider === "fiskaly") return "de_fiskaly_api";
  if (entry.status === "coming_soon" && entry.fiscalRequired && country) {
    return `${country.toLowerCase()}_coming_soon`;
  }
  return "generic_standard";
}

/** @deprecated use previewFiscalProfileKey */
export function previewFiscalPackage(countryCode: string | null): string {
  return previewFiscalProfileKey(countryCode);
}

export function previewReceiptMode(countryCode: string | null): PreviewReceiptMode {
  const entry = entryFor(normalizeCountry(countryCode));
  if (entry.receiptMode === "certified") return "certified";
  if (entry.receiptMode === "standard_until_certified") return "standard_until_certified";
  return "standard";
}

export function previewCurrencyForCountry(countryCode: string | null): string {
  return entryFor(normalizeCountry(countryCode)).currency;
}

export function previewFiscalNotice(countryCode: string | null): string | null {
  const country = normalizeCountry(countryCode);
  const entry = entryFor(country);
  if (country === "DE" && entry.fiscalProvider === "fiskaly") {
    return "Fiscal setup pending. Caisty will complete cloud API onboarding — no manual configuration required.";
  }
  if (entry.status === "coming_soon" && entry.fiscalRequired) {
    return "Certified fiscalization for this country is in preparation. Standard receipt mode applies until the cloud fiscal service is available.";
  }
  return null;
}
