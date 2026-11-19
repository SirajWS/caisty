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
        mixedCurrency: false,
        financialCurrency: "TND",
        includedTransactionCount: 10,
        excludedTransactionCount: 0,
        excludedCurrencies: [],
        hasCurrencyInconsistencies: false,
        lastSynchronizationAt: "2026-07-08T10:00:00.000Z",
        taxes: {
          netRevenueMinor: 437000,
          vatMinor: 83800,
          grossRevenueMinor: 520800,
          fiscalReceiptsCount: 0,
          currency: "TND",
        },
      },
      [],
      {
        cashCents: 0,
        cardCents: 572800,
        voucherCents: 0,
        otherCents: 0,
        currency: "TND",
      },
      {
        cashPaidCents: 0,
        cardPaidCents: 52800,
        onlinePaidCents: 0,
        pendingCents: 0,
        currency: "TND",
      },
    );

    expect(withSales.hasSalesData).toBe(true);
    expect(withSales.todayRevenueCents).toBe(572800);
    expect(withSales.posRevenueCents).toBe(520000);
    expect(withSales.onlineRevenueCents).toBe(52800);
    expect(withSales.onlinePaymentSummary.cardPaidCents).toBe(52800);
    expect(withSales.ordersToday).toBe(10);
    expect(withSales.liveOrdersCount).toBe(8);
    expect(withSales.onlineOrdersCount).toBe(2);
    expect(withSales.receiptsToday).toBe(10);
    expect(withSales.currency).toBe("TND");
    expect(withSales.taxes.grossRevenueMinor).toBe(520800);
    expect(withSales.taxes.fiscalReceiptsCount).toBe(0);
    expect(withSales.mixedCurrency).toBe(false);
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
        mixedCurrency: false,
        financialCurrency: "EUR",
        includedTransactionCount: 0,
        excludedTransactionCount: 0,
        excludedCurrencies: [],
        hasCurrencyInconsistencies: false,
        lastSynchronizationAt: null,
        taxes: {
          netRevenueMinor: 0,
          vatMinor: 0,
          grossRevenueMinor: 0,
          fiscalReceiptsCount: 0,
          currency: "EUR",
        },
      },
      [],
      {
        cashCents: 0,
        cardCents: 0,
        voucherCents: 0,
        otherCents: 0,
        currency: "EUR",
      },
      {
        cashPaidCents: 0,
        cardPaidCents: 0,
        onlinePaidCents: 0,
        pendingCents: 0,
        currency: "EUR",
      },
    );

    expect(empty.hasSalesData).toBe(false);
    expect(empty.period).toBe("today");
  });
});
