export type AdminDeviceListView = "current" | "released" | "all" | "archived";

export type AdminDeviceLicense = {
  id: string;
  plan: string;
  status: string;
  validFrom: string | null;
  validUntil: string | null;
};

export type AdminDeviceListItem = {
  id: string;
  name: string;
  type: string;
  status: string;
  fingerprint: string | null;
  stationCode?: string | null;
  customerId: string | null;
  customerName: string | null;
  licenseId?: string | null;
  currentLicense?: AdminDeviceLicense | null;
  lastSeenAt: string | null;
  lastHeartbeatAt: string | null;
  createdAt: string;
  releasedAt?: string | null;
  archivedAt?: string | null;
  orgId?: string | null;
};

const CURRENT_STATUSES = new Set(["active", "pending_approval", "blocked"]);

export const RELEASE_CONFIRM_MESSAGE =
  "This will release the device from its current license.\n\n" +
  "Historical device records remain. The device is not permanently deleted.\n" +
  "Existing receipts and financial records are unchanged.";

export const ARCHIVE_CONFIRM_MESSAGE =
  "This will archive the device from normal Super-Admin management views.\n\n" +
  "The device row is not deleted. Sales, receipts, station codes and references remain.\n" +
  "You can still inspect it later under Archive History.";

export function filterDevicesForView<
  T extends { status: string; archivedAt?: string | null },
>(devices: T[], view: AdminDeviceListView): T[] {
  if (view === "archived") {
    return devices.filter((d) => Boolean(d.archivedAt));
  }
  const live = devices.filter((d) => !d.archivedAt);
  if (view === "all") return live;
  if (view === "released") {
    return live.filter((d) => d.status.toLowerCase() === "released");
  }
  return live.filter((d) => CURRENT_STATUSES.has(d.status.toLowerCase()));
}

export function canReleaseDevice(device: {
  status: string;
  licenseId?: string | null;
  currentLicense?: AdminDeviceLicense | null;
  archivedAt?: string | null;
}): boolean {
  if (device.archivedAt) return false;
  const status = device.status.toLowerCase();
  const bound = Boolean(device.licenseId || device.currentLicense?.id);
  return (status === "active" || status === "blocked") && bound;
}

export function canArchiveDevice(device: {
  status: string;
  licenseId?: string | null;
  currentLicense?: AdminDeviceLicense | null;
  archivedAt?: string | null;
}): boolean {
  if (device.archivedAt) return false;
  if (device.licenseId || device.currentLicense?.id) return false;
  const status = device.status.toLowerCase();
  if (status === "pending_approval") return false;
  return (
    status === "released" ||
    status === "rejected" ||
    status === "active" ||
    status === "blocked"
  );
}

export function deviceLifecycleLabel(device: {
  status: string;
  licenseId?: string | null;
  archivedAt?: string | null;
}): string {
  if (device.archivedAt) return "Archived";
  const status = device.status.toLowerCase().trim();
  if (status === "released") return "Released";
  if (status === "pending_approval") return "Pending approval";
  if (status === "blocked") return "Blocked";
  if (status === "rejected") return "Rejected";
  if (status === "active" && !device.licenseId) return "Active · unassigned";
  if (status === "active") return "Active";
  return device.status || "Unknown";
}

export function currentLicenseSummary(device: AdminDeviceListItem): {
  label: string;
  plan: string | null;
  status: string | null;
  expiry: string | null;
} {
  const license = device.currentLicense;
  if (!license || !device.licenseId) {
    return { label: "Unassigned", plan: null, status: null, expiry: null };
  }
  return {
    label: license.plan || "Assigned",
    plan: license.plan || null,
    status: license.status || null,
    expiry: license.validUntil,
  };
}

export function formatLicenseExpiry(value: string | null | undefined): string {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("en-GB");
}
