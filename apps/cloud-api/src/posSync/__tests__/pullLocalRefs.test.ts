import { describe, expect, it } from "vitest";

import {
  comparePaymentRefCandidates,
  deviceLocalKey,
  latestLocalPaymentIdByDeviceReceipt,
  latestPaymentMethodByDeviceOrder,
  type PullPaymentRefCandidate,
} from "../pullLocalRefs.js";

function payment(
  partial: Partial<PullPaymentRefCandidate> &
    Pick<
      PullPaymentRefCandidate,
      "id" | "deviceId" | "method" | "localPaymentId"
    >,
): PullPaymentRefCandidate {
  return {
    localOrderId: null,
    localReceiptId: null,
    paidAt: new Date("2026-07-27T10:00:00.000Z"),
    updatedAt: new Date("2026-07-27T10:00:00.000Z"),
    ...partial,
  };
}

describe("deviceLocalKey", () => {
  it("pairs device and local id", () => {
    expect(deviceLocalKey("device-a", "100")).toBe("device-a|100");
  });
});

describe("latestPaymentMethodByDeviceOrder", () => {
  it("does not cross-assign same localOrderId across devices", () => {
    const map = latestPaymentMethodByDeviceOrder([
      payment({
        id: "p-a",
        deviceId: "device-a",
        localPaymentId: "pay-a",
        localOrderId: "100",
        method: "cash",
        paidAt: new Date("2026-07-27T10:00:00.000Z"),
      }),
      payment({
        id: "p-b",
        deviceId: "device-b",
        localPaymentId: "pay-b",
        localOrderId: "100",
        method: "card",
        paidAt: new Date("2026-07-27T11:00:00.000Z"),
      }),
    ]);

    expect(map.get(deviceLocalKey("device-a", "100"))).toBe("cash");
    expect(map.get(deviceLocalKey("device-b", "100"))).toBe("card");
  });

  it("picks latest payment on same device order deterministically", () => {
    const map = latestPaymentMethodByDeviceOrder([
      payment({
        id: "p-old",
        deviceId: "device-a",
        localPaymentId: "pay-1",
        localOrderId: "100",
        method: "cash",
        paidAt: new Date("2026-07-27T10:00:00.000Z"),
        updatedAt: new Date("2026-07-27T10:00:00.000Z"),
      }),
      payment({
        id: "p-new",
        deviceId: "device-a",
        localPaymentId: "pay-2",
        localOrderId: "100",
        method: "card",
        paidAt: new Date("2026-07-27T12:00:00.000Z"),
        updatedAt: new Date("2026-07-27T12:00:00.000Z"),
      }),
    ]);

    expect(map.get(deviceLocalKey("device-a", "100"))).toBe("card");
  });

  it("breaks ties with updatedAt then id when paidAt equal", () => {
    const samePaidAt = new Date("2026-07-27T10:00:00.000Z");
    const map = latestPaymentMethodByDeviceOrder([
      payment({
        id: "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
        deviceId: "device-a",
        localPaymentId: "pay-1",
        localOrderId: "100",
        method: "cash",
        paidAt: samePaidAt,
        updatedAt: samePaidAt,
      }),
      payment({
        id: "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb",
        deviceId: "device-a",
        localPaymentId: "pay-2",
        localOrderId: "100",
        method: "card",
        paidAt: samePaidAt,
        updatedAt: samePaidAt,
      }),
    ]);

    expect(map.get(deviceLocalKey("device-a", "100"))).toBe("card");
  });

  it("treats null paidAt as earliest", () => {
    const map = latestPaymentMethodByDeviceOrder([
      payment({
        id: "p-null",
        deviceId: "device-a",
        localPaymentId: "pay-1",
        localOrderId: "100",
        method: "cash",
        paidAt: null,
      }),
      payment({
        id: "p-dated",
        deviceId: "device-a",
        localPaymentId: "pay-2",
        localOrderId: "100",
        method: "card",
        paidAt: new Date("2026-07-27T10:00:00.000Z"),
      }),
    ]);

    expect(map.get(deviceLocalKey("device-a", "100"))).toBe("card");
  });
});

describe("latestLocalPaymentIdByDeviceReceipt", () => {
  it("does not cross-assign same localReceiptId across devices", () => {
    const map = latestLocalPaymentIdByDeviceReceipt([
      payment({
        id: "p-a",
        deviceId: "device-a",
        localPaymentId: "pay-a",
        localReceiptId: "rcpt-100",
        method: "cash",
      }),
      payment({
        id: "p-b",
        deviceId: "device-b",
        localPaymentId: "pay-b",
        localReceiptId: "rcpt-100",
        method: "card",
        paidAt: new Date("2026-07-27T12:00:00.000Z"),
      }),
    ]);

    expect(map.get(deviceLocalKey("device-a", "rcpt-100"))).toBe("pay-a");
    expect(map.get(deviceLocalKey("device-b", "rcpt-100"))).toBe("pay-b");
  });
});

describe("comparePaymentRefCandidates", () => {
  it("is stable for identical timestamps using id tie-breaker", () => {
    const a = payment({
      id: "a",
      deviceId: "d",
      localPaymentId: "1",
      method: "cash",
      paidAt: new Date("2026-07-27T10:00:00.000Z"),
      updatedAt: new Date("2026-07-27T10:00:00.000Z"),
    });
    const b = payment({
      id: "b",
      deviceId: "d",
      localPaymentId: "2",
      method: "card",
      paidAt: new Date("2026-07-27T10:00:00.000Z"),
      updatedAt: new Date("2026-07-27T10:00:00.000Z"),
    });
    expect(comparePaymentRefCandidates(a, b)).toBeLessThan(0);
    expect(comparePaymentRefCandidates(b, a)).toBeGreaterThan(0);
  });
});
