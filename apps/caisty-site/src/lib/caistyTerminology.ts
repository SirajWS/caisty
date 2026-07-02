/**
 * Caisty POS Admin Architecture v1.0 — shared display labels (Customer Portal).
 * Keep English labels aligned with Admin Portal `caistyTerminology.ts` and POS Admin UI.
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
): string {
  if (providerLabel?.trim()) return providerLabel;
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

export function formatCloudSyncStatus(input: {
  hasProfile?: boolean;
  fiscalStatus?: string | null;
  lastSyncAt?: string | null;
}): string {
  if (!input.hasProfile) return "Not synced — complete Business profile";
  if (input.fiscalStatus === "pending_setup") {
    return "Synced from Caisty Cloud — fiscal setup pending";
  }
  if (input.lastSyncAt) return "Synced from Caisty Cloud";
  return "Cloud-managed";
}

export function fiscalStatusTone(status: string | null | undefined): StatusTone {
  switch (status) {
    case "active":
    case "not_required":
      return "ok";
    case "pending_setup":
    case "required_coming_soon":
    case "required":
      return "attention";
    case "error":
      return "action_required";
    default:
      return "unknown";
  }
}

export function licenseStatusTone(status: string | null | undefined): StatusTone {
  switch ((status ?? "").toLowerCase()) {
    case "active":
      return "ok";
    case "expired":
    case "revoked":
    case "blocked":
      return "action_required";
    case "inactive":
      return "attention";
    default:
      return "unknown";
  }
}

export function businessCompletenessTone(input: {
  country?: string | null;
  complianceStatus?: string | null;
}): StatusTone {
  if (!input.country) return "action_required";
  if (input.complianceStatus === "incomplete") return "attention";
  if (input.complianceStatus === "action_required") return "action_required";
  if (input.complianceStatus === "ready") return "ok";
  return "unknown";
}

export function deviceConnectionTone(deviceCount: number): StatusTone {
  if (deviceCount <= 0) return "unknown";
  return "ok";
}

export function accountStatusTone(portalStatus: string | null | undefined): StatusTone {
  switch ((portalStatus ?? "").toLowerCase()) {
    case "active":
      return "ok";
    case "pending":
      return "attention";
    case "blocked":
      return "action_required";
    default:
      return "unknown";
  }
}

export function statusToneLabel(tone: StatusTone): string {
  switch (tone) {
    case "ok":
      return "OK";
    case "attention":
      return "Attention";
    case "action_required":
      return "Action required";
    default:
      return "Unknown";
  }
}

/** Map raw API / network errors to merchant-safe messages. */
export function mapPortalApiError(
  err: unknown,
  fallbacks?: Partial<{
    default: string;
    unauthorized: string;
    network: string;
    fiscalMissing: string;
    businessMissing: string;
  }>,
): string {
  const fb = {
    default: "Something went wrong. Please try again.",
    unauthorized: "Session expired. Please sign in again.",
    network: "Connection problem. Please try again.",
    fiscalMissing: "Fiscal configuration not available yet.",
    businessMissing: "Complete your Business profile.",
    ...fallbacks,
  };

  if (err instanceof TypeError && /fetch|network/i.test(String(err.message))) {
    return fb.network;
  }

  const msg =
    err instanceof Error
      ? err.message
      : typeof err === "string"
        ? err
        : "";

  const lower = msg.toLowerCase();

  if (
    lower.includes("authorization") ||
    lower.includes("nicht angemeldet") ||
    lower.includes("unauthorized") ||
    lower.includes("invalid or missing portal token")
  ) {
    return fb.unauthorized;
  }

  if (lower.includes("failed to fetch") || lower.includes("network")) {
    return fb.network;
  }

  if (
    lower.includes("fiscal") &&
    (lower.includes("not available") || lower.includes("missing"))
  ) {
    return fb.fiscalMissing;
  }

  if (
    lower.includes("business profile") ||
    lower.includes("business_profile") ||
    lower.includes("migration_required")
  ) {
    return fb.businessMissing;
  }

  if (
    lower.includes("server_error") ||
    lower.includes("internal server") ||
    lower.includes("503") ||
    lower.includes("500")
  ) {
    return fb.default;
  }

  if (msg && msg.length < 120 && !lower.includes("error:")) {
    return msg;
  }

  return fb.default;
}
