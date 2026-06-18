import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Bell } from "lucide-react";
import type { AdminNotification } from "../lib/api";
import {
  fetchNotifications,
  markNotificationRead,
} from "../lib/api";
import {
  DATE_GROUP_LABELS,
  groupNotificationDate,
  notificationCategoryLabel,
  notificationIcon,
  type DateGroup,
} from "../lib/notificationUi";
import { useTheme, themeColors } from "../theme/ThemeContext";

function formatDate(value: string) {
  return new Date(value).toLocaleString("de-DE");
}

const GROUP_ORDER: DateGroup[] = ["today", "yesterday", "week", "older"];

export default function NotificationBell() {
  const { theme } = useTheme();
  const colors = themeColors[theme];
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [items, setItems] = useState<AdminNotification[]>([]);
  const [error, setError] = useState<string | null>(null);

  const unreadCount = items.filter((n) => !n.isRead).length;

  async function load() {
    try {
      setLoading(true);
      setError(null);
      const res = await fetchNotifications({ limit: 15 });
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

  async function handleMarkRead(id: string, e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    try {
      await markNotificationRead(id);
      setItems((prev) =>
        prev.map((n) => (n.id === id ? { ...n, isRead: true } : n)),
      );
    } catch {
      // ignore
    }
  }

  function handleItemClick(n: AdminNotification) {
    if (n.actionHref) {
      setOpen(false);
      navigate(n.actionHref);
      if (!n.isRead) void markNotificationRead(n.id);
    }
  }

  const grouped = GROUP_ORDER.map((group) => ({
    group,
    label: DATE_GROUP_LABELS[group],
    items: items.filter((n) => groupNotificationDate(n.createdAt) === group),
  })).filter((g) => g.items.length > 0);

  return (
    <div className="notification-bell">
      <button
        type="button"
        onClick={() => setOpen((x) => !x)}
        className="admin-icon-btn notification-bell__trigger"
        title="Notifications"
        aria-expanded={open}
      >
        <Bell size={16} />
        {unreadCount > 0 && (
          <span className="notification-bell__badge">{unreadCount}</span>
        )}
      </button>

      {open && (
        <div
          className="notification-bell__dropdown"
          style={{
            background: colors.bgSecondary,
            borderColor: colors.border,
          }}
        >
          <div
            className="notification-bell__header"
            style={{ borderColor: colors.border, color: colors.text }}
          >
            <span>Notifications</span>
            <button
              type="button"
              onClick={() => void load()}
              className="notification-bell__refresh"
              style={{ color: colors.textSecondary }}
            >
              aktualisieren
            </button>
          </div>

          {loading && (
            <p className="notification-bell__empty" style={{ color: colors.textSecondary }}>
              Wird geladen …
            </p>
          )}

          {error && (
            <p className="notification-bell__empty" style={{ color: colors.error }}>
              {error}
            </p>
          )}

          {!loading && !error && items.length === 0 && (
            <p className="notification-bell__empty" style={{ color: colors.textSecondary }}>
              Keine Notifications.
            </p>
          )}

          {!loading &&
            grouped.map(({ group, label, items: groupItems }) => (
              <div key={group}>
                <div
                  className="notification-bell__group-label"
                  style={{ color: colors.textSecondary }}
                >
                  {label}
                </div>
                {groupItems.map((n) => {
                  const Icon = notificationIcon(
                    n.type ?? "",
                    n.category,
                  );
                  const catLabel = notificationCategoryLabel(
                    n.category ?? "other",
                  );
                  return (
                    <button
                      key={n.id}
                      type="button"
                      className="notification-bell__item"
                      style={{
                        background: n.isRead ? "transparent" : colors.bgTertiary,
                        borderColor: colors.border,
                      }}
                      onClick={() => handleItemClick(n)}
                    >
                      <div className="notification-bell__item-icon" style={{ color: colors.accent }}>
                        <Icon size={16} />
                      </div>
                      <div className="notification-bell__item-body">
                        <div
                          className="notification-bell__item-title"
                          style={{
                            color: colors.text,
                            fontWeight: n.isRead ? 400 : 600,
                          }}
                        >
                          {catLabel}
                        </div>
                        <div
                          className="notification-bell__item-sub"
                          style={{ color: colors.textSecondary }}
                        >
                          {n.title}
                        </div>
                        {(n.customerName || n.customerEmail) && (
                          <div
                            className="notification-bell__item-meta"
                            style={{ color: colors.textSecondary }}
                          >
                            {n.customerName ?? n.customerEmail}
                          </div>
                        )}
                      </div>
                      <div className="notification-bell__item-actions">
                        <span style={{ color: colors.textSecondary, fontSize: 10 }}>
                          {formatDate(n.createdAt)}
                        </span>
                        {!n.isRead && (
                          <span
                            role="button"
                            tabIndex={0}
                            onClick={(e) => void handleMarkRead(n.id, e)}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") void handleMarkRead(n.id, e as unknown as React.MouseEvent);
                            }}
                            style={{ color: colors.accent, fontSize: 10 }}
                          >
                            gelesen
                          </span>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            ))}

          <div
            className="notification-bell__footer"
            style={{ borderColor: colors.border }}
          >
            <Link
              to="/notifications"
              style={{ color: colors.accent }}
              onClick={() => setOpen(false)}
            >
              alle anzeigen
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
