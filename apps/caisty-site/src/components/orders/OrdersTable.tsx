import type { PortalPaginationMeta } from "../../lib/portal/portalPagination";
import type { PosOrderRow } from "../../lib/orders/types";
import { PortalPagination } from "../portal/PortalPagination";
import { OrderStatusBadge } from "./OrderStatusBadge";

export function OrdersTable({
  orders,
  loading,
  columns,
  emptyLabel,
  title,
  primary = false,
  pagination,
  onPageChange,
  paginationLabels,
  onViewOrder,
  actionView,
}: {
  orders: PosOrderRow[];
  loading: boolean;
  columns: {
    time: string;
    orderNumber: string;
    status: string;
    payment: string;
    amount: string;
    cashier: string;
    device: string;
    receipt?: string;
    actions?: string;
  };
  emptyLabel: string;
  title: string;
  primary?: boolean;
  pagination?: PortalPaginationMeta | null;
  onPageChange?: (page: number) => void;
  paginationLabels?: {
    previous: string;
    next: string;
    pageOf: string;
    showing: string;
  };
  onViewOrder?: (order: PosOrderRow, trigger?: HTMLButtonElement | null) => void;
  actionView?: string;
}) {
  const panelClass = primary
    ? "dashboard-panel dashboard-panel--wide orders-panel--primary"
    : "dashboard-panel dashboard-panel--wide";

  const colSpan = onViewOrder ? 9 : 8;
  const showPagination =
    pagination &&
    onPageChange &&
    paginationLabels &&
    pagination.total > 0 &&
    pagination.totalPages > 1;

  return (
    <section className={panelClass}>
      <h2 className="dashboard-panel-title">{title}</h2>
      <div className="orders-table-wrap">
        <table className="portal-table orders-table">
          <thead>
            <tr>
              <th>{columns.time}</th>
              <th>{columns.orderNumber}</th>
              <th>{columns.status}</th>
              <th>{columns.payment}</th>
              {columns.receipt ? <th>{columns.receipt}</th> : null}
              <th>{columns.amount}</th>
              <th>{columns.cashier}</th>
              <th>{columns.device}</th>
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
            ) : orders.length === 0 ? (
              <tr>
                <td colSpan={colSpan} className="orders-table-empty">
                  {emptyLabel}
                </td>
              </tr>
            ) : (
              orders.map((row) => (
                <tr key={row.id}>
                  <td data-label={columns.time}>{row.time}</td>
                  <td data-label={columns.orderNumber}>{row.orderNumber}</td>
                  <td data-label={columns.status}>
                    <OrderStatusBadge status={row.statusKey} label={row.status} />
                  </td>
                  <td data-label={columns.payment}>
                    <span className="order-payment-badge">{row.payment}</span>
                    {row.hasPaymentChange ? (
                      <span className="order-payment-change-chip">↔</span>
                    ) : null}
                    {row.refundedAmountCents > 0 ? (
                      <span className="order-refund-chip">↩</span>
                    ) : null}
                  </td>
                  {columns.receipt ? (
                    <td data-label={columns.receipt}>
                      {row.receiptId ? row.receiptNumber : "—"}
                    </td>
                  ) : null}
                  <td data-label={columns.amount}>{row.amount}</td>
                  <td data-label={columns.cashier}>{row.cashier}</td>
                  <td data-label={columns.device}>{row.device}</td>
                  {onViewOrder ? (
                    <td data-label={columns.actions ?? ""}>
                      <button
                        type="button"
                        className="orders-table-action-btn"
                        onClick={(event) =>
                          onViewOrder(row, event.currentTarget)
                        }
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
      {showPagination ? (
        <PortalPagination
          pagination={pagination}
          onPageChange={onPageChange}
          labels={paginationLabels}
        />
      ) : null}
    </section>
  );
}
