import type { DeviceHealthItem } from "../../lib/devices/types";

function statusClass(status: DeviceHealthItem["status"]): string {
  if (status === "online") return "devices-health-dot--online";
  if (status === "offline") return "devices-health-dot--offline";
  return "devices-health-dot--unknown";
}

export function DeviceHealth({
  items,
  title,
}: {
  items: DeviceHealthItem[];
  title: string;
}) {
  return (
    <section className="dashboard-panel">
      <h2 className="dashboard-panel-title">{title}</h2>
      <ul className="devices-health-list">
        {items.map((item) => (
          <li key={item.id} className="devices-health-row">
            <span className="devices-health-label">{item.label}</span>
            <span className="devices-health-status">
              <span className={`devices-health-dot ${statusClass(item.status)}`} aria-hidden />
              {item.statusLabel}
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}
