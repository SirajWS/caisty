import { describe, expect, it } from "vitest";

import {
  deriveLicenseDisplayStatus,
  filterAdminDevices,
  mapAdminDeviceRow,
  wantsArchivedDevices,
} from "../adminDeviceDisplay.js";
import { formatStationCode } from "../stationCode.js";

describe("admin device display", () => {
  const active = mapAdminDeviceRow({
    id: "d-active",
    name: "Till 1",
    type: "pos",
    status: "active",
    fingerprint: "fp-1",
    stationCode: "K01",
    customerId: "c1",
    customerName: "Cafe",
    licenseId: "lic-1",
    licensePlan: "starter",
    licenseStatus: "active",
    licenseValidUntil: "2099-01-01T00:00:00.000Z",
    createdAt: "2026-01-02T00:00:00.000Z",
  });

  const released = mapAdminDeviceRow({
    id: "d-released",
    name: "Till 1",
    type: "pos",
    status: "released",
    fingerprint: "fp-1",
    stationCode: "K01",
    customerId: "c1",
    customerName: "Cafe",
    licenseId: null,
    createdAt: "2026-01-01T00:00:00.000Z",
    releasedAt: "2026-01-03T00:00:00.000Z",
  });

  const pending = mapAdminDeviceRow({
    id: "d-pending",
    name: "Till 2",
    status: "pending_approval",
    fingerprint: "fp-2",
    stationCode: "K02",
    createdAt: "2026-01-04T00:00:00.000Z",
  });

  const unassigned = mapAdminDeviceRow({
    id: "d-unassigned",
    name: "Till 3",
    status: "active",
    fingerprint: "fp-3",
    stationCode: "K11",
    licenseId: null,
    createdAt: "2026-01-05T00:00:00.000Z",
  });

  const devices = [active, released, pending, unassigned];

  it("excludes released devices from Current", () => {
    const current = filterAdminDevices(devices, "current");
    expect(current.map((d) => d.id)).toEqual([
      "d-active",
      "d-pending",
      "d-unassigned",
    ]);
  });

  it("Released includes historical released records", () => {
    expect(filterAdminDevices(devices, "released").map((d) => d.id)).toEqual([
      "d-released",
    ]);
  });

  it("All History includes all states", () => {
    expect(filterAdminDevices(devices, "all")).toHaveLength(4);
  });

  it("excludes archived devices from Current, Released and All History", () => {
    const archived = mapAdminDeviceRow({
      id: "d-archived",
      name: "Till 1",
      status: "released",
      fingerprint: "fp-old",
      stationCode: "K01",
      archivedAt: "2026-11-20T00:00:00.000Z",
    });
    const withArchived = [...devices, archived];
    expect(filterAdminDevices(withArchived, "current").map((d) => d.id)).not.toContain(
      "d-archived",
    );
    expect(filterAdminDevices(withArchived, "released").map((d) => d.id)).not.toContain(
      "d-archived",
    );
    expect(filterAdminDevices(withArchived, "all").map((d) => d.id)).not.toContain(
      "d-archived",
    );
    expect(filterAdminDevices(withArchived, "archived").map((d) => d.id)).toEqual([
      "d-archived",
    ]);
    expect(archived.stationCode).toBe("K01");
  });

  it("keeps multiple rows for the same fingerprint", () => {
    const sameFp = filterAdminDevices(devices, "all").filter(
      (d) => d.fingerprint === "fp-1",
    );
    expect(sameFp).toHaveLength(2);
    expect(sameFp.map((d) => d.status).sort()).toEqual(["active", "released"]);
  });

  it("does not treat a historical license as the current license", () => {
    expect(released.currentLicense).toBeNull();
    expect(released.licenseId).toBeNull();
    expect(active.currentLicense?.id).toBe("lic-1");
    expect(unassigned.currentLicense).toBeNull();
  });

  it("marks expired and revoked licenses without rewriting device rows", () => {
    expect(
      deriveLicenseDisplayStatus({
        status: "active",
        validUntil: "2020-01-01T00:00:00.000Z",
      }),
    ).toBe("expired");
    expect(
      deriveLicenseDisplayStatus({
        status: "revoked",
        validUntil: "2099-01-01T00:00:00.000Z",
      }),
    ).toBe("revoked");
  });

  it("treats archived=1 as the explicit archived list", () => {
    expect(wantsArchivedDevices({ archived: "1" })).toBe(true);
    expect(wantsArchivedDevices({})).toBe(false);
    expect(wantsArchivedDevices({ archived: "0" })).toBe(false);
  });

  it("preserves B5 station codes on mapped rows", () => {
    expect(active.stationCode).toBe("K01");
    expect(released.stationCode).toBe("K01");
    expect(formatStationCode(11)).toBe("K11");
    expect(unassigned.stationCode).toBe("K11");
  });
});
