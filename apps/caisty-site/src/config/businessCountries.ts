/** Supported business countries — order matches portal dropdown (Europe → MENA → Other). */
export const BUSINESS_COUNTRY_OPTIONS = [
  // Europe
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
  // North Africa / MENA
  { code: "TN", currency: "TND" },
  { code: "MA", currency: "MAD" },
  { code: "DZ", currency: "DZD" },
  { code: "LY", currency: "LYD" },
  // Other
  { code: "US", currency: "USD" },
  { code: "OTHER", currency: "EUR" },
] as const;

export type BusinessCountryOptionCode =
  (typeof BUSINESS_COUNTRY_OPTIONS)[number]["code"];

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
  return fromEnv || "0.3.0";
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
  const opt = BUSINESS_COUNTRY_OPTIONS.find((c) => c.code === code);
  if (!opt) return BUSINESS_CURRENCY_OPTIONS;
  return [opt.currency];
}
