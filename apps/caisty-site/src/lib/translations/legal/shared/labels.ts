import type { Language } from "../../types";
import type { LegalLinkLabels, LegalRelatedLabels } from "./types";

const linkLabelsDe: LegalLinkLabels = {
  terms: "Allgemeine Geschäftsbedingungen",
  privacy: "Datenschutzerklärung",
  cookie: "Cookie-Richtlinie",
  eula: "Endbenutzer-Lizenzvertrag (EULA)",
  dpa: "Auftragsverarbeitungsvertrag (AVV)",
  imprint: "Impressum",
  subprocessors: "Unterauftragsverarbeiter",
};

const linkLabelsEn: LegalLinkLabels = {
  terms: "Terms and Conditions",
  privacy: "Privacy Policy",
  cookie: "Cookie Policy",
  eula: "End User License Agreement (EULA)",
  dpa: "Data Processing Agreement (DPA)",
  imprint: "Imprint",
  subprocessors: "Subprocessors",
};

const linkLabelsFr: LegalLinkLabels = {
  terms: "Conditions générales",
  privacy: "Politique de confidentialité",
  cookie: "Politique relative aux cookies",
  eula: "Contrat de licence utilisateur final (CLUF)",
  dpa: "Accord de traitement des données (DPA)",
  imprint: "Mentions légales",
  subprocessors: "Sous-traitants",
};

const linkLabelsAr: LegalLinkLabels = {
  terms: "الشروط والأحكام العامة",
  privacy: "سياسة الخصوصية",
  cookie: "سياسة ملفات تعريف الارتباط",
  eula: "اتفاقية ترخيص المستخدم النهائي (EULA)",
  dpa: "اتفاقية معالجة البيانات (DPA)",
  imprint: "البيانات القانونية",
  subprocessors: "المعالجون الفرعيون",
};

export const legalLinkLabels: Record<Language, LegalLinkLabels> = {
  de: linkLabelsDe,
  en: linkLabelsEn,
  fr: linkLabelsFr,
  ar: linkLabelsAr,
};

const relatedDe: LegalRelatedLabels = {
  title: "Verwandte Dokumente",
  terms: "Allgemeine Geschäftsbedingungen",
  privacy: "Datenschutzerklärung",
  cookie: "Cookie-Richtlinie",
  eula: "Endbenutzer-Lizenzvereinbarung (EULA)",
  dpa: "Auftragsverarbeitungsvertrag (AVV)",
  imprint: "Impressum",
  subprocessors: "Unterauftragsverarbeiter",
};

const relatedEn: LegalRelatedLabels = {
  title: "Related documents",
  terms: "Terms and Conditions",
  privacy: "Privacy Policy",
  cookie: "Cookie Policy",
  eula: "End User License Agreement (EULA)",
  dpa: "Data Processing Agreement (DPA)",
  imprint: "Imprint",
  subprocessors: "Subprocessors",
};

const relatedFr: LegalRelatedLabels = {
  title: "Documents connexes",
  terms: "Conditions générales",
  privacy: "Politique de confidentialité",
  cookie: "Politique relative aux cookies",
  eula: "Contrat de licence utilisateur final (CLUF)",
  dpa: "Accord de traitement des données (DPA)",
  imprint: "Mentions légales",
  subprocessors: "Sous-traitants",
};

const relatedAr: LegalRelatedLabels = {
  title: "مستندات ذات صلة",
  terms: "الشروط والأحكام العامة",
  privacy: "سياسة الخصوصية",
  cookie: "سياسة ملفات تعريف الارتباط",
  eula: "اتفاقية ترخيص المستخدم النهائي (EULA)",
  dpa: "اتفاقية معالجة البيانات (DPA)",
  imprint: "البيانات القانونية",
  subprocessors: "المعالجون الفرعيون",
};

export const legalRelatedLabels: Record<Language, LegalRelatedLabels> = {
  de: relatedDe,
  en: relatedEn,
  fr: relatedFr,
  ar: relatedAr,
};
