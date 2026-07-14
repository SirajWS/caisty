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

function makeSales(
  overrides: Partial<PortalOrdersResponse> = {},
): PortalOrdersResponse {
  return {
    timezone: "Europe/Berlin",
    period: "today",
    summary: {
      ordersCount: 0,
      receiptsCount: 0,
      refundsCount: 0,
      revenueCents: 0,
      averageOrderMinor: 0,
      openShift: null,
      paymentSummary: {
        cashCents: 0,
        cardCents: 0,
        voucherCents: 0,
        otherCents: 0,
        currency: "EUR",
      },
    },
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
    expect(state.summary).toHaveLength(4);
    expect(state.summary.every((k) => k.value === "—")).toBe(true);
    expect(state.summary.every((k) => k.hint === "Waiting for POS sync")).toBe(
      true,
    );
    expect(state.payments.every((p) => p.value === "—")).toBe(true);
  });

  it("fills tables when orders and receipts are present", () => {
    const state = deriveOrdersState(
      deriveInput(
        makeData({
          sales: makeSales({
            summary: {
              ordersCount: 2,
              receiptsCount: 2,
              refundsCount: 0,
              revenueCents: 2000,
              averageOrderMinor: 1000,
              openShift: null,
              paymentSummary: {
                cashCents: 500,
                cardCents: 1500,
                voucherCents: 0,
                otherCents: 0,
                currency: "EUR",
              },
            },
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
    expect(state.summary.find((k) => k.id === "orders")?.value).toBe("2");
    expect(state.summary.find((k) => k.id === "receipts")?.value).toBe("2");
    expect(state.orders[0].orderNumber).toBe("ORD-1");
    expect(state.receipts[0].receiptNumber).toBe("R-001");
  });

  it("maps receipt line items for display", () => {
    const state = deriveOrdersState(
      deriveInput(
        makeData({
          sales: makeSales({
            summary: {
              ordersCount: 1,
              receiptsCount: 1,
              refundsCount: 0,
              revenueCents: 0,
              averageOrderMinor: 0,
              openShift: null,
              paymentSummary: {
                cashCents: 680,
                cardCents: 0,
                voucherCents: 0,
                otherCents: 0,
                currency: "EUR",
              },
            },
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

  it("calculates payment summary buckets from API totals", () => {
    const state = deriveOrdersState(
      deriveInput(
        makeData({
          sales: makeSales({
            summary: {
              ordersCount: 2,
              receiptsCount: 2,
              refundsCount: 0,
              revenueCents: 0,
              averageOrderMinor: 0,
              openShift: null,
              paymentSummary: {
                cashCents: 800,
                cardCents: 1200,
                voucherCents: 200,
                otherCents: 100,
                currency: "EUR",
              },
            },
            orders: [
              makeOrder({
                id: "o1",
                localOrderId: "ORD-1",
                paymentMethod: "cash",
                amountCents: 800,
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
                amountCents: 800,
                currency: "EUR",
                items: [],
              },
            ],
          }),
        }),
      ),
    );

    expect(state.payments.find((p) => p.id === "cash")?.value).toBe("€8.00");
    expect(state.payments.find((p) => p.id === "card")?.value).toBe("€12.00");
    expect(state.payments.find((p) => p.id === "voucher")?.value).toBe("€2.00");
    expect(state.payments.find((p) => p.id === "other")?.value).toBe("€1.00");
    expect(state.payments.find((p) => p.id === "cash")?.tone).toBe("ok");
    expect(state.payments.find((p) => p.id === "card")?.tone).toBe("ok");
  });

  it("formats TND amounts as minor units (millimes, ÷1000)", () => {
    const state = deriveOrdersState(
      deriveInput(
        makeData({
          sales: makeSales({
            summary: {
              ordersCount: 1,
              receiptsCount: 1,
              refundsCount: 0,
              revenueCents: 0,
              averageOrderMinor: 0,
              openShift: null,
              paymentSummary: {
                cashCents: 6000,
                cardCents: 0,
                voucherCents: 0,
                otherCents: 0,
                currency: "TND",
              },
            },
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
    expect(state.payments.find((p) => p.id === "cash")?.value).toContain(
      "6.000",
    );
  });

  it("shows Not linked only when sales arrays are empty", () => {
    const withSales = deriveOrdersState(
      deriveInput(
        makeData({
          sales: makeSales({
            summary: {
              ordersCount: 1,
              receiptsCount: 0,
              refundsCount: 0,
              revenueCents: 0,
              averageOrderMinor: 0,
              openShift: null,
              paymentSummary: {
                cashCents: 100,
                cardCents: 0,
                voucherCents: 0,
                otherCents: 0,
                currency: "EUR",
              },
            },
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
            summary: {
              ordersCount: 2,
              receiptsCount: 0,
              refundsCount: 0,
              revenueCents: 3250,
              averageOrderMinor: 1625,
              openShift: null,
              paymentSummary: {
                cashCents: 3250,
                cardCents: 0,
                voucherCents: 0,
                otherCents: 0,
                currency: "TND",
              },
            },
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

  it("shows open shift KPI when an open shift is present", () => {
    const state = deriveOrdersState(
      deriveInput(
        makeData({
          sales: makeSales({
            summary: {
              ordersCount: 1,
              receiptsCount: 1,
              refundsCount: 0,
              revenueCents: 0,
              averageOrderMinor: 0,
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
            },
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

    const openShiftKpi = state.summary.find((kpi) => kpi.id === "open_shift");
    expect(openShiftKpi?.value).toBe("Yes");
    expect(openShiftKpi?.hint).toBe("Anna · Till 1");
  });
});
