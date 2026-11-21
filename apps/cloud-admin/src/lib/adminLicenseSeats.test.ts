import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

import {
  countOccupiedSeatsForLicense,
  deviceOccupiesSeat,
  formatMaxDevices,
  formatSeatUsage,
  summarizeCustomerDeviceRecords,
} from "./adminLicenseSeats";

const adminSrc = join(dirname(fileURLToPath(import.meta.url)), "..");

describe("canonical seat occupation (admin)", () => {
  it("counts active and blocked bound devices as one seat each", () => {
    expect(
      deviceOccupiesSeat({ status: "active", licenseId: "lic-1" }),
    ).toBe(true);
    expect(
      deviceOccupiesSeat({ status: "blocked", licenseId: "lic-1" }),
    ).toBe(true);
  });

  it("does not count pending, released, rejected, archived or unassigned", () => {
    expect(
      deviceOccupiesSeat({ status: "pending_approval", licenseId: null }),
    ).toBe(false);
    expect(
      deviceOccupiesSeat({ status: "released", licenseId: null }),
    ).toBe(false);
    expect(
      deviceOccupiesSeat({ status: "rejected", licenseId: null }),
    ).toBe(false);
    expect(
      deviceOccupiesSeat({
        status: "active",
        licenseId: "lic-1",
        archivedAt: "2026-01-01T00:00:00.000Z",
      }),
    ).toBe(false);
    expect(
      deviceOccupiesSeat({ status: "active", licenseId: null }),
    ).toBe(false);
  });

  it("counts distinct device IDs separately even when fingerprints match", () => {
    const rows = [
      { id: "d1", status: "active", licenseId: "lic-1", fingerprint: "fp" },
      { id: "d2", status: "active", licenseId: "lic-1", fingerprint: "fp" },
    ];
    expect(countOccupiedSeatsForLicense(rows, "lic-1")).toBe(2);
  });

  it("decreases occupancy on release and not again on a repeated release", () => {
    const bound = [
      { id: "d1", status: "active", licenseId: "lic-1" },
      { id: "d2", status: "active", licenseId: "lic-1" },
    ];
    expect(countOccupiedSeatsForLicense(bound, "lic-1")).toBe(2);
    const afterRelease = [
      { id: "d1", status: "released", licenseId: null },
      { id: "d2", status: "active", licenseId: "lic-1" },
    ];
    expect(countOccupiedSeatsForLicense(afterRelease, "lic-1")).toBe(1);
    expect(countOccupiedSeatsForLicense(afterRelease, "lic-1")).toBe(1);
  });

  it("keeps occupied seats after revoke or expiry of the license row", () => {
    const stillBound = [
      { id: "d1", status: "active", licenseId: "lic-revoked" },
    ];
    expect(countOccupiedSeatsForLicense(stillBound, "lic-revoked")).toBe(1);
    expect(
      deviceOccupiesSeat({ status: "active", licenseId: "lic-expired" }),
    ).toBe(true);
  });

  it("displays Unlimited when maxDevices is null", () => {
    expect(formatMaxDevices(null)).toBe("Unlimited");
    expect(formatSeatUsage(2, null)).toBe("2 / Unlimited");
    expect(formatSeatUsage(2, 3)).toBe("2 / 3");
  });

  it("does not treat historical Customer Detail rows as occupied seats", () => {
    const summary = summarizeCustomerDeviceRecords([
      { id: "a", status: "active", licenseId: "lic-1" },
      { id: "b", status: "released", licenseId: null },
      { id: "c", status: "pending_approval", licenseId: null },
    ]);
    expect(summary.visibleRecords).toBe(3);
    expect(summary.occupiedSeats).toBe(1);
    expect(summary.released).toBe(1);
    expect(summary.pending).toBe(1);
  });
});

describe("A1.2c UI regressions", () => {
  it("keeps Customer Detail one row per devices.id", () => {
    const src = readFileSync(
      join(adminSrc, "pages/Customers/CustomerDetailPage.tsx"),
      "utf8",
    );
    expect(src).toMatch(/customerLiveDevicesForDetail/);
    expect(src).not.toMatch(/groupKey/);
    expect(src).toMatch(/summarizeCustomerDeviceRecords/);
  });

  it("leaves A1.1 archive, A1.2a Restore and A1.2b Revoke in place", () => {
    const devicesPage = readFileSync(
      join(adminSrc, "pages/DevicesListPage.tsx"),
      "utf8",
    );
    expect(devicesPage).toMatch(/apiArchiveDevice/);
    expect(devicesPage).toMatch(/canReleaseDevice/);

    const customers = readFileSync(
      join(adminSrc, "pages/Customers/CustomersListPage.tsx"),
      "utf8",
    );
    expect(customers).toMatch(/Restore/);

    const licenses = readFileSync(
      join(adminSrc, "pages/Licenses/LicensesListPage.tsx"),
      "utf8",
    );
    expect(licenses).toMatch(/handleRevoke/);
    expect(licenses).toMatch(/formatSeatUsage|SeatsStatus/);
  });
});
