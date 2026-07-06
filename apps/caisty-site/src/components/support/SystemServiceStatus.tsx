import type { ServiceStatusItem } from "../../lib/support/types";

function toneClass(tone: ServiceStatusItem["tone"]): string {
  if (tone === "operational") return "support-status-badge support-status-badge--operational";
  if (tone === "coming_soon") return "support-status-badge support-status-badge--soon";
  if (tone === "not_configured") return "support-status-badge support-status-badge--muted";
  return "support-status-badge support-status-badge--unknown";
}

export function SystemServiceStatus({
  items,
  title,
}: {
  items: ServiceStatusItem[];
  title: string;
}) {
  return (
    <section className="dashboard-panel">
      <h2 className="dashboard-panel-title">{title}</h2>
      <ul className="support-status-list">
        {items.map((item) => (
          <li key={item.id} className="support-status-row">
            <span className="support-status-label">{item.label}</span>
            <span className={toneClass(item.tone)}>{item.value}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}
