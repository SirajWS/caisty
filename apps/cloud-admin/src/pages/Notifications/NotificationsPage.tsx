import React, { useEffect, useState } from "react";
import {
  AdminNotification,
  AdminSupportMessage,
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
            background: "rgba(248,113,113,0.12)",
            border: "1px solid rgba(248,113,113,0.5)",
            fontSize: 13,
          }}
        >
          {error}
        </div>
      )}

      <div
        style={{
          marginTop: 24,
          borderRadius: 12,
          border: "1px solid #374151",
          overflow: "hidden",
          background: "#111827",
        }}
      >
        <div
          style={{
            padding: "12px 16px",
            borderBottom: "1px solid #374151",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            fontSize: 14,
            background: "#1f2937",
          }}
        >
          <span style={{ color: "#e5e7eb", fontWeight: 500 }}>Letzte Ereignisse</span>
          <button
            type="button"
            onClick={load}
            style={{
              fontSize: 12,
              border: "1px solid #4b5563",
              borderRadius: 6,
              padding: "4px 10px",
              background: "#374151",
              color: "#e5e7eb",
              cursor: "pointer",
              transition: "all 0.2s",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "#4b5563";
              e.currentTarget.style.borderColor = "#6b7280";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "#374151";
              e.currentTarget.style.borderColor = "#4b5563";
            }}
          >
            aktualisieren
          </button>
        </div>

        {loading ? (
          <div style={{ padding: 16, fontSize: 13, color: "#9ca3af" }}>
            Wird geladen …
          </div>
        ) : items.length === 0 ? (
          <div style={{ padding: 16, fontSize: 13, color: "#9ca3af" }}>
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
                  background: "#1f2937",
                  borderBottom: "1px solid #374151",
                }}
              >
                <th style={{ textAlign: "left", padding: "10px 12px", color: "#e5e7eb", fontWeight: 600 }}>
                  Titel
                </th>
                <th style={{ textAlign: "left", padding: "10px 12px", color: "#e5e7eb", fontWeight: 600 }}>
                  Typ
                </th>
                <th style={{ textAlign: "left", padding: "10px 12px", color: "#e5e7eb", fontWeight: 600 }}>
                  Kunde
                </th>
                <th style={{ textAlign: "left", padding: "10px 12px", color: "#e5e7eb", fontWeight: 600 }}>
                  Status
                </th>
                <th style={{ textAlign: "left", padding: "10px 12px", color: "#e5e7eb", fontWeight: 600 }}>
                  Zeit
                </th>
                <th style={{ padding: "10px 12px", color: "#e5e7eb", fontWeight: 600 }}>Aktion</th>
              </tr>
            </thead>
            <tbody>
              {items.map((n) => (
                <tr
                  key={n.id}
                  style={{
                    borderBottom: "1px solid #374151",
                    background: n.isRead ? "#111827" : "#1f2937",
                    transition: "background-color 0.2s",
                  }}
                >
                  <td style={{ padding: "10px 12px", color: "#e5e7eb" }}>{n.title}</td>
                  <td style={{ padding: "10px 12px", color: "#9ca3af" }}>
                    {n.kind || n.source || "info"}
                  </td>
                  <td style={{ padding: "10px 12px", color: "#9ca3af" }}>
                    {n.customerName ||
                      n.customerEmail ||
                      n.customerId ||
                      "unknown"}
                  </td>
                  <td style={{ padding: "10px 12px" }}>
                    <span
                      style={{
                        display: "inline-block",
                        padding: "2px 8px",
                        borderRadius: 12,
                        fontSize: 11,
                        fontWeight: 500,
                        background: n.isRead ? "#374151" : "#22c55e",
                        color: n.isRead ? "#9ca3af" : "#ffffff",
                      }}
                    >
                      {n.isRead ? "gelesen" : "neu"}
                    </span>
                  </td>
                  <td
                    style={{
                      padding: "10px 12px",
                      color: "#9ca3af",
                      whiteSpace: "nowrap",
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
                        border: "1px solid #4b5563",
                        padding: "4px 12px",
                        background: "#374151",
                        color: "#e5e7eb",
                        cursor: "pointer",
                        transition: "all 0.2s",
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = "#4b5563";
                        e.currentTarget.style.borderColor = "#6b7280";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = "#374151";
                        e.currentTarget.style.borderColor = "#4b5563";
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
                          border: "1px solid #4b5563",
                          padding: "4px 12px",
                          background: "#374151",
                          color: "#e5e7eb",
                          cursor: "pointer",
                          transition: "all 0.2s",
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background = "#4b5563";
                          e.currentTarget.style.borderColor = "#6b7280";
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = "#374151";
                          e.currentTarget.style.borderColor = "#4b5563";
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
            border: "1px solid #1f2937",
            padding: 16,
            background: "#020617",
          }}
        >
          <h2 style={{ fontSize: 16, marginBottom: 8 }}>Support-Anfrage</h2>
          <p style={{ fontSize: 13, color: "#9ca3af", marginBottom: 12 }}>
            {selected.customerName || selected.customerEmail || selected.customerId}
            {" · "}
            {formatDate(selected.createdAt)}
          </p>

          <div
            style={{
              marginBottom: 12,
              padding: 12,
              borderRadius: 8,
              border: "1px solid #1f2937",
              background: "#020617",
            }}
          >
            <div
              style={{
                fontSize: 14,
                fontWeight: 500,
                marginBottom: 4,
              }}
            >
              {selected.subject}
            </div>
            <div
              style={{
                fontSize: 13,
                color: "#e5e7eb",
                whiteSpace: "pre-wrap",
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
                border: "1px solid rgba(59,130,246,0.6)",
                background: "rgba(37,99,235,0.15)",
                fontSize: 13,
              }}
            >
              <div
                style={{
                  fontSize: 11,
                  color: "#bfdbfe",
                  marginBottom: 4,
                }}
              >
                Deine bisherige Antwort{" "}
                {selected.repliedAt
                  ? `(${formatDate(selected.repliedAt)})`
                  : ""}
              </div>
              <div style={{ whiteSpace: "pre-wrap" }}>
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
                background: "rgba(248,113,113,0.12)",
                border: "1px solid rgba(248,113,113,0.5)",
                fontSize: 13,
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
                border: "1px solid #1f2937",
                background: "#020617",
                color: "#e5e7eb",
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
                borderRadius: 999,
                border: "1px solid #374151",
                padding: "6px 14px",
                background: "#020617",
                color: "#e5e7eb",
                cursor: "pointer",
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
                borderRadius: 999,
                border: "none",
                padding: "6px 16px",
                background: savingReply ? "#15803d" : "#22c55e",
                color: "#020617",
                fontWeight: 600,
                cursor: savingReply ? "default" : "pointer",
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
