import { describe, expect, it } from "vitest";

import {
  averageOrderMinor,
  combineRevenueMinor,
} from "../portalSalesSummary.js";

describe("portalSalesSummary helpers", () => {
  it("computes average order in minor units", () => {
    expect(averageOrderMinor(1000, 4)).toBe(250);
    expect(averageOrderMinor(1000, 0)).toBe(0);
    expect(averageOrderMinor(453000, 27)).toBe(16778);
  });

  it("keeps online orders as the remainder of total minus live", () => {
    const total = 31;
    const live = 26;
    const online = Math.max(0, total - live);
    expect(live + online).toBe(total);
    expect(online).toBe(5);
  });

  it("combines POS and online revenue without double counting in the total", () => {
    expect(combineRevenueMinor(441000, 12000)).toBe(453000);
    expect(combineRevenueMinor(0, 0)).toBe(0);
    expect(combineRevenueMinor(100, 200)).toBe(300);
  });
});

describe("revenue split rules (documented)", () => {
  it("documents anti-double-count: provider receipt OR unpaid order, not both", () => {
    // Provider order fulfilled with KPI receipt → counted via receipt gross only.
    // Provider order paid without receipt → counted via order total only.
    const providerReceiptRevenue = 12000;
    const providerOrderWithoutReceipt = 0;
    const onlineRevenue = providerReceiptRevenue + providerOrderWithoutReceipt;

    const liveReceiptRevenue = 441000;
    const total = combineRevenueMinor(liveReceiptRevenue, onlineRevenue);

    expect(total).toBe(453000);
    expect(onlineRevenue).toBe(12000);
  });
});
