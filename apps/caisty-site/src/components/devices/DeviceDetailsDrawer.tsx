import React from "react";
import { X } from "lucide-react";
import type { DeviceCardView, DeviceDetailView } from "../../lib/devices/types";

export function DeviceDetailsDrawer({
  open,
  device,
  detail,
  labels,
  onClose,
}: {
  open: boolean;
  device: DeviceCardView | null;
  detail: DeviceDetailView | null;
  labels: {
    title: string;
    close: string;
    deviceId: string;
    hostname: string;
    platform: string;
    architecture: string;
    installedVersion: string;
    latestVersion: string;
    lastHeartbeat: string;
    cloudConnected: string;
    environment: string;
    license: string;
    store: string;
    business: string;
  };
  onClose: () => void;
}) {
  React.useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open || !device || !detail) return null;

  const rows: { label: string; value: string; mono?: boolean }[] = [
    { label: labels.deviceId, value: detail.deviceId, mono: true },
    { label: labels.hostname, value: detail.hostname },
    { label: labels.platform, value: detail.platform },
    { label: labels.architecture, value: detail.architecture },
    { label: labels.installedVersion, value: detail.installedVersion },
    { label: labels.latestVersion, value: detail.latestVersion },
    { label: labels.lastHeartbeat, value: detail.lastHeartbeat },
    { label: labels.cloudConnected, value: detail.cloudConnected },
    { label: labels.environment, value: detail.environment },
    { label: labels.license, value: detail.license, mono: true },
    { label: labels.store, value: detail.store },
    { label: labels.business, value: detail.business },
  ];

  return (
    <div className="devices-drawer-root" role="presentation">
      <button type="button" className="devices-drawer-backdrop" onClick={onClose} aria-label={labels.close} />
      <aside className="devices-drawer" role="dialog" aria-modal="true" aria-label={labels.title}>
        <header className="devices-drawer-head">
          <div>
            <h2 className="devices-drawer-title">{device.name}</h2>
            <p className="devices-drawer-subtitle">{labels.title}</p>
          </div>
          <button type="button" className="devices-drawer-close" onClick={onClose} aria-label={labels.close}>
            <X size={18} />
          </button>
        </header>
        <dl className="devices-drawer-details">
          {rows.map((row) => (
            <div key={row.label} className="devices-drawer-row">
              <dt>{row.label}</dt>
              <dd className={row.mono ? "font-mono text-xs" : undefined}>{row.value}</dd>
            </div>
          ))}
        </dl>
      </aside>
    </div>
  );
}
