import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

import {
  ADMIN_DEVICES_LIST_DEFAULT_LIMIT,
  customerDeviceLifecycleAction,
  customerLiveDevicesForDetail,
  devicesBelongingToCustomer,
  releaseActionDeviceId,
  uniqueDevicesById,
} from "./adminCustomerDevices";
import {
  ARCHIVE_CONFIRM_MESSAGE,
  canReleaseDevice,
  RELEASE_CONFIRM_MESSAGE,
  type AdminDeviceListItem,
} from "./adminDeviceList";

const adminSrc = join(dirname(fileURLToPath(import.meta.url)), "..");

function device(
  overrides: Partial<AdminDeviceListItem>,
): AdminDeviceListItem {
  return {
    id: "d1",
    name: "Till",
    type: "pos",
    status: "active",
    fingerprint: "fp-shared",
    stationCode: "K01",
    customerId: "cust-1",
    customerName: "Cafe",
    licenseId: "lic-live",
    currentLicense: {
      id: "lic-live",
      plan: "starter",
      status: "active",
      validFrom: null,
      validUntil: "2099-01-01T00:00:00.000Z",
    },
    lastSeenAt: null,
    lastHeartbeatAt: "2026-01-01T12:00:00.000Z",
    createdAt: "2026-01-02T00:00:00.000Z",
    releasedAt: null,
    archivedAt: null,
    orgId: "org-1",
    ...overrides,
  };
}

describe("customer detail devices", () => {
  const live = device({
    id: "dev-live",
    name: "Front till",
    stationCode: "K01",
    createdAt: "2026-02-01T00:00:00.000Z",
  });
  const releasedSameFp = device({
    id: "dev-hist",
    name: "Front till (previous)",
    status: "released",
    licenseId: null,
    currentLicense: null,
    stationCode: "K02",
    createdAt: "2026-01-01T00:00:00.000Z",
    releasedAt: "2026-01-15T00:00:00.000Z",
  });
  const otherCustomer = device({
    id: "dev-other",
    customerId: "cust-2",
    orgId: "org-2",
    fingerprint: "fp-shared",
  });
  const archived = device({
    id: "dev-arch",
    status: "released",
    licenseId: null,
    currentLicense: null,
    archivedAt: "2026-03-01T00:00:00.000Z",
  });
  const orgMismatch = device({
    id: "dev-wrong-org",
    customerId: "cust-1",
    orgId: "org-other",
  });

  const rows = [
    live,
    releasedSameFp,
    otherCustomer,
    archived,
    orgMismatch,
  ];

  it("keeps one row per device ID when fingerprints match", () => {
    const listed = customerLiveDevicesForDetail(rows, "cust-1", "org-1");
    expect(listed.map((d) => d.id).sort()).toEqual(["dev-hist", "dev-live"]);
    expect(listed).toHaveLength(2);
    expect(uniqueDevicesById([live, live]).map((d) => d.id)).toEqual([
      "dev-live",
    ]);
  });

  it("keeps active and released rows distinct with their own license and station code", () => {
    const listed = customerLiveDevicesForDetail(rows, "cust-1", "org-1");
    const byId = Object.fromEntries(listed.map((d) => [d.id, d]));
    expect(byId["dev-live"].status).toBe("active");
    expect(byId["dev-live"].licenseId).toBe("lic-live");
    expect(byId["dev-live"].currentLicense?.plan).toBe("starter");
    expect(byId["dev-live"].stationCode).toBe("K01");
    expect(byId["dev-hist"].status).toBe("released");
    expect(byId["dev-hist"].licenseId).toBeNull();
    expect(byId["dev-hist"].stationCode).toBe("K02");
    expect(byId["dev-hist"].releasedAt).toBe("2026-01-15T00:00:00.000Z");
  });

  it("excludes archived devices from the live customer list", () => {
    const listed = customerLiveDevicesForDetail(rows, "cust-1", "org-1");
    expect(listed.some((d) => d.id === "dev-arch")).toBe(false);
    expect(listed.some((d) => d.archivedAt)).toBe(false);
  });

  it("filters to the customer and organization relationship", () => {
    expect(
      devicesBelongingToCustomer(rows, "cust-1", "org-1").map((d) => d.id).sort(),
    ).toEqual(["dev-arch", "dev-hist", "dev-live"]);
    expect(
      customerLiveDevicesForDetail(rows, "cust-2", "org-2").map((d) => d.id),
    ).toEqual(["dev-other"]);
  });

  it("releases the selected device ID and refuses a second release", () => {
    expect(releaseActionDeviceId(live)).toBe("dev-live");
    expect(releaseActionDeviceId(releasedSameFp)).toBe("dev-hist");
    expect(canReleaseDevice(live)).toBe(true);
    expect(canReleaseDevice(releasedSameFp)).toBe(false);
    expect(customerDeviceLifecycleAction(live)).toBe("release");
    expect(customerDeviceLifecycleAction(releasedSameFp)).toBe("archive");
  });

  it("documents the GET /devices cap and uses A1.1 confirmation copy", () => {
    expect(ADMIN_DEVICES_LIST_DEFAULT_LIMIT).toBe(500);
    expect(RELEASE_CONFIRM_MESSAGE).toMatch(/not permanently deleted/i);
    expect(RELEASE_CONFIRM_MESSAGE).toMatch(/release the device from its current license/i);
    expect(ARCHIVE_CONFIRM_MESSAGE).toMatch(/archive the device from normal/i);
  });
});

describe("A1.2d Customer Detail device UI", () => {
  it("lists one device.id row and does not merge by fingerprint", () => {
    const src = readFileSync(
      join(adminSrc, "pages/Customers/CustomerDetailPage.tsx"),
      "utf8",
    );
    expect(src).not.toMatch(/groupKey/);
    expect(src).not.toMatch(/fingerprint \|\| row\.id/);
    expect(src).not.toMatch(/grouped\[/);
    expect(src).not.toMatch(/deleted permanently/);
    expect(src).toMatch(/customerLiveDevicesForDetail/);
    expect(src).toMatch(/releaseActionDeviceId\(device\)/);
    expect(src).toMatch(/apiDeleteDevice\(deviceId\)/);
    expect(src).not.toMatch(/>\s*Delete\s*</);
  });

  it("does not add unarchive or hard-delete controls on Customer Detail", () => {
    const src = readFileSync(
      join(adminSrc, "pages/Customers/CustomerDetailPage.tsx"),
      "utf8",
    );
    expect(src).not.toMatch(/apiUnarchiveDevice/);
    expect(src).not.toMatch(/apiDelete\(`\/admin\/devices/);
    expect(src).toMatch(/apiDeleteDevice/);
    expect(src).toMatch(/apiArchiveDevice/);
    expect(src).toMatch(/RELEASE_CONFIRM_MESSAGE/);
  });

  it("leaves A1.1 Devices page, A1.2a Restore and A1.2b Revoke in place", () => {
    const devicesPage = readFileSync(
      join(adminSrc, "pages/DevicesListPage.tsx"),
      "utf8",
    );
    expect(devicesPage).toMatch(/filterDevicesForView\(rows, view\)/);
    expect(devicesPage).toMatch(/canReleaseDevice/);
    expect(devicesPage).toMatch(/apiArchiveDevice/);
    expect(devicesPage).toMatch(/key=\{d\.id\}/);

    const customersList = readFileSync(
      join(adminSrc, "pages/Customers/CustomersListPage.tsx"),
      "utf8",
    );
    expect(customersList).toMatch(/Restore/);
    expect(customersList).toMatch(/customerStatusPatchBody/);

    const licensesList = readFileSync(
      join(adminSrc, "pages/Licenses/LicensesListPage.tsx"),
      "utf8",
    );
    expect(licensesList).toMatch(/handleRevoke/);
    expect(licensesList).not.toMatch(/handleDelete/);
  });
});
