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
    fetch("/api/health")
      .then(async (res) => {
        const data = (await res.json()) as HealthResponse;
        setHealth(data);
      })
      .catch((err) => {
        console.error("Health check failed", err);
        setError(String(err));
      });
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-50">Dashboard</h1>
        <p className="text-slate-400 mt-2">Willkommen im Caisty Admin Panel</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* API Health Card */}
        <div className="bg-slate-900 border border-slate-800 rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-slate-50">API Status</h2>
            {health?.ok && (
              <div className="w-3 h-3 bg-emerald-500 rounded-full animate-pulse"></div>
            )}
          </div>
          {health && health.ok && (
            <div className="space-y-2">
              <p className="text-emerald-400 text-sm font-medium">✅ Online</p>
              <p className="text-slate-400 text-xs">
                Antwort von <code className="text-slate-300">/api/health</code>
              </p>
            </div>
          )}
          {error && (
            <p className="text-red-400 text-sm">⚠️ Verbindungsfehler</p>
          )}
          {!health && !error && (
            <p className="text-slate-400 text-sm">Prüfe Status…</p>
          )}
        </div>

        {/* Placeholder Cards für weitere Stats */}
        <div className="bg-slate-900 border border-slate-800 rounded-lg p-6">
          <h2 className="text-lg font-semibold text-slate-50 mb-2">Kunden</h2>
          <p className="text-3xl font-bold text-emerald-400">-</p>
          <p className="text-slate-400 text-sm mt-1">Gesamt</p>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-lg p-6">
          <h2 className="text-lg font-semibold text-slate-50 mb-2">Aktive Subscriptions</h2>
          <p className="text-3xl font-bold text-emerald-400">-</p>
          <p className="text-slate-400 text-sm mt-1">Aktiv</p>
        </div>
      </div>
    </div>
  );
}