import type { PosReleaseConfig } from "../../config/posConfig";
import type { DeviceSlotView } from "../../lib/devices/types";
import { DeviceSlotGrid } from "./DeviceSlotGrid";

export function DeviceManagement({
  title,
  slots,
  cardLabels,
  slotLabels,
  release,
  onRelease,
}: {
  title: string;
  slots: DeviceSlotView[];
  cardLabels: {
    version: string;
    heartbeat: string;
    lastSync: string;
    license: string;
    openPos: string;
    releaseDevice: string;
    releasedOn: string;
  };
  slotLabels: {
    title: string;
    text: string;
    add: string;
    hint: string;
  };
  release: PosReleaseConfig;
  onRelease?: (deviceId: string) => void;
}) {
  return (
    <section className="dashboard-panel dashboard-panel--wide devices-management">
      <h2 className="dashboard-panel-title">{title}</h2>
      <DeviceSlotGrid
        slots={slots}
        cardLabels={cardLabels}
        slotLabels={slotLabels}
        release={release}
        onRelease={onRelease}
      />
    </section>
  );
}
