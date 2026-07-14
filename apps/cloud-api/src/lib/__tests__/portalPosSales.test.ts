import { describe, expect, it } from "vitest";

import { buildPortalDashboardSummaryResponse } from "../portalPosSales.js";

describe("buildPortalDashboardSummaryResponse", () => {
  it("marks hasSalesData when orders or receipts exist", () => {
    const withSales = buildPortalDashboardSummaryResponse(
      {
        todayRevenueCents: 572800,
        posRevenueCents: 520000,
        onlineRevenueCents: 52800,
        ordersToday: 10,
        liveOrdersCount: 8,
        onlineOrdersCount: 2,
        receiptsToday: 10,
        refundsCount: 0,
        averageOrderMinor: 57280,
        currency: "TND",
        lastSynchronizationAt: "2026-07-08T10:00:00.000Z",
      },
      [],
      {
        cashCents: 0,
        cardCents: 572800,
        voucherCents: 0,
        otherCents: 0,
        currency: "TND",
      },
    );

    expect(withSales.hasSalesData).toBe(true);
    expect(withSales.todayRevenueCents).toBe(572800);
    expect(withSales.posRevenueCents).toBe(520000);
    expect(withSales.onlineRevenueCents).toBe(52800);
    expect(withSales.ordersToday).toBe(10);
    expect(withSales.liveOrdersCount).toBe(8);
    expect(withSales.onlineOrdersCount).toBe(2);
    expect(withSales.receiptsToday).toBe(10);
    expect(withSales.currency).toBe("TND");
    expect(withSales.timezone).toBe("Europe/Berlin");
  });

  it("returns placeholder-friendly summary when no sales exist", () => {
    const empty = buildPortalDashboardSummaryResponse(
      {
        todayRevenueCents: 0,
        posRevenueCents: 0,
        onlineRevenueCents: 0,
        ordersToday: 0,
        liveOrdersCount: 0,
        onlineOrdersCount: 0,
        receiptsToday: 0,
        refundsCount: 0,
        averageOrderMinor: 0,
        currency: "EUR",
        lastSynchronizationAt: null,
      },
      [],
      {
        cashCents: 0,
        cardCents: 0,
        voucherCents: 0,
        otherCents: 0,
        currency: "EUR",
      },
    );

    expect(empty.hasSalesData).toBe(false);
    expect(empty.period).toBe("today");
  });
});
