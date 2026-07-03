import { legalContact } from "../shared/contact";
import { legalLinkLabels, legalRelatedLabels } from "../shared/labels";
import type { SubprocessorsCopy } from "./types";

export const subprocessorsFr: SubprocessorsCopy = {
  documentLabel: "Sous-traitants autorisés",
  title: "Sous-traitants",
  lastUpdatedLabel: "Dernière mise à jour",
  effectiveDate: "1er juillet 2026",
  intro:
    "Cette page répertorie les sous-traitants engagés par Caisty conformément à l'art. 28, par. 2, let. d du RGPD et à notre {{dpa}}. La liste est mise à jour en cas de modifications importantes.",
  linkLabels: legalLinkLabels.fr,
  sections: [
    {
      title: "Aperçu préliminaire",
      notice:
        "**Avis :** La liste officielle et contraignante des sous-traitants est en cours de finalisation. Les fournisseurs mentionnés ci-dessous sont des catégories typiques que Caisty peut utiliser selon le service. Une fois la liste définitive publiée, elle remplacera le présent aperçu préliminaire.",
      table: {
        headers: ["Fournisseur", "Finalité"],
        rows: [
          ["Hetzner", "Hébergement cloud et infrastructure"],
          ["Stripe", "Traitement des paiements"],
          ["PayPal", "Traitement des paiements"],
          ["Vercel", "Hébergement et déploiement du site web"],
          ["Google", "Authentification OAuth (le cas échéant)"],
        ],
      },
    },
  ],
  contactSectionTitle: "Contact",
  contactSectionIntro: "Questions relatives aux sous-traitants : {{privacyEmail}}",
  contact: legalContact.fr,
  related: legalRelatedLabels.fr,
};
