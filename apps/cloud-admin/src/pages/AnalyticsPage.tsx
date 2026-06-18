import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
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
import { useTheme, themeColors } from "../theme/ThemeContext";
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

const PRESETS: { id: AnalyticsPreset; label: string }[] = [
  { id: "7d", label: "7 Tage" },
  { id: "30d", label: "30 Tage" },
  { id: "12m", label: "12 Monate" },
  { id: "ytd", label: "Dieses Jahr" },
  { id: "all", label: "Alle Zeit" },
  { id: "custom", label: "Benutzerdefiniert" },
];

function formatChartDate(iso: string, preset: AnalyticsPreset): string {
  const d = new Date(iso);
  if (preset === "7d" || preset === "30d") {
    return d.toLocaleDateString("de-DE", { day: "2-digit", month: "2-digit" });
  }
  return d.toLocaleDateString("de-DE", { month: "short", year: "2-digit" });
}

export default function AnalyticsPage() {
  const { theme } = useTheme();
  const colors = themeColors[theme];

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
      setError(err instanceof Error ? err.message : "Analytics konnte nicht geladen werden.");
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
      `Zeitraum;${preset};${overview.from};${overview.to}`,
      "",
      "SaaS Overview",
      `Aktive Kunden;${overview.activeCustomers}`,
      `MRR;${formatMoneyDE(overview.mrrCents)}`,
      `ARR;${formatMoneyDE(overview.arrCents)}`,
      `Gesamtumsatz;${formatMoneyDE(overview.totalRevenueCents)}`,
      `Umsatz Zeitraum;${formatMoneyDE(overview.rangeRevenueCents)}`,
      `Trial Kunden;${overview.trialCustomersActive}`,
      `Trial Conversion;${overview.trialConversionRate}%`,
      "",
      "Plan Breakdown",
      "Plan;Kunden;Umsatz",
      ...plans.map(
        (p) =>
          `${p.label};${p.customerCount};${formatMoneyDE(p.revenueCents)}`,
      ),
      "",
      "Umsatz nach Periode",
      "Periode;Umsatz;Rechnungen",
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

  const chartStroke = colors.accent;
  const chartGrid = colors.border;

  return (
    <div className="admin-page">
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          justifyContent: "space-between",
          alignItems: "flex-start",
          gap: 16,
          marginBottom: 24,
        }}
      >
        <div>
          <h1
            style={{
              fontSize: 32,
              fontWeight: 700,
              marginBottom: 8,
              color: colors.text,
            }}
          >
            Analytics
          </h1>
          <p style={{ fontSize: 14, color: colors.textSecondary, margin: 0 }}>
            Umsatz aus bezahlten Rechnungen · MRR aus aktiven Abos · Read-only
          </p>
        </div>
        <button
          type="button"
          className="admin-btn admin-btn--primary"
          onClick={exportCsv}
          disabled={!overview}
        >
          CSV Export
        </button>
      </div>

      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: 8,
          marginBottom: 20,
        }}
      >
        {PRESETS.map((p) => (
          <button
            key={p.id}
            type="button"
            className={`admin-btn ${preset === p.id ? "admin-btn--primary" : "admin-btn--ghost"}`}
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
          <label style={{ fontSize: 13, color: colors.textSecondary }}>
            Von{" "}
            <input
              type="date"
              value={customFrom}
              onChange={(e) => setCustomFrom(e.target.value)}
              className="admin-input"
            />
          </label>
          <label style={{ fontSize: 13, color: colors.textSecondary }}>
            Bis{" "}
            <input
              type="date"
              value={customTo}
              onChange={(e) => setCustomTo(e.target.value)}
              className="admin-input"
            />
          </label>
          <button type="button" className="admin-btn admin-btn--ghost" onClick={() => void load()}>
            Anwenden
          </button>
        </div>
      )}

      {error && (
        <div
          className="admin-alert admin-alert--error"
          style={{ marginBottom: 16 }}
        >
          {error}
        </div>
      )}

      {loading && !overview ? (
        <p style={{ color: colors.textSecondary }}>Wird geladen…</p>
      ) : overview ? (
        <>
          <h2
            style={{
              fontSize: 18,
              fontWeight: 600,
              color: colors.text,
              marginBottom: 12,
            }}
          >
            SaaS Overview
          </h2>
          <div className="dashboard-grid" style={{ marginBottom: 28 }}>
            <KpiCard
              title="Aktive Kunden"
              value={String(overview.activeCustomers)}
              meta="Abo oder Trial-Lizenz"
              colors={colors}
            />
            <KpiCard
              title="MRR"
              value={formatMoneyDE(overview.mrrCents)}
              meta="Aktive Subscriptions"
              colors={colors}
            />
            <KpiCard
              title="ARR"
              value={formatMoneyDE(overview.arrCents)}
              meta="MRR × 12"
              colors={colors}
            />
            <KpiCard
              title="Gesamtumsatz"
              value={formatMoneyDE(overview.totalRevenueCents)}
              meta="Alle bezahlten Rechnungen"
              colors={colors}
            />
            <KpiCard
              title="Trials"
              value={String(overview.trialCustomersActive)}
              meta={`${overview.trialConverted} konvertiert`}
              colors={colors}
            />
            <KpiCard
              title="Conversion"
              value={`${overview.trialConversionRate} %`}
              meta="Trial → Bezahlt"
              colors={colors}
            />
          </div>

          <div
            className="dashboard-grid"
            style={{ marginBottom: 28, gridTemplateColumns: "repeat(3, 1fr)" }}
          >
            <KpiCard
              title="Umsatz (Zeitraum)"
              value={formatMoneyDE(overview.rangeRevenueCents)}
              meta="Bezahlte Rechnungen"
              colors={colors}
            />
            <KpiCard
              title="Neue Kunden"
              value={`+${overview.churn.newCustomers}`}
              meta="Im gewählten Zeitraum"
              colors={colors}
            />
            <KpiCard
              title="Netto Wachstum"
              value={
                overview.churn.net >= 0
                  ? `+${overview.churn.net}`
                  : String(overview.churn.net)
              }
              meta={`Verloren: ${overview.churn.lostCustomers}`}
              colors={colors}
            />
          </div>

          <Section title="Umsatz (bezahlte Rechnungen)" colors={colors}>
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
                  <CartesianGrid stroke={chartGrid} strokeDasharray="3 3" />
                  <XAxis dataKey="label" stroke={colors.textSecondary} fontSize={11} />
                  <YAxis
                    stroke={colors.textSecondary}
                    fontSize={11}
                    tickFormatter={(v) => `${v} €`}
                  />
                  <Tooltip
                    formatter={(v: number) => [
                      formatMoneyDE(Math.round(v * 100)),
                      "Umsatz",
                    ]}
                    contentStyle={{
                      background: colors.bgSecondary,
                      border: `1px solid ${colors.border}`,
                      borderRadius: 8,
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="revenueEuro"
                    stroke={chartStroke}
                    fill={chartStroke}
                    fillOpacity={0.2}
                    name="Umsatz"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
            <p style={{ fontSize: 12, color: colors.textSecondary, marginTop: 8 }}>
              Klicke auf einen Zeitraum für die zugrunde liegenden Rechnungen.
            </p>

            {selectedBucket && (
              <div style={{ marginTop: 16 }}>
                <h3 style={{ fontSize: 14, color: colors.text, marginBottom: 8 }}>
                  Rechnungen — {formatChartDate(selectedBucket.periodStart, preset)}
                </h3>
                {drillLoading ? (
                  <p style={{ fontSize: 13, color: colors.textSecondary }}>Lade…</p>
                ) : drillInvoices.length === 0 ? (
                  <p style={{ fontSize: 13, color: colors.textSecondary }}>
                    Keine Rechnungen in diesem Zeitraum.
                  </p>
                ) : (
                  <div className="admin-table-wrapper">
                    <table className="admin-table">
                      <thead>
                        <tr>
                          <th>Rechnungsnr.</th>
                          <th>Kunde</th>
                          <th>Betrag</th>
                          <th>Bezahlt am</th>
                        </tr>
                      </thead>
                      <tbody>
                        {drillInvoices.map((inv) => (
                          <tr key={inv.id}>
                            <td>{inv.number}</td>
                            <td>
                              <div>{inv.customerName}</div>
                              <div style={{ fontSize: 11, opacity: 0.7 }}>
                                {inv.customerEmail}
                              </div>
                            </td>
                            <td>{formatMoneyDE(inv.amountGrossCents)}</td>
                            <td>
                              {inv.paidAt
                                ? new Date(inv.paidAt).toLocaleString("de-DE")
                                : "—"}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}
          </Section>

          <Section title="Plan Breakdown" colors={colors}>
            <div className="admin-table-wrapper">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Plan</th>
                    <th>Kunden</th>
                    <th>Umsatz (Zeitraum)</th>
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
              </table>
            </div>
          </Section>

          <Section title="Trial Conversion" colors={colors}>
            <div className="dashboard-grid">
              <KpiCard
                title="Trial Kunden (gesamt)"
                value={String(overview.trialCustomersEver)}
                meta="Jemals Trial"
                colors={colors}
              />
              <KpiCard
                title="Aktive Trials"
                value={String(overview.trialCustomersActive)}
                meta="Aktuell"
                colors={colors}
              />
              <KpiCard
                title="Davon bezahlt"
                value={String(overview.trialConverted)}
                meta="Paid Invoice oder Abo"
                colors={colors}
              />
              <KpiCard
                title="Conversion"
                value={`${overview.trialConversionRate} %`}
                meta="Trial → Bezahlt"
                colors={colors}
              />
            </div>
          </Section>

          <Section title="Kundenwachstum" colors={colors}>
            <div style={{ width: "100%", height: 260 }}>
              <ResponsiveContainer>
                <LineChart data={customerChartData}>
                  <CartesianGrid stroke={chartGrid} strokeDasharray="3 3" />
                  <XAxis dataKey="label" stroke={colors.textSecondary} fontSize={11} />
                  <YAxis stroke={colors.textSecondary} fontSize={11} />
                  <Tooltip
                    contentStyle={{
                      background: colors.bgSecondary,
                      border: `1px solid ${colors.border}`,
                    }}
                  />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="cumulative"
                    stroke={chartStroke}
                    name="Kumuliert"
                    dot={false}
                  />
                  <Line
                    type="monotone"
                    dataKey="neu"
                    stroke="#22c55e"
                    name="Neu"
                    dot={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </Section>

          <Section title="Abo-Wachstum & Churn" colors={colors}>
            <div style={{ width: "100%", height: 260 }}>
              <ResponsiveContainer>
                <BarChart data={subscriptionChartData}>
                  <CartesianGrid stroke={chartGrid} strokeDasharray="3 3" />
                  <XAxis dataKey="label" stroke={colors.textSecondary} fontSize={11} />
                  <YAxis stroke={colors.textSecondary} fontSize={11} />
                  <Tooltip
                    contentStyle={{
                      background: colors.bgSecondary,
                      border: `1px solid ${colors.border}`,
                    }}
                  />
                  <Legend />
                  <Bar dataKey="neu" fill="#22c55e" name="Neu" />
                  <Bar dataKey="gekündigt" fill="#ef4444" name="Gekündigt" />
                  <Bar dataKey="aktiv" fill={chartStroke} name="Aktiv (Ende)" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Section>
        </>
      ) : null}
    </div>
  );
}

function KpiCard({
  title,
  value,
  meta,
  colors,
}: {
  title: string;
  value: string;
  meta: string;
  colors: (typeof themeColors)["dark"];
}) {
  return (
    <div className="dashboard-card">
      <div className="dashboard-card-title" style={{ color: colors.textSecondary }}>
        {title}
      </div>
      <div className="dashboard-card-value" style={{ color: colors.accent }}>
        {value}
      </div>
      <div className="dashboard-card-meta" style={{ color: colors.textSecondary }}>
        {meta}
      </div>
    </div>
  );
}

function Section({
  title,
  children,
  colors,
}: {
  title: string;
  children: ReactNode;
  colors: (typeof themeColors)["dark"];
}) {
  return (
    <section style={{ marginBottom: 32 }}>
      <h2
        style={{
          fontSize: 18,
          fontWeight: 600,
          color: colors.text,
          marginBottom: 16,
        }}
      >
        {title}
      </h2>
      <div
        className="dashboard-card"
        style={{ padding: 20 }}
      >
        {children}
      </div>
    </section>
  );
}
