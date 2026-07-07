import type { HourlySalesState } from "../../lib/reports/types";

export function HourlySalesChart({
  data,
  title,
  mutedPlaceholder,
}: {
  data: HourlySalesState;
  title: string;
  mutedPlaceholder?: boolean;
}) {
  return (
    <section className="dashboard-panel reports-chart-panel">
      <h2 className="dashboard-panel-title">{title}</h2>
      <div className="reports-hourly-chart">
        <div className="reports-hourly-bars" role="img" aria-label={data.placeholderMessage}>
          {data.bars.map((bar) => (
            <div key={bar.hour} className="reports-hourly-bar-col">
              <div className="reports-hourly-bar-track">
                <div className="reports-hourly-bar-fill reports-hourly-bar-fill--empty" />
              </div>
              <span className="reports-hourly-bar-label">{bar.hour}</span>
            </div>
          ))}
        </div>
        {!mutedPlaceholder ? (
          <p className="reports-section-hint">{data.placeholderMessage}</p>
        ) : null}
      </div>
    </section>
  );
}
