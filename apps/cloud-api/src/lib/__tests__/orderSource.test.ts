import { describe, expect, it } from "vitest";

import {
  formatOrderPaymentDisplay,
  formatProviderLabel,
  isProviderOrder,
  normalizeOrderSource,
  ORDER_SOURCE,
  resolveOrderPaymentStatus,
  summarizeOrderLines,
} from "../orderSource.js";

describe("orderSource", () => {
  it("treats normal POS orders as non-provider", () => {
    expect(isProviderOrder(null)).toBe(false);
    expect(isProviderOrder("")).toBe(false);
    expect(isProviderOrder("pos")).toBe(false);
    expect(isProviderOrder("dine_in")).toBe(false);
    expect(isProviderOrder("counter")).toBe(false);
    expect(isProviderOrder("queue")).toBe(false);
    expect(isProviderOrder("in_store")).toBe(false);
    expect(normalizeOrderSource("pos")).toBe(ORDER_SOURCE.POS);
  });

  it("classifies online provider channels", () => {
    for (const platform of [
      "website",
      "fake_delivery",
      "lieferando",
      "uber",
      "wolt",
    ]) {
      expect(isProviderOrder(platform)).toBe(true);
    }
  });

  it("classifies fake_delivery as provider order", () => {
    expect(isProviderOrder("fake_delivery")).toBe(true);
    expect(normalizeOrderSource("fake_delivery")).toBe(ORDER_SOURCE.DELIVERY);
    expect(formatProviderLabel("fake_delivery")).toBe("Fake Delivery");
  });

  it("classifies structured provider values", () => {
    expect(isProviderOrder("uber_eats")).toBe(true);
    expect(formatProviderLabel("uber_eats")).toBe("Uber Eats");
    expect(normalizeOrderSource("website")).toBe(ORDER_SOURCE.ONLINE);
  });

  it("uses stable fallback labels for unknown providers", () => {
    expect(isProviderOrder("my_custom_channel")).toBe(true);
    expect(formatProviderLabel("my_custom_channel")).toBe("My Custom Channel");
  });

  it("summarizes order lines with overflow", () => {
    expect(
      summarizeOrderLines([
        {
          productName: "Burger",
          sku: null,
          quantity: 1,
          unitPriceCents: 1000,
          lineTotalCents: 1000,
        },
        {
          productName: "Fries",
          sku: null,
          quantity: 1,
          unitPriceCents: 500,
          lineTotalCents: 500,
        },
        {
          productName: "Cola",
          sku: null,
          quantity: 2,
          unitPriceCents: 300,
          lineTotalCents: 600,
        },
      ]),
    ).toBe("1× Burger, 1× Fries, +1 more");
  });

  it("does not mark paid without payment records or synced status", () => {
    expect(
      resolveOrderPaymentStatus({ paymentStatus: null, hasPayments: false }),
    ).toBe("pending");
    expect(
      resolveOrderPaymentStatus({ paymentStatus: "paid", hasPayments: false }),
    ).toBe("paid");
    expect(
      resolveOrderPaymentStatus({ paymentStatus: null, hasPayments: true }),
    ).toBe("paid");
  });

  it("formats payment method and status separately", () => {
    expect(
      formatOrderPaymentDisplay({
        paymentMethod: "cash",
        paymentStatus: "pending",
      }),
    ).toBe("Cash · Pending");
  });
});

describe("027_pos_orders_provider_fields migration", () => {
  it("adds provider metadata columns", async () => {
    const { readFileSync } = await import("node:fs");
    const { dirname, join } = await import("node:path");
    const { fileURLToPath } = await import("node:url");

    const sql = readFileSync(
      join(
        dirname(fileURLToPath(import.meta.url)),
        "../../../drizzle/027_pos_orders_provider_fields.sql",
      ),
      "utf8",
    );

    expect(sql).toContain("platform TEXT");
    expect(sql).toContain("provider_order_id TEXT");
    expect(sql).toContain("payment_status VARCHAR(32)");
  });
});
