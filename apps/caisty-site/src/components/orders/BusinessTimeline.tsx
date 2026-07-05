import {
  Activity,
  Circle,
  HardDrive,
  Monitor,
  Receipt,
  RefreshCw,
} from "lucide-react";
import type { BusinessEvent } from "../../lib/orders/types";

function eventIcon(kind: BusinessEvent["kind"]) {
  switch (kind) {
    case "receipt_created":
      return Receipt;
    case "refund":
      return RefreshCw;
    case "cloud_synced":
      return Activity;
    case "pos_connected":
      return Monitor;
    case "device_connected":
      return HardDrive;
    default:
      return Circle;
  }
}

export function BusinessTimeline({
  events,
  locale,
  title,
  emptyLabel,
}: {
  events: BusinessEvent[];
  locale: string;
  title: string;
  emptyLabel: string;
}) {
  return (
    <section className="dashboard-panel">
      <h2 className="dashboard-panel-title">{title}</h2>
      {events.length === 0 ? (
        <p className="dashboard-text-muted">{emptyLabel}</p>
      ) : (
        <ul className="dashboard-activity-list">
          {events.map((event) => {
            const Icon = eventIcon(event.kind);
            const time = new Intl.DateTimeFormat(locale, {
              month: "short",
              day: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            }).format(new Date(event.at));

            return (
              <li key={event.id}>
                <div className="dashboard-activity-row">
                  <Icon size={14} className="dashboard-icon--muted" />
                  <span className="dashboard-activity-label">{event.label}</span>
                  <span className="dashboard-activity-time">{time}</span>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
