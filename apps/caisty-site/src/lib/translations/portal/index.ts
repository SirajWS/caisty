import type { Language } from "../types";
import { portalEn, type PortalTranslations } from "./en";
import { portalDe } from "./de";
import { portalFr } from "./fr";
import { portalAr } from "./ar";

export type { PortalTranslations };
export { portalEn, portalDe, portalFr, portalAr };

export const portal: Record<Language, PortalTranslations> = {
  en: portalEn,
  de: portalDe,
  fr: portalFr,
  ar: portalAr,
};
