import { describe, expect, it } from "vitest";

import {
  isUuid,
  validateSyncBatchRequest,
} from "../validateSyncBatch.js";

const DEVICE_ID = "00000000-0000-0000-0000-000000000099";
const BATCH_ID = "11111111-1111-4111-8111-111111111111";
const EVENT_ID = "22222222-2222-4222-8222-222222222222";

describe("validateSyncBatchRequest", () => {
  it("accepts a minimal order batch", () => {
    const result = validateSyncBatchRequest({
      deviceId: DEVICE_ID,
      licenseKey: "CSTY-TEST",
      batch: { batchId: BATCH_ID, sequence: 1 },
      events: [
        {
          eventId: EVENT_ID,
          type: "order",
          payload: {
            localOrderId: "order-local-1",
            totalCents: 1250,
            soldAt: "2026-07-08T10:00:00.000Z",
          },
        },
      ],
    });

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.request.events).toHaveLength(1);
      expect(result.request.batch.batchId).toBe(BATCH_ID);
    }
  });

  it("rejects missing deviceId and licenseKey", () => {
    const result = validateSyncBatchRequest({
      batch: { batchId: BATCH_ID },
      events: [],
    });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe("invalid_request");
    }
  });

  it("rejects invalid event type", () => {
    const result = validateSyncBatchRequest({
      deviceId: DEVICE_ID,
      licenseKey: "CSTY-TEST",
      batch: { batchId: BATCH_ID },
      events: [
        {
          eventId: EVENT_ID,
          type: "shift",
          payload: {},
        },
      ],
    });

    expect(result.ok).toBe(false);
  });

  it("accepts receipt and payment events", () => {
    const result = validateSyncBatchRequest({
      deviceId: DEVICE_ID,
      licenseKey: "CSTY-TEST",
      batch: { batchId: BATCH_ID },
      events: [
        {
          eventId: EVENT_ID,
          type: "receipt",
          payload: {
            localReceiptId: "rcpt-1",
            netCents: 1000,
            grossCents: 1190,
            soldAt: "2026-07-08T10:05:00.000Z",
          },
        },
        {
          eventId: "33333333-3333-4333-8333-333333333333",
          type: "payment",
          payload: {
            localPaymentId: "pay-1",
            method: "cash",
            amountCents: 1190,
            paidAt: "2026-07-08T10:05:01.000Z",
          },
        },
      ],
    });

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.request.events).toHaveLength(2);
    }
  });
});

describe("isUuid", () => {
  it("validates canonical UUIDs", () => {
    expect(isUuid(DEVICE_ID)).toBe(true);
    expect(isUuid("not-a-uuid")).toBe(false);
  });
});
