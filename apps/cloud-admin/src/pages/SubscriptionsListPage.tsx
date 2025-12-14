// apps/cloud-admin/src/pages/SubscriptionsListPage.tsx
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { apiGet, apiDelete } from "../lib/api";
import { useTheme, themeColors } from "../theme/ThemeContext";

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
  const { theme } = useTheme();
  const colors = themeColors[theme];
  const [items, setItems] = useState<Subscription[]>([]);
  const [total, setTotal] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleteBusyId, setDeleteBusyId] = useState<string | null>(null);
  const [showCancelled, setShowCancelled] = useState(false);

  // Filter subscriptions by status
  const activeSubscriptions = items.filter(
    (s) => !["cancelled", "canceled", "failed", "past_due", "unpaid"].includes(s.status?.toLowerCase() || "")
  );
  const cancelledSubscriptions = items.filter((s) =>
    ["cancelled", "canceled", "failed", "past_due", "unpaid"].includes(s.status?.toLowerCase() || "")
  );

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
      <h1
        style={{
          fontSize: "32px",
          fontWeight: 700,
          marginBottom: "8px",
          color: colors.text,
          letterSpacing: "-0.5px",
        }}
      >
        Subscriptions
      </h1>
      <p
        style={{
          fontSize: "14px",
          color: colors.textSecondary,
          marginBottom: "24px",
        }}
      >
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
          color: colors.textSecondary,
        }}
      >
        <div style={{ display: "flex", gap: 16, alignItems: "center" }}>
          <span>
            <strong style={{ color: colors.text }}>{activeSubscriptions.length}</strong> aktive Subscriptions
          </span>
          {cancelledSubscriptions.length > 0 && (
            <span>
              <strong style={{ color: colors.text }}>{cancelledSubscriptions.length}</strong> beendete Subscriptions
            </span>
          )}
          <span style={{ color: colors.textTertiary }}>• {total} gesamt</span>
        </div>
      </div>

      {error && (
        <div
          className="admin-error-banner"
          style={{
            backgroundColor: colors.errorBg,
            borderColor: `${colors.error}50`,
            color: colors.error,
          }}
        >
          {error}
        </div>
      )}

      {/* Aktive Subscriptions */}
      <div
        className="admin-card"
        style={{
          backgroundColor: colors.bgSecondary,
          borderColor: colors.border,
          transition: "background-color 0.3s, border-color 0.3s",
          marginBottom: cancelledSubscriptions.length > 0 ? 24 : 0,
        }}
      >
        <div
          style={{
            padding: "12px 16px",
            borderBottom: `1px solid ${colors.border}`,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            backgroundColor: colors.bgTertiary,
          }}
        >
          <h2 style={{ fontSize: 16, fontWeight: 600, color: colors.text, margin: 0 }}>
            ✅ Aktive Subscriptions ({activeSubscriptions.length})
          </h2>
        </div>
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
                <th style={{ color: colors.textSecondary }}>ID</th>
                <th style={{ color: colors.textSecondary }}>Customer</th>
                <th style={{ color: colors.textSecondary }}>Plan</th>
                <th style={{ color: colors.textSecondary }}>Status</th>
                <th style={{ color: colors.textSecondary }}>Preis</th>
                <th style={{ color: colors.textSecondary }}>Intervall</th>
                <th style={{ color: colors.textSecondary }}>Gestartet</th>
                <th style={{ color: colors.textSecondary }}>Läuft bis</th>
                <th style={{ color: colors.textSecondary }}>Rechnungen</th>
                <th style={{ color: colors.textSecondary }}>Aktionen</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td
                    colSpan={10}
                    style={{
                      textAlign: "center",
                      padding: 24,
                      color: colors.textSecondary,
                    }}
                  >
                    Lädt Subscriptions…
                  </td>
                </tr>
              ) : activeSubscriptions.length === 0 ? (
                <tr>
                  <td
                    colSpan={10}
                    style={{
                      textAlign: "center",
                      padding: 24,
                      color: colors.textSecondary,
                    }}
                  >
                    Keine aktiven Subscriptions vorhanden.
                  </td>
                </tr>
              ) : (
                activeSubscriptions.map((s) => (
                  <tr
                    key={s.id}
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
                      {s.id.slice(0, 8)}…
                    </td>
                    <td style={{ color: colors.text }}>
                      {s.customerId ? (
                        <Link
                          to={`/customers/${s.customerId}`}
                          style={{
                            color: colors.accent,
                            textDecoration: "none",
                            transition: "color 0.2s",
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.color = colors.accentHover;
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.color = colors.accent;
                          }}
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
                            color: colors.textTertiary,
                          }}
                        >
                          ({s.customerEmail})
                        </span>
                      )}
                    </td>
                    <td style={{ color: colors.text }}>{s.plan || "—"}</td>
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
                                color: colors.accent,
                                fontSize: 11,
                                textDecoration: "none",
                                background: "none",
                                border: "none",
                                cursor: "pointer",
                                textAlign: "left",
                                padding: 0,
                                transition: "color 0.2s",
                              }}
                              onMouseEnter={(e) => {
                                e.currentTarget.style.color = colors.accentHover;
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.color = colors.accent;
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
                                color: colors.accent,
                                transition: "color 0.2s",
                              }}
                              onMouseEnter={(e) => {
                                e.currentTarget.style.color = colors.accentHover;
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.color = colors.accent;
                              }}
                            >
                              📥
                            </button>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <span style={{ color: colors.textSecondary }}>—</span>
                    )}
                  </td>
                  <td>
                    <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                      {s.customerStatus === "inactive" && s.customerId && (
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
                            background: colors.error,
                            color: theme === "dark" ? "#fee2e2" : "#ffffff",
                            border: "none",
                            borderRadius: 4,
                            padding: "4px 8px",
                            fontSize: 11,
                            cursor: deleteBusyId === s.customerId ? "wait" : "pointer",
                            opacity: deleteBusyId === s.customerId ? 0.6 : 1,
                            transition: "opacity 0.2s",
                          }}
                        >
                          {deleteBusyId === s.customerId ? "..." : "Kunde löschen"}
                        </button>
                      )}
                      {s.customerStatus !== "inactive" && (
                        <span style={{ color: colors.textSecondary }}>—</span>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
        </div>
      </div>

      {/* Beendete Subscriptions (Collapsible) */}
      {cancelledSubscriptions.length > 0 && (
        <div
          className="admin-card"
          style={{
            backgroundColor: colors.bgSecondary,
            borderColor: colors.border,
            transition: "background-color 0.3s, border-color 0.3s",
            opacity: 0.9,
          }}
        >
          <div
            style={{
              padding: "12px 16px",
              borderBottom: showCancelled ? `1px solid ${colors.border}` : "none",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              backgroundColor: colors.bgTertiary,
              cursor: "pointer",
            }}
            onClick={() => setShowCancelled(!showCancelled)}
          >
            <h2 style={{ fontSize: 16, fontWeight: 600, color: colors.text, margin: 0 }}>
              🗑️ Beendete Subscriptions ({cancelledSubscriptions.length})
            </h2>
            <span style={{ fontSize: 14, color: colors.textSecondary }}>
              {showCancelled ? "▼" : "▶"}
            </span>
          </div>
          {showCancelled && (
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
                    <th style={{ color: colors.textSecondary }}>ID</th>
                    <th style={{ color: colors.textSecondary }}>Customer</th>
                    <th style={{ color: colors.textSecondary }}>Plan</th>
                    <th style={{ color: colors.textSecondary }}>Status</th>
                    <th style={{ color: colors.textSecondary }}>Preis</th>
                    <th style={{ color: colors.textSecondary }}>Gestartet</th>
                    <th style={{ color: colors.textSecondary }}>Rechnungen</th>
                    <th style={{ color: colors.textSecondary }}>Aktionen</th>
                  </tr>
                </thead>
                <tbody>
                  {cancelledSubscriptions.map((s) => (
                    <tr
                      key={s.id}
                      style={{
                        borderBottomColor: colors.border,
                        transition: "background-color 0.2s",
                        opacity: 0.8,
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = colors.bgTertiary;
                        e.currentTarget.style.opacity = "1";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = "transparent";
                        e.currentTarget.style.opacity = "0.8";
                      }}
                    >
                      <td style={{ color: colors.textSecondary, fontSize: 12 }}>
                        {s.id.slice(0, 8)}…
                      </td>
                      <td style={{ color: colors.textSecondary }}>
                        {s.customerId ? (
                          <Link
                            to={`/customers/${s.customerId}`}
                            style={{
                              color: colors.textSecondary,
                              textDecoration: "none",
                              transition: "color 0.2s",
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.color = colors.accent;
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.color = colors.textSecondary;
                            }}
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
                              color: colors.textTertiary,
                            }}
                          >
                            ({s.customerEmail})
                          </span>
                        )}
                      </td>
                      <td style={{ color: colors.textSecondary }}>{s.plan || "—"}</td>
                      <td>
                        <span
                          className={`status-badge status-${s.status ?? "unknown"}`}
                          style={{ opacity: 0.7 }}
                        >
                          {s.status ?? "—"}
                        </span>
                      </td>
                      <td style={{ color: colors.textSecondary }}>
                        {formatPrice(s.priceCents, s.currency)}
                      </td>
                      <td style={{ color: colors.textSecondary, fontSize: 12 }}>
                        {formatDate(s.startedAt)}
                      </td>
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
                                    color: colors.textSecondary,
                                    fontSize: 11,
                                    textDecoration: "none",
                                    background: "none",
                                    border: "none",
                                    cursor: "pointer",
                                    textAlign: "left",
                                    padding: 0,
                                    transition: "color 0.2s",
                                  }}
                                  onMouseEnter={(e) => {
                                    e.currentTarget.style.color = colors.accent;
                                  }}
                                  onMouseLeave={(e) => {
                                    e.currentTarget.style.color = colors.textSecondary;
                                  }}
                                >
                                  {inv.number} 📄
                                </button>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <span style={{ color: colors.textTertiary }}>—</span>
                        )}
                      </td>
                      <td>
                        <button
                          onClick={async () => {
                            if (
                              !confirm(
                                `Möchten Sie die Subscription "${s.plan}" (Status: ${s.status}) wirklich löschen? Diese Aktion kann nicht rückgängig gemacht werden.`,
                              )
                            ) {
                              return;
                            }
                            setDeleteBusyId(s.id);
                            try {
                              const result = await apiDelete<{ ok: boolean; message?: string; error?: string }>(
                                `/subscriptions/${s.id}`
                              );
                              if (!result.ok) {
                                throw new Error(result.error || "Fehler beim Löschen");
                              }
                              // Liste neu laden
                              const data = await apiGet<SubscriptionsResponse>("/subscriptions");
                              setItems(data.items ?? []);
                              setTotal(data.total ?? data.items?.length ?? 0);
                            } catch (err: any) {
                              console.error("Error deleting subscription", err);
                              alert(err?.message || "Fehler beim Löschen der Subscription.");
                            } finally {
                              setDeleteBusyId(null);
                            }
                          }}
                          disabled={deleteBusyId === s.id}
                          style={{
                            background: colors.error,
                            color: theme === "dark" ? "#fee2e2" : "#ffffff",
                            border: "none",
                            borderRadius: 4,
                            padding: "4px 8px",
                            fontSize: 11,
                            cursor: deleteBusyId === s.id ? "wait" : "pointer",
                            opacity: deleteBusyId === s.id ? 0.6 : 1,
                            transition: "opacity 0.2s",
                          }}
                          title="Subscription löschen"
                        >
                          {deleteBusyId === s.id ? "..." : "🗑️ Löschen"}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
