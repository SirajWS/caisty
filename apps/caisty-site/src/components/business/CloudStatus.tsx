import type { CloudStatusView } from "../../lib/business/types";

export function CloudStatus({
  cloud,
  title,
  labels,
}: {
  cloud: CloudStatusView;
  title: string;
  labels: {
    cloudConnected: string;
    lastSync: string;
    posConnected: string;
    apiStatus: string;
  };
}) {
  const rows = [
    { id: "cloud", label: labels.cloudConnected, value: cloud.cloudConnected },
    { id: "sync", label: labels.lastSync, value: cloud.lastSync },
    { id: "pos", label: labels.posConnected, value: cloud.posConnected },
    { id: "api", label: labels.apiStatus, value: cloud.apiStatus },
  ];

  return (
    <section className="dashboard-panel">
      <h2 className="dashboard-panel-title">{title}</h2>
      <dl className="business-cloud-grid">
        {rows.map((row) => (
          <div key={row.id} className="business-stat-card">
            <dt className="business-stat-label">{row.label}</dt>
            <dd className="business-stat-value">{row.value}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
