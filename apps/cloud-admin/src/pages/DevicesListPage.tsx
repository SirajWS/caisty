// apps/cloud-admin/src/pages/DevicesListPage.tsx
import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { apiGet } from "../lib/api";

type LicenseInfo = {
  id: string;
  key: string;
  plan: string;
  validFrom: string | null;
  validUntil: string | null;
};

type DeviceRow = {
  id: string;
  name: string;
  type: string;
  status: string;
  fingerprint: string | null;
  customerId: string | null;
  customerName: string | null;
  lastSeenAt: string | null;
  lastHeartbeatAt: string | null;
  createdAt: string;
  licenses?: LicenseInfo[];
};

type DevicesResponse = {
  items: DeviceRow[];
  total: number;
  limit: number;
  offset: number;
};

function formatDateTime(value: string | null) {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString("de-DE");
}

const MAX_LICENSES_INLINE = 4;

export default function DevicesListPage() {
  const [rows, setRows] = useState<DeviceRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await apiGet<DevicesResponse>("/devices");
        if (cancelled) return;
        setRows(res.items ?? []);
      } catch (err) {
        console.error("Error loading devices", err);
        if (!cancelled) {
          setError("Fehler beim Laden der Devices.");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  // etwas hübsch sortieren: zuerst Kunde, dann Name
  const sortedRows = [...rows].sort((a, b) => {
    const ca = (a.customerName ?? "").toLowerCase();
    const cb = (b.customerName ?? "").toLowerCase();
    if (ca !== cb) return ca.localeCompare(cb);
    return a.name.toLowerCase().localeCompare(b.name.toLowerCase());
  });

  return (
    <div className="admin-page">
      <h1 className="admin-page-title">Devices</h1>
      <p className="admin-page-subtitle">
        Alle registrierten POS-Geräte – nach Hardware-ID (Fingerprint / Device-ID)
        gruppiert.
      </p>

      {error && <div className="admin-error-banner">{error}</div>}

      <div className="admin-card">
        {loading ? (
          <div style={{ padding: 24, fontSize: 13 }}>Lädt Devices…</div>
        ) : sortedRows.length === 0 ? (
          <div style={{ padding: 24, fontSize: 13, color: "#9ca3af" }}>
            Keine Devices vorhanden.
          </div>
        ) : (
          <table className="admin-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Fingerprint</th>
                <th>Licenses</th>
                <th>Kunde</th>
                <th>Status</th>
                <th>Letzter Kontakt</th>
              </tr>
            </thead>
            <tbody>
              {sortedRows.map((d) => {
                const lastContact = d.lastHeartbeatAt || d.lastSeenAt || null;
                const licenses = d.licenses ?? [];

                return (
                  <tr key={d.id}>
                    <td>
                      <div style={{ whiteSpace: "nowrap" }}>{d.name}</div>
                      <div
                        style={{
                          fontSize: 11,
                          color: "#9ca3af",
                          marginTop: 2,
                          textTransform: "uppercase",
                        }}
                      >
                        {d.type}
                      </div>
                    </td>
                    <td className="font-mono text-xs text-slate-300">
                      {d.fingerprint ?? d.id}
                    </td>
                    <td>
                      {licenses.length === 0 ? (
                        <span className="opacity-60">—</span>
                      ) : (
                        <>
                          {licenses.slice(0, MAX_LICENSES_INLINE).map((lic) => (
                            <div
                              key={lic.id}
                              className="font-mono text-[11px] leading-snug"
                            >
                              {/* wenn du später License-Detail-Routen hast,
                                  kannst du das hier in einen Link wrappen */}
                              {lic.key}{" "}
                              <span className="text-slate-400">
                                ({lic.plan})
                              </span>
                            </div>
                          ))}
                          {licenses.length > MAX_LICENSES_INLINE && (
                            <div className="font-mono text-[11px] text-slate-500 mt-1">
                              + {licenses.length - MAX_LICENSES_INLINE} weitere
                              Lizenz(en)
                            </div>
                          )}
                        </>
                      )}
                    </td>
                    <td>
                      <div style={{ whiteSpace: "nowrap" }}>
                        {d.customerId ? (
                          <Link
                            to={`/customers/${d.customerId}`}
                            style={{ color: "#a855f7" }}
                          >
                            {d.customerName ?? d.customerId}
                          </Link>
                        ) : (
                          <span className="opacity-60">—</span>
                        )}
                      </div>
                    </td>
                    <td>
                      <span className={`status-badge status-${d.status}`}>
                        {d.status}
                      </span>
                    </td>
                    <td className="text-xs text-slate-300 whitespace-nowrap">
                      {formatDateTime(lastContact)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
