import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { formatMoneyDE } from "../lib/formatMoney";
import {
  fetchAnalyticsCustomers,
  fetchAnalyticsOverview,
  fetchAnalyticsPlans,
  fetchAnalyticsRevenue,
  fetchAnalyticsSubscriptions,
  type AnalyticsOverview,
  type AnalyticsPreset,
  type PlanBreakdownItem,
  type RevenueBucket,
  type RevenueDrillInvoice,
} from "../lib/analyticsApi";
import { Button, Card, DataTable, KpiCard, PageHeader, SectionHeader } from "../components/ui";

const CHART_BRAND = "#F26722";
const CHART_GRID = "var(--line)";
const CHART_MUTED = "var(--ink2)";
const TOOLTIP_STYLE = {
  background: "var(--panel2)",
  border: "1px solid var(--line)",
  borderRadius: 8,
};

const PRESETS: { id: AnalyticsPreset; label: string }[] = [
  { id: "7d", label: "7 days" },
  { id: "30d", label: "30 days" },
  { id: "12m", label: "12 months" },
  { id: "ytd", label: "This year" },
  { id: "all", label: "All time" },
  { id: "custom", label: "Custom" },
];

function formatChartDate(iso: string, preset: AnalyticsPreset): string {
  const d = new Date(iso);
  if (preset === "7d" || preset === "30d") {
    return d.toLocaleDateString("en-GB", { day: "2-digit", month: "2-digit" });
  }
  return d.toLocaleDateString("en-GB", { month: "short", year: "2-digit" });
}

export default function AnalyticsPage() {
  const [preset, setPreset] = useState<AnalyticsPreset>("30d");
  const [customFrom, setCustomFrom] = useState("");
  const [customTo, setCustomTo] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [overview, setOverview] = useState<AnalyticsOverview | null>(null);
  const [revenueBuckets, setRevenueBuckets] = useState<RevenueBucket[]>([]);
  const [plans, setPlans] = useState<PlanBreakdownItem[]>([]);
  const [customerBuckets, setCustomerBuckets] = useState<
    Array<{ periodStart: string; newCustomers: number; cumulativeTotal: number }>
  >([]);
  const [subscriptionBuckets, setSubscriptionBuckets] = useState<
    Array<{
      periodStart: string;
      newSubscriptions: number;
      cancelledSubscriptions: number;
      activeAtEnd: number;
    }>
  >([]);

  const [selectedBucket, setSelectedBucket] = useState<RevenueBucket | null>(
    null,
  );
  const [drillInvoices, setDrillInvoices] = useState<RevenueDrillInvoice[]>([]);
  const [drillLoading, setDrillLoading] = useState(false);

  const rangeParams = useMemo(() => {
    if (preset !== "custom") return { from: undefined, to: undefined };
    return {
      from: customFrom || undefined,
      to: customTo || undefined,
    };
  }, [preset, customFrom, customTo]);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const [ov, rev, pl, cust, subs] = await Promise.all([
        fetchAnalyticsOverview(preset, rangeParams.from, rangeParams.to),
        fetchAnalyticsRevenue(preset, rangeParams.from, rangeParams.to),
        fetchAnalyticsPlans(preset, rangeParams.from, rangeParams.to),
        fetchAnalyticsCustomers(preset, rangeParams.from, rangeParams.to),
        fetchAnalyticsSubscriptions(preset, rangeParams.from, rangeParams.to),
      ]);
      setOverview(ov);
      setRevenueBuckets(rev.buckets);
      setPlans(pl.plans);
      setCustomerBuckets(cust.buckets);
      setSubscriptionBuckets(subs.buckets);
      setSelectedBucket(null);
      setDrillInvoices([]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load analytics.");
    } finally {
      setLoading(false);
    }
  }, [preset, rangeParams.from, rangeParams.to]);

  useEffect(() => {
    void load();
  }, [load]);

  async function handleBucketClick(bucket: RevenueBucket) {
    setSelectedBucket(bucket);
    setDrillLoading(true);
    try {
      const res = await fetchAnalyticsRevenue(
        preset,
        rangeParams.from,
        rangeParams.to,
        bucket.periodStart,
      );
      setDrillInvoices(res.invoices ?? []);
    } catch {
      setDrillInvoices([]);
    } finally {
      setDrillLoading(false);
    }
  }

  function exportCsv() {
    if (!overview) return;
    const lines: string[] = [
      "Caisty Analytics Export",
      `Period;${preset};${overview.from};${overview.to}`,
      "",
      "SaaS Overview",
      `Active customers;${overview.activeCustomers}`,
      `MRR;${formatMoneyDE(overview.mrrCents)}`,
      `ARR;${formatMoneyDE(overview.arrCents)}`,
      `Total revenue;${formatMoneyDE(overview.totalRevenueCents)}`,
      `Period revenue;${formatMoneyDE(overview.rangeRevenueCents)}`,
      `Trial customers;${overview.trialCustomersActive}`,
      `Trial conversion;${overview.trialConversionRate}%`,
      "",
      "Plan Breakdown",
      "Plan;Customers;Revenue",
      ...plans.map(
        (p) =>
          `${p.label};${p.customerCount};${formatMoneyDE(p.revenueCents)}`,
      ),
      "",
      "Revenue by period",
      "Period;Revenue;Invoices",
      ...revenueBuckets.map(
        (b) =>
          `${b.periodStart};${formatMoneyDE(b.revenueCents)};${b.invoiceCount}`,
      ),
    ];
    const blob = new Blob([lines.join("\n")], {
      type: "text/csv;charset=utf-8",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `caisty-analytics-${preset}-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  const revenueChartData = revenueBuckets.map((b) => ({
    ...b,
    label: formatChartDate(b.periodStart, preset),
    revenueEuro: b.revenueCents / 100,
  }));

  const customerChartData = customerBuckets.map((b) => ({
    label: formatChartDate(b.periodStart, preset),
    cumulative: b.cumulativeTotal,
    neu: b.newCustomers,
  }));

  const subscriptionChartData = subscriptionBuckets.map((b) => ({
    label: formatChartDate(b.periodStart, preset),
    neu: b.newSubscriptions,
    gekündigt: b.cancelledSubscriptions,
    aktiv: b.activeAtEnd,
  }));

  return (
    <div className="admin-page">
      <PageHeader
        title="Analytics"
        subtitle="Revenue from paid invoices · MRR from active subscriptions · Read-only"
        actions={
          <Button variant="primary" onClick={exportCsv} disabled={!overview}>
            CSV export
          </Button>
        }
      />

      <div className="ds-tabs">
        {PRESETS.map((p) => (
          <button
            key={p.id}
            type="button"
            className={`ds-tab${preset === p.id ? " is-active" : ""}`}
            onClick={() => setPreset(p.id)}
          >
            {p.label}
          </button>
        ))}
      </div>

      {preset === "custom" && (
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: 12,
            marginBottom: 20,
            alignItems: "center",
          }}
        >
          <label className="ds-form-field" style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
            From{" "}
            <input
              type="date"
              value={customFrom}
              onChange={(e) => setCustomFrom(e.target.value)}
              className="admin-input"
            />
          </label>
          <label className="ds-form-field" style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
            To{" "}
            <input
              type="date"
              value={customTo}
              onChange={(e) => setCustomTo(e.target.value)}
              className="admin-input"
            />
          </label>
          <Button variant="secondary" onClick={() => void load()}>
            Apply
          </Button>
        </div>
      )}

      {error ? <div className="admin-error-banner">{error}</div> : null}

      {loading && !overview ? (
        <p className="ds-muted">Loading…</p>
      ) : overview ? (
        <>
          <SectionHeader title="SaaS overview" />
          <div className="ds-kpi-grid">
            <KpiCard
              label="Active customers"
              value={String(overview.activeCustomers)}
              hint="Subscription or trial licence"
            />
            <KpiCard
              label="MRR"
              value={formatMoneyDE(overview.mrrCents)}
              hint="Active subscriptions"
            />
            <KpiCard
              label="ARR"
              value={formatMoneyDE(overview.arrCents)}
              hint="MRR × 12"
            />
            <KpiCard
              label="Total revenue"
              value={formatMoneyDE(overview.totalRevenueCents)}
              hint="All paid invoices"
            />
            <KpiCard
              label="Trials"
              value={String(overview.trialCustomersActive)}
              hint={`${overview.trialConverted} converted`}
            />
            <KpiCard
              label="Conversion"
              value={`${overview.trialConversionRate} %`}
              hint="Trial → paid"
            />
          </div>

          <div className="ds-kpi-grid" style={{ gridTemplateColumns: "repeat(3, 1fr)" }}>
            <KpiCard
              label="Revenue (period)"
              value={formatMoneyDE(overview.rangeRevenueCents)}
              hint="Paid invoices"
            />
            <KpiCard
              label="New customers"
              value={`+${overview.churn.newCustomers}`}
              hint="In selected period"
            />
            <KpiCard
              label="Net growth"
              value={
                overview.churn.net >= 0
                  ? `+${overview.churn.net}`
                  : String(overview.churn.net)
              }
              hint={`Lost: ${overview.churn.lostCustomers}`}
            />
          </div>

          <section className="ds-section-block">
            <SectionHeader title="Revenue (paid invoices)" />
            <Card>
              <div style={{ width: "100%", height: 280 }}>
                <ResponsiveContainer>
                  <AreaChart
                    data={revenueChartData}
                    onClick={(state) => {
                      const idx = state?.activeTooltipIndex;
                      if (idx != null && revenueBuckets[idx]) {
                        void handleBucketClick(revenueBuckets[idx]);
                      }
                    }}
                  >
                    <CartesianGrid stroke={CHART_GRID} strokeDasharray="3 3" />
                    <XAxis dataKey="label" stroke={CHART_MUTED} fontSize={11} />
                    <YAxis
                      stroke={CHART_MUTED}
                      fontSize={11}
                      tickFormatter={(v) => `${v} €`}
                    />
                    <Tooltip
                      formatter={(v: number) => [
                        formatMoneyDE(Math.round(v * 100)),
                        "Revenue",
                      ]}
                      contentStyle={TOOLTIP_STYLE}
                    />
                    <Area
                      type="monotone"
                      dataKey="revenueEuro"
                      stroke={CHART_BRAND}
                      fill={CHART_BRAND}
                      fillOpacity={0.15}
                      name="Revenue"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
              <p className="ds-muted" style={{ marginTop: 8 }}>
                Click a period to view underlying invoices.
              </p>

              {selectedBucket && (
                <div style={{ marginTop: 16 }}>
                  <h3 className="ds-section-title" style={{ marginBottom: 8 }}>
                    Invoices — {formatChartDate(selectedBucket.periodStart, preset)}
                  </h3>
                  {drillLoading ? (
                    <p className="ds-muted">Loading…</p>
                  ) : drillInvoices.length === 0 ? (
                    <p className="ds-muted">No invoices in this period.</p>
                  ) : (
                    <DataTable>
                      <thead>
                        <tr>
                          <th>Invoice no.</th>
                          <th>Customer</th>
                          <th>Amount</th>
                          <th>Paid on</th>
                        </tr>
                      </thead>
                      <tbody>
                        {drillInvoices.map((inv) => (
                          <tr key={inv.id}>
                            <td>{inv.number}</td>
                            <td>
                              <div>{inv.customerName}</div>
                              <div className="ds-muted">{inv.customerEmail}</div>
                            </td>
                            <td>{formatMoneyDE(inv.amountGrossCents)}</td>
                            <td>
                              {inv.paidAt
                                ? new Date(inv.paidAt).toLocaleString("en-GB")
                                : "—"}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </DataTable>
                  )}
                </div>
              )}
            </Card>
          </section>

          <section className="ds-section-block">
            <SectionHeader title="Plan breakdown" />
            <DataTable>
              <thead>
                <tr>
                  <th>Plan</th>
                  <th>Customers</th>
                  <th>Revenue (period)</th>
                </tr>
              </thead>
              <tbody>
                {plans.map((p) => (
                  <tr key={p.key}>
                    <td>{p.label}</td>
                    <td>{p.customerCount}</td>
                    <td>{formatMoneyDE(p.revenueCents)}</td>
                  </tr>
                ))}
              </tbody>
            </DataTable>
          </section>

          <section className="ds-section-block">
            <SectionHeader title="Trial conversion" />
            <div className="ds-kpi-grid">
              <KpiCard
                label="Trial customers (total)"
                value={String(overview.trialCustomersEver)}
                hint="Ever on trial"
              />
              <KpiCard
                label="Active trials"
                value={String(overview.trialCustomersActive)}
                hint="Currently active"
              />
              <KpiCard
                label="Converted to paid"
                value={String(overview.trialConverted)}
                hint="Paid invoice or subscription"
              />
              <KpiCard
                label="Conversion"
                value={`${overview.trialConversionRate} %`}
                hint="Trial → paid"
              />
            </div>
          </section>

          <section className="ds-section-block">
            <SectionHeader title="Customer growth" />
            <Card>
              <div style={{ width: "100%", height: 260 }}>
                <ResponsiveContainer>
                  <LineChart data={customerChartData}>
                    <CartesianGrid stroke={CHART_GRID} strokeDasharray="3 3" />
                    <XAxis dataKey="label" stroke={CHART_MUTED} fontSize={11} />
                    <YAxis stroke={CHART_MUTED} fontSize={11} />
                    <Tooltip contentStyle={TOOLTIP_STYLE} />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="cumulative"
                      stroke={CHART_BRAND}
                      name="Cumulative"
                      dot={false}
                    />
                    <Line
                      type="monotone"
                      dataKey="neu"
                      stroke="var(--status-green)"
                      name="New"
                      dot={false}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </Card>
          </section>

          <section className="ds-section-block">
            <SectionHeader title="Subscription growth & churn" />
            <Card>
              <div style={{ width: "100%", height: 260 }}>
                <ResponsiveContainer>
                  <BarChart data={subscriptionChartData}>
                    <CartesianGrid stroke={CHART_GRID} strokeDasharray="3 3" />
                    <XAxis dataKey="label" stroke={CHART_MUTED} fontSize={11} />
                    <YAxis stroke={CHART_MUTED} fontSize={11} />
                    <Tooltip contentStyle={TOOLTIP_STYLE} />
                    <Legend />
                    <Bar dataKey="neu" fill="var(--status-green)" name="New" />
                    <Bar dataKey="gekündigt" fill="var(--status-red)" name="Cancelled" />
                    <Bar dataKey="aktiv" fill={CHART_BRAND} name="Active (end)" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </Card>
          </section>
        </>
      ) : null}
    </div>
  );
}
