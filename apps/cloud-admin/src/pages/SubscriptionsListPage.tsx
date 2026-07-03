// apps/cloud-admin/src/pages/SubscriptionsListPage.tsx
import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  apiDelete,
  apiDeletePendingSubscription,
  apiGet,
  fetchAdminInvoiceHtml,
} from "../lib/api";
import {
  Button,
  DataTable,
  PageHeader,
  SectionHeader,
  Toolbar,
} from "../components/ui";
import { SubscriptionStatusPill } from "../lib/adminStatusPills";

type Subscription = {
  id: string;
  customerId: string;
  customerName?: string;
  customerEmail?: string;
  customerStatus?: string | null;
  plan: string;
  planTier?: string;
  status: string;
  priceCents: number;
  grossPriceCents?: number;
  netPriceCents?: number | null;
  taxPriceCents?: number | null;
  currency: string;
  interval?: string | null;
  intervalLabel?: string | null;
  startedAt?: string | null;
  validUntil?: string | null;
  currentPeriodEnd?: string | null;
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
    return new Intl.NumberFormat("en-GB", {
      style: "currency",
      currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  } catch {
    return `${amount.toFixed(2)} ${currency}`;
  }
}

function formatSubscriptionPrice(s: Subscription): string {
  const gross = s.grossPriceCents ?? s.priceCents;
  const base = formatPrice(gross, s.currency);
  if (s.interval === "yearly") return `${base} / year`;
  if (s.interval === "monthly") return `${base} / month`;
  return base;
}

function formatSubscriptionVat(s: Subscription): string {
  if (s.taxPriceCents == null || s.taxPriceCents <= 0) return "—";
  return formatPrice(s.taxPriceCents, s.currency);
}

function formatDate(value?: string | null) {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString("en-GB");
}

function formatInterval(s: Subscription): string {
  if (s.intervalLabel) return s.intervalLabel;
  if (s.interval === "yearly") return "Yearly";
  if (s.interval === "monthly") return "Monthly";
  return "—";
}

export default function SubscriptionsListPage() {
  const [items, setItems] = useState<Subscription[]>([]);
  const [total, setTotal] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [deleteBusyId, setDeleteBusyId] = useState<string | null>(null);
  const [showCancelled, setShowCancelled] = useState(false);

  const loadSubscriptions = useCallback(async () => {
    const data = await apiGet<SubscriptionsResponse>("/subscriptions");
    setItems(data.items ?? []);
    setTotal(data.total ?? data.items?.length ?? 0);
  }, []);

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
        await loadSubscriptions();
      } catch (err) {
        console.error("Error loading subscriptions", err);
        if (!cancelled) {
          setError("Failed to load subscriptions.");
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
  }, [loadSubscriptions]);

  async function handleDeletePendingSubscription(subscription: Subscription) {
    if (
      !window.confirm(
        "Delete this pending subscription? No active licence will be removed.",
      )
    ) {
      return;
    }

    setDeleteBusyId(subscription.id);
    setError(null);
    setSuccess(null);

    try {
      await apiDeletePendingSubscription(subscription.id);
      setSuccess("Pending subscription deleted.");
      await loadSubscriptions();
    } catch (err) {
      console.error("Error deleting pending subscription", err);
      setError(
        err instanceof Error
          ? err.message
          : "Could not delete pending subscription.",
      );
    } finally {
      setDeleteBusyId(null);
    }
  }

  const toolbarFooter = (
    <>
      <strong>{activeSubscriptions.length}</strong> active subscription
      {activeSubscriptions.length === 1 ? "" : "s"}
      {cancelledSubscriptions.length > 0 ? (
        <>
          {" · "}
          <strong>{cancelledSubscriptions.length}</strong> ended subscription
          {cancelledSubscriptions.length === 1 ? "" : "s"}
        </>
      ) : null}
      {" · "}
      {total} total
    </>
  );

  return (
    <div className="admin-page">
      <PageHeader
        title="Subscriptions"
        subtitle="Overview of all active and past subscriptions."
      />

      <Toolbar footer={toolbarFooter} />

      {error ? <div className="admin-error-banner">{error}</div> : null}
      {success ? <div className="admin-success-banner">{success}</div> : null}

      <div className="ds-section-block">
        <SectionHeader
          title="Active subscriptions"
          pill={String(activeSubscriptions.length)}
        />
        <DataTable>
          <thead>
            <tr>
              <th>ID</th>
              <th>Customer</th>
              <th>Plan</th>
              <th>Status</th>
              <th>Price (gross)</th>
              <th>VAT</th>
              <th>Interval</th>
              <th>Started</th>
              <th>Valid until</th>
              <th>Invoices</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={11} className="ds-muted" style={{ textAlign: "center", padding: 24 }}>
                  Loading subscriptions…
                </td>
              </tr>
            ) : activeSubscriptions.length === 0 ? (
              <tr>
                <td colSpan={11} className="ds-muted" style={{ textAlign: "center", padding: 24 }}>
                  No active subscriptions.
                </td>
              </tr>
            ) : (
              activeSubscriptions.map((s) => (
                <tr key={s.id}>
                  <td>{s.id.slice(0, 8)}…</td>
                  <td>
                    {s.customerId ? (
                      <Link to={`/customers/${s.customerId}`} className="ds-link">
                        {s.customerName ? s.customerName : `${s.customerId.slice(0, 8)}…`}
                      </Link>
                    ) : (
                      "—"
                    )}
                    {s.customerEmail ? (
                      <span className="ds-muted" style={{ marginLeft: 4, fontSize: 11 }}>
                        ({s.customerEmail})
                      </span>
                    ) : null}
                  </td>
                  <td>{s.plan || "—"}</td>
                  <td>
                    <SubscriptionStatusPill status={s.status} />
                  </td>
                  <td>{formatSubscriptionPrice(s)}</td>
                  <td>{formatSubscriptionVat(s)}</td>
                  <td>{formatInterval(s)}</td>
                  <td>{formatDate(s.startedAt)}</td>
                  <td>{formatDate(s.validUntil ?? s.currentPeriodEnd)}</td>
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
                            <Button
                              variant="link"
                              style={{ fontSize: 11, padding: 0, height: "auto" }}
                              onClick={async () => {
                                try {
                                  const html = await fetchAdminInvoiceHtml(inv.id);
                                  const win = window.open();
                                  if (win) {
                                    win.document.write(html);
                                    win.document.close();
                                  }
                                } catch (e) {
                                  alert(e instanceof Error ? e.message : "Failed to load invoice.");
                                }
                              }}
                            >
                              {inv.number}
                            </Button>
                            <Button
                              variant="link"
                              title="Print as PDF"
                              style={{ fontSize: 12, padding: 0, height: "auto", minWidth: 24 }}
                              onClick={async () => {
                                try {
                                  const html = await fetchAdminInvoiceHtml(inv.id);
                                  const win = window.open();
                                  if (win) {
                                    win.document.write(html);
                                    win.document.close();
                                    setTimeout(() => {
                                      win?.print();
                                    }, 500);
                                  }
                                } catch (e) {
                                  alert(e instanceof Error ? e.message : "Failed to load invoice.");
                                }
                              }}
                            >
                              PDF
                            </Button>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <span className="ds-muted">—</span>
                    )}
                  </td>
                  <td>
                    <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
                      {s.status?.toLowerCase() === "pending" ? (
                        <Button
                          variant="danger"
                          disabled={deleteBusyId === s.id}
                          onClick={() => void handleDeletePendingSubscription(s)}
                        >
                          {deleteBusyId === s.id ? "Deleting…" : "Delete"}
                        </Button>
                      ) : null}
                      {s.customerStatus === "inactive" && s.customerId ? (
                        <Button
                          variant="danger"
                          disabled={deleteBusyId === s.customerId}
                          onClick={async () => {
                            if (
                              !confirm(
                                `Delete customer "${s.customerName || s.customerId}"? This action cannot be undone.`,
                              )
                            ) {
                              return;
                            }
                            setDeleteBusyId(s.customerId);
                            try {
                              await apiDelete<{ ok: boolean }>(`/customers/${s.customerId}`);
                              const data = await apiGet<SubscriptionsResponse>("/subscriptions");
                              setItems(data.items ?? []);
                              setTotal(data.total ?? data.items?.length ?? 0);
                            } catch (err) {
                              console.error("Error deleting customer", err);
                              alert("Failed to delete customer.");
                            } finally {
                              setDeleteBusyId(null);
                            }
                          }}
                        >
                          {deleteBusyId === s.customerId ? "Deleting…" : "Delete customer"}
                        </Button>
                      ) : null}
                      {s.status?.toLowerCase() !== "pending" &&
                      s.customerStatus !== "inactive" ? (
                        <span className="ds-muted">—</span>
                      ) : null}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </DataTable>
      </div>

      {cancelledSubscriptions.length > 0 ? (
        <div className="ds-section-block">
          <button
            type="button"
            onClick={() => setShowCancelled(!showCancelled)}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              width: "100%",
              background: "none",
              border: "none",
              padding: 0,
              cursor: "pointer",
              textAlign: "left",
            }}
          >
            <SectionHeader
              title="Ended subscriptions"
              pill={String(cancelledSubscriptions.length)}
            />
            <span className="ds-muted" style={{ fontSize: 14, flexShrink: 0, marginLeft: 12 }}>
              {showCancelled ? "Hide ▲" : "Show ▼"}
            </span>
          </button>
          {showCancelled ? (
            <DataTable>
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Customer</th>
                  <th>Plan</th>
                  <th>Status</th>
                  <th>Price</th>
                  <th>Started</th>
                  <th>Invoices</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {cancelledSubscriptions.map((s) => (
                  <tr key={s.id}>
                    <td className="ds-muted" style={{ fontSize: 12 }}>
                      {s.id.slice(0, 8)}…
                    </td>
                    <td className="ds-muted">
                      {s.customerId ? (
                        <Link to={`/customers/${s.customerId}`} className="ds-link">
                          {s.customerName ? s.customerName : `${s.customerId.slice(0, 8)}…`}
                        </Link>
                      ) : (
                        "—"
                      )}
                      {s.customerEmail ? (
                        <span className="ds-muted" style={{ marginLeft: 4, fontSize: 11 }}>
                          ({s.customerEmail})
                        </span>
                      ) : null}
                    </td>
                    <td className="ds-muted">{s.plan || "—"}</td>
                    <td>
                      <SubscriptionStatusPill status={s.status} />
                    </td>
                    <td className="ds-muted">{formatSubscriptionPrice(s)}</td>
                    <td className="ds-muted" style={{ fontSize: 12 }}>
                      {formatDate(s.startedAt)}
                    </td>
                    <td>
                      {s.invoices && s.invoices.length > 0 ? (
                        <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                          {s.invoices.map((inv) => (
                            <Button
                              key={inv.id}
                              variant="link"
                              style={{ fontSize: 11, padding: 0, height: "auto", justifyContent: "flex-start" }}
                              onClick={async () => {
                                try {
                                  const html = await fetchAdminInvoiceHtml(inv.id);
                                  const win = window.open();
                                  if (win) {
                                    win.document.write(html);
                                    win.document.close();
                                  }
                                } catch (e) {
                                  alert(e instanceof Error ? e.message : "Failed to load invoice.");
                                }
                              }}
                            >
                              {inv.number}
                            </Button>
                          ))}
                        </div>
                      ) : (
                        <span className="ds-muted">—</span>
                      )}
                    </td>
                    <td>
                      <Button
                        variant="danger"
                        disabled={deleteBusyId === s.id}
                        title="Delete subscription"
                        onClick={async () => {
                          if (
                            !confirm(
                              `Delete subscription "${s.plan}" (status: ${s.status})? This action cannot be undone.`,
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
                              throw new Error(result.error || "Failed to delete subscription.");
                            }
                            const data = await apiGet<SubscriptionsResponse>("/subscriptions");
                            setItems(data.items ?? []);
                            setTotal(data.total ?? data.items?.length ?? 0);
                          } catch (err: unknown) {
                            console.error("Error deleting subscription", err);
                            alert(
                              err instanceof Error
                                ? err.message
                                : "Failed to delete subscription.",
                            );
                          } finally {
                            setDeleteBusyId(null);
                          }
                        }}
                      >
                        {deleteBusyId === s.id ? "Deleting…" : "Delete"}
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </DataTable>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
