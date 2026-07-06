import type { DeviceCardView } from "../../lib/devices/types";
import { DeviceCard } from "./DeviceCard";

export function DeviceGrid({
  devices,
  title,
  labels,
  onSelect,
}: {
  devices: DeviceCardView[];
  title: string;
  labels: {
    platform: string;
    version: string;
    currentUser: string;
    heartbeat: string;
    connection: string;
    cloudStatus: string;
    environment: string;
    license: string;
    store: string;
  };
  onSelect: (id: string) => void;
}) {
  return (
    <section className="dashboard-panel dashboard-panel--wide">
      <h2 className="dashboard-panel-title">{title}</h2>
      <div className="devices-grid">
        {devices.map((device) => (
          <DeviceCard key={device.id} device={device} labels={labels} onSelect={onSelect} />
        ))}
      </div>
    </section>
  );
}
