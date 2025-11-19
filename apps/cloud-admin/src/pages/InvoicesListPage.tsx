import { useEffect, useState } from "react";
import { apiGet } from "../lib/api";
import { formatDateTime, formatMoney } from "../lib/format";

type Invoice = {
  id: string;
  number: string;
  status: string;
  amountCents: number;
  currency: string;
  issuedAt: string;
  dueAt: string;
};

type InvoicesResponse = {
  items: Invoice[];
  total: number;
  limit: number;
  offset: number;
};

export default function InvoicesListPage() {
  const [data, setData] = useState<InvoicesResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    apiGet<InvoicesResponse>("/invoices?limit=20&offset=0")
      .then((res) => {
        setData(res);
        setError(null);
      })
      .catch((err) => {
        console.error(err);
        setError("Konnte Invoices nicht laden.");
      })
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="admin-page">
      <h1 className="admin-page-title">Invoices</h1>
      <p className="admin-page-subtitle">
        {data ? `${data.total} Rechnungen` : "Lade Daten…"}
      </p>

      {loading && <p>Lade…</p>}
      {error && <div className="admin-error">{error}</div>}

      {data && data.items.length > 0 && (
        <div className="admin-table-wrapper">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Nummer</th>
                <th>Status</th>
                <th>Betrag</th>
                <th>Ausgestellt</th>
                <th>Fällig am</th>
              </tr>
            </thead>
            <tbody>
              {data.items.map((inv) => (
                <tr key={inv.id}>
                  <td>{inv.number}</td>
                  <td>
                    <span
                      className={
                        inv.status === "paid"
                          ? "badge badge--green"
                          : "badge badge--red"
                      }
                    >
                      {inv.status}
                    </span>
                  </td>
                  <td>{formatMoney(inv.amountCents, inv.currency)}</td>
                  <td>{formatDateTime(inv.issuedAt)}</td>
                  <td>{formatDateTime(inv.dueAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {data && !loading && !error && data.items.length === 0 && (
        <p>Keine Rechnungen vorhanden.</p>
      )}
    </div>
  );
}
