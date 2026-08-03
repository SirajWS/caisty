import { describe, expect, it } from "vitest";
import { deriveDeviceManagementState } from "./deriveDeviceManagementState";
import { portalEn } from "../translations/portal/en";
import type { PortalDeviceManagementResponse } from "./portalDeviceApi";

const baseResponse: PortalDeviceManagementResponse = {
  ok: true,
  summary: {
    plan: "pro",
    maxDevices: 3,
    unlimitedDevices: false,
    usedSeats: 2,
    activeCount: 1,
    blockedCount: 1,
    pendingCount: 1,
    rejectedCount: 0,
    releasedCount: 0,
    remainingSeats: 1,
    overLimit: false,
  },
  devices: [
    {
      id: "d-pending",
      name: "Till Pending",
      type: "pos",
      lifecycleStatus: "pending_approval",
      connectivityStatus: "never_seen",
      licenseId: null,
      pendingLicenseId: "lic-1",
      licensePlan: "pro",
      fingerprintMasked: "abcd…wxyz",
      appVersion: "1.0.0",
      createdAt: "2026-08-01T10:00:00.000Z",
      approvedAt: null,
      blockedAt: null,
      rejectedAt: null,
      releasedAt: null,
      allowedActions: ["approve", "reject"],
    },
    {
      id: "d-active",
      name: "Till Active",
      type: "pos",
      lifecycleStatus: "active",
      connectivityStatus: "online",
      licenseId: "lic-1",
      pendingLicenseId: null,
      licensePlan: "pro",
      fingerprintMasked: null,
      appVersion: "1.0.1",
      createdAt: "2026-07-01T10:00:00.000Z",
      approvedAt: "2026-07-02T10:00:00.000Z",
      blockedAt: null,
      rejectedAt: null,
      releasedAt: null,
      allowedActions: ["block", "release"],
    },
  ],
};

describe("deriveDeviceManagementState", () => {
  it("maps server seat summary without inventing limits", () => {
    const state = deriveDeviceManagementState({
      response: baseResponse,
      locale: "en-US",
      t: portalEn,
    });

    expect(state.seats.usedDevices).toBe(2);
    expect(state.seats.maxDevices).toBe(3);
    expect(state.seats.availableSlots).toBe(1);
    expect(state.seats.pendingCount).toBe(1);
    expect(state.seats.blockedCount).toBe(1);
    expect(state.canApproveNew).toBe(true);
  });

  it("does not expose license keys or raw fingerprints", () => {
    const state = deriveDeviceManagementState({
      response: baseResponse,
      locale: "en-US",
      t: portalEn,
    });
    const json = JSON.stringify(state);
    expect(json).not.toContain("lic-1");
    expect(json).not.toContain("CSTY-");
    expect(state.devices[0]?.fingerprintMasked).toBe("abcd…wxyz");
  });

  it("uses server allowed actions per device", () => {
    const state = deriveDeviceManagementState({
      response: baseResponse,
      locale: "en-US",
      t: portalEn,
    });
    const pending = state.devices.find((d) => d.id === "d-pending");
    const active = state.devices.find((d) => d.id === "d-active");
    expect(pending?.allowedActions).toEqual(["approve", "reject"]);
    expect(active?.allowedActions).toEqual(["block", "release"]);
  });

  it("flags over-limit and disables new approvals", () => {
    const state = deriveDeviceManagementState({
      response: {
        ...baseResponse,
        summary: {
          ...baseResponse.summary,
          usedSeats: 4,
          remainingSeats: 0,
          overLimit: true,
        },
      },
      locale: "en-US",
      t: portalEn,
    });
    expect(state.seats.overLimit).toBe(true);
    expect(state.canApproveNew).toBe(false);
  });

  it("sorts pending devices before active devices", () => {
    const state = deriveDeviceManagementState({
      response: baseResponse,
      locale: "en-US",
      t: portalEn,
    });
    expect(state.devices[0]?.lifecycleStatus).toBe("pending_approval");
  });
});
