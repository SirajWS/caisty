import { describe, expect, it } from "vitest";

import {
  DEFAULT_RECEIPT_STATUS,
  normalizeReceiptStatus,
  receiptCountsTowardKpis,
  RECEIPT_STATUS,
} from "../receiptStatus.js";

describe("receiptStatus", () => {
  it("defaults unknown values to active", () => {
    expect(normalizeReceiptStatus(null)).toBe(RECEIPT_STATUS.ACTIVE);
    expect(normalizeReceiptStatus("")).toBe(RECEIPT_STATUS.ACTIVE);
    expect(normalizeReceiptStatus("unknown")).toBe(RECEIPT_STATUS.ACTIVE);
  });

  it("recognizes all defined lifecycle statuses", () => {
    expect(normalizeReceiptStatus("active")).toBe(RECEIPT_STATUS.ACTIVE);
    expect(normalizeReceiptStatus("refunded")).toBe(RECEIPT_STATUS.REFUNDED);
    expect(normalizeReceiptStatus("partial_refund")).toBe(
      RECEIPT_STATUS.PARTIAL_REFUND,
    );
    expect(normalizeReceiptStatus("voided")).toBe(RECEIPT_STATUS.VOIDED);
  });

  it("counts only active receipts toward KPIs in Sprint 5.1", () => {
    expect(receiptCountsTowardKpis(RECEIPT_STATUS.ACTIVE)).toBe(true);
    expect(receiptCountsTowardKpis(DEFAULT_RECEIPT_STATUS)).toBe(true);
    expect(receiptCountsTowardKpis(RECEIPT_STATUS.REFUNDED)).toBe(false);
    expect(receiptCountsTowardKpis(RECEIPT_STATUS.VOIDED)).toBe(false);
  });
});
