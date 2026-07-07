import { PORTAL_LEGAL_DOCUMENTS } from "../../config/portalLegalDocuments";
import type { AccountDerivedState, DeriveAccountInput, SecurityStatusItem } from "./types";

function deriveSecurityStatus(input: DeriveAccountInput): SecurityStatusItem[] {
  const c = input.t.account.center;
  const { customer } = input;
  const portalStatus = customer.portalStatus;

  const emailTone: SecurityStatusItem["tone"] =
    portalStatus === "active" ? "ok" : portalStatus === "pending" ? "attention" : "unknown";

  const securityTone: SecurityStatusItem["tone"] =
    portalStatus === "active" ? "ok" : portalStatus === "pending" ? "attention" : "unknown";

  return [
    {
      id: "email",
      label: c.statusEmail,
      value: input.emailStatusLabel,
      tone: emailTone,
    },
    {
      id: "security",
      label: c.statusSecurity,
      value: input.securityStatusLabel,
      tone: securityTone,
    },
  ];
}

function deriveLegalDocuments(input: DeriveAccountInput): AccountDerivedState["legalDocuments"] {
  const shorts = input.t.account.center.legalShort;

  return PORTAL_LEGAL_DOCUMENTS.map((doc) => ({
    id: doc.id,
    title: input.t.legal.documents[doc.id].title,
    shortTitle: shorts[doc.id],
    path: doc.path,
  }));
}

function deriveSupportHref(): string {
  const supportEmail =
    import.meta.env.VITE_PUBLIC_SUPPORT_EMAIL ?? "support@caisty.com";
  return `mailto:${supportEmail}`;
}

export function deriveAccountState(input: DeriveAccountInput): AccountDerivedState {
  return {
    securityStatus: deriveSecurityStatus(input),
    legalDocuments: deriveLegalDocuments(input),
    supportHref: deriveSupportHref(),
  };
}

export function emailVerificationLabel(
  status: string,
  t: DeriveAccountInput["t"],
): string {
  const c = t.account.center;
  if (status === "active") return c.emailVerified;
  if (status === "pending") return c.emailPending;
  if (status === "blocked") return c.emailBlocked;
  return c.notAvailable;
}

export function securityStatusLabel(
  status: string,
  t: DeriveAccountInput["t"],
): string {
  const c = t.account.center;
  if (status === "active") return c.securityProtected;
  if (status === "pending") return c.securityReview;
  if (status === "blocked") return c.securityBlocked;
  return c.notAvailable;
}
