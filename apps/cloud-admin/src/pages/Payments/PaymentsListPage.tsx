import { useEffect, useMemo, useState } from "react";
import { apiGet } from "../../lib/api";

type Payment = {
  id: string;
  orgId?: string;
  customerId?: string;
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
      <h1 className="admin-page-title">Payments</h1>
      <p className="admin-page-subtitle">
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
        <div style={{ fontSize: 13, color: "#9ca3af" }}>
          {filteredItems.length} von {total} Payments angezeigt
        </div>

        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <span style={{ fontSize: 13, color: "#9ca3af" }}>Status:</span>
          <select
            value={statusFilter}
            onChange={(e) =>
              setStatusFilter(e.target.value as "all" | "paid" | "failed" | "pending")
            }
            style={{
              padding: "6px 10px",
              borderRadius: 6,
              border: "1px solid #374151",
              background: "#020617",
              color: "#e5e7eb",
              fontSize: 13,
              minWidth: 140,
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
        <div className="admin-error-banner">
          {error}
        </div>
      )}

      <div className="admin-card">
        <table className="admin-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Customer</th>
              <th>Subscription</th>
              <th>Betrag</th>
              <th>Status</th>
              <th>Provider</th>
              <th>Erstellt</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={7} style={{ textAlign: "center", padding: 24 }}>
                  Lädt Payments…
                </td>
              </tr>
            ) : filteredItems.length === 0 ? (
              <tr>
                <td colSpan={7} style={{ textAlign: "center", padding: 24 }}>
                  Keine Payments gefunden.
                </td>
              </tr>
            ) : (
              filteredItems.map((p) => (
                <tr key={p.id}>
                  <td>{p.id.slice(0, 8)}…</td>
                  <td>{p.customerId ? `${p.customerId.slice(0, 8)}…` : "—"}</td>
                  <td>{p.subscriptionId ? `${p.subscriptionId.slice(0, 8)}…` : "—"}</td>
                  <td>{formatAmount(p.amountCents, p.currency)}</td>
                  <td>
                    <span className={`status-badge status-${p.status}`}>
                      {p.status}
                    </span>
                  </td>
                  <td>{p.provider}</td>
                  <td>
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
  );
}
