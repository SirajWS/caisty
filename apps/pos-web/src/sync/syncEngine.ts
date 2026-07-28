import {
  createBrowserSyncEmitter,
  createPullPosSyncChanges,
  createRunSyncCycle,
  createSyncState,
  type PosPullRequest,
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
const repo = createLocalSyncRepository();

async function postPosSyncPull(request: PosPullRequest) {
  const res = await fetch(`${CLOUD_BASE_URL}/pos/sync/pull`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(request),
  });
  const data = await res.json();
  if (!res.ok) {
    const error = new Error(
      typeof data?.message === "string" ? data.message : `HTTP ${res.status}`,
    ) as Error & { status?: number };
    error.status = res.status;
    throw error;
  }
  return data;
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

async function pushPendingEvents() {
  const outbox = repo.readOutbox().filter((e) => e.status === "pending");
  if (!outbox.length) return { ok: true };
  // Push batch integration remains in desktop reference; web reuses cycle hook.
  return { ok: true, skipped: outbox.length };
}

export const runSyncCycle = createRunSyncCycle({
  pushPending: pushPendingEvents,
  pullChanges: pullPosSyncChanges,
});

export { emitter };
