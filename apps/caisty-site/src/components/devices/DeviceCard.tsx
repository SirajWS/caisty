import { ExternalLink } from "lucide-react";
import type { PosReleaseConfig } from "../../config/posConfig";
import type { DeviceCardView } from "../../lib/devices/types";
import { openDesktopPos } from "./openDesktopPos";

function toneClass(device: DeviceCardView): string {
  if (device.isReleased) return "devices-status-badge--released";
  const tone = device.statusTone;
  if (tone === "ok") return "devices-status-badge--online";
  if (tone === "attention") return "devices-status-badge--warning";
  if (tone === "action_required") return "devices-status-badge--offline";
  return "devices-status-badge--offline";
}

export function DeviceCard({
  device,
  labels,
  release,
  onRelease,
}: {
  device: DeviceCardView;
  labels: {
    version: string;
    heartbeat: string;
    lastSync: string;
    license: string;
    openPos: string;
    releaseDevice: string;
    releasedOn: string;
  };
  release: PosReleaseConfig;
  onRelease?: (deviceId: string) => void;
}) {
  const actionsDisabled = device.isReleased;

  return (
    <article className="devices-card">
      <div className="devices-card-head">
        <span className="devices-card-name">{device.name}</span>
        <span className={`devices-status-badge ${toneClass(device)}`}>
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
        {device.releasedAtLabel ? (
          <div className="devices-card-row">
            <dt>{labels.releasedOn}</dt>
            <dd>{device.releasedAtLabel}</dd>
          </div>
        ) : null}
      </dl>
      <div className="devices-card-actions">
        <button
          type="button"
          className="devices-card-action"
          onClick={() => openDesktopPos(release)}
          disabled={actionsDisabled}
        >
          <ExternalLink size={15} />
          {labels.openPos}
        </button>
        <button
          type="button"
          className="devices-card-action devices-card-action--destructive"
          onClick={() => onRelease?.(device.id)}
          disabled={actionsDisabled || !onRelease}
        >
          {labels.releaseDevice}
        </button>
      </div>
    </article>
  );
}
