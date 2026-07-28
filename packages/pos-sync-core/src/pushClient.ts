import { isSyncUuid, newSyncUuid } from "./syncIds.js";
import type { SyncOutboxApi } from "./syncOutbox.js";
import type { SyncStateApi } from "./syncState.js";
import {
  BATCH_EVENT_LIMIT,
  MAX_PUSH_BATCHES_PER_RUN,
  MAX_SYNC_ATTEMPTS,
  type PullCredentials,
  type PushApiClient,
} from "./types.js";
import { validatePushResponse } from "./validatePushResponse.js";

function isRetryableStatus(status: number | undefined | null) {
  if (status == null) return true;
  if (status >= 500) return true;
  if (status === 408 || status === 429) return true;
  return false;
}

function outboxToApiEvent(entry: {
  syncEventId: string;
  type: string;
  payload: Record<string, unknown>;
}) {
  return {
    eventId: entry.syncEventId,
    type: entry.type,
    payload: entry.payload,
  };
}

export function createPushPosSyncChanges(deps: {
  api: PushApiClient;
  outbox: SyncOutboxApi;
  syncState: SyncStateApi;
  getCredentials: () => PullCredentials | null;
  getAppVersion?: () => string;
}) {
  return async function pushPosSyncChanges() {
    const creds = deps.getCredentials();
    const deviceId = creds?.deviceId;
    const licenseKey = creds?.licenseKey;

    if (!isSyncUuid(deviceId) || !licenseKey) {
      return { ok: false as const, reason: "missing_credentials" };
    }

    let lastResult: {
      ok: boolean;
      reason?: string;
      response?: unknown;
      status?: number;
      batchesRun?: number;
    } = { ok: true, reason: "nothing_pending" };
    let postedAny = false;
    let batchesRun = 0;

    while (batchesRun < MAX_PUSH_BATCHES_PER_RUN) {
      const snapshot = deps.outbox.getOutboxSyncSnapshot(MAX_SYNC_ATTEMPTS);
      const pending = deps.outbox.getPendingOutboxEvents(
        BATCH_EVENT_LIMIT,
        MAX_SYNC_ATTEMPTS,
      );

      if (pending.length === 0) {
        if (!postedAny) {
          const reason =
            snapshot.eligible === 0 && snapshot.pending + snapshot.failed > 0
              ? "no_eligible_events"
              : snapshot.syncing > 0 && snapshot.eligible === 0
                ? "all_events_syncing"
                : "nothing_pending";
          lastResult = { ok: true, reason };
        }
        break;
      }

      const posBatchId = newSyncUuid();
      const syncEventIds = pending.map((e) => e.syncEventId);
      deps.outbox.markEventsSyncing(syncEventIds);

      try {
        const response = await deps.api.postBatch({
          deviceId: deviceId!,
          licenseKey,
          batch: {
            batchId: posBatchId,
            sequence: deps.syncState.nextBatchSequence(),
            sentAt: new Date().toISOString(),
          },
          telemetry: {
            appVersion: deps.getAppVersion?.() ?? "pos-web",
            offlineQueueCount: deps.outbox.countPendingOutboxEvents(),
          },
          events: pending.map(outboxToApiEvent),
          idempotencyKey: posBatchId,
        });

        const validated = validatePushResponse(response);
        if (!validated.ok) {
          deps.outbox.markEventsFailed(syncEventIds, validated.reason, {
            retry: true,
          });
          lastResult = { ok: false, reason: validated.reason };
          break;
        }

        const data = validated.data;
        const accepted = data.accepted;
        const duplicate = data.duplicate;
        const failed = data.failed;

        const successIds = new Set([...accepted, ...duplicate]);
        const syncedIds = syncEventIds.filter((id) => successIds.has(id));
        if (syncedIds.length > 0) {
          deps.outbox.markEventsSynced(syncedIds);
        }

        for (const fail of failed) {
          if (fail?.eventId) {
            deps.outbox.markEventsFailed(
              [fail.eventId],
              fail.error || fail.code || "event_failed",
              { retry: false },
            );
          }
        }

        const unresolved = syncEventIds.filter(
          (id) =>
            !successIds.has(id) && !failed.some((f) => f?.eventId === id),
        );
        if (unresolved.length > 0) {
          deps.outbox.revertEventsToPending(
            unresolved,
            "batch_partial_unknown",
          );
        }

        if (syncedIds.length > 0 || data.status === "duplicate_batch") {
          deps.syncState.setLastSalesSyncAt(new Date().toISOString());
        }

        postedAny = true;
        lastResult = {
          ok: true,
          response: data,
          batchesRun: batchesRun + 1,
        };
        batchesRun += 1;

        if (
          deps.outbox.getOutboxSyncSnapshot(MAX_SYNC_ATTEMPTS).eligible === 0
        ) {
          break;
        }
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "sync_batch_failed";
        const status = (err as { status?: number }).status;
        const retry = isRetryableStatus(status);
        deps.outbox.markEventsFailed(syncEventIds, message, { retry });
        lastResult = { ok: false, reason: message, status };
        break;
      }
    }

    return {
      ...lastResult,
      batchesRun,
      truncated:
        batchesRun >= MAX_PUSH_BATCHES_PER_RUN &&
        deps.outbox.getOutboxSyncSnapshot(MAX_SYNC_ATTEMPTS).eligible > 0,
    };
  };
}
