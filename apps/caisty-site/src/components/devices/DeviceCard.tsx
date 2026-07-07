import { ExternalLink } from "lucide-react";
import type { PosReleaseConfig } from "../../config/posConfig";
import type { PosHubTone } from "../../lib/posHub/types";
import type { DeviceCardView } from "../../lib/devices/types";
import { openDesktopPos } from "./openDesktopPos";

function toneClass(tone: PosHubTone): string {
  if (tone === "ok") return "devices-status-badge--online";
  if (tone === "attention") return "devices-status-badge--warning";
  if (tone === "action_required") return "devices-status-badge--offline";
  return "devices-status-badge--offline";
}

export function DeviceCard({
  device,
  labels,
  release,
}: {
  device: DeviceCardView;
  labels: {
    version: string;
    heartbeat: string;
    lastSync: string;
    license: string;
    openPos: string;
  };
  release: PosReleaseConfig;
}) {
  return (
    <article className="devices-card">
      <div className="devices-card-head">
        <span className="devices-card-name">{device.name}</span>
        <span className={`devices-status-badge ${toneClass(device.statusTone)}`}>
          {device.statusLabel}
        </span>
      </div>
      <dl className="devices-card-meta">
        <div className="devices-card-row">
          <dt>{labels.version}</dt>
          <dd>{device.version}</dd>
        </div>
        <div className="devices-card-row">
          <dt>{labels.heartbeat}</dt>
          <dd>{device.heartbeat}</dd>
        </div>
        <div className="devices-card-row">
          <dt>{labels.lastSync}</dt>
          <dd>{device.lastSync}</dd>
        </div>
        <div className="devices-card-row">
          <dt>{labels.license}</dt>
          <dd className="font-mono text-xs">{device.license}</dd>
        </div>
      </dl>
      <button
        type="button"
        className="devices-card-action"
        onClick={() => openDesktopPos(release)}
      >
        <ExternalLink size={15} />
        {labels.openPos}
      </button>
    </article>
  );
}
