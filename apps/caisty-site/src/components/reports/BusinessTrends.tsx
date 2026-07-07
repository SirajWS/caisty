import type { TrendCard } from "../../lib/reports/types";

export function BusinessTrends({
  trends,
  title,
  hint,
}: {
  trends: TrendCard[];
  title: string;
  hint?: string;
}) {
  return (
    <section className="dashboard-panel">
      <h2 className="dashboard-panel-title">{title}</h2>
      <div className="reports-trends-grid">
        {trends.map((trend) => (
          <div key={trend.id} className="reports-trend-card">
            <span className="reports-stat-label">{trend.label}</span>
            <span className="reports-trend-value tabular-nums">{trend.value}</span>
          </div>
        ))}
      </div>
      {hint ? <p className="reports-section-hint">{hint}</p> : null}
    </section>
  );
}
