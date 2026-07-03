import { legalContact } from "../shared/contact";
import { legalLinkLabels, legalRelatedLabels } from "../shared/labels";
import type { SubprocessorsCopy } from "./types";

export const subprocessorsEn: SubprocessorsCopy = {
  documentLabel: "Authorized Subprocessors",
  title: "Subprocessors",
  lastUpdatedLabel: "Last updated",
  effectiveDate: "July 1, 2026",
  intro:
    "This page lists subprocessors engaged by Caisty pursuant to Art. 28(2)(d) GDPR and our {{dpa}}. The list is updated when material changes occur.",
  linkLabels: legalLinkLabels.en,
  sections: [
    {
      title: "Preliminary overview",
      notice:
        "**Notice:** The official, binding subprocessor list is currently being finalised. The providers listed below are typical categories that Caisty may use depending on the service. Once the final list is published, it will replace this preliminary overview.",
      table: {
        headers: ["Provider", "Purpose"],
        rows: [
          ["Hetzner", "Cloud hosting and infrastructure"],
          ["Stripe", "Payment processing"],
          ["PayPal", "Payment processing"],
          ["Vercel", "Website hosting and deployment"],
          ["Google", "OAuth authentication (where enabled)"],
        ],
      },
    },
  ],
  contactSectionTitle: "Contact",
  contactSectionIntro: "Questions about subprocessors: {{privacyEmail}}",
  contact: legalContact.en,
  related: legalRelatedLabels.en,
};
