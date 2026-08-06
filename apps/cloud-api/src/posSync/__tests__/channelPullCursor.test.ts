import { describe, expect, it } from "vitest";

import {
  decodeChannelPullCursor,
  encodeChannelPullCursor,
} from "../channelPullCursor.js";
import { encodePullCursor } from "../pullCursor.js";
import { InvalidPullCursorError } from "../pullErrors.js";
import { PullCursorOrgMismatchError } from "../pullErrors.js";

const ORG_A = "11111111-1111-1111-1111-111111111111";
const ORG_B = "22222222-2222-2222-2222-222222222222";

describe("channelPullCursor", () => {
  it("encodes and decodes v2 cursor with org scope", () => {
    const encoded = encodeChannelPullCursor({
      orgId: ORG_A,
      timestamp: "2026-07-27T10:00:00.000Z",
      id: "00000000-0000-0000-0000-000000000050",
    });
    const decoded = decodeChannelPullCursor(encoded, ORG_A);
    expect(decoded.orgId).toBe(ORG_A);
    expect(decoded.id).toBe("00000000-0000-0000-0000-000000000050");
  });

  it("rejects cursor from a different organization", () => {
    const encoded = encodeChannelPullCursor({
      orgId: ORG_A,
      timestamp: "2026-07-27T10:00:00.000Z",
      id: "00000000-0000-0000-0000-000000000050",
    });
    expect(() => decodeChannelPullCursor(encoded, ORG_B)).toThrow(
      PullCursorOrgMismatchError,
    );
  });

  it("rejects legacy v1 entity cursors for channels", () => {
    const v1 = encodePullCursor({
      timestamp: "2026-07-27T10:00:00.000Z",
      id: "00000000-0000-0000-0000-000000000050",
    });
    expect(() => decodeChannelPullCursor(v1, ORG_A)).toThrow(
      InvalidPullCursorError,
    );
  });

  it("preserves stable ordering key with same timestamp", () => {
    const ts = "2026-07-27T10:00:00.000Z";
    const a = encodeChannelPullCursor({
      orgId: ORG_A,
      timestamp: ts,
      id: "00000000-0000-0000-0000-000000000001",
    });
    const b = encodeChannelPullCursor({
      orgId: ORG_A,
      timestamp: ts,
      id: "00000000-0000-0000-0000-000000000002",
    });
    expect(a).not.toBe(b);
  });
});
