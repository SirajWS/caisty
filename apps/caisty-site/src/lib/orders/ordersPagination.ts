/**
 * Client-side pagination for portal orders tables (Phase 7 Sprint 3.4B).
 */

import {
  computeTotalPages,
  type PortalPaginationMeta,
} from "../portal/portalPagination";

export const ORDERS_PAGE_SIZE = 5;

export function clampOrdersPage(
  page: number,
  total: number,
  limit = ORDERS_PAGE_SIZE,
): number {
  const totalPages = computeTotalPages(total, limit);
  if (totalPages <= 0) return 1;
  return Math.min(Math.max(1, page), totalPages);
}

export function buildOrdersPagination(
  total: number,
  page: number,
  limit = ORDERS_PAGE_SIZE,
): PortalPaginationMeta {
  const totalPages = computeTotalPages(total, limit);
  const safePage = clampOrdersPage(page, total, limit);
  const offset = (safePage - 1) * limit;

  return {
    total,
    limit,
    offset,
    page: safePage,
    totalPages,
  };
}

export function sliceOrdersPage<T>(
  items: readonly T[],
  pagination: PortalPaginationMeta,
): T[] {
  return items.slice(pagination.offset, pagination.offset + pagination.limit);
}
