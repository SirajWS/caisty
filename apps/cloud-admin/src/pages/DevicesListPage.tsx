// apps/cloud-admin/src/pages/DevicesListPage.tsx
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { apiGet } from "../lib/api";

type DeviceRow = {
  id: string;
  name: string;
  type: string;
  status: string | null;
  lastHeartbeatAt: string | null;
  createdAt: string;
  licenseId: string | null;
  licenseKey: string | null;
  licensePlan: string | null;
};

type DevicesResponse = {
  items: DeviceRow[];
  total: number;
};

export default function DevicesListPage() {
  const [devices, setDevices] = useState<DeviceRow[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  function formatDate(value: string | null | undefined) {
    if (!value) return "noch nie";
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return "–";
    return d.toLocaleString("de-DE");
  }

  useEffect(() => {
    setLoading(true);
    setError(null);
    apiGet<DevicesResponse>("/devices")
      .then((res) => {
        setDevices(res.items);
        setTotal(res.total);
      })
      .catch((err) => {
        console.error(err);
        setError("Fehler beim Laden der Devices.");
      })
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="admin-page">
      <h1 className="admin-page-title">Devices</h1>
      <p className="admin-page-subtitle">
        Übersicht über alle registrierten Geräte und deren Lizenzzuordnung.
      </p>

      <div className="admin-table-wrapper">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Typ</th>
              <th>Status</th>
              <th>Plan</th>
              <th>License</th>
              <th>Letztes Signal</th>
              <th>Erstellt am</th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr>
                <td colSpan={7}>Lade Devices…</td>
              </tr>
            )}
            {!loading && error && (
              <tr>
                <td colSpan={7}>
                  <div className="admin-error">{error}</div>
                </td>
              </tr>
            )}
            {!loading && !error && devices.length === 0 && (
              <tr>
                <td colSpan={7}>Noch keine Devices registriert.</td>
              </tr>
            )}
            {!loading &&
              !error &&
              devices.map((dev) => (
                <tr key={dev.id}>
                  <td>{dev.name}</td>
                  <td>{dev.type}</td>
                  <td>
                    <span className="badge badge--green">
                      {dev.status || "active"}
                    </span>
                  </td>
                  <td>{dev.licensePlan ?? "—"}</td>
                  <td>
                    {dev.licenseId && dev.licenseKey ? (
                      <Link to={`/licenses/${dev.licenseId}`}>
                        {dev.licenseKey}
                      </Link>
                    ) : (
                      "—"
                    )}
                  </td>
                  <td>{formatDate(dev.lastHeartbeatAt)}</td>
                  <td>{formatDate(dev.createdAt)}</td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>

      <p
        style={{
          marginTop: 8,
          fontSize: 12,
          color: "#6b7280",
        }}
      >
        {total} Devices gesamt
      </p>
    </div>
  );
}
