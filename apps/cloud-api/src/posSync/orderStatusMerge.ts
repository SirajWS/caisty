const TERMINAL_STATUSES = new Set(["cancelled", "canceled", "refunded"]);

const ORDER_STATUS_RANK: Record<string, number> = {
  new: 10,
  open: 20,
  accepted: 30,
  in_progress: 40,
  inprogress: 40,
  preparing: 40,
  "in preparation": 40,
  ready: 50,
  delivered: 60,
  closed: 70,
  completed: 70,
  paid: 70,
};

function orderStatusRank(value: string): number {
  if (TERMINAL_STATUSES.has(value)) return 1000;
  return ORDER_STATUS_RANK[value] ?? 45;
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
