import type { ChecklistItem, ChecklistStatus } from "../../lib/business/types";

function statusClass(status: ChecklistStatus): string {
  if (status === "complete") return "business-checklist-badge--complete";
  if (status === "pending") return "business-checklist-badge--pending";
  return "business-checklist-badge--incomplete";
}

export function CompletionChecklist({
  items,
  title,
  completionLabel,
  completionPercent,
}: {
  items: ChecklistItem[];
  title: string;
  completionLabel: string;
  completionPercent: number;
}) {
  return (
    <section className="dashboard-panel dashboard-panel--wide">
      <div className="business-checklist-head">
        <h2 className="dashboard-panel-title m-0">{title}</h2>
        <span className="business-checklist-percent">
          {completionLabel}: {completionPercent}%
        </span>
      </div>
      <ul className="business-checklist">
        {items.map((item) => (
          <li key={item.id} className="business-checklist-row">
            <span className="business-checklist-label">{item.label}</span>
            <span className={`business-checklist-badge ${statusClass(item.status)}`}>
              {item.statusLabel}
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}
