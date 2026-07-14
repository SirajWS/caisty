import { portalSectionLabel } from "../../lib/portalUi";
import type { ReceiptsKpi } from "../../lib/receipts/types";

export function ReceiptsSummary({
  kpis,
  loading,
  isLight,
}: {
  kpis: ReceiptsKpi[];
  loading: boolean;
  isLight: boolean;
}) {
  if (loading) {
    return (
      <div className="dashboard-kpi-grid dashboard-kpi-grid--receipts">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="dashboard-kpi dashboard-kpi--skeleton animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div className="dashboard-kpi-grid dashboard-kpi-grid--receipts">
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
