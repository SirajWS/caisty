import {
  fetchPortalReceipts,
  type PortalReceiptsQuery,
  type PortalReceiptsResponse,
} from "../portalApi";

const EXPORT_PAGE_SIZE = 50;

/**
 * Fetches all receipts for the current filters (paginated API, max 50/page).
 * Uses the same query params as the Receipts page — does not invent filters.
 */
export async function fetchAllPortalReceiptsForExport(
  query: Omit<PortalReceiptsQuery, "limit" | "offset" | "page">,
): Promise<PortalReceiptsResponse> {
  const first = await fetchPortalReceipts({
    ...query,
    limit: EXPORT_PAGE_SIZE,
    page: 1,
  });

  const totalPages = first.pagination.totalPages;
  if (totalPages <= 1) {
    return first;
  }

  const receipts = [...first.receipts];
  for (let page = 2; page <= totalPages; page += 1) {
    const next = await fetchPortalReceipts({
      ...query,
      limit: EXPORT_PAGE_SIZE,
      page,
    });
    receipts.push(...next.receipts);
  }

  return {
    ...first,
    receipts,
    pagination: {
      ...first.pagination,
      limit: receipts.length,
      offset: 0,
      page: 1,
      totalPages: 1,
      total: first.pagination.total,
    },
  };
}
