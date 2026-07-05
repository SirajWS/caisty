import { describe, expect, it } from "vitest";
import { deriveOrdersState } from "./deriveOrdersState";
import { portalEn } from "../translations/portal/en";
import type { DashboardData } from "../dashboard/types";

const baseCustomer = {
  id: "c1",
  orgId: "o1",
  name: "Alex",
  email: "alex@test.com",
  portalStatus: "active" as const,
};

function makeData(overrides: Partial<DashboardData> = {}): DashboardData {
  return {
    licenses: [],
    devices: [],
    invoices: [],
    business: null,
    customer: baseCustomer,
    loading: false,
    error: false,
    lastSyncedAt: new Date("2026-07-05T10:00:00Z"),
    ...overrides,
  };
}

describe("deriveOrdersState", () => {
  it("does not invent orders or receipts", () => {
    const state = deriveOrdersState({
      data: makeData({
        devices: [
          {
            id: "d1",
            name: "Till 1",
            deviceId: "dev-1",
            lastSeenAt: "2026-07-05T09:00:00Z",
            status: "online",
            licenseKey: "KEY",
          },
        ],
      }),
      t: portalEn,
    });

    expect(state.orders).toEqual([]);
    expect(state.receipts).toEqual([]);
    expect(state.summary.every((k) => k.value === "—")).toBe(true);
  });

  it("detects POS sync from device heartbeat", () => {
    const synced = deriveOrdersState({
      data: makeData({
        devices: [
          {
            id: "d1",
            name: "Till",
            deviceId: "dev-1",
            lastSeenAt: "2026-07-05T09:00:00Z",
            status: "online",
            licenseKey: null,
          },
        ],
      }),
      t: portalEn,
    });
    expect(synced.hasPosSync).toBe(true);

    const notSynced = deriveOrdersState({ data: makeData(), t: portalEn });
    expect(notSynced.hasPosSync).toBe(false);
  });
});
