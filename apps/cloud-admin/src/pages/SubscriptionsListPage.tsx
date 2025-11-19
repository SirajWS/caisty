import { useEffect, useState } from "react";
import { apiGet } from "../lib/api";
import { formatDateTime, formatMoney } from "../lib/format";

type Subscription = {
  id: string;
  plan: string;
  status: string;
  priceCents: number;
  currency: string;
  interval?: string | null;
  startedAt: string;
  currentPeriodEnd: string;
};

type SubscriptionsResponse = {
  items: Subscription[];
  total: number;
  limit: number;
  offset: number;
};

export default function SubscriptionsListPage() {
  const [data, setData] = useState<SubscriptionsResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    apiGet<SubscriptionsResponse>("/subscriptions?limit=20&offset=0")
      .then((res) => {
        setData(res);
        setError(null);
      })
      .catch((err) => {
        console.error(err);
        setError("Konnte Subscriptions nicht laden.");
      })
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="admin-page">
      <h1 className="admin-page-title">Subscriptions</h1>
      <p className="admin-page-subtitle">
        {data ? `${data.total} Subscriptions gesamt` : "Lade Daten…"}
      </p>

      {loading && <p>Lade…</p>}
      {error && <div className="admin-error">{error}</div>}

      {data && data.items.length > 0 && (
        <div className="admin-table-wrapper">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Plan</th>
                <th>Status</th>
                <th>Preis</th>
                <th>Intervall</th>
                <th>Gestartet</th>
                <th>Läuft bis</th>
              </tr>
            </thead>
            <tbody>
              {data.items.map((s) => (
                <tr key={s.id}>
                  <td>{s.plan}</td>
                  <td>
                    <span
                      className={
                        s.status === "active"
                          ? "badge badge--green"
                          : "badge badge--red"
                      }
                    >
                      {s.status}
                    </span>
                  </td>
                  <td>{formatMoney(s.priceCents, s.currency)}</td>
                  <td>{s.interval ?? "–"}</td>
                  <td>{formatDateTime(s.startedAt)}</td>
                  <td>{formatDateTime(s.currentPeriodEnd)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {data && !loading && !error && data.items.length === 0 && (
        <p>Keine Subscriptions vorhanden.</p>
      )}
    </div>
  );
}
