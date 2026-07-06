import type { FutureModule } from "../../lib/business/types";

export function FutureModules({
  modules,
  title,
  comingSoonLabel,
}: {
  modules: FutureModule[];
  title: string;
  comingSoonLabel: string;
}) {
  return (
    <section className="dashboard-panel dashboard-panel--wide">
      <h2 className="dashboard-panel-title">{title}</h2>
      <div className="business-modules-grid">
        {modules.map((mod) => (
          <div key={mod.id} className="business-module-card">
            <span className="business-module-label">{mod.label}</span>
            <span className="dashboard-quick-badge">{comingSoonLabel}</span>
          </div>
        ))}
      </div>
    </section>
  );
}
