import type { PosReleaseConfig } from "../../config/posConfig";
import type { DeviceSlotView } from "../../lib/devices/types";
import { DeviceSlotGrid } from "./DeviceSlotGrid";

export function DeviceManagement({
  title,
  slots,
  cardLabels,
  slotLabels,
  release,
}: {
  title: string;
  slots: DeviceSlotView[];
  cardLabels: {
    version: string;
    heartbeat: string;
    lastSync: string;
    license: string;
    openPos: string;
  };
  slotLabels: {
    title: string;
    text: string;
    add: string;
    hint: string;
  };
  release: PosReleaseConfig;
}) {
  return (
    <section className="dashboard-panel dashboard-panel--wide devices-management">
      <h2 className="dashboard-panel-title">{title}</h2>
      <DeviceSlotGrid
        slots={slots}
        cardLabels={cardLabels}
        slotLabels={slotLabels}
        release={release}
      />
    </section>
  );
}
