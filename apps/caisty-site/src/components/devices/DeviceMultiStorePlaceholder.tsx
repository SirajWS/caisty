import { MapPin } from "lucide-react";
import type { MultiStorePlaceholder } from "../../lib/devices/types";

export function DeviceMultiStorePlaceholder({
  multiStore,
  futureLabel,
}: {
  multiStore: MultiStorePlaceholder;
  futureLabel: string;
}) {
  return (
    <section className="dashboard-panel dashboard-panel--wide devices-multistore">
      <div className="devices-multistore-head">
        <MapPin size={18} className="dashboard-icon--muted" aria-hidden />
        <div>
          <h2 className="dashboard-panel-title m-0">{multiStore.title}</h2>
          <p className="dashboard-text-muted text-xs mt-1 mb-0">{multiStore.description}</p>
        </div>
        <span className="dashboard-quick-badge">{futureLabel}</span>
      </div>
      <div className="devices-multistore-grid">
        {multiStore.stores.map((store) => (
          <div key={store} className="devices-multistore-card">
            <span className="devices-stat-label">{store}</span>
            <span className="devices-multistore-placeholder">—</span>
          </div>
        ))}
      </div>
    </section>
  );
}
