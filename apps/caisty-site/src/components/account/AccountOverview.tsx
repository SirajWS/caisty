import { portalSectionLabel } from "../../lib/portalUi";
import type { AccountKpi } from "../../lib/account/types";

export function AccountOverview({
  kpis,
  isLight,
}: {
  kpis: AccountKpi[];
  isLight: boolean;
}) {
  return (
    <div className="dashboard-kpi-grid account-kpi-grid">
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
