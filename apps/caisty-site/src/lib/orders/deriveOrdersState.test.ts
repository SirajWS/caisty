import { describe, expect, it } from "vitest";
import { deriveOrdersState } from "./deriveOrdersState";
import { portalEn } from "../translations/portal/en";
import type { OrdersData } from "./types";
import type { PortalOrderRecord, PortalOrdersResponse } from "../portalApi";

const baseCustomer = {
  id: "c1",
  orgId: "o1",
  name: "Alex",
  email: "alex@test.com",
  portalStatus: "active" as const,
};

function defaultOrderFields(): Omit<
  PortalOrderRecord,
  "id" | "localOrderId"
> {
  return {
    deviceId: "dev-1",
    soldAt: "2026-07-08T08:15:00.000Z",
    businessDate: "2026-07-08",
    rawStatus: "closed",
    normalizedStatus: "completed",
    status: "completed",
    statusLabel: "Completed",
    paymentMethod: "cash",
    paymentStatus: "pending",
    paymentDisplay: "Cash · Pending",
    amountCents: 500,
    currency: "EUR",
    cashier: null,
    deviceName: "Kasse 1",
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
  };
}

function makeOrder(
  overrides: Partial<PortalOrderRecord> &
    Pick<PortalOrderRecord, "id" | "localOrderId">,
): PortalOrderRecord {
  return {
    ...defaultOrderFields(),
    ...overrides,
  };
}

function makeSummary(
  overrides: Partial<PortalOrdersResponse["summary"]> = {},
): PortalOrdersResponse["summary"] {
  const allOrdersCount = overrides.allOrdersCount ?? overrides.ordersCount ?? 0;
  const liveOrdersCount = overrides.liveOrdersCount ?? allOrdersCount;
  const onlineOrdersCount =
    overrides.onlineOrdersCount ?? Math.max(0, allOrdersCount - liveOrdersCount);

  return {
    allOrdersCount,
    liveOrdersCount,
    onlineOrdersCount,
    receiptsCount: 0,
    refundsCount: 0,
    hasOpenShift: false,
    ordersCount: allOrdersCount,
    revenueCents: 0,
    posRevenueCents: 0,
    onlineRevenueCents: 0,
    averageOrderMinor: 0,
    openShift: null,
    paymentSummary: {
      cashCents: 0,
      cardCents: 0,
      voucherCents: 0,
      otherCents: 0,
      currency: "EUR",
    },
    onlinePaymentSummary: {
      cashPaidCents: 0,
      cardPaidCents: 0,
      onlinePaidCents: 0,
      pendingCents: 0,
      currency: "EUR",
    },
    ...overrides,
  };
}

function makeSales(
  overrides: Partial<PortalOrdersResponse> = {},
): PortalOrdersResponse {
  return {
    timezone: "Europe/Berlin",
    period: "today",
    summary: makeSummary(overrides.summary),
    orders: [],
    providerOrders: [],
    receipts: [],
    recentOrders: [],
    ...overrides,
  };
}

function makeData(overrides: Partial<OrdersData> = {}): OrdersData {
  return {
    customer: baseCustomer,
    sales: makeSales(),
    loading: false,
    error: false,
    lastSyncedAt: new Date("2026-07-08T10:00:00Z"),
    ...overrides,
  };
}

const deriveInput = (data: OrdersData) => ({
  data,
  t: portalEn,
  locale: "en-US",
});

describe("deriveOrdersState", () => {
  it("keeps empty state when no sales data exists", () => {
    const state = deriveOrdersState(deriveInput(makeData()));

    expect(state.orders).toEqual([]);
    expect(state.receipts).toEqual([]);
    expect(state.hasSalesData).toBe(false);
    expect(state.orderKpis).toHaveLength(6);
    expect(state.revenueKpis).toHaveLength(3);
    expect(state.orderKpis.every((k) => k.value === "—")).toBe(true);
    expect(state.revenueKpis.every((k) => k.value === "—")).toBe(true);
    expect(state.orderKpis.every((k) => k.hint === "Waiting for POS sync")).toBe(
      true,
    );
    expect(state.revenueKpis.every((k) => k.hint === "Waiting for POS sync")).toBe(
      true,
    );
  });

  it("fills tables when orders and receipts are present", () => {
    const state = deriveOrdersState(
      deriveInput(
        makeData({
          sales: makeSales({
            summary: makeSummary({
              allOrdersCount: 2,
              liveOrdersCount: 2,
              onlineOrdersCount: 0,
              receiptsCount: 2,
            }),
            orders: [
              makeOrder({
                id: "o1",
                localOrderId: "ORD-1",
                paymentMethod: "cash",
                amountCents: 500,
              }),
              makeOrder({
                id: "o2",
                localOrderId: "ORD-2",
                soldAt: "2026-07-08T09:30:00.000Z",
                paymentMethod: "card",
                amountCents: 1500,
              }),
            ],
            receipts: [
              {
                id: "r1",
                localReceiptId: "RCPT-1",
                receiptNumber: "R-001",
                issuedAt: "2026-07-08T08:16:00.000Z",
                customer: null,
                paymentMethod: "cash",
                status: "active",
                fiscalStatus: "pending",
                amountCents: 500,
                currency: "EUR",
                items: [],
              },
              {
                id: "r2",
                localReceiptId: "RCPT-2",
                receiptNumber: "R-002",
                issuedAt: "2026-07-08T09:31:00.000Z",
                customer: null,
                paymentMethod: "card",
                status: "active",
                fiscalStatus: "signed",
                amountCents: 1500,
                currency: "EUR",
                items: [],
              },
            ],
          }),
        }),
      ),
    );

    expect(state.hasSalesData).toBe(true);
    expect(state.orders).toHaveLength(2);
    expect(state.receipts).toHaveLength(2);
    expect(state.orderKpis.find((k) => k.id === "all_orders")?.value).toBe("2");
    expect(state.orderKpis.find((k) => k.id === "pos_orders")?.value).toBe("2");
    expect(state.orderKpis.find((k) => k.id === "online_orders")?.value).toBe("0");
    expect(state.orderKpis.find((k) => k.id === "receipts")?.value).toBe("2");
    expect(state.orders[0].orderNumber).toBe("ORD-1");
    expect(state.receipts[0].receiptNumber).toBe("R-001");
  });

  it("maps receipt line items for display", () => {
    const state = deriveOrdersState(
      deriveInput(
        makeData({
          sales: makeSales({
            summary: makeSummary({
              allOrdersCount: 1,
              liveOrdersCount: 1,
              receiptsCount: 1,
              paymentSummary: {
                cashCents: 680,
                cardCents: 0,
                voucherCents: 0,
                otherCents: 0,
                currency: "EUR",
              },
            }),
            receipts: [
              {
                id: "r1",
                localReceiptId: "RCPT-1",
                receiptNumber: "R-001",
                issuedAt: "2026-07-08T08:16:00.000Z",
                customer: null,
                paymentMethod: "cash",
                status: "active",
                fiscalStatus: "pending",
                amountCents: 680,
                currency: "EUR",
                items: [
                  {
                    productName: "Espresso",
                    sku: null,
                    quantity: 2,
                    unitPriceCents: 250,
                    lineTotalCents: 500,
                  },
                  {
                    productName: null,
                    sku: "CR-01",
                    quantity: 1,
                    unitPriceCents: 180,
                    lineTotalCents: 180,
                  },
                ],
              },
            ],
          }),
        }),
      ),
    );

    expect(state.receipts[0].items).toHaveLength(2);
    expect(state.receipts[0].items[0].product).toBe("Espresso");
    expect(state.receipts[0].items[0].quantity).toBe("2");
    expect(state.receipts[0].items[0].unitPrice).toBe("€2.50");
    expect(state.receipts[0].items[0].total).toBe("€5.00");
    expect(state.receipts[0].items[1].product).toBe("CR-01");
    expect(state.receipts[0].items[1].total).toBe("€1.80");
  });

  it("formats TND amounts as minor units (millimes, ÷1000)", () => {
    const state = deriveOrdersState(
      deriveInput(
        makeData({
          sales: makeSales({
            summary: makeSummary({
              allOrdersCount: 1,
              liveOrdersCount: 1,
              receiptsCount: 1,
              paymentSummary: {
                cashCents: 6000,
                cardCents: 0,
                voucherCents: 0,
                otherCents: 0,
                currency: "TND",
              },
            }),
            orders: [
              makeOrder({
                id: "o1",
                localOrderId: "ORD-1",
                paymentMethod: "cash",
                amountCents: 6000,
                currency: "TND",
              }),
            ],
            receipts: [
              {
                id: "r1",
                localReceiptId: "RCPT-1",
                receiptNumber: "R-001",
                issuedAt: "2026-07-08T08:16:00.000Z",
                customer: null,
                paymentMethod: "cash",
                status: "active",
                fiscalStatus: "pending",
                amountCents: 6000,
                currency: "TND",
                items: [],
              },
            ],
          }),
        }),
      ),
    );

    // 6000 millimes → 6.000, not 60.000
    expect(state.orders[0].amount).toContain("6.000");
    expect(state.orders[0].amount).not.toContain("60.000");
    expect(state.receipts[0].amount).toContain("6.000");
  });

  it("shows Not linked only when sales arrays are empty", () => {
    const withSales = deriveOrdersState(
      deriveInput(
        makeData({
          sales: makeSales({
            summary: makeSummary({
              allOrdersCount: 1,
              liveOrdersCount: 1,
              receiptsCount: 0,
              paymentSummary: {
                cashCents: 100,
                cardCents: 0,
                voucherCents: 0,
                otherCents: 0,
                currency: "EUR",
              },
            }),
            orders: [
              makeOrder({
                id: "o1",
                localOrderId: "ORD-1",
                paymentMethod: "cash",
                amountCents: 100,
              }),
            ],
          }),
        }),
      ),
    );
    expect(withSales.hasSalesData).toBe(true);

    const empty = deriveOrdersState(deriveInput(makeData({ sales: makeSales() })));
    expect(empty.hasSalesData).toBe(false);
  });

  it("maps provider orders separately from live POS orders", () => {
    const state = deriveOrdersState(
      deriveInput(
        makeData({
          sales: makeSales({
            summary: makeSummary({
              allOrdersCount: 2,
              liveOrdersCount: 1,
              onlineOrdersCount: 1,
              revenueCents: 3250,
              averageOrderMinor: 1625,
              paymentSummary: {
                cashCents: 3250,
                cardCents: 0,
                voucherCents: 0,
                otherCents: 0,
                currency: "TND",
              },
            }),
            orders: [
              makeOrder({
                id: "live-1",
                localOrderId: "ORD-1",
                amountCents: 500,
              }),
            ],
            providerOrders: [
              makeOrder({
                id: "provider-1",
                localOrderId: "T1784007473648",
                isProviderOrder: true,
                orderSource: "delivery",
                platform: "fake_delivery",
                providerName: "Fake Delivery",
                customerName: "Test Customer",
                paymentDisplay: "Cash · Pending",
                detailsSummary: "1× Burger, 1× Fries",
                amountCents: 2750,
                currency: "TND",
                normalizedStatus: "delivered",
                status: "delivered",
                statusLabel: "Delivered",
              }),
            ],
          }),
        }),
      ),
    );

    expect(state.orders).toHaveLength(1);
    expect(state.providerOrders).toHaveLength(1);
    expect(state.providerOrders[0].provider).toBe("Fake Delivery");
  });

  it("renders split KPI cards from server summary counts", () => {
    const state = deriveOrdersState(
      deriveInput(
        makeData({
          sales: makeSales({
            summary: makeSummary({
              allOrdersCount: 31,
              liveOrdersCount: 26,
              onlineOrdersCount: 5,
              receiptsCount: 26,
              refundsCount: 0,
              hasOpenShift: false,
            }),
            orders: Array.from({ length: 26 }, (_, index) =>
              makeOrder({
                id: `live-${index}`,
                localOrderId: `ORD-${index}`,
              }),
            ),
            providerOrders: Array.from({ length: 5 }, (_, index) =>
              makeOrder({
                id: `online-${index}`,
                localOrderId: `WEB-${index}`,
                isProviderOrder: true,
                platform: "website",
                providerName: "Website",
              }),
            ),
          }),
        }),
      ),
    );

    expect(state.orderKpis.find((k) => k.id === "all_orders")?.value).toBe("31");
    expect(state.orderKpis.find((k) => k.id === "pos_orders")?.value).toBe("26");
    expect(state.orderKpis.find((k) => k.id === "online_orders")?.value).toBe("5");
    expect(state.orderKpis.find((k) => k.id === "receipts")?.value).toBe("26");
    expect(state.orderKpis.find((k) => k.id === "refunds")?.value).toBe("0");
    expect(state.orderKpis.find((k) => k.id === "open_shift")?.value).toBe("No");
    expect(
      Number(state.orderKpis.find((k) => k.id === "pos_orders")?.value) +
        Number(state.orderKpis.find((k) => k.id === "online_orders")?.value),
    ).toBe(31);
  });

  it("shows KPI values when only provider orders are synced", () => {
    const state = deriveOrdersState(
      deriveInput(
        makeData({
          sales: makeSales({
            summary: makeSummary({
              allOrdersCount: 2,
              liveOrdersCount: 0,
              onlineOrdersCount: 2,
            }),
            providerOrders: [
              makeOrder({
                id: "provider-1",
                localOrderId: "WEB-1",
                isProviderOrder: true,
                platform: "website",
                providerName: "Website",
              }),
            ],
          }),
        }),
      ),
    );

    expect(state.hasSalesData).toBe(true);
    expect(state.orderKpis.find((k) => k.id === "all_orders")?.value).toBe("2");
    expect(state.orderKpis.find((k) => k.id === "online_orders")?.value).toBe("2");
    expect(state.orderKpis.every((k) => k.value !== "—")).toBe(true);
    expect(state.revenueKpis.every((k) => k.value !== "—")).toBe(true);
  });

  it("formats revenue KPIs from backend summary fields", () => {
    const state = deriveOrdersState(
      deriveInput(
        makeData({
          sales: makeSales({
            summary: makeSummary({
              allOrdersCount: 3,
              liveOrdersCount: 2,
              onlineOrdersCount: 1,
              receiptsCount: 2,
              revenueCents: 150000,
              posRevenueCents: 120000,
              onlineRevenueCents: 30000,
              paymentSummary: {
                cashCents: 0,
                cardCents: 0,
                voucherCents: 0,
                otherCents: 0,
                currency: "EUR",
              },
            }),
          }),
        }),
      ),
    );

    expect(state.revenueKpis.find((k) => k.id === "pos_revenue")?.value).toBe(
      "€1,200.00",
    );
    expect(state.revenueKpis.find((k) => k.id === "online_revenue")?.value).toBe(
      "€300.00",
    );
    expect(state.revenueKpis.find((k) => k.id === "total_revenue")?.value).toBe(
      "€1,500.00",
    );
  });

  it("shows open shift KPI when an open shift is present", () => {
    const state = deriveOrdersState(
      deriveInput(
        makeData({
          sales: makeSales({
            summary: makeSummary({
              allOrdersCount: 1,
              liveOrdersCount: 1,
              hasOpenShift: true,
              openShift: {
                shiftId: "shift-1",
                status: "open",
                cashier: "Anna",
                deviceName: "Till 1",
                businessDate: "2026-07-14",
                startedAt: "2026-07-14T08:00:00.000Z",
                durationMinutes: 45,
                openingFloatMinor: 5000,
                currency: "EUR",
              },
              paymentSummary: {
                cashCents: 100,
                cardCents: 0,
                voucherCents: 0,
                otherCents: 0,
                currency: "EUR",
              },
            }),
            orders: [
              makeOrder({
                id: "o1",
                localOrderId: "ORD-1",
                paymentMethod: "cash",
                amountCents: 100,
              }),
            ],
          }),
        }),
      ),
    );

    const openShiftKpi = state.orderKpis.find((kpi) => kpi.id === "open_shift");
    expect(openShiftKpi?.value).toBe("Yes");
    expect(openShiftKpi?.hint).toBe("Anna · Till 1");
  });

  it("uses backend paymentDisplay for online and live orders", () => {
    const state = deriveOrdersState(
      deriveInput(
        makeData({
          sales: makeSales({
            summary: makeSummary({ allOrdersCount: 2, liveOrdersCount: 1, onlineOrdersCount: 1 }),
            orders: [
              makeOrder({
                id: "live-1",
                localOrderId: "ORD-1",
                paymentDisplay: "Cash · Paid",
                paymentMethod: "cash",
                paymentStatus: "paid",
              }),
            ],
            providerOrders: [
              makeOrder({
                id: "online-1",
                localOrderId: "WEB-1",
                isProviderOrder: true,
                platform: "website",
                providerName: "Website",
                paymentDisplay: "Card · Paid",
                paymentMethod: "card",
                paymentStatus: "paid",
              }),
            ],
          }),
        }),
      ),
    );

    expect(state.orders[0].payment).toBe("Cash · Paid");
    expect(state.providerOrders[0].payment).toBe("Card · Paid");
  });

  it("shows Cancelled payment display without Unknown prefix", () => {
    const state = deriveOrdersState(
      deriveInput(
        makeData({
          sales: makeSales({
            summary: makeSummary({ allOrdersCount: 1, liveOrdersCount: 0, onlineOrdersCount: 1 }),
            providerOrders: [
              makeOrder({
                id: "online-cancel",
                localOrderId: "WEB-C",
                isProviderOrder: true,
                platform: "website",
                providerName: "Website",
                normalizedStatus: "cancelled",
                status: "cancelled",
                paymentDisplay: "Cancelled",
                paymentStatus: "cancelled",
              }),
            ],
          }),
        }),
      ),
    );

    expect(state.providerOrders[0].payment).toBe("Cancelled");
    expect(state.providerOrders[0].payment).not.toContain("Unknown");
    expect(state.providerOrders[0].status).toBe("Cancelled");
  });

  it("renders new and accepted status badges", () => {
    const state = deriveOrdersState(
      deriveInput(
        makeData({
          sales: makeSales({
            summary: makeSummary({ allOrdersCount: 2, liveOrdersCount: 0, onlineOrdersCount: 2 }),
            providerOrders: [
              makeOrder({
                id: "new-1",
                localOrderId: "WEB-N",
                isProviderOrder: true,
                platform: "website",
                providerName: "Website",
                normalizedStatus: "new",
                status: "new",
              }),
              makeOrder({
                id: "acc-1",
                localOrderId: "WEB-A",
                isProviderOrder: true,
                platform: "website",
                providerName: "Website",
                normalizedStatus: "accepted",
                status: "accepted",
              }),
            ],
          }),
        }),
      ),
    );

    expect(state.providerOrders[0].status).toBe("New");
    expect(state.providerOrders[1].status).toBe("Accepted");
  });

  it("shows Card · Paid from API after provider payment method change", () => {
    const state = deriveOrdersState(
      deriveInput(
        makeData({
          sales: makeSales({
            summary: makeSummary({
              allOrdersCount: 1,
              liveOrdersCount: 0,
              onlineOrdersCount: 1,
              revenueCents: 27500,
              onlineRevenueCents: 27500,
              paymentSummary: {
                cashCents: 0,
                cardCents: 27500,
                voucherCents: 0,
                otherCents: 0,
                currency: "TND",
              },
            }),
            providerOrders: [
              makeOrder({
                id: "online-card",
                localOrderId: "T1784070410098",
                isProviderOrder: true,
                platform: "fake_delivery",
                providerName: "Fake Delivery",
                paymentDisplay: "Card · Paid",
                paymentMethod: "card",
                paymentStatus: "paid",
                amountCents: 27500,
                currency: "TND",
              }),
            ],
          }),
        }),
      ),
    );

    expect(state.providerOrders[0].payment).toBe("Card · Paid");
    expect(state.providerOrders[0].payment).not.toContain("Cash");
    expect(state.revenueKpis.find((k) => k.id === "online_revenue")?.value).toContain("27.500");
  });

  it("derives POS and online payment summary cards from API summary", () => {
    const state = deriveOrdersState(
      deriveInput(
        makeData({
          sales: makeSales({
            summary: makeSummary({
              allOrdersCount: 2,
              liveOrdersCount: 1,
              onlineOrdersCount: 1,
              paymentSummary: {
                cashCents: 6000,
                cardCents: 4000,
                voucherCents: 0,
                otherCents: 0,
                currency: "EUR",
              },
              onlinePaymentSummary: {
                cashPaidCents: 0,
                cardPaidCents: 27500,
                onlinePaidCents: 12000,
                pendingCents: 5000,
                currency: "EUR",
              },
              onlineRevenueCents: 39500,
              revenueCents: 39500,
            }),
            orders: [makeOrder({ id: "o1", localOrderId: "POS-1" })],
            providerOrders: [
              makeOrder({
                id: "o2",
                localOrderId: "ON-1",
                isProviderOrder: true,
                platform: "fake_delivery",
              }),
            ],
          }),
        }),
      ),
    );

    expect(state.posPaymentCards.find((c) => c.id === "cash")?.value).toContain("60");
    expect(state.posPaymentCards.find((c) => c.id === "card")?.value).toContain("40");
    expect(state.onlinePaymentCards.find((c) => c.id === "card_paid")?.value).toContain("275");
    expect(state.onlinePaymentCards.find((c) => c.id === "online_paid")?.value).toContain("120");
    expect(state.onlinePaymentCards.find((c) => c.id === "pending")?.value).toContain("50");
    expect(state.onlinePaymentCards.find((c) => c.id === "paid_total")?.emphasis).toBe(true);
    expect(state.onlinePaymentCards.find((c) => c.id === "paid_total")?.value).toContain("395");
    expect(state.revenueKpis.find((k) => k.id === "online_revenue")?.subtitle).toBeUndefined();
    expect(state.onlineRevenueHeader.value).toContain("395");
    expect(state.onlineRevenueHeader.subtitle).toBe(portalEn.orders.kpiOnlineRevenueInfo);
  });
});
