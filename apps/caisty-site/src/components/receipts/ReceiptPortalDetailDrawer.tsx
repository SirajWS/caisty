import { useEffect, useId, useRef } from "react";
import { createPortal } from "react-dom";
import { formatDocumentDateTime } from "../../lib/documents/formatters";
import { formatMinorUnits } from "../../lib/money/formatMinorUnits";
import type { DocumentIdentity } from "../../lib/documents/types";
import type { PortalReceiptDetailResponse } from "../../lib/portalApi";
import { portalReceiptStatusBadge } from "../../lib/portalUi";
import { ReceiptEventsTimeline } from "./ReceiptEventsTimeline";
import type { ReceiptEventRow } from "../../lib/receipts/types";

function isFiscalPending(status: string): boolean {
  return status.trim().toLowerCase() === "pending";
}

export function ReceiptPortalDetailDrawer({
  open,
  detail,
  detailLoading,
  events,
  printStats,
  refundSummary,
  identity,
  labels,
  locale,
  timezone,
  isLight,
  onClose,
}: {
  open: boolean;
  detail: PortalReceiptDetailResponse | null;
  detailLoading: boolean;
  events: ReceiptEventRow[];
  printStats: {
    originalPrint: string;
    reprintCount: string;
    lastPrintTime: string;
  };
  identity: DocumentIdentity | null;
  refundSummary?: {
    originalAmountCents: number;
    refundedAmountCents: number;
    refundableAmountCents: number;
    currency: string;
  } | null;
  labels: {
    title: string;
    business: string;
    store: string;
    receipt: string;
    date: string;
    time: string;
    customer: string;
    payment: string;
    fiscal: string;
    amount: string;
    device: string;
    status: string;
    fiscalPending: string;
    itemsTitle: string;
    itemsEmpty: string;
    colProduct: string;
    colQuantity: string;
    colUnitPrice: string;
    colLineTotal: string;
    totalsTitle: string;
    netTotal: string;
    taxTotal: string;
    grossTotal: string;
    printStatsTitle: string;
    originalPrint: string;
    reprintCount: string;
    lastPrintTime: string;
    historyTitle: string;
    historyEmpty: string;
    colEventTime: string;
    colEvent: string;
    colActor: string;
    close: string;
    dash: string;
    statusActive: string;
    statusRefunded: string;
    statusPartialRefund: string;
    statusVoided: string;
    refundedAmount: string;
    currentPaymentMethod: string;
  };
  locale: string;
  timezone: string;
  isLight: boolean;
  onClose: () => void;
}) {
  const titleId = useId();
  const panelRef = useRef<HTMLElement>(null);
  const closeBtnRef = useRef<HTMLButtonElement>(null);
  const receipt = detail?.receipt ?? null;

  useEffect(() => {
    if (!open) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prevOverflow;
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open, onClose]);

  useEffect(() => {
    if (open) closeBtnRef.current?.focus();
  }, [open]);

  if (!open) return null;

  const receiptNumber =
    receipt?.receiptNumber?.trim() ||
    receipt?.localReceiptId ||
    labels.dash;

  const issuedAtLabel = receipt?.issuedAt
    ? formatDocumentDateTime(new Date(receipt.issuedAt), locale, timezone)
    : labels.dash;

  const statusLabel =
    receipt?.status === "active"
      ? labels.statusActive
      : receipt?.status === "refunded"
        ? labels.statusRefunded
        : receipt?.status === "partial_refund"
          ? labels.statusPartialRefund
          : receipt?.status === "voided"
            ? labels.statusVoided
            : labels.dash;

  const currency = receipt?.currency ?? "EUR";
  const formatMoney = (minor: number) =>
    formatMinorUnits(minor, currency, locale);

  const showFiscalPending = receipt
    ? isFiscalPending(receipt.fiscalStatus)
    : false;

  return createPortal(
    <div className="receipt-detail-root">
      <button
        type="button"
        className="receipt-detail-backdrop"
        aria-label={labels.close}
        onClick={onClose}
      />
      <aside
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="receipt-detail-panel receipt-detail-panel--wide"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="receipt-detail-head">
          <h2 id={titleId} className="receipt-detail-title">
            {labels.title}
          </h2>
          <p className="receipt-detail-subtitle">{receiptNumber}</p>
        </header>

        {detailLoading || !receipt ? (
          <p className="dashboard-text-muted receipt-detail-loading">…</p>
        ) : (
          <>
            <dl className="receipt-detail-grid">
              <div className="receipt-detail-row">
                <dt>{labels.receipt}</dt>
                <dd>{receiptNumber}</dd>
              </div>
              <div className="receipt-detail-row">
                <dt>{labels.date}</dt>
                <dd>{issuedAtLabel}</dd>
              </div>
              <div className="receipt-detail-row">
                <dt>{labels.status}</dt>
                <dd>
                  <span className={portalReceiptStatusBadge(receipt.status, isLight)}>
                    {statusLabel}
                  </span>
                </dd>
              </div>
              <div className="receipt-detail-row">
                <dt>{labels.business}</dt>
                <dd>{identity?.businessName || labels.dash}</dd>
              </div>
              <div className="receipt-detail-row">
                <dt>{labels.store}</dt>
                <dd>{identity?.storeName || labels.dash}</dd>
              </div>
              <div className="receipt-detail-row">
                <dt>{labels.payment}</dt>
                <dd>{receipt.paymentMethod || labels.dash}</dd>
              </div>
              {refundSummary && refundSummary.refundedAmountCents > 0 ? (
                <div className="receipt-detail-row">
                  <dt>{labels.refundedAmount}</dt>
                  <dd>{formatMoney(refundSummary.refundedAmountCents)}</dd>
                </div>
              ) : null}
              <div className="receipt-detail-row">
                <dt>{labels.fiscal}</dt>
                <dd>{receipt.fiscalStatus}</dd>
              </div>
              <div className="receipt-detail-row">
                <dt>{labels.amount}</dt>
                <dd>{formatMoney(receipt.grossCents)}</dd>
              </div>
              <div className="receipt-detail-row">
                <dt>{labels.device}</dt>
                <dd>{receipt.deviceName || labels.dash}</dd>
              </div>
            </dl>

            {showFiscalPending ? (
              <p className="receipt-detail-notice">{labels.fiscalPending}</p>
            ) : null}

            <section className="receipt-detail-items">
              <h3 className="receipt-detail-items-title">{labels.itemsTitle}</h3>
              {receipt.items.length > 0 ? (
                <div className="receipt-detail-items-scroll">
                  <table className="receipt-detail-items-table">
                    <thead>
                      <tr>
                        <th scope="col">{labels.colProduct}</th>
                        <th scope="col">{labels.colQuantity}</th>
                        <th scope="col">{labels.colUnitPrice}</th>
                        <th scope="col">{labels.colLineTotal}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {receipt.items.map((line, index) => (
                        <tr key={`${line.sku}-${index}`}>
                          <td>{line.productName || line.sku || labels.dash}</td>
                          <td>{line.quantity}</td>
                          <td>{formatMoney(line.unitPriceCents)}</td>
                          <td>{formatMoney(line.lineTotalCents)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="receipt-detail-items-empty">{labels.itemsEmpty}</p>
              )}
            </section>

            <section className="receipt-detail-section">
              <h3 className="receipt-detail-section-title">{labels.totalsTitle}</h3>
              <dl className="receipt-detail-totals">
                <div className="receipt-detail-row">
                  <dt>{labels.netTotal}</dt>
                  <dd>{formatMoney(receipt.netCents)}</dd>
                </div>
                <div className="receipt-detail-row">
                  <dt>{labels.taxTotal}</dt>
                  <dd>{formatMoney(receipt.taxCents)}</dd>
                </div>
                <div className="receipt-detail-row">
                  <dt>{labels.grossTotal}</dt>
                  <dd>{formatMoney(receipt.grossCents)}</dd>
                </div>
              </dl>
            </section>

            <section className="receipt-detail-section">
              <h3 className="receipt-detail-section-title">{labels.printStatsTitle}</h3>
              <dl className="receipt-detail-totals">
                <div className="receipt-detail-row">
                  <dt>{labels.originalPrint}</dt>
                  <dd>{printStats.originalPrint}</dd>
                </div>
                <div className="receipt-detail-row">
                  <dt>{labels.reprintCount}</dt>
                  <dd>{printStats.reprintCount}</dd>
                </div>
                <div className="receipt-detail-row">
                  <dt>{labels.lastPrintTime}</dt>
                  <dd>{printStats.lastPrintTime}</dd>
                </div>
              </dl>
            </section>

            <ReceiptEventsTimeline
              events={events}
              title={labels.historyTitle}
              emptyLabel={labels.historyEmpty}
              loading={detailLoading}
            />
          </>
        )}

        <footer className="receipt-detail-footer">
          <button
            ref={closeBtnRef}
            type="button"
            className="receipt-detail-close-btn"
            onClick={onClose}
          >
            {labels.close}
          </button>
        </footer>
      </aside>
    </div>,
    document.body,
  );
}
