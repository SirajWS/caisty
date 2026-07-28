import {
  createBrowserSyncEmitter,
  createPullPosSyncChanges,
  createPushPosSyncChanges,
  createRunSyncCycle,
  createSyncOutbox,
  createSyncState,
  type PosPullRequest,
  type PosSyncBatchRequest,
} from "@caisty/pos-sync-core";

import {
  CLOUD_BASE_URL,
  loadStoredDevice,
  type StoredDevice,
} from "../config/cloud.js";
import { storage } from "../platform/storage.js";
import { createLocalSyncRepository } from "./localRepository.js";

const syncState = createSyncState(storage);
const emitter = createBrowserSyncEmitter();
const outbox = createSyncOutbox(storage, {
  emitOutboxChanged: () => emitter.emitOutboxChanged(),
});
const repo = createLocalSyncRepository(outbox);

const DEFAULT_TIMEOUT_MS = 8000;

async function fetchJson(
  path: string,
  body: unknown,
  { idempotencyKey }: { idempotencyKey?: string } = {},
) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), DEFAULT_TIMEOUT_MS);
  try {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };
    if (idempotencyKey) {
      headers["Idempotency-Key"] = idempotencyKey;
    }

    const res = await fetch(`${CLOUD_BASE_URL}${path}`, {
      method: "POST",
      headers,
      body: JSON.stringify(body),
      signal: controller.signal,
    });

    let data: unknown = null;
    try {
      data = await res.json();
    } catch {
      data = null;
    }

    if (!res.ok) {
      const payload = data as { message?: string; error?: string } | null;
      const error = new Error(
        payload?.message || payload?.error || `HTTP ${res.status}`,
      ) as Error & { status?: number };
      error.status = res.status;
      throw error;
    }

    return data;
  } finally {
    clearTimeout(timeoutId);
  }
}

async function postPosSyncPull(request: PosPullRequest) {
  return fetchJson("/pos/sync/pull", request);
}

async function postPosSyncBatch(request: PosSyncBatchRequest) {
  return fetchJson("/pos/sync/batch", request, {
    idempotencyKey: request.idempotencyKey || request.batch.batchId,
  });
}

function getCredentials(): StoredDevice | null {
  return loadStoredDevice();
}

export const pullPosSyncChanges = createPullPosSyncChanges({
  api: { postPull: postPosSyncPull },
  syncState,
  repo,
  emitter,
  getCredentials,
  cloudBaseUrl: CLOUD_BASE_URL,
});

export const pushPosSyncChanges = createPushPosSyncChanges({
  api: { postBatch: postPosSyncBatch },
  outbox,
  syncState,
  getCredentials,
  getAppVersion: () => "0.1.0-pos-web",
});

export const runSyncCycle = createRunSyncCycle({
  pushPending: pushPosSyncChanges,
  pullChanges: pullPosSyncChanges,
});

export { emitter, outbox, syncState };
