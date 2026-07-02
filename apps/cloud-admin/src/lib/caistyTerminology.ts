/**
 * Caisty POS Admin Architecture v1.0 — shared display labels (Admin Portal).
 * English labels aligned with Customer Portal and POS Admin terminology.
 */

export type StatusTone = "ok" | "attention" | "action_required" | "unknown";

export function formatFiscalStatus(status: string | null | undefined): string {
  switch (status) {
    case "not_required":
      return "Not required";
    case "required":
      return "Required";
    case "required_coming_soon":
      return "Required — coming soon";
    case "pending_setup":
      return "Pending setup";
    case "active":
      return "Active";
    case "error":
      return "Error";
    default:
      return status?.trim() ? status : "Unknown";
  }
}

export function formatReceiptMode(mode: string | null | undefined): string {
  switch (mode) {
    case "standard":
      return "Standard receipts";
    case "certified":
      return "Certified receipts";
    case "certified_pending":
    case "certified_germany":
      return "Certified receipts pending setup";
    case "standard_until_certified":
      return "Standard receipts until certified";
    default:
      return mode?.trim() ? mode : "—";
  }
}

export function formatProviderLabel(
  providerKey: string | null | undefined,
  providerLabel?: string | null,
  fiscalConfigurationLabel?: string | null,
): string {
  if (providerLabel?.trim()) return providerLabel;
  if (fiscalConfigurationLabel?.trim()) return fiscalConfigurationLabel;
  if (providerKey === "fiskaly") {
    return "Caisty Fiscal Germany powered by Fiskaly";
  }
  if (!providerKey || providerKey === "none") {
    return "Standard receipt mode";
  }
  return providerKey;
}

export function formatLicenseStatus(status: string | null | undefined): string {
  switch ((status ?? "").toLowerCase()) {
    case "active":
      return "Active";
    case "revoked":
    case "blocked":
      return "Revoked";
    case "expired":
      return "Expired";
    case "inactive":
      return "Inactive";
    default:
      return status?.trim() ? status : "Unknown";
  }
}

export function formatDeviceStatus(status: string | null | undefined): string {
  switch ((status ?? "").toLowerCase()) {
    case "active":
      return "Active";
    case "inactive":
      return "Inactive";
    default:
      return status?.trim() ? status : "Unknown";
  }
}

export function formatCloudSyncStatus(lastSyncAt?: string | null): string {
  if (lastSyncAt) return "Synced from Caisty Cloud";
  return "Not synced yet";
}

export function fiscalStatusBadgeClass(
  status: string | null | undefined,
): string {
  switch (status) {
    case "active":
    case "not_required":
      return "status-active";
    case "pending_setup":
    case "required_coming_soon":
    case "required":
      return "status-pending";
    case "error":
      return "status-inactive";
    default:
      return "status-unknown";
  }
}

export function formatFiscalDate(value?: string | null): string {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString("de-DE");
}

export function providerTypeLabel(type: string | null | undefined): string {
  switch (type) {
    case "api_service":
      return "API service";
    case "coming_soon":
      return "Coming soon";
    case "external":
      return "External";
    case "none":
      return "None";
    default:
      return type ?? "—";
  }
}

export const FISCAL_ACTION_TOOLTIP =
  "Available after Fiskaly onboarding is completed.";

/** @deprecated use formatProviderLabel */
export const providerDisplayLabel = formatProviderLabel;

/** @deprecated use formatFiscalStatus */
export const fiscalStatusLabel = formatFiscalStatus;

/** @deprecated use formatReceiptMode */
export const receiptModeLabel = formatReceiptMode;
