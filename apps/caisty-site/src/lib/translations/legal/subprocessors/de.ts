import { legalContact } from "../shared/contact";
import { legalLinkLabels, legalRelatedLabels } from "../shared/labels";
import type { SubprocessorsCopy } from "./types";

export const subprocessorsDe: SubprocessorsCopy = {
  documentLabel: "Unterauftragsverarbeiter",
  title: "Unterauftragsverarbeiter",
  lastUpdatedLabel: "Stand",
  effectiveDate: "1. Juli 2026",
  intro:
    "Diese Seite listet die von Caisty eingesetzten Unterauftragsverarbeiter (Subprocessor) gemäß Art. 28 Abs. 2 lit. d DSGVO und unserem {{dpa}}. Die Liste wird bei wesentlichen Änderungen aktualisiert.",
  linkLabels: legalLinkLabels.de,
  sections: [
    {
      title: "Vorläufige Übersicht",
      notice:
        "**Hinweis:** Die offizielle, verbindliche Unterauftragsverarbeiter-Liste wird derzeit finalisiert. Die unten genannten Anbieter sind typische Kategorien, die Caisty je nach Service nutzen kann. Sobald die endgültige Liste veröffentlicht ist, ersetzt sie diese vorläufige Übersicht.",
      table: {
        headers: ["Anbieter", "Zweck"],
        rows: [
          ["Hetzner", "Cloud-Hosting und Infrastruktur"],
          ["Stripe", "Zahlungsabwicklung"],
          ["PayPal", "Zahlungsabwicklung"],
          ["Vercel", "Website-Hosting und Bereitstellung"],
          ["Google", "OAuth-Authentifizierung (sofern aktiviert)"],
        ],
      },
    },
  ],
  contactSectionTitle: "Kontakt",
  contactSectionIntro: "Fragen zu Unterauftragsverarbeitern: {{privacyEmail}}",
  contact: legalContact.de,
  related: legalRelatedLabels.de,
};
