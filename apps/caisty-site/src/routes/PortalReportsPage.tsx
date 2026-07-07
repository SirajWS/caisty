import React from "react";
import { usePortalOutlet } from "./PortalLayout";
import { useTheme } from "../lib/theme";
import { useLanguage } from "../lib/LanguageContext";
import { getPortalTranslations } from "../lib/translations";
import { getPosReleaseConfig } from "../config/posConfig";
import { deriveReportsState } from "../lib/reports/deriveReportsState";
import { usePortalReportsData } from "../lib/reports/usePortalReportsData";
import {
  DEFAULT_REPORTS_PERIOD,
  getReportsPeriodLabel,
  type ReportsPeriodId,
} from "../lib/reports/reportsPeriod";
import { ReportsOverview } from "../components/reports/ReportsOverview";
import { ReportsFilters } from "../components/reports/ReportsFilters";
import { ReportsEmptyState } from "../components/reports/ReportsEmptyState";
import { RevenueChart } from "../components/reports/RevenueChart";
import { HourlySalesChart } from "../components/reports/HourlySalesChart";
import { PaymentMethods } from "../components/reports/PaymentMethods";
import { TopProducts } from "../components/reports/TopProducts";
import { TopEmployees } from "../components/reports/TopEmployees";
import { TaxesOverview } from "../components/reports/TaxesOverview";
import { BusinessTrends } from "../components/reports/BusinessTrends";
import { portalPageShell, portalPageSubtitle, portalPageTitle } from "../lib/portalUi";

const PortalReportsPage: React.FC = () => {
  const { customer } = usePortalOutlet();
  const { theme } = useTheme();
  const { language } = useLanguage();
  const t = getPortalTranslations(language);
  const r = t.reports;
  const dash = t.labels.dash;
  const isLight = theme === "light";

  const release = React.useMemo(() => getPosReleaseConfig(), []);
  const data = usePortalReportsData(customer);
  const [period, setPeriod] = React.useState<ReportsPeriodId>(DEFAULT_REPORTS_PERIOD);

  const reports = React.useMemo(
    () => deriveReportsState({ data, t }),
    [data, t],
  );

  const periodLabel = getReportsPeriodLabel(period, r);
  const hasSalesData = reports.revenueChart.hasData;
  const showEmptyHero = !data.loading && !hasSalesData;
  const mutedPlaceholders = showEmptyHero;
  const syncHint = r.paymentEmptyHint;
  const fiscalHint = r.fiscalEmptyHint;

  return (
    <div className={`${portalPageShell()} dashboard-home reports-center`}>
      <header className="space-y-1">
        <h1 className={portalPageTitle(isLight)}>{r.title}</h1>
        <p className={portalPageSubtitle(isLight)}>{r.subtitle}</p>
      </header>

      <ReportsFilters r={r} period={period} onPeriodChange={setPeriod} />

      <ReportsOverview
        kpis={reports.overview}
        loading={data.loading}
        isLight={isLight}
        periodLabel={periodLabel}
        hideHints={showEmptyHero}
      />

      {showEmptyHero ? (
        <ReportsEmptyState
          headline={r.emptyHeadline}
          description={r.emptyDescription}
          ctaLabel={r.emptyCta}
          release={release}
        />
      ) : null}

      <RevenueChart
        title={r.revenueChartTitle}
        placeholderMessage={reports.revenueChart.placeholderMessage}
        mutedPlaceholder={mutedPlaceholders}
      />

      <div className="live-dashboard-split">
        <HourlySalesChart
          data={reports.hourlySales}
          title={r.hourlySalesTitle}
          mutedPlaceholder={mutedPlaceholders}
        />
        <PaymentMethods
          methods={reports.paymentMethods}
          title={r.paymentMethodsTitle}
          hint={hasSalesData ? undefined : syncHint}
          dash={dash}
        />
      </div>

      <TopProducts
        products={reports.topProducts}
        loading={data.loading}
        title={r.topProductsTitle}
        emptyLabel={r.topProductsEmpty}
        emptyHint={hasSalesData ? r.tableEmptyHint : undefined}
        columns={{
          product: r.colProduct,
          quantity: r.colQuantity,
          revenue: r.colRevenue,
          category: r.colCategory,
        }}
      />

      <TopEmployees
        employees={reports.topEmployees}
        loading={data.loading}
        title={r.topEmployeesTitle}
        emptyLabel={r.topEmployeesEmpty}
        emptyHint={hasSalesData ? r.tableEmptyHint : undefined}
        columns={{
          employee: r.colEmployee,
          orders: r.colOrders,
          revenue: r.colRevenue,
          avgOrder: r.colAvgOrder,
        }}
      />

      <div className="live-dashboard-split">
        <TaxesOverview
          taxes={reports.taxes}
          title={r.taxesTitle}
          hint={hasSalesData ? undefined : fiscalHint}
          dash={dash}
        />
        <BusinessTrends
          trends={reports.trends}
          title={r.trendsTitle}
          hint={hasSalesData ? undefined : syncHint}
        />
      </div>
    </div>
  );
};

export default PortalReportsPage;
