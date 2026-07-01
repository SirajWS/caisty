export const COOKIE_CONSENT_STORAGE_KEY = "caisty_cookie_consent_v1";
export const OPEN_COOKIE_PREFERENCES_EVENT = "caisty:open-cookie-preferences";

export type OptionalCookieCategories = {
  preferences: boolean;
  functional: boolean;
  analytics: boolean;
  performance: boolean;
};

export type CookieConsentRecord = {
  version: 1;
  decidedAt: string;
  optional: OptionalCookieCategories;
};

export const DEFAULT_OPTIONAL_COOKIES: OptionalCookieCategories = {
  preferences: false,
  functional: false,
  analytics: false,
  performance: false,
};

export const ALL_OPTIONAL_COOKIES: OptionalCookieCategories = {
  preferences: true,
  functional: true,
  analytics: true,
  performance: true,
};

export function readCookieConsent(): CookieConsentRecord | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(COOKIE_CONSENT_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as CookieConsentRecord;
    if (parsed?.version !== 1 || !parsed.optional) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function writeCookieConsent(optional: OptionalCookieCategories): CookieConsentRecord {
  const record: CookieConsentRecord = {
    version: 1,
    decidedAt: new Date().toISOString(),
    optional,
  };
  localStorage.setItem(COOKIE_CONSENT_STORAGE_KEY, JSON.stringify(record));
  window.dispatchEvent(new CustomEvent("caisty:cookie-consent-changed", { detail: record }));
  return record;
}

export function openCookiePreferences() {
  window.dispatchEvent(new CustomEvent(OPEN_COOKIE_PREFERENCES_EVENT));
}

export function isOptionalCategoryEnabled(category: keyof OptionalCookieCategories): boolean {
  const consent = readCookieConsent();
  if (!consent) return false;
  return consent.optional[category];
}
