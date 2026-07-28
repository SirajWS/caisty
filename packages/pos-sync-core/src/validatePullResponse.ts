import { PULL_ENTITY_TYPES, PULL_SCHEMA_VERSION, type PosPullResponse } from "./types.js";

function isNullOrString(value: unknown) {
  return value == null || typeof value === "string";
}

function requireStringField(obj: Record<string, unknown>, field: string) {
  const value = obj[field];
  if (value == null || String(value).trim() === "") {
    return { ok: false as const, reason: `invalid_${field}` };
  }
  return { ok: true as const };
}

function validateOrderSnapshot(snapshot: unknown) {
  if (!snapshot || typeof snapshot !== "object") {
    return { ok: false as const, reason: "invalid_order_snapshot" };
  }
  const obj = snapshot as Record<string, unknown>;
  let result = requireStringField(obj, "id");
  if (!result.ok) return result;
  result = requireStringField(obj, "sourceDeviceId");
  if (!result.ok) return result;
  result = requireStringField(obj, "status");
  if (!result.ok) return result;
  if (obj.lines != null && !Array.isArray(obj.lines)) {
    return { ok: false as const, reason: "invalid_order_lines" };
  }
  return { ok: true as const };
}

function validateReceiptSnapshot(snapshot: unknown) {
  if (!snapshot || typeof snapshot !== "object") {
    return { ok: false as const, reason: "invalid_receipt_snapshot" };
  }
  const obj = snapshot as Record<string, unknown>;
  let result = requireStringField(obj, "id");
  if (!result.ok) return result;
  return requireStringField(obj, "sourceDeviceId");
}

function validatePaymentSnapshot(snapshot: unknown) {
  if (!snapshot || typeof snapshot !== "object") {
    return { ok: false as const, reason: "invalid_payment_snapshot" };
  }
  const obj = snapshot as Record<string, unknown>;
  let result = requireStringField(obj, "id");
  if (!result.ok) return result;
  return requireStringField(obj, "sourceDeviceId");
}

function validateReceiptEventSnapshot(snapshot: unknown) {
  if (!snapshot || typeof snapshot !== "object") {
    return { ok: false as const, reason: "invalid_receipt_event_snapshot" };
  }
  const obj = snapshot as Record<string, unknown>;
  const hasId =
    (obj.id != null && String(obj.id).trim() !== "") ||
    (obj.eventId != null && String(obj.eventId).trim() !== "");
  if (!hasId) return { ok: false as const, reason: "invalid_receipt_event_id" };
  return requireStringField(obj, "sourceDeviceId");
}

function validateShiftSnapshot(snapshot: unknown) {
  if (!snapshot || typeof snapshot !== "object") {
    return { ok: false as const, reason: "invalid_shift_snapshot" };
  }
  const obj = snapshot as Record<string, unknown>;
  let result = requireStringField(obj, "id");
  if (!result.ok) return result;
  result = requireStringField(obj, "sourceDeviceId");
  if (!result.ok) return result;
  return requireStringField(obj, "status");
}

const SNAPSHOT_VALIDATORS = {
  orders: validateOrderSnapshot,
  receipts: validateReceiptSnapshot,
  payments: validatePaymentSnapshot,
  receiptEvents: validateReceiptEventSnapshot,
  shifts: validateShiftSnapshot,
} as const;

export function validatePullResponse(
  data: unknown,
): { ok: true; data: PosPullResponse } | { ok: false; reason: string } {
  if (!data || typeof data !== "object") {
    return { ok: false, reason: "invalid_response_contract" };
  }
  const record = data as Record<string, unknown>;
  if (record.ok !== true) {
    return { ok: false, reason: "invalid_response_contract" };
  }
  if (record.schemaVersion !== PULL_SCHEMA_VERSION) {
    return { ok: false, reason: "invalid_schema_version" };
  }
  const scope = record.scope;
  if (!scope || typeof scope !== "object") {
    return { ok: false, reason: "missing_scope" };
  }
  const scopeObj = scope as Record<string, unknown>;
  if (!scopeObj.orgId || !scopeObj.deviceId) {
    return { ok: false, reason: "invalid_scope" };
  }
  if (!record.changes || typeof record.changes !== "object") {
    return { ok: false, reason: "missing_changes" };
  }
  if (!record.nextCursors || typeof record.nextCursors !== "object") {
    return { ok: false, reason: "missing_next_cursors" };
  }
  if (!record.hasMore || typeof record.hasMore !== "object") {
    return { ok: false, reason: "missing_has_more" };
  }

  const changes = record.changes as Record<string, unknown>;
  const nextCursors = record.nextCursors as Record<string, unknown>;
  const hasMore = record.hasMore as Record<string, unknown>;

  for (const key of PULL_ENTITY_TYPES) {
    if (!Array.isArray(changes[key])) {
      return { ok: false, reason: `invalid_changes_${key}_array` };
    }
    if (!isNullOrString(nextCursors[key])) {
      return { ok: false, reason: `invalid_next_cursor_${key}` };
    }
    if (typeof hasMore[key] !== "boolean") {
      return { ok: false, reason: `invalid_has_more_${key}` };
    }
    for (const item of changes[key] as unknown[]) {
      const itemResult = SNAPSHOT_VALIDATORS[key](item);
      if (!itemResult.ok) return itemResult;
    }
  }

  return { ok: true, data: data as PosPullResponse };
}
