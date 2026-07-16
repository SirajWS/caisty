import { portalSectionLabel } from "../../lib/portalUi";
import type { ReportsKpi } from "../../lib/reports/types";

function BreakdownGrid({
  kpis,
  loading,
  isLight,
  className,
}: {
  kpis: ReportsKpi[];
  loading: boolean;
  isLight: boolean;
  className: string;
}) {
  if (loading) {
    return (
      <div className={className}>
        {Array.from({ length: 3 }).map((_, i) => (
          <div
            key={i}
            className="dashboard-kpi dashboard-kpi--compact dashboard-kpi--skeleton animate-pulse"
          />
        ))}
      </div>
    );
  }

  return (
    <div className={className}>
      {kpis.map((kpi) => (
        <div key={kpi.id} className="dashboard-kpi dashboard-kpi--compact">
          <span className={portalSectionLabel(isLight)}>{kpi.label}</span>
          <span className="dashboard-kpi-value tabular-nums">{kpi.value}</span>
          {kpi.hint ? <span className="dashboard-kpi-hint">{kpi.hint}</span> : null}
        </div>
      ))}
    </div>
  );
}

export function ReportsBreakdowns({
  revenueBreakdown,
  orderBreakdown,
  loading,
  isLight,
}: {
  revenueBreakdown: ReportsKpi[];
  orderBreakdown: ReportsKpi[];
  loading: boolean;
  isLight: boolean;
}) {
  return (
    <div className="reports-breakdowns">
      <BreakdownGrid
        kpis={revenueBreakdown}
        loading={loading}
        isLight={isLight}
        className="dashboard-kpi-grid reports-breakdown-grid"
      />
      <BreakdownGrid
        kpis={orderBreakdown}
        loading={loading}
        isLight={isLight}
        className="dashboard-kpi-grid reports-breakdown-grid"
      />
    </div>
  );
}
