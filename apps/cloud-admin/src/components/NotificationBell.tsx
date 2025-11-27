import React, { useEffect, useState } from "react";
import {
  AdminNotification,
  fetchNotifications,
  markNotificationRead,
} from "../lib/api";
import { Link } from "react-router-dom";

function formatDate(value: string) {
  const d = new Date(value);
  return d.toLocaleString();
}

export default function NotificationBell() {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [items, setItems] = useState<AdminNotification[]>([]);
  const [error, setError] = useState<string | null>(null);

  const unreadCount = items.filter((n) => !n.isRead).length;

  async function load() {
    try {
      setLoading(true);
      setError(null);
      const res = await fetchNotifications({ limit: 10 });
      // neueste zuerst
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

  return (
    <div style={{ position: "relative" }}>
      <button
        type="button"
        onClick={() => setOpen((x) => !x)}
        style={{
          position: "relative",
          width: 32,
          height: 32,
          borderRadius: 999,
          border: "1px solid #374151",
          background: "#020617",
          color: "#e5e7eb",
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 16,
        }}
        title="Notifications"
      >
        🔔
        {unreadCount > 0 && (
          <span
            style={{
              position: "absolute",
              top: -3,
              right: -3,
              minWidth: 16,
              height: 16,
              borderRadius: 999,
              background: "#ef4444",
              color: "#f9fafb",
              fontSize: 10,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              padding: "0 4px",
            }}
          >
            {unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div
          style={{
            position: "absolute",
            right: 0,
            marginTop: 8,
            width: 340,
            maxHeight: 360,
            overflowY: "auto",
            background: "#020617",
            borderRadius: 12,
            border: "1px solid #1f2937",
            boxShadow: "0 18px 45px rgba(0,0,0,0.55)",
            zIndex: 40,
          }}
        >
          <div
            style={{
              padding: "10px 12px",
              borderBottom: "1px solid #111827",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              fontSize: 13,
            }}
          >
            <span>Notifications</span>
            <button
              type="button"
              onClick={load}
              style={{
                fontSize: 11,
                border: "none",
                background: "transparent",
                color: "#9ca3af",
                cursor: "pointer",
              }}
            >
              aktualisieren
            </button>
          </div>

          {loading && (
            <div
              style={{
                padding: 12,
                fontSize: 13,
                color: "#9ca3af",
              }}
            >
              Wird geladen …
            </div>
          )}

          {error && (
            <div
              style={{
                padding: 12,
                fontSize: 12,
                color: "#fecaca",
              }}
            >
              {error}
            </div>
          )}

          {!loading && !error && items.length === 0 && (
            <div
              style={{
                padding: 12,
                fontSize: 13,
                color: "#9ca3af",
              }}
            >
              Keine Notifications vorhanden.
            </div>
          )}

          {!loading &&
            !error &&
            items.map((n) => (
              <div
                key={n.id}
                style={{
                  padding: 12,
                  borderBottom: "1px solid #111827",
                  background: n.isRead ? "#020617" : "#020617",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    gap: 8,
                    marginBottom: 4,
                  }}
                >
                  <div
                    style={{
                      fontSize: 13,
                      fontWeight: n.isRead ? 400 : 600,
                    }}
                  >
                    {n.title}
                  </div>
                  <div
                    style={{
                      fontSize: 10,
                      color: "#6b7280",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {formatDate(n.createdAt)}
                  </div>
                </div>
                {n.body && (
                  <div
                    style={{
                      fontSize: 12,
                      color: "#d1d5db",
                      marginBottom: 6,
                    }}
                  >
                    {n.body}
                  </div>
                )}

                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    fontSize: 11,
                    color: "#9ca3af",
                    gap: 8,
                  }}
                >
                  <span>{n.type}</span>
                  <div style={{ display: "flex", gap: 8 }}>
                    <Link
                      to="/licenses"
                      style={{ color: "#60a5fa", textDecoration: "none" }}
                    >
                      Details
                    </Link>
                    {!n.isRead && (
                      <button
                        type="button"
                        onClick={() => handleMarkRead(n.id)}
                        style={{
                          border: "none",
                          background: "transparent",
                          color: "#a5b4fc",
                          cursor: "pointer",
                        }}
                      >
                        als gelesen
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}

          <div
            style={{
              padding: 8,
              textAlign: "center",
              fontSize: 11,
              borderTop: "1px solid #111827",
            }}
          >
            <Link
              to="/notifications"
              style={{ color: "#60a5fa", textDecoration: "none" }}
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
