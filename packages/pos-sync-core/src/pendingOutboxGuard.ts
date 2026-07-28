import type { OutboxEvent } from "./types.js";

const TERMINAL_ORDER_STATUSES = new Set(["canceled", "cancelled", "delivered", "closed"]);
const TERMINAL_SHIFT_STATUSES = new Set(["closed"]);

function timestampMs(value: unknown) {
  if (value == null) return null;
  const n = Number(value);
  if (Number.isFinite(n) && String(value).trim() !== "") return n;
  const parsed = Date.parse(String(value));
  return Number.isFinite(parsed) ? parsed : null;
}

export function hasPendingOutboxFor(
  outbox: OutboxEvent[],
  localId: string,
  type: string,
) {
  const id = String(localId || "").trim();
  if (!id || !type) return false;
  return outbox.some(
    (event) =>
      event.localId === id &&
      event.type === type &&
      (event.status === "pending" || event.status === "syncing"),
  );
}

export function getPendingOutboxCreatedAt(
  outbox: OutboxEvent[],
  localId: string,
  outboxType: string,
) {
  const id = String(localId || "").trim();
  if (!id || !outboxType) return null;

  let latest: number | null = null;
  for (const event of outbox) {
    if (event.localId !== id || event.type !== outboxType) continue;
    if (event.status !== "pending" && event.status !== "syncing") continue;
    const createdAt = Number(event.createdAt) || 0;
    if (latest == null || createdAt > latest) latest = createdAt;
  }
  return latest;
}

export function resolveEffectiveLocalUpdatedAt(
  outbox: OutboxEvent[],
  localUpdatedAt: unknown,
  localId: string,
  outboxType: string,
) {
  const direct = timestampMs(localUpdatedAt);
  if (direct != null) return direct;

  const outboxTs = getPendingOutboxCreatedAt(outbox, localId, outboxType);
  if (outboxTs != null && outboxTs > 0) return outboxTs;

  return null;
}

export function isCloudSnapshotNewer(localUpdatedAt: unknown, cloudUpdatedAt: unknown) {
  const cloud = timestampMs(cloudUpdatedAt);
  if (cloud == null) return false;
  const local = timestampMs(localUpdatedAt);
  if (local == null) return true;
  return cloud > local;
}

export function isTerminalOrderStatus(status: unknown) {
  return TERMINAL_ORDER_STATUSES.has(String(status || "").trim().toLowerCase());
}

export function isTerminalShiftStatus(status: unknown) {
  return TERMINAL_SHIFT_STATUSES.has(String(status || "").trim().toLowerCase());
}

export function shouldSkipPullOverwrite(
  outbox: OutboxEvent[],
  {
    localId,
    outboxType,
    localUpdatedAt,
    cloudUpdatedAt,
    cloudTerminal = false,
  }: {
    localId: string;
    outboxType: string;
    localUpdatedAt: unknown;
    cloudUpdatedAt: unknown;
    cloudTerminal?: boolean;
  },
) {
  if (!hasPendingOutboxFor(outbox, localId, outboxType)) return false;
  if (cloudTerminal) return false;

  const effectiveLocal = resolveEffectiveLocalUpdatedAt(
    outbox,
    localUpdatedAt,
    localId,
    outboxType,
  );

  if (effectiveLocal == null) return true;
  if (isCloudSnapshotNewer(effectiveLocal, cloudUpdatedAt)) return false;
  return true;
}
