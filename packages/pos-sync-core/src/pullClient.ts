import { createApplyPullSnapshots } from "./applyPullSnapshots.js";
import {
  DEFAULT_PULL_LIMIT,
  MAX_PAGES_PER_RUN,
  PULL_ENTITY_TYPES,
  type PullApiClient,
  type PullCredentials,
  type SyncChangeEmitter,
} from "./types.js";
import type { SyncStateApi } from "./syncState.js";
import { validatePullResponse } from "./validatePullResponse.js";
import type { LocalSyncRepository } from "./applyPullSnapshots.js";

function anyHasMore(hasMore: Record<string, boolean>) {
  return PULL_ENTITY_TYPES.some((key) => Boolean(hasMore[key]));
}

function cursorsEqual(
  a: Record<string, string | null>,
  b: Record<string, string | null>,
) {
  return PULL_ENTITY_TYPES.every((key) => (a[key] ?? null) === (b[key] ?? null));
}

function countChanges(changes: Record<string, unknown[]>) {
  return PULL_ENTITY_TYPES.reduce(
    (sum, key) => sum + (Array.isArray(changes[key]) ? changes[key].length : 0),
    0,
  );
}

export function createPullPosSyncChanges(deps: {
  api: PullApiClient;
  syncState: SyncStateApi;
  repo: LocalSyncRepository;
  emitter: SyncChangeEmitter;
  getCredentials: () => PullCredentials | null;
  cloudBaseUrl: string;
  limit?: number;
}) {
  const applyPullSnapshots = createApplyPullSnapshots(deps.repo, deps.emitter);
  const limit = deps.limit ?? DEFAULT_PULL_LIMIT;

  return async function pullPosSyncChanges() {
    const creds = deps.getCredentials();
    if (!creds?.deviceId || !creds.licenseKey) {
      return { ok: false as const, reason: "missing_credentials" };
    }

    const scopeKey = deps.syncState.getPullScopeKey(
      deps.cloudBaseUrl,
      creds.orgId ?? null,
    );

    if (deps.syncState.isPullBackedOff(scopeKey)) {
      return { ok: false as const, reason: "backoff", scopeKey };
    }

    let cursors = deps.syncState.getPullCursors(scopeKey);
    let pages = 0;
    let totalApplied = 0;

    try {
      while (pages < MAX_PAGES_PER_RUN) {
        const previousCursors = { ...cursors };
        const response = await deps.api.postPull({
          schemaVersion: 1,
          deviceId: creds.deviceId,
          licenseKey: creds.licenseKey,
          cursors,
          limit,
        });

        const validated = validatePullResponse(response);
        if (!validated.ok) {
          return {
            ok: false as const,
            reason: validated.reason,
            scopeKey,
            permanent: true,
          };
        }

        const data = validated.data;
        const changeCount = countChanges(
          data.changes as unknown as Record<string, unknown[]>,
        );
        const applyResult = applyPullSnapshots(data.changes);
        if (!applyResult.ok) {
          return {
            ok: false as const,
            reason: applyResult.error || "apply_failed",
            scopeKey,
          };
        }

        totalApplied += Object.values(applyResult.applied).reduce((a, b) => a + b, 0);
        cursors = { ...data.nextCursors };
        deps.syncState.savePullCursors(cursors, scopeKey);
        pages += 1;

        const stuck =
          anyHasMore(data.hasMore) &&
          cursorsEqual(previousCursors, cursors) &&
          changeCount === 0;
        if (stuck) {
          return {
            ok: false as const,
            reason: "cursor_stuck",
            scopeKey,
            pages,
            totalApplied,
          };
        }

        if (!anyHasMore(data.hasMore)) break;
      }

      deps.syncState.updatePullSuccess(scopeKey);
      return {
        ok: true as const,
        reason: totalApplied === 0 && pages <= 1 ? "empty_pull" : "completed",
        scopeKey,
        pages,
        totalApplied,
        truncated: pages >= MAX_PAGES_PER_RUN,
      };
    } catch (err) {
      const status = (err as { status?: number }).status;
      if (status && status >= 500) {
        deps.syncState.updatePullFailure(scopeKey);
      }
      return {
        ok: false as const,
        reason: err instanceof Error ? err.message : "pull_failed",
        status,
        scopeKey,
      };
    }
  };
}
