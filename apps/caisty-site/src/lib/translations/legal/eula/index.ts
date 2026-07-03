import type { Language } from "../../types";
import type { EulaCopy } from "./types";
import { eulaDe } from "./de";
import { eulaEn } from "./en";
import { eulaFr } from "./fr";
import { eulaAr } from "./ar";

export type { EulaCopy } from "./types";

export const eula: Record<Language, EulaCopy> = {
  de: eulaDe,
  en: eulaEn,
  fr: eulaFr,
  ar: eulaAr,
};
