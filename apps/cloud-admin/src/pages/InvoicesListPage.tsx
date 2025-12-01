// apps/cloud-admin/src/pages/InvoicesListPage.tsx
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { apiGet } from "../lib/api";
import { formatDateTime, formatMoney } from "../lib/format";

type Invoice = {
  id: string;
  number: string;
  status: string;
  amountCents: number;
  currency: string;
  createdAt: string;
  dueAt: string | null;
  customerId?: string;
  customerName?: string;
  customerEmail?: string;
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
    apiGet<InvoicesResponse>("/invoices?limit=50&offset=0")
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
                <th>Kunde</th>
                <th>Status</th>
                <th>Betrag</th>
                <th>Ausgestellt</th>
                <th>Fällig am</th>
                <th>Aktionen</th>
              </tr>
            </thead>
            <tbody>
              {data.items.map((inv) => (
                <tr key={inv.id}>
                  <td>
                    <Link
                      to={`/invoices/${inv.id}`}
                      style={{ color: "#a855f7", textDecoration: "none" }}
                    >
                      {inv.number}
                    </Link>
                  </td>
                  <td>
                    {inv.customerName
                      ? `${inv.customerName} (${inv.customerEmail ?? ""})`
                      : "—"}
                  </td>
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
                  <td>{formatDateTime(inv.createdAt)}</td>
                  <td>{formatDateTime(inv.dueAt)}</td>
                  <td>
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 8,
                      }}
                    >
                      <button
                        onClick={async () => {
                          const token = localStorage.getItem("caisty.admin.token");
                          if (!token) {
                            alert("Nicht angemeldet");
                            return;
                          }
                          const url = `/api/invoices/${inv.id}/html`;
                          const res = await fetch(url, {
                            headers: {
                              Authorization: `Bearer ${token}`,
                            },
                          });
                          if (!res.ok) {
                            alert(`Fehler: ${res.status}`);
                            return;
                          }
                          const html = await res.text();
                          const win = window.open();
                          if (win) {
                            win.document.write(html);
                            win.document.close();
                          }
                        }}
                        title="Rechnung anzeigen"
                        style={{
                          color: "#a855f7",
                          fontSize: 14,
                          background: "none",
                          border: "none",
                          cursor: "pointer",
                          padding: "4px 8px",
                        }}
                      >
                        📄 Anzeigen
                      </button>
                      <button
                        onClick={async () => {
                          const token = localStorage.getItem("caisty.admin.token");
                          if (!token) {
                            alert("Nicht angemeldet");
                            return;
                          }
                          const url = `/api/invoices/${inv.id}/html`;
                          const res = await fetch(url, {
                            headers: {
                              Authorization: `Bearer ${token}`,
                            },
                          });
                          if (!res.ok) {
                            alert(`Fehler: ${res.status}`);
                            return;
                          }
                          const html = await res.text();
                          const win = window.open();
                          if (win) {
                            win.document.write(html);
                            win.document.close();
                            // Print-Dialog nach kurzer Verzögerung öffnen
                            setTimeout(() => {
                              win?.print();
                            }, 500);
                          }
                        }}
                        title="Als PDF drucken"
                        style={{
                          color: "#10b981",
                          fontSize: 14,
                          background: "none",
                          border: "none",
                          cursor: "pointer",
                          padding: "4px 8px",
                        }}
                      >
                        📥 PDF
                      </button>
                    </div>
                  </td>
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
