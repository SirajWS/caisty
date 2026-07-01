// Hauptdatei für alle Übersetzungen - führt alle Module zusammen
import type { Language, TranslationSchema } from "./types";
import { isLanguage } from "./types";
import type { CommonTranslations } from "./common";
import type { LandingCopy } from "./landing";
import type { PricingTranslations } from "./pricing";
import type { AuthTranslations } from "./auth";
import type { PortalTranslations } from "./portal";
import type { CompanyCopy } from "./company";
import type { ContactCopy } from "./contact";
import type { WorkTrackPageCopy } from "./worktrackPage";
import { common } from "./common";
import { landing } from "./landing";
import { pricing } from "./pricing";
import { auth } from "./auth";
import { portal } from "./portal";
import { company } from "./company";
import { contact } from "./contact";
import { worktrackPage } from "./worktrackPage";

// Exportiere Types und Languages
export type { Language, TranslationSchema };
export { languages } from "./types";

// Kombiniere alle Übersetzungen
export const translations: Record<
  Language,
  {
    common: CommonTranslations;
    landing: LandingCopy;
    pricing: PricingTranslations;
    auth: AuthTranslations;
    portal: PortalTranslations;
    company: CompanyCopy;
    contact: ContactCopy;
    worktrackPage: WorkTrackPageCopy;
  }
> = {
  de: {
    common: common.de,
    landing: landing.de,
    pricing: pricing.de,
    auth: auth.de,
    portal: portal.de,
    company: company.de,
    contact: contact.de,
    worktrackPage: worktrackPage.de,
  },
  en: {
    common: common.en,
    landing: landing.en,
    pricing: pricing.en,
    auth: auth.en,
    portal: portal.en,
    company: company.en,
    contact: contact.en,
    worktrackPage: worktrackPage.en,
  },
  fr: {
    common: common.fr,
    landing: landing.fr,
    pricing: pricing.fr,
    auth: auth.fr,
    portal: portal.fr,
    company: company.fr,
    contact: contact.fr,
    worktrackPage: worktrackPage.fr,
  },
  ar: {
    common: common.ar,
    landing: landing.ar,
    pricing: pricing.ar,
    auth: auth.ar,
    portal: portal.ar,
    company: company.ar,
    contact: contact.ar,
    worktrackPage: worktrackPage.ar,
  },
};

/** Portal copy; falls back to English if `language` is unknown or `portal` is missing (stale cache / HMR). */
export function getPortalTranslations(language: string): PortalTranslations {
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

