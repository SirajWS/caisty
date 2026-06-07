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

/**
 * Same keys as the English source object; every leaf string may be any `string` per locale.
 * Use with `typeof <englishConst>` so literals are not enforced on fr/de/ar.
 */
export type TranslationSchema<T> = T extends ReadonlyArray<infer U>
  ? U extends string
    ? string[]
    : U extends Record<PropertyKey, unknown>
      ? Array<TranslationSchema<U>>
      : string[]
  : T extends Record<PropertyKey, unknown>
    ? { [K in keyof T]: TranslationSchema<T[K]> }
    : string;

