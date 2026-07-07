import type { TopEmployeeRow } from "../../lib/reports/types";

export function TopEmployees({
  employees,
  loading,
  title,
  emptyLabel,
  emptyHint,
  columns,
}: {
  employees: TopEmployeeRow[];
  loading: boolean;
  title: string;
  emptyLabel: string;
  emptyHint?: string;
  columns: {
    employee: string;
    orders: string;
    revenue: string;
    avgOrder: string;
  };
}) {
  const isEmpty = !loading && employees.length === 0;

  return (
    <section className="dashboard-panel dashboard-panel--wide">
      <h2 className="dashboard-panel-title">{title}</h2>
      <div className="reports-table-wrap">
        <table className="portal-table reports-table">
          <thead>
            <tr>
              <th>{columns.employee}</th>
              <th>{columns.orders}</th>
              <th>{columns.revenue}</th>
              <th>{columns.avgOrder}</th>
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
              employees.map((row) => (
                <tr key={row.id}>
                  <td>{row.name}</td>
                  <td>{row.orders}</td>
                  <td>{row.revenue}</td>
                  <td>{row.avgOrder}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
