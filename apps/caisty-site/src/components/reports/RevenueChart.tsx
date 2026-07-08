import { BarChart3 } from "lucide-react";
import type { RevenueChartState } from "../../lib/reports/types";

function buildPolylinePoints(series: RevenueChartState["series"]): string {
  if (!series.length) {
    return "0,100 400,100";
  }

  const maxRevenue = Math.max(...series.map((point) => point.revenueMinor), 1);
  const step = series.length > 1 ? 400 / (series.length - 1) : 0;

  return series
    .map((point, index) => {
      const x = series.length > 1 ? index * step : 200;
      const normalized = point.revenueMinor / maxRevenue;
      const y = 100 - normalized * 80;
      return `${x},${y}`;
    })
    .join(" ");
}

export function RevenueChart({
  title,
  chart,
  mutedPlaceholder,
}: {
  title: string;
  chart: RevenueChartState;
  mutedPlaceholder?: boolean;
}) {
  const hasData = chart.hasData && chart.series.length > 0;

  return (
    <section className="dashboard-panel dashboard-panel--wide reports-chart-panel">
      <h2 className="dashboard-panel-title">{title}</h2>
      <div
        className={`reports-chart-placeholder ${mutedPlaceholder ? "reports-chart-placeholder--muted" : ""}`}
        aria-hidden={false}
      >
        <div className="reports-chart-placeholder-icon">
          <BarChart3 size={28} strokeWidth={1.5} />
        </div>
        <svg className="reports-chart-placeholder-svg" viewBox="0 0 400 120" preserveAspectRatio="none">
          <line x1="0" y1="100" x2="400" y2="100" className="reports-chart-axis" />
          {[60, 120, 180, 240, 300, 360].map((x) => (
            <line key={x} x1={x} y1="100" x2={x} y2="20" className="reports-chart-grid-line" />
          ))}
          <polyline
            points={buildPolylinePoints(chart.series)}
            className={
              hasData
                ? "reports-chart-line"
                : "reports-chart-line reports-chart-line--empty"
            }
          />
        </svg>
        {!mutedPlaceholder && !hasData ? (
          <p className="reports-chart-placeholder-text">{chart.placeholderMessage}</p>
        ) : null}
      </div>
    </section>
  );
}
