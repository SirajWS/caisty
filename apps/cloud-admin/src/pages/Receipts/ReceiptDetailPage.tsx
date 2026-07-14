import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import { Link, useParams } from "react-router-dom";
import { Button, DataTable, SectionHeader, Select } from "../../components/ui";
import { PosReceiptStatusPill } from "../../lib/adminStatusPills";
import { formatMoney } from "../../lib/format";
import {
  changeAdminReceiptPayment,
  createIdempotencyKey,
  fetchAdminReceiptDetail,
  refundAdminReceipt,
  type AdminReceiptDetailResponse,
  type PaymentMethodBucket,
  type RefundReasonCode,
} from "../../lib/receiptsApi";
import { ReceiptActionDialog } from "./ReceiptActionDialog";

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

function formatTaxRate(bps: number | null): string {
  if (bps === null || bps === undefined) return "—";
  return `${(bps / 100).toFixed(2)}%`;
}

function parseAmountToMinor(raw: string): number | null {
  const normalized = raw.trim().replace(",", ".");
  if (!normalized) return null;
  const major = Number.parseFloat(normalized);
  if (!Number.isFinite(major) || major <= 0) return null;
  return Math.round(major * 100);
}

function MetaField({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <div>
      <div style={{ fontSize: 13, color: "#9ca3af", marginBottom: 4 }}>{label}</div>
      <div style={{ fontSize: 15, fontWeight: 500 }}>{children}</div>
    </div>
  );
}

export default function ReceiptDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [data, setData] = useState<AdminReceiptDetailResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [refundOpen, setRefundOpen] = useState(false);
  const [paymentOpen, setPaymentOpen] = useState(false);
  const [actionBusy, setActionBusy] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  const [refundAmount, setRefundAmount] = useState("");
  const [refundReason, setRefundReason] = useState<RefundReasonCode>("customer_request");
  const [refundReasonText, setRefundReasonText] = useState("");
  const [refundPaymentMethod, setRefundPaymentMethod] =
    useState<PaymentMethodBucket>("cash");
  const [refundNote, setRefundNote] = useState("");

  const [newPaymentMethod, setNewPaymentMethod] =
    useState<PaymentMethodBucket>("card");
  const [paymentReason, setPaymentReason] = useState("");
  const [paymentNote, setPaymentNote] = useState("");

  const loadDetail = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetchAdminReceiptDetail(id);
      if (!res.ok) {
        setError("Receipt not found.");
        setData(null);
        return;
      }
      setData(res);
    } catch (err) {
      console.error("Error loading receipt detail", err);
      setError("Failed to load receipt.");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadDetail();
  }, [loadDetail]);

  const receipt = data?.receipt;
  const refundSummary = data?.refundSummary;

  const defaultRefundAmount = useMemo(() => {
    if (!refundSummary) return "";
    return (refundSummary.refundableAmountCents / 100).toFixed(2);
  }, [refundSummary]);

  useEffect(() => {
    if (refundOpen && defaultRefundAmount) {
      setRefundAmount(defaultRefundAmount);
    }
  }, [refundOpen, defaultRefundAmount]);

  async function handleRefundSubmit() {
    if (!id || !refundSummary) return;
    setActionBusy(true);
    setActionError(null);
    setActionSuccess(null);

    const amountCents = parseAmountToMinor(refundAmount);
    if (amountCents === null) {
      setActionError("Enter a valid refund amount greater than zero.");
      setActionBusy(false);
      return;
    }

    if (refundReason === "other" && !refundReasonText.trim()) {
      setActionError("Please provide a reason when selecting Other.");
      setActionBusy(false);
      return;
    }

    try {
      const res = await refundAdminReceipt(id, {
        amountCents,
        reasonCode: refundReason,
        reasonText: refundReason === "other" ? refundReasonText.trim() : null,
        refundPaymentMethod,
        internalNote: refundNote.trim() || null,
        idempotencyKey: createIdempotencyKey(),
      });

      if (!res.ok) {
        setActionError(res.message ?? "Refund failed.");
        return;
      }

      if (res.detail) setData(res.detail);
      else await loadDetail();

      setActionSuccess("Refund recorded successfully.");
      setTimeout(() => {
        setRefundOpen(false);
        setActionSuccess(null);
      }, 1200);
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Refund failed.");
    } finally {
      setActionBusy(false);
    }
  }

  async function handlePaymentChangeSubmit() {
    if (!id) return;
    setActionBusy(true);
    setActionError(null);
    setActionSuccess(null);

    if (!paymentReason.trim()) {
      setActionError("Reason is required.");
      setActionBusy(false);
      return;
    }

    try {
      const res = await changeAdminReceiptPayment(id, {
        newPaymentMethod,
        reason: paymentReason.trim(),
        internalNote: paymentNote.trim() || null,
        idempotencyKey: createIdempotencyKey(),
      });

      if (!res.ok) {
        setActionError(res.message ?? "Payment change failed.");
        return;
      }

      if (res.detail) setData(res.detail);
      else await loadDetail();

      setActionSuccess("Payment method updated successfully.");
      setTimeout(() => {
        setPaymentOpen(false);
        setActionSuccess(null);
      }, 1200);
    } catch (err) {
      setActionError(
        err instanceof Error ? err.message : "Payment change failed.",
      );
    } finally {
      setActionBusy(false);
    }
  }

  if (!id) {
    return (
      <div className="admin-page">
        <p>Receipt ID missing from URL.</p>
      </div>
    );
  }

  return (
    <div className="admin-page">
      <h1 className="admin-page-title">Receipt detail</h1>
      <p className="admin-page-subtitle">
        POS receipt history with refunds, payment changes, and lifecycle timeline.
      </p>

      <div style={{ marginTop: 8, marginBottom: 16 }}>
        <Link to="/receipts" className="ds-link">
          ← Back to receipt history
        </Link>
      </div>

      {error ? <div className="admin-error-banner">{error}</div> : null}

      {loading ? (
        <div className="admin-card" style={{ padding: 24 }}>
          Loading receipt…
        </div>
      ) : !receipt || !data ? (
        <div className="admin-card" style={{ padding: 24 }}>
          Receipt not found.
        </div>
      ) : (
        <>
          <div className="admin-card" style={{ marginBottom: 24, padding: 24 }}>
            <SectionHeader title="Header" />
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
                gap: 20,
                marginBottom: 24,
              }}
            >
              <MetaField label="Receipt number">
                {receipt.receiptNumber ?? "—"}
              </MetaField>
              <MetaField label="Business">
                {receipt.customerName ? (
                  receipt.customerId ? (
                    <Link to={`/customers/${receipt.customerId}`} className="ds-link">
                      {receipt.customerName}
                    </Link>
                  ) : (
                    receipt.customerName
                  )
                ) : (
                  "—"
                )}
              </MetaField>
              <MetaField label="Date">{formatDateTime(receipt.issuedAt)}</MetaField>
              <MetaField label="Cashier">{receipt.cashier ?? "—"}</MetaField>
              <MetaField label="Register">{receipt.storeName ?? "—"}</MetaField>
              <MetaField label="Status">
                <PosReceiptStatusPill status={receipt.displayStatus} />
              </MetaField>
              <MetaField label="Refunded">
                {formatMoney(
                  data.refundSummary.refundedAmountCents,
                  receipt.currency,
                )}
              </MetaField>
              <MetaField label="Refundable">
                {formatMoney(
                  data.refundSummary.refundableAmountCents,
                  receipt.currency,
                )}
              </MetaField>
            </div>

            <div style={{ display: "flex", flexWrap: "wrap", gap: 12 }}>
              <Button variant="secondary" disabled title={data.actions.reprint.reason ?? undefined}>
                Reprint (Soon)
              </Button>
              <Button
                variant="secondary"
                disabled={!data.actions.refund.available}
                title={data.actions.refund.reason ?? undefined}
                onClick={() => {
                  setActionError(null);
                  setRefundOpen(true);
                }}
              >
                Refund
              </Button>
              <Button
                variant="secondary"
                disabled={!data.actions.changePayment.available}
                title={data.actions.changePayment.reason ?? undefined}
                onClick={() => {
                  setActionError(null);
                  setPaymentOpen(true);
                }}
              >
                Change payment
              </Button>
            </div>
          </div>

          <div className="admin-card" style={{ marginBottom: 24, padding: 24 }}>
            <SectionHeader title="Order information" />
            <DataTable>
              <thead>
                <tr>
                  <th>Product</th>
                  <th>Quantity</th>
                  <th>Price</th>
                  <th>Discount</th>
                  <th>VAT</th>
                  <th>Line total</th>
                </tr>
              </thead>
              <tbody>
                {receipt.items.length === 0 ? (
                  <tr>
                    <td colSpan={6}>No line items synced for this receipt.</td>
                  </tr>
                ) : (
                  receipt.items.map((item, index) => (
                    <tr key={`${item.sku ?? "line"}-${index}`}>
                      <td>{item.productName ?? item.sku ?? "—"}</td>
                      <td>{item.quantity}</td>
                      <td>{formatMoney(item.unitPriceCents, receipt.currency)}</td>
                      <td>—</td>
                      <td>{formatTaxRate(item.taxRateBps)}</td>
                      <td>{formatMoney(item.lineTotalCents, receipt.currency)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </DataTable>
          </div>

          <div className="admin-card" style={{ marginBottom: 24, padding: 24 }}>
            <SectionHeader title="Payment information" />
            <DataTable>
              <thead>
                <tr>
                  <th>Payment method</th>
                  <th>Amount</th>
                  <th>Paid at</th>
                </tr>
              </thead>
              <tbody>
                {data.payments.length === 0 ? (
                  <tr>
                    <td colSpan={3}>
                      {formatPaymentMethod(receipt.paymentMethod)} ·{" "}
                      {formatMoney(receipt.grossCents, receipt.currency)}
                    </td>
                  </tr>
                ) : (
                  data.payments.map((payment, index) => (
                    <tr key={`${payment.method}-${index}`}>
                      <td>{formatPaymentMethod(payment.method)}</td>
                      <td>{formatMoney(payment.amountCents, payment.currency)}</td>
                      <td>{formatDateTime(payment.paidAt)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </DataTable>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
                gap: 16,
                marginTop: 20,
              }}
            >
              <MetaField label="Net total">
                {formatMoney(receipt.netCents, receipt.currency)}
              </MetaField>
              <MetaField label="VAT total">
                {formatMoney(receipt.taxCents, receipt.currency)}
              </MetaField>
              <MetaField label="Receipt total">
                {formatMoney(receipt.grossCents, receipt.currency)}
              </MetaField>
            </div>
          </div>

          <div className="admin-card" style={{ padding: 24 }}>
            <SectionHeader title="Timeline" />
            <ul style={{ listStyle: "none", margin: 0, padding: 0 }}>
              {data.timeline.map((entry) => (
                <li
                  key={entry.id}
                  style={{
                    padding: "12px 0",
                    borderBottom: "1px solid rgba(148, 163, 184, 0.2)",
                  }}
                >
                  <div style={{ fontWeight: 600 }}>{entry.label}</div>
                  <div className="ds-muted">{formatDateTime(entry.occurredAt)}</div>
                  {entry.actor ? (
                    <div className="ds-muted">Actor: {entry.actor}</div>
                  ) : null}
                  {entry.previousValue && entry.newValue ? (
                    <div>
                      {entry.previousValue} → {entry.newValue}
                    </div>
                  ) : null}
                  {entry.amountCents !== null ? (
                    <div>Amount: {formatMoney(entry.amountCents, receipt.currency)}</div>
                  ) : null}
                  {entry.reason ? <div>Reason: {entry.reason}</div> : null}
                  {entry.details ? <div>{entry.details}</div> : null}
                </li>
              ))}
            </ul>
          </div>
        </>
      )}

      <ReceiptActionDialog
        open={refundOpen}
        title="Refund receipt"
        onClose={() => !actionBusy && setRefundOpen(false)}
        error={actionError}
        success={actionSuccess}
        footer={
          <>
            <Button variant="link" onClick={() => setRefundOpen(false)} disabled={actionBusy}>
              Cancel
            </Button>
            <Button variant="primary" onClick={handleRefundSubmit} disabled={actionBusy}>
              {actionBusy ? "Processing…" : "Confirm refund"}
            </Button>
          </>
        }
      >
        {receipt && refundSummary ? (
          <div style={{ display: "grid", gap: 12 }}>
            <MetaField label="Receipt number">{receipt.receiptNumber ?? "—"}</MetaField>
            <MetaField label="Original total">
              {formatMoney(refundSummary.originalAmountCents, receipt.currency)}
            </MetaField>
            <MetaField label="Already refunded">
              {formatMoney(refundSummary.refundedAmountCents, receipt.currency)}
            </MetaField>
            <MetaField label="Max refundable">
              {formatMoney(refundSummary.refundableAmountCents, receipt.currency)}
            </MetaField>
            <label>
              Refund amount
              <input
                className="ds-input"
                value={refundAmount}
                onChange={(e) => setRefundAmount(e.target.value)}
                placeholder="0.00"
              />
            </label>
            <label>
              Refund reason
              <Select
                value={refundReason}
                onChange={(e) => setRefundReason(e.target.value as RefundReasonCode)}
              >
                <option value="customer_request">Customer request</option>
                <option value="wrong_item">Wrong item</option>
                <option value="duplicate_payment">Duplicate payment</option>
                <option value="product_issue">Product issue</option>
                <option value="order_cancelled">Order cancelled</option>
                <option value="other">Other</option>
              </Select>
            </label>
            {refundReason === "other" ? (
              <label>
                Reason details
                <input
                  className="ds-input"
                  value={refundReasonText}
                  onChange={(e) => setRefundReasonText(e.target.value)}
                />
              </label>
            ) : null}
            <label>
              Refund payment method
              <Select
                value={refundPaymentMethod}
                onChange={(e) =>
                  setRefundPaymentMethod(e.target.value as PaymentMethodBucket)
                }
              >
                <option value="cash">Cash</option>
                <option value="card">Card</option>
                <option value="voucher">Voucher</option>
                <option value="other">Other</option>
              </Select>
            </label>
            <label>
              Internal note (optional)
              <input
                className="ds-input"
                value={refundNote}
                onChange={(e) => setRefundNote(e.target.value)}
              />
            </label>
          </div>
        ) : null}
      </ReceiptActionDialog>

      <ReceiptActionDialog
        open={paymentOpen}
        title="Change payment method"
        onClose={() => !actionBusy && setPaymentOpen(false)}
        error={actionError}
        success={actionSuccess}
        footer={
          <>
            <Button variant="link" onClick={() => setPaymentOpen(false)} disabled={actionBusy}>
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={handlePaymentChangeSubmit}
              disabled={actionBusy}
            >
              {actionBusy ? "Processing…" : "Confirm change"}
            </Button>
          </>
        }
      >
        {receipt ? (
          <div style={{ display: "grid", gap: 12 }}>
            <MetaField label="Receipt number">{receipt.receiptNumber ?? "—"}</MetaField>
            <MetaField label="Current payment method">
              {formatPaymentMethod(receipt.paymentMethod)}
            </MetaField>
            <MetaField label="Amount">
              {formatMoney(receipt.grossCents, receipt.currency)}
            </MetaField>
            <label>
              New payment method
              <Select
                value={newPaymentMethod}
                onChange={(e) =>
                  setNewPaymentMethod(e.target.value as PaymentMethodBucket)
                }
              >
                <option value="cash">Cash</option>
                <option value="card">Card</option>
                <option value="voucher">Voucher</option>
                <option value="other">Other</option>
              </Select>
            </label>
            <label>
              Reason
              <input
                className="ds-input"
                value={paymentReason}
                onChange={(e) => setPaymentReason(e.target.value)}
              />
            </label>
            <label>
              Internal note (optional)
              <input
                className="ds-input"
                value={paymentNote}
                onChange={(e) => setPaymentNote(e.target.value)}
              />
            </label>
          </div>
        ) : null}
      </ReceiptActionDialog>
    </div>
  );
}
