// apps/cloud-admin/src/pages/InvoicesListPage.tsx
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { apiGet, apiDelete, fetchAdminInvoiceHtml } from "../lib/api";
import { formatMoney } from "../lib/format";
import {
  Button,
  DataTable,
  PageHeader,
  SectionHeader,
  Toolbar,
} from "../components/ui";
import { InvoiceStatusPill } from "../lib/adminStatusPills";

type Invoice = {
  id: string;
  number: string;
  status: string;
  amountCents: number;
  currency: string;
  createdAt: string;
  dueAt: string | null;
  customerId?: string;
  customerName?: string;
  customerEmail?: string;
};

type InvoicesResponse = {
  items: Invoice[];
  total: number;
  limit: number;
  offset: number;
};

function formatDateTimeEnGb(value: string | null | undefined): string {
  if (!value) return "—";
  return new Date(value).toLocaleString("en-GB");
}

export default function InvoicesListPage() {
  const [data, setData] = useState<InvoicesResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [deleteBusyId, setDeleteBusyId] = useState<string | null>(null);
  const [showCancelled, setShowCancelled] = useState(false);

  // Filter invoices by status
  const paidInvoices = data?.items.filter((inv) => inv.status?.toLowerCase() === "paid") ?? [];
  const openCancelledInvoices =
    data?.items.filter((inv) =>
      ["open", "cancelled", "canceled", "draft"].includes(inv.status?.toLowerCase() || "")
    ) ?? [];

  useEffect(() => {
    setLoading(true);
    apiGet<InvoicesResponse>("/invoices?limit=50&offset=0")
      .then((res) => {
        setData(res);
        setError(null);
      })
      .catch((err) => {
        console.error(err);
        setError("Failed to load invoices.");
      })
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="admin-page">
      <PageHeader
        title="Invoices"
        subtitle="Overview of all paid and open invoices."
      />

      {data ? (
        <Toolbar
          footer={
            <>
              <strong>{paidInvoices.length}</strong> paid
              {openCancelledInvoices.length > 0 ? (
                <>
                  {" · "}
                  <strong>{openCancelledInvoices.length}</strong> open/closed
                </>
              ) : null}{" "}
              · {data.total} total
            </>
          }
        >
          <span className="ds-muted">Invoice summary</span>
        </Toolbar>
      ) : null}

      {loading ? <p className="ds-muted">Loading…</p> : null}
      {error ? <div className="admin-error-banner">{error}</div> : null}

      {data && paidInvoices.length > 0 ? (
        <div className="ds-section-block">
          <SectionHeader
            title={`Paid invoices (${paidInvoices.length})`}
            pill={`${paidInvoices.length}`}
          />
          <DataTable>
            <thead>
              <tr>
                <th>Number</th>
                <th>Customer</th>
                <th>Status</th>
                <th>Amount</th>
                <th>Issued</th>
                <th>Due</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {paidInvoices.map((inv) => (
                <tr key={inv.id}>
                  <td>
                    <Link to={`/invoices/${inv.id}`} className="ds-link">
                      {inv.number}
                    </Link>
                  </td>
                  <td>
                    {inv.customerName
                      ? `${inv.customerName} (${inv.customerEmail ?? ""})`
                      : "—"}
                  </td>
                  <td>
                    <InvoiceStatusPill status={inv.status} />
                  </td>
                  <td>{formatMoney(inv.amountCents, inv.currency)}</td>
                  <td>{formatDateTimeEnGb(inv.createdAt)}</td>
                  <td>{formatDateTimeEnGb(inv.dueAt)}</td>
                  <td>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                      <Button
                        variant="link"
                        title="View invoice"
                        onClick={async () => {
                          try {
                            const html = await fetchAdminInvoiceHtml(inv.id);
                            const win = window.open();
                            if (win) {
                              win.document.write(html);
                              win.document.close();
                            }
                          } catch (e) {
                            alert(e instanceof Error ? e.message : "Failed to load invoice.");
                          }
                        }}
                      >
                        View
                      </Button>
                      <Button
                        variant="link"
                        title="Print as PDF"
                        onClick={async () => {
                          try {
                            const html = await fetchAdminInvoiceHtml(inv.id);
                            const win = window.open();
                            if (win) {
                              win.document.write(html);
                              win.document.close();
                              setTimeout(() => {
                                win?.print();
                              }, 500);
                            }
                          } catch (e) {
                            alert(e instanceof Error ? e.message : "Failed to load invoice.");
                          }
                        }}
                      >
                        PDF
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </DataTable>
        </div>
      ) : null}

      {data && openCancelledInvoices.length > 0 ? (
        <div className="ds-section-block">
          <div
            className="ds-section-header"
            style={{ cursor: "pointer" }}
            onClick={() => setShowCancelled(!showCancelled)}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                setShowCancelled(!showCancelled);
              }
            }}
            role="button"
            tabIndex={0}
            aria-expanded={showCancelled}
          >
            <div>
              <h2 className="ds-section-title">
                Open/closed invoices ({openCancelledInvoices.length})
              </h2>
            </div>
            <span className="ds-muted">{showCancelled ? "▼" : "▶"}</span>
          </div>
          {showCancelled ? (
            <DataTable>
              <thead>
                <tr>
                  <th>Number</th>
                  <th>Customer</th>
                  <th>Status</th>
                  <th>Amount</th>
                  <th>Issued</th>
                  <th>Due</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {openCancelledInvoices.map((inv) => (
                  <tr key={inv.id}>
                    <td>
                      <Link to={`/invoices/${inv.id}`} className="ds-link">
                        {inv.number}
                      </Link>
                    </td>
                    <td>
                      {inv.customerName
                        ? `${inv.customerName} (${inv.customerEmail ?? ""})`
                        : "—"}
                    </td>
                    <td>
                      <InvoiceStatusPill status={inv.status} />
                    </td>
                    <td>{formatMoney(inv.amountCents, inv.currency)}</td>
                    <td>{formatDateTimeEnGb(inv.createdAt)}</td>
                    <td>{formatDateTimeEnGb(inv.dueAt)}</td>
                    <td>
                      <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                        <Button
                          variant="link"
                          title="View invoice"
                          onClick={async () => {
                            try {
                              const html = await fetchAdminInvoiceHtml(inv.id);
                              const win = window.open();
                              if (win) {
                                win.document.write(html);
                                win.document.close();
                              }
                            } catch (e) {
                              alert(e instanceof Error ? e.message : "Failed to load invoice.");
                            }
                          }}
                        >
                          View
                        </Button>
                        <Button
                          variant="link"
                          title="Print as PDF"
                          onClick={async () => {
                            try {
                              const html = await fetchAdminInvoiceHtml(inv.id);
                              const win = window.open();
                              if (win) {
                                win.document.write(html);
                                win.document.close();
                                setTimeout(() => {
                                  win?.print();
                                }, 500);
                              }
                            } catch (e) {
                              alert(e instanceof Error ? e.message : "Failed to load invoice.");
                            }
                          }}
                        >
                          PDF
                        </Button>
                        <Button
                          variant="danger"
                          disabled={deleteBusyId === inv.id}
                          title="Delete invoice"
                          onClick={async () => {
                            if (
                              !confirm(
                                `Delete invoice "${inv.number}" (status: ${inv.status})? This cannot be undone.`,
                              )
                            ) {
                              return;
                            }
                            setDeleteBusyId(inv.id);
                            try {
                              const result = await apiDelete<{ ok: boolean; message?: string; error?: string }>(
                                `/invoices/${inv.id}`
                              );
                              if (!result.ok) {
                                throw new Error(result.error || "Failed to delete invoice.");
                              }
                              const data = await apiGet<InvoicesResponse>("/invoices?limit=50&offset=0");
                              setData(data);
                            } catch (err: any) {
                              console.error("Error deleting invoice", err);
                              alert(err?.message || "Failed to delete invoice.");
                            } finally {
                              setDeleteBusyId(null);
                            }
                          }}
                        >
                          {deleteBusyId === inv.id ? "Deleting…" : "Delete"}
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </DataTable>
          ) : null}
        </div>
      ) : null}

      {data && !loading && !error && data.items.length === 0 ? (
        <p className="ds-muted">No invoices found.</p>
      ) : null}
    </div>
  );
}
