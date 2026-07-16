import React from "react";
import { createPortal } from "react-dom";
import { formatMinorUnits } from "../../lib/money/formatMinorUnits";
import {
  fetchPortalOrderDetail,
  type PortalOrderDetailResponse,
  type PortalReceiptTimelineEntry,
} from "../../lib/portalApi";
import type { PosOrderRow } from "../../lib/orders/types";
import { OrderStatusBadge } from "./OrderStatusBadge";
import { OrderPaymentBadge } from "./OrderPaymentBadge";
import { OrderTimeline, mergeActivityEvents } from "./OrderTimeline";

type OrderDetailDrawerLabels = {
  title: string;
  orderNumber: string;
  receiptNumber: string;
  cashier: string;
  device: string;
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
  activityEmpty: string;
  sectionOverview: string;
  sectionCustomer: string;
  sectionPos: string;
  sectionProducts: string;
  sectionTotals: string;
  sectionActivity: string;
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
  paymentPending: string;
  paymentPaid: string;
  platform: string;
  orderSource: string;
  onlineOrderBadge: string;
  productsEmpty: string;
  sourceOrder: string;
  sourceReceipt: string;
  printOrder: string;
};

function DrawerFact({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
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
  children: React.ReactNode;
}) {
  return (
    <section className="caisty-drawer-section">
      <h3 className="caisty-drawer-section-title">{title}</h3>
      {children}
    </section>
  );
}

export function OrderDetailDrawer({
  open,
  order,
  labels,
  locale,
  timezone,
  detailRefreshKey,
  onClose,
  onViewReceipt,
  onPrintOrder,
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
  onPrintOrder?: () => void;
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
  const paymentMethodLabel = data.isProviderOrder
    ? data.paymentDisplay || formatPayment(data.paymentMethod)
    : formatPayment(data.paymentMethod);

  const soldAtIso = data.soldAt ?? order.source.soldAt;
  const timeLabel = soldAtIso
    ? new Intl.DateTimeFormat(locale, {
        hour: "2-digit",
        minute: "2-digit",
        timeZone: timezone,
      }).format(new Date(soldAtIso))
    : order.time;

  const dateLabel = soldAtIso
    ? new Intl.DateTimeFormat(locale, {
        weekday: "short",
        month: "short",
        day: "numeric",
        timeZone: timezone,
      }).format(new Date(soldAtIso))
    : (data.businessDate ?? labels.dash);

  const hasCustomerSection = Boolean(
    data.customerName?.trim() ||
      data.customerPhone?.trim() ||
      data.customerEmail?.trim() ||
      data.deliveryAddress?.trim() ||
      data.customerNote?.trim() ||
      data.providerName?.trim() ||
      data.platform?.trim() ||
      data.providerOrderId?.trim() ||
      data.isProviderOrder,
  );

  const cashierLabel =
    data.cashier?.trim() || order.cashier?.trim() || labels.dash;
  const deviceLabel =
    data.deviceName?.trim() || order.device?.trim() || labels.dash;
  const hasPosSection = Boolean(
    (cashierLabel && cashierLabel !== labels.dash) ||
      (deviceLabel && deviceLabel !== labels.dash) ||
      data.receiptNumber?.trim() ||
      data.receiptId ||
      !data.isProviderOrder,
  );

  const receiptTimelineRaw: PortalReceiptTimelineEntry[] =
    data.receiptTimeline ?? [];
  const activityEvents = mergeActivityEvents(
    data.timeline ?? [],
    receiptTimelineRaw,
  );

  const showAlerts =
    data.refundedAmountCents > 0 || Boolean(data.hasPaymentChange);

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
        className="receipt-detail-panel receipt-detail-panel--wide caisty-drawer order-detail-panel"
        onClick={(event) => event.stopPropagation()}
      >
        <header className="caisty-drawer-hero">
          <div className="caisty-drawer-hero-top">
            <div className="caisty-drawer-hero-identity">
              <p className="caisty-drawer-kicker">{labels.title}</p>
              <h2 id={titleId} className="caisty-drawer-order-id">
                {order.orderNumber}
              </h2>
            </div>
            <button
              ref={closeBtnRef}
              type="button"
              className="caisty-drawer-dismiss"
              aria-label={labels.close}
              onClick={requestClose}
            >
              ×
            </button>
          </div>

          <div className="caisty-drawer-hero-amount tabular-nums">
            {money(data.amountCents)}
          </div>

          <div className="caisty-drawer-hero-badges">
            <OrderStatusBadge status={order.statusKey} label={order.status} />
            <OrderPaymentBadge
              status={data.paymentStatus}
              methodLabel={paymentMethodLabel}
              pendingLabel={labels.paymentPending}
              paidLabel={labels.paymentPaid}
            />
            {data.isProviderOrder ? (
              <span className="caisty-badge caisty-badge--channel">
                {data.providerName?.trim() || labels.onlineOrderBadge}
              </span>
            ) : null}
          </div>

          <p className="caisty-drawer-hero-meta">
            <span>{timeLabel}</span>
            <span className="caisty-drawer-dot" aria-hidden="true">
              ·
            </span>
            <span>{dateLabel}</span>
            {data.businessDate ? (
              <>
                <span className="caisty-drawer-dot" aria-hidden="true">
                  ·
                </span>
                <span>
                  {labels.businessDate}: {data.businessDate}
                </span>
              </>
            ) : null}
          </p>
        </header>

        <div className="caisty-drawer-body">
        {loading && !detail ? (
          <div
            className="caisty-drawer-skeleton-stack caisty-drawer-skeleton-stack--body"
            aria-hidden="true"
          >
            <div className="caisty-drawer-skeleton-block" />
            <div className="caisty-drawer-skeleton-block" />
            <div className="caisty-drawer-skeleton-line" />
            <div className="caisty-drawer-skeleton-line caisty-drawer-skeleton-line--short" />
          </div>
        ) : (
          <>
            {showAlerts ? (
              <div className="caisty-drawer-alerts">
                {data.refundedAmountCents > 0 ? (
                  <p className="caisty-drawer-notice caisty-drawer-notice--danger">
                    {labels.refundedAmount}: {money(data.refundedAmountCents)}
                  </p>
                ) : null}
                {data.hasPaymentChange ? (
                  <p className="caisty-drawer-notice caisty-drawer-notice--attention">
                    {labels.paymentChanged}
                  </p>
                ) : null}
              </div>
            ) : null}

            <DrawerSection title={labels.sectionOverview}>
              <dl className="caisty-drawer-facts">
                <DrawerFact label={labels.orderNumber}>
                  {order.orderNumber}
                </DrawerFact>
                <DrawerFact label={labels.status}>
                  <OrderStatusBadge
                    status={order.statusKey}
                    label={order.status}
                  />
                </DrawerFact>
                <DrawerFact label={labels.colPayment}>
                  <OrderPaymentBadge
                    status={data.paymentStatus}
                    methodLabel={paymentMethodLabel}
                    pendingLabel={labels.paymentPending}
                    paidLabel={labels.paymentPaid}
                  />
                </DrawerFact>
                <DrawerFact label={labels.gross}>
                  <span className="tabular-nums">{money(data.amountCents)}</span>
                </DrawerFact>
                <DrawerFact label={labels.businessDate}>
                  {data.businessDate ?? labels.dash}
                </DrawerFact>
              </dl>
            </DrawerSection>

            {hasCustomerSection ? (
              <DrawerSection title={labels.sectionCustomer}>
                <dl className="caisty-drawer-facts">
                  {data.isProviderOrder ? (
                    <DrawerFact label={labels.orderSource}>
                      {data.orderSource}
                    </DrawerFact>
                  ) : null}
                  {data.providerName?.trim() ? (
                    <DrawerFact label={labels.provider}>
                      {data.providerName}
                    </DrawerFact>
                  ) : null}
                  {data.platform?.trim() ? (
                    <DrawerFact label={labels.platform}>
                      {data.platform}
                    </DrawerFact>
                  ) : null}
                  {data.providerOrderId?.trim() ? (
                    <DrawerFact label={labels.providerOrderId}>
                      {data.providerOrderId}
                    </DrawerFact>
                  ) : null}
                  {data.customerName?.trim() ? (
                    <DrawerFact label={labels.customer}>
                      {data.customerName}
                    </DrawerFact>
                  ) : null}
                  {data.customerPhone?.trim() ? (
                    <DrawerFact label={labels.phone}>
                      {data.customerPhone}
                    </DrawerFact>
                  ) : null}
                  {data.customerEmail?.trim() ? (
                    <DrawerFact label={labels.email}>
                      {data.customerEmail}
                    </DrawerFact>
                  ) : null}
                  {data.deliveryAddress?.trim() ? (
                    <DrawerFact label={labels.deliveryAddress}>
                      {data.deliveryAddress}
                    </DrawerFact>
                  ) : null}
                  {data.customerNote?.trim() ? (
                    <DrawerFact label={labels.customerNote}>
                      {data.customerNote}
                    </DrawerFact>
                  ) : null}
                </dl>
              </DrawerSection>
            ) : null}

            {hasPosSection ? (
              <DrawerSection title={labels.sectionPos}>
                <dl className="caisty-drawer-facts">
                  <DrawerFact label={labels.cashier}>{cashierLabel}</DrawerFact>
                  <DrawerFact label={labels.device}>{deviceLabel}</DrawerFact>
                  <DrawerFact label={labels.receiptNumber}>
                    <span className="caisty-drawer-receipt-cell">
                      {data.receiptNumber?.trim() || labels.dash}
                      {data.receiptId && onViewReceipt ? (
                        <button
                          type="button"
                          className="caisty-drawer-link-btn"
                          onClick={() => onViewReceipt(data.receiptId!)}
                        >
                          {labels.viewReceipt}
                        </button>
                      ) : null}
                    </span>
                  </DrawerFact>
                </dl>
              </DrawerSection>
            ) : null}

            <DrawerSection title={labels.sectionProducts}>
              {loading ? (
                <div className="caisty-drawer-skeleton-stack" aria-hidden="true">
                  <div className="caisty-drawer-skeleton-line" />
                  <div className="caisty-drawer-skeleton-line" />
                  <div className="caisty-drawer-skeleton-line caisty-drawer-skeleton-line--short" />
                </div>
              ) : data.lines.length === 0 ? (
                <p className="caisty-drawer-empty">{labels.productsEmpty}</p>
              ) : (
                <div className="caisty-drawer-items-scroll">
                  <table className="caisty-drawer-items-table">
                    <thead>
                      <tr>
                        <th
                          scope="col"
                          className="caisty-drawer-items-col-product"
                        >
                          {labels.colProduct}
                        </th>
                        <th scope="col" className="caisty-drawer-items-col-qty">
                          {labels.colQuantity}
                        </th>
                        <th
                          scope="col"
                          className="caisty-drawer-items-col-money"
                        >
                          {labels.colUnitPrice}
                        </th>
                        <th
                          scope="col"
                          className="caisty-drawer-items-col-money"
                        >
                          {labels.colLineTotal}
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.lines.map((line, index) => (
                        <tr
                          key={`${line.sku ?? line.productName ?? "line"}-${index}`}
                        >
                          <td className="caisty-drawer-items-col-product">
                            {line.productName?.trim() ||
                              line.sku ||
                              labels.dash}
                          </td>
                          <td className="caisty-drawer-items-col-qty">
                            {line.quantity}
                          </td>
                          <td className="caisty-drawer-items-col-money tabular-nums">
                            {money(line.unitPriceCents)}
                          </td>
                          <td className="caisty-drawer-items-col-money tabular-nums">
                            {money(line.lineTotalCents)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </DrawerSection>

            <DrawerSection title={labels.sectionTotals}>
              <dl className="caisty-drawer-totals">
                <div className="caisty-drawer-total-row">
                  <dt>{labels.discounts}</dt>
                  <dd className="tabular-nums">
                    {money(data.discountCents ?? 0)}
                  </dd>
                </div>
                <div className="caisty-drawer-total-row">
                  <dt>{labels.net}</dt>
                  <dd className="tabular-nums">
                    {money(data.netCents ?? data.amountCents)}
                  </dd>
                </div>
                <div className="caisty-drawer-total-row">
                  <dt>{labels.tax}</dt>
                  <dd className="tabular-nums">
                    {money(data.taxCents ?? 0)}
                  </dd>
                </div>
                <div className="caisty-drawer-total-row caisty-drawer-total-row--gross">
                  <dt>{labels.gross}</dt>
                  <dd className="tabular-nums">{money(data.amountCents)}</dd>
                </div>
              </dl>

              {data.payments?.length ? (
                <ul className="caisty-drawer-payments">
                  {data.payments.map((payment, index) => (
                    <li key={`${payment.method}-${index}`}>
                      <span>{formatPayment(payment.method)}</span>
                      <span className="tabular-nums">
                        {money(payment.amountCents)}
                      </span>
                    </li>
                  ))}
                </ul>
              ) : null}
            </DrawerSection>

            <OrderTimeline
              events={activityEvents}
              locale={locale}
              timezone={timezone}
              title={labels.sectionActivity}
              emptyLabel={labels.activityEmpty}
              loading={loading}
              sourceLabels={{
                order: labels.sourceOrder,
                receipt: labels.sourceReceipt,
              }}
            />
          </>
        )}
        </div>

        <footer className="caisty-drawer-footer">
          <div className="caisty-drawer-footer-actions">
            {onPrintOrder ? (
              <button
                type="button"
                className="caisty-drawer-footer-secondary"
                onClick={onPrintOrder}
              >
                {labels.printOrder}
              </button>
            ) : null}
            {data.receiptId && onViewReceipt ? (
              <button
                type="button"
                className="caisty-drawer-footer-secondary"
                onClick={() => onViewReceipt(data.receiptId!)}
              >
                {labels.viewReceipt}
              </button>
            ) : null}
          </div>
          <button
            type="button"
            className="caisty-drawer-footer-primary"
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
