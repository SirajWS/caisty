import { describe, expect, it } from "vitest";

import {
  ARCHIVE_CONFIRM_MESSAGE,
  canArchiveDevice,
  canReleaseDevice,
  currentLicenseSummary,
  deviceLifecycleLabel,
  filterDevicesForView,
  RELEASE_CONFIRM_MESSAGE,
  type AdminDeviceListItem,
} from "./adminDeviceList";

function device(
  overrides: Partial<AdminDeviceListItem>,
): AdminDeviceListItem {
  return {
    id: "d1",
    name: "Till",
    type: "pos",
    status: "active",
    fingerprint: "fp",
    stationCode: "K01",
    customerId: "c1",
    customerName: "Cafe",
    licenseId: "lic-1",
    currentLicense: {
      id: "lic-1",
      plan: "starter",
      status: "active",
      validFrom: null,
      validUntil: "2099-01-01T00:00:00.000Z",
    },
    lastSeenAt: null,
    lastHeartbeatAt: "2026-01-01T12:00:00.000Z",
    createdAt: "2026-01-01T00:00:00.000Z",
    ...overrides,
  };
}

describe("admin device list", () => {
  const active = device({ id: "active" });
  const released = device({
    id: "released",
    status: "released",
    licenseId: null,
    currentLicense: null,
  });
  const pending = device({
    id: "pending",
    status: "pending_approval",
    licenseId: null,
    currentLicense: null,
  });

  it("filters Current, Released and All History", () => {
    const rows = [active, released, pending];
    expect(filterDevicesForView(rows, "current").map((d) => d.id)).toEqual([
      "active",
      "pending",
    ]);
    expect(filterDevicesForView(rows, "released").map((d) => d.id)).toEqual([
      "released",
    ]);
    expect(filterDevicesForView(rows, "all")).toHaveLength(3);
  });

  it("allows Release only for bound active/blocked devices", () => {
    expect(canReleaseDevice(active)).toBe(true);
    expect(canReleaseDevice(released)).toBe(false);
    expect(canReleaseDevice(pending)).toBe(false);
    expect(
      canReleaseDevice(device({ status: "active", licenseId: null, currentLicense: null })),
    ).toBe(false);
  });

  it("labels unassigned, expired and revoked licenses without using historical licenses", () => {
    expect(
      deviceLifecycleLabel({ status: "active", licenseId: null }),
    ).toBe("Active · unassigned");
    expect(currentLicenseSummary(released).label).toBe("Unassigned");
    expect(
      currentLicenseSummary(
        device({
          currentLicense: {
            id: "lic-1",
            plan: "pro",
            status: "expired",
            validFrom: null,
            validUntil: "2020-01-01T00:00:00.000Z",
          },
        }),
      ).status,
    ).toBe("expired");
    expect(
      currentLicenseSummary(
        device({
          currentLicense: {
            id: "lic-1",
            plan: "pro",
            status: "revoked",
            validFrom: null,
            validUntil: "2099-01-01T00:00:00.000Z",
          },
        }),
      ).status,
    ).toBe("revoked");
  });

  it("shows station codes and does not claim deletion in the confirm copy", () => {
    expect(active.stationCode).toBe("K01");
    expect(RELEASE_CONFIRM_MESSAGE).toMatch(/not permanently deleted/i);
    expect(RELEASE_CONFIRM_MESSAGE).toMatch(/receipts/i);
  });

  it("hides a released device from Current after a successful release", () => {
    const after = filterDevicesForView(
      [device({ id: "active", status: "released", licenseId: null, currentLicense: null })],
      "current",
    );
    expect(after).toHaveLength(0);
  });

  it("shows Remove for released devices and hides them after archive", () => {
    expect(canArchiveDevice(released)).toBe(true);
    expect(canArchiveDevice(active)).toBe(false);
    expect(canArchiveDevice(pending)).toBe(false);
    expect(
      canArchiveDevice(
        device({ status: "active", licenseId: null, currentLicense: null }),
      ),
    ).toBe(true);

    const archived = device({
      id: "archived",
      status: "released",
      licenseId: null,
      currentLicense: null,
      archivedAt: "2026-11-20T00:00:00.000Z",
    });
    const rows = [active, released, pending, archived];
    expect(filterDevicesForView(rows, "released").map((d) => d.id)).toEqual([
      "released",
    ]);
    expect(filterDevicesForView(rows, "all").map((d) => d.id)).toEqual([
      "active",
      "released",
      "pending",
    ]);
    expect(filterDevicesForView(rows, "archived").map((d) => d.id)).toEqual([
      "archived",
    ]);
    expect(canArchiveDevice(archived)).toBe(false);
    expect(deviceLifecycleLabel(archived)).toBe("Archived");
    expect(ARCHIVE_CONFIRM_MESSAGE).toMatch(/archive the device from normal/i);
    expect(ARCHIVE_CONFIRM_MESSAGE).toMatch(/receipts/i);
  });
});
