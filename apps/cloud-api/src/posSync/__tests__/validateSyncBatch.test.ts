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

const RECEIPT_EVENT_ID = "44444444-4444-4444-8444-444444444444";

describe("validateSyncBatchRequest receipt_event", () => {
  it("accepts a valid receipt_event payload", () => {
    const result = validateSyncBatchRequest({
      deviceId: DEVICE_ID,
      licenseKey: "CSTY-TEST",
      batch: { batchId: BATCH_ID },
      events: [
        {
          eventId: EVENT_ID,
          type: "receipt_event",
          payload: {
            eventId: RECEIPT_EVENT_ID,
            eventType: "created",
            localReceiptId: "rcpt-local-1",
            occurredAt: "2026-07-08T10:06:00.000Z",
            schemaVersion: 1,
            actor: "cashier-1",
            payload: { source: "pos" },
          },
        },
      ],
    });

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.request.events[0]?.type).toBe("receipt_event");
    }
  });

  it("falls back to sync eventId when payload eventId is omitted", () => {
    const result = validateSyncBatchRequest({
      deviceId: DEVICE_ID,
      licenseKey: "CSTY-TEST",
      batch: { batchId: BATCH_ID },
      events: [
        {
          eventId: EVENT_ID,
          type: "receipt_event",
          payload: {
            eventType: "printed",
            localReceiptId: "rcpt-local-1",
            occurredAt: "2026-07-08T10:06:00.000Z",
            schemaVersion: 1,
          },
        },
      ],
    });

    expect(result.ok).toBe(true);
    if (result.ok) {
      const payload = result.request.events[0]?.payload as {
        eventId?: string;
      };
      expect(payload.eventId).toBe(EVENT_ID);
    }
  });

  it("rejects unsupported receipt event types", () => {
    const result = validateSyncBatchRequest({
      deviceId: DEVICE_ID,
      licenseKey: "CSTY-TEST",
      batch: { batchId: BATCH_ID },
      events: [
        {
          eventId: EVENT_ID,
          type: "receipt_event",
          payload: {
            eventId: RECEIPT_EVENT_ID,
            eventType: "refunded",
            localReceiptId: "rcpt-local-1",
            occurredAt: "2026-07-08T10:06:00.000Z",
            schemaVersion: 1,
          },
        },
      ],
    });

    expect(result.ok).toBe(false);
  });

  it("rejects unsupported schema versions", () => {
    const result = validateSyncBatchRequest({
      deviceId: DEVICE_ID,
      licenseKey: "CSTY-TEST",
      batch: { batchId: BATCH_ID },
      events: [
        {
          eventId: EVENT_ID,
          type: "receipt_event",
          payload: {
            eventId: RECEIPT_EVENT_ID,
            eventType: "created",
            localReceiptId: "rcpt-local-1",
            occurredAt: "2026-07-08T10:06:00.000Z",
            schemaVersion: 2,
          },
        },
      ],
    });

    expect(result.ok).toBe(false);
  });

  it("keeps backward compatibility for batches without receipt_event", () => {
    const result = validateSyncBatchRequest({
      deviceId: DEVICE_ID,
      licenseKey: "CSTY-TEST",
      batch: { batchId: BATCH_ID },
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
        {
          eventId: "33333333-3333-4333-8333-333333333333",
          type: "receipt",
          payload: {
            localReceiptId: "rcpt-1",
            netCents: 1000,
            grossCents: 1190,
            soldAt: "2026-07-08T10:05:00.000Z",
          },
        },
      ],
    });

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.request.events.every((event) => event.type !== "receipt_event")).toBe(
        true,
      );
    }
  });
});

const SHIFT_ID = "55555555-5555-4555-8555-555555555555";

describe("validateSyncBatchRequest shift", () => {
  it("accepts an open shift event", () => {
    const result = validateSyncBatchRequest({
      deviceId: DEVICE_ID,
      licenseKey: "CSTY-TEST",
      batch: { batchId: BATCH_ID },
      events: [
        {
          eventId: SHIFT_ID,
          type: "shift",
          payload: {
            localShiftId: "shift-local-1",
            status: "open",
            cashier: "Anna",
            businessDate: "2026-07-14",
            startedAt: "2026-07-14T08:00:00.000Z",
            openingFloatMinor: 5000,
            schemaVersion: 1,
            currency: "EUR",
          },
        },
      ],
    });

    expect(result.ok).toBe(true);
  });

  it("requires endedAt for closed shift", () => {
    const result = validateSyncBatchRequest({
      deviceId: DEVICE_ID,
      licenseKey: "CSTY-TEST",
      batch: { batchId: BATCH_ID },
      events: [
        {
          eventId: SHIFT_ID,
          type: "shift",
          payload: {
            localShiftId: "shift-local-1",
            status: "closed",
            businessDate: "2026-07-14",
            startedAt: "2026-07-14T08:00:00.000Z",
            openingFloatMinor: 5000,
            schemaVersion: 1,
          },
        },
      ],
    });

    expect(result.ok).toBe(false);
  });

  it("keeps backward compatibility for batches without shift", () => {
    const result = validateSyncBatchRequest({
      deviceId: DEVICE_ID,
      licenseKey: "CSTY-TEST",
      batch: { batchId: BATCH_ID },
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
  });
});
