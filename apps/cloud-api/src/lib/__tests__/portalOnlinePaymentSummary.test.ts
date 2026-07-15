import { describe, expect, it } from "vitest";

import {
  aggregateOnlinePaymentSummary,
  classifyOnlinePaymentBucket,
  pickPrimaryPaymentMethod,
  resolveOnlineOrderPaymentBucket,
  type OrderPaymentRow,
} from "../portalOrders.js";

describe("online payment summary aggregation", () => {
  const deviceId = "dev-1";
  const orderId = "T1784070410098";
  const amount = 27500;

  function row(
    method: string,
    paidAt: string,
    updatedAt: string,
    localPaymentId: string,
  ): OrderPaymentRow {
    return {
      deviceId,
      localOrderId: orderId,
      localPaymentId,
      method,
      amountCents: amount,
      paidAt,
      updatedAt,
    };
  }

  it("maps online cash paid to cashPaidCents", () => {
    const summary = aggregateOnlinePaymentSummary({
      orders: [
        {
          totalCents: amount,
          orderStatus: "completed",
          paymentStatus: "paid",
          paymentRows: [row("cash", "2026-07-14T10:00:00.000Z", "2026-07-14T10:00:00.000Z", "pay-cash")],
          hasKpiReceipt: false,
          excluded: false,
        },
      ],
      providerReceipts: [],
    });
    expect(summary.cashPaidCents).toBe(amount);
    expect(summary.cardPaidCents).toBe(0);
    expect(summary.onlinePaidCents).toBe(0);
    expect(summary.pendingCents).toBe(0);
  });

  it("maps online card paid to cardPaidCents", () => {
    const summary = aggregateOnlinePaymentSummary({
      orders: [
        {
          totalCents: amount,
          orderStatus: "completed",
          paymentStatus: "paid",
          paymentRows: [row("card", "2026-07-14T10:00:00.000Z", "2026-07-14T10:00:00.000Z", "pay-card")],
          hasKpiReceipt: false,
          excluded: false,
        },
      ],
      providerReceipts: [],
    });
    expect(summary.cardPaidCents).toBe(amount);
  });

  it("maps prepaid provider orders without POS payment rows to onlinePaidCents", () => {
    const summary = aggregateOnlinePaymentSummary({
      orders: [
        {
          totalCents: amount,
          orderStatus: "completed",
          paymentStatus: "paid",
          paymentRows: [],
          hasKpiReceipt: false,
          excluded: false,
        },
      ],
      providerReceipts: [],
    });
    expect(summary.onlinePaidCents).toBe(amount);
  });

  it("maps platform_card to onlinePaidCents", () => {
    expect(classifyOnlinePaymentBucket("platform_card")).toBe("online_paid");
    const summary = aggregateOnlinePaymentSummary({
      orders: [
        {
          totalCents: amount,
          orderStatus: "completed",
          paymentStatus: "paid",
          paymentRows: [row("platform_card", "2026-07-14T10:00:00.000Z", "2026-07-14T10:00:00.000Z", "pay-online")],
          hasKpiReceipt: false,
          excluded: false,
        },
      ],
      providerReceipts: [],
    });
    expect(summary.onlinePaidCents).toBe(amount);
  });

  it("maps pending online orders to pendingCents only", () => {
    const summary = aggregateOnlinePaymentSummary({
      orders: [
        {
          totalCents: amount,
          orderStatus: "accepted",
          paymentStatus: "pending",
          paymentRows: [],
          hasKpiReceipt: false,
          excluded: false,
        },
      ],
      providerReceipts: [],
    });
    expect(summary.pendingCents).toBe(amount);
    expect(summary.cashPaidCents + summary.cardPaidCents + summary.onlinePaidCents).toBe(0);
  });

  it("excludes cancelled and refunded orders from paid buckets", () => {
    const summary = aggregateOnlinePaymentSummary({
      orders: [
        {
          totalCents: amount,
          orderStatus: "cancelled",
          paymentStatus: "paid",
          paymentRows: [row("card", "2026-07-14T10:00:00.000Z", "2026-07-14T10:00:00.000Z", "pay-card")],
          hasKpiReceipt: false,
          excluded: true,
        },
        {
          totalCents: amount,
          orderStatus: "refunded",
          paymentStatus: "paid",
          paymentRows: [row("cash", "2026-07-14T10:00:00.000Z", "2026-07-14T10:00:00.000Z", "pay-cash")],
          hasKpiReceipt: false,
          excluded: true,
        },
      ],
      providerReceipts: [],
    });
    expect(summary.cashPaidCents + summary.cardPaidCents + summary.onlinePaidCents).toBe(0);
  });

  it("counts only card after cash to card method change", () => {
    const rows = [
      row("cash", "2026-07-14T10:00:00.000Z", "2026-07-14T10:00:00.000Z", `${orderId}-provider-cash`),
      row("card", "2026-07-14T11:00:00.000Z", "2026-07-14T11:00:00.000Z", `${orderId}-provider-card`),
    ];
    expect(pickPrimaryPaymentMethod(rows)).toBe("card");

    const summary = aggregateOnlinePaymentSummary({
      orders: [
        {
          totalCents: amount,
          orderStatus: "completed",
          paymentStatus: "paid",
          paymentRows: rows,
          hasKpiReceipt: false,
          excluded: false,
        },
      ],
      providerReceipts: [],
    });
    expect(summary.cardPaidCents).toBe(amount);
    expect(summary.cashPaidCents).toBe(0);
  });

  it("counts only cash after card to cash method change", () => {
    const rows = [
      row("card", "2026-07-14T10:00:00.000Z", "2026-07-14T10:00:00.000Z", `${orderId}-provider-card`),
      row("cash", "2026-07-14T12:00:00.000Z", "2026-07-14T12:00:00.000Z", `${orderId}-provider-cash`),
    ];
    const summary = aggregateOnlinePaymentSummary({
      orders: [
        {
          totalCents: amount,
          orderStatus: "completed",
          paymentStatus: "paid",
          paymentRows: rows,
          hasKpiReceipt: false,
          excluded: false,
        },
      ],
      providerReceipts: [],
    });
    expect(summary.cashPaidCents).toBe(amount);
    expect(summary.cardPaidCents).toBe(0);
  });

  it("uses provider KPI receipts without double counting order rows", () => {
    const summary = aggregateOnlinePaymentSummary({
      orders: [
        {
          totalCents: amount,
          orderStatus: "completed",
          paymentStatus: "paid",
          paymentRows: [row("card", "2026-07-14T10:00:00.000Z", "2026-07-14T10:00:00.000Z", "pay-card")],
          hasKpiReceipt: true,
          excluded: false,
        },
      ],
      providerReceipts: [
        {
          grossCents: amount,
          orderStatus: "completed",
          paymentStatus: "paid",
          paymentRows: [row("card", "2026-07-14T10:00:00.000Z", "2026-07-14T10:00:00.000Z", "pay-card")],
          excluded: false,
        },
      ],
    });
    expect(summary.cardPaidCents).toBe(amount);
    expect(summary.cashPaidCents + summary.onlinePaidCents).toBe(0);
  });

  it("classifies resolveOnlineOrderPaymentBucket for pending vs paid", () => {
    expect(
      resolveOnlineOrderPaymentBucket({
        paymentStatus: "pending",
        hasPayments: false,
        paymentRows: [],
      }),
    ).toBe("pending");
    expect(
      resolveOnlineOrderPaymentBucket({
        paymentStatus: "paid",
        hasPayments: false,
        paymentRows: [],
      }),
    ).toBe("online_paid");
  });
});
