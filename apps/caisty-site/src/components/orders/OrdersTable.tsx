import type { PosOrderRow } from "../../lib/orders/types";

export function OrdersTable({
  orders,
  loading,
  columns,
  emptyLabel,
  title,
  primary = false,
  previewLimit,
  totalCount,
  expanded = false,
  onToggleExpand,
  expandLabels,
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
  };
  emptyLabel: string;
  title: string;
  primary?: boolean;
  previewLimit?: number;
  totalCount?: number;
  expanded?: boolean;
  onToggleExpand?: () => void;
  expandLabels?: { viewAll: string; showLess: string };
}) {
  const panelClass = primary
    ? "dashboard-panel dashboard-panel--wide orders-panel--primary"
    : "dashboard-panel dashboard-panel--wide";

  const count = totalCount ?? orders.length;
  const limit = previewLimit ?? orders.length;
  const visibleOrders =
    expanded || count <= limit ? orders : orders.slice(0, limit);
  const showExpandToggle =
    Boolean(onToggleExpand && expandLabels && previewLimit != null && count > limit);

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
              <th>{columns.amount}</th>
              <th>{columns.cashier}</th>
              <th>{columns.device}</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={7} className="orders-table-empty">
                  …
                </td>
              </tr>
            ) : visibleOrders.length === 0 ? (
              <tr>
                <td colSpan={7} className="orders-table-empty">
                  {emptyLabel}
                </td>
              </tr>
            ) : (
              visibleOrders.map((row) => (
                <tr key={row.id}>
                  <td data-label={columns.time}>{row.time}</td>
                  <td data-label={columns.orderNumber}>{row.orderNumber}</td>
                  <td data-label={columns.status}>{row.status}</td>
                  <td data-label={columns.payment}>{row.payment}</td>
                  <td data-label={columns.amount}>{row.amount}</td>
                  <td data-label={columns.cashier}>{row.cashier}</td>
                  <td data-label={columns.device}>{row.device}</td>
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
    </section>
  );
}
