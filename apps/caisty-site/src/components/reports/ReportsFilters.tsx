import type { PortalTranslations } from "../../lib/translations/portal";
import {
  getReportsPeriodFilters,
  type ReportsPeriodId,
} from "../../lib/reports/reportsPeriod";

export function ReportsFilters({
  r,
  period,
  onPeriodChange,
}: {
  r: PortalTranslations["reports"];
  period: ReportsPeriodId;
  onPeriodChange: (period: ReportsPeriodId) => void;
}) {
  const filters = getReportsPeriodFilters(r);

  return (
    <div className="reports-period-bar">
      <span className="reports-period-bar-label">{r.filtersTitle}</span>
      <div className="reports-filter-row" role="group" aria-label={r.filtersTitle}>
        {filters.map((f) => {
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
              aria-disabled={isDisabled || undefined}
            >
              <span>{f.label}</span>
              {isDisabled && f.hint ? (
                <span className="reports-filter-btn-badge">{r.filterComingSoon}</span>
              ) : null}
            </button>
          );
        })}
      </div>
    </div>
  );
}
