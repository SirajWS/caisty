import type { Language } from "../../types";
import type { ImprintCopy } from "./types";
import { imprintDe } from "./de";
import { imprintEn } from "./en";
import { imprintFr } from "./fr";
import { imprintAr } from "./ar";

export type { ImprintCopy } from "./types";

export const imprint: Record<Language, ImprintCopy> = {
  de: imprintDe,
  en: imprintEn,
  fr: imprintFr,
  ar: imprintAr,
};
