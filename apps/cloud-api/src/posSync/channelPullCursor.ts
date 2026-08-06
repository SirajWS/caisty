import { InvalidPullCursorError, PullCursorOrgMismatchError } from "./pullErrors.js";

const CHANNEL_PULL_CURSOR_VERSION = 2 as const;

type ChannelPullCursorPayloadV2 = {
  v: typeof CHANNEL_PULL_CURSOR_VERSION;
  orgId: string;
  ts: string;
  id: string;
};

export type ChannelPullCursor = {
  orgId: string;
  timestamp: string;
  id: string;
};

export function isValidChannelPullCursor(value: string): boolean {
  try {
    const json = Buffer.from(value, "base64url").toString("utf8");
    const parsed = JSON.parse(json) as {
      v?: unknown;
      orgId?: unknown;
      ts?: unknown;
      id?: unknown;
    };
    if (
      parsed.v !== CHANNEL_PULL_CURSOR_VERSION ||
      typeof parsed.orgId !== "string" ||
      !parsed.orgId.trim() ||
      typeof parsed.ts !== "string" ||
      Number.isNaN(new Date(parsed.ts).getTime()) ||
      typeof parsed.id !== "string" ||
      !parsed.id.trim()
    ) {
      return false;
    }
    return true;
  } catch {
    return false;
  }
}

export function encodeChannelPullCursor(cursor: ChannelPullCursor): string {
  const payload: ChannelPullCursorPayloadV2 = {
    v: CHANNEL_PULL_CURSOR_VERSION,
    orgId: cursor.orgId,
    ts: cursor.timestamp,
    id: cursor.id,
  };
  return Buffer.from(JSON.stringify(payload), "utf8").toString("base64url");
}

export function decodeChannelPullCursor(
  value: string,
  expectedOrgId: string,
): ChannelPullCursor {
  let parsed: unknown;
  try {
    const json = Buffer.from(value, "base64url").toString("utf8");
    parsed = JSON.parse(json);
  } catch {
    throw new InvalidPullCursorError("Channel pull cursor could not be decoded.");
  }

  if (
    typeof parsed !== "object" ||
    parsed === null ||
    !("v" in parsed) ||
    (parsed as { v?: unknown }).v !== CHANNEL_PULL_CURSOR_VERSION
  ) {
    throw new InvalidPullCursorError(
      "Channel pull cursor must use version 2 with organization scope.",
    );
  }

  const payload = parsed as ChannelPullCursorPayloadV2;
  if (
    typeof payload.orgId !== "string" ||
    typeof payload.ts !== "string" ||
    typeof payload.id !== "string"
  ) {
    throw new InvalidPullCursorError("Channel pull cursor payload is invalid.");
  }

  const parsedDate = new Date(payload.ts);
  if (Number.isNaN(parsedDate.getTime())) {
    throw new InvalidPullCursorError("Channel pull cursor timestamp is invalid.");
  }

  if (!payload.id.trim()) {
    throw new InvalidPullCursorError("Channel pull cursor id is invalid.");
  }

  if (payload.orgId !== expectedOrgId) {
    throw new PullCursorOrgMismatchError(
      "Channel pull cursor belongs to a different organization.",
    );
  }

  return {
    orgId: payload.orgId,
    timestamp: payload.ts,
    id: payload.id,
  };
}
