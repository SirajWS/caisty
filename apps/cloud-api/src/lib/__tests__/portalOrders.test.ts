import { describe, expect, it } from "vitest";

import {
  groupOrderLinesByDeviceLocalId,
  orderLinesLookupKey,
  resolveReceiptLineItems,
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
    expect(map.get(key)).toEqual([
      {
        productName: "Espresso",
        sku: null,
        quantity: 2,
        unitPriceCents: 250,
        lineTotalCents: 500,
      },
      {
        productName: "Croissant",
        sku: "CR-01",
        quantity: 1,
        unitPriceCents: 180,
        lineTotalCents: 180,
      },
    ]);
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
    expect(resolveReceiptLineItems(map, "dev-1", "ORD-99")).toEqual([]);
  });
});
