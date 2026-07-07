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
        {filters.map((f) => (
          <button
            key={f.id}
            type="button"
            className={`reports-filter-btn ${period === f.id ? "reports-filter-btn--active" : ""}`}
            onClick={() => onPeriodChange(f.id)}
            aria-pressed={period === f.id}
          >
            {f.label}
          </button>
        ))}
      </div>
      {period === "custom" ? (
        <p className="reports-period-custom-hint">{r.filterCustomHint}</p>
      ) : null}
    </div>
  );
}
