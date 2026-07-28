import {
  EMPTY_PULL_CURSORS,
  PULL_ENTITY_TYPES,
  PULL_SCHEMA_VERSION,
  type KeyValueStorage,
  type PullCursors,
  type PullEntityType,
} from "./types.js";

const LS_SYNC_STATE = "caisty_sync_state_v1";

const DEFAULT_PULL_SCOPE_STATE = {
  ...EMPTY_PULL_CURSORS,
  lastPullAt: null as string | null,
  consecutiveFailures: 0,
  backoffUntil: null as number | null,
};

function readLS(storage: KeyValueStorage, key: string, fallback: unknown) {
  try {
    const raw = storage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function writeLS(storage: KeyValueStorage, key: string, value: unknown) {
  try {
    storage.setItem(key, JSON.stringify(value));
  } catch {
    /* ignore */
  }
}

export function createSyncState(storage: KeyValueStorage) {
  function readRawState() {
    const state = readLS(storage, LS_SYNC_STATE, {});
    return state && typeof state === "object" ? (state as Record<string, unknown>) : {};
  }

  function writeRawState(patch: Record<string, unknown>) {
    const state = readRawState();
    writeLS(storage, LS_SYNC_STATE, { ...state, ...patch });
  }

  function getPullScopeKey(baseUrl: string, orgId: string | null | undefined) {
    const env = String(baseUrl || "").replace(/\/+$/, "");
    const org = String(orgId ?? "").trim();
    return `env:${env}|org:${org || "unknown"}`;
  }

  function normalizePullScopeState(raw: unknown) {
    const src = raw && typeof raw === "object" ? (raw as Record<string, unknown>) : {};
    const cursors = { ...EMPTY_PULL_CURSORS };
    for (const key of PULL_ENTITY_TYPES) {
      cursors[key] = typeof src[key] === "string" ? (src[key] as string) : null;
    }
    return {
      ...cursors,
      lastPullAt: typeof src.lastPullAt === "string" ? src.lastPullAt : null,
      consecutiveFailures:
        typeof src.consecutiveFailures === "number" && src.consecutiveFailures >= 0
          ? src.consecutiveFailures
          : 0,
      backoffUntil:
        typeof src.backoffUntil === "number" && src.backoffUntil > 0
          ? (src.backoffUntil as number)
          : null,
    };
  }

  function getPullState(scopeKey: string) {
    const state = readRawState();
    const pullCursors =
      state.pullCursors && typeof state.pullCursors === "object"
        ? (state.pullCursors as Record<string, unknown>)
        : {};
    const bucket = pullCursors[scopeKey];
    return normalizePullScopeState(bucket ?? DEFAULT_PULL_SCOPE_STATE);
  }

  function getPullCursors(scopeKey: string): PullCursors {
    const state = getPullState(scopeKey);
    return {
      orders: state.orders,
      receipts: state.receipts,
      payments: state.payments,
      receiptEvents: state.receiptEvents,
      shifts: state.shifts,
    };
  }

  function savePullCursors(cursors: PullCursors, scopeKey: string) {
    const current = getPullState(scopeKey);
    const nextCursors = { ...EMPTY_PULL_CURSORS };
    for (const key of PULL_ENTITY_TYPES) {
      nextCursors[key] =
        cursors && typeof cursors[key] === "string" ? cursors[key] : null;
    }
    const state = readRawState();
    const pullCursors =
      state.pullCursors && typeof state.pullCursors === "object"
        ? (state.pullCursors as Record<string, unknown>)
        : {};
    writeRawState({
      pullCursors: {
        ...pullCursors,
        [scopeKey]: {
          ...current,
          ...nextCursors,
        },
      },
    });
  }

  function updatePullSuccess(scopeKey: string) {
    const current = getPullState(scopeKey);
    const state = readRawState();
    const pullCursors =
      state.pullCursors && typeof state.pullCursors === "object"
        ? (state.pullCursors as Record<string, unknown>)
        : {};
    writeRawState({
      pullCursors: {
        ...pullCursors,
        [scopeKey]: {
          ...current,
          lastPullAt: new Date().toISOString(),
          consecutiveFailures: 0,
          backoffUntil: null,
        },
      },
    });
  }

  function updatePullFailure(
    scopeKey: string,
    { retryAfterMs = 60_000 }: { retryAfterMs?: number } = {},
  ) {
    const current = getPullState(scopeKey);
    const failures = (current.consecutiveFailures || 0) + 1;
    const backoffMs = Math.min(retryAfterMs * failures, 15 * 60_000);
    const state = readRawState();
    const pullCursors =
      state.pullCursors && typeof state.pullCursors === "object"
        ? (state.pullCursors as Record<string, unknown>)
        : {};
    writeRawState({
      pullCursors: {
        ...pullCursors,
        [scopeKey]: {
          ...current,
          consecutiveFailures: failures,
          backoffUntil: Date.now() + backoffMs,
        },
      },
    });
  }

  function isPullBackedOff(scopeKey: string) {
    const state = getPullState(scopeKey);
    return Boolean(state.backoffUntil && Date.now() < state.backoffUntil);
  }

  return {
    getPullScopeKey,
    getPullCursors,
    savePullCursors,
    updatePullSuccess,
    updatePullFailure,
    isPullBackedOff,
  };
}

export type SyncStateApi = ReturnType<typeof createSyncState>;

export { PULL_ENTITY_TYPES, PULL_SCHEMA_VERSION };
