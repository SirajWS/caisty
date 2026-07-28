import type { PosSyncBatchResponse } from "./types.js";

export function validatePushResponse(payload: unknown): {
  ok: true;
  data: PosSyncBatchResponse;
} | {
  ok: false;
  reason: string;
} {
  if (!payload || typeof payload !== "object") {
    return { ok: false, reason: "invalid_response" };
  }

  const data = payload as Record<string, unknown>;
  if (data.ok !== true) {
    return { ok: false, reason: "response_not_ok" };
  }

  if (data.status !== "completed" && data.status !== "duplicate_batch") {
    return { ok: false, reason: "invalid_status" };
  }

  if (!Array.isArray(data.accepted)) {
    return { ok: false, reason: "invalid_accepted" };
  }
  if (!Array.isArray(data.duplicate)) {
    return { ok: false, reason: "invalid_duplicate" };
  }
  if (!Array.isArray(data.failed)) {
    return { ok: false, reason: "invalid_failed" };
  }

  return {
    ok: true,
    data: {
      ok: true,
      batchId: typeof data.batchId === "string" ? data.batchId : undefined,
      posBatchId:
        typeof data.posBatchId === "string" ? data.posBatchId : undefined,
      status: data.status,
      accepted: data.accepted.map(String),
      duplicate: data.duplicate.map(String),
      failed: data.failed.map((row) => {
        const item = (row && typeof row === "object" ? row : {}) as Record<
          string,
          unknown
        >;
        return {
          eventId: String(item.eventId || ""),
          error: String(item.error || item.code || "event_failed"),
          code: String(item.code || "event_failed"),
        };
      }),
      counts:
        data.counts && typeof data.counts === "object"
          ? (data.counts as PosSyncBatchResponse["counts"])
          : undefined,
    },
  };
}
