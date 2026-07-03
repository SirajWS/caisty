import { legalContact } from "../shared/contact";
import { legalLinkLabels, legalRelatedLabels } from "../shared/labels";
import type { ImprintCopy } from "./types";

export const imprintFr: ImprintCopy = {
  documentLabel: "Mentions légales",
  title: "Mentions légales",
  lastUpdatedLabel: "Dernière mise à jour",
  effectiveDate: "1er juillet 2026",
  intro:
    "Les présentes mentions légales contiennent les informations d'identification du fournisseur exigées par la loi pour Caisty conformément à l'article 5 de la loi allemande sur les télémédias (TMG).",
  linkLabels: legalLinkLabels.fr,
  sections: [
    {
      title: "1. Informations conformément à l'article 5 TMG",
      paragraphs: [
        "Caisty",
        "Propriétaire : Siraj Bettaieb",
        "Mollwitzstraße 5A",
        "14059 Berlin",
        "Allemagne",
      ],
    },
    {
      title: "2. Contact",
      paragraphs: [
        "E-mail : {{infoEmail}}",
        "Support : {{supportEmail}}",
      ],
    },
    {
      title: "3. Numéro d'identification économique",
      paragraphs: ["DE463279361"],
    },
  ],
  contactSectionTitle: "Contact",
  showOwnerInContact: true,
  contact: legalContact.fr,
  related: legalRelatedLabels.fr,
};
