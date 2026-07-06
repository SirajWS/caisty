import type { BillingPlaceholderAction } from "../../lib/billing/types";

export function BillingDownloads({
  actions,
  title,
}: {
  actions: BillingPlaceholderAction[];
  title: string;
}) {
  return (
    <section className="dashboard-panel">
      <h2 className="dashboard-panel-title">{title}</h2>
      <div className="billing-data-actions">
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
