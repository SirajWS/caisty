import { newSyncUuid } from "./syncIds.js";
import { EVT_SYNC_OUTBOX_CHANGED } from "./pullChangeEvents.js";
import type {
  KeyValueStorage,
  OutboxEvent,
  SyncOutboxEventType,
  SyncOutboxStatus,
} from "./types.js";

export const LS_SYNC_OUTBOX = "caisty_sync_outbox_v1";
export const MAX_OUTBOX_EVENTS = 5000;

export type SyncOutboxEmitter = {
  emitOutboxChanged?: () => void;
};

function defaultEmitOutboxChanged() {
  if (typeof window === "undefined") return;
  try {
    window.dispatchEvent(new Event(EVT_SYNC_OUTBOX_CHANGED));
  } catch {
    /* ignore */
  }
}

function normalizeEvent(event: Partial<OutboxEvent> & {
  type: string;
  localId?: string;
  payload?: Record<string, unknown>;
}): OutboxEvent {
  return {
    syncEventId: String(event.syncEventId || newSyncUuid()),
    type: event.type,
    localId: String(event.localId || ""),
    status: (event.status as SyncOutboxStatus) || "pending",
    occurredAt: event.occurredAt || new Date().toISOString(),
    payload:
      event.payload && typeof event.payload === "object" ? event.payload : {},
    attempts: Number(event.attempts) || 0,
    lastError: event.lastError ?? null,
    syncedAt: event.syncedAt ?? null,
    createdAt: Number(event.createdAt) || Date.now(),
  };
}

export function createSyncOutbox(
  storage: KeyValueStorage,
  emitter: SyncOutboxEmitter = {},
) {
  const emitChange = () => {
    if (emitter.emitOutboxChanged) emitter.emitOutboxChanged();
    else defaultEmitOutboxChanged();
  };

  function readRaw(): OutboxEvent[] {
    try {
      const raw = storage.getItem(LS_SYNC_OUTBOX);
      const parsed = raw ? JSON.parse(raw) : [];
      return Array.isArray(parsed) ? parsed.map((e) => normalizeEvent(e)) : [];
    } catch {
      return [];
    }
  }

  function writeRaw(events: OutboxEvent[]) {
    try {
      storage.setItem(LS_SYNC_OUTBOX, JSON.stringify(events));
      emitChange();
    } catch {
      /* ignore */
    }
  }

  function readOutbox() {
    return readRaw();
  }

  function replaceOutbox(events: Array<Partial<OutboxEvent> & { type: string }>) {
    writeRaw(events.map((e) => normalizeEvent(e)));
  }

  function enqueueOutboxEvent(
    event: Omit<
      OutboxEvent,
      "syncEventId" | "status" | "attempts" | "lastError" | "syncedAt" | "createdAt"
    > & { syncEventId?: string },
  ) {
    const events = readRaw();
    const rec = normalizeEvent({
      ...event,
      status: "pending",
      attempts: 0,
      lastError: null,
      syncedAt: null,
      createdAt: Date.now(),
    });

    const duplicate = events.some((e) => {
      if (e.syncEventId === rec.syncEventId) return true;
      // Shift uses open + closed snapshots per localId — dedupe by syncEventId only.
      if (rec.type === "shift") return false;
      return (
        e.localId === rec.localId &&
        e.type === rec.type &&
        e.status !== "failed"
      );
    });
    if (duplicate) return rec;

    const next = [rec, ...events].slice(0, MAX_OUTBOX_EVENTS);
    writeRaw(next);
    return rec;
  }

  function upsertOutboxEvent(
    event: Omit<
      OutboxEvent,
      "status" | "attempts" | "lastError" | "syncedAt" | "createdAt"
    > & { syncEventId?: string },
  ) {
    const events = readRaw();
    const rec = normalizeEvent({
      ...event,
      status: "pending",
      attempts: 0,
      lastError: null,
      syncedAt: null,
      createdAt: Date.now(),
    });

    const idx = events.findIndex((e) => e.syncEventId === rec.syncEventId);
    if (idx >= 0) {
      const prev = events[idx];
      const next = [...events];
      next[idx] = {
        ...prev,
        payload: rec.payload,
        occurredAt: rec.occurredAt,
        localId: rec.localId,
        type: rec.type as SyncOutboxEventType | string,
        status: "pending",
        lastError: null,
        syncedAt: null,
        attempts: prev.status === "failed" ? prev.attempts : 0,
      };
      writeRaw(next);
      return next[idx];
    }

    return enqueueOutboxEvent(rec);
  }

  function resetSyncingToPending() {
    const events = readRaw();
    let changed = false;
    const next = events.map((e) => {
      if (e.status === "syncing") {
        changed = true;
        return { ...e, status: "pending" as const };
      }
      return e;
    });
    if (changed) writeRaw(next);
  }

  function patchStatuses(
    syncEventIds: string[],
    patch: Partial<OutboxEvent>,
  ) {
    const idSet = new Set(syncEventIds);
    const events = readRaw();
    writeRaw(events.map((e) => (idSet.has(e.syncEventId) ? { ...e, ...patch } : e)));
  }

  function markEventsSyncing(syncEventIds: string[]) {
    patchStatuses(syncEventIds, { status: "syncing" });
  }

  function markEventsSynced(
    syncEventIds: string[],
    syncedAt = new Date().toISOString(),
  ) {
    patchStatuses(syncEventIds, {
      status: "synced",
      syncedAt,
      lastError: null,
    });
  }

  function markEventsFailed(
    syncEventIds: string[],
    errorMessage: string,
    { retry = true }: { retry?: boolean } = {},
  ) {
    const idSet = new Set(syncEventIds);
    const events = readRaw();
    writeRaw(
      events.map((e) => {
        if (!idSet.has(e.syncEventId)) return e;
        const attempts = (Number(e.attempts) || 0) + 1;
        return {
          ...e,
          status: retry ? ("pending" as const) : ("failed" as const),
          attempts,
          lastError: String(errorMessage || "sync_failed").slice(0, 500),
        };
      }),
    );
  }

  function revertEventsToPending(syncEventIds: string[], errorMessage: string) {
    markEventsFailed(syncEventIds, errorMessage, { retry: true });
  }

  function getPendingOutboxEvents(limit = 30, maxAttempts = 12) {
    return readRaw()
      .filter((e) => {
        const attempts = Number(e.attempts) || 0;
        return (
          (e.status === "pending" || e.status === "failed") &&
          attempts < maxAttempts
        );
      })
      .sort((a, b) => (a.createdAt || 0) - (b.createdAt || 0))
      .slice(0, limit);
  }

  function countPendingOutboxEvents() {
    return readRaw().filter(
      (e) => e.status === "pending" || e.status === "failed",
    ).length;
  }

  function countOutboxByStatus() {
    const counts = { pending: 0, syncing: 0, synced: 0, failed: 0 };
    for (const e of readRaw()) {
      if (e.status in counts) {
        counts[e.status as keyof typeof counts] += 1;
      }
    }
    return counts;
  }

  function getOutboxSyncSnapshot(maxAttempts = 12) {
    const events = readRaw();
    const byStatus = countOutboxByStatus();
    let exhausted = 0;
    let eligible = 0;

    for (const e of events) {
      const attempts = Number(e.attempts) || 0;
      const retryable = e.status === "pending" || e.status === "failed";
      if (!retryable) continue;
      if (attempts >= maxAttempts) exhausted += 1;
      else eligible += 1;
    }

    return {
      total: events.length,
      pending: byStatus.pending,
      syncing: byStatus.syncing,
      failed: byStatus.failed,
      synced: byStatus.synced,
      exhausted,
      eligible,
    };
  }

  return {
    readOutbox,
    replaceOutbox,
    enqueueOutboxEvent,
    upsertOutboxEvent,
    resetSyncingToPending,
    markEventsSyncing,
    markEventsSynced,
    markEventsFailed,
    revertEventsToPending,
    getPendingOutboxEvents,
    countPendingOutboxEvents,
    countOutboxByStatus,
    getOutboxSyncSnapshot,
  };
}

export type SyncOutboxApi = ReturnType<typeof createSyncOutbox>;
