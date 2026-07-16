import { useEffect, useId, useRef, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { formatDocumentDateTime } from "../../lib/documents/formatters";
import { formatMinorUnits } from "../../lib/money/formatMinorUnits";
import type { DocumentIdentity } from "../../lib/documents/types";
import type { PortalReceiptDetailResponse } from "../../lib/portalApi";
import { OrderPaymentBadge } from "../orders/OrderPaymentBadge";
import { OrderTimeline, type CaistyActivityEvent } from "../orders/OrderTimeline";
import type { ReceiptEventRow } from "../../lib/receipts/types";

function isFiscalPending(status: string): boolean {
  return status.trim().toLowerCase() === "pending";
}

function fiscalBadgeClass(status: string): string {
  const s = status.trim().toLowerCase();
  if (s === "pending") return "caisty-badge caisty-badge--warning";
  if (s === "signed" || s === "ok" || s === "completed") {
    return "caisty-badge caisty-badge--success";
  }
  if (s === "failed" || s === "error") return "caisty-badge caisty-badge--danger";
  return "caisty-badge caisty-badge--neutral";
}

function DrawerFact({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <div className="caisty-drawer-fact">
      <dt className="caisty-drawer-fact-label">{label}</dt>
      <dd className="caisty-drawer-fact-value">{children}</dd>
    </div>
  );
}

function DrawerSection({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <section className="caisty-drawer-section">
      <h3 className="caisty-drawer-section-title">{title}</h3>
      {children}
    </section>
  );
}

export function ReceiptPortalDetailDrawer({
  open,
  detail,
  detailLoading,
  events: _events,
  printStats,
  refundSummary,
  identity,
  labels,
  locale,
  timezone,
  onClose,
  onPrint,
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
    sectionOverview: string;
    sectionPos: string;
    sectionPayment: string;
    sectionFiscal: string;
    sectionActivity: string;
    sectionProducts: string;
    sectionTotals: string;
    printReceipt: string;
    paymentPending: string;
    paymentPaid: string;
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
  onPrint?: () => void;
}) {
  const titleId = useId();
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

  const paymentMethod = receipt?.paymentMethod?.trim() || labels.dash;
  const paymentStatus =
    receipt?.status === "voided" || receipt?.status === "refunded"
      ? "cancelled"
      : "paid";

  const activityEvents: CaistyActivityEvent[] = (detail?.timeline ?? []).map(
    (event) => ({
      id: event.id,
      kind: event.kind,
      label: event.label,
      occurredAt: event.occurredAt,
      actor: event.actor,
      summary: event.summary,
      source: "receipt" as const,
    }),
  );

  return createPortal(
    <div className="receipt-detail-root">
      <button
        type="button"
        className="receipt-detail-backdrop"
        aria-label={labels.close}
        onClick={onClose}
      />
      <aside
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="receipt-detail-panel receipt-detail-panel--wide caisty-drawer"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="caisty-drawer-hero">
          <div className="caisty-drawer-hero-top">
            <div className="caisty-drawer-hero-identity">
              <p className="caisty-drawer-kicker">{labels.title}</p>
              <h2 id={titleId} className="caisty-drawer-order-id">
                {receiptNumber}
              </h2>
            </div>
            <button
              ref={closeBtnRef}
              type="button"
              className="caisty-drawer-dismiss"
              aria-label={labels.close}
              onClick={onClose}
            >
              ×
            </button>
          </div>

          <div className="caisty-drawer-hero-amount tabular-nums">
            {receipt ? formatMoney(receipt.grossCents) : labels.dash}
          </div>

          <div className="caisty-drawer-hero-badges">
            <span
              className={
                receipt?.status === "active"
                  ? "caisty-badge caisty-badge--success"
                  : receipt?.status === "refunded" ||
                      receipt?.status === "partial_refund"
                    ? "caisty-badge caisty-badge--danger"
                    : "caisty-badge caisty-badge--neutral"
              }
            >
              {statusLabel}
            </span>
            <OrderPaymentBadge
              status={paymentStatus}
              methodLabel={paymentMethod}
              pendingLabel={labels.paymentPending}
              paidLabel={labels.paymentPaid}
            />
            {receipt ? (
              <span className={fiscalBadgeClass(receipt.fiscalStatus)}>
                {receipt.fiscalStatus}
              </span>
            ) : null}
          </div>

          <p className="caisty-drawer-hero-meta">
            <span>{issuedAtLabel}</span>
          </p>
        </header>

        <div className="caisty-drawer-body">
          {detailLoading || !receipt ? (
            <div
              className="caisty-drawer-skeleton-stack caisty-drawer-skeleton-stack--body"
              aria-hidden="true"
            >
              <div className="caisty-drawer-skeleton-block" />
              <div className="caisty-drawer-skeleton-line" />
              <div className="caisty-drawer-skeleton-line caisty-drawer-skeleton-line--short" />
            </div>
          ) : (
            <>
              {showFiscalPending ? (
                <div className="caisty-drawer-alerts">
                  <p className="caisty-drawer-notice caisty-drawer-notice--attention">
                    {labels.fiscalPending}
                  </p>
                </div>
              ) : null}

              {refundSummary && refundSummary.refundedAmountCents > 0 ? (
                <div className="caisty-drawer-alerts">
                  <p className="caisty-drawer-notice caisty-drawer-notice--danger">
                    {labels.refundedAmount}:{" "}
                    {formatMoney(refundSummary.refundedAmountCents)}
                  </p>
                </div>
              ) : null}

              <DrawerSection title={labels.sectionOverview}>
                <dl className="caisty-drawer-facts">
                  <DrawerFact label={labels.receipt}>{receiptNumber}</DrawerFact>
                  <DrawerFact label={labels.status}>{statusLabel}</DrawerFact>
                  <DrawerFact label={labels.payment}>{paymentMethod}</DrawerFact>
                  <DrawerFact label={labels.grossTotal}>
                    <span className="tabular-nums">
                      {formatMoney(receipt.grossCents)}
                    </span>
                  </DrawerFact>
                  <DrawerFact label={labels.date}>{issuedAtLabel}</DrawerFact>
                </dl>
              </DrawerSection>

              <DrawerSection title={labels.sectionPos}>
                <dl className="caisty-drawer-facts">
                  <DrawerFact label={labels.business}>
                    {identity?.businessName || labels.dash}
                  </DrawerFact>
                  <DrawerFact label={labels.store}>
                    {identity?.storeName || labels.dash}
                  </DrawerFact>
                  <DrawerFact label={labels.device}>
                    {receipt.deviceName || labels.dash}
                  </DrawerFact>
                  {receipt.localOrderId ? (
                    <DrawerFact label={labels.receipt}>
                      {receipt.localOrderId}
                    </DrawerFact>
                  ) : null}
                </dl>
              </DrawerSection>

              <DrawerSection title={labels.sectionProducts}>
                {receipt.items.length > 0 ? (
                  <div className="caisty-drawer-items-scroll">
                    <table className="caisty-drawer-items-table">
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
                          <tr key={`${line.sku ?? "line"}-${index}`}>
                            <td>
                              {line.productName || line.sku || labels.dash}
                            </td>
                            <td>{line.quantity}</td>
                            <td className="tabular-nums">
                              {formatMoney(line.unitPriceCents)}
                            </td>
                            <td className="tabular-nums">
                              {formatMoney(line.lineTotalCents)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <p className="caisty-drawer-empty">{labels.itemsEmpty}</p>
                )}
              </DrawerSection>

              <DrawerSection title={labels.sectionTotals}>
                <dl className="caisty-drawer-totals">
                  <div className="caisty-drawer-total-row">
                    <dt>{labels.netTotal}</dt>
                    <dd className="tabular-nums">
                      {formatMoney(receipt.netCents)}
                    </dd>
                  </div>
                  <div className="caisty-drawer-total-row">
                    <dt>{labels.taxTotal}</dt>
                    <dd className="tabular-nums">
                      {formatMoney(receipt.taxCents)}
                    </dd>
                  </div>
                  <div className="caisty-drawer-total-row caisty-drawer-total-row--gross">
                    <dt>{labels.grossTotal}</dt>
                    <dd className="tabular-nums">
                      {formatMoney(receipt.grossCents)}
                    </dd>
                  </div>
                </dl>
              </DrawerSection>

              <DrawerSection title={labels.sectionPayment}>
                <dl className="caisty-drawer-facts">
                  <DrawerFact label={labels.currentPaymentMethod}>
                    {paymentMethod}
                  </DrawerFact>
                  <DrawerFact label={labels.amount}>
                    <span className="tabular-nums">
                      {formatMoney(receipt.grossCents)}
                    </span>
                  </DrawerFact>
                  <DrawerFact label={labels.status}>{statusLabel}</DrawerFact>
                </dl>
              </DrawerSection>

              <DrawerSection title={labels.sectionFiscal}>
                <dl className="caisty-drawer-facts">
                  <DrawerFact label={labels.fiscal}>
                    <span className={fiscalBadgeClass(receipt.fiscalStatus)}>
                      {receipt.fiscalStatus}
                    </span>
                  </DrawerFact>
                </dl>
              </DrawerSection>

              <DrawerSection title={labels.printStatsTitle}>
                <dl className="caisty-drawer-facts">
                  <DrawerFact label={labels.originalPrint}>
                    {printStats.originalPrint}
                  </DrawerFact>
                  <DrawerFact label={labels.reprintCount}>
                    {printStats.reprintCount}
                  </DrawerFact>
                  <DrawerFact label={labels.lastPrintTime}>
                    {printStats.lastPrintTime}
                  </DrawerFact>
                </dl>
              </DrawerSection>

              <OrderTimeline
                events={activityEvents}
                locale={locale}
                timezone={timezone}
                title={labels.sectionActivity}
                emptyLabel={labels.historyEmpty}
                loading={detailLoading}
                sourceLabels={{
                  order: labels.receipt,
                  receipt: labels.receipt,
                }}
              />
            </>
          )}
        </div>

        <footer className="caisty-drawer-footer">
          <div className="caisty-drawer-footer-actions">
            {onPrint ? (
              <button
                type="button"
                className="caisty-drawer-footer-secondary"
                onClick={onPrint}
                disabled={!receipt || detailLoading}
              >
                {labels.printReceipt}
              </button>
            ) : null}
          </div>
          <button
            type="button"
            className="caisty-drawer-footer-primary"
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
