import React from "react";
import { formatMinorUnits } from "../../lib/money/formatMinorUnits";
import type { RevenueChartState, RevenueSeriesPoint } from "../../lib/reports/types";

type HoverState = {
  index: number;
  point: RevenueSeriesPoint;
  x: number;
  y: number;
};

function axisTicks(maxMinor: number): number[] {
  if (maxMinor <= 0) return [0];
  const rough = maxMinor / 3;
  const magnitude = 10 ** Math.floor(Math.log10(rough));
  const nice = Math.ceil(rough / magnitude) * magnitude;
  return [0, nice, nice * 2, nice * 3].filter((v) => v <= maxMinor * 1.05);
}

function shortenAxisLabel(value: string): string {
  // Drop currency symbol noise for dense Y-axis where possible.
  return value.replace(/\s+/g, " ").trim();
}

function visibleXLabels(length: number, index: number): boolean {
  if (length <= 8) return true;
  if (length <= 16) return index % 2 === 0 || index === length - 1;
  if (length <= 31) return index % 3 === 0 || index === length - 1;
  return index % Math.ceil(length / 8) === 0 || index === length - 1;
}

export function RevenueChart({
  title,
  chart,
  mutedPlaceholder,
}: {
  title: string;
  chart: RevenueChartState;
  mutedPlaceholder?: boolean;
}) {
  const hasData = chart.hasData && chart.series.length > 0;
  const [hover, setHover] = React.useState<HoverState | null>(null);

  const maxRevenue = Math.max(
    ...chart.series.map((point) => point.revenueMinor),
    1,
  );
  const ticks = axisTicks(maxRevenue);

  return (
    <section className="dashboard-panel dashboard-panel--wide reports-chart-panel reports-revenue-hero">
      <div className="reports-chart-header">
        <div>
          <h2 className="dashboard-panel-title">{title}</h2>
          {hasData ? (
            <p className="reports-revenue-total tabular-nums">{chart.totalValue}</p>
          ) : null}
        </div>
        {hasData ? (
          <span className="reports-revenue-granularity">{chart.granularityLabel}</span>
        ) : null}
      </div>

      <div
        className={`reports-revenue-chart ${mutedPlaceholder ? "reports-revenue-chart--muted" : ""}`}
        onMouseLeave={() => setHover(null)}
      >
        {hasData ? (
          <>
            <div className="reports-revenue-y-axis" aria-hidden>
              {[...ticks].reverse().map((tick) => (
                <span key={tick} className="reports-revenue-y-tick tabular-nums">
                  {shortenAxisLabel(
                    formatMinorUnits(tick, chart.currency, chart.locale),
                  )}
                </span>
              ))}
            </div>

            <div className="reports-revenue-plot">
              <div className="reports-revenue-grid" aria-hidden>
                {ticks.map((tick) => (
                  <div
                    key={tick}
                    className="reports-revenue-grid-line"
                    style={{ bottom: `${(tick / maxRevenue) * 100}%` }}
                  />
                ))}
              </div>

              <div
                className="reports-revenue-bars"
                role="img"
                aria-label={chart.ariaLabel}
              >
                {chart.series.map((point, index) => {
                  const heightPct =
                    point.revenueMinor > 0
                      ? Math.max((point.revenueMinor / maxRevenue) * 100, 4)
                      : 0;
                  return (
                    <div
                      key={`${point.bucketStart}-${index}`}
                      className="reports-revenue-bar-col"
                      onMouseEnter={(event) => {
                        const rect = event.currentTarget.getBoundingClientRect();
                        setHover({
                          index,
                          point,
                          x: rect.left + rect.width / 2,
                          y: rect.top,
                        });
                      }}
                    >
                      <div className="reports-revenue-bar-track">
                        <div
                          className={`reports-revenue-bar-fill ${
                            point.revenueMinor <= 0
                              ? "reports-revenue-bar-fill--empty"
                              : ""
                          } ${hover?.index === index ? "reports-revenue-bar-fill--active" : ""}`}
                          style={
                            point.revenueMinor > 0
                              ? { height: `${heightPct}%` }
                              : undefined
                          }
                        />
                      </div>
                      {visibleXLabels(chart.series.length, index) ? (
                        <span className="reports-revenue-bar-label">{point.label}</span>
                      ) : (
                        <span className="reports-revenue-bar-label reports-revenue-bar-label--spacer" />
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </>
        ) : (
          <p className="reports-chart-placeholder-text">{chart.placeholderMessage}</p>
        )}
      </div>

      {hover ? (
        <div
          className="reports-revenue-tooltip"
          style={{
            position: "fixed",
            left: Math.min(
              Math.max(hover.x - 80, 12),
              typeof window !== "undefined" ? window.innerWidth - 180 : hover.x,
            ),
            top: Math.max(hover.y - 72, 8),
          }}
          role="tooltip"
        >
          <strong>{hover.point.label}</strong>
          <span className="tabular-nums">
            {formatMinorUnits(
              hover.point.revenueMinor,
              chart.currency,
              chart.locale,
            )}
          </span>
          <span>
            {chart.ordersLabel}: {hover.point.ordersCount}
          </span>
        </div>
      ) : null}
    </section>
  );
}
