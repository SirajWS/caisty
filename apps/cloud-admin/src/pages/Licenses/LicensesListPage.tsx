import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { apiGet } from "../../lib/api";

type License = {
  id: string;
  key: string;
  plan: string;
  status: string;
  maxDevices: number | null;
  customerId: string | null;
  validUntil: string | null;
  createdAt: string;
};

type LicensesResponse = {
  items: License[];
  total: number;
  limit: number;
  offset: number;
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

export default function LicensesListPage() {
  const [data, setData] = useState<LicensesResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    apiGet<LicensesResponse>("/licenses")
      .then((res) => {
        setData(res);
        setError(null);
      })
      .catch((err) => {
        console.error(err);
        setError("Fehler beim Laden der Licenses.");
      });
  }, []);

  const items = data?.items ?? [];

  return (
    <div className="admin-page">
      <h1 className="admin-page-title">Licenses</h1>
      <p className="admin-page-subtitle">
        Übersicht über alle Lizenzschlüssel deiner Organisation.
      </p>

      {error && <div className="admin-error">{error}</div>}

      <p style={{ fontSize: 13, color: "#9ca3af", marginBottom: 12 }}>
        {items.length} License{items.length === 1 ? "" : "s"} gesamt
      </p>

      <div className="admin-table-wrapper">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Key</th>
              <th>Plan</th>
              <th>Status</th>
              <th>Max Devices</th>
              <th>Customer</th>
              <th>Gültig bis</th>
              <th>Erstellt</th>
            </tr>
          </thead>
          <tbody>
            {items.map((lic) => (
              <tr key={lic.id}>
                <td>
                  {/* Link zur Detail-Seite */}
                  <Link
                    to={`/licenses/${lic.id}`}
                    style={{ color: "#a5b4fc", textDecoration: "none" }}
                  >
                    {lic.key}
                  </Link>
                </td>
                <td>{lic.plan}</td>
                <td>
                  <span className={statusBadgeClass(lic.status)}>
                    {lic.status}
                  </span>
                </td>
                <td>{lic.maxDevices ?? "—"}</td>
                <td style={{ fontFamily: "monospace", fontSize: 12 }}>
                  {lic.customerId ? `${lic.customerId.slice(0, 8)}…` : "—"}
                </td>
                <td>{formatDate(lic.validUntil)}</td>
                <td>{formatDate(lic.createdAt)}</td>
              </tr>
            ))}
            {items.length === 0 && (
              <tr>
                <td colSpan={7} style={{ fontSize: 13, color: "#9ca3af" }}>
                  Noch keine Licenses angelegt.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
