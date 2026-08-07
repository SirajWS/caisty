import { describe, expect, it } from "vitest";

import {
  comparePaymentRefCandidates,
  latestPaymentSettlementByLocalOrderId,
  type PullPaymentRefCandidate,
} from "../pullLocalRefs.js";

function payment(
  partial: Partial<PullPaymentRefCandidate> & Pick<PullPaymentRefCandidate, "localOrderId">,
): PullPaymentRefCandidate {
  return {
    id: partial.id ?? "pay-1",
    deviceId: partial.deviceId ?? "device-a",
    method: partial.method ?? "cash",
    localPaymentId: partial.localPaymentId ?? "local-pay-1",
    localOrderId: partial.localOrderId,
    localReceiptId: partial.localReceiptId ?? null,
    paidAt: partial.paidAt ?? new Date("2026-08-07T10:00:00.000Z"),
    updatedAt: partial.updatedAt ?? new Date("2026-08-07T10:00:00.000Z"),
  };
}

describe("latestPaymentSettlementByLocalOrderId", () => {
  it("picks latest payment settlement org-wide by localOrderId", () => {
    const map = latestPaymentSettlementByLocalOrderId([
      payment({
        id: "p1",
        deviceId: "device-a",
        localOrderId: "ORDER-1",
        method: "cash",
        paidAt: new Date("2026-08-07T09:00:00.000Z"),
      }),
      payment({
        id: "p2",
        deviceId: "device-b",
        localOrderId: "ORDER-1",
        method: "card",
        paidAt: new Date("2026-08-07T11:00:00.000Z"),
      }),
    ]);

    expect(map.get("ORDER-1")).toEqual({
      method: "card",
      paidAt: new Date("2026-08-07T11:00:00.000Z"),
    });
  });

  it("orders candidates deterministically by paidAt", () => {
    const a = payment({
      localOrderId: "ORDER-2",
      paidAt: new Date("2026-08-07T08:00:00.000Z"),
    });
    const b = payment({
      localOrderId: "ORDER-2",
      paidAt: new Date("2026-08-07T12:00:00.000Z"),
    });
    expect(comparePaymentRefCandidates(a, b)).toBeLessThan(0);
  });
});
