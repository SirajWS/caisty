import {
  getCountryConfigByCode,
  getCountryConfigList,
  isCountryConfigLoaded,
  type CountryConfigPublic,
} from "../lib/countryConfigClient";

/** Supported business countries — order from country_config.sort_order. */
export function getBusinessCountryOptions(): readonly Pick<
  CountryConfigPublic,
  "code" | "currency"
>[] {
  if (!isCountryConfigLoaded()) {
    return LEGACY_BUSINESS_COUNTRY_OPTIONS;
  }
  return getCountryConfigList().map((c) => ({
    code: c.code,
    currency: c.currency,
  }));
}

/**
 * Legacy static list — used only until GET /country-config has loaded.
 * Values match migration 019_country_config.sql seed.
 */
const LEGACY_BUSINESS_COUNTRY_OPTIONS = [
  { code: "DE", currency: "EUR" },
  { code: "AT", currency: "EUR" },
  { code: "FR", currency: "EUR" },
  { code: "IT", currency: "EUR" },
  { code: "ES", currency: "EUR" },
  { code: "PT", currency: "EUR" },
  { code: "NL", currency: "EUR" },
  { code: "BE", currency: "EUR" },
  { code: "CH", currency: "CHF" },
  { code: "GB", currency: "GBP" },
  { code: "IE", currency: "EUR" },
  { code: "TN", currency: "TND" },
  { code: "MA", currency: "MAD" },
  { code: "DZ", currency: "DZD" },
  { code: "LY", currency: "LYD" },
  { code: "US", currency: "USD" },
  { code: "OTHER", currency: "EUR" },
] as const;

/** @deprecated Use getBusinessCountryOptions() after loadCountryConfig(). */
export const BUSINESS_COUNTRY_OPTIONS = LEGACY_BUSINESS_COUNTRY_OPTIONS;

export type BusinessCountryOptionCode =
  (typeof LEGACY_BUSINESS_COUNTRY_OPTIONS)[number]["code"];

export const BUSINESS_CURRENCY_OPTIONS = [
  "EUR",
  "TND",
  "MAD",
  "DZD",
  "LYD",
  "USD",
  "GBP",
  "CHF",
] as const;

export const BUSINESS_LANGUAGE_OPTIONS = [
  { code: "en", labelKey: "en" as const },
  { code: "de", labelKey: "de" as const },
  { code: "fr", labelKey: "fr" as const },
  { code: "ar", labelKey: "ar" as const },
];

export function getPosLatestVersion(): string {
  const fromEnv = String(import.meta.env.VITE_POS_LATEST_VERSION ?? "").trim();
  return fromEnv || "0.3.1";
}

/**
 * Single global Windows installer URL (from VITE_POS_WINDOWS_URL).
 * Vite config supplies a default public path when the env var is unset.
 */
export function getPosWindowsDownloadUrl(): string | null {
  const envUrl = String(import.meta.env.VITE_POS_WINDOWS_URL ?? "").trim();
  return envUrl || null;
}

export function isPosDownloadConfigured(): boolean {
  return Boolean(getPosWindowsDownloadUrl());
}

export function currenciesForCountry(code: string): readonly string[] {
  if (isCountryConfigLoaded()) {
    return getCountryConfigByCode(code).allowedCurrencies;
  }
  const opt = LEGACY_BUSINESS_COUNTRY_OPTIONS.find((c) => c.code === code);
  if (!opt) return BUSINESS_CURRENCY_OPTIONS;
  if (code === "CH") return ["CHF", "EUR"];
  return [opt.currency];
}
