// apps/cloud-admin/src/pages/Webhooks/WebhooksListPage.tsx
import { useEffect, useState } from "react";
import { apiGet } from "../../lib/api";
import { useTheme, themeColors } from "../../theme/ThemeContext";

type Webhook = {
  id: string;
  provider: string;
  eventType: string;
  status: string;
  errorMessage: string | null;
  createdAt: string;
};

type WebhooksResponse = {
  items: Webhook[];
  total: number;
};

export default function WebhooksListPage() {
  const { theme } = useTheme();
  const colors = themeColors[theme];
  const [data, setData] = useState<WebhooksResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        setLoading(true);
        setError(null);
        const res = await apiGet<WebhooksResponse>("/webhooks");
        if (cancelled) return;
        setData(res);
      } catch (err) {
        console.error(err);
        if (!cancelled) {
          setError("Fehler beim Laden der Webhooks.");
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
  }, []);

  const items = data?.items ?? [];

  const shortId = (id: string) => (id ? `${id.slice(0, 8)}…` : "–");

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
        Webhooks
      </h1>
      <p
        style={{
          fontSize: "14px",
          color: colors.textSecondary,
          marginBottom: "24px",
        }}
      >
        Eingehende Webhook-Events (z.B. von PayPal Sandbox).
      </p>

      {error && (
        <div
          className="admin-error"
          style={{
            backgroundColor: colors.errorBg,
            borderColor: `${colors.error}50`,
            color: colors.error,
          }}
        >
          {error}
        </div>
      )}
      {loading && !items.length && !error && (
        <p style={{ color: colors.textSecondary }}>lade Daten…</p>
      )}

      <div
        className="admin-table-wrapper"
        style={{
          backgroundColor: colors.bgSecondary,
          borderColor: colors.border,
          transition: "background-color 0.3s, border-color 0.3s",
        }}
      >
        <table className="admin-table">
          <thead>
            <tr style={{ backgroundColor: colors.bgTertiary }}>
              <th style={{ color: colors.textSecondary }}>ID</th>
              <th style={{ color: colors.textSecondary }}>Provider</th>
              <th style={{ color: colors.textSecondary }}>Event</th>
              <th style={{ color: colors.textSecondary }}>Status</th>
              <th style={{ color: colors.textSecondary }}>Fehler</th>
              <th style={{ color: colors.textSecondary }}>Erstellt</th>
            </tr>
          </thead>
          <tbody>
            {!items.length && !loading && !error && (
              <tr>
                <td colSpan={6} style={{ color: colors.textSecondary }}>
                  Keine Webhooks gefunden.
                </td>
              </tr>
            )}
            {items.map((w) => (
              <tr
                key={w.id}
                style={{
                  borderBottomColor: colors.border,
                  transition: "background-color 0.2s",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = colors.bgTertiary;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = "transparent";
                }}
              >
                <td style={{ color: colors.text }}>{shortId(w.id)}</td>
                <td style={{ color: colors.text }}>{w.provider}</td>
                <td style={{ color: colors.text }}>{w.eventType}</td>
                <td>
                  <span
                    className={
                      w.status === "processed"
                        ? "badge badge--green"
                        : w.status === "failed"
                        ? "badge badge--red"
                        : "badge badge--amber"
                    }
                  >
                    {w.status}
                  </span>
                </td>
                <td style={{ maxWidth: 260, color: colors.text }}>
                  {w.errorMessage ? (
                    <span title={w.errorMessage}>
                      {w.errorMessage.length > 40
                        ? `${w.errorMessage.slice(0, 40)}…`
                        : w.errorMessage}
                    </span>
                  ) : (
                    "–"
                  )}
                </td>
                <td style={{ color: colors.text }}>
                  {w.createdAt
                    ? new Date(w.createdAt).toLocaleString("de-DE")
                    : "–"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
