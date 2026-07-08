import { describe, expect, it } from "vitest";

import { buildPortalDashboardSummaryResponse } from "../portalPosSales.js";

describe("buildPortalDashboardSummaryResponse", () => {
  it("marks hasSalesData when orders or receipts exist", () => {
    const withSales = buildPortalDashboardSummaryResponse({
      todayRevenueCents: 572800,
      ordersToday: 10,
      receiptsToday: 10,
      currency: "TND",
      lastSynchronizationAt: "2026-07-08T10:00:00.000Z",
    });

    expect(withSales.hasSalesData).toBe(true);
    expect(withSales.todayRevenueCents).toBe(572800);
    expect(withSales.ordersToday).toBe(10);
    expect(withSales.receiptsToday).toBe(10);
    expect(withSales.currency).toBe("TND");
    expect(withSales.timezone).toBe("Europe/Berlin");
  });

  it("returns placeholder-friendly summary when no sales exist", () => {
    const empty = buildPortalDashboardSummaryResponse({
      todayRevenueCents: 0,
      ordersToday: 0,
      receiptsToday: 0,
      currency: "EUR",
      lastSynchronizationAt: null,
    });

    expect(empty.hasSalesData).toBe(false);
    expect(empty.period).toBe("today");
  });
});
