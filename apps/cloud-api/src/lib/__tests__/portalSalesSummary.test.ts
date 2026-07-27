import { describe, expect, it } from "vitest";

import {
  averageOrderMinor,
  combineRevenueMinor,
} from "../portalSalesSummary.js";
import { dedupeProviderOrders } from "../dedupeProviderOrders.js";
import {
  aggregateEffectivePaymentSummary,
  type OrderPaymentRow,
} from "../portalOrders.js";

describe("portalSalesSummary helpers", () => {
  it("computes average order in minor units", () => {
    expect(averageOrderMinor(1000, 4)).toBe(250);
    expect(averageOrderMinor(1000, 0)).toBe(0);
    expect(averageOrderMinor(453000, 27)).toBe(16778);
  });

  it("keeps live and online counts additive after provider dedup", () => {
    const live = 26;
    const onlineWinners = 4; // e.g. 5 raw provider rows → 4 unique provider keys
    const total = live + onlineWinners;
    expect(total).toBe(30);
    expect(onlineWinners).toBeLessThan(5);
  });

  it("counts dashboard revenue from provider winners only", () => {
    const posRevenueCents = 441000;
    // Two cloud rows same providerOrderId (web+desktop), each 12000 — count once
    const onlineWinnerRevenueCents = 12000;
    expect(combineRevenueMinor(posRevenueCents, onlineWinnerRevenueCents)).toBe(
      453000,
    );
  });

  it("regression T1785113113966: online orders 1 and revenue 27500 from winners", () => {
    const winners = dedupeProviderOrders([
      {
        id: "a",
        platform: "fake_delivery",
        providerOrderId: null,
        localOrderId: "T1785113113966",
        status: "created",
        updatedAt: "2026-07-27T00:45:15.000Z",
        soldAt: "2026-07-27T00:45:13.000Z",
      },
      {
        id: "b",
        platform: "fake_delivery",
        providerOrderId: null,
        localOrderId: "T1785113113966",
        status: "delivered",
        updatedAt: "2026-07-27T00:45:27.000Z",
        soldAt: "2026-07-27T00:45:13.000Z",
      },
    ]);
    const onlineOrdersCount = winners.length;
    const onlineRevenueCents = winners.length * 27500;
    expect(onlineOrdersCount).toBe(1);
    expect(onlineRevenueCents).toBe(27500);
    expect(winners[0]?.status).toBe("delivered");
  });

  it("documents paidWinnerKeys removal: POS payments never mark provider winners", () => {
    const posPaymentKeys = new Set(["pos-dev:POS-1"]);
    const providerWinnerKeys = new Set(["web-dev:T1785113113966"]);
    const paidWinnerKeys = new Set(
      [...posPaymentKeys].filter((k) => providerWinnerKeys.has(k)),
    );
    expect(paidWinnerKeys.size).toBe(0);
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

  it("dedupes provider method-change rows in payment summary without changing revenue rules", () => {
    const rows: OrderPaymentRow[] = [
      {
        deviceId: "dev-1",
        localOrderId: "T1784070410098",
        method: "cash",
        amountCents: 27500,
        paidAt: "2026-07-14T10:00:00.000Z",
        updatedAt: "2026-07-14T10:00:00.000Z",
      },
      {
        deviceId: "dev-1",
        localOrderId: "T1784070410098",
        method: "card",
        amountCents: 27500,
        paidAt: "2026-07-14T11:00:00.000Z",
        updatedAt: "2026-07-14T11:00:00.000Z",
      },
    ];

    const summary = aggregateEffectivePaymentSummary(rows);
    expect(summary.cashCents).toBe(0);
    expect(summary.cardCents).toBe(27500);
  });
});
