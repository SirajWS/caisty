import { useEffect, useMemo, useState } from "react";
import { apiGet } from "../../lib/api";
import {
  DataTable,
  PageHeader,
  Select,
  Toolbar,
} from "../../components/ui";
import { PaymentStatusPill } from "../../lib/adminStatusPills";

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
          setError("Failed to load payments.");
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
      <PageHeader
        title="Payments"
        subtitle="Payments from external providers (e.g. PayPal sandbox)."
      />

      <Toolbar footer={`${filteredItems.length} of ${total} payments shown`}>
        <Select
          value={statusFilter}
          onChange={(e) =>
            setStatusFilter(e.target.value as "all" | "paid" | "failed" | "pending")
          }
        >
          <option value="all">All statuses</option>
          <option value="paid">Paid</option>
          <option value="failed">Failed</option>
          <option value="pending">Pending</option>
        </Select>
      </Toolbar>

      {error ? <div className="admin-error-banner">{error}</div> : null}

      <div className="ds-section-block">
        <DataTable>
          <thead>
            <tr>
              <th>ID</th>
              <th>Customer</th>
              <th>Subscription</th>
              <th>Amount</th>
              <th>Status</th>
              <th>Provider</th>
              <th>Created</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={7} className="ds-muted" style={{ textAlign: "center", padding: 24 }}>
                  Loading payments…
                </td>
              </tr>
            ) : filteredItems.length === 0 ? (
              <tr>
                <td colSpan={7} className="ds-muted" style={{ textAlign: "center", padding: 24 }}>
                  No payments found.
                </td>
              </tr>
            ) : (
              filteredItems.map((p) => (
                <tr key={p.id}>
                  <td>{p.id.slice(0, 8)}…</td>
                  <td>
                    {p.customerName
                      ? p.customerName
                      : p.customerId
                        ? `${p.customerId.slice(0, 8)}…`
                        : "—"}
                  </td>
                  <td>
                    {p.subscriptionId ? `${p.subscriptionId.slice(0, 8)}…` : "—"}
                  </td>
                  <td>{formatAmount(p.amountCents, p.currency)}</td>
                  <td>
                    <PaymentStatusPill status={p.status} />
                  </td>
                  <td>{p.provider}</td>
                  <td>
                    {p.createdAt
                      ? new Date(p.createdAt).toLocaleString("en-GB")
                      : "—"}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </DataTable>
      </div>
    </div>
  );
}
