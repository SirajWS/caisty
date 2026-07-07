import { portalSectionLabel } from "../../lib/portalUi";
import type { OrdersKpi } from "../../lib/orders/types";

export function OrdersSummary({
  kpis,
  loading,
  isLight,
}: {
  kpis: OrdersKpi[];
  loading: boolean;
  isLight: boolean;
}) {
  if (loading) {
    return (
      <div className="dashboard-kpi-grid dashboard-kpi-grid--orders">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="dashboard-kpi dashboard-kpi--skeleton animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div className="dashboard-kpi-grid dashboard-kpi-grid--orders">
      {kpis.map((kpi) => (
        <div key={kpi.id} className="dashboard-kpi">
          <span className={portalSectionLabel(isLight)}>{kpi.label}</span>
          <span className="dashboard-kpi-value tabular-nums">{kpi.value}</span>
          {kpi.hint ? <span className="dashboard-kpi-hint">{kpi.hint}</span> : null}
        </div>
      ))}
    </div>
  );
}
