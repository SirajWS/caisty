// Shared fiscal architecture types (API-service providers — no secrets in DTOs).

export type FiscalProviderKey = "none" | "fiskaly";

export type FiscalProviderType =
  | "none"
  | "api_service"
  | "external"
  | "coming_soon";

export type FiscalReceiptModeKey =
  | "standard"
  | "certified"
  | "standard_until_certified";

export type FiscalStatusKey =
  | "not_required"
  | "required"
  | "required_soon"
  | "pending_setup"
  | "active"
  | "error";

export type FiscalEnvironmentKey =
  | "not_configured"
  | "sandbox"
  | "live";

/** Internal resolved fiscal configuration for an org (may include admin-only fields). */
export type FiscalConfigurationSnapshot = {
  orgId: string;
  country: string | null;
  currency: string;
  fiscalRequired: boolean;
  provider: FiscalProviderKey;
  providerType: FiscalProviderType;
  providerName: string | null;
  providerLabel: string;
  fiscalStatus: FiscalStatusKey;
  fiscalStatusCustomer: string;
  fiscalEnvironment: FiscalEnvironmentKey;
  receiptMode: FiscalReceiptModeKey;
  fiscalProfileKey: string;
  fiscalConfigurationLabel: string;
  supportedExports: string[];
  posDownloadAllowed: boolean;
  posConfigurationStatus: "not_ready" | "ready";
  fiscalNotice: string | null;
  mode: "api_service" | "standard" | "coming_soon";
  lastSyncAt?: string | null;
};
export type SafePosFiscalConfig = {
  country: string | null;
  currency: string;
  fiscalRequired: boolean;
  providerKey: FiscalProviderKey;
  providerLabel: string;
  providerType: FiscalProviderType;
  fiscalStatus: string;
  receiptMode: FiscalReceiptModeKey;
  fiscalConfigurationLabel: string;
  posDownloadAllowed: boolean;
  fiscalNotice: string | null;
  supportedExports: string[];
  mode: "api_service" | "standard" | "coming_soon";
};

export type FiscalProviderContext = {
  orgId: string;
  country: string | null;
  fiscalStatus: FiscalStatusKey;
  fiscalEnvironment: FiscalEnvironmentKey;
};

export type FiscalProviderStatusResult = {
  status: FiscalStatusKey;
  message: string;
  pending: boolean;
};
