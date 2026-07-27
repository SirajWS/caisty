const TERMINAL_STATUSES = new Set(["cancelled", "canceled", "refunded"]);

/**
 * Workflow ranks for sync merge + provider-order winner selection.
 * Terminals (cancelled/canceled/refunded) stay at 1000 via getOrderStatusRank.
 * Delivered must beat completed (portal acceptance).
 */
const ORDER_STATUS_RANK: Record<string, number> = {
  new: 10,
  created: 10,
  open: 20,
  accepted: 30,
  in_progress: 40,
  inprogress: 40,
  preparing: 40,
  "in preparation": 40,
  ready: 50,
  closed: 60,
  completed: 60,
  paid: 60,
  delivered: 70,
};

/** Rank for monotone status comparison (terminal = 1000). */
export function getOrderStatusRank(value: string | null | undefined): number {
  const normalized = (value ?? "").trim().toLowerCase();
  if (!normalized) return 0;
  if (TERMINAL_STATUSES.has(normalized)) return 1000;
  return ORDER_STATUS_RANK[normalized] ?? 45;
}

function orderStatusRank(value: string): number {
  return getOrderStatusRank(value);
}

/** Monotonic order status merge — terminal and forward-only progression. */
export function mergeOrderStatusForSync(
  existing: string | null | undefined,
  incoming: string | null | undefined,
  fallback = "closed",
): string {
  const current = (existing ?? "").trim().toLowerCase();
  const next = (incoming ?? "").trim().toLowerCase() || fallback;

  if (!current) return next;
  if (TERMINAL_STATUSES.has(current)) return current;
  if (TERMINAL_STATUSES.has(next)) return next;
  return orderStatusRank(next) >= orderStatusRank(current) ? next : current;
}
