// Locale tags for dates/numbers in the customer portal (matches LanguageContext).
import type { Language } from "./translations/types";

export function portalLocaleTag(language: Language): string {
  switch (language) {
    case "de":
      return "de-DE";
    case "fr":
      return "fr-FR";
    case "ar":
      return "ar-SA";
    default:
      return "en-GB";
  }
}
