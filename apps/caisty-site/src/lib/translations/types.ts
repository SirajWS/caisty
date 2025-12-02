// Type definitions für Übersetzungen

export type Language = "de" | "en" | "fr" | "ar";

export const languages: { code: Language; name: string; nativeName: string }[] = [
  { code: "de", name: "German", nativeName: "Deutsch" },
  { code: "en", name: "English", nativeName: "English" },
  { code: "fr", name: "French", nativeName: "Français" },
  { code: "ar", name: "Arabic", nativeName: "العربية" },
];

