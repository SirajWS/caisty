import type { PortalTranslations } from "../../lib/translations/portal";
import {
  getReportsPeriodFilters,
  reportsTodayIso,
  type AppliedReportsPeriod,
  type ReportsPresetId,
} from "../../lib/reports/reportsPeriod";

export function ReportsFilters({
  r,
  applied,
  pickerOpen,
  draftFrom,
  draftTo,
  draftError,
  onPresetChange,
  onCustomClick,
  onDraftFromChange,
  onDraftToChange,
  onApply,
  onCancel,
  onReset,
}: {
  r: PortalTranslations["reports"];
  applied: AppliedReportsPeriod;
  pickerOpen: boolean;
  draftFrom: string;
  draftTo: string;
  draftError: string | null;
  onPresetChange: (period: ReportsPresetId) => void;
  onCustomClick: () => void;
  onDraftFromChange: (value: string) => void;
  onDraftToChange: (value: string) => void;
  onApply: () => void;
  onCancel: () => void;
  onReset: () => void;
}) {
  const filters = getReportsPeriodFilters(r);
  const maxDate = reportsTodayIso();
  const customActive = applied.period === "custom";

  return (
    <div className="reports-period-bar">
      <span className="reports-period-bar-label">{r.filtersTitle}</span>
      <div className="reports-filter-row" role="group" aria-label={r.filtersTitle}>
        {filters.map((f) => {
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
        <div className="reports-custom-panel" role="region" aria-label={r.filterCustom}>
          <label className="reports-custom-field">
            <span>{r.filterFrom}</span>
            <input
              type="date"
              value={draftFrom}
              max={maxDate}
              onChange={(event) => onDraftFromChange(event.target.value)}
              className="reports-custom-input"
            />
          </label>
          <label className="reports-custom-field">
            <span>{r.filterTo}</span>
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
              {r.filterApply}
            </button>
            <button type="button" className="reports-filter-btn" onClick={onCancel}>
              {r.filterCancel}
            </button>
            <button type="button" className="reports-filter-btn" onClick={onReset}>
              {r.filterReset}
            </button>
          </div>
          {draftError ? (
            <p className="reports-custom-error" role="alert">
              {draftError}
            </p>
          ) : (
            <p className="reports-period-custom-hint">{r.filterCustomHelp}</p>
          )}
        </div>
      ) : null}
    </div>
  );
}
