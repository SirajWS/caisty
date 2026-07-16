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
  const maxValue = Math.max(...data.bars.map((bar) => bar.value ?? 0), 1);
  const hasData = data.bars.some((bar) => (bar.value ?? 0) > 0);

  return (
    <section className="dashboard-panel reports-chart-panel">
      <h2 className="dashboard-panel-title">{title}</h2>
      <div className="reports-hourly-chart">
        <div className="reports-hourly-bars" role="img" aria-label={data.placeholderMessage}>
          {data.bars.map((bar) => {
            const value = bar.value ?? 0;
            const heightPct = value > 0 ? Math.max((value / maxValue) * 100, 8) : 0;
            return (
              <div
                key={bar.hour}
                className="reports-hourly-bar-col"
                title={bar.tooltip}
              >
                <div className="reports-hourly-bar-track">
                  <div
                    className={`reports-hourly-bar-fill ${value <= 0 ? "reports-hourly-bar-fill--empty" : ""}`}
                    style={value > 0 ? { height: `${heightPct}%` } : undefined}
                  />
                </div>
                <span className="reports-hourly-bar-label">{bar.hour}</span>
              </div>
            );
          })}
        </div>
        {!mutedPlaceholder && !hasData ? (
          <p className="reports-section-hint">{data.placeholderMessage}</p>
        ) : null}
      </div>
    </section>
  );
}
