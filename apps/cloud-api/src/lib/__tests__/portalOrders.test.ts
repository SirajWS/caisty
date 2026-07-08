import { describe, expect, it } from "vitest";

import {
  aggregatePaymentSummary,
  bucketPaymentMethod,
} from "../portalOrders.js";

describe("bucketPaymentMethod", () => {
  it("maps cash and card methods", () => {
    expect(bucketPaymentMethod("cash")).toBe("cash");
    expect(bucketPaymentMethod("CARD")).toBe("card");
    expect(bucketPaymentMethod("debit")).toBe("card");
  });

  it("maps voucher and other methods", () => {
    expect(bucketPaymentMethod("voucher")).toBe("voucher");
    expect(bucketPaymentMethod("gift_card")).toBe("voucher");
    expect(bucketPaymentMethod("paypal")).toBe("other");
  });
});

describe("aggregatePaymentSummary", () => {
  it("sums payment buckets without double-counting rows", () => {
    const summary = aggregatePaymentSummary([
      { method: "cash", amountCents: 500 },
      { method: "cash", amountCents: 300 },
      { method: "card", amountCents: 1200 },
      { method: "voucher", amountCents: 200 },
      { method: "paypal", amountCents: 100 },
    ]);

    expect(summary).toEqual({
      cashCents: 800,
      cardCents: 1200,
      voucherCents: 200,
      otherCents: 100,
    });
  });
});
