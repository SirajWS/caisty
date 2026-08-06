import { decodePullCursor } from "./pullCursor.js";
import { isValidChannelPullCursor } from "./channelPullCursor.js";
import type {
  PosPullCursors,
  PosPullEntityType,
  PosPullRequest,
} from "./types.js";
import { isUuid } from "./validateSyncBatch.js";

export const POS_PULL_SCHEMA_VERSION = 1 as const;
export const POS_PULL_DEFAULT_LIMIT = 100;
export const POS_PULL_MAX_LIMIT = 250;

const CURSOR_KEYS: PosPullEntityType[] = [
  "orders",
  "receipts",
  "payments",
  "receiptEvents",
  "shifts",
  "channels",
];

export type PosPullValidationError = {
  code: string;
  message: string;
};

export function validatePullRequest(
  body: unknown,
):
  | { ok: true; request: PosPullRequest }
  | { ok: false; error: PosPullValidationError } {
  if (!body || typeof body !== "object") {
    return invalid("Request body must be a JSON object.");
  }

  const record = body as Record<string, unknown>;

  if (record.schemaVersion !== POS_PULL_SCHEMA_VERSION) {
    return invalid("schemaVersion must be exactly 1.");
  }

  const deviceId = typeof record.deviceId === "string" ? record.deviceId.trim() : "";
  if (!deviceId || !isUuid(deviceId)) {
    return invalid("deviceId must be a UUID.");
  }

  const licenseKey =
    typeof record.licenseKey === "string" ? record.licenseKey.trim() : "";
  if (!licenseKey) {
    return invalid("licenseKey is required.");
  }

  const limit = parseLimit(record.limit);
  if (limit === null) {
    return invalid(`limit must be an integer between 1 and ${POS_PULL_MAX_LIMIT}.`);
  }

  const cursorsResult = parseCursors(record.cursors);
  if (!cursorsResult.ok) {
    return { ok: false, error: cursorsResult.error };
  }

  return {
    ok: true,
    request: {
      schemaVersion: POS_PULL_SCHEMA_VERSION,
      deviceId,
      licenseKey,
      cursors: cursorsResult.cursors,
      limit,
    },
  };
}

function parseLimit(rawLimit: unknown): number | null {
  if (rawLimit === undefined || rawLimit === null) {
    return POS_PULL_DEFAULT_LIMIT;
  }
  if (typeof rawLimit !== "number" || !Number.isInteger(rawLimit)) {
    return null;
  }
  if (rawLimit < 1 || rawLimit > POS_PULL_MAX_LIMIT) {
    return null;
  }
  return rawLimit;
}

function parseCursors(
  rawCursors: unknown,
): { ok: true; cursors: PosPullCursors } | { ok: false; error: PosPullValidationError } {
  if (rawCursors === undefined || rawCursors === null) {
    return {
      ok: true,
      cursors: emptyCursors(),
    };
  }

  if (!rawCursors || typeof rawCursors !== "object") {
    return invalid("cursors must be an object.");
  }

  const cursorsObj = rawCursors as Record<string, unknown>;
  const cursors: PosPullCursors = emptyCursors();
  for (const key of CURSOR_KEYS) {
    const raw = cursorsObj[key];
    if (raw === undefined || raw === null) {
      cursors[key] = null;
      continue;
    }
    if (typeof raw !== "string" || !raw.trim()) {
      return invalid(`cursors.${key} must be a non-empty string or null.`);
    }
    const trimmed = raw.trim();
    if (key === "channels") {
      if (!isValidChannelPullCursor(trimmed)) {
        return invalid(`cursors.${key} is invalid.`);
      }
    } else if (!decodePullCursor(trimmed)) {
      return invalid(`cursors.${key} is invalid.`);
    }
    cursors[key] = trimmed;
  }

  return { ok: true, cursors };
}

function emptyCursors(): PosPullCursors {
  return {
    orders: null,
    receipts: null,
    payments: null,
    receiptEvents: null,
    shifts: null,
    channels: null,
  };
}

function invalid(message: string): { ok: false; error: PosPullValidationError } {
  return {
    ok: false,
    error: {
      code: "invalid_request",
      message,
    },
  };
}
