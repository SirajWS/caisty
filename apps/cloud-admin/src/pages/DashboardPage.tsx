import { useEffect, useState } from "react";
import { apiGet, type ListResponse } from "../lib/api";

type HealthResponse = {
  ok: boolean;
  ts?: string;
};

// Mini-Typen – wir brauchen nur wenig Infos fürs Zählen
type Customer = { id: string };
type Subscription = { id: string; status?: string };
type Invoice = { id: string };
type Device = { id: string };

type DashboardStats = {
  customersTotal: number;
  subscriptionsTotal: number;
  subscriptionsActive: number;
  invoicesTotal: number;
  devicesTotal: number;
};

export default function DashboardPage() {
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

        const subscriptionsActive = subscriptionsRes.items.filter(
          (s) => s.status === "active",
        ).length;

        setStats({
          customersTotal: customersRes.total ?? customersRes.items.length,
          subscriptionsTotal:
            subscriptionsRes.total ?? subscriptionsRes.items.length,
          subscriptionsActive,
          invoicesTotal: invoicesRes.total ?? invoicesRes.items.length,
          devicesTotal: devicesRes.total ?? devicesRes.items.length,
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

    load();

    return () => {
      cancelled = true;
    };
  }, []);

  const hasHealthOk = !!health?.ok;

  return (
    <div className="admin-page">
      <h1 className="admin-page-title">Dashboard</h1>
      <p className="admin-page-subtitle">
        Überblick über den Status deiner Caisty Cloud Umgebung.
      </p>

      <div className="dashboard-grid">
        {/* API Status */}
        <div className="dashboard-card">
          <div className="dashboard-card-title">API Status</div>
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

        {/* Kunden */}
        <div className="dashboard-card">
          <div className="dashboard-card-title">Kunden</div>
          <div className="dashboard-card-value">
            {loadingStats && !stats ? "…" : stats?.customersTotal ?? "–"}
          </div>
          <div className="dashboard-card-meta">
            Gesamtzahl der Kunden in dieser Instanz.
          </div>
        </div>

        {/* Subscriptions */}
        <div className="dashboard-card">
          <div className="dashboard-card-title">Subscriptions</div>
          <div className="dashboard-card-value">
            {loadingStats && !stats ? "…" : stats?.subscriptionsActive ?? "–"}
          </div>
          <div className="dashboard-card-meta">
            {stats
              ? `${stats.subscriptionsActive} aktiv von ${stats.subscriptionsTotal} gesamt.`
              : "Aktive und gesamte Subscriptions."}
          </div>
        </div>

        {/* Rechnungen & Devices */}
        <div className="dashboard-card">
          <div className="dashboard-card-title">Rechnungen & Devices</div>
          <div className="dashboard-card-value">
            {loadingStats && !stats ? "…" : stats?.invoicesTotal ?? "–"}
          </div>
          <div className="dashboard-card-meta">
            Rechnungen gesamt
            {stats ? ` · ${stats.devicesTotal} Devices` : ""}.
          </div>
        </div>
      </div>
    </div>
  );
}
