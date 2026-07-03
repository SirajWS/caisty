import type { Language } from "../../types";
import type { DpaCopy } from "./types";
import { dpaDe } from "./de";
import { dpaEn } from "./en";
import { dpaFr } from "./fr";
import { dpaAr } from "./ar";

export type { DpaCopy } from "./types";

export const dpa: Record<Language, DpaCopy> = {
  de: dpaDe,
  en: dpaEn,
  fr: dpaFr,
  ar: dpaAr,
};
