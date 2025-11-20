import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { apiGet } from "../lib/api";

type Device = {
  id: string;
  name: string | null;
  type: string | null;
  status: string | null;

  customerId: string | null;
  customerName: string | null;

  licenseId: string | null;
  licenseKey: string | null;
  licensePlan: string | null;
  licenseValidFrom: string | null;
  licenseValidUntil: string | null;

  lastHeartbeatAt: string | null;
  createdAt: string;
};

type DeviceListResponse = {
  items: Device[];
  total: number;
};

function formatDate(value: string | null | undefined) {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString("de-DE");
}

function formatLastSignal(value: string | null | undefined) {
  if (!value) return "noch nie";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "–";
  return d.toLocaleString("de-DE");
}

// online / stale / offline / never
function classifySignal(
  lastHeartbeatAt: string | null,
): "never" | "online" | "stale" | "offline" {
  if (!lastHeartbeatAt) return "never";
  const d = new Date(lastHeartbeatAt);
  if (Number.isNaN(d.getTime())) return "never";

  const now = Date.now();
  const diffMs = now - d.getTime();
  const diffHours = diffMs / (1000 * 60 * 60);

  if (diffHours <= 24) return "online";
  if (diffHours <= 24 * 7) return "stale";
  return "offline";
}

function signalBadgeClass(kind: "never" | "online" | "stale" | "offline") {
  switch (kind) {
    case "online":
      return "badge badge--green";
    case "stale":
      return "badge badge--amber";
    case "offline":
      return "badge badge--red";
    case "never":
    default:
      return "badge";
  }
}

function signalText(kind: "never" | "online" | "stale" | "offline") {
  switch (kind) {
    case "online":
      return "online";
    case "stale":
      return "stale";
    case "offline":
      return "offline";
    case "never":
    default:
      return "noch nie";
  }
}

export default function DevicesListPage() {
  const [devices, setDevices] = useState<Device[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function loadDevices() {
    setLoading(true);
    setError(null);
    try {
      const res = await apiGet<DeviceListResponse>("/devices");
      setDevices(res.items);
      setTotal(res.total);
    } catch (err: any) {
      console.error(err);
      setError("Fehler beim Laden der Devices.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadDevices();
  }, []);

  return (
    <div className="admin-page">
      <h1 className="admin-page-title">Devices</h1>
      <p className="admin-page-subtitle">
        Übersicht aller registrierten Geräte und ihrer Lizenzzuordnung.
      </p>

      <div className="admin-table-wrapper">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Name / Device-ID</th>
              <th>Typ</th>
              <th>Status</th>
              <th>Plan</th>
              <th>License</th>
              <th>Gültig bis</th>
              <th>Customer</th>
              <th>Letztes Signal</th>
              <th>Erstellt am</th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr>
                <td colSpan={9}>Lade Devices…</td>
              </tr>
            )}

            {!loading && error && (
              <tr>
                <td colSpan={9}>
                  <div className="admin-error">{error}</div>
                </td>
              </tr>
            )}

            {!loading && !error && devices.length === 0 && (
              <tr>
                <td colSpan={9}>Noch keine Devices vorhanden.</td>
              </tr>
            )}

            {!loading &&
              !error &&
              devices.map((dev) => {
                const signalKind = classifySignal(dev.lastHeartbeatAt);
                return (
                  <tr key={dev.id}>
                    {/* Name + Device-ID (Cloud-ID) */}
                    <td>
                      <div>{dev.name || "—"}</div>
                      <div
                        style={{
                          fontSize: 11,
                          opacity: 0.6,
                          fontFamily:
                            "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
                        }}
                      >
                        {dev.id.slice(0, 8)}…
                      </div>
                    </td>

                    {/* Typ */}
                    <td>{dev.type || "—"}</td>

                    {/* Device-Status */}
                    <td>
                      <span
                        className={
                          dev.status === "active"
                            ? "badge badge--green"
                            : dev.status === "inactive"
                            ? "badge badge--amber"
                            : "badge"
                        }
                      >
                        {dev.status || "—"}
                      </span>
                    </td>

                    {/* Plan aus License */}
                    <td>{dev.licensePlan || "—"}</td>

                    {/* License-Key mit Link zur License-Detailseite */}
                    <td>
                      {dev.licenseId && dev.licenseKey ? (
                        <Link to={`/licenses/${dev.licenseId}`}>
                          {dev.licenseKey}
                        </Link>
                      ) : (
                        "—"
                      )}
                    </td>

                    {/* Gültig bis (aus License) */}
                    <td>
                      {dev.licenseValidUntil
                        ? formatDate(dev.licenseValidUntil)
                        : "—"}
                    </td>

                    {/* Customer mit Link zur Customer-Detailseite */}
                    <td>
                      {dev.customerId ? (
                        <Link to={`/customers/${dev.customerId}`}>
                          {dev.customerName ||
                            `${dev.customerId.slice(0, 8)}…`}
                        </Link>
                      ) : (
                        "—"
                      )}
                    </td>

                    {/* Letztes Signal + Ampel */}
                    <td>
                      <div>{formatLastSignal(dev.lastHeartbeatAt)}</div>
                      <div style={{ marginTop: 4 }}>
                        <span className={signalBadgeClass(signalKind)}>
                          {signalText(signalKind)}
                        </span>
                      </div>
                    </td>

                    {/* Erstellt am */}
                    <td>{formatDate(dev.createdAt)}</td>
                  </tr>
                );
              })}
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
        {total} Device(s) in dieser Instanz.
      </p>
    </div>
  );
}
