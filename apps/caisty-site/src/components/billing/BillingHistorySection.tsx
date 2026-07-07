export function BillingHistorySection({
  title,
  emptyMessage,
}: {
  title: string;
  emptyMessage: string;
}) {
  return (
    <section className="dashboard-panel">
      <h2 className="dashboard-panel-title">{title}</h2>
      <p className="dashboard-text-muted text-sm">{emptyMessage}</p>
    </section>
  );
}
