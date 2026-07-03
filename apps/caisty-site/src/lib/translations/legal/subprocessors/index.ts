import type { Language } from "../../types";
import type { SubprocessorsCopy } from "./types";
import { subprocessorsDe } from "./de";
import { subprocessorsEn } from "./en";
import { subprocessorsFr } from "./fr";
import { subprocessorsAr } from "./ar";

export type { SubprocessorsCopy } from "./types";

export const subprocessors: Record<Language, SubprocessorsCopy> = {
  de: subprocessorsDe,
  en: subprocessorsEn,
  fr: subprocessorsFr,
  ar: subprocessorsAr,
};
