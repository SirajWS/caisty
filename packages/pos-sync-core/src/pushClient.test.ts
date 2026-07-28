import { describe, expect, it, vi, beforeEach } from "vitest";

import { createPushPosSyncChanges } from "./pushClient.js";
import { createSyncOutbox } from "./syncOutbox.js";
import { createSyncState } from "./syncState.js";
import { makeMemoryStorage } from "./testHelpers.js";
import { validatePushResponse } from "./validatePushResponse.js";

describe("validatePushResponse", () => {
  it("accepts completed batch response", () => {
    const result = validatePushResponse({
      ok: true,
      status: "completed",
      accepted: ["a"],
      duplicate: [],
      failed: [],
    });
    expect(result.ok).toBe(true);
  });

  it("rejects invalid status", () => {
    const result = validatePushResponse({
      ok: true,
      status: "weird",
      accepted: [],
      duplicate: [],
      failed: [],
    });
    expect(result.ok).toBe(false);
  });
});

describe("createPushPosSyncChanges", () => {
  const storage = makeMemoryStorage();
  const syncState = createSyncState(storage);
  const outbox = createSyncOutbox(storage);
  const postBatch = vi.fn();

  beforeEach(() => {
    storage.clear();
    outbox.replaceOutbox([]);
    postBatch.mockReset();
  });

  it("skips when nothing is pending", async () => {
    const push = createPushPosSyncChanges({
      api: { postBatch },
      outbox,
      syncState,
      getCredentials: () => ({
        deviceId: "00000000-0000-0000-0000-000000000099",
        licenseKey: "CSTY-TEST-KEY",
        orgId: "org-1",
      }),
    });

    const result = await push();
    expect(result.ok).toBe(true);
    expect(result.reason).toBe("nothing_pending");
    expect(postBatch).not.toHaveBeenCalled();
  });

  it("posts order batch and marks accepted events as synced", async () => {
    outbox.enqueueOutboxEvent({
      syncEventId: "22222222-2222-4222-8222-222222222222",
      type: "order",
      localId: "s1",
      occurredAt: "2026-07-08T10:00:00.000Z",
      payload: {
        localOrderId: "s1",
        totalCents: 500,
        soldAt: "2026-07-08T10:00:00.000Z",
      },
    });

    postBatch.mockResolvedValue({
      ok: true,
      status: "completed",
      accepted: ["22222222-2222-4222-8222-222222222222"],
      duplicate: [],
      failed: [],
    });

    const push = createPushPosSyncChanges({
      api: { postBatch },
      outbox,
      syncState,
      getCredentials: () => ({
        deviceId: "00000000-0000-0000-0000-000000000099",
        licenseKey: "CSTY-TEST-KEY",
        orgId: "org-1",
      }),
    });

    const result = await push();
    expect(result.ok).toBe(true);
    expect(postBatch).toHaveBeenCalledTimes(1);

    const body = postBatch.mock.calls[0][0];
    expect(body.deviceId).toBe("00000000-0000-0000-0000-000000000099");
    expect(body.licenseKey).toBe("CSTY-TEST-KEY");
    expect(body.idempotencyKey).toBe(body.batch.batchId);
    expect(body.events).toHaveLength(1);
    expect(outbox.readOutbox()[0].status).toBe("synced");
  });

  it("posts batch of multiple events", async () => {
    for (let i = 0; i < 3; i += 1) {
      outbox.enqueueOutboxEvent({
        syncEventId: `cccccccc-cccc-4ccc-8ccc-${String(i).padStart(12, "0")}`,
        type: "order",
        localId: `sale-${i}`,
        occurredAt: "2026-07-08T10:00:00.000Z",
        payload: { localOrderId: `sale-${i}` },
      });
    }

    postBatch.mockImplementation(async (req) => ({
      ok: true,
      status: "completed",
      accepted: req.events.map((e: { eventId: string }) => e.eventId),
      duplicate: [],
      failed: [],
    }));

    const push = createPushPosSyncChanges({
      api: { postBatch },
      outbox,
      syncState,
      getCredentials: () => ({
        deviceId: "00000000-0000-0000-0000-000000000099",
        licenseKey: "KEY",
      }),
    });

    await push();
    expect(postBatch).toHaveBeenCalledTimes(1);
    expect(postBatch.mock.calls[0][0].events).toHaveLength(3);
    expect(outbox.readOutbox().every((e) => e.status === "synced")).toBe(true);
  });

  it("keeps outbox pending after network error and retries idempotently", async () => {
    const eventId = "dddddddd-dddd-4ddd-8ddd-dddddddddddd";
    outbox.enqueueOutboxEvent({
      syncEventId: eventId,
      type: "order",
      localId: "offline-order",
      occurredAt: "2026-07-08T10:00:00.000Z",
      payload: { localOrderId: "offline-order", totalCents: 500 },
    });

    postBatch.mockRejectedValueOnce(new Error("Failed to fetch"));

    const push = createPushPosSyncChanges({
      api: { postBatch },
      outbox,
      syncState,
      getCredentials: () => ({
        deviceId: "00000000-0000-0000-0000-000000000099",
        licenseKey: "KEY",
      }),
    });

    const failed = await push();
    expect(failed.ok).toBe(false);
    expect(outbox.readOutbox()[0].status).toBe("pending");
    expect(outbox.readOutbox()[0].attempts).toBe(1);

    postBatch.mockResolvedValueOnce({
      ok: true,
      status: "completed",
      accepted: [eventId],
      duplicate: [],
      failed: [],
    });

    const retry = await push();
    expect(retry.ok).toBe(true);
    expect(outbox.readOutbox()[0].status).toBe("synced");
    expect(postBatch).toHaveBeenCalledTimes(2);
  });

  it("marks per-event failures as failed and keeps them", async () => {
    outbox.enqueueOutboxEvent({
      syncEventId: "eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee",
      type: "shift",
      localId: "sh1",
      occurredAt: "2026-07-08T10:00:00.000Z",
      payload: { localShiftId: "sh1", status: "open" },
    });

    postBatch.mockResolvedValue({
      ok: true,
      status: "completed",
      accepted: [],
      duplicate: [],
      failed: [
        {
          eventId: "eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee",
          code: "invalid_shift_payload",
          error: "businessDate invalid",
        },
      ],
    });

    const push = createPushPosSyncChanges({
      api: { postBatch },
      outbox,
      syncState,
      getCredentials: () => ({
        deviceId: "00000000-0000-0000-0000-000000000099",
        licenseKey: "KEY",
      }),
    });

    await push();
    expect(outbox.readOutbox()[0].status).toBe("failed");
    expect(outbox.readOutbox()[0].lastError).toContain("businessDate");
  });

  it("requires device UUID credentials (device scope)", async () => {
    outbox.enqueueOutboxEvent({
      syncEventId: "ffffffff-ffff-4fff-8fff-ffffffffffff",
      type: "order",
      localId: "s1",
      occurredAt: "2026-07-08T10:00:00.000Z",
      payload: {},
    });

    const push = createPushPosSyncChanges({
      api: { postBatch },
      outbox,
      syncState,
      getCredentials: () => ({
        deviceId: "not-a-uuid",
        licenseKey: "KEY",
      }),
    });

    const result = await push();
    expect(result.ok).toBe(false);
    expect(result.reason).toBe("missing_credentials");
    expect(postBatch).not.toHaveBeenCalled();
  });

  it("chains batches when more than 30 eligible events remain", async () => {
    for (let i = 0; i < 35; i += 1) {
      outbox.enqueueOutboxEvent({
        syncEventId: `aaaaaaaa-aaaa-4aaa-8aaa-${String(i).padStart(12, "0")}`,
        type: "order",
        localId: `sale-${i}`,
        occurredAt: "2026-07-08T10:00:00.000Z",
        payload: { localOrderId: `sale-${i}` },
      });
    }

    postBatch.mockImplementation(async (req) => ({
      ok: true,
      status: "completed",
      accepted: req.events.map((e: { eventId: string }) => e.eventId),
      duplicate: [],
      failed: [],
    }));

    const push = createPushPosSyncChanges({
      api: { postBatch },
      outbox,
      syncState,
      getCredentials: () => ({
        deviceId: "00000000-0000-0000-0000-000000000099",
        licenseKey: "KEY",
      }),
    });

    const result = await push();
    expect(result.ok).toBe(true);
    expect(postBatch).toHaveBeenCalledTimes(2);
    expect(postBatch.mock.calls[0][0].events).toHaveLength(30);
    expect(postBatch.mock.calls[1][0].events).toHaveLength(5);
  });
});

describe("syncOutbox", () => {
  it("dedupes non-shift events by localId+type", () => {
    const storage = makeMemoryStorage();
    const outbox = createSyncOutbox(storage);
    outbox.enqueueOutboxEvent({
      type: "order",
      localId: "o1",
      occurredAt: "2026-07-08T10:00:00.000Z",
      payload: { a: 1 },
    });
    outbox.enqueueOutboxEvent({
      type: "order",
      localId: "o1",
      occurredAt: "2026-07-08T11:00:00.000Z",
      payload: { a: 2 },
    });
    expect(outbox.readOutbox()).toHaveLength(1);
  });
});
