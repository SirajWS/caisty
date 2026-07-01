import { LEGAL_PATHS } from "./marketingRoutes";

export type PortalLegalDocumentId =
  | "terms"
  | "privacy"
  | "cookie"
  | "eula"
  | "dpa"
  | "imprint";

export type PortalLegalDocumentDef = {
  id: PortalLegalDocumentId;
  path: string;
  icon: "terms" | "privacy" | "cookie" | "eula" | "dpa" | "imprint";
};

export const PORTAL_LEGAL_DOCUMENTS: PortalLegalDocumentDef[] = [
  { id: "terms", path: LEGAL_PATHS.terms, icon: "terms" },
  { id: "privacy", path: LEGAL_PATHS.privacy, icon: "privacy" },
  { id: "cookie", path: LEGAL_PATHS.cookie, icon: "cookie" },
  { id: "eula", path: LEGAL_PATHS.eula, icon: "eula" },
  { id: "dpa", path: LEGAL_PATHS.dpa, icon: "dpa" },
  { id: "imprint", path: LEGAL_PATHS.imprint, icon: "imprint" },
];
