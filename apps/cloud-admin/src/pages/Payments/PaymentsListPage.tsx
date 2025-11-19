// apps/cloud-admin/src/pages/Payments/PaymentsListPage.tsx
import { useEffect, useState } from "react";
import { apiGet } from "../../lib/api";

type Payment = {
  id: string;
  customerId: string;
  subscriptionId: string;
  provider: string;
  providerPaymentId: string;
  providerStatus: string;
  amountCents: number;
  currency: string;
  status: string;
  createdAt: string;
};

type PaymentsResponse = {
  items: Payment[];
  total: number;
};

export default function PaymentsListPage() {
  const [data, setData] = useState<PaymentsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        setLoading(true);
        setError(null);
        const res = await apiGet<PaymentsResponse>("/payments");
        if (cancelled) return;
        setData(res);
      } catch (err) {
        console.error(err);
        if (!cancelled) {
          setError("Fehler beim Laden der Payments.");
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

  const formatAmount = (amountCents: number, currency: string) => {
    const value = (amountCents ?? 0) / 100;
    return `${value.toFixed(2)} ${currency}`;
  };

  const shortId = (id: string) => (id ? `${id.slice(0, 8)}…` : "–");

  return (
    <div className="admin-page">
      <h1 className="admin-page-title">Payments</h1>
      <p className="admin-page-subtitle">
        Übersicht über Zahlungen aus externen Providern (z.B. PayPal Sandbox).
      </p>

      {error && <div className="admin-error">{error}</div>}
      {loading && !items.length && !error && <p>lade Daten…</p>}

      <div className="admin-table-wrapper">
        <table className="admin-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Customer</th>
              <th>Subscription</th>
              <th>Betrag</th>
              <th>Status</th>
              <th>Provider</th>
              <th>Erstellt</th>
            </tr>
          </thead>
          <tbody>
            {!items.length && !loading && !error && (
              <tr>
                <td colSpan={7}>Keine Payments gefunden.</td>
              </tr>
            )}
            {items.map((p) => (
              <tr key={p.id}>
                <td>{shortId(p.id)}</td>
                <td>{shortId(p.customerId)}</td>
                <td>{shortId(p.subscriptionId)}</td>
                <td>{formatAmount(p.amountCents, p.currency)}</td>
                <td>
                  <span
                    className={
                      p.status === "paid"
                        ? "badge badge--green"
                        : p.status === "failed"
                        ? "badge badge--red"
                        : "badge badge--amber"
                    }
                  >
                    {p.status}
                  </span>
                </td>
                <td>{p.provider}</td>
                <td>
                  {p.createdAt
                    ? new Date(p.createdAt).toLocaleString("de-DE")
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
