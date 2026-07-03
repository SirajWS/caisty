import { legalContact } from "../shared/contact";
import { legalLinkLabels, legalRelatedLabels } from "../shared/labels";
import type { CookiePolicyCopy } from "./types";

export const cookiePolicyEn: CookiePolicyCopy = {
  documentLabel: "Cookie Policy",
  title: "Cookie Policy",
  lastUpdatedLabel: "Last updated",
  effectiveDate: "July 1, 2026",
  intro:
    "This Cookie Policy explains how Caisty uses cookies and similar technologies when you use our website, Caisty POS, the customer portal, and related online services.",
  linkLabels: legalLinkLabels.en,
  sections: [
    {
      title: "1. Controller",
      paragraphs: [
        "The controller responsible for this Cookie Policy is Caisty, owner Siraj Bettaieb, Mollwitzstraße 5A, 14059 Berlin, Germany. Full contact details are provided in Section 11.",
      ],
    },
    {
      title: "2. Scope",
      paragraphs: [
        "This Cookie Policy applies to cookies and comparable technologies in connection with:",
        "It supplements our {{privacy}}, which applies whenever cookies process personal data.",
      ],
      list: [
        "caisty.com and related websites;",
        "Caisty POS and embedded web/cloud features;",
        "the Caisty customer portal;",
        "cloud services and synchronisation features;",
        "APIs and administrative interfaces;",
        "future online services offered by Caisty.",
      ],
    },
    {
      title: "3. What are cookies?",
      paragraphs: [
        "Cookies are small text files that may be stored on your device when you visit a website or use an online service. They help remember settings, maintain sessions, improve security, and simplify use.",
        "Cookies do not automatically identify you by name. However, when linked with other information, cookies may constitute personal data.",
        "In addition to classic browser cookies, comparable technologies may be used, such as local storage, session storage, secure authentication tokens, or encrypted session identifiers. This policy includes such technologies where they serve comparable functions.",
      ],
    },
    {
      title: "4. Which cookies do we use?",
      paragraphs: ["Depending on the service used, various categories may apply:"],
      subsections: [
        {
          title: "Strictly Necessary Cookies",
          paragraphs: [
            "These cookies are essential for operating the services, e.g. for secure navigation, basic functions, cart/session logic, or technically required storage. Without them, essential features cannot be provided.",
          ],
        },
        {
          title: "Authentication Cookies",
          paragraphs: [
            "These cookies recognise signed-in users and enable secure access to protected areas such as the customer portal. They prevent you from having to sign in again on every page view.",
          ],
        },
        {
          title: "Security Cookies",
          paragraphs: [
            "Security cookies help protect accounts and systems, for example by detecting suspicious activity, preventing abuse, and securing sessions.",
          ],
        },
        {
          title: "Preference Cookies",
          paragraphs: [
            "These cookies store settings you choose, such as language, theme (light/dark), or other display options, to make your experience more comfortable.",
          ],
        },
        {
          title: "Functional Cookies",
          paragraphs: [
            "Functional cookies enable enhanced convenience features that are not strictly required for basic operation, such as remembering previous selections or simplifying return visits.",
          ],
        },
        {
          title: "Analytics Cookies",
          paragraphs: [
            "Analytics cookies help us understand how the website and services are used (e.g. page views, navigation paths, feature usage in aggregated form). They support improvement of our services.",
          ],
        },
        {
          title: "Performance Cookies",
          paragraphs: [
            "Performance cookies measure load times, response speed, stability, and technical reliability so we can identify bottlenecks and improve service quality.",
          ],
        },
      ],
    },
    {
      title: "5. Legal basis",
      paragraphs: [
        "**Strictly necessary cookies** are used on the basis of our legitimate interest and/or to provide the services you request. Consent is generally not required for these cookies.",
        "**Analytics, performance, functional, and preference cookies** that are not strictly necessary are used only where a valid legal basis exists—particularly your consent under Art. 6(1)(a) GDPR and/or Section 25 TTDSG, where legally required.",
        "Where permitted, certain security and stability measures may also rely on legitimate interests (Art. 6(1)(f) GDPR), provided your interests do not override ours.",
      ],
    },
    {
      title: "6. Cookie banner and consent",
      paragraphs: [
        "On your first visit to our website, you can use our cookie banner to decide whether optional cookies may be set. You have the following options:",
        "You may withdraw your consent at any time with future effect by reopening your cookie settings:",
      ],
      list: [
        "accept all cookies;",
        "reject non-essential cookies;",
        "customise your preferences by category;",
        "change your selection later.",
      ],
      cookiePreferencesLabel: "Open cookie settings",
    },
    {
      title: "7. Browser settings",
      paragraphs: [
        "You can also manage, block, or delete cookies directly in your browser. Please note that disabling required cookies may cause parts of the website or customer portal to stop working correctly.",
        "Instructions are available in your browser's help section (e.g. Chrome, Firefox, Safari, Edge). After deleting cookies, the cookie banner may appear again.",
      ],
    },
    {
      title: "8. Retention period",
      paragraphs: [
        "**Session cookies** are deleted when you close your browser or end the application session. They mainly support authentication, session continuity, and temporary settings.",
        "**Persistent cookies** remain on your device for a defined period or until you delete them manually. They may store language settings, theme, or your cookie choices. Retention depends on the respective purpose and applicable legal requirements.",
      ],
    },
    {
      title: "9. Privacy",
      paragraphs: [
        "Where cookies process personal data, processing is carried out in accordance with our {{privacy}}. There you will find information on your rights, retention periods, recipients, and security measures.",
      ],
    },
    {
      title: "10. Changes",
      paragraphs: [
        "Caisty may update this Cookie Policy when the legal framework, technologies used, or our services change. Material changes will be communicated via the website, customer portal, or other appropriate channels. The current version is available on this page.",
      ],
    },
  ],
  contactSectionTitle: "11. Contact",
  contactSectionIntro: "If you have questions about cookies or consent, please contact us:",
  contact: legalContact.en,
  related: legalRelatedLabels.en,
};
