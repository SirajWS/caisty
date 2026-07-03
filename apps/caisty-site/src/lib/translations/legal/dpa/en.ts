import { legalContact } from "../shared/contact";
import { legalLinkLabels, legalRelatedLabels } from "../shared/labels";
import type { DpaCopy } from "./types";

export const dpaEn: DpaCopy = {
  documentLabel: "Data Processing Agreement (DPA)",
  title: "Data Processing Agreement (DPA)",
  lastUpdatedLabel: "Last updated",
  effectiveDate: "July 1, 2026",
  versionLabel: "Version",
  version: "2.0 (Master Edition)",
  intro:
    "This Data Processing Agreement (\"DPA\" or \"AVV\") governs the processing of personal data where Caisty acts as processor on behalf of the customer (controller). It meets the requirements of Art. 28 GDPR and supplements the {{eula}}, {{terms}}, and {{privacy}}. In the event of conflicts relating to data processing, this DPA prevails to the extent required by data protection law.",
  linkLabels: legalLinkLabels.en,
  sections: [
    {
      title: "Part I – General Provisions",
      subsections: [
        {
          title: "Article 1 – Purpose",
          paragraphs: [
            "This DPA forms part of the contractual relationship between Caisty (\"Processor\") and the customer (\"Controller\") and governs the processing of personal data in connection with the services provided by Caisty.",
            "It is intended to meet the requirements of Art. 28 of Regulation (EU) 2016/679 (\"GDPR\") and other applicable data protection laws. Where Caisty processes personal data on behalf of the customer, this DPA governs the rights and obligations of both parties.",
            "This DPA supplements and should be read together with:",
          ],
          list: [
            "End User License Agreement (EULA);",
            "Terms and Conditions;",
            "subscription agreement;",
            "Privacy Policy;",
            "applicable order forms or service agreements.",
          ],
        },
        {
          title: "Article 2 – Definitions",
          list: [
            "**Controller** – natural or legal person that determines the purposes and means of processing",
            "**Processor** – Caisty when processing on behalf of the Controller",
            "**personal data** – information relating to identified or identifiable natural persons under applicable data protection law",
            "**processing** – any operation performed on personal data (collection, storage, organization, retrieval, use, disclosure, transfer, deletion, etc.)",
            "**data subject** – individual whose personal data is processed",
            "**subprocessor** – third party that processes personal data on behalf of the parties",
            "**personal data breach** – security incident involving unauthorized access, loss, destruction, or disclosure",
          ],
          paragraphs: ["Undefined terms have the meaning given in the EULA or Terms."],
        },
        {
          title: "Article 3 – Scope",
          paragraphs: [
            "This DPA applies where Caisty processes personal data on behalf of the Controller in connection with the services.",
            "This DPA does not apply where Caisty acts as an independent controller (e.g., own billing, compliance, fraud prevention, security, corporate administration). This is governed by the Privacy Policy.",
          ],
          list: [
            "Caisty POS;",
            "customer portal;",
            "cloud services;",
            "administrative interfaces;",
            "APIs;",
            "software licensing;",
            "customer support systems;",
            "backup infrastructure;",
            "authentication services;",
            "future services operated by Caisty.",
          ],
        },
        {
          title: "Article 4 – Subject Matter of Processing",
          paragraphs: [
            "The subject matter is provision, operation, maintenance, security, support, and continuous improvement of the services. Processing may include:",
            "Processing is carried out solely for purposes determined by the Controller.",
          ],
          list: [
            "hosting of customer data;",
            "storage and transmission of personal data;",
            "organization and cloud synchronization;",
            "provision of software features;",
            "customer support, updates, technical maintenance;",
            "disaster recovery and backup.",
          ],
        },
        {
          title: "Article 5 – Duration of Processing",
          paragraphs: [
            "Processing lasts for the term of the contractual relationship. Upon termination, data is retained, returned, deleted, or anonymized in accordance with this DPA, contractual documentation, statutory retention obligations, and data protection law. Continued processing is permitted where legally required or necessary to assert legal claims.",
          ],
        },
        {
          title: "Article 6 – Nature and Purpose of Processing",
          paragraphs: [
            "Caisty processes personal data solely to provide the services requested by the Controller, including collection, storage, organization, retrieval, transmission, synchronization, hosting, backup, recovery, technical support, maintenance, security monitoring, and deletion.",
            "Caisty does not process personal data for its own independent purposes, except where expressly permitted by law or where Caisty acts as an independent controller.",
          ],
        },
        {
          title: "Article 7 – Categories of Personal Data",
          paragraphs: [
            "Depending on the services used, the following may be processed, among others:",
            "The specific categories depend on use by the Controller.",
          ],
          list: [
            "names, business contact details, email, telephone;",
            "employee, customer, and supplier data;",
            "billing and transaction data, account information;",
            "authentication information, device identifiers;",
            "technical logs, support communications, operational data.",
          ],
        },
        {
          title: "Article 8 – Categories of Data Subjects",
          paragraphs: [
            "Data subjects may include:",
            "The Controller alone determines which categories are processed.",
          ],
          list: [
            "employees, authorized users, customers, prospects;",
            "suppliers, contractors, advisors, business partners;",
            "other individuals whose data the Controller enters into the services.",
          ],
        },
        {
          title: "Article 9 – Roles of the Parties",
          paragraphs: [
            "The customer is the Controller; Caisty is the Processor when processing on behalf of the Controller. Nothing in this DPA transfers ownership or control of personal data from the Controller to Caisty. Each party fulfills its obligations under data protection law.",
          ],
        },
        {
          title: "Article 10 – General Processor Obligations",
          paragraphs: [
            "Caisty will:",
            "Caisty does not sell, rent, or commercialize processed personal data.",
          ],
          list: [
            "process personal data only on documented instructions, unless otherwise required by law;",
            "ensure authorized personnel are bound by confidentiality;",
            "implement appropriate technical and organizational measures;",
            "assist the Controller with data protection obligations;",
            "maintain required processing records;",
            "report personal data breaches;",
            "cooperate with supervisory authorities where legally required;",
            "ensure subprocessors assume equivalent obligations.",
          ],
        },
      ],
    },
    {
      title: "Part II – Security and Confidentiality",
      subsections: [
        {
          title: "Article 11 – Confidentiality",
          paragraphs: [
            "Caisty ensures that all persons with access to personal data are subject to appropriate confidentiality obligations – including employees, contractors, subprocessors, and other authorized persons. The obligation continues after termination of employment/contract or this DPA. Access is granted strictly on a need-to-know basis.",
          ],
        },
        {
          title: "Article 12 – Technical and Organizational Measures (TOMs)",
          paragraphs: [
            "Caisty implements appropriate TOMs to protect personal data against destruction, loss, alteration, unauthorized disclosure, or unauthorized access. Depending on the service, these may include:",
            "Details are set out in Annex II. TOMs may be updated provided the level of protection is not materially reduced.",
          ],
          list: [
            "encryption in transit and – where appropriate – at rest;",
            "secure authentication, password hashing, MFA where available;",
            "role-based access, least privilege, network segmentation, firewalls;",
            "endpoint security, vulnerability management, malware protection;",
            "security monitoring, backups, disaster recovery, regular security reviews.",
          ],
        },
        {
          title: "Article 13 – Security of Processing",
          paragraphs: [
            "Taking into account the state of the art, implementation costs, nature, scope, context, and purposes of processing, and risks to the rights and freedoms of natural persons, Caisty implements appropriate security measures pursuant to Art. 32 GDPR – to ensure confidentiality, integrity, availability, and resilience of systems. Caisty regularly improves its security program through risk analyses, reviews, updates, infrastructure improvements, and monitoring.",
          ],
        },
        {
          title: "Article 14 – Access Controls",
          paragraphs: [
            "Access is limited to authorized personnel. Measures may include individual accounts, role-based permissions, authentication, password policies, session management, privileged access management, logging of administrative activities, regular access reviews, and timely revocation of unnecessary rights.",
          ],
        },
        {
          title: "Article 15 – Incident Management",
          paragraphs: [
            "Caisty maintains documented procedures to identify, assess, contain, investigate, remediate, and resolve security incidents – including detection, classification, risk assessment, forensics, recovery, and post-incident review with corrective actions.",
          ],
        },
        {
          title: "Article 16 – Personal Data Breaches",
          paragraphs: [
            "If Caisty becomes aware of a personal data breach when processing on behalf of the Controller, Caisty will notify the Controller without undue delay. Where available, Caisty will provide the nature of the breach, affected data categories and data subjects, likely consequences, and measures taken/proposed – potentially in stages. Caisty assists the Controller with notification obligations to supervisory authorities.",
          ],
        },
        {
          title: "Article 17 – Business Continuity",
          paragraphs: [
            "Caisty maintains emergency and recovery procedures for critical services (including redundancy, encrypted backups, recovery testing, emergency plans). Guaranteed RTO/RPO apply only under a separate written SLA.",
          ],
        },
        {
          title: "Article 18 – Audits",
          paragraphs: [
            "The Controller may request reasonable compliance evidence (security documentation, audit reports, certificates, questionnaires, TOM descriptions). On-site audits only where legally required and not replaceable by documentation – in good faith, during normal business hours, without undue disruption, under confidentiality. Costs are generally borne by the Controller.",
          ],
        },
      ],
    },
    {
      title: "Part III – Subprocessors and International Transfers",
      subsections: [
        {
          title: "Article 19 – Authorized Subprocessors",
          paragraphs: [
            "The Controller grants Caisty general authorization to engage subprocessors, provided contractually equivalent data protection obligations exist. Services may include hosting, infrastructure, storage, backup, payment processing, email, monitoring, cybersecurity, authentication, and support. Caisty remains responsible; engagement does not release Caisty from DPA obligations.",
          ],
        },
        {
          title: "Article 20 – Engagement of New Subprocessors",
          paragraphs: [
            "Caisty may engage additional subprocessors as required for the services. Caisty will:",
            "In case of justified objection, the parties will seek a solution in good faith; if this fails and the objection is legally substantiated, the affected processing may be terminated.",
          ],
          list: [
            "maintain a current list;",
            "publish it on the website, in the customer portal, or via {{subprocessors}};",
            "provide appropriate notice of material changes.",
          ],
        },
        {
          title: "Article 21 – International Data Transfers",
          paragraphs: [
            "Transfers outside the EEA occur only with appropriate safeguards (adequacy decision, EU Standard Contractual Clauses, certifications, codes of conduct, supplementary technical/organizational measures) and only to the extent required for the services. Caisty regularly reviews transfer mechanisms.",
          ],
        },
        {
          title: "Article 22 – Assistance to the Controller",
          paragraphs: [
            "Caisty reasonably assists the Controller with data subject requests, DPIAs, consultations with authorities, security measures, breach management, compliance documentation, and regulatory inquiries. Reasonable fees may apply for assistance beyond standard obligations where contractually permitted.",
          ],
        },
        {
          title: "Article 23 – Data Subject Rights",
          paragraphs: [
            "Caisty assists the Controller with access, rectification, erasure, restriction, portability, objection, and automated decision-making, where legally and technically feasible. Direct requests from data subjects are forwarded to the Controller; Caisty does not respond directly except where authorized or required by law.",
          ],
        },
        {
          title: "Article 24 – Government Requests",
          paragraphs: [
            "For lawful government requests, Caisty reviews the legal basis, discloses only what is necessary, implements available protective measures, and notifies the Controller without undue delay where permitted. Voluntary disclosure does not occur except where legally required or expressly approved by the Controller.",
          ],
        },
        {
          title: "Article 25 – Records of Processing",
          paragraphs: [
            "Caisty maintains processing records pursuant to Art. 30 GDPR, where applicable, and makes them available to supervisory authorities when legally required. The Controller remains responsible for its own record-keeping obligations.",
          ],
        },
      ],
    },
    {
      title: "Part IV – Return, Deletion, and Final Provisions",
      subsections: [
        {
          title: "Article 26 – Return or Deletion of Personal Data",
          paragraphs: [
            "Upon termination of the services, Caisty – on instruction and where technically feasible – returns data, enables export, or securely deletes or anonymizes it. Retention is permitted for legal, tax, judicial, or regulatory obligations and legal defense. Remaining data remains protected until deletion or anonymization.",
          ],
        },
        {
          title: "Article 27 – Liability",
          paragraphs: [
            "Each party is liable for its data protection obligations. Caisty is not liable for processing decisions made solely by the Controller where Caisty follows documented instructions and DPA obligations. The Controller is responsible for purposes, legal bases, accuracy, consents, and its own compliance. Liability provisions in the Terms/EULA apply supplementarily where permitted.",
          ],
        },
        {
          title: "Article 28 – Termination",
          paragraphs: [
            "This DPA ends automatically when all processing on behalf of the Controller has ended and contractual relationships terminate, unless legal obligations continue. Surviving obligations (confidentiality, data protection, deletion, liability) remain in effect.",
          ],
        },
        {
          title: "Article 29 – Governing Law",
          paragraphs: [
            "This DPA is governed by the laws of the **Federal Republic of Germany** and is interpreted accordingly, unless mandatory data protection law provides otherwise. Mandatory requirements of the GDPR or other data protection laws prevail. Disputes are resolved supplementarily to dispute resolution provisions in the Terms or other contractual agreements. Supervisory authority powers remain unaffected.",
          ],
        },
        {
          title: "Article 30 – Final Provisions",
          paragraphs: [
            "This DPA is the complete agreement on processing and replaces prior agreements on this subject. Invalid provisions do not affect the remainder. Failure to enforce a provision is not a waiver. Caisty may amend the DPA for legal, regulatory, or technical changes; material changes will be communicated.",
          ],
        },
      ],
    },
    {
      title: "Annex I – Description of Processing",
      paragraphs: [
        "**Subject matter:** Provision of cloud-based business software and related services.",
        "**Nature of processing:** Collection, recording, organization, storage, retrieval, transmission, synchronization, hosting, backup, recovery, deletion, anonymization.",
        "**Purpose:** Provision of services, software licensing, customer portal, cloud sync, support, security, maintenance, disaster recovery.",
        "**Categories of personal data:** Identification, contact, authentication, billing, transaction, employee, customer, technical log, and device data.",
        "**Categories of data subjects:** Customers, users, employees, customers/suppliers of the Controller, contractors, advisors, and other persons entered into the services.",
      ],
    },
    {
      title: "Annex II – Technical and Organizational Measures (TOMs)",
      paragraphs: [
        "Caisty maintains appropriate TOMs, including:",
        "Measures are reviewed regularly and may be updated provided the level of protection is not materially reduced.",
      ],
      list: [
        "encryption in transit and – where appropriate – at rest;",
        "role-based access control, least-privilege administration;",
        "secure authentication, password hashing, MFA where available;",
        "network security, firewalls, vulnerability and malware protection;",
        "infrastructure monitoring, security logging;",
        "encrypted backups, disaster recovery, business continuity;",
        "personnel confidentiality, regular security reviews, incident response.",
      ],
    },
    {
      title: "Annex III – Authorized Subprocessors",
      paragraphs: [
        "Depending on the services used, subprocessors may be engaged for hosting, infrastructure, payments, email, authentication, monitoring, cybersecurity, backup, and support.",
        "The current, binding list of authorized subprocessors is available at {{subprocessors}}.",
      ],
    },
  ],
  contactSectionTitle: "Parties / Contact",
  contactSectionIntro: "For questions about this DPA, contact us at:",
  contact: legalContact.en,
  related: legalRelatedLabels.en,
  showOwnerInContact: false,
};
