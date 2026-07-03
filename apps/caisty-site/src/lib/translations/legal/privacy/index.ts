import type { Language } from "../../types";
import type { PrivacyCopy } from "./types";
import { privacyDe } from "./de";
import { privacyEn } from "./en";
import { privacyFr } from "./fr";
import { privacyAr } from "./ar";

export type { PrivacyCopy } from "./types";

export const privacy: Record<Language, PrivacyCopy> = {
  de: privacyDe,
  en: privacyEn,
  fr: privacyFr,
  ar: privacyAr,
};
