// apps/cloud-admin/src/pages/Licenses/LicenseDetailPage.tsx
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

export default function LicenseDetailPage() {
  const { id } = useParams<{ id: string }>();

  const [license, setLicense] = useState<License | null>(null);
  const [events, setEvents] = useState<LicenseEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [revokeLoading, setRevokeLoading] = useState(false);
  const [revokeError, setRevokeError] = useState<string | null>(null);

  function formatDate(value: string | null | undefined) {
    if (!value) return "–";
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return "–";
    return d.toLocaleString("de-DE");
  }

  async function loadData() {
    if (!id) return;
    setLoading(true);
    setError(null);
    try {
      const res = await apiGet<{ item: License }>(`/licenses/${id}`);
      const eventsRes = await apiGet<EventsResponse>(
        `/licenses/${id}/events`,
      );
      setLicense(res.item);
      setEvents(eventsRes.items);
    } catch (err: any) {
      console.error(err);
      setError("Fehler beim Laden der Lizenz.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
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
                    <td colSpan={3}>Noch keine Events für diese Lizenz.</td>
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
