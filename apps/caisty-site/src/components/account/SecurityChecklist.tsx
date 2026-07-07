import type { SecurityChecklistItem } from "../../lib/account/types";

function statusClass(status: SecurityChecklistItem["status"]): string {
  if (status === "complete") return "account-checklist-badge--complete";
  if (status === "pending") return "account-checklist-badge--pending";
  return "account-checklist-badge--soon";
}

export function SecurityChecklist({
  items,
  title,
}: {
  items: SecurityChecklistItem[];
  title: string;
}) {
  return (
    <section className="dashboard-panel">
      <h2 className="dashboard-panel-title">{title}</h2>
      <ul className="account-checklist">
        {items.map((item) => (
          <li key={item.id} className="account-checklist-row">
            <span className="account-checklist-label">{item.label}</span>
            <span className={`account-checklist-badge ${statusClass(item.status)}`}>
              {item.statusLabel}
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}
