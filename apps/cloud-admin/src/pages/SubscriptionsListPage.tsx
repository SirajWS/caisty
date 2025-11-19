// apps/cloud-admin/src/pages/Subscriptions/SubscriptionsListPage.tsx
import { useEffect, useState } from "react";
import { apiGet } from "../lib/api";

type Subscription = {
  id: string;
  plan: string;
  status: string;
  priceCents: number;
  currency: string;
  interval: string;
  startedAt: string;
  currentPeriodEnd: string;
};

type SubscriptionsResponse = {
  items: Subscription[];
  total: number;
  limit: number;
  offset: number;
};

export default function SubscriptionsListPage() {
  const [data, setData] = useState<SubscriptionsResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setLoading(true);
    apiGet<SubscriptionsResponse>("/subscriptions?limit=20&offset=0")
      .then((res) => {
        setData(res);
        setError(null);
      })
      .catch((err) => {
        console.error(err);
        setError(String(err));
      })
      .finally(() => setLoading(false));
  }, []);

  return (
    <div
      style={{
        padding: "24px 32px",
        maxWidth: "100%",
        width: "100%",
        boxSizing: "border-box",
      }}
    >
      <h1 style={{ fontSize: 28, marginBottom: 24, fontWeight: 600 }}>
        Subscriptions
      </h1>

      {loading && <p style={{ color: "#9ca3af" }}>Lade Subscriptions…</p>}
      {error && (
        <p
          style={{
            color: "#f97316",
            padding: 12,
            backgroundColor: "#1f2937",
            borderRadius: 8,
          }}
        >
          Fehler beim Laden der Subscriptions: {error}
        </p>
      )}

      {data && data.items.length === 0 && !loading && !error && (
        <p style={{ color: "#9ca3af" }}>Keine Subscriptions gefunden.</p>
      )}

      {data && data.items.length > 0 && (
        <div
          style={{
            overflowX: "auto",
            width: "100%",
            backgroundColor: "#0f172a",
            borderRadius: 8,
            border: "1px solid #1f2937",
          }}
        >
          <table
            style={{
              width: "100%",
              borderCollapse: "collapse",
              minWidth: "700px",
            }}
          >
            <thead>
              <tr style={{ backgroundColor: "#1e293b" }}>
                <th style={thStyle}>Plan</th>
                <th style={thStyle}>Status</th>
                <th style={thStyle}>Preis</th>
                <th style={thStyle}>Intervall</th>
                <th style={thStyle}>Gestartet</th>
                <th style={thStyle}>Läuft bis</th>
              </tr>
            </thead>
            <tbody>
              {data.items.map((s, index) => (
                <tr
                  key={s.id}
                  style={{
                    backgroundColor:
                      index % 2 === 0 ? "#0f172a" : "#1e293b",
                    transition: "background-color 0.2s",
                  }}
                  onMouseEnter={(e) =>
                    (e.currentTarget.style.backgroundColor = "#1f2937")
                  }
                  onMouseLeave={(e) =>
                    (e.currentTarget.style.backgroundColor =
                      index % 2 === 0 ? "#0f172a" : "#1e293b")
                  }
                >
                  <td style={tdStyle}>{s.plan}</td>
                  <td style={tdStyle}>
                    <span
                      style={{
                        padding: "4px 8px",
                        borderRadius: 4,
                        fontSize: 12,
                        fontWeight: 500,
                        backgroundColor:
                          s.status === "active" ? "#065f46" : "#7f1d1d",
                        color:
                          s.status === "active" ? "#6ee7b7" : "#fca5a5",
                      }}
                    >
                      {s.status}
                    </span>
                  </td>
                  <td style={tdStyle}>
                    {formatMoney(s.priceCents, s.currency)}
                  </td>
                  <td style={tdStyle}>{s.interval}</td>
                  <td style={tdStyle}>
                    {new Date(s.startedAt).toLocaleString("de-DE")}
                  </td>
                  <td style={tdStyle}>
                    {new Date(s.currentPeriodEnd).toLocaleString("de-DE")}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function formatMoney(cents: number, currency: string) {
  return new Intl.NumberFormat("de-DE", {
    style: "currency",
    currency,
  }).format(cents / 100);
}

const thStyle: React.CSSProperties = {
  textAlign: "left",
  borderBottom: "1px solid #334155",
  padding: "12px 16px",
  fontWeight: 600,
  fontSize: 14,
  color: "#e5e7eb",
};

const tdStyle: React.CSSProperties = {
  borderBottom: "1px solid #1e293b",
  padding: "12px 16px",
  fontSize: 14,
  color: "#d1d5db",
};
