import React from "react";
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
  onClose,
  onViewReceipt,
  formatPayment,
}: {
  open: boolean;
  order: PosOrderRow | null;
  labels: OrderDetailDrawerLabels;
  locale: string;
  timezone: string;
  onClose: () => void;
  onViewReceipt?: (receiptId: string) => void;
  formatPayment: (method: string | null | undefined) => string;
}) {
  const [detail, setDetail] = React.useState<PortalOrderDetailResponse | null>(
    null,
  );
  const [loading, setLoading] = React.useState(false);

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
  }, [open, order]);

  if (!open || !order) return null;

  const data = detail ?? (order.source as PortalOrderDetailResponse);
  const currency = data.currency || "EUR";
  const money = (minor: number) => formatMinorUnits(minor, currency, locale);

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

  return (
    <div className="portal-drawer-backdrop" role="presentation" onClick={onClose}>
      <aside
        className="portal-drawer receipt-detail-drawer order-detail-drawer"
        role="dialog"
        aria-modal="true"
        aria-label={labels.title}
        onClick={(event) => event.stopPropagation()}
      >
        <header className="portal-drawer-header">
          <h2 className="portal-drawer-title">{labels.title}</h2>
          <button type="button" className="portal-drawer-close" onClick={onClose}>
            {labels.close}
          </button>
        </header>

        <div className="portal-drawer-body">
          <dl className="receipt-detail-meta">
            <div>
              <dt>{labels.orderNumber}</dt>
              <dd>{order.orderNumber}</dd>
            </div>
            {data.isProviderOrder ? (
              <div>
                <dt>{labels.provider}</dt>
                <dd>
                  {data.providerName?.trim() || labels.onlineOrderBadge}
                </dd>
              </div>
            ) : null}
            {data.providerOrderId?.trim() ? (
              <div>
                <dt>{labels.providerOrderId}</dt>
                <dd>{data.providerOrderId}</dd>
              </div>
            ) : null}
            <div>
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
            <div>
              <dt>{labels.cashier}</dt>
              <dd>{order.cashier}</dd>
            </div>
            {data.customerName?.trim() ? (
              <div>
                <dt>{labels.customer}</dt>
                <dd>{data.customerName}</dd>
              </div>
            ) : null}
            {data.customerPhone?.trim() ? (
              <div>
                <dt>{labels.phone}</dt>
                <dd>{data.customerPhone}</dd>
              </div>
            ) : null}
            {data.deliveryAddress?.trim() ? (
              <div>
                <dt>{labels.deliveryAddress}</dt>
                <dd>{data.deliveryAddress}</dd>
              </div>
            ) : null}
            {data.customerNote?.trim() ? (
              <div>
                <dt>{labels.customerNote}</dt>
                <dd>{data.customerNote}</dd>
              </div>
            ) : null}
            <div>
              <dt>{labels.businessDate}</dt>
              <dd>{data.businessDate ?? labels.dash}</dd>
            </div>
            <div>
              <dt>{labels.status}</dt>
              <dd>
                <OrderStatusBadge status={order.statusKey} label={order.status} />
              </dd>
            </div>
            {data.isProviderOrder && data.paymentDisplay ? (
              <div>
                <dt>{labels.paymentStatus}</dt>
                <dd>{data.paymentDisplay}</dd>
              </div>
            ) : null}
            {data.platform?.trim() ? (
              <div>
                <dt>{labels.platform}</dt>
                <dd>{data.platform}</dd>
              </div>
            ) : null}
            {data.isProviderOrder ? (
              <div>
                <dt>{labels.orderSource}</dt>
                <dd>{data.orderSource}</dd>
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

          <section className="receipt-detail-section">
            <h3 className="receipt-detail-section-title">{labels.products}</h3>
            {loading ? (
              <p className="dashboard-text-muted">…</p>
            ) : data.lines.length === 0 ? (
              <p className="dashboard-text-muted">{labels.dash}</p>
            ) : (
              <table className="portal-table receipt-items-table">
                <thead>
                  <tr>
                    <th>{labels.colProduct}</th>
                    <th>{labels.colQuantity}</th>
                    <th>{labels.colUnitPrice}</th>
                    <th>{labels.colLineTotal}</th>
                  </tr>
                </thead>
                <tbody>
                  {data.lines.map((line, index) => (
                    <tr key={`${line.sku ?? line.productName ?? "line"}-${index}`}>
                      <td>{line.productName?.trim() || line.sku || labels.dash}</td>
                      <td>{line.quantity}</td>
                      <td>{money(line.unitPriceCents)}</td>
                      <td>{money(line.lineTotalCents)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </section>

          <dl className="receipt-detail-meta receipt-detail-totals">
            <div>
              <dt>{labels.discounts}</dt>
              <dd>{money(data.discountCents ?? 0)}</dd>
            </div>
            <div>
              <dt>{labels.tax}</dt>
              <dd>{money(data.taxCents ?? 0)}</dd>
            </div>
            <div>
              <dt>{labels.net}</dt>
              <dd>{money(data.netCents ?? data.amountCents)}</dd>
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
        </div>
      </aside>
    </div>
  );
}
