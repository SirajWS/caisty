import {
  canArchiveDevice,
  canReleaseDevice,
  filterDevicesForView,
  type AdminDeviceListItem,
} from "./adminDeviceList";

/** Matches GET /devices (and GET /devices?archived=1) server cap. */
export const ADMIN_DEVICES_LIST_DEFAULT_LIMIT = 500;

export type CustomerDeviceRow = AdminDeviceListItem;

export function devicesBelongingToCustomer<
  T extends { customerId?: string | null; orgId?: string | null },
>(devices: T[], customerId: string, customerOrgId?: string | null): T[] {
  const cid = customerId.trim();
  if (!cid) return [];
  const oid = customerOrgId?.trim() || "";
  return devices.filter((device) => {
    if (!device.customerId || device.customerId !== cid) return false;
    if (oid && device.orgId && device.orgId !== oid) return false;
    return true;
  });
}

export function uniqueDevicesById<T extends { id: string }>(devices: T[]): T[] {
  const seen = new Set<string>();
  const out: T[] = [];
  for (const device of devices) {
    if (seen.has(device.id)) continue;
    seen.add(device.id);
    out.push(device);
  }
  return out;
}

export function sortCustomerDevicesByCreatedDesc<
  T extends { createdAt?: string | null },
>(devices: T[]): T[] {
  return [...devices].sort((a, b) => {
    const ta = a.createdAt ? new Date(a.createdAt).getTime() : 0;
    const tb = b.createdAt ? new Date(b.createdAt).getTime() : 0;
    return tb - ta;
  });
}

/**
 * Live Super-Admin Customer Detail list: one row per devices.id, this customer
 * only, archived rows excluded. Same fingerprint does not merge rows.
 */
export function customerLiveDevicesForDetail<T extends AdminDeviceListItem>(
  devices: T[],
  customerId: string,
  customerOrgId?: string | null,
): T[] {
  const scoped = devicesBelongingToCustomer(devices, customerId, customerOrgId);
  const unique = uniqueDevicesById(scoped);
  return sortCustomerDevicesByCreatedDesc(filterDevicesForView(unique, "all"));
}

export function releaseActionDeviceId(device: { id: string }): string {
  return device.id;
}

export function customerDeviceLifecycleAction(device: {
  status: string;
  licenseId?: string | null;
  currentLicense?: AdminDeviceListItem["currentLicense"];
  archivedAt?: string | null;
}): "release" | "archive" | "none" {
  if (canReleaseDevice(device)) return "release";
  if (canArchiveDevice(device)) return "archive";
  return "none";
}
