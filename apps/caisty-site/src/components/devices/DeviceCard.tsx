import type { PosHubTone } from "../../lib/posHub/types";
import type { DeviceCardView } from "../../lib/devices/types";

function toneClass(tone: PosHubTone): string {
  if (tone === "ok") return "devices-status-badge--online";
  if (tone === "attention") return "devices-status-badge--warning";
  if (tone === "action_required") return "devices-status-badge--offline";
  return "devices-status-badge--offline";
}

export function DeviceCard({
  device,
  labels,
  onSelect,
}: {
  device: DeviceCardView;
  labels: {
    platform: string;
    version: string;
    currentUser: string;
    heartbeat: string;
    connection: string;
    cloudStatus: string;
    environment: string;
    license: string;
    store: string;
  };
  onSelect: (id: string) => void;
}) {
  return (
    <button
      type="button"
      className="devices-card"
      onClick={() => onSelect(device.id)}
      aria-label={device.name}
    >
      <div className="devices-card-head">
        <span className="devices-card-name">{device.name}</span>
        <span className={`devices-status-badge ${toneClass(device.statusTone)}`}>
          {device.statusLabel}
        </span>
      </div>
      <dl className="devices-card-meta">
        <div className="devices-card-row">
          <dt>{labels.platform}</dt>
          <dd>{device.platform}</dd>
        </div>
        <div className="devices-card-row">
          <dt>{labels.version}</dt>
          <dd>{device.version}</dd>
        </div>
        <div className="devices-card-row">
          <dt>{labels.currentUser}</dt>
          <dd>{device.currentUser}</dd>
        </div>
        <div className="devices-card-row">
          <dt>{labels.heartbeat}</dt>
          <dd>{device.heartbeat}</dd>
        </div>
        <div className="devices-card-row">
          <dt>{labels.connection}</dt>
          <dd>{device.connection}</dd>
        </div>
        <div className="devices-card-row">
          <dt>{labels.cloudStatus}</dt>
          <dd>{device.cloudStatus}</dd>
        </div>
        <div className="devices-card-row">
          <dt>{labels.environment}</dt>
          <dd>{device.environment}</dd>
        </div>
        <div className="devices-card-row">
          <dt>{labels.license}</dt>
          <dd className="font-mono text-xs">{device.license}</dd>
        </div>
        <div className="devices-card-row">
          <dt>{labels.store}</dt>
          <dd>{device.store}</dd>
        </div>
      </dl>
    </button>
  );
}
