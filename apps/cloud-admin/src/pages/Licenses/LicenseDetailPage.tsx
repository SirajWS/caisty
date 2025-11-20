import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { apiGet } from "../../lib/api";

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

type LicensesResponse = {
  items: License[];
};

type LicenseEvent = {
  id: string;
  licenseId: string;
  type: string;
  metadata: Record<string, unknown> | null;
  createdAt: string;
};

type EventsResponse = {
  items: LicenseEvent[];
};

function formatDate(value: string | null) {
  if (!value) return "—";
  return new Date(value).toLocaleString("de-DE");
}

function statusBadgeClass(status: string) {
  const s = status.toLowerCase();
  if (s === "active") return "badge badge--green";
  if (s === "revoked" || s === "expired") return "badge badge--red";
  return "badge badge--amber";
}

function shortId(value: string | undefined) {
  if (!value) return "—";
  if (value.length <= 8) return value;
  return `${value.slice(0, 8)}…`;
}

export default function LicenseDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [license, setLicense] = useState<License | null>(null);
  const [events, setEvents] = useState<LicenseEvent[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;

    setLoading(true);

    Promise.all([
      apiGet<LicensesResponse>("/licenses"),
      apiGet<EventsResponse>(`/licenses/${id}/events`),
    ])
      .then(([licensesRes, eventsRes]) => {
        const found = licensesRes.items.find((l) => l.id === id) ?? null;
        setLicense(found || null);
        setEvents(eventsRes.items ?? []);
        setError(null);
      })
      .catch((err) => {
        console.error(err);
        setError("Fehler beim Laden der Lizenz.");
      })
      .finally(() => setLoading(false));
  }, [id]);

  const renderEventDetails = (evt: LicenseEvent) => {
    const meta = evt.metadata as any;
    if (evt.type === "activated" && meta?.deviceName) {
      return `Device aktiviert: ${meta.deviceName} (${shortId(meta.deviceId)})`;
    }
    if (evt.type === "heartbeat" && meta?.deviceId) {
      return `Heartbeat von Device ${shortId(meta.deviceId)}`;
    }
    return meta ? JSON.stringify(meta) : "–";
  };

  return (
    <div className="admin-page">
      <h1 className="admin-page-title">License Details</h1>
      <p className="admin-page-subtitle">
        Details und Ereignisse für einen Lizenzschlüssel.
      </p>

      <p style={{ fontSize: 13, marginBottom: 16 }}>
        <Link to="/licenses" style={{ color: "#a5b4fc" }}>
          ← zurück zur Übersicht
        </Link>
      </p>

      {error && <div className="admin-error">{error}</div>}

      {loading && (
        <div className="dashboard-card">
          <div className="dashboard-card-meta">Lade Lizenz…</div>
        </div>
      )}

      {!loading && !license && !error && (
        <div className="admin-error">License wurde nicht gefunden.</div>
      )}

      {!loading && license && (
        <>
          {/* License-Info */}
          <div className="dashboard-card" style={{ marginBottom: 24 }}>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                marginBottom: 12,
              }}
            >
              <div>
                <div
                  style={{
                    fontSize: 16,
                    fontWeight: 600,
                    marginBottom: 4,
                  }}
                >
                  {license.key}
                </div>
                <div style={{ fontSize: 13, color: "#9ca3af" }}>
                  Plan: <strong>{license.plan}</strong>
                </div>
              </div>
              <div>
                <span className={statusBadgeClass(license.status)}>
                  {license.status}
                </span>
              </div>
            </div>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit,minmax(180px,1fr))",
                gap: 12,
                fontSize: 13,
              }}
            >
              <div>
                <div style={{ color: "#9ca3af" }}>Max Devices</div>
                <div>{license.maxDevices ?? "—"}</div>
              </div>
              <div>
                <div style={{ color: "#9ca3af" }}>Customer</div>
                <div style={{ fontFamily: "monospace" }}>
                  {license.customerId ? shortId(license.customerId) : "—"}
                </div>
              </div>
              <div>
                <div style={{ color: "#9ca3af" }}>Gültig von</div>
                <div>{formatDate(license.validFrom)}</div>
              </div>
              <div>
                <div style={{ color: "#9ca3af" }}>Gültig bis</div>
                <div>{formatDate(license.validUntil)}</div>
              </div>
              <div>
                <div style={{ color: "#9ca3af" }}>Erstellt am</div>
                <div>{formatDate(license.createdAt)}</div>
              </div>
            </div>
          </div>

          {/* Events */}
          <h2
            className="admin-page-title"
            style={{ fontSize: 18, marginBottom: 8 }}
          >
            Events
          </h2>
          <p className="admin-page-subtitle" style={{ marginBottom: 12 }}>
            Aktivitäten rund um diese Lizenz (Aktivierung, Heartbeats, etc.).
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
                {events.map((evt) => (
                  <tr key={evt.id}>
                    <td>{evt.type}</td>
                    <td style={{ fontSize: 13 }}>
                      {renderEventDetails(evt)}
                    </td>
                    <td>{formatDate(evt.createdAt)}</td>
                  </tr>
                ))}
                {events.length === 0 && (
                  <tr>
                    <td colSpan={3} style={{ fontSize: 13, color: "#9ca3af" }}>
                      Noch keine Events für diese Lizenz.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
