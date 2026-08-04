import type { DeviceManagementCardView } from "../../lib/devices/deviceManagementTypes";
import type { PortalDeviceAllowedAction } from "../../lib/devices/portalDeviceApi";

const ACTION_LABEL_KEYS: Record<
  PortalDeviceAllowedAction,
  keyof DeviceLifecycleCardLabels
> = {
  approve: "approve",
  reject: "reject",
  block: "block",
  unblock: "unblock",
  release: "release",
};

export type DeviceLifecycleCardLabels = {
  type: string;
  created: string;
  contact: string;
  version: string;
  plan: string;
  fingerprint: string;
  approve: string;
  reject: string;
  block: string;
  unblock: string;
  release: string;
  approveDisabled: string;
};

export function DeviceLifecycleCard({
  device,
  labels,
  busy,
  anyActionBusy,
  canApprove,
  onAction,
}: {
  device: DeviceManagementCardView;
  labels: DeviceLifecycleCardLabels;
  busy: boolean;
  anyActionBusy: boolean;
  canApprove: boolean;
  onAction: (deviceId: string, action: PortalDeviceAllowedAction) => void;
}) {
  const actionsDisabled = anyActionBusy;

  return (
    <article
      className={`devices-card devices-lifecycle-card${device.isHistorical ? " devices-lifecycle-card--historical" : ""}`}
    >
      <div className="devices-card-head">
        <span className="devices-card-name" title={device.name}>
          {device.name}
        </span>
        <span
          className={`devices-status-badge ${device.lifecycleBadgeClass}`}
        >
          {device.lifecycleLabel}
        </span>
      </div>
      <p className="devices-lifecycle-desc">{device.statusDescription}</p>
      <dl className="devices-card-meta">
        <div className="devices-card-row">
          <dt>{labels.type}</dt>
          <dd>{device.typeLabel}</dd>
        </div>
        <div className="devices-card-row">
          <dt>{labels.created}</dt>
          <dd>{device.createdAtLabel}</dd>
        </div>
        <div className="devices-card-row">
          <dt>{labels.contact}</dt>
          <dd>{device.lastContactLabel}</dd>
        </div>
        <div className="devices-card-row">
          <dt>{labels.version}</dt>
          <dd>{device.appVersion}</dd>
        </div>
        {device.fingerprintMasked ? (
          <div className="devices-card-row">
            <dt>{labels.fingerprint}</dt>
            <dd className="font-mono text-xs">{device.fingerprintMasked}</dd>
          </div>
        ) : null}
      </dl>
      {device.allowedActions.length > 0 ? (
        <div className="devices-lifecycle-actions">
          {device.allowedActions.map((action) => {
            const isApprove = action === "approve";
            const disabled =
              actionsDisabled ||
              (isApprove && !canApprove);
            const title =
              isApprove && !canApprove ? labels.approveDisabled : undefined;
            const variant =
              action === "release"
                ? "destructive"
                : action === "reject"
                  ? "secondary-destructive"
                  : action === "block"
                    ? "secondary"
                    : "primary";

            return (
              <button
                key={action}
                type="button"
                className={`devices-lifecycle-action devices-lifecycle-action--${variant}`}
                disabled={disabled}
                title={title}
                aria-label={`${labels[ACTION_LABEL_KEYS[action]]}: ${device.name}`}
                aria-busy={busy}
                onClick={() => onAction(device.id, action)}
              >
                {labels[ACTION_LABEL_KEYS[action]]}
              </button>
            );
          })}
        </div>
      ) : null}
    </article>
  );
}
