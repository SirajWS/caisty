import { describe, expect, it } from "vitest";
import { derivePosHubState } from "./derivePosHubState";
import { portalEn } from "../translations/portal/en";
import type { PosReleaseConfig } from "../../config/posConfig";

const release: PosReleaseConfig = {
  latestVersion: "0.3.3",
  releaseDate: null,
  releaseNotesUrl: null,
  releaseNotesSummary: null,
  installer: {
    platform: "Windows x64",
    fileName: "Caisty.PoS_0.3.3_x64-setup.exe",
    downloadUrl: "/downloads/Caisty.PoS_0.3.3_x64-setup.exe",
    sizeBytes: null,
    sha256: null,
  },
  web: { enabled: false, url: null, plannedUrl: "https://pos.caisty.com" },
  desktop: { protocol: "caisty", openUrl: "caisty://open" },
};

const baseCustomer = {
  id: "c1",
  orgId: "o1",
  name: "Alex",
  email: "alex@test.com",
  portalStatus: "active" as const,
  primaryLicense: {
    id: "l1",
    key: "KEY",
    plan: "pro",
    status: "active",
    validUntil: null,
  },
};

describe("derivePosHubState", () => {
  it("derives summary with online device status", () => {
    const state = derivePosHubState({
      data: {
        licenses: [],
        devices: [
          {
            id: "d1",
            name: "Till 1",
            deviceId: "dev-1",
            status: "online",
            appVersion: "0.3.1",
            lastSeenAt: "2026-01-01T00:00:00.000Z",
            licenseKey: null,
          },
        ],
        invoices: [],
        business: null,
        customer: baseCustomer,
        loading: false,
        error: false,
        lastSyncedAt: new Date(),
      },
      release,
      t: portalEn,
      environmentLabel: "production",
    });

    expect(state.summary.posStatusLabel).toBe(portalEn.pos.statusOnline);
    expect(state.summary.devicesShortLabel).toContain("1");
  });

  it("derives not connected when no devices", () => {
    const state = derivePosHubState({
      data: {
        licenses: [],
        devices: [],
        invoices: [],
        business: null,
        customer: baseCustomer,
        loading: false,
        error: false,
        lastSyncedAt: new Date(),
      },
      release,
      t: portalEn,
      environmentLabel: "production",
    });

    expect(state.summary.posStatusLabel).toBe(portalEn.pos.statusNotConnected);
    expect(state.summary.devicesShortLabel).toBe(portalEn.pos.summaryNoDevices);
  });
});
