import { describe, expect, it } from "vitest";

import { validatePullResponse } from "./validatePullResponse.js";
import { shouldSkipPullOverwrite } from "./pendingOutboxGuard.js";
import { deviceLocalKey, isProviderCloudOrder } from "./pullDeviceMatch.js";

const baseResponse = {
  ok: true,
  schemaVersion: 1,
  serverTime: "2026-07-28T10:00:00.000Z",
  scope: { orgId: "org-1", deviceId: "dev-1" },
  changes: {
    orders: [],
    receipts: [],
    payments: [],
    receiptEvents: [],
    shifts: [],
  },
  nextCursors: {
    orders: null,
    receipts: null,
    payments: null,
    receiptEvents: null,
    shifts: null,
  },
  hasMore: {
    orders: false,
    receipts: false,
    payments: false,
    receiptEvents: false,
    shifts: false,
  },
};

describe("validatePullResponse", () => {
  it("accepts valid empty pull response", () => {
    const result = validatePullResponse(baseResponse);
    expect(result.ok).toBe(true);
  });

  it("rejects invalid schema version", () => {
    const result = validatePullResponse({ ...baseResponse, schemaVersion: 2 });
    expect(result.ok).toBe(false);
  });
});

describe("pendingOutboxGuard", () => {
  it("skips pull overwrite when pending outbox exists", () => {
    const outbox = [
      {
        localId: "order-1",
        type: "order",
        status: "pending" as const,
        createdAt: Date.now(),
      },
    ];
    expect(
      shouldSkipPullOverwrite(outbox, {
        localId: "order-1",
        outboxType: "order",
        localUpdatedAt: Date.now(),
        cloudUpdatedAt: Date.now() - 1000,
      }),
    ).toBe(true);
  });
});

describe("pullDeviceMatch", () => {
  it("builds device-scoped local keys", () => {
    expect(deviceLocalKey("dev-a", "100")).toBe("dev-a|100");
  });

  it("detects provider cloud orders", () => {
    expect(
      isProviderCloudOrder({
        id: "1",
        localOrderId: "l1",
        providerOrderId: "p1",
        platform: "lieferando",
        sourceDeviceId: "d1",
        status: "accepted",
        paymentStatus: null,
        paymentMethod: null,
        totalCents: 100,
        currency: "EUR",
        soldAt: "",
        createdAt: "",
        updatedAt: "",
        lines: [],
      }),
    ).toBe(true);
  });
});
