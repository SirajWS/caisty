import type { BillingPlaceholderAction } from "../../lib/billing/types";
import { portalPrimaryCta } from "../../lib/portalUi";

export function BillingQuickActions({
  actions,
  title,
  isLight,
  onManageSubscription,
  busyBillingPortal,
}: {
  actions: BillingPlaceholderAction[];
  title: string;
  isLight: boolean;
  onManageSubscription?: () => void;
  busyBillingPortal?: boolean;
}) {
  return (
    <section className="dashboard-panel">
      <h2 className="dashboard-panel-title">{title}</h2>
      <div className="billing-data-actions">
        {actions.map((action) => {
          if (action.id === "manage" && onManageSubscription && !action.disabled) {
            return (
              <button
                key={action.id}
                type="button"
                onClick={onManageSubscription}
                disabled={busyBillingPortal}
                className={`${portalPrimaryCta()} disabled:opacity-60`}
              >
                {busyBillingPortal ? "…" : action.label}
              </button>
            );
          }

          if (action.id === "portal" && onManageSubscription && !action.disabled) {
            return (
              <button
                key={action.id}
                type="button"
                onClick={onManageSubscription}
                disabled={busyBillingPortal}
                className={`billing-secondary-btn ${isLight ? "billing-secondary-btn--light" : ""} disabled:opacity-60`}
              >
                {action.label}
              </button>
            );
          }

          if (action.href && !action.disabled) {
            if (action.href.startsWith("#")) {
              return (
                <a key={action.id} href={action.href} className="billing-secondary-btn billing-secondary-btn--link">
                  {action.label}
                </a>
              );
            }
            return (
              <a
                key={action.id}
                href={action.href}
                className="billing-secondary-btn billing-secondary-btn--link"
              >
                {action.label}
              </a>
            );
          }

          return (
            <span
              key={action.id}
              className="dashboard-quick-btn dashboard-quick-btn--disabled"
              aria-disabled
            >
              {action.label}
              {action.badge ? <span className="dashboard-quick-badge">{action.badge}</span> : null}
            </span>
          );
        })}
      </div>
    </section>
  );
}
