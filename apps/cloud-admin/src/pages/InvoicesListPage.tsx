// apps/cloud-admin/src/pages/InvoicesListPage.tsx
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { apiGet, apiDelete } from "../lib/api";
import { formatDateTime, formatMoney } from "../lib/format";
import { useTheme, themeColors } from "../theme/ThemeContext";

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
  const { theme } = useTheme();
  const colors = themeColors[theme];
  const [data, setData] = useState<InvoicesResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [deleteBusyId, setDeleteBusyId] = useState<string | null>(null);

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
      <h1
        style={{
          fontSize: "32px",
          fontWeight: 700,
          marginBottom: "8px",
          color: colors.text,
          letterSpacing: "-0.5px",
        }}
      >
        Invoices
      </h1>
      <p
        style={{
          fontSize: "14px",
          color: colors.textSecondary,
          marginBottom: "24px",
        }}
      >
        {data ? `${data.total} Rechnungen` : "Lade Daten…"}
      </p>

      {loading && <p style={{ color: colors.textSecondary }}>Lade…</p>}
      {error && (
        <div
          className="admin-error"
          style={{
            backgroundColor: colors.errorBg,
            borderColor: `${colors.error}50`,
            color: colors.error,
          }}
        >
          {error}
        </div>
      )}

      {data && data.items.length > 0 && (
        <div
          className="admin-table-wrapper"
          style={{
            backgroundColor: colors.bgSecondary,
            borderColor: colors.border,
            transition: "background-color 0.3s, border-color 0.3s",
          }}
        >
          <table className="admin-table">
            <thead>
              <tr style={{ backgroundColor: colors.bgTertiary }}>
                <th style={{ color: colors.textSecondary }}>Nummer</th>
                <th style={{ color: colors.textSecondary }}>Kunde</th>
                <th style={{ color: colors.textSecondary }}>Status</th>
                <th style={{ color: colors.textSecondary }}>Betrag</th>
                <th style={{ color: colors.textSecondary }}>Ausgestellt</th>
                <th style={{ color: colors.textSecondary }}>Fällig am</th>
                <th style={{ color: colors.textSecondary }}>Aktionen</th>
              </tr>
            </thead>
            <tbody>
              {data.items.map((inv) => (
                <tr
                  key={inv.id}
                  style={{
                    borderBottomColor: colors.border,
                    transition: "background-color 0.2s",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = colors.bgTertiary;
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = "transparent";
                  }}
                >
                  <td style={{ color: colors.text }}>
                    <Link
                      to={`/invoices/${inv.id}`}
                      style={{
                        color: colors.accent,
                        textDecoration: "none",
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.color = colors.accentHover;
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.color = colors.accent;
                      }}
                    >
                      {inv.number}
                    </Link>
                  </td>
                  <td style={{ color: colors.text }}>
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
                  <td style={{ color: colors.text }}>
                    {formatMoney(inv.amountCents, inv.currency)}
                  </td>
                  <td style={{ color: colors.text }}>
                    {formatDateTime(inv.createdAt)}
                  </td>
                  <td style={{ color: colors.text }}>
                    {formatDateTime(inv.dueAt)}
                  </td>
                  <td>
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 8,
                        flexWrap: "wrap",
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
                          color: colors.accent,
                          fontSize: 14,
                          background: "none",
                          border: "none",
                          cursor: "pointer",
                          padding: "4px 8px",
                          transition: "color 0.2s",
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.color = colors.accentHover;
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.color = colors.accent;
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
                          color: colors.accent,
                          fontSize: 14,
                          background: "none",
                          border: "none",
                          cursor: "pointer",
                          padding: "4px 8px",
                          transition: "color 0.2s",
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.color = colors.accentHover;
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.color = colors.accent;
                        }}
                      >
                        📥 PDF
                      </button>
                      {/* Delete-Button für Invoice (nur open/cancelled) */}
                      {["open", "cancelled", "canceled", "draft"].includes(
                        inv.status?.toLowerCase() || ""
                      ) && (
                        <button
                          onClick={async () => {
                            if (
                              !confirm(
                                `Möchten Sie die Rechnung "${inv.number}" (Status: ${inv.status}) wirklich löschen? Diese Aktion kann nicht rückgängig gemacht werden.`,
                              )
                            ) {
                              return;
                            }
                            setDeleteBusyId(inv.id);
                            try {
                              const result = await apiDelete<{ ok: boolean; message?: string; error?: string }>(
                                `/invoices/${inv.id}`
                              );
                              if (!result.ok) {
                                throw new Error(result.error || "Fehler beim Löschen");
                              }
                              // Liste neu laden
                              const data = await apiGet<InvoicesResponse>("/invoices?limit=50&offset=0");
                              setData(data);
                            } catch (err: any) {
                              console.error("Error deleting invoice", err);
                              alert(err?.message || "Fehler beim Löschen der Rechnung.");
                            } finally {
                              setDeleteBusyId(null);
                            }
                          }}
                          disabled={deleteBusyId === inv.id}
                          style={{
                            background: colors.error,
                            color: theme === "dark" ? "#fee2e2" : "#ffffff",
                            border: "none",
                            borderRadius: 4,
                            padding: "4px 8px",
                            fontSize: 11,
                            cursor: deleteBusyId === inv.id ? "wait" : "pointer",
                            opacity: deleteBusyId === inv.id ? 0.6 : 1,
                            transition: "opacity 0.2s",
                          }}
                          title="Rechnung löschen (nur open/cancelled)"
                        >
                          {deleteBusyId === inv.id ? "..." : "🗑️"}
                        </button>
                      )}
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
