import type { BusinessQuickAction } from "../../lib/business/types";

export function BusinessQuickActions({
  actions,
  title,
  onAction,
}: {
  actions: BusinessQuickAction[];
  title: string;
  onAction?: (action: BusinessQuickAction) => void;
}) {
  return (
    <section className="dashboard-panel dashboard-panel--wide">
      <h2 className="dashboard-panel-title">{title}</h2>
      <div className="dashboard-quick-actions">
        {actions.map((action) =>
          !action.disabled && action.action === "scroll_to_edit" ? (
            <button
              key={action.id}
              type="button"
              className="dashboard-quick-btn business-quick-btn--active"
              onClick={() => onAction?.(action)}
            >
              {action.label}
            </button>
          ) : (
            <span
              key={action.id}
              className="dashboard-quick-btn dashboard-quick-btn--disabled"
              aria-disabled
            >
              {action.label}
              {action.badge ? <span className="dashboard-quick-badge">{action.badge}</span> : null}
            </span>
          ),
        )}
      </div>
    </section>
  );
}
