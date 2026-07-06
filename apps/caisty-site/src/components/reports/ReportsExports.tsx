import type { ReportExportAction } from "../../lib/reports/types";

export function ReportsExports({
  actions,
  title,
}: {
  actions: ReportExportAction[];
  title: string;
}) {
  return (
    <section className="dashboard-panel dashboard-panel--wide reports-exports-panel">
      <h2 className="dashboard-panel-title">{title}</h2>
      <div className="dashboard-quick-actions">
        {actions.map((action) => (
          <span
            key={action.id}
            className="dashboard-quick-btn dashboard-quick-btn--disabled"
            aria-disabled
          >
            {action.label}
            {action.badge ? <span className="dashboard-quick-badge">{action.badge}</span> : null}
          </span>
        ))}
      </div>
    </section>
  );
}
