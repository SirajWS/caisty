import { describe, expect, it } from "vitest";

import {
  buildPaginationWindow,
  computeTotalPages,
  parseReceiptPagination,
  paginationRangeLabel,
  PORTAL_RECEIPTS_PAGE_SIZE,
} from "../portalReceiptPagination.js";

describe("portalReceiptPagination", () => {
  it("defaults to 5 items on page 1", () => {
    expect(parseReceiptPagination({})).toEqual({
      limit: PORTAL_RECEIPTS_PAGE_SIZE,
      offset: 0,
      page: 1,
    });
  });

  it("supports page-based pagination", () => {
    expect(parseReceiptPagination({ page: "3", limit: "5" })).toEqual({
      limit: 5,
      offset: 10,
      page: 3,
    });
  });

  it("supports offset-based pagination", () => {
    expect(parseReceiptPagination({ offset: "10", limit: "5" })).toEqual({
      limit: 5,
      offset: 10,
      page: 3,
    });
  });

  it("clamps invalid limit values", () => {
    expect(parseReceiptPagination({ limit: "999" }).limit).toBe(50);
    expect(parseReceiptPagination({ limit: "0" }).limit).toBe(
      PORTAL_RECEIPTS_PAGE_SIZE,
    );
  });

  it("computes total pages", () => {
    expect(computeTotalPages(26, 5)).toBe(6);
    expect(computeTotalPages(0, 5)).toBe(0);
  });

  it("builds ellipsis windows for large page counts", () => {
    expect(buildPaginationWindow(1, 134)).toEqual([1, 2, 3, "ellipsis", 134]);
    expect(buildPaginationWindow(67, 134)).toEqual([
      1,
      "ellipsis",
      66,
      67,
      68,
      "ellipsis",
      134,
    ]);
  });

  it("formats showing range labels", () => {
    expect(
      paginationRangeLabel({
        total: 26,
        offset: 0,
        limit: 5,
        pageCount: 5,
      }),
    ).toEqual({ from: 1, to: 5 });
  });
});
