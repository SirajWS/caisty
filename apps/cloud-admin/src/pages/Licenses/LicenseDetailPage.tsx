import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { apiGet, apiPost } from "../../lib/api";

type License = {
  id: string;
  key: string;
  plan: string;
  status: string;
  maxDevices: number | null;
  customerId: string | null;
  validFrom: string | null;
  validUntil: string | null;
  createdAt: string;
};

type LicenseEvent = {
  id: string;
  type: string;
  metadata: any | null;
  createdAt: string;
};

type EventsResponse = {
  items: LicenseEvent[];
};

// Device-Typ wie in DevicesListPage (mit License-/Customer-Infos)
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
  
  // Für gruppierte Devices (nach fingerprint)
  licenses?: Array<{
    id: string;
    key: string | null;
    plan: string | null;
    validFrom: string | null;
    validUntil: string | null;
  }>;
};

type DeviceListResponse = {
  items: Device[];
  total: number;
};

function formatDate(value: string | null | undefined) {
  if (!value) return "–";
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

export default function LicenseDetailPage() {
  const { id } = useParams<{ id: string }>();

  const [license, setLicense] = useState<License | null>(null);
  const [events, setEvents] = useState<LicenseEvent[]>([]);
  const [licenseDevices, setLicenseDevices] = useState<Device[]>([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [revokeLoading, setRevokeLoading] = useState(false);
  const [revokeError, setRevokeError] = useState<string | null>(null);

  async function loadData() {
    if (!id) return;

    setLoading(true);
    setError(null);
    try {
      // License, Events und Devices parallel laden
      const [licenseRes, eventsRes, devicesRes] = await Promise.all([
        apiGet<{ item: License }>(`/licenses/${id}`),
        apiGet<EventsResponse>(`/licenses/${id}/events`),
        apiGet<DeviceListResponse>("/devices"),
      ]);

      setLicense(licenseRes.item);
      setEvents(eventsRes.items);

      // Devices können entweder direkt eine licenseId haben oder ein licenses Array
      // (wenn Devices nach fingerprint gruppiert sind)
      const devsForLicense = (devicesRes.items ?? []).filter((dev: any) => {
        // Prüfe direktes licenseId Feld
        if (dev.licenseId === licenseRes.item.id) {
          return true;
        }
        // Prüfe licenses Array (wenn Devices nach fingerprint gruppiert sind)
        if (dev.licenses && Array.isArray(dev.licenses)) {
          return dev.licenses.some((lic: any) => lic.id === licenseRes.item.id);
        }
        return false;
      }).map((dev: any) => {
        // Wenn das Device ein licenses Array hat, aber wir nach einer spezifischen Lizenz filtern,
        // müssen wir das Device-Format anpassen, damit es mit dem erwarteten Format übereinstimmt
        if (dev.licenses && Array.isArray(dev.licenses)) {
          const matchingLicense = dev.licenses.find((lic: any) => lic.id === licenseRes.item.id);
          if (matchingLicense) {
            return {
              ...dev,
              licenseId: matchingLicense.id,
              licenseKey: matchingLicense.key,
              licensePlan: matchingLicense.plan,
              licenseValidFrom: matchingLicense.validFrom,
              licenseValidUntil: matchingLicense.validUntil,
            };
          }
        }
        return dev;
      });
      setLicenseDevices(devsForLicense);
    } catch (err: any) {
      console.error(err);
      setError("Fehler beim Laden der Lizenz.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  async function handleRevoke() {
    if (!license || license.status === "revoked") return;
    if (!window.confirm("Diese Lizenz wirklich revoken?")) return;

    setRevokeError(null);
    setRevokeLoading(true);
    try {
      await apiPost<{}, { item: License }>(
        `/licenses/${license.id}/revoke`,
        {},
      );
      await loadData();
    } catch (err: any) {
      console.error(err);
      setRevokeError(
        err?.message || "Fehler beim Revoken der Lizenz.",
      );
    } finally {
      setRevokeLoading(false);
    }
  }

  return (
    <div className="admin-page">
      <h1 className="admin-page-title">License Details</h1>
      <p className="admin-page-subtitle">
        Details und Ereignisse für einen Lizenzschlüssel.
      </p>

      <p style={{ fontSize: 13, marginBottom: 16 }}>
        <Link to="/licenses" style={{ textDecoration: "underline" }}>
          ← zurück zur Übersicht
        </Link>
      </p>

      {loading && <div>Lade…</div>}
      {error && <div className="admin-error">{error}</div>}

      {license && !loading && !error && (
        <>
          <div
            className="dashboard-card"
            style={{ marginBottom: 24, display: "flex", gap: 24 }}
          >
            <div style={{ flex: 1 }}>
              <div
                style={{
                  fontSize: 14,
                  fontWeight: 600,
                  marginBottom: 8,
                }}
              >
                {license.key}
              </div>
              <div style={{ fontSize: 13, color: "#9ca3af" }}>
                Plan: <strong>{license.plan}</strong>
              </div>
              <div style={{ fontSize: 13, color: "#9ca3af" }}>
                Max Devices:{" "}
                <strong>{license.maxDevices ?? "–"}</strong>
              </div>
              <div style={{ fontSize: 13, color: "#9ca3af" }}>
                Customer:{" "}
                {license.customerId ? (
                  // wir zeigen hier momentan nur die ID – später könnte man
                  // einen Namen via extra-Request nachladen
                  <span>{license.customerId}</span>
                ) : (
                  "–"
                )}
              </div>
              <div style={{ fontSize: 13, color: "#9ca3af" }}>
                Gültig von: {formatDate(license.validFrom)}
              </div>
              <div style={{ fontSize: 13, color: "#9ca3af" }}>
                Gültig bis: {formatDate(license.validUntil)}
              </div>
              <div style={{ fontSize: 13, color: "#9ca3af" }}>
                Erstellt am: {formatDate(license.createdAt)}
              </div>
            </div>

            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "flex-end",
                justifyContent: "space-between",
                minWidth: 160,
                gap: 12,
              }}
            >
              <span
                className={
                  license.status === "active"
                    ? "badge badge--green"
                    : license.status === "revoked"
                    ? "badge badge--red"
                    : "badge badge--amber"
                }
              >
                {license.status}
              </span>

              {license.status === "active" && (
                <button
                  type="button"
                  onClick={handleRevoke}
                  disabled={revokeLoading}
                  style={{
                    padding: "8px 14px",
                    borderRadius: 6,
                    border: "1px solid #b91c1c",
                    background: "#7f1d1d",
                    color: "#fee2e2",
                    fontSize: 13,
                    cursor: "pointer",
                  }}
                >
                  {revokeLoading ? "Revokiere…" : "License revoken"}
                </button>
              )}

              {revokeError && (
                <div
                  className="admin-error"
                  style={{ marginTop: 8, textAlign: "right" }}
                >
                  {revokeError}
                </div>
              )}
            </div>
          </div>

          {/* Devices mit dieser License */}
          <h2
            style={{
              fontSize: 16,
              fontWeight: 600,
              marginBottom: 8,
            }}
          >
            Devices mit dieser License
          </h2>
          <p
            style={{
              fontSize: 13,
              color: "#9ca3af",
              marginBottom: 8,
            }}
          >
            Alle POS-Geräte, die diesen License-Key aktuell verwenden.
          </p>

          <div className="admin-table-wrapper" style={{ marginBottom: 24 }}>
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Name / Device-ID</th>
                  <th>Customer</th>
                  <th>Status</th>
                  <th>Letztes Signal</th>
                  <th>Erstellt am</th>
                </tr>
              </thead>
              <tbody>
                {licenseDevices.length === 0 ? (
                  <tr>
                    <td colSpan={5}>
                      Noch keine Devices mit dieser License.
                    </td>
                  </tr>
                ) : (
                  licenseDevices.map((dev) => {
                    const signalKind = classifySignal(dev.lastHeartbeatAt);
                    return (
                      <tr key={dev.id}>
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
                        <td>
                          <div>{formatDate(dev.lastHeartbeatAt)}</div>
                          <div style={{ marginTop: 4 }}>
                            <span
                              className={signalBadgeClass(signalKind)}
                            >
                              {signalText(signalKind)}
                            </span>
                          </div>
                        </td>
                        <td>{formatDate(dev.createdAt)}</td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Events */}
          <h2
            style={{
              fontSize: 16,
              fontWeight: 600,
              marginBottom: 8,
            }}
          >
            Events
          </h2>
          <p
            style={{
              fontSize: 13,
              color: "#9ca3af",
              marginBottom: 8,
            }}
          >
            Aktivitäten rund um diese License (Aktivierung, Heartbeats,
            etc.).
          </p>

          <div className="admin-table-wrapper">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Typ</th>
                  <th>Details</th>
                  <th>Datum</th>
                </tr>
              </thead>
              <tbody>
                {events.length === 0 && (
                  <tr>
                    <td colSpan={3}>
                      Noch keine Events für diese Lizenz.
                    </td>
                  </tr>
                )}
                {events.map((event) => (
                  <tr key={event.id}>
                    <td>{event.type}</td>
                    <td>
                      {event.metadata
                        ? JSON.stringify(event.metadata)
                        : "–"}
                    </td>
                    <td>{formatDate(event.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}

