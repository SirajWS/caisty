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

/** Keep in sync with vite.config.ts default posVersion. */
const POS_FALLBACK_VERSION = "0.3.1";

const INSTALLER_VERSION_RE = /Caisty\.PoS_([\d.]+)_x64-setup\.exe/i;

function parseInstallerVersionFromUrl(url: string): string | null {
  const match = url.match(INSTALLER_VERSION_RE);
  return match?.[1]?.trim() || null;
}

function buildInstallerRelativePath(version: string): string {
  return `/downloads/Caisty.PoS_${version}_x64-setup.exe`;
}

/**
 * Latest published POS installer version.
 * Installer URL wins over a mismatched VITE_POS_LATEST_VERSION (avoids stale labels).
 */
export function getPosLatestVersion(): string {
  const url = String(import.meta.env.VITE_POS_WINDOWS_URL ?? "").trim();
  const fromUrl = url ? parseInstallerVersionFromUrl(url) : null;
  if (fromUrl) return fromUrl;

  const fromEnv = String(import.meta.env.VITE_POS_LATEST_VERSION ?? "").trim();
  if (fromEnv) return fromEnv;

  return POS_FALLBACK_VERSION;
}

/**
 * Windows installer download URL (from VITE_POS_WINDOWS_URL).
 * Falls back to a path derived from getPosLatestVersion() when unset.
 */
export function getPosWindowsDownloadUrl(): string | null {
  const envUrl = String(import.meta.env.VITE_POS_WINDOWS_URL ?? "").trim();
  if (envUrl) return envUrl;
  return buildInstallerRelativePath(getPosLatestVersion());
}

export function isPosDownloadConfigured(): boolean {
  return Boolean(getPosWindowsDownloadUrl());
}

/** Planned Web POS URL (display only when not yet enabled). */
export function getPosWebUrlTarget(): string {
  const fromEnv = String(import.meta.env.VITE_POS_WEB_URL ?? "").trim();
  return fromEnv || "https://pos.caisty.com";
}

/** Whether Web POS launch is enabled (VITE_POS_WEB_ENABLED=true). */
export function isPosWebEnabled(): boolean {
  const raw = String(import.meta.env.VITE_POS_WEB_ENABLED ?? "")
    .trim()
    .toLowerCase();
  return raw === "true" || raw === "1";
}

/** Active Web POS URL when enabled; null when coming soon. */
export function getPosWebUrl(): string | null {
  if (!isPosWebEnabled()) return null;
  return getPosWebUrlTarget();
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
