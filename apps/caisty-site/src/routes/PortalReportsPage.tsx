import React from "react";
import { usePortalOutlet } from "./PortalLayout";
import { useTheme } from "../lib/theme";
import { useLanguage } from "../lib/LanguageContext";
import { getPortalTranslations } from "../lib/translations";
import { getPosReleaseConfig } from "../config/posConfig";
import { portalLocaleTag } from "../lib/portalLocale";
import { deriveReportsState } from "../lib/reports/deriveReportsState";
import { usePortalReportsData } from "../lib/reports/usePortalReportsData";
import {
  DEFAULT_REPORTS_PERIOD,
  getReportsPeriodLabel,
  type ReportsPeriodId,
} from "../lib/reports/reportsPeriod";
import { ReportsOverview } from "../components/reports/ReportsOverview";
import { ReportsBreakdowns } from "../components/reports/ReportsBreakdowns";
import { ReportsFilters } from "../components/reports/ReportsFilters";
import { ReportsEmptyState } from "../components/reports/ReportsEmptyState";
import { RevenueChart } from "../components/reports/RevenueChart";
import { HourlySalesChart } from "../components/reports/HourlySalesChart";
import { PaymentMethods } from "../components/reports/PaymentMethods";
import { TopProducts } from "../components/reports/TopProducts";
import { TopEmployees } from "../components/reports/TopEmployees";
import { TaxesOverview } from "../components/reports/TaxesOverview";
import { BusinessTrends } from "../components/reports/BusinessTrends";
import { OrdersErrorState } from "../components/orders/OrdersErrorState";
import { PortalExportPdfButton } from "../components/portal/PortalExportPdfButton";
import { buildReportsDocumentLabels } from "../lib/documents/documentLabels";
import { buildDocumentMeta, resolveDocumentIdentity } from "../lib/documents/documentMeta";
import {
  portalPageShell,
  portalPageSubtitle,
  portalPageTitle,
  portalSecondaryCta,
} from "../lib/portalUi";

const PortalReportsPage: React.FC = () => {
  const { customer } = usePortalOutlet();
  const { theme } = useTheme();
  const { language } = useLanguage();
  const t = getPortalTranslations(language);
  const r = t.reports;
  const o = t.orders;
  const dash = t.labels.dash;
  const isLight = theme === "light";

  const release = React.useMemo(() => getPosReleaseConfig(), []);
  const locale = portalLocaleTag(language);
  const [period, setPeriod] = React.useState<ReportsPeriodId>(DEFAULT_REPORTS_PERIOD);
  const data = usePortalReportsData(customer, period);

  const reports = React.useMemo(
    () => deriveReportsState({ data, t, locale }),
    [data, t, locale],
  );

  const periodLabel = getReportsPeriodLabel(period, r);
  const hasSalesData = Boolean(data.reportsSummary?.hasSalesData);
  const showErrorHero = !data.loading && data.error && !hasSalesData;
  const showEmptyHero = !data.loading && !data.error && !hasSalesData;
  const mutedPlaceholders = showEmptyHero;
  const syncHint = r.paymentEmptyHint;
  const fiscalHint = r.fiscalEmptyHint;
  const [exportingPdf, setExportingPdf] = React.useState(false);

  const handleExportPdf = React.useCallback(async () => {
    const summary = data.reportsSummary;
    if (!summary) return;

    setExportingPdf(true);
    try {
      const identity = await resolveDocumentIdentity(customer);
      const { exportReportsPdf } = await import("../lib/documents/reportsDocument");
      exportReportsPdf({
        meta: buildDocumentMeta({
          identity,
          period: { label: periodLabel },
          generatedAt: new Date(),
          timezone: summary.timezone,
          currency: summary.overview.currency,
          locale,
        }),
        labels: buildReportsDocumentLabels(t),
        summary,
      });
    } finally {
      setExportingPdf(false);
    }
  }, [customer, data.reportsSummary, locale, periodLabel, t]);

  return (
    <div className={`${portalPageShell()} dashboard-home reports-center`}>
      <header className="portal-page-header">
        <div className="portal-page-header-copy">
          <h1 className={portalPageTitle(isLight)}>{r.title}</h1>
          <p className={portalPageSubtitle(isLight)}>{r.subtitle}</p>
        </div>
        <div className="portal-page-header-actions">
          <button
            type="button"
            className={`portal-refresh-btn ${portalSecondaryCta(isLight)}`}
            disabled={data.loading || exportingPdf}
            onClick={() => data.reload()}
          >
            {data.loading ? r.refreshLoading : r.actionRefresh}
          </button>
          <PortalExportPdfButton
            label={r.exportPdf}
            loadingLabel={t.pdfDocuments.exporting}
            disabled={data.loading || !hasSalesData}
            loading={exportingPdf}
            onClick={handleExportPdf}
            isLight={isLight}
          />
        </div>
      </header>

      <ReportsFilters r={r} period={period} onPeriodChange={setPeriod} />

      {showErrorHero ? (
        <OrdersErrorState
          headline={r.errorHeadline}
          description={r.errorDescription}
          retryLabel={r.errorRetry}
          onRetry={() => data.reload()}
          isLight={isLight}
          loading={data.loading}
        />
      ) : null}

      <ReportsOverview
        kpis={reports.overview}
        loading={data.loading}
        isLight={isLight}
        periodLabel={periodLabel}
        hideHints={showEmptyHero || showErrorHero}
      />

      <ReportsBreakdowns
        revenueBreakdown={reports.revenueBreakdown}
        orderBreakdown={reports.orderBreakdown}
        loading={data.loading}
        isLight={isLight}
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
        chart={reports.revenueChart}
        mutedPlaceholder={mutedPlaceholders}
      />

      <PaymentMethods
        pos={{
          payments: reports.posPaymentCards,
          title: o.paymentSummaryTitle,
          hint: hasSalesData ? undefined : o.paymentEmptyHint,
        }}
        online={{
          payments: reports.onlinePaymentCards,
          title: o.onlinePaymentSummaryTitle,
          hint: hasSalesData ? undefined : o.paymentEmptyHint,
          infoHint: hasSalesData ? o.onlinePaymentSummaryInfo : undefined,
          revenueHeader: reports.onlineRevenueHeader,
        }}
      />

      {reports.showHourlySales ? (
        <HourlySalesChart
          data={reports.hourlySales}
          title={r.hourlySalesTitle}
          mutedPlaceholder={mutedPlaceholders}
        />
      ) : null}

      <TopProducts
        products={reports.topProducts}
        loading={data.loading}
        title={r.topProductsTitle}
        emptyLabel={r.topProductsEmpty}
        emptyHint={hasSalesData ? r.tableEmptyHint : undefined}
        columns={{
          rank: r.colRank,
          product: r.colProduct,
          quantity: r.colQuantity,
          revenue: r.colRevenue,
          share: r.colShare,
        }}
      />

      <TopEmployees
        employees={reports.topEmployees}
        loading={data.loading}
        title={r.topEmployeesTitle}
        emptyLabel={r.topEmployeesEmpty}
        emptyHint={r.topEmployeesEmptyHint}
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
          footnote={hasSalesData ? r.taxesPosOnlyNote : undefined}
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
