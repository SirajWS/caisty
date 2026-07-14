import { portalSectionLabel } from "../../lib/portalUi";
import type { OrdersKpi } from "../../lib/orders/types";

function KpiGrid({
  kpis,
  className,
  isLight,
}: {
  kpis: OrdersKpi[];
  className: string;
  isLight: boolean;
}) {
  return (
    <div className={className}>
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

export function OrdersSummary({
  orderKpis,
  revenueKpis,
  loading,
  isLight,
}: {
  orderKpis: OrdersKpi[];
  revenueKpis: OrdersKpi[];
  loading: boolean;
  isLight: boolean;
}) {
  if (loading) {
    return (
      <div className="orders-summary">
        <div className="dashboard-kpi-grid dashboard-kpi-grid--orders">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="dashboard-kpi dashboard-kpi--skeleton animate-pulse" />
          ))}
        </div>
        <div className="dashboard-kpi-grid dashboard-kpi-grid--orders-revenue">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="dashboard-kpi dashboard-kpi--skeleton animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="orders-summary">
      <KpiGrid
        kpis={orderKpis}
        className="dashboard-kpi-grid dashboard-kpi-grid--orders"
        isLight={isLight}
      />
      <KpiGrid
        kpis={revenueKpis}
        className="dashboard-kpi-grid dashboard-kpi-grid--orders-revenue"
        isLight={isLight}
      />
    </div>
  );
}
