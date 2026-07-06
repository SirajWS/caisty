import type { KnowledgeBaseItem } from "../../lib/support/types";

export function KnowledgeBase({
  items,
  title,
}: {
  items: KnowledgeBaseItem[];
  title: string;
}) {
  return (
    <section className="dashboard-panel">
      <h2 className="dashboard-panel-title">{title}</h2>
      <ul className="support-kb-list">
        {items.map((item) => (
          <li key={item.id} className="support-kb-row">
            <span>{item.label}</span>
            <span className="dashboard-quick-badge">{item.badge}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}
