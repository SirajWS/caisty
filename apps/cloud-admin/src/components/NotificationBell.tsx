import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Bell } from "lucide-react";
import type { AdminNotification } from "../lib/api";
import {
  fetchNotifications,
  markNotificationRead,
} from "../lib/api";
import {
  groupNotificationDate,
  notificationIcon,
  type DateGroup,
} from "../lib/notificationUi";

function formatDate(value: string) {
  return new Date(value).toLocaleString("en-GB");
}

const GROUP_ORDER: DateGroup[] = ["today", "yesterday", "week", "older"];

const DATE_GROUP_LABELS_EN: Record<DateGroup, string> = {
  today: "Today",
  yesterday: "Yesterday",
  week: "This week",
  older: "Older",
};

function notificationCategoryLabelEn(category: string): string {
  switch (category) {
    case "customer":
      return "New customer";
    case "payment":
      return "Payment";
    case "license":
      return "License";
    case "support":
      return "Support";
    case "subscription":
      return "Subscription";
    default:
      return "Info";
  }
}

export default function NotificationBell() {
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
        err instanceof Error ? err.message : "Failed to load notifications.",
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
    label: DATE_GROUP_LABELS_EN[group],
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
          style={{ background: "var(--admin-bg-2)" }}
        >
          <div className="notification-bell__header">
            <span>Notifications</span>
            <button
              type="button"
              onClick={() => void load()}
              className="notification-bell__refresh"
              style={{ color: "var(--admin-muted)" }}
            >
              Refresh
            </button>
          </div>

          {loading && (
            <p
              className="notification-bell__empty"
              style={{ color: "var(--admin-muted)" }}
            >
              Loading…
            </p>
          )}

          {error && (
            <p
              className="notification-bell__empty"
              style={{ color: "var(--danger, #ef4444)" }}
            >
              {error}
            </p>
          )}

          {!loading && !error && items.length === 0 && (
            <p
              className="notification-bell__empty"
              style={{ color: "var(--admin-muted)" }}
            >
              No notifications.
            </p>
          )}

          {!loading &&
            grouped.map(({ group, label, items: groupItems }) => (
              <div key={group}>
                <div
                  className="notification-bell__group-label"
                  style={{ color: "var(--admin-muted)" }}
                >
                  {label}
                </div>
                {groupItems.map((n) => {
                  const Icon = notificationIcon(
                    n.type ?? "",
                    n.category,
                  );
                  const catLabel = notificationCategoryLabelEn(
                    n.category ?? "other",
                  );
                  return (
                    <button
                      key={n.id}
                      type="button"
                      className="notification-bell__item"
                      style={{
                        background: n.isRead
                          ? "transparent"
                          : "var(--admin-bg-3)",
                      }}
                      onClick={() => handleItemClick(n)}
                    >
                      <div
                        className="notification-bell__item-icon"
                        style={{ color: "var(--brand)" }}
                      >
                        <Icon size={16} />
                      </div>
                      <div className="notification-bell__item-body">
                        <div
                          className="notification-bell__item-title"
                          style={{
                            fontWeight: n.isRead ? 400 : 600,
                          }}
                        >
                          {catLabel}
                        </div>
                        <div
                          className="notification-bell__item-sub"
                          style={{ color: "var(--admin-muted)" }}
                        >
                          {n.title}
                        </div>
                        {(n.customerName || n.customerEmail) && (
                          <div
                            className="notification-bell__item-meta"
                            style={{ color: "var(--admin-muted)" }}
                          >
                            {n.customerName ?? n.customerEmail}
                          </div>
                        )}
                      </div>
                      <div className="notification-bell__item-actions">
                        <span
                          style={{
                            color: "var(--admin-muted)",
                            fontSize: 10,
                          }}
                        >
                          {formatDate(n.createdAt)}
                        </span>
                        {!n.isRead && (
                          <span
                            role="button"
                            tabIndex={0}
                            onClick={(e) => void handleMarkRead(n.id, e)}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") {
                                void handleMarkRead(
                                  n.id,
                                  e as unknown as React.MouseEvent,
                                );
                              }
                            }}
                            style={{ color: "var(--brand)", fontSize: 10 }}
                          >
                            Mark read
                          </span>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            ))}

          <div className="notification-bell__footer">
            <Link
              to="/notifications"
              className="ds-link"
              onClick={() => setOpen(false)}
            >
              View all
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
