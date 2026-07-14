import React from "react";
import { createPortal } from "react-dom";
import { formatMinorUnits } from "../../lib/money/formatMinorUnits";
import {
  fetchPortalOrderDetail,
  type PortalOrderDetailResponse,
} from "../../lib/portalApi";
import type { PosOrderRow } from "../../lib/orders/types";
import { OrderStatusBadge } from "./OrderStatusBadge";
import { OrderTimeline } from "./OrderTimeline";
import { ReceiptEventsTimeline } from "../receipts/ReceiptEventsTimeline";
import type { ReceiptEventRow } from "../../lib/receipts/types";

type OrderDetailDrawerLabels = {
  title: string;
  orderNumber: string;
  receiptNumber: string;
  cashier: string;
  businessDate: string;
  status: string;
  products: string;
  discounts: string;
  tax: string;
  net: string;
  gross: string;
  payments: string;
  receipt: string;
  timeline: string;
  timelineEmpty: string;
  receiptTimeline: string;
  receiptTimelineEmpty: string;
  refundedAmount: string;
  paymentChanged: string;
  close: string;
  dash: string;
  colProduct: string;
  colQuantity: string;
  colUnitPrice: string;
  colLineTotal: string;
  colPayment: string;
  colAmount: string;
  viewReceipt: string;
  provider: string;
  providerOrderId: string;
  customer: string;
  phone: string;
  email: string;
  deliveryAddress: string;
  customerNote: string;
  paymentStatus: string;
  platform: string;
  orderSource: string;
  onlineOrderBadge: string;
};

export function OrderDetailDrawer({
  open,
  order,
  labels,
  locale,
  timezone,
  detailRefreshKey,
  onClose,
  onViewReceipt,
  formatPayment,
}: {
  open: boolean;
  order: PosOrderRow | null;
  labels: OrderDetailDrawerLabels;
  locale: string;
  timezone: string;
  detailRefreshKey?: number | null;
  onClose: () => void;
  onViewReceipt?: (receiptId: string) => void;
  formatPayment: (method: string | null | undefined) => string;
}) {
  const titleId = React.useId();
  const panelRef = React.useRef<HTMLElement>(null);
  const closeBtnRef = React.useRef<HTMLButtonElement>(null);
  const [detail, setDetail] = React.useState<PortalOrderDetailResponse | null>(
    null,
  );
  const [loading, setLoading] = React.useState(false);

  const requestClose = React.useCallback(
    (event?: React.MouseEvent<HTMLButtonElement>) => {
      event?.stopPropagation();
      event?.preventDefault();
      onClose();
    },
    [onClose],
  );

  React.useEffect(() => {
    if (!open) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prevOverflow;
    };
  }, [open]);

  React.useEffect(() => {
    if (!open) return;
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open, onClose]);

  React.useEffect(() => {
    if (open) closeBtnRef.current?.focus();
  }, [open]);

  React.useEffect(() => {
    if (!open || !order) {
      setDetail(null);
      return;
    }

    let cancelled = false;
    setLoading(true);
    void fetchPortalOrderDetail(order.id)
      .then((response) => {
        if (!cancelled) setDetail(response);
      })
      .catch(() => {
        if (!cancelled) setDetail(order.source as PortalOrderDetailResponse);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [open, order, detailRefreshKey]);

  if (!open || !order) return null;

  const data = detail ?? (order.source as PortalOrderDetailResponse);
  const currency = data.currency || "EUR";
  const money = (minor: number) => formatMinorUnits(minor, currency, locale);
  const paymentLabel = data.isProviderOrder
    ? data.paymentDisplay || formatPayment(data.paymentMethod)
    : formatPayment(data.paymentMethod);

  const receiptEvents: ReceiptEventRow[] = (data.receiptTimeline ?? []).map(
    (event) => ({
      id: event.id,
      kind: event.kind as ReceiptEventRow["kind"],
      label: event.label,
      time: new Intl.DateTimeFormat(locale, {
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        timeZone: timezone,
      }).format(new Date(event.occurredAt)),
      actor: event.actor ?? labels.dash,
      summary: event.summary ?? event.actor ?? labels.dash,
    }),
  );

  return createPortal(
    <div className="receipt-detail-root">
      <button
        type="button"
        className="receipt-detail-backdrop"
        aria-label={labels.close}
        onClick={requestClose}
      />
      <aside
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="receipt-detail-panel receipt-detail-panel--wide order-detail-panel"
        onClick={(event) => event.stopPropagation()}
      >
        <header className="receipt-detail-head">
          <div className="order-detail-head-row">
            <div>
              <h2 id={titleId} className="receipt-detail-title">
                {labels.title}
              </h2>
              <p className="receipt-detail-subtitle">{order.orderNumber}</p>
            </div>
            <div className="order-detail-head-actions">
              <div className="order-detail-head-badges">
                <OrderStatusBadge status={order.statusKey} label={order.status} />
                {data.isProviderOrder ? (
                  <span className="order-detail-provider-badge">
                    {data.providerName?.trim() || labels.onlineOrderBadge}
                  </span>
                ) : null}
              </div>
              <button
                type="button"
                className="receipt-detail-dismiss-btn"
                aria-label={labels.close}
                onClick={requestClose}
              >
                ×
              </button>
            </div>
          </div>
        </header>

        <dl className="receipt-detail-grid">
          <div className="receipt-detail-row">
            <dt>{labels.orderNumber}</dt>
            <dd>{order.orderNumber}</dd>
          </div>
          <div className="receipt-detail-row">
            <dt>{labels.receiptNumber}</dt>
            <dd>
              {data.receiptNumber?.trim() || labels.dash}
              {data.receiptId && onViewReceipt ? (
                <button
                  type="button"
                  className="order-receipt-link-btn"
                  onClick={() => onViewReceipt(data.receiptId!)}
                >
                  {labels.viewReceipt}
                </button>
              ) : null}
            </dd>
          </div>
          <div className="receipt-detail-row">
            <dt>{labels.cashier}</dt>
            <dd>{order.cashier}</dd>
          </div>
          <div className="receipt-detail-row">
            <dt>{labels.businessDate}</dt>
            <dd>{data.businessDate ?? labels.dash}</dd>
          </div>
          <div className="receipt-detail-row">
            <dt>{labels.status}</dt>
            <dd>
              <OrderStatusBadge status={order.statusKey} label={order.status} />
            </dd>
          </div>
          <div className="receipt-detail-row">
            <dt>{labels.colPayment}</dt>
            <dd>{paymentLabel}</dd>
          </div>
          {data.platform?.trim() ? (
            <div className="receipt-detail-row">
              <dt>{labels.platform}</dt>
              <dd>{data.platform}</dd>
            </div>
          ) : null}
          {data.isProviderOrder ? (
            <div className="receipt-detail-row">
              <dt>{labels.orderSource}</dt>
              <dd>{data.orderSource}</dd>
            </div>
          ) : null}
          {data.isProviderOrder && data.providerName?.trim() ? (
            <div className="receipt-detail-row">
              <dt>{labels.provider}</dt>
              <dd>{data.providerName}</dd>
            </div>
          ) : null}
          {data.providerOrderId?.trim() ? (
            <div className="receipt-detail-row">
              <dt>{labels.providerOrderId}</dt>
              <dd>{data.providerOrderId}</dd>
            </div>
          ) : null}
          {data.customerName?.trim() ? (
            <div className="receipt-detail-row">
              <dt>{labels.customer}</dt>
              <dd>{data.customerName}</dd>
            </div>
          ) : null}
          {data.customerPhone?.trim() ? (
            <div className="receipt-detail-row">
              <dt>{labels.phone}</dt>
              <dd>{data.customerPhone}</dd>
            </div>
          ) : null}
          {data.customerEmail?.trim() ? (
            <div className="receipt-detail-row">
              <dt>{labels.email}</dt>
              <dd>{data.customerEmail}</dd>
            </div>
          ) : null}
          {data.deliveryAddress?.trim() ? (
            <div className="receipt-detail-row">
              <dt>{labels.deliveryAddress}</dt>
              <dd>{data.deliveryAddress}</dd>
            </div>
          ) : null}
          {data.customerNote?.trim() ? (
            <div className="receipt-detail-row">
              <dt>{labels.customerNote}</dt>
              <dd>{data.customerNote}</dd>
            </div>
          ) : null}
        </dl>

        {data.refundedAmountCents > 0 ? (
          <p className="order-detail-refund-note">
            {labels.refundedAmount}: {money(data.refundedAmountCents)}
          </p>
        ) : null}

        {data.hasPaymentChange ? (
          <p className="order-detail-payment-change-note">{labels.paymentChanged}</p>
        ) : null}

        <section className="receipt-detail-items">
          <h3 className="receipt-detail-items-title">{labels.products}</h3>
          {loading ? (
            <p className="receipt-detail-items-empty">…</p>
          ) : data.lines.length === 0 ? (
            <p className="receipt-detail-items-empty">{labels.dash}</p>
          ) : (
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
                  {data.lines.map((line, index) => (
                    <tr key={`${line.sku ?? line.productName ?? "line"}-${index}`}>
                      <td className="receipt-detail-items-col-product">
                        {line.productName?.trim() || line.sku || labels.dash}
                      </td>
                      <td className="receipt-detail-items-col-qty">{line.quantity}</td>
                      <td className="receipt-detail-items-col-money">
                        {money(line.unitPriceCents)}
                      </td>
                      <td className="receipt-detail-items-col-money">
                        {money(line.lineTotalCents)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <dl className="receipt-detail-grid receipt-detail-totals">
          <div className="receipt-detail-row">
            <dt>{labels.discounts}</dt>
            <dd>{money(data.discountCents ?? 0)}</dd>
          </div>
          <div className="receipt-detail-row">
            <dt>{labels.tax}</dt>
            <dd>{money(data.taxCents ?? 0)}</dd>
          </div>
          <div className="receipt-detail-row">
            <dt>{labels.net}</dt>
            <dd>{money(data.netCents ?? data.amountCents)}</dd>
          </div>
          <div className="receipt-detail-row">
            <dt>{labels.gross}</dt>
            <dd>{money(data.amountCents)}</dd>
          </div>
        </dl>

        {data.payments?.length ? (
          <section className="receipt-detail-section">
            <h3 className="receipt-detail-section-title">{labels.payments}</h3>
            <ul className="order-payments-list">
              {data.payments.map((payment, index) => (
                <li key={`${payment.method}-${index}`}>
                  <span>{formatPayment(payment.method)}</span>
                  <span>{money(payment.amountCents)}</span>
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        <OrderTimeline
          events={data.timeline ?? []}
          locale={locale}
          timezone={timezone}
          title={labels.timeline}
          emptyLabel={labels.timelineEmpty}
        />

        {data.receipt ? (
          <ReceiptEventsTimeline
            events={receiptEvents}
            title={labels.receiptTimeline}
            emptyLabel={labels.receiptTimelineEmpty}
            loading={loading}
          />
        ) : null}

        <footer className="receipt-detail-footer">
          <button
            ref={closeBtnRef}
            type="button"
            className="receipt-detail-close-btn"
            onClick={requestClose}
          >
            {labels.close}
          </button>
        </footer>
      </aside>
    </div>,
    document.body,
  );
}
