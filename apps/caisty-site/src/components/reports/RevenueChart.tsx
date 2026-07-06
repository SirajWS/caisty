import React from "react";
import { BarChart3 } from "lucide-react";
import type { PortalTranslations } from "../../lib/translations/portal";
import type { RevenueTimeRange } from "../../lib/reports/types";

type RangeId = RevenueTimeRange;

export function RevenueChart({
  title,
  placeholderMessage,
  rangeLabels,
}: {
  title: string;
  placeholderMessage: string;
  rangeLabels: PortalTranslations["reports"]["revenueRanges"];
}) {
  const [range, setRange] = React.useState<RangeId>("today");

  const ranges: { id: RangeId; label: string }[] = [
    { id: "today", label: rangeLabels.today },
    { id: "7d", label: rangeLabels.days7 },
    { id: "30d", label: rangeLabels.days30 },
    { id: "12m", label: rangeLabels.months12 },
    { id: "all", label: rangeLabels.allTime },
  ];

  return (
    <section className="dashboard-panel dashboard-panel--wide reports-chart-panel">
      <div className="reports-chart-header">
        <h2 className="dashboard-panel-title">{title}</h2>
        <div className="reports-filter-row" role="group" aria-label={title}>
          {ranges.map((r) => (
            <button
              key={r.id}
              type="button"
              className={`reports-filter-btn ${range === r.id ? "reports-filter-btn--active" : ""}`}
              onClick={() => setRange(r.id)}
              aria-pressed={range === r.id}
            >
              {r.label}
            </button>
          ))}
        </div>
      </div>
      <div className="reports-chart-placeholder" aria-hidden={false}>
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
        <p className="reports-chart-placeholder-text">{placeholderMessage}</p>
      </div>
    </section>
  );
}
