// apps/cloud-admin/src/pages/DashboardPage.tsx
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { apiGet, type ListResponse } from "../lib/api";
import { useTheme, themeColors } from "../theme/ThemeContext";

type HealthResponse = {
  ok: boolean;
  ts?: string;
};

// Mini-Typen – wir brauchen nur wenig Infos fürs Zählen
type Customer = { id: string; status?: string | null };
type Subscription = { id: string; status?: string };
type Invoice = { id: string; status?: string; amountCents?: number; currency?: string };
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
  revenueTotal: number; // Summe aller bezahlten Rechnungen in Cents
  revenueCurrency: string;
  devicesTotal: number; // nach Hardware-ID
  notificationsUnread: number;
};

export default function DashboardPage() {
  const { theme } = useTheme();
  const colors = themeColors[theme];
  const [health, setHealth] = useState<HealthResponse | null>(null);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loadingStats, setLoadingStats] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);

  async function load() {
    try {
      setError(null);
      setLoadingStats(true);

      const [
        healthRes,
        customersRes,
        subscriptionsRes,
        invoicesRes,
        devicesRes,
        notificationsRes,
      ] = await Promise.all([
        apiGet<HealthResponse>("/health"),
        apiGet<ListResponse<Customer>>("/customers?limit=1000&offset=0"),
        apiGet<ListResponse<Subscription>>(
          "/subscriptions?limit=1000&offset=0",
        ),
        apiGet<ListResponse<Invoice>>("/invoices?limit=1000&offset=0"),
        apiGet<ListResponse<Device>>("/devices?limit=1000&offset=0"),
        apiGet<ListResponse<Notification>>("/admin/notifications?limit=1000&offset=0"),
      ]);

        setHealth(healthRes);

        const customerItems = customersRes.items ?? [];
        const customersTotal =
          typeof customersRes.total === "number"
            ? customersRes.total
            : customerItems.length;

        const customersActive = customerItems.filter((c) => {
          const status = (c.status ?? "").toLowerCase();
          return status === "active";
        }).length;

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

        // Rechnungen nach Status filtern
        const invoicesPaid = invoiceItems.filter(
          (inv) => (inv.status ?? "").toLowerCase() === "paid"
        ).length;
        const invoicesOpen = invoiceItems.filter(
          (inv) => (inv.status ?? "").toLowerCase() === "open"
        ).length;
        const invoicesCancelled = invoiceItems.filter((inv) =>
          ["cancelled", "canceled"].includes((inv.status ?? "").toLowerCase())
        ).length;

        // Umsatz berechnen (Summe aller bezahlten Rechnungen)
        const paidInvoices = invoiceItems.filter(
          (inv) => (inv.status ?? "").toLowerCase() === "paid"
        );
        const revenueTotal = paidInvoices.reduce(
          (sum, inv) => sum + (inv.amountCents ?? 0),
          0
        );
        const revenueCurrency = paidInvoices[0]?.currency ?? "EUR";

        // Devices nach Hardware-ID (Fingerprint / id) zählen
        const deviceItems = devicesRes.items ?? [];
        const hardwareIds = new Set<string>();
        for (const dev of deviceItems) {
          const key = dev.fingerprint || dev.id;
          hardwareIds.add(key);
        }
        const devicesTotal = hardwareIds.size;

        // Ungelesene Notifications
        const notificationItems = notificationsRes.items ?? [];
        const notificationsUnread = notificationItems.filter(
          (n) => !n.isRead
        ).length;

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
          devicesTotal,
          notificationsUnread,
        });
      setLastRefresh(new Date());
    } catch (err) {
      console.error(err);
      setError("Health- oder Statistik-Request fehlgeschlagen.");
    } finally {
      setLoadingStats(false);
    }
  }

  useEffect(() => {
    let cancelled = false;

    void load();

    // Auto-Refresh alle 30 Sekunden
    const interval = setInterval(() => {
      if (!cancelled) {
        void load();
      }
    }, 30000);

    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, []);

  const hasHealthOk = !!health?.ok;

  return (
    <div className="admin-page">
      <h1
        style={{
          fontSize: "32px",
          fontWeight: 700,
          marginBottom: "8px",
          color: colors.text,
          letterSpacing: "-0.5px",
        }}
      >
        Dashboard
      </h1>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "24px",
        }}
      >
        <p
          style={{
            fontSize: "14px",
            color: colors.textSecondary,
            margin: 0,
          }}
        >
          Überblick über den Status deiner Caisty Cloud Umgebung.
          {lastRefresh && (
            <span style={{ marginLeft: 8, fontSize: 12, opacity: 0.7 }}>
              · Zuletzt aktualisiert: {lastRefresh.toLocaleTimeString("de-DE")}
            </span>
          )}
        </p>
        <button
          onClick={() => {
            setLoadingStats(true);
            void load();
          }}
          disabled={loadingStats}
          style={{
            padding: "6px 12px",
            fontSize: 13,
            borderRadius: 6,
            border: `1px solid ${colors.border}`,
            background: colors.bgSecondary,
            color: colors.text,
            cursor: loadingStats ? "wait" : "pointer",
            transition: "all 0.2s",
            opacity: loadingStats ? 0.6 : 1,
          }}
          onMouseEnter={(e) => {
            if (!loadingStats) {
              e.currentTarget.style.background = colors.bgTertiary;
              e.currentTarget.style.borderColor = colors.accent;
            }
          }}
          onMouseLeave={(e) => {
            if (!loadingStats) {
              e.currentTarget.style.background = colors.bgSecondary;
              e.currentTarget.style.borderColor = colors.border;
            }
          }}
        >
          {loadingStats ? "⏳ Aktualisiere..." : "🔄 Aktualisieren"}
        </button>
      </div>

      <div className="dashboard-grid">
        {/* API Status */}
        <div
          className="dashboard-card"
          style={{
            backgroundColor: colors.bgSecondary,
            borderColor: colors.border,
            transition: "background-color 0.3s, border-color 0.3s",
          }}
        >
          <div
            className="dashboard-card-title"
            style={{ color: colors.textSecondary }}
          >
            API Status
          </div>
          {hasHealthOk && (
            <>
              <div className="dashboard-status-line">
                <span className="status-dot status-dot--green" />
                <span>Online</span>
              </div>
              <div className="dashboard-card-meta">
                Antwort von <code>/api/health</code>
                {health?.ts && (
                  <>
                    {" – "}
                    {new Date(health.ts).toLocaleString("de-DE")}
                  </>
                )}
              </div>
            </>
          )}
          {!hasHealthOk && !error && (
            <div className="dashboard-card-meta">Prüfe Status…</div>
          )}
          {error && <div className="admin-error">{error}</div>}
        </div>

        {/* Kunden – nur aktive anzeigen */}
        <Link
          to="/customers"
          style={{ textDecoration: "none", color: "inherit" }}
        >
          <div
            className="dashboard-card"
            style={{
              backgroundColor: colors.bgSecondary,
              borderColor: colors.border,
              transition: "background-color 0.3s, border-color 0.3s, transform 0.2s",
              cursor: "pointer",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = colors.accent;
              e.currentTarget.style.transform = "translateY(-2px)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = colors.border;
              e.currentTarget.style.transform = "translateY(0)";
            }}
          >
          <div
            className="dashboard-card-title"
            style={{ color: colors.textSecondary }}
          >
            Kunden
          </div>
          <div
            className="dashboard-card-value"
            style={{ color: colors.accent }}
          >
            {loadingStats && !stats ? "…" : stats?.customersActive ?? "–"}
          </div>
          <div
            className="dashboard-card-meta"
            style={{ color: colors.textTertiary }}
          >
            {stats
              ? `${stats.customersActive} aktive Kunden (gesamt: ${stats.customersTotal}).`
              : "Anzahl aktiver Kunden in dieser Instanz."}
          </div>
        </div>
        </Link>

        {/* Subscriptions */}
        <Link
          to="/subscriptions"
          style={{ textDecoration: "none", color: "inherit" }}
        >
          <div
            className="dashboard-card"
            style={{
              backgroundColor: colors.bgSecondary,
              borderColor: colors.border,
              transition: "background-color 0.3s, border-color 0.3s, transform 0.2s",
              cursor: "pointer",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = colors.accent;
              e.currentTarget.style.transform = "translateY(-2px)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = colors.border;
              e.currentTarget.style.transform = "translateY(0)";
            }}
          >
          <div
            className="dashboard-card-title"
            style={{ color: colors.textSecondary }}
          >
            Subscriptions
          </div>
          <div
            className="dashboard-card-value"
            style={{ color: colors.accent }}
          >
            {loadingStats && !stats ? "…" : stats?.subscriptionsActive ?? "–"}
          </div>
          <div
            className="dashboard-card-meta"
            style={{ color: colors.textTertiary }}
          >
            {stats
              ? `${stats.subscriptionsActive} aktiv von ${stats.subscriptionsTotal} gesamt.`
              : "Aktive und gesamte Subscriptions."}
          </div>
        </div>
        </Link>

        {/* Rechnungen Status */}
        <Link
          to="/invoices"
          style={{ textDecoration: "none", color: "inherit" }}
        >
          <div
            className="dashboard-card"
            style={{
              backgroundColor: colors.bgSecondary,
              borderColor: colors.border,
              transition: "background-color 0.3s, border-color 0.3s, transform 0.2s",
              cursor: "pointer",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = colors.accent;
              e.currentTarget.style.transform = "translateY(-2px)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = colors.border;
              e.currentTarget.style.transform = "translateY(0)";
            }}
          >
          <div
            className="dashboard-card-title"
            style={{ color: colors.textSecondary }}
          >
            Rechnungen
          </div>
          <div
            className="dashboard-card-value"
            style={{ color: colors.accent }}
          >
            {loadingStats && !stats ? "…" : stats?.invoicesPaid ?? "–"}
          </div>
          <div
            className="dashboard-card-meta"
            style={{ color: colors.textTertiary }}
          >
            {stats
              ? `${stats.invoicesPaid} bezahlt · ${stats.invoicesOpen} offen · ${stats.invoicesCancelled} beendet (${stats.invoicesTotal} gesamt)`
              : "Status der Rechnungen."}
          </div>
        </div>
        </Link>

        {/* Umsatz */}
        <div
          className="dashboard-card"
          style={{
            backgroundColor: colors.bgSecondary,
            borderColor: colors.border,
            transition: "background-color 0.3s, border-color 0.3s",
          }}
        >
          <div
            className="dashboard-card-title"
            style={{ color: colors.textSecondary }}
          >
            Umsatz
          </div>
          <div
            className="dashboard-card-value"
            style={{ color: colors.accent }}
          >
            {loadingStats && !stats
              ? "…"
              : stats?.revenueTotal
                ? new Intl.NumberFormat("de-DE", {
                    style: "currency",
                    currency: stats.revenueCurrency,
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  }).format(stats.revenueTotal / 100)
                : "–"}
          </div>
          <div
            className="dashboard-card-meta"
            style={{ color: colors.textTertiary }}
          >
            {stats
              ? `Gesamtumsatz aus ${stats.invoicesPaid} bezahlten Rechnungen.`
              : "Summe aller bezahlten Rechnungen."}
          </div>
        </div>

        {/* Devices */}
        <Link
          to="/devices"
          style={{ textDecoration: "none", color: "inherit" }}
        >
          <div
            className="dashboard-card"
            style={{
              backgroundColor: colors.bgSecondary,
              borderColor: colors.border,
              transition: "background-color 0.3s, border-color 0.3s, transform 0.2s",
              cursor: "pointer",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = colors.accent;
              e.currentTarget.style.transform = "translateY(-2px)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = colors.border;
              e.currentTarget.style.transform = "translateY(0)";
            }}
          >
          <div
            className="dashboard-card-title"
            style={{ color: colors.textSecondary }}
          >
            Devices
          </div>
          <div
            className="dashboard-card-value"
            style={{ color: colors.accent }}
          >
            {loadingStats && !stats ? "…" : stats?.devicesTotal ?? "–"}
          </div>
          <div
            className="dashboard-card-meta"
            style={{ color: colors.textTertiary }}
          >
            {stats
              ? `${stats.devicesTotal} eindeutige Geräte (nach Hardware-ID).`
              : "Anzahl Geräte (Fingerprint / Device-ID)."}
          </div>
        </div>
        </Link>

        {/* Notifications */}
        <Link
          to="/notifications"
          style={{ textDecoration: "none", color: "inherit" }}
        >
          <div
            className="dashboard-card"
            style={{
              backgroundColor: colors.bgSecondary,
              borderColor: colors.border,
              transition: "background-color 0.3s, border-color 0.3s, transform 0.2s",
              cursor: "pointer",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = colors.accent;
              e.currentTarget.style.transform = "translateY(-2px)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = colors.border;
              e.currentTarget.style.transform = "translateY(0)";
            }}
          >
          <div
            className="dashboard-card-title"
            style={{ color: colors.textSecondary }}
          >
            Benachrichtigungen
          </div>
          <div
            className="dashboard-card-value"
            style={{
              color:
                stats && stats.notificationsUnread > 0
                  ? colors.error
                  : colors.accent,
            }}
          >
            {loadingStats && !stats ? "…" : stats?.notificationsUnread ?? "–"}
          </div>
          <div
            className="dashboard-card-meta"
            style={{ color: colors.textTertiary }}
          >
            {stats
              ? stats.notificationsUnread > 0
                ? `${stats.notificationsUnread} ungelesene Benachrichtigungen.`
                : "Alle Benachrichtigungen gelesen."
              : "Ungelesene Benachrichtigungen."}
          </div>
        </div>
        </Link>
      </div>
    </div>
  );
}
