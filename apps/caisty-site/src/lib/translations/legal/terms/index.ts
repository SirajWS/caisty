import type { Language } from "../../types";
import type { TermsCopy } from "./types";
import { termsDe } from "./de";
import { termsEn } from "./en";
import { termsFr } from "./fr";
import { termsAr } from "./ar";

export type { TermsCopy } from "./types";

export const terms: Record<Language, TermsCopy> = {
  de: termsDe,
  en: termsEn,
  fr: termsFr,
  ar: termsAr,
};
