/**
 * Portal receipts pagination helpers (Phase 7 Sprint 3.2).
 */

export const PORTAL_RECEIPTS_PAGE_SIZE = 5;

export type PortalReceiptPagination = {
  limit: number;
  offset: number;
  page: number;
};

export function parseReceiptPagination(input: {
  limit?: string | number;
  offset?: string | number;
  page?: string | number;
}): PortalReceiptPagination {
  const parsedLimit = Number(input.limit);
  const limit =
    Number.isFinite(parsedLimit) && parsedLimit > 0
      ? Math.min(Math.trunc(parsedLimit), 50)
      : PORTAL_RECEIPTS_PAGE_SIZE;

  const parsedOffset = Number(input.offset);
  if (Number.isFinite(parsedOffset) && parsedOffset >= 0) {
    const offset = Math.trunc(parsedOffset);
    return {
      limit,
      offset,
      page: Math.floor(offset / limit) + 1,
    };
  }

  const parsedPage = Number(input.page);
  const page = Number.isFinite(parsedPage)
    ? Math.max(Math.trunc(parsedPage), 1)
    : 1;

  return {
    limit,
    offset: (page - 1) * limit,
    page,
  };
}

export function computeTotalPages(total: number, limit: number): number {
  if (total <= 0) return 0;
  return Math.ceil(total / limit);
}

export function clampPageToTotalPages(page: number, totalPages: number): number {
  if (totalPages <= 0) return 1;
  return Math.min(Math.max(page, 1), totalPages);
}

/** Build compact page number list with ellipsis markers. */
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
