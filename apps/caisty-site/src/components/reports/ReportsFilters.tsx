import React from "react";
import type { PortalTranslations } from "../../lib/translations/portal";

type FilterId = "today" | "yesterday" | "week" | "month" | "year" | "custom";

export function ReportsFilters({ r }: { r: PortalTranslations["reports"] }) {
  const [active, setActive] = React.useState<FilterId>("today");

  const filters: { id: FilterId; label: string }[] = [
    { id: "today", label: r.filterToday },
    { id: "yesterday", label: r.filterYesterday },
    { id: "week", label: r.filterThisWeek },
    { id: "month", label: r.filterThisMonth },
    { id: "year", label: r.filterThisYear },
    { id: "custom", label: r.filterCustom },
  ];

  return (
    <section className="dashboard-panel dashboard-panel--wide">
      <h2 className="dashboard-panel-title">{r.filtersTitle}</h2>
      <div className="reports-filter-row">
        {filters.map((f) => (
          <button
            key={f.id}
            type="button"
            className={`reports-filter-btn ${active === f.id ? "reports-filter-btn--active" : ""}`}
            onClick={() => setActive(f.id)}
            aria-pressed={active === f.id}
          >
            {f.label}
          </button>
        ))}
      </div>
      {active === "custom" ? (
        <p className="dashboard-text-muted text-xs mt-2">{r.filterCustomHint}</p>
      ) : null}
    </section>
  );
}
