import { useSyncData } from "../hooks/useSyncData.js";
import { useSyncWorker } from "../hooks/useSyncWorker.js";
import { loadStoredDevice } from "../config/cloud.js";

export function SyncDashboard() {
  useSyncWorker();
  const { counts, lastSync, syncing, online, syncNow } = useSyncData();
  const device = loadStoredDevice();

  return (
    <main style={{ fontFamily: "system-ui", padding: 24, maxWidth: 720 }}>
      <h1>Caisty POS Web</h1>
      <p>Business-scoped cloud pull via shared sync core.</p>

      <section style={{ marginTop: 16 }}>
        <strong>Device</strong>
        <div>deviceId: {device?.deviceId ?? "not configured"}</div>
        <div>orgId: {device?.orgId ?? "—"}</div>
        <div>online: {online ? "yes" : "no"}</div>
      </section>

      <section style={{ marginTop: 16, display: "grid", gap: 8 }}>
        <div>Orders: {counts.orders}</div>
        <div>Receipts: {counts.receipts}</div>
        <div>Payments (receipt-linked): {counts.payments}</div>
        <div>Shifts: {counts.shifts}</div>
        <div>Receipt events: {counts.receiptEvents}</div>
      </section>

      <button
        type="button"
        onClick={() => void syncNow()}
        disabled={syncing}
        style={{ marginTop: 16 }}
      >
        {syncing ? "Syncing…" : "Sync now"}
      </button>

      <p style={{ marginTop: 12, opacity: 0.7 }}>
        Last manual sync: {lastSync ?? "never"}
      </p>
      <p style={{ opacity: 0.7 }}>
        UI refreshes automatically after pull via sync events (no page reload).
      </p>
    </main>
  );
}
