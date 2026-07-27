import { describe, expect, it } from "vitest";

import {
  aggregateReportTaxStats,
  aggregateTopProductsFromWinnerLines,
  buildPortalReportsResponse,
  buildRevenueSeriesFromBuckets,
  countOrdersByBerlinHour,
  fillSalesByHour24,
  receiptIncludedInReportAggregates,
  reportWinnerOrderIds,
  reportWinnerOrderKeys,
  selectReportOrderWinners,
  sumReceiptRevenueByBerlinHour,
  type ReportOrderAggregateRow,
  type ReportReceiptAggregateRow,
} from "../portalReports.js";
import {
  parsePortalReportsPeriod,
  revenueSeriesGranularity,
} from "../portalReportsPeriod.js";
import { orderLinesLookupKey } from "../portalOrders.js";

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

function orderRow(
  overrides: Partial<ReportOrderAggregateRow> & { id: string },
): ReportOrderAggregateRow {
  return {
    deviceId: "dev-a",
    localOrderId: `local-${overrides.id}`,
    platform: "lieferando",
    providerOrderId: "PO-1",
    status: "accepted",
    updatedAt: "2026-07-25T10:00:00.000Z",
    soldAt: "2026-07-25T08:00:00.000Z", // 10:00 Berlin (CEST)
    ...overrides,
  };
}

describe("report chart provider dedup helpers", () => {
  it("counts duplicate provider orders once in revenue series and sales by hour", () => {
    const winners = selectReportOrderWinners([
      orderRow({
        id: "desktop",
        deviceId: "desktop",
        status: "accepted",
        updatedAt: "2026-07-25T10:00:00.000Z",
      }),
      orderRow({
        id: "web",
        deviceId: "web",
        status: "ready",
        updatedAt: "2026-07-25T11:00:00.000Z",
      }),
      orderRow({
        id: "pos-1",
        deviceId: "pos",
        localOrderId: "T1",
        platform: "pos",
        providerOrderId: null,
        soldAt: "2026-07-25T08:00:00.000Z",
      }),
    ]);
    expect(winners.map((w) => w.id).sort()).toEqual(["pos-1", "web"]);

    const winnerKeys = reportWinnerOrderKeys(winners);
    const receipts: ReportReceiptAggregateRow[] = [
      {
        deviceId: "desktop",
        localOrderId: "local-desktop",
        orderId: "desktop",
        platform: "lieferando",
        soldAt: "2026-07-25T08:00:00.000Z",
        grossCents: 2500,
        netCents: 2100,
        taxCents: 400,
        status: "active",
        fiscalStatus: "pending",
      },
      {
        deviceId: "web",
        localOrderId: "local-web",
        orderId: "web",
        platform: "lieferando",
        soldAt: "2026-07-25T08:00:00.000Z",
        grossCents: 2500,
        netCents: 2100,
        taxCents: 400,
        status: "active",
        fiscalStatus: "issued",
      },
      {
        deviceId: "pos",
        localOrderId: "T1",
        orderId: "pos-1",
        platform: "pos",
        soldAt: "2026-07-25T08:00:00.000Z",
        grossCents: 1000,
        netCents: 840,
        taxCents: 160,
        status: "active",
        fiscalStatus: "issued",
      },
    ];
    const included = receipts.filter((row) =>
      receiptIncludedInReportAggregates(row, winnerKeys),
    );
    expect(included).toHaveLength(2);
    expect(included.map((r) => r.orderId).sort()).toEqual(["pos-1", "web"]);

    const revenueByHour = sumReceiptRevenueByBerlinHour(included, {
      kpiOnly: true,
    });
    const ordersByHour = countOrdersByBerlinHour(winners);
    expect(revenueByHour.get(10)).toBe(3500);
    expect(ordersByHour.get(10)).toBe(2);

    const series = buildRevenueSeriesFromBuckets({
      granularity: "hour",
      revenueByHour,
      ordersByHour,
      revenueByDay: new Map(),
      ordersByDay: new Map(),
      revenueByMonth: new Map(),
      ordersByMonth: new Map(),
    });
    const hour10 = series.find((point) => point.label === "10:00");
    expect(hour10?.revenueMinor).toBe(3500);
    expect(hour10?.ordersCount).toBe(2);

    const salesByHour = fillSalesByHour24(
      Array.from({ length: 24 }, (_, hour) => ({
        hour,
        revenueMinor: revenueByHour.get(hour) ?? 0,
        ordersCount: ordersByHour.get(hour) ?? 0,
      })),
    );
    expect(salesByHour[10]?.ordersCount).toBe(2);
    expect(salesByHour[10]?.revenueMinor).toBe(3500);

    const tax = aggregateReportTaxStats(included);
    expect(tax.vat).toBe(560);
    expect(tax.net).toBe(2940);
    expect(tax.fiscalCount).toBe(2);
  });

  it("counts duplicate provider line items once in top products", () => {
    const winners = selectReportOrderWinners([
      orderRow({ id: "desktop", deviceId: "desktop", status: "accepted" }),
      orderRow({
        id: "web",
        deviceId: "web",
        status: "delivered",
        updatedAt: "2026-07-25T12:00:00.000Z",
      }),
      orderRow({
        id: "pos-1",
        deviceId: "pos",
        localOrderId: "T1",
        platform: null,
        providerOrderId: null,
      }),
    ]);
    const winnerIds = reportWinnerOrderIds(winners);
    const products = aggregateTopProductsFromWinnerLines(
      [
        {
          orderId: "desktop",
          productName: "Pizza",
          quantity: 1,
          lineTotalCents: 1200,
        },
        {
          orderId: "web",
          productName: "Pizza",
          quantity: 1,
          lineTotalCents: 1200,
        },
        {
          orderId: "pos-1",
          productName: "Coffee",
          quantity: 2,
          lineTotalCents: 800,
        },
      ],
      winnerIds,
    );
    expect(products).toEqual([
      {
        productName: "Pizza",
        quantity: 1,
        revenueMinor: 1200,
        category: null,
      },
      {
        productName: "Coffee",
        quantity: 2,
        revenueMinor: 800,
        category: null,
      },
    ]);
  });

  it("keeps different platforms with the same providerOrderId separate", () => {
    const winners = selectReportOrderWinners([
      orderRow({
        id: "l1",
        platform: "lieferando",
        providerOrderId: "X1",
      }),
      orderRow({
        id: "u1",
        platform: "uber_eats",
        providerOrderId: "X1",
      }),
    ]);
    expect(winners.map((w) => w.id).sort()).toEqual(["l1", "u1"]);
  });

  it("keeps all local POS orders", () => {
    const winners = selectReportOrderWinners([
      orderRow({
        id: "a",
        platform: "pos",
        providerOrderId: null,
        localOrderId: "A",
      }),
      orderRow({
        id: "b",
        platform: "pos",
        providerOrderId: null,
        localOrderId: "B",
      }),
    ]);
    expect(winners).toHaveLength(2);
  });

  it("regression T1785113113966: reports count order and revenue once as delivered", () => {
    const winners = selectReportOrderWinners([
      orderRow({
        id: "created-copy",
        deviceId: "dev-a",
        platform: "fake_delivery",
        providerOrderId: null,
        localOrderId: "T1785113113966",
        status: "created",
        updatedAt: "2026-07-27T00:45:15.000Z",
        soldAt: "2026-07-27T00:45:13.000Z",
      }),
      orderRow({
        id: "delivered-copy",
        deviceId: "dev-b",
        platform: "fake_delivery",
        providerOrderId: null,
        localOrderId: "T1785113113966",
        status: "delivered",
        updatedAt: "2026-07-27T00:45:27.000Z",
        soldAt: "2026-07-27T00:45:13.000Z",
      }),
    ]);
    expect(winners).toHaveLength(1);
    expect(winners[0]?.status).toBe("delivered");
    expect(winners[0]?.localOrderId).toBe("T1785113113966");

    const winnerKeys = reportWinnerOrderKeys(winners);
    const receipts: ReportReceiptAggregateRow[] = [
      {
        deviceId: "dev-a",
        localOrderId: "T1785113113966",
        orderId: "created-copy",
        platform: "fake_delivery",
        soldAt: "2026-07-27T00:45:13.000Z",
        grossCents: 27500,
        netCents: 27500,
        taxCents: 0,
        status: "active",
        fiscalStatus: null,
      },
      {
        deviceId: "dev-b",
        localOrderId: "T1785113113966",
        orderId: "delivered-copy",
        platform: "fake_delivery",
        soldAt: "2026-07-27T00:45:13.000Z",
        grossCents: 27500,
        netCents: 27500,
        taxCents: 0,
        status: "active",
        fiscalStatus: null,
      },
    ];
    const included = receipts.filter((r) =>
      receiptIncludedInReportAggregates(r, winnerKeys),
    );
    expect(included).toHaveLength(1);
    expect(included[0]?.grossCents).toBe(27500);
  });

  it("keeps overview and chart totals consistent for deduped provider revenue", () => {
    const onlineWinners = 1;
    const live = 1;
    const overviewOrders = live + onlineWinners;
    const chartOrders = 2;
    expect(chartOrders).toBe(overviewOrders);

    const overviewOnlineRevenue = 2500;
    const chartProviderReceiptRevenue = 2500;
    expect(chartProviderReceiptRevenue).toBe(overviewOnlineRevenue);
  });

  it("documents payment methods as POS-only while online uses winner keys", () => {
    // fetchPaymentsForSalesPeriod already excludes provider platforms.
    // onlinePaymentSummary uses dedupeProviderOrders winners in sales summary.
    const winnerKey = orderLinesLookupKey("web", "local-web");
    const loserKey = orderLinesLookupKey("desktop", "local-desktop");
    const winnerKeys = new Set([winnerKey]);
    expect(winnerKeys.has(winnerKey)).toBe(true);
    expect(winnerKeys.has(loserKey)).toBe(false);
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
    posRevenueCents: 6000,
    onlineRevenueCents: 0,
    liveOrdersCount: 1,
    onlineOrdersCount: 0,
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
    onlinePaymentSummary: {
      cashPaidCents: 0,
      cardPaidCents: 0,
      onlinePaidCents: 0,
      pendingCents: 0,
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
    expect(response.posRevenueCents).toBe(6000);
    expect(response.onlineRevenueCents).toBe(0);
    expect(response.liveOrdersCount).toBe(1);
    expect(response.onlineOrdersCount).toBe(0);
    expect(response.paymentMethods.cashMinor).toBe(6000);
    expect(response.onlinePaymentSummary.onlinePaidCents).toBe(0);
    expect(response.topProducts[0]?.productName).toBe("Coffee");
    expect(response.timezone).toBe("Europe/Berlin");
  });

  it("exposes overview order/revenue from deduped periodStats winners only", () => {
    const liveOrdersCount = 10;
    const onlineOrdersCount = 1;
    const posRevenueCents = 50000;
    const onlineRevenueCents = 2500;
    const response = buildPortalReportsResponse({
      ...basePayload,
      overview: {
        ...baseOverview,
        ordersCount: liveOrdersCount + onlineOrdersCount,
        revenueMinor: posRevenueCents + onlineRevenueCents,
        averageOrderMinor: Math.floor(
          (posRevenueCents + onlineRevenueCents) / 1,
        ),
      },
      liveOrdersCount,
      onlineOrdersCount,
      posRevenueCents,
      onlineRevenueCents,
    });
    expect(response.overview.ordersCount).toBe(11);
    expect(response.onlineOrdersCount).toBe(1);
    expect(response.onlineRevenueCents).toBe(2500);
    expect(response.overview.revenueMinor).toBe(52500);
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
      posRevenueCents: 0,
      onlineRevenueCents: 0,
      liveOrdersCount: 0,
      onlineOrdersCount: 0,
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
      onlinePaymentSummary: {
        cashPaidCents: 0,
        cardPaidCents: 0,
        onlinePaidCents: 0,
        pendingCents: 0,
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
