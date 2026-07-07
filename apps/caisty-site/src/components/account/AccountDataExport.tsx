import type { AccountPlaceholderAction } from "../../lib/account/types";

export function AccountDataExport({
  actions,
  title,
}: {
  actions: AccountPlaceholderAction[];
  title: string;
}) {
  return (
    <section className="dashboard-panel">
      <h2 className="dashboard-panel-title">{title}</h2>
      <div className="account-data-actions">
        {actions.map((action) =>
          action.href && !action.disabled ? (
            <a
              key={action.id}
              href={action.href}
              className="account-secondary-btn account-secondary-btn--link"
            >
              {action.label}
            </a>
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
