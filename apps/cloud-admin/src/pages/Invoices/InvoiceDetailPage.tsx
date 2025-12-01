// apps/cloud-admin/src/pages/Invoices/InvoiceDetailPage.tsx
import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { apiGet } from "../../lib/api";
import { formatDateTime, formatMoney } from "../../lib/format";

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
          setError("Rechnung nicht gefunden.");
          return;
        }

        setData(res);
      } catch (err: any) {
        console.error("Error loading invoice detail", err);
        if (!cancelled) {
          setError(err.message ?? "Fehler beim Laden der Rechnung.");
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
        <p>Rechnungs-ID fehlt in der URL.</p>
      </div>
    );
  }

  return (
    <div className="admin-page">
      <h1 className="admin-page-title">Invoice Details</h1>
      <p className="admin-page-subtitle">
        Detailansicht der ausgewählten Rechnung.
      </p>

      <div style={{ marginTop: 8, marginBottom: 16 }}>
        <Link
          to="/invoices"
          style={{ fontSize: 13, color: "#a855f7", textDecoration: "none" }}
        >
          ← zurück zur Übersicht
        </Link>
      </div>

      {error && <div className="admin-error-banner">{error}</div>}

      {loading ? (
        <div className="admin-card" style={{ padding: 24 }}>
          Lädt Rechnungsdaten…
        </div>
      ) : !data ? (
        <div className="admin-card" style={{ padding: 24 }}>
          Rechnung wurde nicht gefunden.
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
                Rechnungsnummer
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
                <span
                  className={`status-badge status-${data.invoice.status}`}
                >
                  {data.invoice.status}
                </span>
              </div>
            </div>

            <div>
              <div style={{ fontSize: 13, color: "#9ca3af", marginBottom: 4 }}>
                Betrag
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
                Ausgestellt am
              </div>
              <div>{formatDateTime(data.invoice.issuedAt ?? data.invoice.createdAt)}</div>
            </div>

            <div>
              <div style={{ fontSize: 13, color: "#9ca3af", marginBottom: 4 }}>
                Fällig am
              </div>
              <div>{formatDateTime(data.invoice.dueAt)}</div>
            </div>

            <div>
              <div style={{ fontSize: 13, color: "#9ca3af", marginBottom: 4 }}>
                Erstellt am
              </div>
              <div>{formatDateTime(data.invoice.createdAt)}</div>
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
                Kunde
              </div>
              <div>
                <Link
                  to={`/customers/${data.customer.id}`}
                  style={{ color: "#a855f7", textDecoration: "none" }}
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
              <div>
                <span
                  className={`status-badge status-${data.subscription.status}`}
                >
                  {data.subscription.plan} ({data.subscription.status})
                </span>
              </div>
            </div>
          )}

          <div
            style={{
              display: "flex",
              gap: 12,
              marginTop: 24,
              paddingTop: 24,
              borderTop: "1px solid #374151",
            }}
          >
            <button
              onClick={async () => {
                const token = localStorage.getItem("caisty.admin.token");
                if (!token) {
                  alert("Nicht angemeldet");
                  return;
                }
                const url = `/api/invoices/${id}/html`;
                const res = await fetch(url, {
                  headers: {
                    Authorization: `Bearer ${token}`,
                  },
                });
                if (!res.ok) {
                  alert(`Fehler: ${res.status}`);
                  return;
                }
                const html = await res.text();
                const win = window.open();
                if (win) {
                  win.document.write(html);
                  win.document.close();
                }
              }}
              style={{
                padding: "8px 16px",
                borderRadius: 6,
                border: "1px solid #a855f7",
                background: "transparent",
                color: "#a855f7",
                cursor: "pointer",
                fontSize: 14,
              }}
            >
              📄 Rechnung anzeigen
            </button>
            <button
              onClick={async () => {
                const token = localStorage.getItem("caisty.admin.token");
                if (!token) {
                  alert("Nicht angemeldet");
                  return;
                }
                const url = `/api/invoices/${id}/html`;
                const res = await fetch(url, {
                  headers: {
                    Authorization: `Bearer ${token}`,
                  },
                });
                if (!res.ok) {
                  alert(`Fehler: ${res.status}`);
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
              style={{
                padding: "8px 16px",
                borderRadius: 6,
                border: "1px solid #10b981",
                background: "transparent",
                color: "#10b981",
                cursor: "pointer",
                fontSize: 14,
              }}
            >
              📥 Als PDF drucken
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

