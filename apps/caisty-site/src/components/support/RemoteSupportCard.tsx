import type { RemoteSupportItem } from "../../lib/support/types";

function toneClass(tone: RemoteSupportItem["tone"]): string {
  if (tone === "operational") return "support-status-badge support-status-badge--operational";
  return "support-status-badge support-status-badge--soon";
}

export function RemoteSupportCard({
  items,
  title,
}: {
  items: RemoteSupportItem[];
  title: string;
}) {
  return (
    <section className="dashboard-panel">
      <h2 className="dashboard-panel-title">{title}</h2>
      <ul className="support-status-list">
        {items.map((item) => (
          <li key={item.id} className="support-status-row">
            <span className="support-status-label">{item.label}</span>
            <span className={toneClass(item.tone)}>{item.status}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}
