import { describe, expect, it, vi, beforeEach } from "vitest";

import {
  createRunSyncCycle,
  isSyncCycleInFlight,
  resetSyncCycleLockForTests,
} from "./runSyncCycle.js";

describe("createRunSyncCycle", () => {
  const pushPending = vi.fn(async () => ({ ok: true }));
  const pullChanges = vi.fn(async () => ({ ok: true }));

  beforeEach(() => {
    resetSyncCycleLockForTests();
    pushPending.mockClear();
    pullChanges.mockClear();
    pushPending.mockResolvedValue({ ok: true });
    pullChanges.mockResolvedValue({ ok: true });
  });

  it("runs push before pull", async () => {
    const order: string[] = [];
    pushPending.mockImplementation(async () => {
      order.push("push");
      return { ok: true };
    });
    pullChanges.mockImplementation(async () => {
      order.push("pull");
      return { ok: true };
    });

    const runSyncCycle = createRunSyncCycle({ pushPending, pullChanges });
    await runSyncCycle();
    expect(order).toEqual(["push", "pull"]);
  });

  it("pulls even when push queue is empty", async () => {
    const runSyncCycle = createRunSyncCycle({ pushPending, pullChanges });
    await runSyncCycle();
    expect(pullChanges).toHaveBeenCalledTimes(1);
  });

  it("prevents parallel cycles with mutex", async () => {
    let releasePush: (() => void) | undefined;
    pushPending.mockImplementation(
      () =>
        new Promise<{ ok: boolean }>((resolve) => {
          releasePush = () => resolve({ ok: true });
        }),
    );

    const runSyncCycle = createRunSyncCycle({ pushPending, pullChanges });
    const first = runSyncCycle();
    await Promise.resolve();
    expect(isSyncCycleInFlight()).toBe(true);

    const second = await runSyncCycle();
    expect(second.reason).toBe("cycle_in_flight");

    releasePush?.();
    await first;
    resetSyncCycleLockForTests();
    expect(isSyncCycleInFlight()).toBe(false);
  });
});
