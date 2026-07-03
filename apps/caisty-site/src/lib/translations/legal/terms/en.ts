import { legalContact } from "../shared/contact";
import { legalLinkLabels, legalRelatedLabels } from "../shared/labels";
import type { TermsCopy } from "./types";

export const termsEn: TermsCopy = {
  documentLabel: "Legal",
  title: "Terms and Conditions",
  lastUpdatedLabel: "Last updated",
  effectiveDate: "July 1, 2026",
  intro:
    "These Terms and Conditions govern the contractual relationship between Caisty and customers who use or subscribe to our software, cloud services, and customer portal. They form part of Caisty's legal framework and should be read together with the {{privacy}}, {{cookie}}, {{eula}}, {{dpa}}, and {{imprint}}.",
  linkLabels: legalLinkLabels.en,
  emphasis: {
    licensedNotSold: "licensed, not sold",
    commercialEfforts: "commercially reasonable efforts",
  },
  sections: [
    {
      title: "1. Scope",
      paragraphs: [
        "These Terms apply to all contracts and usage relationships between Caisty, represented by Siraj Bettaieb, Mollwitzstraße 5A, 14059 Berlin, Germany (\"Caisty\", \"we\", or \"Provider\"), and natural or legal persons who obtain our services (\"Customer\" or \"you\").",
        "These Terms apply to the acquisition, subscription, licensing, and use of Caisty POS software, the customer portal, related cloud services, and other digital products and services offered by Caisty.",
        "Conflicting or supplementary terms proposed by the Customer apply only if Caisty has expressly agreed to them in writing. By registering, placing an order, subscribing, installing, or using the services, you accept these Terms.",
      ],
    },
    {
      title: "2. Subject matter",
      paragraphs: [
        "Caisty provides the following services in particular:",
        "The scope, features, and availability of the services depend on the subscription booked, the applicable product description on the website or in the customer portal, and any individual agreements.",
      ],
      list: [
        "Caisty POS – cloud-based point-of-sale software for use in businesses",
        "Access to the Caisty customer portal for managing licenses, devices, subscriptions, and invoices",
        "Cloud synchronization, management features, and technical support within the selected plan",
        "Additional software products and services that Caisty may offer in the future",
      ],
    },
    {
      title: "3. Registration and customer account",
      paragraphs: [
        "Creating a customer account is required to use certain services. You agree to provide accurate, complete, and current information during registration and to update it promptly when it changes.",
        "You are responsible for keeping your login credentials confidential and ensuring that only authorized persons access your account. Actions taken using your credentials will be attributed to you unless you demonstrate that a security incident was solely attributable to Caisty.",
        "Caisty may temporarily restrict or suspend account access when necessary to protect the security, integrity, or proper use of the services.",
      ],
    },
    {
      title: "4. License and use of the software",
      paragraphs: [
        "Caisty POS and other Caisty software products are {{licensedNotSold}}. You receive a limited, non-exclusive, non-transferable, and revocable license to use the software within your subscription and in accordance with the {{eula}}.",
        "Ownership and intellectual property rights in the software remain with Caisty and its licensors. Use beyond the agreed scope of services — including unauthorized copying, distribution, sublicensing, or commercial exploitation — is prohibited.",
        "You are solely responsible for using the software lawfully and in compliance with applicable law. Caisty does not provide legal, tax, or accounting advice.",
        "Caisty may provide updates, security improvements, and new versions. Certain updates may be installed automatically where required for security or operation.",
      ],
    },
    {
      title: "5. Subscriptions, pricing, and payments",
      paragraphs: [
        "Use of the services is generally based on recurring subscriptions with different plans, features, and prices. Current prices and service scopes are displayed on the website and in the customer portal.",
        "Unless stated otherwise, prices are quoted in euros. Statutory taxes and levies may apply additionally where legally required.",
        "Billing follows the selected billing period (e.g., monthly or annually). Payments must be made using the payment methods offered in the customer portal — currently primarily card and PayPal.",
        "In the event of late payment, failed payments, or unauthorized use, Caisty may send reminders, temporarily suspend access, and assert further rights. Fees already incurred remain due in any case.",
        "Subscriptions renew automatically for the respective billing period unless terminated in due time.",
      ],
    },
    {
      title: "6. Trial period",
      paragraphs: [
        "Caisty may offer free trial or evaluation periods. The scope, duration, and availability of a trial are set out in the relevant offer description in the customer portal or on the website.",
        "When the trial ends, free access ends unless you subscribe to a paid plan. Caisty may change or discontinue trial offers at any time.",
      ],
    },
    {
      title: "7. Availability and maintenance",
      paragraphs: [
        "Caisty strives to provide the services reliably and securely. Unless expressly agreed otherwise in a separate written agreement, services are provided on a {{commercialEfforts}} basis. Uninterrupted or error-free availability is not guaranteed.",
        "Temporary limitations may arise in particular from maintenance, updates, infrastructure work, third-party outages, network issues, security incidents, or force majeure. Planned maintenance will be announced in advance where reasonably practicable.",
      ],
    },
    {
      title: "8. Customer obligations",
      paragraphs: [
        "You agree in particular to:",
        "You remain responsible for complying with tax, accounting, employment, data protection, and industry-specific regulations in your business. Caisty does not replace independent legal or compliance advice.",
      ],
      list: [
        "use the services only for lawful business purposes;",
        "comply with applicable law, these Terms, and the EULA;",
        "adequately protect login credentials, devices, and networks;",
        "not carry out unauthorized access, manipulation, or disruption;",
        "not introduce malware or circumvent security mechanisms;",
        "collect and use content and data you process only lawfully;",
        "report security incidents and suspected misuse to Caisty without delay.",
      ],
    },
    {
      title: "9. Data protection",
      paragraphs: [
        "Caisty processes personal data in accordance with applicable data protection law. Details on the nature, scope, and purpose of processing, your rights, and data processing relationships are set out in the {{privacy}} and, where applicable, the {{dpa}}.",
        "You are responsible for ensuring that data you enter into the services is collected and processed lawfully and that required information is provided to data subjects.",
      ],
    },
    {
      title: "10. Third-party providers",
      paragraphs: [
        "The services may connect to products or services from independent third parties, such as payment providers, cloud infrastructure, authentication services, hardware manufacturers, or fiscal services.",
        "Caisty does not control these third parties and assumes no responsibility for their availability, functionality, security, pricing, or terms. Use of third-party services is subject to the respective provider's terms and privacy notices.",
      ],
    },
    {
      title: "11. Termination",
      paragraphs: [
        "You may cancel your subscription at any time via the customer portal or by email to {{supportEmail}}. Cancellation takes effect at the end of the current billing period unless a different statutory right of termination applies.",
        "Termination does not generally entitle you to a refund of fees already paid for the current period. Payment claims that have already fallen due remain unaffected.",
        "Caisty may terminate the contract for cause without notice or suspend access, in particular in cases of material breach of these Terms or the EULA, late payment, fraudulent use, significant security risks, or where continued provision would be unlawful. Where reasonably practicable, Caisty will set a remedy period beforehand.",
        "Upon termination, your right to use the services ends. Where technically possible, you should export relevant data before the contract ends. Caisty may delete or anonymize data after statutory or contractual retention periods expire.",
      ],
    },
    {
      title: "12. Liability",
      paragraphs: [
        "Caisty is liable without limitation for intent and gross negligence and for damage resulting from injury to life, body, or health. For slight negligence in breach of essential contractual obligations (cardinal duties), liability is limited to foreseeable, typical contract damage.",
        "Otherwise, liability for slight negligence is excluded to the extent permitted by law. Caisty is not liable for indirect damage, lost profits, data loss, or business interruption unless mandatory law provides otherwise.",
        "Where liability is not excluded, Caisty's aggregate liability is limited to the amount you actually paid for the affected services in the twelve months before the event giving rise to the claim, unless mandatory law provides for broader liability.",
      ],
    },
    {
      title: "13. Changes to these Terms",
      paragraphs: [
        "Caisty may amend these Terms when necessary to reflect legal, technical, or operational developments or to further develop the services.",
        "Material changes affecting your contractual rights will be communicated to you in an appropriate manner, for example by email, in the customer portal, or on the website. Where permitted by law, your continued use after the amended version takes effect constitutes acceptance. If you object to material changes, you may terminate the contract when the changes take effect.",
      ],
    },
    {
      title: "14. Final provisions",
      paragraphs: [
        "Together with the EULA, Privacy Policy, Cookie Policy, DPA (where applicable), and Imprint, these Terms form the contractual basis unless individual written agreements provide otherwise. In case of conflict, the document specifically designated for the subject matter prevails.",
        "The law of the Federal Republic of Germany applies, excluding the UN Convention on Contracts for the International Sale of Goods (CISG). For merchants, the exclusive place of jurisdiction is Berlin, where permitted by law.",
        "If individual provisions of these Terms are or become invalid, the validity of the remaining provisions is unaffected. The invalid provision shall be replaced by a valid provision that comes closest to the economic purpose.",
        "Caisty may transfer rights and obligations under this contract in connection with business transfers, restructurings, or changes of ownership to affiliated companies or legal successors.",
      ],
    },
  ],
  contactSectionTitle: "15. Contact",
  contactSectionIntro: "For questions about these Terms, you can reach us at:",
  contact: legalContact.en,
  related: legalRelatedLabels.en,
  showOwnerInContact: false,
};
