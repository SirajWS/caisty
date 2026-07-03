import type { Language } from "../../types";
import type { CookiePolicyCopy } from "./types";
import { cookiePolicyDe } from "./de";
import { cookiePolicyEn } from "./en";
import { cookiePolicyFr } from "./fr";
import { cookiePolicyAr } from "./ar";

export type { CookiePolicyCopy } from "./types";

export const cookie: Record<Language, CookiePolicyCopy> = {
  de: cookiePolicyDe,
  en: cookiePolicyEn,
  fr: cookiePolicyFr,
  ar: cookiePolicyAr,
};
