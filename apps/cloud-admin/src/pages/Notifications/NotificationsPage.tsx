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
  groupNotificationDate,
  notificationIcon,
  type DateGroup,
} from "../../lib/notificationUi";
import { Button, DataTable, PageHeader } from "../../components/ui";
import { NotificationReadPill } from "../../lib/adminStatusPills";

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

export default function NotificationsPage() {
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
        err instanceof Error ? err.message : "Failed to load notifications.",
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
          err instanceof Error ? err.message : "Support message not found.",
        );
      }
    })();
  }, [searchParams]);

  const grouped = useMemo(
    () =>
      GROUP_ORDER.map((group) => ({
        group,
        label: DATE_GROUP_LABELS_EN[group],
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
        setDetailError("No linked support message.");
        return;
      }
      try {
        setDetailError(null);
        const msg = await fetchSupportMessage(supportId);
        setSelected(msg);
        setReplyText(msg.replyText ?? "");
      } catch (err: unknown) {
        setDetailError(
          err instanceof Error ? err.message : "Could not load support message.",
        );
      }
      return;
    }

    if (n.actionHref) {
      navigate(n.actionHref);
      return;
    }

    setDetailError("No destination available for this notification.");
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
        err instanceof Error ? err.message : "Could not send reply.",
      );
    } finally {
      setSavingReply(false);
    }
  }

  return (
    <div className="admin-page">
      <PageHeader
        title="Notifications"
        subtitle="Events from portal and cloud — with direct links to customer, license, payment, and support."
        actions={
          <>
            <Button variant="secondary" onClick={() => void load()}>
              Refresh
            </Button>
            <Button
              variant="primary"
              onClick={() => void handleMarkAllRead()}
              disabled={!items.some((n) => !n.isRead)}
            >
              Mark all read
            </Button>
          </>
        }
      />

      {error ? <div className="admin-error-banner">{error}</div> : null}

      {detailError && !selected ? (
        <div className="admin-error-banner">{detailError}</div>
      ) : null}

      {loading ? (
        <p className="ds-muted" style={{ marginTop: 24 }}>
          Loading…
        </p>
      ) : items.length === 0 ? (
        <p className="ds-muted" style={{ marginTop: 24 }}>
          No notifications yet.
        </p>
      ) : (
        grouped.map(({ group, label, items: groupItems }) => (
          <section key={group} className="ds-section-block">
            <h2 className="ds-section-title" style={{ marginBottom: 10 }}>
              {label}
            </h2>
            <DataTable>
              <thead>
                <tr>
                  <th style={{ width: 40 }} />
                  <th>Title</th>
                  <th>Type</th>
                  <th>Customer</th>
                  <th>Status</th>
                  <th>Time</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {groupItems.map((n) => {
                  const Icon = notificationIcon(n.type ?? "", n.category);
                  return (
                    <tr
                      key={n.id}
                      style={{
                        background: n.isRead ? undefined : "var(--panel2)",
                      }}
                    >
                      <td style={{ color: "var(--brand)" }}>
                        <Icon size={16} />
                      </td>
                      <td style={{ fontWeight: n.isRead ? 400 : 600 }}>
                        {n.title}
                        {n.body ? (
                          <div className="ds-muted" style={{ marginTop: 2 }}>
                            {n.body}
                          </div>
                        ) : null}
                      </td>
                      <td className="ds-muted">
                        {notificationCategoryLabelEn(n.category ?? "other")}
                      </td>
                      <td className="ds-muted" style={{ fontSize: 12 }}>
                        {n.customerName ? <div>{n.customerName}</div> : null}
                        {n.customerEmail ? (
                          <div className="ds-customer-email">{n.customerEmail}</div>
                        ) : null}
                        {!n.customerName && !n.customerEmail && n.customerId ? (
                          <Link to={`/customers/${n.customerId}`} className="ds-link">
                            Open customer
                          </Link>
                        ) : null}
                      </td>
                      <td>
                        <NotificationReadPill isRead={n.isRead ?? false} />
                      </td>
                      <td className="ds-muted" style={{ whiteSpace: "nowrap" }}>
                        {formatDate(n.createdAt)}
                      </td>
                      <td>
                        <div
                          style={{
                            display: "flex",
                            gap: 6,
                            flexWrap: "wrap",
                            justifyContent: "flex-end",
                          }}
                        >
                          <Button
                            variant="secondary"
                            style={{ fontSize: 11, height: 28, padding: "0 10px" }}
                            onClick={() => void handleOpen(n)}
                          >
                            {n.actionLabel ?? "Open"}
                          </Button>
                          {!n.isRead ? (
                            <Button
                              variant="link"
                              style={{ fontSize: 11 }}
                              onClick={() => void handleMarkRead(n.id)}
                            >
                              Read
                            </Button>
                          ) : null}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </DataTable>
          </section>
        ))
      )}

      {selected ? (
        <section className="ds-card ds-section-block ds-section-block--spaced">
          <h2 className="ds-section-title">Support request</h2>
          <p className="ds-muted" style={{ marginBottom: 12 }}>
            {selected.customerName || selected.customerEmail || selected.customerId}
            {" · "}
            {formatDate(selected.createdAt)}
          </p>
          <div
            className="ds-card"
            style={{
              marginBottom: 12,
              padding: 12,
              background: "var(--panel2)",
            }}
          >
            <div style={{ fontWeight: 600, marginBottom: 4 }}>{selected.subject}</div>
            <div className="ds-muted" style={{ whiteSpace: "pre-wrap" }}>
              {selected.message}
            </div>
          </div>
          <textarea
            rows={5}
            value={replyText}
            onChange={(e) => setReplyText(e.target.value)}
            placeholder="Reply to customer…"
            className="ds-input"
            style={{ width: "100%", resize: "vertical" }}
          />
          <div
            style={{
              marginTop: 12,
              display: "flex",
              flexWrap: "wrap",
              gap: 8,
              justifyContent: "flex-end",
            }}
          >
            <Button variant="secondary" onClick={() => setSelected(null)}>
              Close
            </Button>
            <Button
              variant="primary"
              onClick={() => void handleSendReply()}
              disabled={savingReply}
            >
              {savingReply ? "Sending…" : "Send reply"}
            </Button>
          </div>
        </section>
      ) : null}
    </div>
  );
}
