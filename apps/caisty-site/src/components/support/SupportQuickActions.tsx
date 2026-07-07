import type { SupportPlaceholderAction } from "../../lib/support/types";
import { portalPrimaryCta } from "../../lib/portalUi";

export function SupportQuickActions({
  actions,
  title,
  isLight,
}: {
  actions: SupportPlaceholderAction[];
  title: string;
  isLight: boolean;
}) {
  function handleAction(action: SupportPlaceholderAction) {
    if (action.onClickId === "scroll-form") {
      document.getElementById("support-request-form")?.scrollIntoView({ behavior: "smooth" });
    }
  }

  return (
    <section className="dashboard-panel">
      <h2 className="dashboard-panel-title">{title}</h2>
      <div className="support-data-actions">
        {actions.map((action) => {
          if (action.onClickId === "scroll-form" && !action.disabled) {
            return (
              <button
                key={action.id}
                type="button"
                onClick={() => handleAction(action)}
                className={portalPrimaryCta()}
              >
                {action.label}
              </button>
            );
          }

          if (action.href && !action.disabled) {
            if (action.href.startsWith("#") || action.href.startsWith("/")) {
              return (
                <a
                  key={action.id}
                  href={action.href}
                  className={`support-secondary-btn ${isLight ? "support-secondary-btn--light" : ""} support-secondary-btn--link`}
                >
                  {action.label}
                </a>
              );
            }
            return (
              <a
                key={action.id}
                href={action.href}
                className={`support-secondary-btn ${isLight ? "support-secondary-btn--light" : ""} support-secondary-btn--link`}
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
