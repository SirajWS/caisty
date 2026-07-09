import { describe, expect, it } from "vitest";

import { buildPortalReportsResponse, fillSalesByHour24 } from "../portalReports.js";
import {
  parsePortalReportsPeriod,
  revenueSeriesGranularity,
} from "../portalReportsPeriod.js";

describe("parsePortalReportsPeriod", () => {
  it("accepts supported period values", () => {
    expect(parsePortalReportsPeriod("today")).toBe("today");
    expect(parsePortalReportsPeriod("7_days")).toBe("7_days");
    expect(parsePortalReportsPeriod("all_time")).toBe("all_time");
  });

  it("falls back to today for unknown values", () => {
    expect(parsePortalReportsPeriod("invalid")).toBe("today");
    expect(parsePortalReportsPeriod(undefined)).toBe("today");
  });
});

describe("revenueSeriesGranularity", () => {
  it("uses hourly buckets for today and yesterday", () => {
    expect(revenueSeriesGranularity("today")).toBe("hour");
    expect(revenueSeriesGranularity("yesterday")).toBe("hour");
  });

  it("uses daily buckets for short rolling windows", () => {
    expect(revenueSeriesGranularity("7_days")).toBe("day");
    expect(revenueSeriesGranularity("30_days")).toBe("day");
    expect(revenueSeriesGranularity("this_week")).toBe("day");
    expect(revenueSeriesGranularity("this_month")).toBe("day");
  });

  it("uses monthly buckets for long windows", () => {
    expect(revenueSeriesGranularity("12_months")).toBe("month");
    expect(revenueSeriesGranularity("this_year")).toBe("month");
    expect(revenueSeriesGranularity("all_time")).toBe("month");
  });
});

describe("fillSalesByHour24", () => {
  it("returns all 24 hours with zero-filled gaps", () => {
    const filled = fillSalesByHour24([
      { hour: 10, revenueMinor: 6000, ordersCount: 1 },
    ]);

    expect(filled).toHaveLength(24);
    expect(filled[0]).toEqual({ hour: 0, revenueMinor: 0, ordersCount: 0 });
    expect(filled[10]).toEqual({
      hour: 10,
      revenueMinor: 6000,
      ordersCount: 1,
    });
    expect(filled[23]).toEqual({ hour: 23, revenueMinor: 0, ordersCount: 0 });
  });
});

describe("buildPortalReportsResponse", () => {
  const baseOverview = {
    revenueMinor: 6000,
    ordersCount: 1,
    receiptsCount: 1,
    refundsCount: 0,
    averageOrderMinor: 6000,
    vatMinor: 500,
    currency: "TND",
  };

  const basePayload = {
    period: "today" as const,
    overview: baseOverview,
    revenueSeries: [
      {
        label: "10:00",
        bucketStart: "1970-01-01T10:00:00.000Z",
        revenueMinor: 6000,
        ordersCount: 1,
      },
    ],
    salesByHour: [{ hour: 10, revenueMinor: 6000, ordersCount: 1 }],
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
  };

  it("marks hasSalesData when orders or receipts exist", () => {
    const response = buildPortalReportsResponse(basePayload);
    expect(response.hasSalesData).toBe(true);
    expect(response.overview.revenueMinor).toBe(6000);
    expect(response.paymentMethods.cashMinor).toBe(6000);
    expect(response.topProducts[0]?.productName).toBe("Coffee");
    expect(response.timezone).toBe("Europe/Berlin");
  });

  it("returns empty-friendly summary when no sales exist", () => {
    const response = buildPortalReportsResponse({
      ...basePayload,
      overview: {
        ...baseOverview,
        revenueMinor: 0,
        ordersCount: 0,
        receiptsCount: 0,
        averageOrderMinor: 0,
        vatMinor: 0,
      },
      revenueSeries: [],
      salesByHour: [],
      topProducts: [],
      paymentMethods: {
        cashMinor: 0,
        cardMinor: 0,
        voucherMinor: 0,
        otherMinor: 0,
        currency: "EUR",
      },
      businessTrends: {
        bestSalesDay: null,
        bestSalesHour: null,
        largestReceiptMinor: 0,
        mostUsedPayment: null,
        mostSoldProduct: null,
        currency: "EUR",
      },
    });

    expect(response.hasSalesData).toBe(false);
    expect(response.topEmployees).toEqual([]);
  });
});
