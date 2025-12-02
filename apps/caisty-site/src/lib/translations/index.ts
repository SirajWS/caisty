// Hauptdatei für alle Übersetzungen - führt alle Module zusammen
import type { Language } from "./types";
import { common } from "./common";
import { landing } from "./landing";
import { pricing } from "./pricing";

// Exportiere Types und Languages
export type { Language };
export { languages } from "./types";

// Kombiniere alle Übersetzungen
export const translations: Record<Language, {
  common: typeof common.de;
  landing: typeof landing.de;
  pricing: typeof pricing.de;
}> = {
  de: {
    common: common.de,
    landing: landing.de,
    pricing: pricing.de,
  },
  en: {
    common: common.en,
    landing: landing.en,
    pricing: pricing.en,
  },
  fr: {
    common: common.fr,
    landing: landing.fr,
    pricing: pricing.fr,
  },
  ar: {
    common: common.ar,
    landing: landing.ar,
    pricing: pricing.ar,
  },
};

// Helper-Funktion für verschachtelte Keys (z.B. "landing.hero.title")
export function getTranslation(lang: Language, key: string): string {
  const keys = key.split(".");
  let value: any = translations[lang];
  for (const k of keys) {
    value = value?.[k];
  }
  return value ?? key;
}

