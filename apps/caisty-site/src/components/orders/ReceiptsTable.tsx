import type { PosReceiptRow } from "../../lib/orders/types";

export function ReceiptsTable({
  receipts,
  loading,
  columns,
  actionsLabel,
  actionView,
  actionPrint,
  actionDownload,
  emptyLabel,
  title,
}: {
  receipts: PosReceiptRow[];
  loading: boolean;
  columns: {
    receipt: string;
    time: string;
    customer: string;
    payment: string;
    fiscal: string;
    amount: string;
  };
  actionsLabel: string;
  actionView: string;
  actionPrint: string;
  actionDownload: string;
  emptyLabel: string;
  title: string;
}) {
  return (
    <section className="dashboard-panel dashboard-panel--wide">
      <h2 className="dashboard-panel-title">{title}</h2>
      <div className="orders-table-wrap">
        <table className="portal-table orders-table">
          <thead>
            <tr>
              <th>{columns.receipt}</th>
              <th>{columns.time}</th>
              <th>{columns.customer}</th>
              <th>{columns.payment}</th>
              <th>{columns.fiscal}</th>
              <th>{columns.amount}</th>
              <th>{actionsLabel}</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={7} className="orders-table-empty">
                  …
                </td>
              </tr>
            ) : receipts.length === 0 ? (
              <tr>
                <td colSpan={7} className="orders-table-empty">
                  {emptyLabel}
                </td>
              </tr>
            ) : (
              receipts.map((row) => (
                <tr key={row.id}>
                  <td data-label={columns.receipt}>{row.receiptNumber}</td>
                  <td data-label={columns.time}>{row.time}</td>
                  <td data-label={columns.customer}>{row.customer}</td>
                  <td data-label={columns.payment}>{row.payment}</td>
                  <td data-label={columns.fiscal}>{row.fiscal}</td>
                  <td data-label={columns.amount}>{row.amount}</td>
                  <td data-label={actionsLabel}>
                    <div className="orders-receipt-actions">
                      <span className="orders-action-btn" aria-disabled>
                        {actionView}
                      </span>
                      <span className="orders-action-btn" aria-disabled>
                        {actionPrint}
                      </span>
                      <span className="orders-action-btn" aria-disabled>
                        {actionDownload}
                      </span>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
