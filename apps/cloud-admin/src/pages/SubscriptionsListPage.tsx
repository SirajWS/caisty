// apps/cloud-admin/src/pages/SubscriptionsListPage.tsx
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { apiGet, apiDelete } from "../lib/api";

type Subscription = {
  id: string;
  customerId: string;
  customerName?: string;
  customerEmail?: string;
  customerStatus?: string | null;
  plan: string;
  status: string;
  priceCents: number;
  currency: string;
  interval?: string | null;
  startedAt?: string | null;
  validUntil?: string | null;
  invoices?: Array<{ id: string; number: string }>;
};

type SubscriptionsResponse = {
  items: Subscription[];
  total: number;
  limit: number;
  offset: number;
};

function formatPrice(
  amountCents: number | null | undefined,
  currency: string | null | undefined,
) {
  if (amountCents == null || !currency) return "—";

  const amount = amountCents / 100;
  try {
    return new Intl.NumberFormat("de-DE", {
      style: "currency",
      currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  } catch {
    return `${amount.toFixed(2)} ${currency}`;
  }
}

function formatDate(value?: string | null) {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString("de-DE");
}

export default function SubscriptionsListPage() {
  const [items, setItems] = useState<Subscription[]>([]);
  const [total, setTotal] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleteBusyId, setDeleteBusyId] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        setLoading(true);
        setError(null);

        const data = await apiGet<SubscriptionsResponse>("/subscriptions");
        if (cancelled) return;

        setItems(data.items ?? []);
        setTotal(data.total ?? data.items?.length ?? 0);
      } catch (err) {
        console.error("Error loading subscriptions", err);
        if (!cancelled) {
          setError("Fehler beim Laden der Subscriptions.");
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

  return (
    <div className="admin-page">
      <h1 className="admin-page-title">Subscriptions</h1>
      <p className="admin-page-subtitle">
        Übersicht über alle aktiven und vergangenen Abos.
      </p>

      <div
        style={{
          marginTop: 16,
          marginBottom: 16,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: 12,
          fontSize: 13,
          color: "#9ca3af",
        }}
      >
        <span>{total} Subscriptions gesamt</span>
      </div>

      {error && <div className="admin-error-banner">{error}</div>}

      <div className="admin-card">
        <table className="admin-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Customer</th>
              <th>Plan</th>
              <th>Status</th>
              <th>Preis</th>
              <th>Intervall</th>
              <th>Gestartet</th>
              <th>Läuft bis</th>
              <th>Rechnungen</th>
              <th>Aktionen</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={10} style={{ textAlign: "center", padding: 24 }}>
                  Lädt Subscriptions…
                </td>
              </tr>
            ) : items.length === 0 ? (
              <tr>
                <td colSpan={10} style={{ textAlign: "center", padding: 24 }}>
                  Keine Subscriptions vorhanden.
                </td>
              </tr>
            ) : (
              items.map((s) => (
                <tr key={s.id}>
                  <td>{s.id.slice(0, 8)}…</td>
                  <td>
                    {s.customerId ? (
                      <Link
                        to={`/customers/${s.customerId}`}
                        style={{ color: "#a855f7" }}
                      >
                        {s.customerName
                          ? s.customerName
                          : s.customerId.slice(0, 8) + "…"}
                      </Link>
                    ) : (
                      "—"
                    )}
                    {s.customerEmail && (
                      <span
                        style={{
                          marginLeft: 4,
                          fontSize: 11,
                          color: "#9ca3af",
                        }}
                      >
                        ({s.customerEmail})
                      </span>
                    )}
                  </td>
                  <td>{s.plan || "—"}</td>
                  <td>
                    <span
                      className={`status-badge status-${s.status ?? "unknown"}`}
                    >
                      {s.status ?? "—"}
                    </span>
                  </td>
                  <td>{formatPrice(s.priceCents, s.currency)}</td>
                  <td>{s.interval || "—"}</td>
                  <td>{formatDate(s.startedAt)}</td>
                  <td>{formatDate(s.validUntil)}</td>
                  <td>
                    {s.invoices && s.invoices.length > 0 ? (
                      <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                        {s.invoices.map((inv) => (
                          <div
                            key={inv.id}
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: 4,
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
                              style={{
                                color: "#a855f7",
                                fontSize: 11,
                                textDecoration: "none",
                                background: "none",
                                border: "none",
                                cursor: "pointer",
                                textAlign: "left",
                                padding: 0,
                              }}
                            >
                              {inv.number} 📄
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
                                background: "none",
                                border: "none",
                                cursor: "pointer",
                                fontSize: 12,
                                padding: 0,
                                color: "#10b981",
                              }}
                            >
                              📥
                            </button>
                          </div>
                        ))}
                      </div>
                    ) : (
                      "—"
                    )}
                  </td>
                  <td>
                    {s.customerStatus === "inactive" && s.customerId ? (
                      <button
                        onClick={async () => {
                          if (
                            !confirm(
                              `Möchten Sie den Kunden "${s.customerName || s.customerId}" wirklich löschen? Diese Aktion kann nicht rückgängig gemacht werden.`,
                            )
                          ) {
                            return;
                          }
                          setDeleteBusyId(s.customerId);
                          try {
                            await apiDelete<{ ok: boolean }>(`/customers/${s.customerId}`);
                            // Liste neu laden
                            const data = await apiGet<SubscriptionsResponse>("/subscriptions");
                            setItems(data.items ?? []);
                            setTotal(data.total ?? data.items?.length ?? 0);
                          } catch (err) {
                            console.error("Error deleting customer", err);
                            alert("Fehler beim Löschen des Kunden.");
                          } finally {
                            setDeleteBusyId(null);
                          }
                        }}
                        disabled={deleteBusyId === s.customerId}
                        style={{
                          background: "#ef4444",
                          color: "white",
                          border: "none",
                          borderRadius: 4,
                          padding: "4px 8px",
                          fontSize: 11,
                          cursor: deleteBusyId === s.customerId ? "wait" : "pointer",
                          opacity: deleteBusyId === s.customerId ? 0.6 : 1,
                        }}
                      >
                        {deleteBusyId === s.customerId ? "..." : "Löschen"}
                      </button>
                    ) : (
                      "—"
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
