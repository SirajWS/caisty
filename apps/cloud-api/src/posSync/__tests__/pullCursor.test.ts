import { describe, expect, it } from "vitest";

import { decodePullCursor, encodePullCursor } from "../pullCursor.js";

describe("pullCursor", () => {
  it("encodes and decodes a cursor", () => {
    const encoded = encodePullCursor({
      timestamp: "2026-07-27T10:00:00.000Z",
      id: "11111111-1111-1111-1111-111111111111",
    });

    expect(decodePullCursor(encoded)).toEqual({
      timestamp: "2026-07-27T10:00:00.000Z",
      id: "11111111-1111-1111-1111-111111111111",
    });
  });

  it("returns null for invalid cursor payload", () => {
    const invalid = Buffer.from(
      JSON.stringify({
        v: 999,
        ts: "2026-07-27T10:00:00.000Z",
        id: "11111111-1111-1111-1111-111111111111",
      }),
      "utf8",
    ).toString("base64url");

    expect(decodePullCursor(invalid)).toBeNull();
    expect(decodePullCursor("not-base64url")).toBeNull();
  });

  it("preserves deterministic ordering key with same timestamp", () => {
    const first = encodePullCursor({
      timestamp: "2026-07-27T10:00:00.000Z",
      id: "11111111-1111-1111-1111-111111111111",
    });
    const second = encodePullCursor({
      timestamp: "2026-07-27T10:00:00.000Z",
      id: "22222222-2222-2222-2222-222222222222",
    });

    const firstDecoded = decodePullCursor(first);
    const secondDecoded = decodePullCursor(second);

    expect(firstDecoded).not.toBeNull();
    expect(secondDecoded).not.toBeNull();

    const sorted = [firstDecoded!, secondDecoded!].sort((a, b) => {
      if (a.timestamp !== b.timestamp) {
        return a.timestamp.localeCompare(b.timestamp);
      }
      return a.id.localeCompare(b.id);
    });

    expect(sorted.map((entry) => entry.id)).toEqual([
      "11111111-1111-1111-1111-111111111111",
      "22222222-2222-2222-2222-222222222222",
    ]);
  });
});
