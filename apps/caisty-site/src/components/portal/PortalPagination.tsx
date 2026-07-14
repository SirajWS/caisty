import {
  buildPaginationWindow,
  paginationRangeLabel,
  type PortalPaginationMeta,
} from "../../lib/portal/portalPagination";

export function PortalPagination({
  pagination,
  onPageChange,
  labels,
}: {
  pagination: PortalPaginationMeta;
  onPageChange: (page: number) => void;
  labels: {
    previous: string;
    next: string;
    pageOf: string;
    showing: string;
  };
}) {
  if (pagination.totalPages <= 1 && pagination.total <= pagination.limit) {
    if (pagination.total <= 0) return null;
  }

  const pages = buildPaginationWindow(pagination.page, pagination.totalPages);
  const range = paginationRangeLabel({
    total: pagination.total,
    offset: pagination.offset,
    limit: pagination.limit,
    pageCount: Math.min(
      pagination.limit,
      Math.max(pagination.total - pagination.offset, 0),
    ),
  });

  const showingLabel = labels.showing
    .replace("{{from}}", String(range.from))
    .replace("{{to}}", String(range.to))
    .replace("{{total}}", String(pagination.total));

  const pageOfLabel = labels.pageOf
    .replace("{{page}}", String(pagination.page))
    .replace("{{totalPages}}", String(Math.max(pagination.totalPages, 1)));

  const previousDisabled = pagination.page <= 1 || pagination.totalPages <= 0;
  const nextDisabled =
    pagination.totalPages <= 0 || pagination.page >= pagination.totalPages;

  return (
    <div className="portal-pagination">
      <p className="portal-pagination-summary portal-pagination-summary--desktop">
        {showingLabel}
      </p>
      <div className="portal-pagination-controls">
        <button
          type="button"
          className="portal-pagination-nav"
          disabled={previousDisabled}
          aria-label={labels.previous}
          onClick={() => onPageChange(pagination.page - 1)}
        >
          ‹
        </button>

        <div className="portal-pagination-pages portal-pagination-pages--desktop">
          {pages.map((page, index) =>
            page === "ellipsis" ? (
              <span
                key={`ellipsis-${index}`}
                className="portal-pagination-ellipsis"
              >
                …
              </span>
            ) : (
              <button
                key={page}
                type="button"
                className={`portal-pagination-page ${
                  page === pagination.page ? "portal-pagination-page--active" : ""
                }`}
                aria-current={page === pagination.page ? "page" : undefined}
                onClick={() => onPageChange(page)}
              >
                {page}
              </button>
            ),
          )}
        </div>

        <p className="portal-pagination-compact portal-pagination-compact--mobile">
          {pageOfLabel}
        </p>

        <button
          type="button"
          className="portal-pagination-nav"
          disabled={nextDisabled}
          aria-label={labels.next}
          onClick={() => onPageChange(pagination.page + 1)}
        >
          ›
        </button>
      </div>

      <div className="portal-pagination-mobile-actions">
        <button
          type="button"
          className="portal-pagination-mobile-btn"
          disabled={previousDisabled}
          onClick={() => onPageChange(pagination.page - 1)}
        >
          {labels.previous}
        </button>
        <button
          type="button"
          className="portal-pagination-mobile-btn"
          disabled={nextDisabled}
          onClick={() => onPageChange(pagination.page + 1)}
        >
          {labels.next}
        </button>
      </div>
    </div>
  );
}
