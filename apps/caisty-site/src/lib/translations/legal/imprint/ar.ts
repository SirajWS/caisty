import { legalContact } from "../shared/contact";
import { legalLinkLabels, legalRelatedLabels } from "../shared/labels";
import type { ImprintCopy } from "./types";

export const imprintAr: ImprintCopy = {
  documentLabel: "البيانات القانونية",
  title: "البيانات القانونية",
  lastUpdatedLabel: "آخر تحديث",
  effectiveDate: "1 يوليو 2026",
  intro:
    "تتضمن هذه البيانات القانونية معلومات تعريف المزوّد المطلوبة قانوناً لـ Caisty وفقاً للمادة 5 من قانون الوسائط الإلكترونية الألماني (TMG).",
  linkLabels: legalLinkLabels.ar,
  sections: [
    {
      title: "1. معلومات وفقاً للمادة 5 من قانون TMG",
      paragraphs: [
        "Caisty",
        "المالك: Siraj Bettaieb",
        "Mollwitzstraße 5A",
        "14059 برلين",
        "ألمانيا",
      ],
    },
    {
      title: "2. الاتصال",
      paragraphs: [
        "البريد الإلكتروني: {{infoEmail}}",
        "الدعم: {{supportEmail}}",
      ],
    },
    {
      title: "3. رقم التعريف الاقتصادي",
      paragraphs: ["DE463279361"],
    },
  ],
  contactSectionTitle: "الاتصال",
  showOwnerInContact: true,
  contact: legalContact.ar,
  related: legalRelatedLabels.ar,
};
