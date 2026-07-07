import { portalSectionLabel } from "../../lib/portalUi";
import type { ReportsKpi } from "../../lib/reports/types";

export function ReportsOverview({
  kpis,
  loading,
  isLight,
  periodLabel,
  hideHints,
}: {
  kpis: ReportsKpi[];
  loading: boolean;
  isLight: boolean;
  periodLabel?: string;
  hideHints?: boolean;
}) {
  if (loading) {
    return (
      <div className="dashboard-kpi-grid reports-kpi-grid">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="dashboard-kpi dashboard-kpi--skeleton animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div className="dashboard-kpi-grid reports-kpi-grid">
      {kpis.map((kpi) => (
        <div key={kpi.id} className="dashboard-kpi">
          <span className={portalSectionLabel(isLight)}>
            {periodLabel ? `${kpi.label} · ${periodLabel}` : kpi.label}
          </span>
          <span className="dashboard-kpi-value tabular-nums">{kpi.value}</span>
          {!hideHints && kpi.hint ? <span className="dashboard-kpi-hint">{kpi.hint}</span> : null}
        </div>
      ))}
    </div>
  );
}
