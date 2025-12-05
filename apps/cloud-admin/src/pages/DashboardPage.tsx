// apps/cloud-admin/src/pages/DashboardPage.tsx
import { useEffect, useState } from "react";
import { apiGet, type ListResponse } from "../lib/api";
import { useTheme, themeColors } from "../theme/ThemeContext";

type HealthResponse = {
  ok: boolean;
  ts?: string;
};

// Mini-Typen – wir brauchen nur wenig Infos fürs Zählen
type Customer = { id: string; status?: string | null };
type Subscription = { id: string; status?: string };
type Invoice = { id: string };
type Device = { id: string; fingerprint?: string | null };

type DashboardStats = {
  customersTotal: number;
  customersActive: number;
  subscriptionsTotal: number;
  subscriptionsActive: number;
  invoicesTotal: number;
  devicesTotal: number; // nach Hardware-ID
};

export default function DashboardPage() {
  const { theme } = useTheme();
  const colors = themeColors[theme];
  const [health, setHealth] = useState<HealthResponse | null>(null);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loadingStats, setLoadingStats] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

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
        ] = await Promise.all([
          apiGet<HealthResponse>("/health"),
          apiGet<ListResponse<Customer>>("/customers?limit=1000&offset=0"),
          apiGet<ListResponse<Subscription>>(
            "/subscriptions?limit=1000&offset=0",
          ),
          apiGet<ListResponse<Invoice>>("/invoices?limit=1000&offset=0"),
          apiGet<ListResponse<Device>>("/devices?limit=1000&offset=0"),
        ]);

        if (cancelled) return;

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

        const invoicesTotal =
          typeof invoicesRes.total === "number"
            ? invoicesRes.total
            : (invoicesRes.items ?? []).length;

        // Devices nach Hardware-ID (Fingerprint / id) zählen
        const deviceItems = devicesRes.items ?? [];
        const hardwareIds = new Set<string>();
        for (const dev of deviceItems) {
          const key = dev.fingerprint || dev.id;
          hardwareIds.add(key);
        }
        const devicesTotal = hardwareIds.size;

        setStats({
          customersTotal,
          customersActive,
          subscriptionsTotal,
          subscriptionsActive,
          invoicesTotal,
          devicesTotal,
        });
      } catch (err) {
        console.error(err);
        if (!cancelled) {
          setError("Health- oder Statistik-Request fehlgeschlagen.");
        }
      } finally {
        if (!cancelled) {
          setLoadingStats(false);
        }
      }
    }

    void load();

    return () => {
      cancelled = true;
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
      <p
        style={{
          fontSize: "14px",
          color: colors.textSecondary,
          marginBottom: "24px",
        }}
      >
        Überblick über den Status deiner Caisty Cloud Umgebung.
      </p>

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

        {/* Subscriptions */}
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

        {/* Rechnungen & Devices (nach Hardware-ID) */}
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
            Rechnungen &amp; Devices
          </div>
          <div
            className="dashboard-card-value"
            style={{ color: colors.accent }}
          >
            {loadingStats && !stats ? "…" : stats?.invoicesTotal ?? "–"}
          </div>
          <div
            className="dashboard-card-meta"
            style={{ color: colors.textTertiary }}
          >
            {stats
              ? `Rechnungen gesamt: ${stats.invoicesTotal} · Devices (nach Hardware-ID): ${stats.devicesTotal}.`
              : "Rechnungen und Anzahl Geräte (Fingerprint / Device-ID)."}
          </div>
        </div>
      </div>
    </div>
  );
}
