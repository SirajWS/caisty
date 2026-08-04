import { AlertTriangle, Layers, RefreshCw } from "lucide-react";
import type { DeviceManagementSeatView } from "../../lib/devices/deviceManagementTypes";

export function DeviceManagementOverview({
  seats,
  labels,
  refreshing,
}: {
  seats: DeviceManagementSeatView;
  labels: {
    planTitle: string;
    noPlan: string;
    used: string;
    usedUnlimited: string;
    available: string;
    availableUnlimited: string;
    full: string;
    overLimitBanner: string;
    statActive: string;
    statBlocked: string;
    statPending: string;
    refreshing: string;
  };
  refreshing?: boolean;
}) {
  const title = seats.hasLicense
    ? labels.planTitle.replace("{{plan}}", seats.planLabel)
    : labels.noPlan;

  const usedText = seats.unlimitedDevices
    ? labels.usedUnlimited.replace("{{used}}", String(seats.usedDevices))
    : labels.used
        .replace("{{used}}", String(seats.usedDevices))
        .replace("{{max}}", String(seats.maxDevices ?? 0));

  const availableText = seats.unlimitedDevices
    ? labels.availableUnlimited
    : seats.overLimit
      ? labels.full
      : seats.availableSlots > 0
        ? labels.available.replace("{{count}}", String(seats.availableSlots))
        : labels.full;

  return (
    <section className="devices-seat-summary dashboard-panel">
      <div className="devices-seat-icon" aria-hidden>
        <Layers size={20} />
      </div>
      <div className="devices-seat-body">
        <div className="devices-seat-head">
          <span className="devices-seat-plan">{title}</span>
          <span className="devices-seat-available">
            {refreshing ? labels.refreshing : availableText}
          </span>
        </div>
        {seats.hasLicense ? (
          <>
            <p className="devices-seat-used">{usedText}</p>
            {!seats.unlimitedDevices ? (
              <div
                className="devices-seat-progress"
                role="progressbar"
                aria-valuenow={seats.usedDevices}
                aria-valuemin={0}
                aria-valuemax={seats.maxDevices ?? 0}
              >
                <span
                  className={`devices-seat-progress-fill${seats.overLimit ? " devices-seat-progress-fill--over" : ""}`}
                  style={{ width: `${seats.percent}%` }}
                />
              </div>
            ) : null}
          </>
        ) : null}
        <div className="devices-mgmt-stats" role="list">
          <span className="devices-mgmt-stat" role="listitem">
            {labels.statActive.replace("{{count}}", String(seats.activeCount))}
          </span>
          <span className="devices-mgmt-stat" role="listitem">
            {labels.statBlocked.replace(
              "{{count}}",
              String(seats.blockedCount),
            )}
          </span>
          <span className="devices-mgmt-stat" role="listitem">
            {labels.statPending.replace(
              "{{count}}",
              String(seats.pendingCount),
            )}
          </span>
        </div>
        {seats.overLimit ? (
          <div className="devices-overlimit-banner" role="alert">
            <AlertTriangle size={16} aria-hidden />
            <span>{labels.overLimitBanner}</span>
          </div>
        ) : null}
        {refreshing ? (
          <span className="devices-mgmt-refreshing" aria-live="polite">
            <RefreshCw size={14} className="devices-mgmt-refresh-icon" aria-hidden />
            {labels.refreshing}
          </span>
        ) : null}
      </div>
    </section>
  );
}
