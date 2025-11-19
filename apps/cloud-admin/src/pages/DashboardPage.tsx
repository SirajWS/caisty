import { useEffect, useState } from "react";
import { apiGet } from "../lib/api";

type HealthResponse = {
  ok: boolean;
  ts?: string;
};

export default function DashboardPage() {
  const [health, setHealth] = useState<HealthResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    apiGet<HealthResponse>("/health")
      .then((res) => {
        setHealth(res);
        setError(null);
      })
      .catch((err) => {
        console.error(err);
        setError("Health-Check fehlgeschlagen.");
      });
  }, []);

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
          {health?.ok && (
            <>
              <div className="dashboard-status-line">
                <span className="status-dot status-dot--green" />
                <span>Online</span>
              </div>
              <div className="dashboard-card-meta">
                Antwort von <code>/api/health</code>
                {health.ts && (
                  <>
                    {" – "}
                    {new Date(health.ts).toLocaleString("de-DE")}
                  </>
                )}
              </div>
            </>
          )}
          {!health && !error && (
            <div className="dashboard-card-meta">Prüfe Status…</div>
          )}
          {error && <div className="admin-error">{error}</div>}
        </div>

        {/* Platzhalter - später echte KPIs */}
        <div className="dashboard-card">
          <div className="dashboard-card-title">Kunden</div>
          <div className="dashboard-card-value">–</div>
          <div className="dashboard-card-meta">
            Gesamt (Detail-Auswertung kommt mit späteren Milestones)
          </div>
        </div>

        <div className="dashboard-card">
          <div className="dashboard-card-title">Aktive Subscriptions</div>
          <div className="dashboard-card-value">–</div>
          <div className="dashboard-card-meta">
            Aktive Lizenzen (kommt mit Payments/Licensing)
          </div>
        </div>
      </div>
    </div>
  );
}
