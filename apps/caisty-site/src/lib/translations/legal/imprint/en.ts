import { legalContact } from "../shared/contact";
import { legalLinkLabels, legalRelatedLabels } from "../shared/labels";
import type { ImprintCopy } from "./types";

export const imprintEn: ImprintCopy = {
  documentLabel: "Legal",
  title: "Imprint",
  lastUpdatedLabel: "Last updated",
  effectiveDate: "July 1, 2026",
  intro:
    "This imprint contains the legally required provider identification for Caisty pursuant to Section 5 of the German Telemedia Act (TMG).",
  linkLabels: legalLinkLabels.en,
  sections: [
    {
      title: "1. Information pursuant to Section 5 TMG",
      paragraphs: [
        "Caisty",
        "Owner: Siraj Bettaieb",
        "Mollwitzstraße 5A",
        "14059 Berlin",
        "Germany",
      ],
    },
    {
      title: "2. Contact",
      paragraphs: [
        "Email: {{infoEmail}}",
        "Support: {{supportEmail}}",
      ],
    },
    {
      title: "3. Business identification number",
      paragraphs: ["DE463279361"],
    },
  ],
  contactSectionTitle: "Contact",
  showOwnerInContact: true,
  contact: legalContact.en,
  related: legalRelatedLabels.en,
};
