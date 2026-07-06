import { AlertTriangle } from "lucide-react";
import type { PosHubTone } from "../../lib/posHub/types";
import type { DeviceAlert } from "../../lib/devices/types";

function toneClass(tone: PosHubTone): string {
  if (tone === "ok") return "dashboard-icon--ok";
  if (tone === "attention") return "dashboard-icon--attention";
  if (tone === "action_required") return "dashboard-icon--action";
  return "dashboard-icon--muted";
}

export function DeviceAlerts({
  alerts,
  title,
  emptyLabel,
}: {
  alerts: DeviceAlert[];
  title: string;
  emptyLabel: string;
}) {
  return (
    <section className="dashboard-panel dashboard-panel--wide">
      <h2 className="dashboard-panel-title">{title}</h2>
      {alerts.length === 0 ? (
        <p className="dashboard-text-muted">{emptyLabel}</p>
      ) : (
        <ul className="devices-alerts-list">
          {alerts.map((alert) => (
            <li key={alert.id} className="devices-alert-row">
              <AlertTriangle size={14} className={toneClass(alert.tone)} />
              <span>{alert.message}</span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
