import { describe, expect, it } from "vitest";
import { deriveReportsState } from "./deriveReportsState";
import { portalEn } from "../translations/portal/en";
import type { PortalReportsSummary } from "../portalApi";
import type { ReportsData } from "./types";

const baseCustomer = {
  id: "c1",
  orgId: "o1",
  name: "Alex",
  email: "alex@test.com",
  portalStatus: "active" as const,
};

function makeReportsSummary(
  overrides: Partial<PortalReportsSummary> = {},
): PortalReportsSummary {
  return {
    timezone: "Europe/Berlin",
    period: "today",
    hasSalesData: true,
    overview: {
      revenueMinor: 6000,
      ordersCount: 1,
      receiptsCount: 1,
      refundsCount: 0,
      averageOrderMinor: 6000,
      vatMinor: 500,
      currency: "TND",
    },
    revenueSeries: [
      {
        label: "10:00",
        bucketStart: "1970-01-01T10:00:00.000Z",
        revenueMinor: 6000,
        ordersCount: 1,
      },
    ],
    salesByHour: [
      { hour: 10, revenueMinor: 6000, ordersCount: 1 },
    ],
    paymentMethods: {
      cashMinor: 6000,
      cardMinor: 0,
      voucherMinor: 0,
      otherMinor: 0,
      currency: "TND",
    },
    topProducts: [
      {
        productName: "Coffee",
        quantity: 2,
        revenueMinor: 6000,
        category: null,
      },
    ],
    topEmployees: [],
    taxes: {
      netRevenueMinor: 5500,
      vatMinor: 500,
      grossRevenueMinor: 6000,
      fiscalReceiptsCount: 0,
      currency: "TND",
    },
    businessTrends: {
      bestSalesDay: "10:00",
      bestSalesHour: "10:00",
      largestReceiptMinor: 6000,
      mostUsedPayment: "cash",
      mostSoldProduct: "Coffee",
      currency: "TND",
    },
    ...overrides,
  };
}

function makeData(overrides: Partial<ReportsData> = {}): ReportsData {
  return {
    devices: [],
    reportsSummary: null,
    customer: baseCustomer,
    period: "today",
    loading: false,
    error: false,
    lastSyncedAt: new Date("2026-07-08T10:00:00Z"),
    ...overrides,
  };
}

describe("deriveReportsState", () => {
  it("keeps empty state when no sales data", () => {
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
      locale: "en-GB",
    });

    expect(state.topProducts).toEqual([]);
    expect(state.topEmployees).toEqual([]);
    expect(state.overview.every((k) => k.value === "—")).toBe(true);
    expect(state.revenueChart.hasData).toBe(false);
    expect(state.hourlySales.bars).toHaveLength(24);
    expect(state.hourlySales.bars.every((b) => b.value === null)).toBe(true);
    expect(state.hourlySales.bars[0]?.hour).toBe("00");
    expect(state.hourlySales.bars[23]?.hour).toBe("23");
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
      locale: "en-GB",
    });
    expect(synced.hasPosSync).toBe(true);

    const notSynced = deriveReportsState({
      data: makeData(),
      t: portalEn,
      locale: "en-GB",
    });
    expect(notSynced.hasPosSync).toBe(false);
  });

  it("fills KPIs, payments, products and chart when sales data exists", () => {
    const state = deriveReportsState({
      data: makeData({
        reportsSummary: makeReportsSummary(),
      }),
      t: portalEn,
      locale: "en-GB",
    });

    expect(state.revenueChart.hasData).toBe(true);
    expect(state.overview.find((k) => k.id === "orders")?.value).toBe("1");
    expect(state.topProducts).toHaveLength(1);
    expect(state.topProducts[0]?.name).toBe("Coffee");
    expect(state.paymentMethods.find((p) => p.id === "cash")?.tone).toBe("ok");
  });

  it("renders 24 hourly bars when sales data exists", () => {
    const state = deriveReportsState({
      data: makeData({
        reportsSummary: makeReportsSummary({
          salesByHour: [{ hour: 10, revenueMinor: 6000, ordersCount: 1 }],
        }),
      }),
      t: portalEn,
      locale: "en-GB",
    });

    expect(state.hourlySales.bars).toHaveLength(24);
    expect(state.hourlySales.bars[0]?.hour).toBe("00");
    expect(state.hourlySales.bars[10]?.value).toBe(6000);
    expect(state.hourlySales.bars[9]?.value).toBeNull();
    expect(state.hourlySales.bars[23]?.hour).toBe("23");
  });

  it("formats TND minor units correctly (6000 → 6.000, not 60.000)", () => {
    const state = deriveReportsState({
      data: makeData({
        reportsSummary: makeReportsSummary(),
      }),
      t: portalEn,
      locale: "en-GB",
    });

    const revenue = state.overview.find((k) => k.id === "revenue")?.value ?? "";
    const cash = state.paymentMethods.find((p) => p.id === "cash")?.value ?? "";
    const productRevenue = state.topProducts[0]?.revenue ?? "";
    const largestReceipt =
      state.trends.find((t) => t.id === "largest_receipt")?.value ?? "";

    expect(revenue).toContain("6.000");
    expect(revenue).not.toContain("60.000");
    expect(cash).toContain("6.000");
    expect(productRevenue).toContain("6.000");
    expect(largestReceipt).toContain("6.000");
  });

  it("formats EUR revenue with 2 decimals", () => {
    const state = deriveReportsState({
      data: makeData({
        reportsSummary: makeReportsSummary({
          overview: {
            revenueMinor: 600,
            ordersCount: 1,
            receiptsCount: 1,
            refundsCount: 0,
            averageOrderMinor: 600,
            vatMinor: 50,
            currency: "EUR",
          },
          paymentMethods: {
            cashMinor: 600,
            cardMinor: 0,
            voucherMinor: 0,
            otherMinor: 0,
            currency: "EUR",
          },
          businessTrends: {
            bestSalesDay: "2026-07-08",
            bestSalesHour: "10:00",
            largestReceiptMinor: 600,
            mostUsedPayment: "cash",
            mostSoldProduct: "Coffee",
            currency: "EUR",
          },
        }),
      }),
      t: portalEn,
      locale: "en-GB",
    });

    expect(state.overview.find((k) => k.id === "revenue")?.value).toContain(
      "6.00",
    );
  });
});
