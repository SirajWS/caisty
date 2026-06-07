// Hauptdatei für alle Übersetzungen - führt alle Module zusammen
import type { Language } from "./types";
import { isLanguage } from "./types";
import { common } from "./common";
import { landing } from "./landing";
import { pricing } from "./pricing";
import { auth } from "./auth";
import { portal } from "./portal";

// Exportiere Types und Languages
export type { Language };
export { languages } from "./types";

// Kombiniere alle Übersetzungen
export const translations: Record<Language, {
  common: typeof common.de;
  landing: typeof landing.de;
  pricing: typeof pricing.de;
  auth: typeof auth.de;
  portal: typeof portal.en;
}> = {
  de: {
    common: common.de,
    landing: landing.de,
    pricing: pricing.de,
    auth: auth.de,
    portal: portal.de,
  },
  en: {
    common: common.en,
    landing: landing.en,
    pricing: pricing.en,
    auth: auth.en,
    portal: portal.en,
  },
  fr: {
    common: common.fr,
    landing: landing.fr,
    pricing: pricing.fr,
    auth: auth.fr,
    portal: portal.fr,
  },
  ar: {
    common: common.ar,
    landing: landing.ar,
    pricing: pricing.ar,
    auth: auth.ar,
    portal: portal.ar,
  },
};

/** Portal copy; falls back to English if `language` is unknown or `portal` is missing (stale cache / HMR). */
export function getPortalTranslations(language: string): typeof portal.en {
  const lang: Language = isLanguage(language) ? language : "en";
  return translations[lang]?.portal ?? translations.en.portal;
}

// Helper-Funktion für verschachtelte Keys (z.B. "landing.hero.title")
export function getTranslation(lang: Language, key: string): string {
  const keys = key.split(".");
  let value: any = translations[lang];
  for (const k of keys) {
    value = value?.[k];
  }
  return value ?? key;
}

