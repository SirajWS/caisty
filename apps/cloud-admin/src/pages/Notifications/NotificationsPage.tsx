import { useEffect, useState } from "react";
import type {
  AdminNotification,
  AdminSupportMessage,
} from "../../lib/api";
import {
  fetchNotifications,
  fetchSupportMessage,
  replySupportMessage,
  markNotificationRead,
} from "../../lib/api";

function formatDate(value: string) {
  const d = new Date(value);
  return d.toLocaleString();
}

export default function NotificationsPage() {
  const [items, setItems] = useState<AdminNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [selected, setSelected] = useState<AdminSupportMessage | null>(null);
  const [replyText, setReplyText] = useState("");
  const [detailError, setDetailError] = useState<string | null>(null);
  const [savingReply, setSavingReply] = useState(false);

  async function load() {
    try {
      setLoading(true);
      setError(null);
      const res = await fetchNotifications();
      const sorted = [...res.items].sort((a, b) =>
        a.createdAt < b.createdAt ? 1 : -1,
      );
      setItems(sorted);
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Fehler beim Laden der Notifications");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function handleMarkRead(id: string) {
    try {
      await markNotificationRead(id);
      setItems((prev) =>
        prev.map((n) => (n.id === id ? { ...n, isRead: true } : n)),
      );
    } catch (err) {
      console.error(err);
    }
  }

  async function handleOpen(n: AdminNotification) {
    const supportId: string | undefined =
      n.data && (n.data as any).supportMessageId;

    if (!supportId) {
      setDetailError("Keine verknüpfte Support-Nachricht vorhanden.");
      setSelected(null);
      return;
    }

    try {
      setDetailError(null);
      const msg = await fetchSupportMessage(supportId);
      setSelected(msg);
      setReplyText(msg.replyText ?? "");
    } catch (err: any) {
      console.error(err);
      setDetailError(err.message || "Fehler beim Laden der Support-Nachricht");
      setSelected(null);
    }
  }

  async function handleSendReply() {
    if (!selected) return;
    if (!replyText.trim()) {
      setDetailError("Bitte Antworttext eingeben.");
      return;
    }

    try {
      setSavingReply(true);
      setDetailError(null);
      const updated = await replySupportMessage(selected.id, {
        replyText: replyText.trim(),
        status: "answered",
      });
      setSelected(updated);
    } catch (err: any) {
      console.error(err);
      setDetailError(err.message || "Fehler beim Senden der Antwort");
    } finally {
      setSavingReply(false);
    }
  }

  return (
    <div className="admin-page">
      <h1 className="admin-page-title">Notifications</h1>
      <p className="admin-page-subtitle">
        Ereignisse aus Portal & Cloud – z.&nbsp;B. neue Trial-Anfragen oder
        Konto-Änderungen.
      </p>

      {error && (
        <div
          style={{
            marginTop: 16,
            padding: "10px 12px",
            borderRadius: 8,
            background: "#fef2f2",
            border: "1px solid #fecaca",
            fontSize: 13,
            color: "#991b1b",
          }}
        >
          {error}
        </div>
      )}

      <div
        style={{
          marginTop: 24,
          borderRadius: 12,
          border: "1px solid #e5e7eb",
          overflow: "hidden",
          background: "#ffffff",
          boxShadow: "0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)",
        }}
      >
        <div
          style={{
            padding: "12px 16px",
            borderBottom: "1px solid #e5e7eb",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            fontSize: 14,
            background: "#f9fafb",
          }}
        >
          <span style={{ color: "#111827", fontWeight: 600 }}>Letzte Ereignisse</span>
          <button
            type="button"
            onClick={load}
            style={{
              fontSize: 12,
              border: "1px solid #d1d5db",
              borderRadius: 6,
              padding: "4px 10px",
              background: "#ffffff",
              color: "#374151",
              cursor: "pointer",
              transition: "all 0.2s",
              fontWeight: 500,
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "#f3f4f6";
              e.currentTarget.style.borderColor = "#9ca3af";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "#ffffff";
              e.currentTarget.style.borderColor = "#d1d5db";
            }}
          >
            aktualisieren
          </button>
        </div>

        {loading ? (
          <div style={{ padding: 16, fontSize: 13, color: "#6b7280" }}>
            Wird geladen …
          </div>
        ) : items.length === 0 ? (
          <div style={{ padding: 16, fontSize: 13, color: "#6b7280" }}>
            Noch keine Notifications vorhanden.
          </div>
        ) : (
          <table
            style={{
              width: "100%",
              borderCollapse: "collapse",
              fontSize: 13,
            }}
          >
            <thead>
              <tr
                style={{
                  background: "#f9fafb",
                  borderBottom: "1px solid #e5e7eb",
                }}
              >
                <th style={{ textAlign: "left", padding: "10px 12px", color: "#374151", fontWeight: 600 }}>
                  Titel
                </th>
                <th style={{ textAlign: "left", padding: "10px 12px", color: "#374151", fontWeight: 600 }}>
                  Typ
                </th>
                <th style={{ textAlign: "left", padding: "10px 12px", color: "#374151", fontWeight: 600 }}>
                  Kunde
                </th>
                <th style={{ textAlign: "left", padding: "10px 12px", color: "#374151", fontWeight: 600 }}>
                  Status
                </th>
                <th style={{ textAlign: "left", padding: "10px 12px", color: "#374151", fontWeight: 600 }}>
                  Zeit
                </th>
                <th style={{ padding: "10px 12px", color: "#374151", fontWeight: 600 }}>Aktion</th>
              </tr>
            </thead>
            <tbody>
              {items.map((n) => (
                <tr
                  key={n.id}
                  style={{
                    borderBottom: "1px solid #e5e7eb",
                    background: n.isRead ? "#ffffff" : "#f9fafb",
                    transition: "background-color 0.2s",
                  }}
                  onMouseEnter={(e) => {
                    if (n.isRead) {
                      e.currentTarget.style.background = "#f3f4f6";
                    } else {
                      e.currentTarget.style.background = "#f3f4f6";
                    }
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = n.isRead ? "#ffffff" : "#f9fafb";
                  }}
                >
                  <td style={{ padding: "10px 12px", color: "#111827", fontWeight: n.isRead ? 400 : 500 }}>{n.title}</td>
                  <td style={{ padding: "10px 12px", color: "#6b7280" }}>
                    {n.kind || n.source || "info"}
                  </td>
                  <td style={{ padding: "10px 12px", color: "#6b7280", fontSize: 12 }}>
                    {n.customerName ||
                      n.customerEmail ||
                      n.customerId ||
                      "unknown"}
                  </td>
                  <td style={{ padding: "10px 12px" }}>
                    <span
                      style={{
                        display: "inline-block",
                        padding: "3px 10px",
                        borderRadius: 12,
                        fontSize: 11,
                        fontWeight: 600,
                        background: n.isRead ? "#e5e7eb" : "#dcfce7",
                        color: n.isRead ? "#6b7280" : "#166534",
                        border: n.isRead ? "none" : "1px solid #bbf7d0",
                      }}
                    >
                      {n.isRead ? "gelesen" : "neu"}
                    </span>
                  </td>
                  <td
                    style={{
                      padding: "10px 12px",
                      color: "#6b7280",
                      whiteSpace: "nowrap",
                      fontSize: 12,
                    }}
                  >
                    {formatDate(n.createdAt)}
                  </td>
                  <td
                    style={{
                      padding: "8px 10px",
                      textAlign: "right",
                      display: "flex",
                      gap: 8,
                      justifyContent: "flex-end",
                    }}
                  >
                    <button
                      type="button"
                      onClick={() => handleOpen(n)}
                      style={{
                        fontSize: 11,
                        borderRadius: 6,
                        border: "1px solid #d1d5db",
                        padding: "4px 12px",
                        background: "#ffffff",
                        color: "#374151",
                        cursor: "pointer",
                        transition: "all 0.2s",
                        fontWeight: 500,
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = "#f3f4f6";
                        e.currentTarget.style.borderColor = "#9ca3af";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = "#ffffff";
                        e.currentTarget.style.borderColor = "#d1d5db";
                      }}
                    >
                      öffnen
                    </button>
                    {!n.isRead && (
                      <button
                        type="button"
                        onClick={() => handleMarkRead(n.id)}
                        style={{
                          fontSize: 11,
                          borderRadius: 6,
                          border: "1px solid #d1d5db",
                          padding: "4px 12px",
                          background: "#ffffff",
                          color: "#374151",
                          cursor: "pointer",
                          transition: "all 0.2s",
                          fontWeight: 500,
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background = "#f3f4f6";
                          e.currentTarget.style.borderColor = "#9ca3af";
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = "#ffffff";
                          e.currentTarget.style.borderColor = "#d1d5db";
                        }}
                      >
                        als gelesen
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Detail-Panel für ausgewählte Support-Nachricht */}
      {selected && (
        <div
          style={{
            marginTop: 24,
            borderRadius: 12,
            border: "1px solid #e5e7eb",
            padding: 16,
            background: "#ffffff",
            boxShadow: "0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)",
          }}
        >
          <h2 style={{ fontSize: 16, marginBottom: 8, color: "#111827", fontWeight: 600 }}>Support-Anfrage</h2>
          <p style={{ fontSize: 13, color: "#6b7280", marginBottom: 12 }}>
            {selected.customerName || selected.customerEmail || selected.customerId}
            {" · "}
            {formatDate(selected.createdAt)}
          </p>

          <div
            style={{
              marginBottom: 12,
              padding: 12,
              borderRadius: 8,
              border: "1px solid #e5e7eb",
              background: "#f9fafb",
            }}
          >
            <div
              style={{
                fontSize: 14,
                fontWeight: 600,
                marginBottom: 4,
                color: "#111827",
              }}
            >
              {selected.subject}
            </div>
            <div
              style={{
                fontSize: 13,
                color: "#374151",
                whiteSpace: "pre-wrap",
                lineHeight: 1.6,
              }}
            >
              {selected.message}
            </div>
          </div>

          {selected.replyText && (
            <div
              style={{
                marginBottom: 12,
                padding: 12,
                borderRadius: 8,
                border: "1px solid #bfdbfe",
                background: "#eff6ff",
                fontSize: 13,
              }}
            >
              <div
                style={{
                  fontSize: 11,
                  color: "#1e40af",
                  marginBottom: 4,
                  fontWeight: 600,
                }}
              >
                Deine bisherige Antwort{" "}
                {selected.repliedAt
                  ? `(${formatDate(selected.repliedAt)})`
                  : ""}
              </div>
              <div style={{ whiteSpace: "pre-wrap", color: "#1e3a8a" }}>
                {selected.replyText}
              </div>
            </div>
          )}

          {detailError && (
            <div
              style={{
                marginBottom: 12,
                padding: "8px 10px",
                borderRadius: 8,
                background: "#fef2f2",
                border: "1px solid #fecaca",
                fontSize: 13,
                color: "#991b1b",
              }}
            >
              {detailError}
            </div>
          )}

          <div style={{ marginTop: 8 }}>
            <label
              style={{
                fontSize: 13,
                display: "block",
                marginBottom: 4,
                color: "#374151",
                fontWeight: 500,
              }}
            >
              Antwort an den Kunden
            </label>
            <textarea
              rows={5}
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
              placeholder="Antworttext, der im Kundenportal unter der Support-Anfrage angezeigt wird…"
              style={{
                width: "100%",
                padding: "10px 12px",
                borderRadius: 8,
                border: "1px solid #d1d5db",
                background: "#ffffff",
                color: "#111827",
                fontSize: 14,
                resize: "vertical",
              }}
            />
          </div>

          <div
            style={{
              marginTop: 12,
              display: "flex",
              justifyContent: "flex-end",
              gap: 8,
            }}
          >
            <button
              type="button"
              onClick={() => setSelected(null)}
              style={{
                fontSize: 13,
                borderRadius: 6,
                border: "1px solid #d1d5db",
                padding: "6px 14px",
                background: "#ffffff",
                color: "#374151",
                cursor: "pointer",
                fontWeight: 500,
                transition: "all 0.2s",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "#f3f4f6";
                e.currentTarget.style.borderColor = "#9ca3af";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "#ffffff";
                e.currentTarget.style.borderColor = "#d1d5db";
              }}
            >
              schließen
            </button>
            <button
              type="button"
              onClick={handleSendReply}
              disabled={savingReply}
              style={{
                fontSize: 13,
                borderRadius: 6,
                border: "none",
                padding: "6px 16px",
                background: savingReply ? "#86efac" : "#22c55e",
                color: "#ffffff",
                fontWeight: 600,
                cursor: savingReply ? "default" : "pointer",
                transition: "all 0.2s",
              }}
              onMouseEnter={(e) => {
                if (!savingReply) {
                  e.currentTarget.style.background = "#16a34a";
                }
              }}
              onMouseLeave={(e) => {
                if (!savingReply) {
                  e.currentTarget.style.background = "#22c55e";
                }
              }}
            >
              {savingReply ? "Wird gesendet…" : "Antwort senden"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
