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
});
