import { describe, expect, it } from "vitest";

import { buildOrdersDocumentLabels, buildReportsDocumentLabels } from "./documentLabels";
import { buildOrdersPdfModel } from "./buildOrdersPdfModel";
import { buildReportsPdfModel } from "./buildReportsPdfModel";
import {
  buildOrdersPdfFilename,
  buildReceiptPdfFilename,
  buildReportsPdfFilename,
} from "./index";
import { sanitizeFilenamePart } from "./formatters";
import type { OrdersDocumentInput } from "./types";
import type { PortalOrdersResponse } from "../portalApi";
import { getPortalTranslations } from "../translations";

function sampleSales(): PortalOrdersResponse {
  return {
    timezone: "Europe/Berlin",
    period: "today",
    summary: {
      allOrdersCount: 3,
      liveOrdersCount: 2,
      onlineOrdersCount: 1,
      receiptsCount: 2,
      refundsCount: 0,
      hasOpenShift: true,
      ordersCount: 3,
      revenueCents: 4500,
      posRevenueCents: 3000,
      onlineRevenueCents: 1500,
      averageOrderMinor: 1500,
      openShift: {
        shiftId: "s1",
        status: "open",
        cashier: "Anna",
        deviceName: "POS-1",
        businessDate: "2026-07-16",
        startedAt: "2026-07-16T08:00:00.000Z",
        durationMinutes: 120,
        openingFloatMinor: 0,
        currency: "EUR",
      },
      paymentSummary: {
        cashCents: 1000,
        cardCents: 2000,
        voucherCents: 0,
        otherCents: 0,
        currency: "EUR",
      },
      onlinePaymentSummary: {
        cashPaidCents: 500,
        cardPaidCents: 400,
        onlinePaidCents: 600,
        pendingCents: 250,
        currency: "EUR",
      },
    },
    orders: [
      {
        id: "pos-1",
        localOrderId: "T100",
        deviceId: "d1",
        soldAt: "2026-07-16T10:00:00.000Z",
        businessDate: "2026-07-16",
        rawStatus: "completed",
        normalizedStatus: "completed",
        statusLabel: "Completed",
        status: "completed",
        paymentMethod: "cash",
        paymentStatus: "paid",
        paymentDisplay: "Cash · Paid",
        amountCents: 1000,
        currency: "EUR",
        cashier: "Anna",
        deviceName: "POS-1",
        receiptId: "r1",
        receiptNumber: "R-001",
        receiptStatus: "active",
        refundedAmountCents: 0,
        hasPaymentChange: false,
        lines: [],
        timeline: [],
        orderSource: "pos",
        isProviderOrder: false,
        platform: null,
        providerName: null,
        providerOrderId: null,
        customerName: null,
        customerPhone: null,
        customerEmail: null,
        deliveryAddress: null,
        customerNote: null,
        detailsSummary: null,
      },
      {
        id: "pos-2",
        localOrderId: "T101",
        deviceId: "d1",
        soldAt: "2026-07-16T11:00:00.000Z",
        businessDate: "2026-07-16",
        rawStatus: "cancelled",
        normalizedStatus: "cancelled",
        statusLabel: "Cancelled",
        status: "cancelled",
        paymentMethod: "card",
        paymentStatus: "cancelled",
        paymentDisplay: "Cancelled",
        amountCents: 2000,
        currency: "EUR",
        cashier: "Anna",
        deviceName: "POS-1",
        receiptId: null,
        receiptNumber: null,
        receiptStatus: null,
        refundedAmountCents: 0,
        hasPaymentChange: false,
        lines: [],
        timeline: [],
        orderSource: "pos",
        isProviderOrder: false,
        platform: null,
        providerName: null,
        providerOrderId: null,
        customerName: null,
        customerPhone: null,
        customerEmail: null,
        deliveryAddress: null,
        customerNote: null,
        detailsSummary: null,
      },
    ],
    providerOrders: [
      {
        id: "on-1",
        localOrderId: "W-55",
        deviceId: "online",
        soldAt: "2026-07-16T12:00:00.000Z",
        businessDate: "2026-07-16",
        rawStatus: "accepted",
        normalizedStatus: "accepted",
        statusLabel: "Accepted",
        status: "accepted",
        paymentMethod: "online",
        paymentStatus: "paid",
        paymentDisplay: "Paid Online",
        amountCents: 1500,
        currency: "EUR",
        cashier: null,
        deviceName: "",
        receiptId: null,
        receiptNumber: null,
        receiptStatus: null,
        refundedAmountCents: 0,
        hasPaymentChange: false,
        lines: [],
        timeline: [],
        orderSource: "provider",
        isProviderOrder: true,
        platform: "Web",
        providerName: "Lieferando",
        providerOrderId: "LF-1",
        customerName: "Max",
        customerPhone: null,
        customerEmail: null,
        deliveryAddress: null,
        customerNote: null,
        detailsSummary: "Burger",
      },
    ],
    receipts: [
      {
        id: "r1",
        localReceiptId: "lr1",
        receiptNumber: "R-001",
        issuedAt: "2026-07-16T10:01:00.000Z",
        customer: null,
        paymentMethod: "cash",
        status: "active",
        fiscalStatus: "signed",
        amountCents: 1000,
        currency: "EUR",
        items: [],
      },
    ],
    recentOrders: [],
  };
}

function buildInput(
  sales: PortalOrdersResponse = sampleSales(),
): OrdersDocumentInput {
  const t = getPortalTranslations("en");
  return {
    meta: {
      businessName: "Demo GmbH",
      storeName: "Main",
      label: "Today",
      generatedAt: new Date("2026-07-16T14:00:00.000Z"),
      timezone: "Europe/Berlin",
      currency: "EUR",
      locale: "en-US",
    },
    labels: buildOrdersDocumentLabels(t),
    sales,
  };
}

describe("document export filenames", () => {
  it("sanitizes unsafe filename parts", () => {
    expect(sanitizeFilenamePart("This week")).toBe("this-week");
    expect(sanitizeFilenamePart("7 days / test")).toBe("7-days-test");
  });

  it("builds stable report and order filenames", () => {
    const generatedAt = new Date("2026-07-08T12:00:00.000Z");

    expect(buildReportsPdfFilename("Today", generatedAt)).toBe(
      "caisty-reports-today-2026-07-08.pdf",
    );
    expect(buildOrdersPdfFilename(generatedAt, "Today")).toBe(
      "caisty-orders-today-2026-07-08.pdf",
    );
    expect(buildReceiptPdfFilename("R-001", generatedAt)).toBe(
      "caisty-receipt-r-001-2026-07-08.pdf",
    );
  });
});

describe("buildOrdersPdfModel", () => {
  it("passes POS and Online KPIs plus revenue from portal summary", () => {
    const model = buildOrdersPdfModel(buildInput());

    expect(model.orderSummary).toEqual(
      expect.arrayContaining([
        ["All orders", "3"],
        ["POS orders", "2"],
        ["Online orders", "1"],
        ["Receipts", "2"],
        ["Refunds", "0"],
      ]),
    );
    expect(model.orderSummary.some(([label]) => label === "Open shift")).toBe(
      true,
    );

    const revenueMap = Object.fromEntries(model.revenueSummary);
    expect(revenueMap["POS revenue"]).toMatch(/30[,.]00/);
    expect(revenueMap["Online revenue"]).toMatch(/15[,.]00/);
    expect(revenueMap["Total revenue"]).toMatch(/45[,.]00/);
  });

  it("renders POS payment summary once with Total and no duplicate totals section fields", () => {
    const model = buildOrdersPdfModel(buildInput());
    const labels = model.posPaymentSummary.map(([label]) => label);

    expect(labels).toEqual([
      "Cash",
      "Card",
      "Voucher",
      "Other",
      "Total",
    ]);
    expect(labels.filter((l) => l === "Cash")).toHaveLength(1);

    const posMap = Object.fromEntries(model.posPaymentSummary);
    expect(posMap.Total).toMatch(/30[,.]00/);
  });

  it("includes Online Payment Summary with Pending separate from Paid Total", () => {
    const model = buildOrdersPdfModel(buildInput());
    const onlineMap = Object.fromEntries(model.onlinePaymentSummary);

    expect(onlineMap["Online revenue"]).toMatch(/15[,.]00/);
    expect(onlineMap["Cash paid"]).toMatch(/5[,.]00/);
    expect(onlineMap["Card paid"]).toMatch(/4[,.]00/);
    expect(onlineMap["Paid online"]).toMatch(/6[,.]00/);
    expect(onlineMap.Pending).toMatch(/2[,.]50/);
    // Paid Total = 500+400+600 = 1500 — pending excluded
    expect(onlineMap["Paid total"]).toMatch(/15[,.]00/);
    expect(model.onlineRevenueHint).toBe("Completed online sales only");
  });

  it("exports POS and Online orders as separate tables with portal status/payment text", () => {
    const model = buildOrdersPdfModel(buildInput());

    expect(model.posOrders.title).toBe("POS orders");
    expect(model.onlineOrders.title).toBe("Online orders");
    expect(model.posOrders.body).toHaveLength(2);
    expect(model.onlineOrders.body).toHaveLength(1);

    const cancelled = model.posOrders.body.find((row) => row[1] === "T101");
    expect(cancelled?.[2]).toBe("Cancelled");

    const paidCash = model.posOrders.body.find((row) => row[1] === "T100");
    expect(paidCash?.[3]).toBe("Cash · Paid");

    const online = model.onlineOrders.body[0];
    expect(online?.[2]).toBe("Lieferando");
    expect(online?.[3]).toBe("Max");
    expect(online?.[4]).toBe("Accepted");
    expect(online?.[5]).toBe("Paid Online");
  });

  it("uses full API order lists, not a five-row portal page slice", () => {
    const manyPos = Array.from({ length: 12 }, (_, i) => ({
      ...sampleSales().orders[0]!,
      id: `pos-${i}`,
      localOrderId: `T${200 + i}`,
    }));
    const sales = {
      ...sampleSales(),
      orders: manyPos,
      summary: {
        ...sampleSales().summary,
        liveOrdersCount: 12,
        allOrdersCount: 13,
      },
    };
    const model = buildOrdersPdfModel(buildInput(sales));

    expect(model.exportsFullOrderLists).toBe(true);
    expect(model.posOrders.body).toHaveLength(12);
  });

  it("keeps Card · Paid display from API paymentDisplay", () => {
    const sales = sampleSales();
    sales.orders[0] = {
      ...sales.orders[0]!,
      paymentMethod: "card",
      paymentDisplay: "Card · Paid",
    };
    const model = buildOrdersPdfModel(buildInput(sales));
    expect(model.posOrders.body[0]?.[3]).toBe("Card · Paid");
  });
});

describe("buildOrderDetailPdfModel", () => {
  it("prints POS and online orders with portal status/payment text", async () => {
    const { buildOrderDetailPdfModel } = await import("./buildOrderDetailPdfModel");
    const { buildOrderDetailDocumentLabels } = await import("./documentLabels");
    const t = getPortalTranslations("en");
    const labels = buildOrderDetailDocumentLabels(t);
    const base = sampleSales().orders[0]!;
    const online = sampleSales().providerOrders[0]!;

    const posModel = buildOrderDetailPdfModel({
      meta: buildInput().meta,
      labels,
      order: {
        ...base,
        payments: [{ method: "cash", amountCents: 1000, currency: "EUR", paidAt: null }],
        receipt: null,
        receiptTimeline: [],
        discountCents: 0,
        taxCents: 190,
        netCents: 810,
        queueNumber: null,
        tableName: null,
        notes: null,
      },
    });
    expect(posModel.status).toBe("Completed");
    expect(posModel.payment).toBe("Cash · Paid");
    expect(posModel.products.body.length).toBe(0);

    const cancelled = buildOrderDetailPdfModel({
      meta: buildInput().meta,
      labels,
      order: {
        ...sampleSales().orders[1]!,
        payments: [],
        receipt: null,
        receiptTimeline: [],
        discountCents: 0,
        taxCents: 0,
        netCents: 2000,
        queueNumber: null,
        tableName: null,
        notes: null,
      },
    });
    expect(cancelled.status).toBe("Cancelled");

    const onlineModel = buildOrderDetailPdfModel({
      meta: buildInput().meta,
      labels,
      order: {
        ...online,
        payments: [],
        receipt: null,
        receiptTimeline: [],
        discountCents: 0,
        taxCents: 0,
        netCents: 1500,
        queueNumber: null,
        tableName: null,
        notes: null,
      },
    });
    expect(onlineModel.payment).toBe("Paid Online");
    expect(onlineModel.customer.some(([k, v]) => k === "Provider" && v === "Lieferando")).toBe(
      true,
    );
  });
});

describe("buildReceiptDetailPdfModel", () => {
  it("includes items, totals, fiscal pending and print stats", async () => {
    const { buildReceiptDetailPdfModel } = await import(
      "./buildReceiptDetailPdfModel"
    );
    const { buildReceiptDetailDocumentLabels } = await import("./documentLabels");
    const t = getPortalTranslations("en");
    const model = buildReceiptDetailPdfModel({
      meta: buildInput().meta,
      labels: buildReceiptDetailDocumentLabels(t),
      detail: {
        receipt: {
          id: "r1",
          localReceiptId: "lr1",
          receiptNumber: "R-100",
          issuedAt: "2026-07-16T10:00:00.000Z",
          customer: null,
          paymentMethod: "card",
          status: "active",
          fiscalStatus: "pending",
          amountCents: 2500,
          currency: "EUR",
          items: [
            {
              productName: "Pizza",
              sku: "P1",
              quantity: 1,
              unitPriceCents: 2500,
              lineTotalCents: 2500,
            },
          ],
          deviceName: "POS-1",
          localOrderId: "T100",
          netCents: 2100,
          taxCents: 400,
          grossCents: 2500,
        },
        events: [],
        timeline: [
          {
            id: "e1",
            kind: "created",
            label: "Created",
            occurredAt: "2026-07-16T10:00:00.000Z",
            actor: null,
            summary: null,
          },
        ],
        refundSummary: {
          originalAmountCents: 2500,
          refundedAmountCents: 0,
          refundableAmountCents: 2500,
          currency: "EUR",
        },
        hasPaymentChange: false,
        printStats: {
          hasOriginalPrint: true,
          reprintCount: 2,
          lastPrintAt: "2026-07-16T11:00:00.000Z",
        },
      },
    });

    expect(model.showFiscalPending).toBe(true);
    expect(model.products.body[0]?.[0]).toBe("Pizza");
    expect(model.printStats.find(([k]) => k === "Reprints")?.[1]).toBe("2");
    expect(model.activity).toHaveLength(1);
  });
});

describe("buildReceiptsListPdfModel", () => {
  it("exports summary KPIs, payment summary, and full receipt list", async () => {
    const { buildReceiptsListPdfModel } = await import(
      "./buildReceiptsListPdfModel"
    );
    const { buildReceiptsListDocumentLabels } = await import("./documentLabels");
    const t = getPortalTranslations("en");
    const many = Array.from({ length: 8 }, (_, i) => ({
      id: `r-${i}`,
      localReceiptId: `lr-${i}`,
      receiptNumber: `R-${i}`,
      issuedAt: "2026-07-16T10:00:00.000Z",
      customer: null,
      paymentMethod: "cash",
      status: "active" as const,
      fiscalStatus: "signed",
      amountCents: 1000,
      currency: "EUR",
      items: [],
      deviceName: "POS-1",
      printCount: 1,
      reprintCount: 0,
      lastEventType: "printed",
      lastEventAt: "2026-07-16T10:01:00.000Z",
      cashier: "Anna",
    }));

    const model = buildReceiptsListPdfModel({
      meta: buildInput().meta,
      labels: buildReceiptsListDocumentLabels(t),
      page: {
        timezone: "Europe/Berlin",
        period: "today",
        summary: {
          receiptsCount: 8,
          activeCount: 8,
          printedCount: 8,
          reprintedCount: 0,
          refundsCount: 0,
          posRevenueCents: 8000,
          paymentSummary: {
            cashCents: 8000,
            cardCents: 0,
            voucherCents: 0,
            otherCents: 0,
            currency: "EUR",
          },
        },
        receipts: many,
        pagination: {
          total: 8,
          limit: 5,
          offset: 0,
          page: 1,
          totalPages: 2,
        },
      },
    });

    expect(model.exportsFullList).toBe(true);
    expect(model.table.body).toHaveLength(8);
    expect(model.summary.some(([k]) => k === "POS revenue")).toBe(true);
    expect(model.payments.map(([k]) => k)).toEqual([
      "Cash",
      "Card",
      "Voucher",
      "Other",
      "Total",
    ]);
  });
});

describe("buildReportsPdfModel", () => {
  it("builds an executive model with revenue/order/payment splits", () => {
    const t = getPortalTranslations("en");
    const model = buildReportsPdfModel({
      meta: {
        businessName: "Demo GmbH",
        storeName: "Main",
        label: "Today",
        generatedAt: new Date("2026-07-16T14:00:00.000Z"),
        timezone: "Europe/Berlin",
        currency: "EUR",
        locale: "en-US",
      },
      labels: buildReportsDocumentLabels(t),
      summary: {
        timezone: "Europe/Berlin",
        period: "today",
        hasSalesData: true,
        overview: {
          revenueMinor: 4500,
          ordersCount: 3,
          receiptsCount: 3,
          refundsCount: 0,
          averageOrderMinor: 1500,
          vatMinor: 500,
          currency: "EUR",
        },
        posRevenueCents: 3000,
        onlineRevenueCents: 1500,
        liveOrdersCount: 2,
        onlineOrdersCount: 1,
        revenueSeries: [
          {
            label: "10:00",
            bucketStart: "2026-07-16T08:00:00.000Z",
            revenueMinor: 4500,
            ordersCount: 3,
          },
        ],
        salesByHour: [{ hour: 10, revenueMinor: 4500, ordersCount: 3 }],
        paymentMethods: {
          cashMinor: 3000,
          cardMinor: 0,
          voucherMinor: 0,
          otherMinor: 0,
          currency: "EUR",
        },
        onlinePaymentSummary: {
          cashPaidCents: 500,
          cardPaidCents: 400,
          onlinePaidCents: 600,
          pendingCents: 100,
          currency: "EUR",
        },
        topProducts: [
          {
            productName: "Coffee",
            quantity: 3,
            revenueMinor: 4500,
            category: null,
          },
        ],
        topEmployees: [],
        taxes: {
          netRevenueMinor: 4000,
          vatMinor: 500,
          grossRevenueMinor: 4500,
          fiscalReceiptsCount: 3,
          currency: "EUR",
        },
        businessTrends: {
          bestSalesDay: "10:00",
          bestSalesHour: "10:00",
          largestReceiptMinor: 2000,
          mostUsedPayment: "cash",
          mostSoldProduct: "Coffee",
          currency: "EUR",
        },
      },
    });

    expect(model.revenueBreakdown.map(([k]) => k)).toEqual([
      "POS revenue",
      "Online revenue",
      "Total revenue",
    ]);
    expect(model.ordersBreakdown.map(([k]) => k)).toEqual([
      "All orders",
      "POS orders",
      "Online orders",
    ]);
    expect(model.onlinePaymentSummary.map(([k]) => k)).toEqual([
      "Cash paid",
      "Card paid",
      "Paid online",
      "Pending",
      "Paid total",
    ]);
    expect(model.showSalesByHour).toBe(false);
    expect(model.businessTrends.some(([k]) => k === "Best sales day")).toBe(
      false,
    );
    expect(model.topProducts.body[0]).toEqual([
      "1",
      "Coffee",
      "3",
      expect.stringMatching(/45[,.]00/),
      "100%",
    ]);
    expect(model.taxesScopeNote).toMatch(/POS/i);
  });
});
