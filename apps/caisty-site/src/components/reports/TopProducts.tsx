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
    rank: string;
    product: string;
    quantity: string;
    revenue: string;
    share: string;
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
              <th className="reports-col-rank">{columns.rank}</th>
              <th>{columns.product}</th>
              <th>{columns.quantity}</th>
              <th>{columns.revenue}</th>
              <th>{columns.share}</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={5} className="reports-table-empty">
                  …
                </td>
              </tr>
            ) : isEmpty ? (
              <tr>
                <td colSpan={5} className="reports-table-empty">
                  <span className="reports-table-empty-primary">{emptyLabel}</span>
                  {emptyHint ? (
                    <span className="reports-table-empty-secondary">{emptyHint}</span>
                  ) : null}
                </td>
              </tr>
            ) : (
              products.map((row) => (
                <tr key={row.id}>
                  <td className="reports-col-rank tabular-nums">{row.rank}</td>
                  <td>{row.name}</td>
                  <td className="tabular-nums">{row.quantity}</td>
                  <td className="tabular-nums">{row.revenue}</td>
                  <td className="tabular-nums">{row.share}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
