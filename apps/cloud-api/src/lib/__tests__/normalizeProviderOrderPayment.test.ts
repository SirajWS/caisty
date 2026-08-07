import { describe, expect, it } from "vitest";

import { normalizeProviderOrderPayment } from "../normalizeProviderOrderPayment.js";

describe("normalizeProviderOrderPayment", () => {
  it("1. without payment fields → pending/unknown", () => {
    const result = normalizeProviderOrderPayment({
      platform: "fake_delivery",
    });
    expect(result).toEqual({
      paymentStatus: "pending",
      paymentMethod: null,
      paid: false,
      paidAt: null,
      transactionId: null,
      providerPaymentId: null,
    });
  });

  it("2. paymentMethod card without confirmation → card pending", () => {
    const result = normalizeProviderOrderPayment({
      platform: "fake_delivery",
      paymentMethod: "card",
      payment: { method: "card", status: "pending", details: {} },
    });
    expect(result.paymentStatus).toBe("pending");
    expect(result.paymentMethod).toBe("card");
    expect(result.paid).toBe(false);
  });

  it("3. paymentStatus paid without proof → pending", () => {
    const result = normalizeProviderOrderPayment({
      platform: "fake_delivery",
      paymentStatus: "paid",
      paymentMethod: "card",
      payment: { method: "card", status: "paid", details: {} },
    });
    expect(result.paymentStatus).toBe("pending");
    expect(result.paid).toBe(false);
  });

  it("4. confirmed provider payment with proof → paid card", () => {
    const result = normalizeProviderOrderPayment({
      platform: "fake_delivery",
      paymentStatus: "paid",
      payment: {
        method: "platform_card",
        status: "paid",
        details: { txnId: "txn_postman_1", providerPaymentId: "pp_1" },
      },
      paid: true,
      transactionId: "txn_postman_1",
    });
    expect(result.paymentStatus).toBe("paid");
    expect(result.paymentMethod).toBe("platform_card");
    expect(result.paid).toBe(true);
    expect(result.transactionId).toBe("txn_postman_1");
  });

  it("5. announced cash payment → cash pending", () => {
    const result = normalizeProviderOrderPayment({
      platform: "fake_delivery",
      paymentMethod: "cash",
      payment: { method: "cash", status: "pending", details: {} },
    });
    expect(result.paymentStatus).toBe("pending");
    expect(result.paymentMethod).toBe("cash");
    expect(result.paid).toBe(false);
  });

  it("does not treat source online or T-id as payment proof", () => {
    const result = normalizeProviderOrderPayment({
      platform: "fake_delivery",
      paymentStatus: "paid",
      transactionId: "T1786060842435",
      providerOrderId: "T1786060842435",
      localOrderId: "T1786060842435",
    });
    expect(result.paymentStatus).toBe("pending");
    expect(result.transactionId).toBeNull();
  });
});
