import { describe, expect, it } from "vitest";
import { beginReportsFetchState } from "./usePortalReportsData";
import type { ReportsData } from "./types";

const previousSummary = {
  timezone: "Europe/Berlin",
  period: "today" as const,
  hasSalesData: true,
  overview: {
    revenueMinor: 9000,
    ordersCount: 3,
    receiptsCount: 3,
    refundsCount: 0,
    averageOrderMinor: 3000,
    vatMinor: 0,
    currency: "EUR",
  },
  posRevenueCents: 9000,
  onlineRevenueCents: 0,
  liveOrdersCount: 3,
  onlineOrdersCount: 0,
  revenueSeries: [
    {
      label: "10:00",
      bucketStart: "1970-01-01T10:00:00.000Z",
      revenueMinor: 9000,
      ordersCount: 3,
    },
  ],
  salesByHour: [{ hour: 10, revenueMinor: 9000, ordersCount: 3 }],
  paymentMethods: {
    cashMinor: 9000,
    cardMinor: 0,
    voucherMinor: 0,
    otherMinor: 0,
    currency: "EUR",
  },
  onlinePaymentSummary: {
    cashPaidCents: 0,
    cardPaidCents: 0,
    onlinePaidCents: 0,
    pendingCents: 0,
    currency: "EUR",
  },
  topProducts: [{ productName: "Espresso", quantity: 3, revenueMinor: 9000, category: null }],
  topEmployees: [] as [],
  taxes: {
    netRevenueMinor: 9000,
    vatMinor: 0,
    grossRevenueMinor: 9000,
    fiscalReceiptsCount: 3,
    currency: "EUR",
  },
  businessTrends: {
    bestSalesDay: "today",
    bestSalesHour: "10:00",
    largestReceiptMinor: 3000,
    mostUsedPayment: "cash",
    mostSoldProduct: "Espresso",
    currency: "EUR",
  },
};

describe("beginReportsFetchState", () => {
  it("clears previous report data when a new period starts loading", () => {
    const prev: ReportsData = {
      devices: [],
      reportsSummary: previousSummary,
      customer: {
        id: "c1",
        orgId: "o1",
        name: "Alex",
        email: "alex@test.com",
        portalStatus: "active",
      },
      period: "today",
      applied: { period: "today" },
      incompatibleApi: false,
      loading: false,
      error: false,
      lastSyncedAt: new Date("2026-11-15T10:00:00.000Z"),
    };

    const next = beginReportsFetchState(prev, {
      period: "custom",
      from: "2026-11-01",
      to: "2026-11-15",
    });

    expect(next.loading).toBe(true);
    expect(next.reportsSummary).toBeNull();
    expect(next.applied).toEqual({
      period: "custom",
      from: "2026-11-01",
      to: "2026-11-15",
    });
    expect(next.lastSyncedAt).toEqual(prev.lastSyncedAt);
  });
});
