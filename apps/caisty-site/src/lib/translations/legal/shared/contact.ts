import type { Language } from "../../types";
import type { LegalContactCopy } from "./types";

const contactDe: LegalContactCopy = {
  company: "Caisty",
  street: "Mollwitzstraße 5A",
  city: "14059 Berlin",
  country: "Deutschland",
  generalInquiries: "Allgemeine Anfragen",
  supportLabel: "Support",
  privacyLabel: "Datenschutz",
  taxIdLabel: "Wirtschafts-Identifikationsnummer",
  taxId: "DE463279361",
  ownerLabel: "Inhaber",
  ownerName: "Siraj Bettaieb",
  imprintNote: "Weitere Informationen finden Sie im {{imprint}}.",
};

const contactEn: LegalContactCopy = {
  company: "Caisty",
  street: "Mollwitzstraße 5A",
  city: "14059 Berlin",
  country: "Germany",
  generalInquiries: "General inquiries",
  supportLabel: "Support",
  privacyLabel: "Privacy",
  taxIdLabel: "Business identification number",
  taxId: "DE463279361",
  ownerLabel: "Owner",
  ownerName: "Siraj Bettaieb",
  imprintNote: "Further information is available in the {{imprint}}.",
};

const contactFr: LegalContactCopy = {
  company: "Caisty",
  street: "Mollwitzstraße 5A",
  city: "14059 Berlin",
  country: "Allemagne",
  generalInquiries: "Demandes générales",
  supportLabel: "Support",
  privacyLabel: "Confidentialité",
  taxIdLabel: "Numéro d'identification économique",
  taxId: "DE463279361",
  ownerLabel: "Propriétaire",
  ownerName: "Siraj Bettaieb",
  imprintNote: "Des informations complémentaires sont disponibles dans les {{imprint}}.",
};

const contactAr: LegalContactCopy = {
  company: "Caisty",
  street: "Mollwitzstraße 5A",
  city: "14059 Berlin",
  country: "ألمانيا",
  generalInquiries: "استفسارات عامة",
  supportLabel: "الدعم",
  privacyLabel: "الخصوصية",
  taxIdLabel: "رقم التعريف الاقتصادي",
  taxId: "DE463279361",
  ownerLabel: "المالك",
  ownerName: "Siraj Bettaieb",
  imprintNote: "تتوفر معلومات إضافية في {{imprint}}.",
};

export const legalContact: Record<Language, LegalContactCopy> = {
  de: contactDe,
  en: contactEn,
  fr: contactFr,
  ar: contactAr,
};
