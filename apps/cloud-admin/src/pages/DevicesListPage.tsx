// apps/cloud-admin/src/pages/DevicesListPage.tsx
import { useEffect, useState } from "react";
import { apiGet } from "../lib/api";

type Device = {
  id: string;
  name: string;
  type: string | null;
  status: string | null;
  lastHeartbeatAt: string | null;
  createdAt: string;
  licensePlan?: string | null;
  licenseKey?: string | null;
};

type DevicesResponse = {
  items: Device[];
  total: number;
  limit: number;
  offset: number;
};

function formatDateTime(value: string | null): string {
  if (!value) return "noch nie";
  return new Date(value).toLocaleString("de-DE");
}

function StatusBadge({ status }: { status: string | null }) {
  if (!status) return <span className="badge badge--amber">unknown</span>;

  const normalized = status.toLowerCase();

  if (normalized === "active") {
    return <span className="badge badge--green">active</span>;
  }
  if (normalized === "offline") {
    return <span className="badge badge--amber">offline</span>;
  }

  return <span className="badge badge--red">{status}</span>;
}

export default function DevicesListPage() {
  const [data, setData] = useState<DevicesResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    apiGet<DevicesResponse>("/devices")
      .then((res) => {
        setData(res);
        setError(null);
      })
      .catch((err) => {
        console.error(err);
        setError("Fehler beim Laden der Devices.");
      });
  }, []);

  return (
    <div className="admin-page">
      <h1 className="admin-page-title">Devices</h1>
      <p className="admin-page-subtitle">
        Übersicht über alle registrierten Geräte und deren Lizenzzuordnung.
      </p>

      {error && <div className="admin-error">{error}</div>}

      <div style={{ marginBottom: 12, fontSize: 13, color: "#9ca3af" }}>
        {data ? `${data.total} Devices gesamt` : "Lade Devices…"}
      </div>

      <div className="admin-table-wrapper">
        <table className="admin-table">
          <thead>
            <tr>
              <th>NAME</th>
              <th>TYP</th>
              <th>STATUS</th>
              <th>PLAN</th>       {/* neu */}
              <th>LICENSE</th>    {/* neu */}
              <th>LETZTES SIGNAL</th>
              <th>ERSTELLT AM</th>
            </tr>
          </thead>
          <tbody>
            {data?.items.map((device) => (
              <tr key={device.id}>
                <td>{device.name}</td>
                <td>{device.type ?? "—"}</td>
                <td>
                  <StatusBadge status={device.status} />
                </td>
                <td>{device.licensePlan ?? "—"}</td>
                <td>{device.licenseKey ?? "—"}</td>
                <td>{formatDateTime(device.lastHeartbeatAt)}</td>
                <td>{formatDateTime(device.createdAt)}</td>
              </tr>
            ))}

            {!data && (
              <tr>
                <td colSpan={7}>Lade Daten…</td>
              </tr>
            )}

            {data && data.items.length === 0 && (
              <tr>
                <td colSpan={7}>Keine Devices vorhanden.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
