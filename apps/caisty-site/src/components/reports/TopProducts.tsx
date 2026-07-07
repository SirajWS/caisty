import type { TopProductRow } from "../../lib/reports/types";

export function TopProducts({
  products,
  loading,
  title,
  emptyLabel,
  emptyHint,
  columns,
}: {
  products: TopProductRow[];
  loading: boolean;
  title: string;
  emptyLabel: string;
  emptyHint?: string;
  columns: {
    product: string;
    quantity: string;
    revenue: string;
    category: string;
  };
}) {
  const isEmpty = !loading && products.length === 0;

  return (
    <section className="dashboard-panel dashboard-panel--wide">
      <h2 className="dashboard-panel-title">{title}</h2>
      <div className="reports-table-wrap">
        <table className="portal-table reports-table">
          <thead>
            <tr>
              <th>{columns.product}</th>
              <th>{columns.quantity}</th>
              <th>{columns.revenue}</th>
              <th>{columns.category}</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={4} className="reports-table-empty">
                  …
                </td>
              </tr>
            ) : isEmpty ? (
              <tr>
                <td colSpan={4} className="reports-table-empty">
                  <span className="reports-table-empty-primary">{emptyLabel}</span>
                  {emptyHint ? (
                    <span className="reports-table-empty-secondary">{emptyHint}</span>
                  ) : null}
                </td>
              </tr>
            ) : (
              products.map((row) => (
                <tr key={row.id}>
                  <td>{row.name}</td>
                  <td>{row.quantity}</td>
                  <td>{row.revenue}</td>
                  <td>{row.category}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
