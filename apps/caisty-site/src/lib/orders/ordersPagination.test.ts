import { describe, expect, it } from "vitest";

import {
  buildOrdersPagination,
  clampOrdersPage,
  ORDERS_PAGE_SIZE,
  sliceOrdersPage,
} from "./ordersPagination";

describe("ordersPagination", () => {
  it("builds six pages for 27 live orders", () => {
    const pagination = buildOrdersPagination(27, 1);
    expect(pagination.totalPages).toBe(6);
    expect(pagination.limit).toBe(ORDERS_PAGE_SIZE);
  });

  it("shows the next five rows on page 2", () => {
    const items = Array.from({ length: 27 }, (_, index) => index + 1);
    const pagination = buildOrdersPagination(27, 2);
    expect(sliceOrdersPage(items, pagination)).toEqual([6, 7, 8, 9, 10]);
  });

  it("shows two rows on the last page", () => {
    const items = Array.from({ length: 27 }, (_, index) => index + 1);
    const pagination = buildOrdersPagination(27, 6);
    expect(sliceOrdersPage(items, pagination)).toEqual([26, 27]);
  });

  it("keeps live and online page states independent", () => {
    const live = buildOrdersPagination(27, 3);
    const online = buildOrdersPagination(5, 1);
    expect(live.page).toBe(3);
    expect(online.page).toBe(1);
    expect(live.totalPages).toBe(6);
    expect(online.totalPages).toBe(1);
  });

  it("clamps invalid pages to the last valid page", () => {
    expect(clampOrdersPage(9, 27)).toBe(6);
    expect(clampOrdersPage(0, 27)).toBe(1);
  });

  it("returns one page for five online orders and two pages for six", () => {
    expect(buildOrdersPagination(5, 1).totalPages).toBe(1);
    expect(buildOrdersPagination(6, 1).totalPages).toBe(2);
  });

  it("returns page one when there are zero results", () => {
    const pagination = buildOrdersPagination(0, 4);
    expect(pagination.page).toBe(1);
    expect(pagination.totalPages).toBe(0);
    expect(sliceOrdersPage([], pagination)).toEqual([]);
  });
});
