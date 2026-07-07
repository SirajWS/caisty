import { describe, expect, it } from "vitest";
import { deriveReportsState } from "./deriveReportsState";
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

describe("deriveReportsState", () => {
  it("does not invent revenue, products, or employees", () => {
    const state = deriveReportsState({
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

    expect(state.topProducts).toEqual([]);
    expect(state.topEmployees).toEqual([]);
    expect(state.overview.every((k) => k.value === "—")).toBe(true);
    expect(state.revenueChart.hasData).toBe(false);
    expect(state.hourlySales.bars.every((b) => b.value === null)).toBe(true);
  });

  it("detects POS sync from device heartbeat", () => {
    const synced = deriveReportsState({
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

    const notSynced = deriveReportsState({ data: makeData(), t: portalEn });
    expect(notSynced.hasPosSync).toBe(false);
  });
});
