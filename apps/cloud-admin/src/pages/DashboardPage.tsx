// apps/cloud-admin/src/pages/DashboardPage.tsx
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { apiGet, type ListResponse } from "../lib/api";
import { Button, KpiCard, PageHeader, StatusPill } from "../components/ui";

type HealthResponse = {
  ok: boolean;
  ts?: string;
};

type Customer = { id: string; status?: string | null };
type Subscription = { id: string; status?: string };
type Invoice = {
  id: string;
  status?: string;
  amountCents?: number;
  currency?: string;
};
type Device = { id: string; fingerprint?: string | null };
type Notification = { id: string; isRead?: boolean };

type DashboardStats = {
  customersTotal: number;
  customersActive: number;
  subscriptionsTotal: number;
  subscriptionsActive: number;
  invoicesTotal: number;
  invoicesPaid: number;
  invoicesOpen: number;
  invoicesCancelled: number;
  revenueTotal: number;
  revenueCurrency: string;
  devicesTotal: number;
  notificationsUnread: number;
};

export default function DashboardPage() {
  const [health, setHealth] = useState<HealthResponse | null>(null);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loadingStats, setLoadingStats] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);

  async function load() {
    try {
      setError(null);
      setLoadingStats(true);

      try {
        const healthRes = await apiGet<HealthResponse>("/health");
        setHealth(healthRes);
      } catch (healthErr) {
        console.error(healthErr);
        setHealth(null);
        setStats(null);
        setError(
          healthErr instanceof Error
            ? healthErr.message
            : "API unreachable (health check). Is cloud-api running on port 3333?",
        );
        return;
      }

      const [
        customersRes,
        subscriptionsRes,
        invoicesRes,
        devicesRes,
        notificationsRes,
      ] = await Promise.all([
        apiGet<ListResponse<Customer>>("/customers?limit=1000&offset=0"),
        apiGet<ListResponse<Subscription>>("/subscriptions?limit=1000&offset=0"),
        apiGet<ListResponse<Invoice>>("/invoices?limit=1000&offset=0"),
        apiGet<ListResponse<Device>>("/devices?limit=1000&offset=0"),
        apiGet<ListResponse<Notification>>("/admin/notifications?limit=1000&offset=0"),
      ]);

      const customerItems = customersRes.items ?? [];
      const customersTotal =
        typeof customersRes.total === "number"
          ? customersRes.total
          : customerItems.length;
      const customersActive = customerItems.filter(
        (c) => (c.status ?? "").toLowerCase() === "active",
      ).length;

      const subscriptionsItems = subscriptionsRes.items ?? [];
      const subscriptionsTotal =
        typeof subscriptionsRes.total === "number"
          ? subscriptionsRes.total
          : subscriptionsItems.length;
      const subscriptionsActive = subscriptionsItems.filter(
        (s) => (s.status ?? "").toLowerCase() === "active",
      ).length;

      const invoiceItems = invoicesRes.items ?? [];
      const invoicesTotal =
        typeof invoicesRes.total === "number"
          ? invoicesRes.total
          : invoiceItems.length;
      const invoicesPaid = invoiceItems.filter(
        (inv) => (inv.status ?? "").toLowerCase() === "paid",
      ).length;
      const invoicesOpen = invoiceItems.filter(
        (inv) => (inv.status ?? "").toLowerCase() === "open",
      ).length;
      const invoicesCancelled = invoiceItems.filter((inv) =>
        ["cancelled", "canceled"].includes((inv.status ?? "").toLowerCase()),
      ).length;

      const paidInvoices = invoiceItems.filter(
        (inv) => (inv.status ?? "").toLowerCase() === "paid",
      );
      const revenueTotal = paidInvoices.reduce(
        (sum, inv) => sum + (inv.amountCents ?? 0),
        0,
      );
      const revenueCurrency = paidInvoices[0]?.currency ?? "EUR";

      const deviceItems = devicesRes.items ?? [];
      const hardwareIds = new Set<string>();
      for (const dev of deviceItems) {
        hardwareIds.add(dev.fingerprint || dev.id);
      }

      const notificationItems = notificationsRes.items ?? [];
      const notificationsUnread = notificationItems.filter((n) => !n.isRead).length;

      setStats({
        customersTotal,
        customersActive,
        subscriptionsTotal,
        subscriptionsActive,
        invoicesTotal,
        invoicesPaid,
        invoicesOpen,
        invoicesCancelled,
        revenueTotal,
        revenueCurrency,
        devicesTotal: hardwareIds.size,
        notificationsUnread,
      });
      setLastRefresh(new Date());
    } catch (err) {
      console.error(err);
      setStats(null);
      setError(
        err instanceof Error ? err.message : "Could not load dashboard statistics.",
      );
    } finally {
      setLoadingStats(false);
    }
  }

  useEffect(() => {
    let cancelled = false;
    void load();
    const interval = setInterval(() => {
      if (!cancelled) void load();
    }, 30000);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, []);

  const hasHealthOk = !!health?.ok;

  return (
    <div className="admin-page">
      <PageHeader
        title="Dashboard"
        subtitle={
          <>
            Overview of your Caisty Cloud environment.
            {lastRefresh ? (
              <span className="ds-muted" style={{ marginLeft: 8 }}>
                · Last updated: {lastRefresh.toLocaleTimeString("en-GB")}
              </span>
            ) : null}
          </>
        }
        actions={
          <Button
            variant="secondary"
            disabled={loadingStats}
            onClick={() => {
              setLoadingStats(true);
              void load();
            }}
          >
            {loadingStats ? "Refreshing…" : "Refresh"}
          </Button>
        }
      />

      <div className="dashboard-grid">
        <div className="dashboard-card">
          <div className="dashboard-card-title">API status</div>
          {hasHealthOk ? (
            <>
              <StatusPill tone="green" label="Online" />
              <div className="dashboard-card-meta">
                Response from <code>/api/health</code>
                {health?.ts ? ` — ${new Date(health.ts).toLocaleString("en-GB")}` : ""}
              </div>
            </>
          ) : !error ? (
            <div className="dashboard-card-meta">Checking status…</div>
          ) : null}
          {error ? <div className="admin-error">{error}</div> : null}
        </div>

        <Link to="/customers" className="dashboard-card dashboard-card--link">
          <div className="dashboard-card-title">Customers</div>
          <div className="dashboard-card-value">
            {loadingStats && !stats ? "…" : (stats?.customersActive ?? "–")}
          </div>
          <div className="dashboard-card-meta">
            {stats
              ? `${stats.customersActive} active (${stats.customersTotal} total).`
              : "Active customers in this instance."}
          </div>
        </Link>

        <Link to="/subscriptions" className="dashboard-card dashboard-card--link">
          <div className="dashboard-card-title">Subscriptions</div>
          <div className="dashboard-card-value">
            {loadingStats && !stats ? "…" : (stats?.subscriptionsActive ?? "–")}
          </div>
          <div className="dashboard-card-meta">
            {stats
              ? `${stats.subscriptionsActive} active of ${stats.subscriptionsTotal} total.`
              : "Active and total subscriptions."}
          </div>
        </Link>

        <Link to="/invoices" className="dashboard-card dashboard-card--link">
          <div className="dashboard-card-title">Invoices</div>
          <div className="dashboard-card-value">
            {loadingStats && !stats ? "…" : (stats?.invoicesPaid ?? "–")}
          </div>
          <div className="dashboard-card-meta">
            {stats
              ? `${stats.invoicesPaid} paid · ${stats.invoicesOpen} open · ${stats.invoicesCancelled} closed (${stats.invoicesTotal} total)`
              : "Invoice status overview."}
          </div>
        </Link>

        <KpiCard
          label="Revenue"
          value={
            loadingStats && !stats
              ? "…"
              : stats?.revenueTotal
                ? new Intl.NumberFormat("en-GB", {
                    style: "currency",
                    currency: stats.revenueCurrency,
                  }).format(stats.revenueTotal / 100)
                : "–"
          }
          hint={
            stats
              ? `Total from ${stats.invoicesPaid} paid invoices.`
              : "Sum of all paid invoices."
          }
        />

        <Link to="/devices" className="dashboard-card dashboard-card--link">
          <div className="dashboard-card-title">Devices</div>
          <div className="dashboard-card-value">
            {loadingStats && !stats ? "…" : (stats?.devicesTotal ?? "–")}
          </div>
          <div className="dashboard-card-meta">
            {stats
              ? `${stats.devicesTotal} unique devices (by hardware ID).`
              : "Device count by fingerprint / device ID."}
          </div>
        </Link>

        <Link to="/notifications" className="dashboard-card dashboard-card--link">
          <div className="dashboard-card-title">Notifications</div>
          <div className="dashboard-card-value">
            {loadingStats && !stats ? "…" : (stats?.notificationsUnread ?? "–")}
          </div>
          <div className="dashboard-card-meta">
            {stats
              ? stats.notificationsUnread > 0
                ? `${stats.notificationsUnread} unread notifications.`
                : "All notifications read."
              : "Unread notifications."}
          </div>
        </Link>
      </div>
    </div>
  );
}
