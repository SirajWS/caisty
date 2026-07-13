import { Monitor } from "lucide-react";
import type { PosReleaseConfig } from "../../config/posConfig";
import type { RemoteAction } from "../../lib/devices/types";
import { openDesktopPos } from "./openDesktopPos";

export function RemoteActions({
  actions,
  title,
  release,
}: {
  actions: RemoteAction[];
  title: string;
  release: PosReleaseConfig;
}) {
  return (
    <section className="dashboard-panel">
      <h2 className="dashboard-panel-title">{title}</h2>
      <div className="devices-remote-actions">
        {actions.map((action) =>
          action.action === "desktop_protocol" && !action.disabled ? (
            <button
              key={action.id}
              type="button"
              className="devices-remote-btn devices-remote-btn--primary"
              onClick={() => openDesktopPos(release)}
            >
              <Monitor size={14} />
              {action.label}
            </button>
          ) : (
            <span
              key={action.id}
              className="devices-remote-btn devices-remote-btn--disabled"
              aria-disabled
            >
              {action.label}
              {action.badge ? <span className="dashboard-quick-badge">{action.badge}</span> : null}
            </span>
          ),
        )}
      </div>
    </section>
  );
}
