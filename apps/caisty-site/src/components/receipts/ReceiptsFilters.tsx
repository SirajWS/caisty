import type { PortalTranslations } from "../../lib/translations/portal";
import {
  getReceiptsPeriodFilters,
  type ReceiptsPaymentFilter,
  type AppliedReceiptsPeriod,
  type ReceiptsSortId,
  type ReceiptsStatusFilter,
} from "../../lib/receipts/receiptsPeriod";
import { reportsTodayIso, type ReportsPresetId } from "../../lib/reports/reportsPeriod";

export function ReceiptsFilters({
  r,
  reports,
  applied,
  pickerOpen,
  draftFrom,
  draftTo,
  draftError,
  paymentMethod,
  status,
  search,
  sort,
  onPresetChange,
  onCustomClick,
  onDraftFromChange,
  onDraftToChange,
  onApply,
  onCancel,
  onReset,
  onPaymentMethodChange,
  onStatusChange,
  onSearchChange,
  onSortChange,
}: {
  r: PortalTranslations["receipts"];
  reports: PortalTranslations["reports"];
  applied: AppliedReceiptsPeriod;
  pickerOpen: boolean;
  draftFrom: string;
  draftTo: string;
  draftError: string | null;
  paymentMethod: ReceiptsPaymentFilter;
  status: ReceiptsStatusFilter;
  search: string;
  sort: ReceiptsSortId;
  onPresetChange: (period: ReportsPresetId) => void;
  onCustomClick: () => void;
  onDraftFromChange: (value: string) => void;
  onDraftToChange: (value: string) => void;
  onApply: () => void;
  onCancel: () => void;
  onReset: () => void;
  onPaymentMethodChange: (value: ReceiptsPaymentFilter) => void;
  onStatusChange: (value: ReceiptsStatusFilter) => void;
  onSearchChange: (value: string) => void;
  onSortChange: (value: ReceiptsSortId) => void;
}) {
  const periodFilters = getReceiptsPeriodFilters(reports);
  const maxDate = reportsTodayIso();
  const customActive = applied.period === "custom";

  return (
    <div className="receipts-filter-stack">
      <div className="reports-period-bar">
        <span className="reports-period-bar-label">{r.filtersTitle}</span>
        <div className="reports-filter-row" role="group" aria-label={r.filtersTitle}>
          {periodFilters.map((f) => {
            const isCustom = f.id === "custom";
            const isActive = isCustom
              ? customActive || pickerOpen
              : !pickerOpen && applied.period === f.id;

            return (
              <button
                key={f.id}
                type="button"
                className={`reports-filter-btn ${
                  isActive ? "reports-filter-btn--active" : ""
                }`}
                onClick={() => {
                  if (isCustom) {
                    onCustomClick();
                    return;
                  }
                  onPresetChange(f.id as ReportsPresetId);
                }}
                aria-pressed={isActive}
              >
                <span>{f.label}</span>
              </button>
            );
          })}
        </div>

        {pickerOpen ? (
          <div className="reports-custom-panel" role="region" aria-label={reports.filterCustom}>
            <label className="reports-custom-field">
              <span>{reports.filterFrom}</span>
              <input
                type="date"
                value={draftFrom}
                max={maxDate}
                onChange={(event) => onDraftFromChange(event.target.value)}
                className="reports-custom-input"
              />
            </label>
            <label className="reports-custom-field">
              <span>{reports.filterTo}</span>
              <input
                type="date"
                value={draftTo}
                max={maxDate}
                min={draftFrom || undefined}
                onChange={(event) => onDraftToChange(event.target.value)}
                className="reports-custom-input"
              />
            </label>
            <div className="reports-custom-actions">
              <button type="button" className="reports-filter-btn reports-filter-btn--active" onClick={onApply}>
                {reports.filterApply}
              </button>
              <button type="button" className="reports-filter-btn" onClick={onCancel}>
                {reports.filterCancel}
              </button>
              <button type="button" className="reports-filter-btn" onClick={onReset}>
                {reports.filterReset}
              </button>
            </div>
            {draftError ? (
              <p className="reports-custom-error" role="alert">
                {draftError}
              </p>
            ) : (
              <p className="reports-period-custom-hint">{reports.filterCustomHelp}</p>
            )}
          </div>
        ) : null}
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
