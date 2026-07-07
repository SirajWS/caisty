import { portalSectionLabel } from "../../lib/portalUi";
import type { BillingKpi } from "../../lib/billing/types";

export function BillingOverview({
  kpis,
  loading,
  isLight,
}: {
  kpis: BillingKpi[];
  loading: boolean;
  isLight: boolean;
}) {
  if (loading) {
    return (
      <div className="dashboard-kpi-grid billing-kpi-grid">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="dashboard-kpi dashboard-kpi--skeleton animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div className="dashboard-kpi-grid billing-kpi-grid">
      {kpis.map((kpi) => (
        <div key={kpi.id} className="dashboard-kpi">
          <span className={portalSectionLabel(isLight)}>{kpi.label}</span>
          <span className="dashboard-kpi-value">{kpi.value}</span>
          {kpi.hint ? <span className="dashboard-kpi-hint">{kpi.hint}</span> : null}
        </div>
      ))}
    </div>
  );
}
