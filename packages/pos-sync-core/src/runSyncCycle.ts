let cycleInFlight = false;
let cycleReschedule = false;

export function createRunSyncCycle(deps: {
  pushPending: () => Promise<{ ok: boolean }>;
  pullChanges: () => Promise<{ ok: boolean }>;
}) {
  async function runSyncCycle() {
    if (cycleInFlight) {
      cycleReschedule = true;
      return { ok: false as const, reason: "cycle_in_flight" };
    }

    cycleInFlight = true;
    const startedAt = Date.now();

    try {
      const pushResult = await deps.pushPending();
      const pullResult = await deps.pullChanges();
      return {
        ok: pushResult.ok !== false && pullResult.ok !== false,
        push: pushResult,
        pull: pullResult,
        durationMs: Date.now() - startedAt,
      };
    } catch (err) {
      return {
        ok: false as const,
        reason: err instanceof Error ? err.message : "cycle_failed",
        durationMs: Date.now() - startedAt,
      };
    } finally {
      cycleInFlight = false;
      if (cycleReschedule) {
        cycleReschedule = false;
        queueMicrotask(() => {
          void runSyncCycle();
        });
      }
    }
  }

  return runSyncCycle;
}

export function resetSyncCycleLockForTests() {
  cycleInFlight = false;
  cycleReschedule = false;
}

export function isSyncCycleInFlight() {
  return cycleInFlight;
}
