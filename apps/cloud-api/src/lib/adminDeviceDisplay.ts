export function wantsArchivedDevices(query: { archived?: unknown } | undefined): boolean {
  return String(query?.archived ?? "") === "1";
}

export const ADMIN_DEVICE_CURRENT_STATUSES = [
  "active",
  "pending_approval",
  "blocked",
] as const;

export type AdminDeviceListView = "current" | "released" | "all" | "archived";

export type AdminDeviceLicense = {
  id: string;
  plan: string;
  status: string;
  validFrom: string | null;
  validUntil: string | null;
};

export type AdminDeviceRow = {
  id: string;
  name: string;
  type: string;
  status: string;
  fingerprint: string | null;
  stationCode: string | null;
  customerId: string | null;
  customerName: string | null;
  licenseId: string | null;
  currentLicense: AdminDeviceLicense | null;
  lastSeenAt: string | null;
  lastHeartbeatAt: string | null;
  createdAt: string;
  releasedAt: string | null;
  archivedAt: string | null;
};

function safeIso(value: unknown): string | null {
  if (!value) return null;
  const d = value instanceof Date ? value : new Date(String(value));
  if (Number.isNaN(d.getTime())) return null;
  return d.toISOString();
}

export function deriveLicenseDisplayStatus(input: {
  status?: string | null;
  validUntil?: Date | string | null;
  now?: Date;
}): string {
  const status = String(input.status ?? "").toLowerCase().trim();
  if (status === "revoked" || status === "blocked") return status;
  const until = input.validUntil
    ? input.validUntil instanceof Date
      ? input.validUntil
      : new Date(input.validUntil)
    : null;
  const now = input.now ?? new Date();
  if (until && !Number.isNaN(until.getTime()) && until.getTime() < now.getTime()) {
    return "expired";
  }
  return status || "unknown";
}

export function mapAdminDeviceRow(row: {
  id: unknown;
  name?: unknown;
  type?: unknown;
  status?: unknown;
  fingerprint?: unknown;
  stationCode?: unknown;
  customerId?: unknown;
  customerName?: unknown;
  licenseId?: unknown;
  licensePlan?: unknown;
  licenseStatus?: unknown;
  licenseValidFrom?: unknown;
  licenseValidUntil?: unknown;
  lastSeenAt?: unknown;
  lastHeartbeatAt?: unknown;
  createdAt?: unknown;
  releasedAt?: unknown;
  archivedAt?: unknown;
}): AdminDeviceRow {
  const licenseId = row.licenseId ? String(row.licenseId) : null;
  const currentLicense: AdminDeviceLicense | null = licenseId
    ? {
        id: licenseId,
        plan: String(row.licensePlan ?? ""),
        status: deriveLicenseDisplayStatus({
          status: row.licenseStatus as string | null,
          validUntil: row.licenseValidUntil as Date | string | null,
        }),
        validFrom: safeIso(row.licenseValidFrom),
        validUntil: safeIso(row.licenseValidUntil),
      }
    : null;

  return {
    id: String(row.id),
    name: String(row.name ?? ""),
    type: String(row.type ?? ""),
    status: String(row.status ?? ""),
    fingerprint: row.fingerprint ? String(row.fingerprint) : null,
    stationCode: row.stationCode ? String(row.stationCode) : null,
    customerId: row.customerId ? String(row.customerId) : null,
    customerName: row.customerName ? String(row.customerName) : null,
    licenseId,
    currentLicense,
    lastSeenAt: safeIso(row.lastSeenAt),
    lastHeartbeatAt: safeIso(row.lastHeartbeatAt),
    createdAt: safeIso(row.createdAt) || new Date(0).toISOString(),
    releasedAt: safeIso(row.releasedAt),
    archivedAt: safeIso(row.archivedAt),
  };
}

export function matchesAdminDeviceView(
  device: Pick<AdminDeviceRow, "status" | "archivedAt">,
  view: AdminDeviceListView,
): boolean {
  const archived = Boolean(device.archivedAt);
  if (view === "archived") return archived;
  if (archived) return false;
  const status = device.status.toLowerCase().trim();
  if (view === "all") return true;
  if (view === "released") return status === "released";
  return (ADMIN_DEVICE_CURRENT_STATUSES as readonly string[]).includes(status);
}

export function filterAdminDevices<
  T extends Pick<AdminDeviceRow, "status" | "archivedAt">,
>(devices: T[], view: AdminDeviceListView): T[] {
  return devices.filter((device) => matchesAdminDeviceView(device, view));
}
