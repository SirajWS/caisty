import type { PosReleaseConfig } from "../../config/posConfig";
import type { DeviceSlotView } from "../../lib/devices/types";
import { DeviceCard } from "./DeviceCard";
import { EmptySlotCard } from "./EmptySlotCard";

export function DeviceSlotGrid({
  slots,
  cardLabels,
  slotLabels,
  release,
  onRelease,
}: {
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
    <div className="devices-slot-grid">
      {slots.map((slot) =>
        slot.kind === "device" ? (
          <DeviceCard
            key={slot.id}
            device={slot.card}
            labels={cardLabels}
            release={release}
            onRelease={onRelease}
          />
        ) : (
          <EmptySlotCard key={slot.id} labels={slotLabels} release={release} />
        ),
      )}
    </div>
  );
}
