import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import type { AdminNotification, AdminSupportMessage } from "../../lib/api";
import {
  fetchNotifications,
  fetchSupportMessage,
  markAllNotificationsRead,
  markNotificationRead,
  replySupportMessage,
} from "../../lib/api";
import {
  DATE_GROUP_LABELS,
  groupNotificationDate,
  notificationCategoryLabel,
  notificationIcon,
  type DateGroup,
} from "../../lib/notificationUi";
import { useTheme, themeColors } from "../../theme/ThemeContext";

function formatDate(value: string) {
  return new Date(value).toLocaleString("de-DE");
}

const GROUP_ORDER: DateGroup[] = ["today", "yesterday", "week", "older"];

export default function NotificationsPage() {
  const { theme } = useTheme();
  const colors = themeColors[theme];
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
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
    } catch (err: unknown) {
      setError(
        err instanceof Error ? err.message : "Fehler beim Laden der Notifications",
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  useEffect(() => {
    const supportId = searchParams.get("support");
    if (!supportId) return;
    void (async () => {
      try {
        const msg = await fetchSupportMessage(supportId);
        setSelected(msg);
        setReplyText(msg.replyText ?? "");
      } catch (err: unknown) {
        setDetailError(
          err instanceof Error ? err.message : "Support-Nachricht nicht gefunden",
        );
      }
    })();
  }, [searchParams]);

  const grouped = useMemo(
    () =>
      GROUP_ORDER.map((group) => ({
        group,
        label: DATE_GROUP_LABELS[group],
        items: items.filter((n) => groupNotificationDate(n.createdAt) === group),
      })).filter((g) => g.items.length > 0),
    [items],
  );

  async function handleMarkRead(id: string) {
    await markNotificationRead(id);
    setItems((prev) =>
      prev.map((n) => (n.id === id ? { ...n, isRead: true } : n)),
    );
  }

  async function handleMarkAllRead() {
    await markAllNotificationsRead();
    setItems((prev) => prev.map((n) => ({ ...n, isRead: true })));
  }

  async function handleOpen(n: AdminNotification) {
    if (!n.isRead) await handleMarkRead(n.id);

    if (n.type === "portal_support_message" || n.category === "support") {
      const supportId =
        (n.data?.supportMessageId as string | undefined) ??
        searchParams.get("support") ??
        undefined;
      if (!supportId) {
        setDetailError("Keine verknüpfte Support-Nachricht.");
        return;
      }
      try {
        setDetailError(null);
        const msg = await fetchSupportMessage(supportId);
        setSelected(msg);
        setReplyText(msg.replyText ?? "");
      } catch (err: unknown) {
        setDetailError(
          err instanceof Error ? err.message : "Support-Nachricht konnte nicht geladen werden",
        );
      }
      return;
    }

    if (n.actionHref) {
      navigate(n.actionHref);
      return;
    }

    setDetailError("Kein Ziel für diese Notification verfügbar.");
  }

  async function handleSendReply() {
    if (!selected || !replyText.trim()) return;
    try {
      setSavingReply(true);
      const updated = await replySupportMessage(selected.id, {
        replyText: replyText.trim(),
        status: "answered",
      });
      setSelected(updated);
    } catch (err: unknown) {
      setDetailError(
        err instanceof Error ? err.message : "Antwort konnte nicht gesendet werden",
      );
    } finally {
      setSavingReply(false);
    }
  }

  return (
    <div className="admin-page">
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          justifyContent: "space-between",
          gap: 12,
          alignItems: "flex-start",
        }}
      >
        <div>
          <h1 className="admin-page-title">Notifications</h1>
          <p className="admin-page-subtitle">
            Ereignisse aus Portal & Cloud — mit Direktlinks zu Kunde, Lizenz, Zahlung
            und Support.
          </p>
        </div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <button type="button" className="admin-btn admin-btn--ghost" onClick={() => void load()}>
            aktualisieren
          </button>
          <button
            type="button"
            className="admin-btn admin-btn--primary"
            onClick={() => void handleMarkAllRead()}
            disabled={!items.some((n) => !n.isRead)}
          >
            Alle als gelesen
          </button>
        </div>
      </div>

      {error && (
        <div className="admin-error" style={{ marginTop: 16, color: colors.error }}>
          {error}
        </div>
      )}

      {detailError && !selected && (
        <div
          style={{
            marginTop: 16,
            padding: 12,
            borderRadius: 8,
            background: colors.errorBg,
            color: colors.error,
            fontSize: 13,
          }}
        >
          {detailError}
        </div>
      )}

      {loading ? (
        <p style={{ marginTop: 24, color: colors.textSecondary }}>Wird geladen …</p>
      ) : items.length === 0 ? (
        <p style={{ marginTop: 24, color: colors.textSecondary }}>
          Noch keine Notifications vorhanden.
        </p>
      ) : (
        grouped.map(({ group, label, items: groupItems }) => (
          <section key={group} style={{ marginTop: 24 }}>
            <h2
              style={{
                fontSize: 14,
                fontWeight: 600,
                color: colors.textSecondary,
                marginBottom: 8,
                textTransform: "uppercase",
                letterSpacing: "0.05em",
              }}
            >
              {label}
            </h2>
            <div
              style={{
                borderRadius: 12,
                border: `1px solid ${colors.border}`,
                overflow: "hidden",
                background: colors.bgSecondary,
              }}
            >
              <table className="admin-table" style={{ fontSize: 13 }}>
                <thead>
                  <tr style={{ background: colors.bgTertiary }}>
                    <th style={{ width: 40 }} />
                    <th>Titel</th>
                    <th>Typ</th>
                    <th>Kunde</th>
                    <th>Status</th>
                    <th>Zeit</th>
                    <th>Aktion</th>
                  </tr>
                </thead>
                <tbody>
                  {groupItems.map((n) => {
                    const Icon = notificationIcon(n.type ?? "", n.category);
                    return (
                      <tr
                        key={n.id}
                        style={{
                          background: n.isRead ? "transparent" : colors.bgTertiary,
                        }}
                      >
                        <td style={{ padding: "10px 12px", color: colors.accent }}>
                          <Icon size={16} />
                        </td>
                        <td style={{ padding: "10px 12px", color: colors.text, fontWeight: n.isRead ? 400 : 600 }}>
                          {n.title}
                          {n.body && (
                            <div style={{ fontSize: 11, color: colors.textSecondary, marginTop: 2 }}>
                              {n.body}
                            </div>
                          )}
                        </td>
                        <td style={{ padding: "10px 12px", color: colors.textSecondary }}>
                          {notificationCategoryLabel(n.category ?? "other")}
                        </td>
                        <td style={{ padding: "10px 12px", fontSize: 12, color: colors.textSecondary }}>
                          {n.customerName && <div>{n.customerName}</div>}
                          {n.customerEmail && (
                            <div style={{ opacity: 0.85 }}>{n.customerEmail}</div>
                          )}
                          {!n.customerName && !n.customerEmail && n.customerId && (
                            <Link to={`/customers/${n.customerId}`} style={{ color: colors.accent }}>
                              Kunde öffnen
                            </Link>
                          )}
                        </td>
                        <td style={{ padding: "10px 12px" }}>
                          <span
                            style={{
                              fontSize: 11,
                              padding: "3px 10px",
                              borderRadius: 12,
                              background: n.isRead
                                ? "rgba(148,163,184,0.2)"
                                : "rgba(139,92,246,0.16)",
                              color: n.isRead ? colors.textSecondary : "#c4b5fd",
                            }}
                          >
                            {n.isRead ? "gelesen" : "neu"}
                          </span>
                        </td>
                        <td style={{ padding: "10px 12px", fontSize: 12, color: colors.textSecondary, whiteSpace: "nowrap" }}>
                          {formatDate(n.createdAt)}
                        </td>
                        <td style={{ padding: "8px 10px" }}>
                          <div style={{ display: "flex", gap: 6, flexWrap: "wrap", justifyContent: "flex-end" }}>
                            <button
                              type="button"
                              className="admin-btn admin-btn--ghost"
                              style={{ fontSize: 11 }}
                              onClick={() => void handleOpen(n)}
                            >
                              {n.actionLabel ?? "öffnen"}
                            </button>
                            {!n.isRead && (
                              <button
                                type="button"
                                className="admin-btn admin-btn--ghost"
                                style={{ fontSize: 11 }}
                                onClick={() => void handleMarkRead(n.id)}
                              >
                                gelesen
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </section>
        ))
      )}

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
          <h2 style={{ fontSize: 16, marginBottom: 8, color: colors.text }}>Support-Anfrage</h2>
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
            <div style={{ fontWeight: 600, marginBottom: 4, color: colors.text }}>
              {selected.subject}
            </div>
            <div style={{ fontSize: 13, color: colors.textSecondary, whiteSpace: "pre-wrap" }}>
              {selected.message}
            </div>
          </div>
          <textarea
            rows={5}
            value={replyText}
            onChange={(e) => setReplyText(e.target.value)}
            placeholder="Antwort an den Kunden…"
            style={{
              width: "100%",
              padding: "10px 12px",
              borderRadius: 8,
              border: `1px solid ${colors.border}`,
              background: colors.bg,
              color: colors.text,
              fontSize: 14,
            }}
          />
          <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:justify-end">
            <button type="button" className="admin-btn admin-btn--ghost" onClick={() => setSelected(null)}>
              schließen
            </button>
            <button
              type="button"
              className="admin-btn admin-btn--primary"
              onClick={() => void handleSendReply()}
              disabled={savingReply}
            >
              {savingReply ? "Wird gesendet…" : "Antwort senden"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
