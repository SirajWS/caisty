import { describe, expect, it } from "vitest";

import { encodePullCursor } from "../pullCursor.js";
import { encodeChannelPullCursor } from "../channelPullCursor.js";
import {
  POS_PULL_DEFAULT_LIMIT,
  POS_PULL_MAX_LIMIT,
  validatePullRequest,
} from "../validatePullRequest.js";

const DEVICE_ID = "00000000-0000-0000-0000-000000000099";

function baseBody() {
  return {
    schemaVersion: 1 as const,
    deviceId: DEVICE_ID,
    licenseKey: "CSTY-LICENSE",
    cursors: {
      orders: null,
      receipts: null,
      payments: null,
      receiptEvents: null,
      shifts: null,
      channels: null,
    },
    limit: 100,
  };
}

describe("validatePullRequest", () => {
  it("accepts schemaVersion 1", () => {
    const result = validatePullRequest(baseBody());
    expect(result.ok).toBe(true);
  });

  it("rejects unsupported schemaVersion", () => {
    const result = validatePullRequest({ ...baseBody(), schemaVersion: 2 });
    expect(result.ok).toBe(false);
  });

  it("rejects invalid deviceId", () => {
    const result = validatePullRequest({ ...baseBody(), deviceId: "invalid" });
    expect(result.ok).toBe(false);
  });

  it("applies default limit when missing", () => {
    const body = baseBody();
    delete (body as { limit?: number }).limit;
    const result = validatePullRequest(body);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.request.limit).toBe(POS_PULL_DEFAULT_LIMIT);
    }
  });

  it("rejects limit above maximum", () => {
    const result = validatePullRequest({
      ...baseBody(),
      limit: POS_PULL_MAX_LIMIT + 1,
    });
    expect(result.ok).toBe(false);
  });

  it("rejects invalid limit type", () => {
    const result = validatePullRequest({
      ...baseBody(),
      limit: "100",
    });
    expect(result.ok).toBe(false);
  });

  it("rejects invalid cursor string", () => {
    const result = validatePullRequest({
      ...baseBody(),
      cursors: {
        ...baseBody().cursors,
        orders: "invalid-cursor",
      },
    });
    expect(result.ok).toBe(false);
  });

  it("accepts valid encoded cursor", () => {
    const cursor = encodePullCursor({
      timestamp: "2026-07-27T10:00:00.000Z",
      id: "11111111-1111-1111-1111-111111111111",
    });
    const result = validatePullRequest({
      ...baseBody(),
      cursors: {
        ...baseBody().cursors,
        orders: cursor,
      },
    });
    expect(result.ok).toBe(true);
  });

  it("accepts channels v2 cursor", () => {
    const cursor = encodeChannelPullCursor({
      orgId: "11111111-1111-1111-1111-111111111111",
      timestamp: "2026-07-27T10:00:00.000Z",
      id: "11111111-1111-1111-1111-111111111111",
    });
    const result = validatePullRequest({
      ...baseBody(),
      cursors: {
        ...baseBody().cursors,
        channels: cursor,
      },
    });
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.request.cursors.channels).toBe(cursor);
    }
  });
});
