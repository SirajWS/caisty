// Type definitions für Übersetzungen
// Reihenfolge UI: English, Français, Deutsch, العربية

export type Language = "en" | "fr" | "de" | "ar";

export const languages: { code: Language; name: string; nativeName: string }[] = [
  { code: "en", name: "English", nativeName: "English" },
  { code: "fr", name: "French", nativeName: "Français" },
  { code: "de", name: "German", nativeName: "Deutsch" },
  { code: "ar", name: "Arabic", nativeName: "العربية" },
];

const LANGUAGE_CODES: Language[] = ["en", "fr", "de", "ar"];

export function isLanguage(code: string): code is Language {
  return LANGUAGE_CODES.includes(code as Language);
}

