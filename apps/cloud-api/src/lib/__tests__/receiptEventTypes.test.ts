import { describe, expect, it } from "vitest";

import {
  isReceiptEventType,
  isPosSyncReceiptEventType,
  POS_SYNC_RECEIPT_EVENT_TYPES,
  RECEIPT_EVENT_TYPES,
} from "../receiptEventTypes.js";

describe("receiptEventTypes", () => {
  it("lists POS sync subset separately from full lifecycle", () => {
    expect(POS_SYNC_RECEIPT_EVENT_TYPES).toEqual([
      "created",
      "printed",
      "reprinted",
    ]);
  });

  it("accepts admin lifecycle event types", () => {
    expect(isReceiptEventType(RECEIPT_EVENT_TYPES.REFUND)).toBe(true);
    expect(isReceiptEventType(RECEIPT_EVENT_TYPES.PAYMENT_CHANGED)).toBe(true);
    expect(isReceiptEventType(RECEIPT_EVENT_TYPES.VOIDED)).toBe(true);
  });

  it("rejects POS sync validator for admin-only events", () => {
    expect(isPosSyncReceiptEventType(RECEIPT_EVENT_TYPES.REFUND)).toBe(false);
    expect(isPosSyncReceiptEventType(RECEIPT_EVENT_TYPES.CREATED)).toBe(true);
  });
});
