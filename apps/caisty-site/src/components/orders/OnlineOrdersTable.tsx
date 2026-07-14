import { Link } from "react-router-dom";
import type { ProviderOrderRow } from "../../lib/orders/types";
import { OrderStatusBadge } from "./OrderStatusBadge";

export function OnlineOrdersTable({
  orders,
  loading,
  columns,
  emptyLabel,
  emptyDescription,
  title,
  previewLimit,
  totalCount,
  expanded = false,
  onToggleExpand,
  expandLabels,
  onViewOrder,
  actionView,
  receiptsLinkLabel,
  receiptsHref,
}: {
  orders: ProviderOrderRow[];
  loading: boolean;
  columns: {
    time: string;
    orderNumber: string;
    provider: string;
    customer: string;
    details: string;
    status: string;
    payment: string;
    amount: string;
    actions?: string;
  };
  emptyLabel: string;
  emptyDescription?: string;
  title: string;
  previewLimit?: number;
  totalCount?: number;
  expanded?: boolean;
  onToggleExpand?: () => void;
  expandLabels?: { viewAll: string; showLess: string };
  onViewOrder?: (order: ProviderOrderRow) => void;
  actionView?: string;
  receiptsLinkLabel?: string;
  receiptsHref?: string;
}) {
  const count = totalCount ?? orders.length;
  const limit = previewLimit ?? orders.length;
  const visibleOrders =
    expanded || count <= limit ? orders : orders.slice(0, limit);
  const showExpandToggle =
    Boolean(onToggleExpand && expandLabels && previewLimit != null && count > limit);
  const colSpan = onViewOrder ? 9 : 8;

  return (
    <section className="dashboard-panel dashboard-panel--wide online-orders-panel">
      <h2 className="dashboard-panel-title">{title}</h2>
      <div className="orders-table-wrap">
        <table className="portal-table orders-table online-orders-table">
          <thead>
            <tr>
              <th>{columns.time}</th>
              <th>{columns.orderNumber}</th>
              <th>{columns.provider}</th>
              <th className="online-orders-col--optional">{columns.customer}</th>
              <th className="online-orders-col--optional">{columns.details}</th>
              <th>{columns.status}</th>
              <th>{columns.payment}</th>
              <th>{columns.amount}</th>
              {onViewOrder ? <th>{columns.actions ?? ""}</th> : null}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={colSpan} className="orders-table-empty">
                  …
                </td>
              </tr>
            ) : visibleOrders.length === 0 ? (
              <tr>
                <td colSpan={colSpan} className="orders-table-empty">
                  <span>{emptyLabel}</span>
                  {emptyDescription ? (
                    <span className="online-orders-empty-hint">{emptyDescription}</span>
                  ) : null}
                </td>
              </tr>
            ) : (
              visibleOrders.map((row) => (
                <tr key={row.id}>
                  <td data-label={columns.time}>{row.time}</td>
                  <td data-label={columns.orderNumber}>{row.orderNumber}</td>
                  <td data-label={columns.provider}>{row.provider}</td>
                  <td
                    className="online-orders-col--optional"
                    data-label={columns.customer}
                  >
                    {row.customer}
                  </td>
                  <td
                    className="online-orders-col--optional"
                    data-label={columns.details}
                  >
                    {row.details}
                  </td>
                  <td data-label={columns.status}>
                    <OrderStatusBadge status={row.statusKey} label={row.status} />
                  </td>
                  <td data-label={columns.payment}>
                    <span className="order-payment-badge">{row.payment}</span>
                  </td>
                  <td data-label={columns.amount}>{row.amount}</td>
                  {onViewOrder ? (
                    <td data-label={columns.actions ?? ""}>
                      <button
                        type="button"
                        className="orders-table-action-btn"
                        onClick={() => onViewOrder(row)}
                      >
                        {actionView}
                      </button>
                    </td>
                  ) : null}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      {showExpandToggle ? (
        <div className="orders-table-footer">
          <button
            type="button"
            className="orders-table-expand-btn"
            onClick={onToggleExpand}
          >
            {expanded ? expandLabels!.showLess : expandLabels!.viewAll}
          </button>
        </div>
      ) : null}
      {receiptsLinkLabel && receiptsHref ? (
        <p className="online-orders-receipts-link-wrap">
          <Link className="online-orders-receipts-link" to={receiptsHref}>
            {receiptsLinkLabel}
          </Link>
        </p>
      ) : null}
    </section>
  );
}
