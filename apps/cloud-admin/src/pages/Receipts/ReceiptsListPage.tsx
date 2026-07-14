import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import {
  Button,
  DataTable,
  PageHeader,
  SearchInput,
  Select,
  Toolbar,
} from "../../components/ui";
import { PosReceiptStatusPill } from "../../lib/adminStatusPills";
import { formatMoney } from "../../lib/format";
import {
  fetchAdminReceipts,
  type AdminReceiptListItem,
} from "../../lib/receiptsApi";

function formatDateTime(value: string | null | undefined): string {
  if (!value) return "—";
  return new Date(value).toLocaleString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatPaymentMethod(method: string | null | undefined): string {
  if (!method?.trim()) return "—";
  const m = method.trim().toLowerCase();
  if (m.includes("cash")) return "Cash";
  if (m.includes("card") || m.includes("credit") || m.includes("debit")) {
    return "Card";
  }
  if (m.includes("voucher") || m.includes("gift")) return "Voucher";
  return method;
}

function parseAmountMinor(raw: string): number | undefined {
  const trimmed = raw.trim();
  if (!trimmed) return undefined;
  const normalized = trimmed.replace(",", ".");
  const major = Number.parseFloat(normalized);
  if (!Number.isFinite(major) || major < 0) return undefined;
  return Math.round(major * 100);
}

export default function ReceiptsListPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [data, setData] = useState<AdminReceiptListItem[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const period = searchParams.get("period") ?? "30_days";
  const status = searchParams.get("status") ?? "all";
  const paymentMethod = searchParams.get("paymentMethod") ?? "all";
  const search = searchParams.get("search") ?? "";
  const cashier = searchParams.get("cashier") ?? "";
  const customerSearch = searchParams.get("customerSearch") ?? "";
  const amount = searchParams.get("amount") ?? "";
  const from = searchParams.get("from") ?? "";
  const to = searchParams.get("to") ?? "";

  const updateParam = useCallback(
    (key: string, value: string) => {
      const next = new URLSearchParams(searchParams);
      if (!value || value === "all") {
        next.delete(key);
      } else {
        next.set(key, value);
      }
      setSearchParams(next, { replace: true });
    },
    [searchParams, setSearchParams],
  );

  const queryParams = useMemo(() => {
    const amountMinor = parseAmountMinor(amount);
    return {
      period: from || to ? undefined : period,
      from: from || undefined,
      to: to || undefined,
      status: status !== "all" ? status : undefined,
      paymentMethod: paymentMethod !== "all" ? paymentMethod : undefined,
      search: search || undefined,
      cashier: cashier || undefined,
      customerSearch: customerSearch || undefined,
      amountMin: amountMinor,
      amountMax: amountMinor,
      limit: 50,
      offset: 0,
    };
  }, [
    amount,
    cashier,
    customerSearch,
    from,
    paymentMethod,
    period,
    search,
    status,
    to,
  ]);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        setLoading(true);
        setError(null);
        const res = await fetchAdminReceipts(queryParams);
        if (cancelled) return;
        if (!res.ok) {
          setError("Failed to load receipts.");
          return;
        }
        setData(res.receipts ?? []);
        setTotal(res.total ?? 0);
      } catch (err) {
        console.error("Error loading admin receipts", err);
        if (!cancelled) {
          setError("Failed to load receipts.");
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
  }, [queryParams]);

  return (
    <div className="admin-page">
      <PageHeader
        title="Receipt History"
        subtitle="Central POS receipt management across all customers."
      />

      <Toolbar
        footer={
          loading
            ? "Loading receipts…"
            : `${data.length} shown · ${total} matching receipts`
        }
      >
        <Select
          value={period}
          onChange={(e) => updateParam("period", e.target.value)}
          aria-label="Date period"
        >
          <option value="today">Today</option>
          <option value="yesterday">Yesterday</option>
          <option value="7_days">Last 7 days</option>
          <option value="30_days">Last 30 days</option>
          <option value="this_month">This month</option>
          <option value="12_months">Last 12 months</option>
          <option value="all_time">All time</option>
        </Select>

        <SearchInput
          value={search}
          onChange={(e) => updateParam("search", e.target.value)}
          placeholder="Receipt number"
          aria-label="Receipt number"
        />

        <SearchInput
          value={cashier}
          onChange={(e) => updateParam("cashier", e.target.value)}
          placeholder="Cashier"
          aria-label="Cashier"
        />

        <SearchInput
          value={customerSearch}
          onChange={(e) => updateParam("customerSearch", e.target.value)}
          placeholder="Customer"
          aria-label="Customer"
        />

        <Select
          value={paymentMethod}
          onChange={(e) => updateParam("paymentMethod", e.target.value)}
          aria-label="Payment method"
        >
          <option value="all">All payments</option>
          <option value="cash">Cash</option>
          <option value="card">Card</option>
          <option value="voucher">Voucher</option>
          <option value="other">Other</option>
        </Select>

        <Select
          value={status}
          onChange={(e) => updateParam("status", e.target.value)}
          aria-label="Status"
        >
          <option value="all">All statuses</option>
          <option value="completed">Completed</option>
          <option value="refunded">Refunded</option>
          <option value="payment_changed">Payment changed</option>
          <option value="voided">Voided</option>
        </Select>

        <SearchInput
          value={amount}
          onChange={(e) => updateParam("amount", e.target.value)}
          placeholder="Amount (exact)"
          aria-label="Amount"
        />

        <SearchInput
          value={from}
          onChange={(e) => updateParam("from", e.target.value)}
          placeholder="From (YYYY-MM-DD)"
          aria-label="From date"
        />

        <SearchInput
          value={to}
          onChange={(e) => updateParam("to", e.target.value)}
          placeholder="To (YYYY-MM-DD)"
          aria-label="To date"
        />
      </Toolbar>

      {error ? <div className="admin-error-banner">{error}</div> : null}

      <DataTable>
        <thead>
          <tr>
            <th>Receipt number</th>
            <th>Date / time</th>
            <th>Store</th>
            <th>Cashier</th>
            <th>Customer</th>
            <th>Total</th>
            <th>Payment method</th>
            <th>Status</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {loading ? (
            <tr>
              <td colSpan={9}>Loading…</td>
            </tr>
          ) : data.length === 0 ? (
            <tr>
              <td colSpan={9}>No receipts found for the current filters.</td>
            </tr>
          ) : (
            data.map((receipt) => (
              <tr key={receipt.id}>
                <td>
                  <Link to={`/receipts/${receipt.id}`} className="ds-link">
                    {receipt.receiptNumber ?? receipt.id.slice(0, 8)}
                  </Link>
                </td>
                <td>{formatDateTime(receipt.issuedAt)}</td>
                <td>{receipt.storeName ?? "—"}</td>
                <td>{receipt.cashier ?? "—"}</td>
                <td>
                  {receipt.customerName ? (
                    receipt.customerId ? (
                      <Link
                        to={`/customers/${receipt.customerId}`}
                        className="ds-link"
                      >
                        {receipt.customerName}
                      </Link>
                    ) : (
                      receipt.customerName
                    )
                  ) : (
                    "—"
                  )}
                </td>
                <td>{formatMoney(receipt.amountCents, receipt.currency)}</td>
                <td>{formatPaymentMethod(receipt.paymentMethod)}</td>
                <td>
                  <PosReceiptStatusPill status={receipt.displayStatus} />
                </td>
                <td>
                  <Link to={`/receipts/${receipt.id}`}>
                    <Button variant="link">View</Button>
                  </Link>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </DataTable>
    </div>
  );
}
