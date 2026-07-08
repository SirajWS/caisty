import { describe, expect, it } from "vitest";
import { deriveOrdersState } from "./deriveOrdersState";
import { portalEn } from "../translations/portal/en";
import type { OrdersData } from "./types";
import type { PortalOrdersResponse } from "../portalApi";

const baseCustomer = {
  id: "c1",
  orgId: "o1",
  name: "Alex",
  email: "alex@test.com",
  portalStatus: "active" as const,
};

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
    receipts: [],
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
              {
                id: "o1",
                localOrderId: "ORD-1",
                soldAt: "2026-07-08T08:15:00.000Z",
                status: "closed",
                paymentMethod: "cash",
                amountCents: 500,
                currency: "EUR",
                cashier: null,
                deviceName: "Kasse 1",
              },
              {
                id: "o2",
                localOrderId: "ORD-2",
                soldAt: "2026-07-08T09:30:00.000Z",
                status: "closed",
                paymentMethod: "card",
                amountCents: 1500,
                currency: "EUR",
                cashier: null,
                deviceName: "Kasse 1",
              },
            ],
            receipts: [
              {
                id: "r1",
                localReceiptId: "RCPT-1",
                receiptNumber: "R-001",
                issuedAt: "2026-07-08T08:16:00.000Z",
                customer: null,
                paymentMethod: "cash",
                fiscalStatus: "pending",
                amountCents: 500,
                currency: "EUR",
              },
              {
                id: "r2",
                localReceiptId: "RCPT-2",
                receiptNumber: "R-002",
                issuedAt: "2026-07-08T09:31:00.000Z",
                customer: null,
                paymentMethod: "card",
                fiscalStatus: "signed",
                amountCents: 1500,
                currency: "EUR",
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

  it("calculates payment summary buckets from API totals", () => {
    const state = deriveOrdersState(
      deriveInput(
        makeData({
          sales: makeSales({
            summary: {
              ordersCount: 2,
              receiptsCount: 2,
              refundsCount: 0,
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
              {
                id: "o1",
                localOrderId: "ORD-1",
                soldAt: "2026-07-08T08:15:00.000Z",
                status: "closed",
                paymentMethod: "cash",
                amountCents: 800,
                currency: "EUR",
                cashier: null,
                deviceName: "Kasse 1",
              },
            ],
            receipts: [
              {
                id: "r1",
                localReceiptId: "RCPT-1",
                receiptNumber: "R-001",
                issuedAt: "2026-07-08T08:16:00.000Z",
                customer: null,
                paymentMethod: "cash",
                fiscalStatus: "pending",
                amountCents: 800,
                currency: "EUR",
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
              {
                id: "o1",
                localOrderId: "ORD-1",
                soldAt: "2026-07-08T08:15:00.000Z",
                status: "closed",
                paymentMethod: "cash",
                amountCents: 6000,
                currency: "TND",
                cashier: null,
                deviceName: "Kasse 1",
              },
            ],
            receipts: [
              {
                id: "r1",
                localReceiptId: "RCPT-1",
                receiptNumber: "R-001",
                issuedAt: "2026-07-08T08:16:00.000Z",
                customer: null,
                paymentMethod: "cash",
                fiscalStatus: "pending",
                amountCents: 6000,
                currency: "TND",
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
              {
                id: "o1",
                localOrderId: "ORD-1",
                soldAt: "2026-07-08T08:15:00.000Z",
                status: "closed",
                paymentMethod: "cash",
                amountCents: 100,
                currency: "EUR",
                cashier: null,
                deviceName: "Kasse 1",
              },
            ],
          }),
        }),
      ),
    );
    expect(withSales.hasSalesData).toBe(true);

    const empty = deriveOrdersState(deriveInput(makeData({ sales: makeSales() })));
    expect(empty.hasSalesData).toBe(false);
  });
});
