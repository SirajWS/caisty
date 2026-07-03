import { legalContact } from "../shared/contact";
import { legalLinkLabels, legalRelatedLabels } from "../shared/labels";
import type { PrivacyCopy } from "./types";

const { imprintNote: _imprintNote, ...privacyContactEn } = legalContact.en;

export const privacyEn: PrivacyCopy = {
  documentLabel: "Legal",
  title: "Privacy Policy",
  lastUpdatedLabel: "Last updated",
  effectiveDate: "July 1, 2026",
  intro:
    "This Privacy Policy explains how Caisty collects, uses, stores, and protects personal data when you use our website, Caisty POS, the customer portal, and related services. It forms part of Caisty's legal framework and should be read together with the {{terms}}, {{cookie}}, {{eula}}, and — where applicable — the {{dpa}}.",
  linkLabels: legalLinkLabels.en,
  sections: [
    {
      title: "1. Data controller",
      paragraphs: [
        "The data controller within the meaning of the General Data Protection Regulation (GDPR) is:",
        "Caisty, owner Siraj Bettaieb, Mollwitzstraße 5A, 14059 Berlin, Germany. General inquiries: {{infoEmail}}. Support: {{supportEmail}}. Privacy: {{privacyEmail}}.",
        "Where Caisty processes personal data on behalf of business customers, Caisty may act as a processor within the meaning of Art. 28 GDPR. Details are set out in the {{dpa}}.",
      ],
    },
    {
      title: "2. Scope",
      paragraphs: [
        "This Privacy Policy applies to the processing of personal data in connection with:",
        "It applies regardless of whether you use our services via the website, software, portal, or other authorized access channels — before, during, and after a contractual relationship, where data continues to be processed in accordance with law.",
      ],
      list: [
        "the website caisty.com and related subpages;",
        "Caisty POS (desktop software and related cloud features);",
        "the Caisty customer portal;",
        "cloud services, synchronization, and management features;",
        "licensing, activation, and device management;",
        "billing, invoicing, and subscription management;",
        "support communications and customer inquiries;",
        "APIs and technical interfaces, where offered.",
      ],
    },
    {
      title: "3. Data we process",
      paragraphs: [
        "Depending on the services you use, we may process different categories of personal data, in particular:",
        "Passwords are not stored in plain text. Business data you enter in Caisty POS or the portal (e.g., products, orders, customers in your business) may contain third-party personal data; as the operator, you remain responsible for processing that data lawfully.",
      ],
      list: [
        "name and contact details;",
        "company or business name;",
        "email address;",
        "billing and payment-related information;",
        "account data (user ID, language settings, profile information);",
        "license data (license key, plan, status, term);",
        "device data (device identifiers, operating system, app version, activation status);",
        "IP address and connection data;",
        "technical logs and error reports;",
        "support messages and communication content;",
        "payment status and transaction references (without full card data at Caisty).",
      ],
    },
    {
      title: "4. Purposes of processing",
      paragraphs: ["We process personal data in particular for the following purposes:"],
      list: [
        "creating and managing customer accounts;",
        "email verification and authentication;",
        "registration, login, and access control;",
        "license activation, management, and device assignment;",
        "subscription and contract management;",
        "invoicing and accounting;",
        "payment confirmation and dunning;",
        "customer support and handling inquiries;",
        "security, fraud prevention, and abuse detection;",
        "operation, maintenance, and improvement of our services;",
        "compliance with legal obligations.",
      ],
    },
    {
      title: "5. Legal bases",
      paragraphs: ["Processing is based on the GDPR, in particular:"],
      list: [
        "**Art. 6(1)(b) GDPR** — to take steps prior to entering a contract and to perform the contract (account, license, billing, support);",
        "**Art. 6(1)(c) GDPR** — to comply with legal obligations (e.g., tax and commercial retention requirements);",
        "**Art. 6(1)(f) GDPR** — based on legitimate interests (e.g., IT security, stability, error analysis, service improvement), where your interests do not override ours;",
        "**Art. 6(1)(a) GDPR** — based on your consent where consent is required (e.g., non-essential cookies or optional marketing communications).",
      ],
    },
    {
      title: "6. Payment providers",
      paragraphs: [
        "Payments may be processed through external payment service providers such as **Stripe**, **PayPal**, or other providers shown in the customer portal.",
        "Caisty does not store full payment card data. Payment information is processed directly by the respective payment service provider. We typically receive only information such as payment status, transaction ID, amount, and limited billing metadata required for the contract and accounting.",
        "Processing by payment service providers is governed by their own privacy notices. We recommend reviewing them at checkout.",
      ],
    },
    {
      title: "7. Hosting and service providers",
      paragraphs: [
        "To provide our services, we use carefully selected service providers, for example for:",
        "These providers process data only to the extent necessary and — where they act as processors — on the basis of contractual agreements under Art. 28 GDPR. We maintain a separate overview of key {{subprocessors}}.",
        "Processing outside the European Economic Area takes place only where appropriate safeguards exist (e.g., standard contractual clauses).",
      ],
      list: [
        "hosting and cloud infrastructure;",
        "application storage and operation;",
        "email delivery and transactional communications;",
        "payment processing;",
        "security and monitoring services.",
      ],
    },
    {
      title: "8. Cookies",
      paragraphs: [
        "Our website and services may use cookies and similar technologies, for example for login, security, language settings, or — with consent — analytics.",
        "Details on cookies used, retention periods, and your choices are set out in our {{cookie}}.",
      ],
    },
    {
      title: "9. Retention",
      paragraphs: [
        "We retain personal data only for as long as necessary for the purposes described or where statutory retention obligations apply.",
        "Contract and billing data may be retained for the duration of the contractual relationship and beyond in accordance with commercial and tax law. Support messages and technical logs are stored only as long as needed for support, security, or evidentiary purposes.",
        "After the respective periods expire, data is deleted or anonymized unless further retention is legally permitted or required.",
      ],
    },
    {
      title: "10. Your rights",
      paragraphs: [
        "Subject to the applicable conditions, you have the following rights under the GDPR:",
        "To exercise your rights, contact {{privacyEmail}}. You also have the right to lodge a complaint with a supervisory authority, in particular in the EU member state of your residence, place of work, or the place of the alleged infringement.",
      ],
      list: [
        "**Right of access** (Art. 15 GDPR) to information about how your data is processed;",
        "**Right to rectification** (Art. 16 GDPR) of inaccurate data;",
        "**Right to erasure** (Art. 17 GDPR), where no retention obligations apply;",
        "**Right to restriction of processing** (Art. 18 GDPR);",
        "**Right to data portability** (Art. 20 GDPR), where applicable;",
        "**Right to object** (Art. 21 GDPR) to processing based on legitimate interests;",
        "**Right to withdraw consent** (Art. 7(3) GDPR) with effect for the future.",
      ],
    },
    {
      title: "11. Security",
      paragraphs: [
        "Caisty implements appropriate technical and organizational measures to protect personal data against unauthorized access, loss, manipulation, or disclosure, including:",
        "Absolute security cannot be guaranteed. You are also responsible for protecting your login credentials and the devices on which Caisty POS is used.",
      ],
      list: [
        "encrypted communication (e.g., TLS/HTTPS);",
        "secure password storage (hashing);",
        "role-based access control;",
        "regular backups and recovery procedures;",
        "monitoring and logging of security-relevant events;",
        "regular updates and security improvements.",
      ],
    },
  ],
  contactSectionTitle: "12. Contact",
  contactSectionIntro:
    "For questions about privacy, exercising your rights, or this Privacy Policy, you can reach us at: We may update this Privacy Policy when the legal framework, our services, or processing activities change. The current version is always available on this page.",
  contact: privacyContactEn,
  related: legalRelatedLabels.en,
  showOwnerInContact: false,
};
