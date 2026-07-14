import { describe, expect, it } from "vitest";

import { buildPaginationWindow, computeTotalPages } from "../portal/portalPagination";

describe("portalPagination", () => {
  it("computes total pages for receipt lists", () => {
    expect(computeTotalPages(26, 5)).toBe(6);
  });

  it("renders compact windows with ellipsis", () => {
    expect(buildPaginationWindow(134, 134)).toEqual([
      1,
      "ellipsis",
      132,
      133,
      134,
    ]);
  });
});
