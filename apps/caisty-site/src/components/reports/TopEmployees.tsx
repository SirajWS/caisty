import type { TopEmployeeRow } from "../../lib/reports/types";

export function TopEmployees({
  employees,
  loading,
  title,
  emptyLabel,
  columns,
}: {
  employees: TopEmployeeRow[];
  loading: boolean;
  title: string;
  emptyLabel: string;
  columns: {
    employee: string;
    orders: string;
    revenue: string;
    avgOrder: string;
  };
}) {
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
            ) : employees.length === 0 ? (
              <tr>
                <td colSpan={4} className="reports-table-empty">
                  {emptyLabel}
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
