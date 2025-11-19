// apps/cloud-admin/src/pages/Webhooks/WebhooksListPage.tsx
import { useEffect, useState } from "react";
import { apiGet } from "../../lib/api";

type Webhook = {
  id: string;
  provider: string;
  eventType: string;
  status: string;
  errorMessage: string | null;
  createdAt: string;
};

type WebhooksResponse = {
  items: Webhook[];
  total: number;
};

export default function WebhooksListPage() {
  const [data, setData] = useState<WebhooksResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        setLoading(true);
        setError(null);
        const res = await apiGet<WebhooksResponse>("/webhooks");
        if (cancelled) return;
        setData(res);
      } catch (err) {
        console.error(err);
        if (!cancelled) {
          setError("Fehler beim Laden der Webhooks.");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, []);

  const items = data?.items ?? [];

  const shortId = (id: string) => (id ? `${id.slice(0, 8)}…` : "–");

  return (
    <div className="admin-page">
      <h1 className="admin-page-title">Webhooks</h1>
      <p className="admin-page-subtitle">
        Eingehende Webhook-Events (z.B. von PayPal Sandbox).
      </p>

      {error && <div className="admin-error">{error}</div>}
      {loading && !items.length && !error && <p>lade Daten…</p>}

      <div className="admin-table-wrapper">
        <table className="admin-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Provider</th>
              <th>Event</th>
              <th>Status</th>
              <th>Fehler</th>
              <th>Erstellt</th>
            </tr>
          </thead>
          <tbody>
            {!items.length && !loading && !error && (
              <tr>
                <td colSpan={6}>Keine Webhooks gefunden.</td>
              </tr>
            )}
            {items.map((w) => (
              <tr key={w.id}>
                <td>{shortId(w.id)}</td>
                <td>{w.provider}</td>
                <td>{w.eventType}</td>
                <td>
                  <span
                    className={
                      w.status === "processed"
                        ? "badge badge--green"
                        : w.status === "failed"
                        ? "badge badge--red"
                        : "badge badge--amber"
                    }
                  >
                    {w.status}
                  </span>
                </td>
                <td style={{ maxWidth: 260 }}>
                  {w.errorMessage ? (
                    <span title={w.errorMessage}>
                      {w.errorMessage.length > 40
                        ? `${w.errorMessage.slice(0, 40)}…`
                        : w.errorMessage}
                    </span>
                  ) : (
                    "–"
                  )}
                </td>
                <td>
                  {w.createdAt
                    ? new Date(w.createdAt).toLocaleString("de-DE")
                    : "–"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
