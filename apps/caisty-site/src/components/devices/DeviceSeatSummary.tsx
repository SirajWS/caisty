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
    available: string;
    full: string;
  };
}) {
  const title = seats.hasLicense
    ? labels.planTitle.replace("{{plan}}", seats.planLabel)
    : labels.noPlan;

  const usedText = labels.used
    .replace("{{used}}", String(seats.usedDevices))
    .replace("{{max}}", String(seats.maxDevices));

  const availableText =
    seats.availableSlots > 0
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
            <div
              className="devices-seat-progress"
              role="progressbar"
              aria-valuenow={seats.usedDevices}
              aria-valuemin={0}
              aria-valuemax={seats.maxDevices}
            >
              <span
                className="devices-seat-progress-fill"
                style={{ width: `${seats.percent}%` }}
              />
            </div>
          </>
        ) : null}
      </div>
    </section>
  );
}
