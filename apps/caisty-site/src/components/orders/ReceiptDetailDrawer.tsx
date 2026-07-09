import { useEffect, useId, useRef } from "react";
import { createPortal } from "react-dom";
import { formatDocumentDateTime } from "../../lib/documents/formatters";
import type { DocumentIdentity } from "../../lib/documents/types";
import type { PosReceiptRow } from "../../lib/orders/types";

function isFiscalPending(status: string): boolean {
  return status.trim().toLowerCase() === "pending";
}

export function ReceiptDetailDrawer({
  open,
  receipt,
  identity,
  labels,
  locale,
  timezone,
  onClose,
}: {
  open: boolean;
  receipt: PosReceiptRow | null;
  identity: DocumentIdentity | null;
  labels: {
    title: string;
    business: string;
    store: string;
    receipt: string;
    time: string;
    customer: string;
    payment: string;
    fiscal: string;
    amount: string;
    device: string;
    fiscalPending: string;
    itemsTitle: string;
    itemsEmpty: string;
    colProduct: string;
    colQuantity: string;
    colUnitPrice: string;
    colLineTotal: string;
    close: string;
    dash: string;
  };
  locale: string;
  timezone: string;
  onClose: () => void;
}) {
  const titleId = useId();
  const panelRef = useRef<HTMLElement>(null);
  const closeBtnRef = useRef<HTMLButtonElement>(null);

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

  if (!open || !receipt) return null;

  const issuedAtLabel = receipt.source.issuedAt
    ? formatDocumentDateTime(
        new Date(receipt.source.issuedAt),
        locale,
        timezone,
      )
    : labels.dash;

  const showFiscalPending = isFiscalPending(receipt.source.fiscalStatus);

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
        className="receipt-detail-panel"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="receipt-detail-head">
          <h2 id={titleId} className="receipt-detail-title">
            {labels.title}
          </h2>
          <p className="receipt-detail-subtitle">{receipt.receiptNumber}</p>
        </header>

        <dl className="receipt-detail-grid">
          <div className="receipt-detail-row">
            <dt>{labels.receipt}</dt>
            <dd>{receipt.receiptNumber}</dd>
          </div>
          <div className="receipt-detail-row">
            <dt>{labels.time}</dt>
            <dd>{issuedAtLabel}</dd>
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
            <dd>{receipt.payment}</dd>
          </div>
          <div className="receipt-detail-row">
            <dt>{labels.fiscal}</dt>
            <dd>{receipt.fiscal}</dd>
          </div>
          <div className="receipt-detail-row">
            <dt>{labels.amount}</dt>
            <dd>{receipt.amount}</dd>
          </div>
          <div className="receipt-detail-row">
            <dt>{labels.device}</dt>
            <dd>{labels.dash}</dd>
          </div>
          <div className="receipt-detail-row">
            <dt>{labels.customer}</dt>
            <dd>{receipt.customer}</dd>
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
                    <th scope="col" className="receipt-detail-items-col-product">
                      {labels.colProduct}
                    </th>
                    <th scope="col" className="receipt-detail-items-col-qty">
                      {labels.colQuantity}
                    </th>
                    <th scope="col" className="receipt-detail-items-col-money">
                      {labels.colUnitPrice}
                    </th>
                    <th scope="col" className="receipt-detail-items-col-money">
                      {labels.colLineTotal}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {receipt.items.map((line, index) => (
                    <tr key={`${line.product}-${index}`}>
                      <td className="receipt-detail-items-col-product">
                        {line.product}
                      </td>
                      <td className="receipt-detail-items-col-qty">
                        {line.quantity}
                      </td>
                      <td className="receipt-detail-items-col-money">
                        {line.unitPrice}
                      </td>
                      <td className="receipt-detail-items-col-money">
                        {line.total}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="receipt-detail-items-empty">{labels.itemsEmpty}</p>
          )}
        </section>

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
