import { useEffect, useState } from "react";

type HealthResponse = {
  ok: boolean;
  ts?: string;
};

export default function DashboardPage() {
  const [health, setHealth] = useState<HealthResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Dank Vite-Proxy geht /api/health --> http://127.0.0.1:3333/health
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
    <div style={{ padding: 24 }}>
      <h1 style={{ fontSize: 24, marginBottom: 12 }}>Caisty Admin Dashboard</h1>
      <p style={{ fontSize: 14, marginBottom: 16 }}>
        M1-Status: Cloud-API &amp; Admin-Web laufen im Monorepo.
      </p>

      <div
        style={{
          padding: 16,
          borderRadius: 8,
          border: "1px solid #1f2937",
          maxWidth: 420,
        }}
      >
        <h2 style={{ fontSize: 18, marginBottom: 8 }}>API Health</h2>
        {health && health.ok && (
          <p style={{ color: "#22c55e", fontSize: 14 }}>
            ✅ API OK – Antwort von <code>/api/health</code>{" "}
            {health.ts ? `(ts: ${health.ts})` : null}
          </p>
        )}
        {error && (
          <p style={{ color: "#f97316", fontSize: 14 }}>
            ⚠️ Health-Check fehlgeschlagen: {error}
          </p>
        )}
        {!health && !error && (
          <p style={{ fontSize: 14 }}>Prüfe API-Status…</p>
        )}
      </div>
    </div>
  );
}
