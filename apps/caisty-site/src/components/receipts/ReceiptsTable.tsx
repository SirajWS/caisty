import { portalReceiptStatusBadge } from "../../lib/portalUi";
import type { ReceiptTableRow } from "../../lib/receipts/types";

export function ReceiptsTable({
  receipts,
  loading,
  isLight,
  columns,
  actionsLabel,
  actionView,
  actionPrint,
  emptyLabel,
  title,
  onView,
  onPrint,
}: {
  receipts: ReceiptTableRow[];
  loading: boolean;
  isLight: boolean;
  columns: {
    receiptNumber: string;
    date: string;
    time: string;
    cashier: string;
    payment: string;
    amount: string;
    status: string;
    fiscal: string;
    printCount: string;
    lastEvent: string;
  };
  actionsLabel: string;
  actionView: string;
  actionPrint?: string;
  emptyLabel: string;
  title: string;
  onView?: (receipt: ReceiptTableRow) => void;
  onPrint?: (receipt: ReceiptTableRow) => void;
}) {
  return (
    <section className="dashboard-panel dashboard-panel--wide">
      <h2 className="dashboard-panel-title">{title}</h2>
      <div className="orders-table-wrap">
        <table className="portal-table orders-table receipts-table">
          <thead>
            <tr>
              <th>{columns.receiptNumber}</th>
              <th>{columns.date}</th>
              <th>{columns.time}</th>
              <th>{columns.cashier}</th>
              <th>{columns.payment}</th>
              <th>{columns.amount}</th>
              <th>{columns.status}</th>
              <th>{columns.fiscal}</th>
              <th>{columns.printCount}</th>
              <th>{columns.lastEvent}</th>
              <th>{actionsLabel}</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={11} className="orders-table-empty">
                  …
                </td>
              </tr>
            ) : receipts.length === 0 ? (
              <tr>
                <td colSpan={11} className="orders-table-empty">
                  {emptyLabel}
                </td>
              </tr>
            ) : (
              receipts.map((row) => (
                <tr key={row.id}>
                  <td data-label={columns.receiptNumber}>{row.receiptNumber}</td>
                  <td data-label={columns.date}>{row.date}</td>
                  <td data-label={columns.time}>{row.time}</td>
                  <td data-label={columns.cashier}>{row.cashier}</td>
                  <td data-label={columns.payment}>{row.payment}</td>
                  <td data-label={columns.amount}>{row.amount}</td>
                  <td data-label={columns.status}>
                    <span
                      className={portalReceiptStatusBadge(row.statusRaw, isLight)}
                    >
                      {row.status}
                    </span>
                  </td>
                  <td data-label={columns.fiscal}>{row.fiscal}</td>
                  <td data-label={columns.printCount}>{row.printCount}</td>
                  <td data-label={columns.lastEvent}>{row.lastEvent}</td>
                  <td data-label={actionsLabel}>
                    <div className="orders-table-actions">
                      <button
                        type="button"
                        className="orders-table-action-btn"
                        onClick={() => onView?.(row)}
                      >
                        {actionView}
                      </button>
                      {onPrint && actionPrint ? (
                        <button
                          type="button"
                          className="orders-table-action-btn orders-table-action-btn--secondary"
                          onClick={() => onPrint(row)}
                        >
                          {actionPrint}
                        </button>
                      ) : null}
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
