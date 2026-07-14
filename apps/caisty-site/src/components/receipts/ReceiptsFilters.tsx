import type { PortalTranslations } from "../../lib/translations/portal";
import {
  getReceiptsPeriodFilters,
  type ReceiptsPaymentFilter,
  type ReceiptsPeriodId,
  type ReceiptsSortId,
  type ReceiptsStatusFilter,
} from "../../lib/receipts/receiptsPeriod";

export function ReceiptsFilters({
  r,
  reports,
  period,
  paymentMethod,
  status,
  search,
  sort,
  onPeriodChange,
  onPaymentMethodChange,
  onStatusChange,
  onSearchChange,
  onSortChange,
}: {
  r: PortalTranslations["receipts"];
  reports: PortalTranslations["reports"];
  period: ReceiptsPeriodId;
  paymentMethod: ReceiptsPaymentFilter;
  status: ReceiptsStatusFilter;
  search: string;
  sort: ReceiptsSortId;
  onPeriodChange: (period: ReceiptsPeriodId) => void;
  onPaymentMethodChange: (value: ReceiptsPaymentFilter) => void;
  onStatusChange: (value: ReceiptsStatusFilter) => void;
  onSearchChange: (value: string) => void;
  onSortChange: (value: ReceiptsSortId) => void;
}) {
  const periodFilters = getReceiptsPeriodFilters(reports);

  return (
    <div className="receipts-filter-stack">
      <div className="reports-period-bar">
        <span className="reports-period-bar-label">{r.filtersTitle}</span>
        <div className="reports-filter-row" role="group" aria-label={r.filtersTitle}>
          {periodFilters.map((f) => {
            const isDisabled = Boolean(f.disabled);
            const isActive = !isDisabled && period === f.id;

            return (
              <button
                key={f.id}
                type="button"
                className={`reports-filter-btn ${
                  isActive ? "reports-filter-btn--active" : ""
                } ${isDisabled ? "reports-filter-btn--disabled" : ""}`}
                onClick={() => {
                  if (!isDisabled) onPeriodChange(f.id);
                }}
                disabled={isDisabled}
                aria-pressed={isActive}
                title={f.hint}
              >
                <span>{f.label}</span>
                {isDisabled && f.hint ? (
                  <span className="reports-filter-btn-badge">{reports.filterComingSoon}</span>
                ) : null}
              </button>
            );
          })}
        </div>
      </div>

      <div className="receipts-filter-row-secondary">
        <label className="receipts-filter-field">
          <span className="receipts-filter-label">{r.filterPayment}</span>
          <select
            className="receipts-filter-select"
            value={paymentMethod}
            onChange={(e) =>
              onPaymentMethodChange(e.target.value as ReceiptsPaymentFilter)
            }
          >
            <option value="all">{r.filterAllPayments}</option>
            <option value="cash">{r.paymentCash}</option>
            <option value="card">{r.paymentCard}</option>
            <option value="voucher">{r.paymentVoucher}</option>
            <option value="other">{r.paymentOther}</option>
          </select>
        </label>

        <label className="receipts-filter-field">
          <span className="receipts-filter-label">{r.filterStatus}</span>
          <select
            className="receipts-filter-select"
            value={status}
            onChange={(e) =>
              onStatusChange(e.target.value as ReceiptsStatusFilter)
            }
          >
            <option value="all">{r.filterAllStatuses}</option>
            <option value="active">{r.statusActive}</option>
            <option value="refunded">{r.statusRefunded}</option>
            <option value="partial_refund">{r.statusPartialRefund}</option>
            <option value="voided">{r.statusVoided}</option>
          </select>
        </label>

        <label className="receipts-filter-field receipts-filter-field--search">
          <span className="receipts-filter-label">{r.filterSearch}</span>
          <input
            type="search"
            className="receipts-filter-input"
            value={search}
            placeholder={r.searchPlaceholder}
            onChange={(e) => onSearchChange(e.target.value)}
          />
        </label>

        <label className="receipts-filter-field">
          <span className="receipts-filter-label">{r.filterSort}</span>
          <select
            className="receipts-filter-select"
            value={sort}
            onChange={(e) => onSortChange(e.target.value as ReceiptsSortId)}
          >
            <option value="newest">{r.sortNewest}</option>
            <option value="oldest">{r.sortOldest}</option>
          </select>
        </label>
      </div>
    </div>
  );
}
