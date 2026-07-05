import React from "react";
import type { PortalTranslations } from "../../lib/translations/portal";

type FilterId = "today" | "yesterday" | "last7" | "custom";

export function OrdersFilters({ o }: { o: PortalTranslations["orders"] }) {
  const [active, setActive] = React.useState<FilterId>("today");

  const filters: { id: FilterId; label: string }[] = [
    { id: "today", label: o.filterToday },
    { id: "yesterday", label: o.filterYesterday },
    { id: "last7", label: o.filterLast7 },
    { id: "custom", label: o.filterCustom },
  ];

  return (
    <section className="dashboard-panel dashboard-panel--wide">
      <h2 className="dashboard-panel-title">{o.filtersTitle}</h2>
      <div className="orders-filter-row">
        {filters.map((f) => (
          <button
            key={f.id}
            type="button"
            className={`orders-filter-btn ${active === f.id ? "orders-filter-btn--active" : ""}`}
            onClick={() => setActive(f.id)}
            aria-pressed={active === f.id}
          >
            {f.label}
          </button>
        ))}
      </div>
      {active === "custom" ? (
        <p className="dashboard-text-muted text-xs mt-2">{o.filterCustomHint}</p>
      ) : null}
    </section>
  );
}

export function OrdersQuickActions({
  actions,
  title,
}: {
  actions: { id: string; label: string; disabled: boolean; badge?: string }[];
  title: string;
}) {
  return (
    <section className="dashboard-panel">
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
