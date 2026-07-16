import { Users } from "lucide-react";
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

  if (isEmpty) {
    return (
      <section className="dashboard-panel dashboard-panel--wide reports-employees-empty">
        <h2 className="dashboard-panel-title">{title}</h2>
        <div className="reports-employees-empty-body">
          <div className="reports-employees-empty-icon" aria-hidden>
            <Users size={28} strokeWidth={1.5} />
          </div>
          <p className="reports-employees-empty-primary">{emptyLabel}</p>
          {emptyHint ? (
            <p className="reports-employees-empty-secondary">{emptyHint}</p>
          ) : null}
        </div>
      </section>
    );
  }

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
            ) : (
              employees.map((row) => (
                <tr key={row.id}>
                  <td>{row.name}</td>
                  <td className="tabular-nums">{row.orders}</td>
                  <td className="tabular-nums">{row.revenue}</td>
                  <td className="tabular-nums">{row.avgOrder}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
