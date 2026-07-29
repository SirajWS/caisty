import { describe, expect, it } from "vitest";
import { deriveDevicesState } from "./deriveDevicesState";
import { portalEn } from "../translations/portal/en";
import { getPosReleaseConfig } from "../../config/posConfig";
import type { DevicesData } from "./types";

const baseCustomer = {
  id: "c1",
  orgId: "o1",
  name: "Alex",
  email: "alex@test.com",
  portalStatus: "active" as const,
};

function makeData(overrides: Partial<DevicesData> = {}): DevicesData {
  return {
    licenses: [],
    devices: [],
    business: null,
    customer: baseCustomer,
    loading: false,
    error: false,
    lastSyncedAt: new Date("2026-07-05T10:00:00Z"),
    ...overrides,
  };
}

describe("deriveDevicesState", () => {
  it("uses real device counts without inventing devices", () => {
    const state = deriveDevicesState({
      data: makeData({
        devices: [
          {
            id: "d1",
            name: "Till 1",
            deviceId: "dev-1",
            lastSeenAt: "2026-07-05T09:00:00Z",
            status: "online",
            licenseKey: "KEY",
            appVersion: "0.3.1",
          },
          {
            id: "d2",
            name: "Till 2",
            deviceId: "dev-2",
            lastSeenAt: null,
            status: "offline",
            licenseKey: null,
          },
        ],
      }),
      release: getPosReleaseConfig(),
      environmentLabel: "staging",
      locale: "en-US",
      t: portalEn,
    });

    expect(state.devices).toHaveLength(2);
    expect(state.overview.find((k) => k.id === "total")?.value).toBe("2");
    expect(state.overview.find((k) => k.id === "online")?.value).toBe("1");
    expect(state.overview.find((k) => k.id === "offline")?.value).toBe("1");
    expect(state.hasDevices).toBe(true);
  });

  it("reports empty state when no devices exist", () => {
    const state = deriveDevicesState({
      data: makeData(),
      release: getPosReleaseConfig(),
      environmentLabel: "staging",
      locale: "en-US",
      t: portalEn,
    });

    expect(state.hasDevices).toBe(false);
    expect(state.devices).toEqual([]);
    expect(state.overview.find((k) => k.id === "total")?.value).toBe("0");
  });

  it("derives seats and slots from the primary license", () => {
    const state = deriveDevicesState({
      data: makeData({
        licenses: [
          {
            id: "l1",
            key: "PRO-KEY",
            plan: "pro",
            status: "active",
            maxDevices: 3,
            validUntil: "2027-01-01T00:00:00Z",
            createdAt: "2026-01-01T00:00:00Z",
          },
        ],
        devices: [
          {
            id: "d1",
            name: "Till 1",
            deviceId: "dev-1",
            lastSeenAt: "2026-07-05T09:00:00Z",
            status: "online",
            licenseKey: "PRO-KEY",
            appVersion: "0.3.1",
          },
          {
            id: "d2",
            name: "Till 2",
            deviceId: "dev-2",
            lastSeenAt: null,
            status: "offline",
            licenseKey: "PRO-KEY",
          },
        ],
      }),
      release: getPosReleaseConfig(),
      environmentLabel: "staging",
      locale: "en-US",
      t: portalEn,
    });

    expect(state.seats.hasLicense).toBe(true);
    expect(state.seats.maxDevices).toBe(3);
    expect(state.seats.usedDevices).toBe(2);
    expect(state.seats.availableSlots).toBe(1);
    expect(state.seats.percent).toBe(67);
    expect(state.slots).toHaveLength(3);
    expect(state.slots.filter((s) => s.kind === "device")).toHaveLength(2);
    expect(state.slots.filter((s) => s.kind === "empty")).toHaveLength(1);
  });

  it("reports no license and no free slots when no license exists", () => {
    const state = deriveDevicesState({
      data: makeData(),
      release: getPosReleaseConfig(),
      environmentLabel: "staging",
      locale: "en-US",
      t: portalEn,
    });

    expect(state.seats.hasLicense).toBe(false);
    expect(state.seats.maxDevices).toBe(0);
    expect(state.seats.availableSlots).toBe(0);
    expect(state.slots).toEqual([]);
  });

  it("shows the license key when only licenseKeys[] is provided", () => {
    const state = deriveDevicesState({
      data: makeData({
        devices: [
          {
            id: "d1",
            name: "Till 1",
            deviceId: "d1",
            lastSeenAt: "2026-07-05T09:00:00Z",
            status: "online",
            licenseKey: null,
            licenseKeys: [{ key: "CSTY-PRO-XXXX", plan: "pro" }],
          },
        ],
      }),
      release: getPosReleaseConfig(),
      environmentLabel: "staging",
      locale: "en-US",
      t: portalEn,
    });

    expect(state.devices[0].license).toBe("CSTY-PRO-XXXX");
    expect(state.devices[0].license).not.toBe(portalEn.devices.notLinked);
  });

  it("shows the license key when licenseKey is provided directly", () => {
    const state = deriveDevicesState({
      data: makeData({
        devices: [
          {
            id: "d1",
            name: "Till 1",
            deviceId: "d1",
            lastSeenAt: "2026-07-05T09:00:00Z",
            status: "online",
            licenseKey: "CSTY-DIRECT-KEY",
          },
        ],
      }),
      release: getPosReleaseConfig(),
      environmentLabel: "staging",
      locale: "en-US",
      t: portalEn,
    });

    expect(state.devices[0].license).toBe("CSTY-DIRECT-KEY");
  });

  it("shows Not linked only when no license is present at all", () => {
    const state = deriveDevicesState({
      data: makeData({
        devices: [
          {
            id: "d1",
            name: "Till 1",
            deviceId: "d1",
            lastSeenAt: "2026-07-05T09:00:00Z",
            status: "online",
            licenseKey: null,
            licenseKeys: [],
          },
        ],
      }),
      release: getPosReleaseConfig(),
      environmentLabel: "staging",
      locale: "en-US",
      t: portalEn,
    });

    expect(state.devices[0].license).toBe(portalEn.devices.notLinked);
  });

  it("does not mark a fresh online device as warning", () => {
    const state = deriveDevicesState({
      data: makeData({
        devices: [
          {
            id: "d1",
            name: "Till 1",
            deviceId: "d1",
            lastSeenAt: "2026-07-05T09:00:00Z",
            status: "online",
            licenseKey: "CSTY-PRO-XXXX",
            appVersion: "0.3.2",
          },
        ],
      }),
      release: getPosReleaseConfig(),
      environmentLabel: "staging",
      locale: "en-US",
      t: portalEn,
    });

    expect(state.devices[0].status).toBe("online");
    expect(state.devices[0].statusTone).toBe("ok");
    expect(state.devices[0].version).toBe("0.3.2");
  });

  it("does not count released devices toward used seats", () => {
    const state = deriveDevicesState({
      data: makeData({
        licenses: [
          {
            id: "l1",
            key: "PRO-KEY",
            plan: "pro",
            status: "active",
            maxDevices: 3,
            validUntil: "2027-01-01T00:00:00Z",
            createdAt: "2026-01-01T00:00:00Z",
          },
        ],
        devices: [
          {
            id: "d1",
            name: "Till 1",
            deviceId: "dev-1",
            lastSeenAt: "2026-07-05T09:00:00Z",
            status: "online",
            licenseKey: "PRO-KEY",
            bindingStatus: "bound",
          },
          {
            id: "d2",
            name: "Old Till",
            deviceId: "dev-2",
            lastSeenAt: "2026-06-01T09:00:00Z",
            status: "offline",
            licenseKey: null,
            bindingStatus: "released",
            releasedAt: "2026-07-01T12:00:00Z",
          },
        ],
      }),
      release: getPosReleaseConfig(),
      environmentLabel: "staging",
      locale: "en-US",
      t: portalEn,
    });

    expect(state.seats.usedDevices).toBe(1);
    expect(state.seats.availableSlots).toBe(2);
    expect(state.devices[1].isReleased).toBe(true);
    expect(state.devices[1].statusLabel).toBe(portalEn.devices.statusReleased);
  });

  it("treats null maxDevices as unlimited without coercing to 0 or 1", () => {
    const state = deriveDevicesState({
      data: makeData({
        licenses: [
          {
            id: "l1",
            key: "BIZ-KEY",
            plan: "business",
            status: "active",
            maxDevices: null,
            unlimitedDevices: true,
            validUntil: "2027-01-01T00:00:00Z",
            createdAt: "2026-01-01T00:00:00Z",
          },
        ],
        devices: [
          {
            id: "d1",
            name: "Till 1",
            deviceId: "dev-1",
            lastSeenAt: "2026-07-05T09:00:00Z",
            status: "online",
            licenseKey: "BIZ-KEY",
          },
          {
            id: "d2",
            name: "Till 2",
            deviceId: "dev-2",
            lastSeenAt: null,
            status: "offline",
            licenseKey: "BIZ-KEY",
          },
        ],
      }),
      release: getPosReleaseConfig(),
      environmentLabel: "staging",
      locale: "en-US",
      t: portalEn,
    });

    expect(state.seats.unlimitedDevices).toBe(true);
    expect(state.seats.maxDevices).toBeNull();
    expect(state.seats.usedDevices).toBe(2);
    expect(state.seats.availableSlots).toBe(Number.POSITIVE_INFINITY);
    expect(state.slots.filter((s) => s.kind === "empty")).toHaveLength(0);
    expect(state.seats.planLabel).toBe("Business");
  });
});
