import { describe, expect, it } from "vitest";

import {
  isReceiptEventType,
  isSupportedReceiptEventSchemaVersion,
  RECEIPT_EVENT_TYPES,
  SUPPORTED_RECEIPT_EVENT_TYPES,
} from "../receiptEventTypes.js";

describe("receiptEventTypes", () => {
  it("lists the Sprint 5.2B event types", () => {
    expect(SUPPORTED_RECEIPT_EVENT_TYPES).toEqual([
      "created",
      "printed",
      "reprinted",
    ]);
  });

  it("accepts supported event types", () => {
    expect(isReceiptEventType(RECEIPT_EVENT_TYPES.CREATED)).toBe(true);
    expect(isReceiptEventType(RECEIPT_EVENT_TYPES.PRINTED)).toBe(true);
    expect(isReceiptEventType(RECEIPT_EVENT_TYPES.REPRINTED)).toBe(true);
  });

  it("rejects unsupported event types", () => {
    expect(isReceiptEventType("refunded")).toBe(false);
    expect(isReceiptEventType("voided")).toBe(false);
  });

  it("accepts schema version 1 only", () => {
    expect(isSupportedReceiptEventSchemaVersion(1)).toBe(true);
    expect(isSupportedReceiptEventSchemaVersion(2)).toBe(false);
  });
});
