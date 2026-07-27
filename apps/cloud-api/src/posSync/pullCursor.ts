const PULL_CURSOR_VERSION = 1 as const;

type PullCursorPayload = {
  v: number;
  ts: string;
  id: string;
};

export type PullCursor = {
  timestamp: string;
  id: string;
};

export function encodePullCursor(cursor: PullCursor): string {
  const payload: PullCursorPayload = {
    v: PULL_CURSOR_VERSION,
    ts: cursor.timestamp,
    id: cursor.id,
  };

  const json = JSON.stringify(payload);
  return Buffer.from(json, "utf8").toString("base64url");
}

export function decodePullCursor(value: string): PullCursor | null {
  try {
    const json = Buffer.from(value, "base64url").toString("utf8");
    const parsed = JSON.parse(json) as PullCursorPayload;
    if (
      typeof parsed !== "object" ||
      parsed === null ||
      parsed.v !== PULL_CURSOR_VERSION ||
      typeof parsed.ts !== "string" ||
      typeof parsed.id !== "string"
    ) {
      return null;
    }

    const parsedDate = new Date(parsed.ts);
    if (Number.isNaN(parsedDate.getTime())) {
      return null;
    }

    if (!parsed.id.trim()) {
      return null;
    }

    return {
      timestamp: parsed.ts,
      id: parsed.id,
    };
  } catch {
    return null;
  }
}
