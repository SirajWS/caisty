import { Link } from "react-router-dom";
import type { HelpCategory } from "../../lib/support/types";

export function HelpCategories({
  categories,
  title,
}: {
  categories: HelpCategory[];
  title: string;
}) {
  return (
    <section className="dashboard-panel">
      <h2 className="dashboard-panel-title">{title}</h2>
      <div className="support-categories-grid">
        {categories.map((cat) => (
          <div key={cat.id} className="support-category-card">
            {cat.href ? (
              <Link to={cat.href} className="support-category-link">
                <span>{cat.label}</span>
                <span className="dashboard-quick-badge">{cat.badge}</span>
              </Link>
            ) : (
              <div className="support-category-link">
                <span>{cat.label}</span>
                <span className="dashboard-quick-badge">{cat.badge}</span>
              </div>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}
