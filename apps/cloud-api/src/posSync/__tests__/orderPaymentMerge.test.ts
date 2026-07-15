import { describe, expect, it } from "vitest";

import { mergePaymentMethodForSync, mergePaymentStatusForSync } from "../orderPaymentMerge.js";
import { mergeOrderStatusForSync } from "../orderStatusMerge.js";

describe("orderPaymentMerge", () => {
  it("never downgrades paid to pending", () => {
    expect(mergePaymentStatusForSync("paid", "pending")).toBe("paid");
  });

  it("upgrades pending to paid", () => {
    expect(mergePaymentStatusForSync("pending", "paid")).toBe("paid");
  });

  it("preserves card over unknown on payment retry", () => {
    expect(mergePaymentMethodForSync("card", "unknown")).toBe("card");
  });
});

describe("orderStatusMerge", () => {
  it("does not regress delivered to accepted", () => {
    expect(mergeOrderStatusForSync("delivered", "accepted")).toBe("delivered");
  });

  it("never reactivates cancelled orders", () => {
    expect(mergeOrderStatusForSync("cancelled", "accepted")).toBe("cancelled");
    expect(mergeOrderStatusForSync("canceled", "new")).toBe("canceled");
  });

  it("allows escalation to cancelled", () => {
    expect(mergeOrderStatusForSync("accepted", "cancelled")).toBe("cancelled");
  });
});
