import { BarChart3 } from "lucide-react";

export function RevenueChart({
  title,
  placeholderMessage,
  mutedPlaceholder,
}: {
  title: string;
  placeholderMessage: string;
  mutedPlaceholder?: boolean;
}) {
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
            points="0,100 60,100 120,100 180,100 240,100 300,100 360,100 400,100"
            className="reports-chart-line reports-chart-line--empty"
          />
        </svg>
        {!mutedPlaceholder ? (
          <p className="reports-chart-placeholder-text">{placeholderMessage}</p>
        ) : null}
      </div>
    </section>
  );
}
