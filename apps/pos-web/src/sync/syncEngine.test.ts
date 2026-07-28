import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  createPushPosSyncChanges,
  createRunSyncCycle,
  createSyncOutbox,
  createSyncState,
  EVT_ORDERS_CHANGED,
  EVT_SALES_CHANGED,
  EVT_SHIFTS_CHANGED,
  EVT_SYNC_OUTBOX_CHANGED,
  isSyncCycleInFlight,
  resetSyncCycleLockForTests,
} from "@caisty/pos-sync-core";

import { createLocalSyncRepository, readLocalCounts } from "./localRepository.js";

describe("pos-web push integration", () => {
  beforeEach(() => {
    localStorage.clear();
    resetSyncCycleLockForTests();
  });

  it("enqueues local changes into outbox while offline", () => {
    const outbox = createSyncOutbox({
      getItem: (k) => localStorage.getItem(k),
      setItem: (k, v) => localStorage.setItem(k, v),
    });

    outbox.enqueueOutboxEvent({
      syncEventId: "22222222-2222-4222-8222-222222222222",
      type: "order",
      localId: "local-1",
      occurredAt: "2026-07-08T10:00:00.000Z",
      payload: { localOrderId: "local-1", totalCents: 1000 },
    });

    const counts = readLocalCounts(outbox);
    expect(counts.outboxPending).toBe(1);
    expect(outbox.readOutbox()[0].status).toBe("pending");
  });

  it("ACK removes accepted events from pending outbox", async () => {
    const storage = {
      getItem: (k: string) => localStorage.getItem(k),
      setItem: (k: string, v: string) => localStorage.setItem(k, v),
    };
    const outbox = createSyncOutbox(storage);
    const syncState = createSyncState(storage);
    const eventId = "33333333-3333-4333-8333-333333333333";

    outbox.enqueueOutboxEvent({
      syncEventId: eventId,
      type: "order",
      localId: "o1",
      occurredAt: "2026-07-08T10:00:00.000Z",
      payload: { localOrderId: "o1" },
    });

    const postBatch = vi.fn().mockResolvedValue({
      ok: true,
      status: "completed",
      accepted: [eventId],
      duplicate: [],
      failed: [],
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

    const result = await push();
    expect(result.ok).toBe(true);
    expect(outbox.readOutbox()[0].status).toBe("synced");
    expect(readLocalCounts(outbox).outboxPending).toBe(0);
  });

  it("keeps outbox on push failure and retries on reconnect cycle", async () => {
    const storage = {
      getItem: (k: string) => localStorage.getItem(k),
      setItem: (k: string, v: string) => localStorage.setItem(k, v),
    };
    const outbox = createSyncOutbox(storage);
    const syncState = createSyncState(storage);
    const eventId = "44444444-4444-4444-8444-444444444444";

    outbox.enqueueOutboxEvent({
      syncEventId: eventId,
      type: "receipt",
      localId: "r1",
      occurredAt: "2026-07-08T10:00:00.000Z",
      payload: { localReceiptId: "r1" },
    });

    const postBatch = vi
      .fn()
      .mockRejectedValueOnce(Object.assign(new Error("offline"), { status: undefined }))
      .mockResolvedValueOnce({
        ok: true,
        status: "completed",
        accepted: [eventId],
        duplicate: [],
        failed: [],
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

    const pull = vi.fn().mockResolvedValue({ ok: true });
    const runSyncCycle = createRunSyncCycle({
      pushPending: push,
      pullChanges: pull,
    });

    const first = await runSyncCycle();
    expect(first.ok).toBe(false);
    expect(outbox.readOutbox()[0].status).toBe("pending");

    const second = await runSyncCycle();
    expect(second.ok).toBe(true);
    expect(outbox.readOutbox()[0].status).toBe("synced");
    expect(pull).toHaveBeenCalledTimes(2);
  });

  it("blocks parallel sync cycles with mutex", async () => {
    let release: (() => void) | undefined;
    const pushPending = vi.fn(
      () =>
        new Promise<{ ok: boolean }>((resolve) => {
          release = () => resolve({ ok: true });
        }),
    );
    const pullChanges = vi.fn(async () => ({ ok: true }));
    const runSyncCycle = createRunSyncCycle({ pushPending, pullChanges });

    const first = runSyncCycle();
    await Promise.resolve();
    expect(isSyncCycleInFlight()).toBe(true);
    const second = await runSyncCycle();
    expect(second.reason).toBe("cycle_in_flight");
    release?.();
    await first;
    resetSyncCycleLockForTests();
  });

  it("refreshes UI listeners on outbox and entity events without reload", () => {
    const handler = vi.fn();
    for (const name of [
      EVT_ORDERS_CHANGED,
      EVT_SALES_CHANGED,
      EVT_SHIFTS_CHANGED,
      EVT_SYNC_OUTBOX_CHANGED,
    ]) {
      window.addEventListener(name, handler);
    }

    window.dispatchEvent(new Event(EVT_ORDERS_CHANGED));
    window.dispatchEvent(new Event(EVT_SYNC_OUTBOX_CHANGED));
    expect(handler).toHaveBeenCalledTimes(2);

    for (const name of [
      EVT_ORDERS_CHANGED,
      EVT_SALES_CHANGED,
      EVT_SHIFTS_CHANGED,
      EVT_SYNC_OUTBOX_CHANGED,
    ]) {
      window.removeEventListener(name, handler);
    }
  });

  it("local repository reads shared outbox key", () => {
    const outbox = createSyncOutbox({
      getItem: (k) => localStorage.getItem(k),
      setItem: (k, v) => localStorage.setItem(k, v),
    });
    outbox.enqueueOutboxEvent({
      type: "payment",
      localId: "p1",
      occurredAt: "2026-07-08T10:00:00.000Z",
      payload: { localPaymentId: "p1" },
    });
    const repo = createLocalSyncRepository(outbox);
    expect(repo.readOutbox()).toHaveLength(1);
    expect(repo.readOutbox()[0].type).toBe("payment");
  });
});
