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
import { useTheme, themeColors } from "../../theme/ThemeContext";

function formatDate(value: string) {
  const d = new Date(value);
  return d.toLocaleString();
}

export default function NotificationsPage() {
  const { theme } = useTheme();
  const colors = themeColors[theme];
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
        <div className="admin-error" style={{ marginTop: 16, background: colors.errorBg, borderColor: `${colors.error}40`, color: colors.error }}>
          {error}
        </div>
      )}

      <div
        style={{
          marginTop: 24,
          borderRadius: 12,
          border: `1px solid ${colors.border}`,
          overflow: "hidden",
          background: colors.bgSecondary,
        }}
      >
        <div
          style={{
            padding: "12px 16px",
            borderBottom: `1px solid ${colors.border}`,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            fontSize: 14,
            background: colors.bgTertiary,
          }}
        >
          <span style={{ color: colors.text, fontWeight: 600 }}>Letzte Ereignisse</span>
          <button
            type="button"
            onClick={load}
            className="admin-btn admin-btn--ghost"
            style={{
              fontSize: 12,
              borderColor: colors.border,
              background: colors.bgSecondary,
              color: colors.textSecondary,
              fontWeight: 500,
            }}
          >
            aktualisieren
          </button>
        </div>

        {loading ? (
          <div style={{ padding: 16, fontSize: 13, color: colors.textSecondary }}>
            Wird geladen …
          </div>
        ) : items.length === 0 ? (
          <div style={{ padding: 16, fontSize: 13, color: colors.textSecondary }}>
            Noch keine Notifications vorhanden.
          </div>
        ) : (
          <table className="admin-table" style={{ fontSize: 13 }}>
            <thead>
              <tr
                style={{
                  background: colors.bgTertiary,
                  borderBottom: `1px solid ${colors.border}`,
                }}
              >
                <th style={{ textAlign: "left", padding: "10px 12px", color: colors.textSecondary, fontWeight: 600 }}>
                  Titel
                </th>
                <th style={{ textAlign: "left", padding: "10px 12px", color: colors.textSecondary, fontWeight: 600 }}>
                  Typ
                </th>
                <th style={{ textAlign: "left", padding: "10px 12px", color: colors.textSecondary, fontWeight: 600 }}>
                  Kunde
                </th>
                <th style={{ textAlign: "left", padding: "10px 12px", color: colors.textSecondary, fontWeight: 600 }}>
                  Status
                </th>
                <th style={{ textAlign: "left", padding: "10px 12px", color: colors.textSecondary, fontWeight: 600 }}>
                  Zeit
                </th>
                <th style={{ padding: "10px 12px", color: colors.textSecondary, fontWeight: 600 }}>Aktion</th>
              </tr>
            </thead>
            <tbody>
              {items.map((n) => (
                <tr
                  key={n.id}
                  style={{
                    borderBottom: `1px solid ${colors.border}`,
                    background: n.isRead ? "transparent" : colors.bgTertiary,
                    transition: "background-color 0.2s",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = "rgba(139,92,246,0.08)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = n.isRead ? "transparent" : colors.bgTertiary;
                  }}
                >
                  <td style={{ padding: "10px 12px", color: colors.text, fontWeight: n.isRead ? 400 : 500 }}>{n.title}</td>
                  <td style={{ padding: "10px 12px", color: colors.textSecondary }}>
                    {n.kind || n.source || "info"}
                  </td>
                  <td style={{ padding: "10px 12px", color: colors.textSecondary, fontSize: 12 }}>
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
                        background: n.isRead ? "rgba(148,163,184,0.2)" : "rgba(139,92,246,0.16)",
                        color: n.isRead ? colors.textSecondary : "#c4b5fd",
                        border: n.isRead ? "none" : "1px solid rgba(139,92,246,0.35)",
                      }}
                    >
                      {n.isRead ? "gelesen" : "neu"}
                    </span>
                  </td>
                  <td
                    style={{
                      padding: "10px 12px",
                      color: colors.textSecondary,
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
                      className="admin-btn admin-btn--ghost"
                      style={{
                        fontSize: 11,
                        borderColor: colors.border,
                        background: colors.bgSecondary,
                        color: colors.textSecondary,
                        fontWeight: 500,
                      }}
                    >
                      öffnen
                    </button>
                    {!n.isRead && (
                      <button
                        type="button"
                        onClick={() => handleMarkRead(n.id)}
                        className="admin-btn admin-btn--ghost"
                        style={{
                          fontSize: 11,
                          borderColor: colors.border,
                          background: colors.bgSecondary,
                          color: colors.textSecondary,
                          fontWeight: 500,
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
            border: `1px solid ${colors.border}`,
            padding: 16,
            background: colors.bgSecondary,
          }}
        >
          <h2 style={{ fontSize: 16, marginBottom: 8, color: colors.text, fontWeight: 600 }}>Support-Anfrage</h2>
          <p style={{ fontSize: 13, color: colors.textSecondary, marginBottom: 12 }}>
            {selected.customerName || selected.customerEmail || selected.customerId}
            {" · "}
            {formatDate(selected.createdAt)}
          </p>

          <div
            style={{
              marginBottom: 12,
              padding: 12,
              borderRadius: 8,
              border: `1px solid ${colors.border}`,
              background: colors.bgTertiary,
            }}
          >
            <div
              style={{
                fontSize: 14,
                fontWeight: 600,
                marginBottom: 4,
                color: colors.text,
              }}
            >
              {selected.subject}
            </div>
            <div
              style={{
                fontSize: 13,
                color: colors.textSecondary,
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
                border: "1px solid rgba(139,92,246,0.35)",
                background: "rgba(139,92,246,0.12)",
                fontSize: 13,
              }}
            >
              <div
                style={{
                  fontSize: 11,
                  color: "#c4b5fd",
                  marginBottom: 4,
                  fontWeight: 600,
                }}
              >
                Deine bisherige Antwort{" "}
                {selected.repliedAt
                  ? `(${formatDate(selected.repliedAt)})`
                  : ""}
              </div>
              <div style={{ whiteSpace: "pre-wrap", color: "#ddd6fe" }}>
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
                background: colors.errorBg,
                border: `1px solid ${colors.error}50`,
                fontSize: 13,
                color: colors.error,
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
                color: colors.textSecondary,
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
                border: `1px solid ${colors.border}`,
                background: colors.bg,
                color: colors.text,
                fontSize: 14,
                resize: "vertical",
              }}
            />
          </div>

          <div className="mt-3 flex w-full flex-col gap-2 sm:flex-row sm:justify-end">
            <button
              type="button"
              className="admin-btn admin-btn--ghost w-full sm:w-auto"
              onClick={() => setSelected(null)}
            >
              schließen
            </button>
            <button
              type="button"
              className="admin-btn admin-btn--primary w-full sm:w-auto"
              onClick={handleSendReply}
              disabled={savingReply}
              style={{ opacity: savingReply ? 0.7 : 1 }}
            >
              {savingReply ? "Wird gesendet…" : "Antwort senden"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
