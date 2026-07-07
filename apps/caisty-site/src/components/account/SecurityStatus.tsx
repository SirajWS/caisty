import type { SecurityStatusItem } from "../../lib/account/types";

function badgeClass(tone: SecurityStatusItem["tone"]): string {
  if (tone === "ok") return "account-status-badge account-status-badge--ok";
  if (tone === "attention") return "account-status-badge account-status-badge--attention";
  return "account-status-badge account-status-badge--muted";
}

export function SecurityStatus({
  items,
  title,
}: {
  items: SecurityStatusItem[];
  title: string;
}) {
  return (
    <section className="dashboard-panel account-security-status">
      <h2 className="dashboard-panel-title">{title}</h2>
      <ul className="account-status-list">
        {items.map((item) => (
          <li key={item.id} className="account-status-row">
            <span className="account-status-label">{item.label}</span>
            <span className={badgeClass(item.tone)}>{item.value}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}
