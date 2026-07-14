/**
 * Shared portal pagination helpers (Phase 7 Sprint 3.2).
 */

export const PORTAL_RECEIPTS_PAGE_SIZE = 5;

export type PortalPaginationMeta = {
  total: number;
  limit: number;
  offset: number;
  page: number;
  totalPages: number;
};

export function computeTotalPages(total: number, limit: number): number {
  if (total <= 0) return 0;
  return Math.ceil(total / limit);
}

export function buildPaginationWindow(
  currentPage: number,
  totalPages: number,
): Array<number | "ellipsis"> {
  if (totalPages <= 1) {
    return totalPages === 1 ? [1] : [];
  }

  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, index) => index + 1);
  }

  const pages = new Set<number>([1, totalPages, currentPage]);
  if (currentPage > 1) pages.add(currentPage - 1);
  if (currentPage < totalPages) pages.add(currentPage + 1);
  if (currentPage <= 3) {
    pages.add(2);
    pages.add(3);
  }
  if (currentPage >= totalPages - 2) {
    pages.add(totalPages - 1);
    pages.add(totalPages - 2);
  }

  const sorted = [...pages].sort((a, b) => a - b);
  const result: Array<number | "ellipsis"> = [];

  for (let index = 0; index < sorted.length; index += 1) {
    const page = sorted[index]!;
    const previous = sorted[index - 1];
    if (previous != null && page - previous > 1) {
      result.push("ellipsis");
    }
    result.push(page);
  }

  return result;
}

export function paginationRangeLabel(input: {
  total: number;
  offset: number;
  limit: number;
  pageCount: number;
}): { from: number; to: number } {
  if (input.total <= 0 || input.pageCount <= 0) {
    return { from: 0, to: 0 };
  }
  const from = input.offset + 1;
  const to = Math.min(input.offset + input.pageCount, input.total);
  return { from, to };
}
