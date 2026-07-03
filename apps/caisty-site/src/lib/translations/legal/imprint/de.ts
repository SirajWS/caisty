import { legalContact } from "../shared/contact";
import { legalLinkLabels, legalRelatedLabels } from "../shared/labels";
import type { ImprintCopy } from "./types";

export const imprintDe: ImprintCopy = {
  documentLabel: "Rechtliches",
  title: "Impressum",
  lastUpdatedLabel: "Stand",
  effectiveDate: "1. Juli 2026",
  intro:
    "Dieses Impressum enthält die gesetzlich vorgeschriebenen Anbieterkennzeichnungen für Caisty gemäß § 5 TMG.",
  linkLabels: legalLinkLabels.de,
  sections: [
    {
      title: "1. Angaben gemäß § 5 TMG",
      paragraphs: [
        "Caisty",
        "Inhaber: Siraj Bettaieb",
        "Mollwitzstraße 5A",
        "14059 Berlin",
        "Deutschland",
      ],
    },
    {
      title: "2. Kontakt",
      paragraphs: [
        "E-Mail: {{infoEmail}}",
        "Support: {{supportEmail}}",
      ],
    },
    {
      title: "3. Wirtschafts-Identifikationsnummer",
      paragraphs: ["DE463279361"],
    },
  ],
  contactSectionTitle: "Kontakt",
  showOwnerInContact: true,
  contact: legalContact.de,
  related: legalRelatedLabels.de,
};
