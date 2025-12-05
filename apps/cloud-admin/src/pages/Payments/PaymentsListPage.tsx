import { useEffect, useMemo, useState } from "react";
import { apiGet } from "../../lib/api";
import { useTheme, themeColors } from "../../theme/ThemeContext";

type Payment = {
  id: string;
  orgId?: string;
  customerId?: string;
  customerName?: string | null;
  subscriptionId?: string;
  provider: string;
  providerPaymentId?: string;
  providerStatus?: string;
  amountCents: number;
  currency: string;
  status: string;
  createdAt?: string | null;
};

type PaymentsResponse = {
  items: Payment[];
  total: number;
  limit: number;
  offset: number;
};

function formatAmount(amountCents: number, currency: string) {
  const value = amountCents / 100;
  return `${value.toFixed(2)} ${currency}`;
}

export default function PaymentsListPage() {
  const { theme } = useTheme();
  const colors = themeColors[theme];
  const [items, setItems] = useState<Payment[]>([]);
  const [total, setTotal] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<"all" | "paid" | "failed" | "pending">("all");

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        setLoading(true);
        setError(null);

        const data = await apiGet<PaymentsResponse>("/payments");
        if (cancelled) return;

        setItems(data.items ?? []);
        setTotal(data.total ?? data.items?.length ?? 0);
      } catch (err) {
        console.error("Error loading payments", err);
        if (!cancelled) {
          setError("Fehler beim Laden der Payments.");
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

  const filteredItems = useMemo(() => {
    if (statusFilter === "all") return items;
    return items.filter((p) => p.status === statusFilter);
  }, [items, statusFilter]);

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
        Payments
      </h1>
      <p
        style={{
          fontSize: "14px",
          color: colors.textSecondary,
          marginBottom: "24px",
        }}
      >
        Übersicht über Zahlungen aus externen Providern (z.B. PayPal Sandbox).
      </p>

      {/* Filter / Info-Leiste */}
      <div
        style={{
          marginTop: 16,
          marginBottom: 16,
          display: "flex",
          gap: 16,
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
        }}
      >
        <div style={{ fontSize: 13, color: colors.textSecondary }}>
          {filteredItems.length} von {total} Payments angezeigt
        </div>

        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <span style={{ fontSize: 13, color: colors.textSecondary }}>
            Status:
          </span>
          <select
            value={statusFilter}
            onChange={(e) =>
              setStatusFilter(
                e.target.value as "all" | "paid" | "failed" | "pending",
              )
            }
            style={{
              padding: "6px 10px",
              borderRadius: 6,
              border: `1px solid ${colors.borderSecondary}`,
              background: colors.input,
              color: colors.text,
              fontSize: 13,
              minWidth: 140,
              transition: "all 0.2s",
            }}
            onFocus={(e) => {
              e.currentTarget.style.borderColor = colors.accent;
              e.currentTarget.style.boxShadow = `0 0 0 3px ${colors.accent}20`;
            }}
            onBlur={(e) => {
              e.currentTarget.style.borderColor = colors.borderSecondary;
              e.currentTarget.style.boxShadow = "none";
            }}
          >
            <option value="all">Alle</option>
            <option value="paid">paid</option>
            <option value="failed">failed</option>
            <option value="pending">pending</option>
          </select>
        </div>
      </div>

      {error && (
        <div
          className="admin-error-banner"
          style={{
            backgroundColor: colors.errorBg,
            borderColor: `${colors.error}50`,
            color: colors.error,
          }}
        >
          {error}
        </div>
      )}

      <div
        className="admin-card"
        style={{
          backgroundColor: colors.bgSecondary,
          borderColor: colors.border,
          transition: "background-color 0.3s, border-color 0.3s",
        }}
      >
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
                <th style={{ color: colors.textSecondary }}>Customer</th>
                <th style={{ color: colors.textSecondary }}>Subscription</th>
                <th style={{ color: colors.textSecondary }}>Betrag</th>
                <th style={{ color: colors.textSecondary }}>Status</th>
                <th style={{ color: colors.textSecondary }}>Provider</th>
                <th style={{ color: colors.textSecondary }}>Erstellt</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td
                    colSpan={7}
                    style={{
                      textAlign: "center",
                      padding: 24,
                      color: colors.textSecondary,
                    }}
                  >
                    Lädt Payments…
                  </td>
                </tr>
              ) : filteredItems.length === 0 ? (
                <tr>
                  <td
                    colSpan={7}
                    style={{
                      textAlign: "center",
                      padding: 24,
                      color: colors.textSecondary,
                    }}
                  >
                    Keine Payments gefunden.
                  </td>
                </tr>
              ) : (
                filteredItems.map((p) => (
                  <tr
                    key={p.id}
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
                    <td style={{ color: colors.text }}>
                      {p.id.slice(0, 8)}…
                    </td>
                    <td style={{ color: colors.text }}>
                      {p.customerName
                        ? p.customerName
                        : p.customerId
                        ? `${p.customerId.slice(0, 8)}…`
                        : "—"}
                    </td>
                    <td style={{ color: colors.text }}>
                      {p.subscriptionId
                        ? `${p.subscriptionId.slice(0, 8)}…`
                        : "—"}
                    </td>
                    <td style={{ color: colors.text }}>
                      {formatAmount(p.amountCents, p.currency)}
                    </td>
                    <td>
                      <span className={`status-badge status-${p.status}`}>
                        {p.status}
                      </span>
                    </td>
                    <td style={{ color: colors.text }}>{p.provider}</td>
                    <td style={{ color: colors.text }}>
                      {p.createdAt
                        ? new Date(p.createdAt).toLocaleString("de-DE")
                        : "—"}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
