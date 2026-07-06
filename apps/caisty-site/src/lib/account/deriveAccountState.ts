import { PORTAL_LEGAL_DOCUMENTS } from "../../config/portalLegalDocuments";
import type { AccountDerivedState, DeriveAccountInput, SecurityChecklistItem } from "./types";

function checklistStatusLabel(
  status: SecurityChecklistItem["status"],
  t: DeriveAccountInput["t"],
): string {
  const c = t.account.center;
  if (status === "complete") return c.checklistComplete;
  if (status === "pending") return c.checklistPending;
  return c.checklistComingSoon;
}

function deriveOverview(input: DeriveAccountInput): AccountDerivedState["overview"] {
  const c = input.t.account.center;
  const { customer } = input;

  return [
    { id: "name", label: c.kpiName, value: customer.name?.trim() || c.notAvailable },
    { id: "email", label: c.kpiEmail, value: customer.email?.trim() || c.notAvailable },
    { id: "email_status", label: c.kpiEmailStatus, value: input.emailStatusLabel },
    { id: "role", label: c.kpiRole, value: input.roleLabel },
    { id: "language", label: c.kpiLanguage, value: input.languageLabel },
    { id: "security", label: c.kpiSecurity, value: input.securityStatusLabel },
  ];
}

function deriveSession(input: DeriveAccountInput): AccountDerivedState["session"] {
  const c = input.t.account.center;
  const browser = input.browserLabel ?? c.notAvailable;

  return [
    { id: "session", label: c.sessionCurrent, value: c.sessionThisBrowser },
    { id: "browser", label: c.sessionBrowser, value: browser },
    { id: "activity", label: c.sessionLastActivity, value: c.sessionActiveNow },
  ];
}

function derivePreferences(input: DeriveAccountInput): AccountDerivedState["preferences"] {
  const c = input.t.account.center;

  return [
    { id: "language", label: c.prefLanguage, value: input.languageLabel },
    { id: "theme", label: c.prefTheme, value: input.themeLabel },
    { id: "notifications", label: c.prefNotifications, value: c.comingSoon },
  ];
}

function deriveChecklist(input: DeriveAccountInput): SecurityChecklistItem[] {
  const c = input.t.account.center;
  const status = input.customer.portalStatus;

  const emailStatus: SecurityChecklistItem["status"] =
    status === "active" ? "complete" : "pending";

  const items: Array<{ id: string; label: string; status: SecurityChecklistItem["status"] }> = [
    { id: "email", label: c.checkEmailVerified, status: emailStatus },
    { id: "password", label: c.checkStrongPassword, status: "pending" },
    { id: "2fa", label: c.check2fa, status: "coming_soon" },
    { id: "recovery", label: c.checkRecoveryEmail, status: "coming_soon" },
    { id: "login_review", label: c.checkRecentLogin, status: "coming_soon" },
  ];

  return items.map((item) => ({
    ...item,
    statusLabel: checklistStatusLabel(item.status, input.t),
  }));
}

function deriveLegalDocuments(input: DeriveAccountInput): AccountDerivedState["legalDocuments"] {
  return PORTAL_LEGAL_DOCUMENTS.map((doc) => ({
    id: doc.id,
    title: input.t.legal.documents[doc.id].title,
    path: doc.path,
  }));
}

function deriveDataActions(input: DeriveAccountInput): AccountDerivedState["dataActions"] {
  const c = input.t.account.center;
  const supportEmail =
    import.meta.env.VITE_PUBLIC_SUPPORT_EMAIL ?? "support@caisty.com";

  return [
    { id: "export", label: c.actionExportData, disabled: true, badge: c.comingSoon },
    { id: "delete", label: c.actionDeleteAccount, disabled: true, badge: c.comingSoon },
    {
      id: "support",
      label: c.actionContactSupport,
      disabled: false,
      href: `mailto:${supportEmail}`,
    },
  ];
}

export function deriveAccountState(input: DeriveAccountInput): AccountDerivedState {
  return {
    overview: deriveOverview(input),
    session: deriveSession(input),
    preferences: derivePreferences(input),
    checklist: deriveChecklist(input),
    legalDocuments: deriveLegalDocuments(input),
    dataActions: deriveDataActions(input),
  };
}

export function detectClientBrowser(): string | null {
  if (typeof navigator === "undefined") return null;
  const ua = navigator.userAgent;
  if (ua.includes("Edg/")) return "Microsoft Edge";
  if (ua.includes("Chrome/")) return "Google Chrome";
  if (ua.includes("Firefox/")) return "Mozilla Firefox";
  if (ua.includes("Safari/") && !ua.includes("Chrome/")) return "Safari";
  return null;
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
