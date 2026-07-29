import { Layers } from "lucide-react";
import type { DeviceSeatSummaryView } from "../../lib/devices/types";

export function DeviceSeatSummary({
  seats,
  labels,
}: {
  seats: DeviceSeatSummaryView;
  labels: {
    planTitle: string;
    noPlan: string;
    used: string;
    usedUnlimited: string;
    available: string;
    availableUnlimited: string;
    full: string;
  };
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
          {seats.hasLicense ? (
            <span className="devices-seat-available">{availableText}</span>
          ) : null}
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
                  className="devices-seat-progress-fill"
                  style={{ width: `${seats.percent}%` }}
                />
              </div>
            ) : null}
          </>
        ) : null}
      </div>
    </section>
  );
}
