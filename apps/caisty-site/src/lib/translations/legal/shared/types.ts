export type LegalLinkLabels = {
  terms: string;
  privacy: string;
  cookie: string;
  eula: string;
  dpa: string;
  imprint: string;
  subprocessors: string;
};

export type LegalRelatedLabels = {
  title: string;
  terms: string;
  privacy: string;
  cookie: string;
  eula: string;
  dpa: string;
  imprint: string;
  subprocessors: string;
};

export type LegalContactCopy = {
  company: string;
  street: string;
  city: string;
  country: string;
  generalInquiries: string;
  supportLabel: string;
  privacyLabel: string;
  taxIdLabel: string;
  taxId: string;
  ownerLabel?: string;
  ownerName?: string;
  imprintNote?: string;
};

export type LegalSubsection = {
  title: string;
  paragraphs?: string[];
  list?: string[];
};

export type LegalSection = {
  title: string;
  paragraphs?: string[];
  list?: string[];
  subsections?: LegalSubsection[];
  notice?: string;
  table?: { headers: string[]; rows: string[][] };
  cookiePreferencesLabel?: string;
};

export type LegalEmphasis = {
  licensedNotSold?: string;
  commercialEfforts?: string;
};

export type LegalDocumentCopy = {
  documentLabel: string;
  title: string;
  lastUpdatedLabel: string;
  effectiveDate: string;
  versionLabel?: string;
  version?: string;
  intro: string;
  linkLabels: LegalLinkLabels;
  emphasis?: LegalEmphasis;
  sections: LegalSection[];
  contactSectionTitle: string;
  contactSectionIntro?: string;
  contact: LegalContactCopy;
  related: LegalRelatedLabels;
  showOwnerInContact?: boolean;
};
