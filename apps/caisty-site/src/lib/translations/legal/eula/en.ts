import { legalContact } from "../shared/contact";
import { legalLinkLabels, legalRelatedLabels } from "../shared/labels";
import type { EulaCopy } from "./types";

export const eulaEn: EulaCopy = {
  documentLabel: "End User License Agreement (EULA)",
  title: "End User License Agreement",
  lastUpdatedLabel: "Last updated",
  effectiveDate: "July 1, 2026",
  versionLabel: "Version",
  version: "2.0 (Master Edition)",
  intro:
    "This End User License Agreement (\"EULA\" or \"Agreement\") is a legally binding contract between Caisty and you as customer or user regarding the licensing and use of Caisty POS, related cloud services, the customer portal, APIs, and other services. By installing, activating, registering, or using the software, you accept this Agreement.",
  linkLabels: legalLinkLabels.en,
  emphasis: {
    licensedNotSold: "licensed, not sold",
    commercialEfforts: "commercially reasonable efforts",
  },
  sections: [
    {
      title: "Part I – General Provisions",
      subsections: [
        {
          title: "1. Introduction",
          paragraphs: [
            "This Agreement governs the licensing and use of the software and forms an integral part of the contractual relationship between Caisty and the customer. If you do not agree to these terms, you may not install, activate, or use the software.",
          ],
        },
        {
          title: "2. Definitions",
          paragraphs: ["Key terms in this Agreement:"],
          list: [
            "**Software** – Caisty POS including updates, modules, and documentation",
            "**Services** – cloud infrastructure, customer portal, license management, APIs, support",
            "**Customer / User** – business entity or authorized natural persons",
            "**Account, Device, License, Subscription** – as defined in the product description",
            "**Confidential Information** – non-public business, technical, or security-related information",
          ],
        },
        {
          title: "3. Scope",
          paragraphs: [
            "This EULA applies to Caisty POS, the customer portal, cloud services, updates, APIs, license activation, subscriptions, and related digital content. In the event of a conflict with a separately signed individual agreement between the parties, the individual agreement prevails.",
          ],
        },
        {
          title: "4. Acceptance",
          paragraphs: [
            "You accept this Agreement by creating an account, activating a license, installing the software, using the customer portal, purchasing or renewing a subscription, or providing electronic confirmation. If you act on behalf of a company, you represent that you are authorized to do so.",
          ],
        },
        {
          title: "5. Eligibility",
          paragraphs: [
            "The Services are intended for business and professional use. You represent that you are at least 18 years of age or legally capable, that you provide accurate registration data, and that you use the Services lawfully.",
          ],
        },
        {
          title: "6. Formation of Contract",
          paragraphs: [
            "This Agreement becomes effective upon the earliest of account creation, license activation, installation, portal access, subscription purchase, or use. A handwritten signature is not required where permitted by law.",
          ],
        },
        {
          title: "7.–8. License Grant and Nature of License",
          paragraphs: [
            "Subject to payment of all fees and compliance with this Agreement, Caisty grants you a limited, non-exclusive, non-transferable, non-sublicensable, revocable license to use the Software solely for internal business purposes. The Software is {{licensedNotSold}}. No transfer of ownership or intellectual property rights occurs. The scope depends on the subscription, device/user limits, and technical requirements.",
          ],
        },
        {
          title: "9. License Restrictions",
          paragraphs: ["Unless legally required or expressly approved in writing, you may not:"],
          list: [
            "copy, distribute, or make the Software publicly available;",
            "create derivative works or perform reverse engineering;",
            "remove or circumvent copyright, trademark, or license protection;",
            "use unauthorized license keys or activation mechanisms;",
            "rent, sublicense, or use the Software for competing products;",
            "introduce malware or abusively automate attacks against the Services.",
          ],
        },
        {
          title: "10. Reservation of Rights",
          paragraphs: [
            "Caisty retains all rights in the Software, source/object code, databases, APIs, documentation, trademarks, know-how, and further developments. The customer receives only the expressly granted usage rights.",
            "Violations of license restrictions may result in immediate suspension.",
          ],
        },
      ],
    },
    {
      title: "Part II – Software and Services",
      subsections: [
        {
          title: "11. User Account",
          paragraphs: [
            "A customer account is required for certain features. You are responsible for accurate data, confidentiality of credentials, authorized users, and all account activity. Security incidents must be reported without undue delay.",
          ],
        },
        {
          title: "12. Device Activation",
          paragraphs: [
            "The Software may only be activated on devices authorized under your subscription. Activation may include online verification, device limits, and periodic validation. Manipulation or circumvention is prohibited.",
          ],
        },
        {
          title: "13. Subscriptions",
          paragraphs: [
            "Access is provided through subscription plans with varying features, device/user limits, support, and integration scope. Descriptions are published on the website and in the customer portal.",
          ],
        },
        {
          title: "14. Installation",
          paragraphs: [
            "Installation is permitted only through official Caisty channels. You are responsible for compatible hardware, operating systems, and networks. Caisty does not guarantee compatibility with unsupported environments.",
          ],
        },
        {
          title: "15. Updates and Upgrades",
          paragraphs: [
            "During an active subscription, updates, security fixes, and new features may be provided. Security updates may be installed automatically. Outdated versions may be discontinued.",
          ],
        },
        {
          title: "16. Cloud Services",
          paragraphs: [
            "Features such as authentication, license verification, synchronization, and the portal require internet access. Caisty strives for availability on a {{commercialEfforts}} basis; uninterrupted operation is not guaranteed.",
          ],
        },
        {
          title: "17. Customer Portal",
          paragraphs: [
            "Through the portal, authorized users may manage licenses, devices, subscriptions, invoices, and security settings, among other things. All actions by authorized users are attributed to the customer.",
          ],
        },
        {
          title: "18. APIs and Integrations",
          paragraphs: [
            "API use is subject to this Agreement, documentation, limits, and security requirements. Third-party integrations are subject to their own terms; Caisty does not guarantee ongoing compatibility.",
          ],
        },
        {
          title: "19. Support",
          paragraphs: [
            "Support within the subscription may include technical assistance, documentation, and bug handling, but not custom development, hardware maintenance, or legal/tax advice. Response times are targets unless otherwise agreed in writing.",
          ],
        },
        {
          title: "20. Availability",
          paragraphs: [
            "Maintenance, security incidents, infrastructure disruptions, and force majeure may affect availability. Temporary interruptions generally do not constitute a breach of contract.",
          ],
        },
      ],
    },
    {
      title: "Part III – Intellectual Property and Data",
      subsections: [
        {
          title: "21.–22. Intellectual Property and Trademarks",
          paragraphs: [
            "The Software and Services remain the exclusive property of Caisty or its licensors. Trademarks, logos, and product names may not be used or altered without permission.",
          ],
        },
        {
          title: "23. Confidentiality",
          paragraphs: [
            "Both parties protect each other's confidential information and use it only for contract-related purposes. These obligations survive termination of the Agreement.",
          ],
        },
        {
          title: "24. Customer Data",
          paragraphs: [
            "The customer retains ownership of its business data. Caisty receives only the processing rights necessary to provide the Services. The customer is responsible for lawfulness, accuracy, and required consents.",
          ],
        },
        {
          title: "25. Data Protection",
          paragraphs: [
            "Personal data is processed in accordance with the GDPR, the {{privacy}}, and – where applicable – the {{dpa}}. Where Caisty processes data on behalf of the customer, Caisty acts as a processor.",
          ],
        },
        {
          title: "26. Security",
          paragraphs: [
            "Caisty implements appropriate technical and organizational measures, including encrypted communication, password hashing, role-based access, monitoring, updates, and recovery concepts. Absolute security cannot be guaranteed; the customer shares responsibility.",
          ],
        },
        {
          title: "27.–28. Backup and Retention",
          paragraphs: [
            "Caisty may perform operational backups; these do not replace the customer's own data backup. Data is stored only as long as required for contract, legal, and operational purposes, then deleted or anonymized.",
          ],
        },
        {
          title: "29.–30. Customer Obligations and Compliance",
          paragraphs: [
            "The customer uses the Software lawfully, complies with applicable laws (tax, accounting, data protection, industry regulations), and implements appropriate internal security measures. Caisty does not provide legal, tax, or accounting advice.",
          ],
        },
      ],
    },
    {
      title: "Part IV – Warranty, Liability, and Termination",
      subsections: [
        {
          title: "31. Disclaimer of Warranties",
          paragraphs: [
            "Caisty develops the Software with the care of a prudent SaaS provider. To the extent permitted by law, the Software is provided \"as is\" and \"as available.\" No warranty is given for error-free, uninterrupted operation or fitness for every purpose, unless mandatory law provides otherwise.",
          ],
        },
        {
          title: "32. Limitation of Liability",
          paragraphs: [
            "Caisty is fully liable for intent, gross negligence, and injury to life, body, or health. Otherwise, liability for indirect damages, lost profits, data loss, or business interruption is excluded to the extent permitted. Total liability is limited to subscription fees paid in the twelve months before the event giving rise to liability, unless mandatory law requires otherwise.",
          ],
        },
        {
          title: "33. Indemnification",
          paragraphs: [
            "The customer indemnifies Caisty against claims arising from breaches of this Agreement, unlawful use, infringing customer data, or inadequate protection of access credentials.",
          ],
        },
        {
          title: "34.–35. Suspension and Termination",
          paragraphs: [
            "Caisty may suspend or terminate Services in cases of security risks, payment default, fraud, or material breaches. The customer may cancel subscriptions through the portal. Upon termination, the license expires.",
          ],
        },
        {
          title: "36. Effects of Termination",
          paragraphs: [
            "Upon termination, the right to use ends; access may be deactivated. Data is retained or deleted in accordance with the privacy policy and DPA. Surviving provisions (IP, confidentiality, liability, indemnification, governing law) remain in effect.",
          ],
        },
        {
          title: "37.–39. Force Majeure, Export Control, Audits",
          paragraphs: [
            "Neither party is liable for force majeure. The customer complies with export and sanctions law. Caisty may request reasonable evidence for license verification without demanding unrestricted system access.",
          ],
        },
      ],
    },
    {
      title: "Part V – Final Provisions",
      subsections: [
        {
          title: "41.–44. Amendments, Assignment, Severability, Entire Agreement",
          paragraphs: [
            "Caisty may amend this Agreement; material changes will be communicated. Continued use constitutes acceptance where permitted by law. Assignment by the customer requires consent. Invalid provisions are replaced by effective ones closest to the economic purpose. This EULA, together with the Terms, privacy policy, cookies policy, and DPA, forms the complete contractual framework.",
          ],
        },
        {
          title: "45.–46. Governing Law and Dispute Resolution",
          paragraphs: [
            "This Agreement is governed by the laws of the **Federal Republic of Germany**, excluding the UN Convention on Contracts for the International Sale of Goods (CISG) and without regard to conflict-of-law rules that would apply another jurisdiction.",
            "To the extent permitted by law – in particular for contracts with merchants (B2B) – the exclusive place of jurisdiction is **Berlin, Germany**.",
            "Disputes are first resolved amicably; thereafter, competent courts may be invoked. Injunctive relief remains reserved.",
          ],
        },
        {
          title: "47.–48. Electronic Acceptance and Language",
          paragraphs: [
            "This Agreement may be accepted electronically and has – where permitted – the same effect as a signature. In case of discrepancies between translations and the authoritative version, the applicable legal framework or agreed master version prevails.",
          ],
        },
        {
          title: "49.–50. Contact and Effective Date",
          paragraphs: [
            "**Effective date:** July 1, 2026",
            "By using the Services, you confirm that you have read and accepted this Agreement.",
          ],
        },
      ],
    },
    {
      title: "Annex A – License Plans",
      paragraphs: [
        "Subscription plans (e.g., Starter, Professional, Enterprise) define device, user, and feature limits. Details are published on the website and in the customer portal. Licenses are non-transferable unless agreed in writing. Fair-use rules support platform stability and security.",
      ],
    },
    {
      title: "Annex B – Acceptable Use Policy (AUP)",
      paragraphs: [
        "The AUP protects security, integrity, and lawful use. Prohibited activities include unlawful use, malware, unauthorized access, circumvention of license mechanisms, excessive automated load, resale without permission, and development of competing products based on proprietary components. Caisty may warn, suspend, or terminate in case of violations.",
      ],
    },
    {
      title: "Annex C – Service Level Objectives (SLO)",
      paragraphs: [
        "Caisty targets high availability of cloud infrastructure (goal: approx. 99.5% monthly uptime, excluding maintenance, force majeure, and third-party outages). SLOs are operational targets, not guaranteed service levels, unless separately agreed in writing. Support is provided during communicated business hours.",
      ],
    },
  ],
  contactSectionTitle: "Contact and effective date",
  contactSectionIntro: "For questions about this Agreement, contact us at:",
  contact: legalContact.en,
  related: legalRelatedLabels.en,
  showOwnerInContact: false,
};
