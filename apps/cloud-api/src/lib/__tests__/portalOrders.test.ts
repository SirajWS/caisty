import { describe, expect, it } from "vitest";

import {
  aggregateEffectivePaymentSummary,
  comparePaymentRowsByRecency,
  effectivePaymentsForSummary,
  groupOrderLinesByDeviceLocalId,
  orderLinesLookupKey,
  pickPrimaryPaymentMethod,
  pickPrimaryPaymentRow,
  resolveReceiptLineItems,
  type OrderPaymentRow,
} from "../portalOrders.js";

describe("portal order line lookup", () => {
  it("groups lines by device and local order id", () => {
    const map = groupOrderLinesByDeviceLocalId([
      {
        deviceId: "dev-1",
        localOrderId: "ORD-1",
        lineIndex: 0,
        productName: "Espresso",
        sku: null,
        quantity: 2,
        unitPriceCents: 250,
        lineTotalCents: 500,
      },
      {
        deviceId: "dev-1",
        localOrderId: "ORD-1",
        lineIndex: 1,
        productName: "Croissant",
        sku: "CR-01",
        quantity: 1,
        unitPriceCents: 180,
        lineTotalCents: 180,
      },
      {
        deviceId: "dev-2",
        localOrderId: "ORD-1",
        lineIndex: 0,
        productName: "Tea",
        sku: null,
        quantity: 1,
        unitPriceCents: 300,
        lineTotalCents: 300,
      },
    ]);

    const key = orderLinesLookupKey("dev-1", "ORD-1");
    expect(map.get(key)).toHaveLength(2);
    expect(map.get(orderLinesLookupKey("dev-2", "ORD-1"))).toHaveLength(1);
  });

  it("resolves receipt items via device id and local order id", () => {
    const map = groupOrderLinesByDeviceLocalId([
      {
        deviceId: "dev-1",
        localOrderId: "ORD-42",
        lineIndex: 0,
        productName: "Latte",
        sku: null,
        quantity: 1,
        unitPriceCents: 450,
        lineTotalCents: 450,
      },
    ]);

    expect(resolveReceiptLineItems(map, "dev-1", "ORD-42")).toHaveLength(1);
    expect(resolveReceiptLineItems(map, "dev-1", null)).toEqual([]);
  });
});

describe("order payment resolution", () => {
  const orderId = "T1784070410098";
  const deviceId = "dev-1";
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

  it("picks newer card over older cash for the same provider order", () => {
    const rows = [
      row("cash", "2026-07-14T10:00:00.000Z", "2026-07-14T10:00:00.000Z", `${orderId}-provider-cash`),
      row("card", "2026-07-14T11:00:00.000Z", "2026-07-14T11:00:00.000Z", `${orderId}-provider-card`),
    ];

    expect(pickPrimaryPaymentMethod(rows)).toBe("card");
    expect(
      comparePaymentRowsByRecency(rows[0], rows[1]),
    ).toBeGreaterThan(0);
  });

  it("picks newer cash over older card", () => {
    const rows = [
      row("card", "2026-07-14T10:00:00.000Z", "2026-07-14T10:00:00.000Z", `${orderId}-provider-card`),
      row("cash", "2026-07-14T12:00:00.000Z", "2026-07-14T12:00:00.000Z", `${orderId}-provider-cash`),
    ];

    expect(pickPrimaryPaymentMethod(rows)).toBe("cash");
  });

  it("counts method-change duplicates once in payment summary", () => {
    const rows = [
      row("cash", "2026-07-14T10:00:00.000Z", "2026-07-14T10:00:00.000Z", `${orderId}-provider-cash`),
      row("card", "2026-07-14T11:00:00.000Z", "2026-07-14T11:00:00.000Z", `${orderId}-provider-card`),
    ];

    const summary = aggregateEffectivePaymentSummary(rows);
    expect(summary.cardCents).toBe(amount);
    expect(summary.cashCents).toBe(0);
    expect(summary.cardCents + summary.cashCents).toBe(amount);
  });

  it("keeps POS split payments with different amounts", () => {
    const splitRows: OrderPaymentRow[] = [
      {
        deviceId,
        localOrderId: "POS-1",
        method: "cash",
        amountCents: 500,
        paidAt: "2026-07-14T10:00:00.000Z",
        updatedAt: "2026-07-14T10:00:00.000Z",
      },
      {
        deviceId,
        localOrderId: "POS-1",
        method: "card",
        amountCents: 1500,
        paidAt: "2026-07-14T10:01:00.000Z",
        updatedAt: "2026-07-14T10:01:00.000Z",
      },
    ];

    const effective = effectivePaymentsForSummary(splitRows);
    expect(effective).toHaveLength(2);
    const summary = aggregateEffectivePaymentSummary(splitRows);
    expect(summary.cashCents).toBe(500);
    expect(summary.cardCents).toBe(1500);
  });

  it("uses updatedAt when paidAt ties", () => {
    const rows = [
      row("cash", "2026-07-14T10:00:00.000Z", "2026-07-14T10:00:00.000Z", "pay-cash"),
      row("card", "2026-07-14T10:00:00.000Z", "2026-07-14T10:05:00.000Z", "pay-card"),
    ];

    expect(pickPrimaryPaymentRow(rows)?.method).toBe("card");
  });
});
