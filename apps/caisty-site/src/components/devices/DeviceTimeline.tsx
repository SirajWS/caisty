import {
  Circle,
  Cloud,
  HardDrive,
  Monitor,
  Printer,
  RefreshCw,
  Shield,
} from "lucide-react";
import type { DeviceTimelineEvent } from "../../lib/devices/types";

function eventIcon(kind: DeviceTimelineEvent["kind"]) {
  switch (kind) {
    case "pos_started":
      return Monitor;
    case "pos_closed":
      return Monitor;
    case "cloud_synced":
      return Cloud;
    case "device_connected":
      return HardDrive;
    case "device_disconnected":
      return HardDrive;
    case "update_installed":
      return RefreshCw;
    case "printer_connected":
      return Printer;
    case "fiscal_connected":
      return Shield;
    default:
      return Circle;
  }
}

export function DeviceTimeline({
  events,
  locale,
  title,
  emptyLabel,
}: {
  events: DeviceTimelineEvent[];
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
