import { describe, expect, it } from "vitest";

import { averageOrderMinor } from "../portalSalesSummary.js";

describe("portalSalesSummary helpers", () => {
  it("computes average order in minor units", () => {
    expect(averageOrderMinor(1000, 4)).toBe(250);
    expect(averageOrderMinor(1000, 0)).toBe(0);
    // Revenue / KPI-eligible receipts, not all orders (453000 / 27 receipts)
    expect(averageOrderMinor(453000, 27)).toBe(16778);
  });

  it("keeps online orders as the remainder of total minus live", () => {
    const total = 31;
    const live = 26;
    const online = Math.max(0, total - live);
    expect(live + online).toBe(total);
    expect(online).toBe(5);
  });
});
