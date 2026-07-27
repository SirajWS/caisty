/**
 * Deterministic provider-order deduplication for portal read paths.
 * Does not mutate or delete database rows — selection only.
 */

import { isProviderOrder } from "./orderSource.js";
import { getOrderStatusRank } from "../posSync/orderStatusMerge.js";

export type ProviderOrderDedupFields = {
  id: string;
  platform: string | null | undefined;
  providerOrderId: string | null | undefined;
  /** Used only when providerOrderId is empty — provider/online orders only. */
  localOrderId?: string | null | undefined;
  status: string | null | undefined;
  updatedAt: Date | string | null | undefined;
  soldAt: Date | string | null | undefined;
};

/**
 * Cross-device provider dedup key.
 * 1) normalize(platform)|trim(providerOrderId)
 * 2) normalize(platform)|local:trim(localOrderId) — provider platforms only
 * 3) null — no dedup (incl. local POS)
 */
export function buildProviderOrderDedupKey(
  platform: string | null | undefined,
  providerOrderId: string | null | undefined,
  localOrderId?: string | null | undefined,
): string | null {
  if (!isProviderOrder(platform)) return null;

  const normalizedPlatform = (platform ?? "").trim().toLowerCase();
  const providerId = (providerOrderId ?? "").trim();
  if (providerId) return `${normalizedPlatform}|${providerId}`;

  const localId = (localOrderId ?? "").trim();
  if (localId) return `${normalizedPlatform}|local:${localId}`;

  return null;
}

function toMillis(value: Date | string | null | undefined): number {
  if (value == null) return 0;
  const ms =
    value instanceof Date ? value.getTime() : new Date(value).getTime();
  return Number.isFinite(ms) ? ms : 0;
}

/**
 * Positive ⇒ `a` wins over `b`.
 * Winner: higher status rank → newer updatedAt → newer soldAt → smaller id.
 */
export function compareProviderOrderWinner(
  a: ProviderOrderDedupFields,
  b: ProviderOrderDedupFields,
): number {
  const rankDiff = getOrderStatusRank(a.status) - getOrderStatusRank(b.status);
  if (rankDiff !== 0) return rankDiff;

  const updatedDiff = toMillis(a.updatedAt) - toMillis(b.updatedAt);
  if (updatedDiff !== 0) return updatedDiff;

  const soldDiff = toMillis(a.soldAt) - toMillis(b.soldAt);
  if (soldDiff !== 0) return soldDiff;

  return b.id.localeCompare(a.id);
}

/**
 * Keep one winner per provider dedup key.
 * Rows without a key pass through unchanged.
 * Callers should pass provider/online rows only; POS rows never get a key.
 */
export function dedupeProviderOrders<T extends ProviderOrderDedupFields>(
  rows: readonly T[],
): T[] {
  const groups = new Map<string, T[]>();
  const withoutKey: T[] = [];

  for (const row of rows) {
    const key = buildProviderOrderDedupKey(
      row.platform,
      row.providerOrderId,
      row.localOrderId,
    );
    if (!key) {
      withoutKey.push(row);
      continue;
    }
    const bucket = groups.get(key);
    if (bucket) bucket.push(row);
    else groups.set(key, [row]);
  }

  const winners: T[] = [];
  for (const bucket of groups.values()) {
    let winner = bucket[0]!;
    for (let i = 1; i < bucket.length; i++) {
      const candidate = bucket[i]!;
      if (compareProviderOrderWinner(candidate, winner) > 0) {
        winner = candidate;
      }
    }
    winners.push(winner);
  }

  return [...withoutKey, ...winners];
}
