// apps/cloud-admin/src/pages/Invoices/InvoiceDetailPage.tsx
import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { apiGet, API_BASE } from "../../lib/api";
import { formatMoney } from "../../lib/format";
import {
  InvoiceStatusPill,
  SubscriptionStatusPill,
} from "../../lib/adminStatusPills";

type InvoiceDetail = {
  id: string;
  number: string;
  status: string;
  amountCents: number;
  currency: string;
  createdAt: string;
  dueAt: string | null;
  issuedAt: string | null;
  plan: string | null;
};

type Customer = {
  id: string;
  name: string;
  email: string;
};

type Subscription = {
  id: string;
  plan: string;
  status: string;
};

type InvoiceDetailResponse = {
  ok: boolean;
  invoice: InvoiceDetail;
  customer: Customer | null;
  subscription: Subscription | null;
};

function formatDateTimeEnGb(value: string | null | undefined): string {
  if (!value) return "—";
  return new Date(value).toLocaleString("en-GB");
}

export default function InvoiceDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [data, setData] = useState<InvoiceDetailResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;

    let cancelled = false;

    async function load() {
      try {
        setLoading(true);
        setError(null);

        const res = await apiGet<InvoiceDetailResponse>(`/invoices/${id}`);
        if (cancelled) return;

        if (!res.ok) {
          setError("Invoice not found.");
          return;
        }

        setData(res);
      } catch (err: any) {
        console.error("Error loading invoice detail", err);
        if (!cancelled) {
          setError(err.message ?? "Failed to load invoice.");
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
  }, [id]);

  if (!id) {
    return (
      <div className="admin-page">
        <p>Invoice ID missing from URL.</p>
      </div>
    );
  }

  return (
    <div className="admin-page">
      <h1 className="admin-page-title">Invoice Details</h1>
      <p className="admin-page-subtitle">
        Detailed view of the selected invoice.
      </p>

      <div style={{ marginTop: 8, marginBottom: 16 }}>
        <Link to="/invoices" className="ds-link">
          ← Back to list
        </Link>
      </div>

      {error && <div className="admin-error-banner">{error}</div>}

      {loading ? (
        <div className="admin-card" style={{ padding: 24 }}>
          Loading invoice…
        </div>
      ) : !data ? (
        <div className="admin-card" style={{ padding: 24 }}>
          Invoice not found.
        </div>
      ) : (
        <div className="admin-card" style={{ marginBottom: 24 }}>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
              gap: 24,
              marginBottom: 24,
            }}
          >
            <div>
              <div style={{ fontSize: 13, color: "#9ca3af", marginBottom: 4 }}>
                Invoice number
              </div>
              <div style={{ fontSize: 18, fontWeight: 600 }}>
                {data.invoice.number}
              </div>
            </div>

            <div>
              <div style={{ fontSize: 13, color: "#9ca3af", marginBottom: 4 }}>
                Status
              </div>
              <div>
                <InvoiceStatusPill status={data.invoice.status} />
              </div>
            </div>

            <div>
              <div style={{ fontSize: 13, color: "#9ca3af", marginBottom: 4 }}>
                Amount
              </div>
              <div style={{ fontSize: 18, fontWeight: 600 }}>
                {formatMoney(data.invoice.amountCents, data.invoice.currency)}
              </div>
            </div>

            <div>
              <div style={{ fontSize: 13, color: "#9ca3af", marginBottom: 4 }}>
                Plan
              </div>
              <div>{data.invoice.plan ?? "—"}</div>
            </div>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
              gap: 24,
              marginBottom: 24,
            }}
          >
            <div>
              <div style={{ fontSize: 13, color: "#9ca3af", marginBottom: 4 }}>
                Issued
              </div>
              <div>
                {formatDateTimeEnGb(
                  data.invoice.issuedAt ?? data.invoice.createdAt,
                )}
              </div>
            </div>

            <div>
              <div style={{ fontSize: 13, color: "#9ca3af", marginBottom: 4 }}>
                Due
              </div>
              <div>{formatDateTimeEnGb(data.invoice.dueAt)}</div>
            </div>

            <div>
              <div style={{ fontSize: 13, color: "#9ca3af", marginBottom: 4 }}>
                Created
              </div>
              <div>{formatDateTimeEnGb(data.invoice.createdAt)}</div>
            </div>
          </div>

          {data.customer && (
            <div style={{ marginBottom: 24 }}>
              <div
                style={{
                  fontSize: 13,
                  fontWeight: 600,
                  marginBottom: 8,
                  color: "#9ca3af",
                }}
              >
                Customer
              </div>
              <div>
                <Link
                  to={`/customers/${data.customer.id}`}
                  className="ds-link"
                >
                  {data.customer.name}
                </Link>
                <span style={{ marginLeft: 8, color: "#9ca3af" }}>
                  ({data.customer.email})
                </span>
              </div>
            </div>
          )}

          {data.subscription && (
            <div style={{ marginBottom: 24 }}>
              <div
                style={{
                  fontSize: 13,
                  fontWeight: 600,
                  marginBottom: 8,
                  color: "#9ca3af",
                }}
              >
                Subscription
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span>{data.subscription.plan}</span>
                <SubscriptionStatusPill status={data.subscription.status} />
              </div>
            </div>
          )}

          <div
            style={{
              display: "flex",
              gap: 12,
              marginTop: 24,
              paddingTop: 24,
              borderTop: "1px solid var(--admin-border)",
            }}
          >
            <button
              onClick={async () => {
                const token = localStorage.getItem("caisty.admin.token");
                if (!token) {
                  alert("Not signed in");
                  return;
                }
                const url = `${API_BASE}/invoices/${id}/html`;
                const res = await fetch(url, {
                  headers: {
                    Authorization: `Bearer ${token}`,
                  },
                });
                if (!res.ok) {
                  alert(`Error: ${res.status}`);
                  return;
                }
                const html = await res.text();
                const win = window.open();
                if (win) {
                  win.document.write(html);
                  win.document.close();
                }
              }}
              className="login-button"
              style={{ width: "auto", marginTop: 0 }}
            >
              View invoice
            </button>
            <button
              onClick={async () => {
                const token = localStorage.getItem("caisty.admin.token");
                if (!token) {
                  alert("Not signed in");
                  return;
                }
                const url = `${API_BASE}/invoices/${id}/html`;
                const res = await fetch(url, {
                  headers: {
                    Authorization: `Bearer ${token}`,
                  },
                });
                if (!res.ok) {
                  alert(`Error: ${res.status}`);
                  return;
                }
                const html = await res.text();
                const win = window.open();
                if (win) {
                  win.document.write(html);
                  win.document.close();
                  setTimeout(() => {
                    win?.print();
                  }, 500);
                }
              }}
              className="login-button"
              style={{ width: "auto", marginTop: 0 }}
            >
              Print as PDF
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
