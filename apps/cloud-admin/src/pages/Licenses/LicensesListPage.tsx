// apps/cloud-admin/src/pages/Licenses/LicensesListPage.tsx
import { useEffect, useState } from "react";
import { apiGet } from "../../lib/api";

type License = {
  id: string;
  orgId: string;
  customerId: string;
  subscriptionId?: string | null;
  key: string;
  plan: string;
  maxDevices: number;
  status: string;
  validFrom?: string | null;
  validUntil?: string | null;
  createdAt?: string | null;
  updatedAt?: string | null;
};

type LicensesResponse = {
  items: License[];
  total: number;
  limit: number;
  offset: number;
};

function formatDate(value?: string | null): string {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleString("de-DE");
}

function statusBadgeClass(status: string): string {
  const normalized = status.toLowerCase();
  if (normalized === "active") return "badge badge--green";
  if (normalized === "revoked" || normalized === "expired")
    return "badge badge--red";
  return "badge badge--amber";
}

export default function LicensesListPage() {
  const [data, setData] = useState<LicensesResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    apiGet<LicensesResponse>("/licenses")
      .then((res) => {
        setData(res);
        setError(null);
      })
      .catch((err: unknown) => {
        console.error(err);
        setError(
          err instanceof Error
            ? err.message
            : "Fehler beim Laden der Lizenzen.",
        );
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  return (
    <div className="admin-page">
      <h1 className="admin-page-title">Licenses</h1>
      <p className="admin-page-subtitle">
        Übersicht über alle Lizenzschlüssel deiner Organisation.
      </p>

      {error && <div className="admin-error">{error}</div>}

      <div className="admin-table-wrapper" style={{ marginTop: 16 }}>
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
            {loading && (
              <tr>
                <td colSpan={7}>Lade Lizenzen…</td>
              </tr>
            )}

            {!loading && data && data.items.length === 0 && (
              <tr>
                <td colSpan={7}>Noch keine Lizenzen vorhanden.</td>
              </tr>
            )}

            {!loading &&
              data &&
              data.items.map((lic) => (
                <tr key={lic.id}>
                  <td>
                    <code>{lic.key}</code>
                  </td>
                  <td>{lic.plan}</td>
                  <td>
                    <span className={statusBadgeClass(lic.status)}>
                      {lic.status}
                    </span>
                  </td>
                  <td>{lic.maxDevices}</td>
                  <td>
                    <code>{lic.customerId}</code>
                  </td>
                  <td>{formatDate(lic.validUntil ?? null)}</td>
                  <td>{formatDate(lic.createdAt ?? null)}</td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
