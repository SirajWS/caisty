import { describe, expect, it } from "vitest";

import { averageOrderMinor } from "../portalSalesSummary.js";

describe("portalSalesSummary helpers", () => {
  it("computes average order in minor units", () => {
    expect(averageOrderMinor(1000, 4)).toBe(250);
    expect(averageOrderMinor(1000, 0)).toBe(0);
  });
});
