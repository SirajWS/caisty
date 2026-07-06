import React from "react";
import { usePortalOutlet } from "./PortalLayout";
import { useTheme } from "../lib/theme";
import { useLanguage } from "../lib/LanguageContext";
import { getPortalTranslations } from "../lib/translations";
import { deriveReportsState } from "../lib/reports/deriveReportsState";
import { usePortalReportsData } from "../lib/reports/usePortalReportsData";
import { ReportsOverview } from "../components/reports/ReportsOverview";
import { RevenueChart } from "../components/reports/RevenueChart";
import { HourlySalesChart } from "../components/reports/HourlySalesChart";
import { PaymentMethods } from "../components/reports/PaymentMethods";
import { TopProducts } from "../components/reports/TopProducts";
import { TopEmployees } from "../components/reports/TopEmployees";
import { TaxesOverview } from "../components/reports/TaxesOverview";
import { BusinessTrends } from "../components/reports/BusinessTrends";
import { ReportsExports } from "../components/reports/ReportsExports";
import { ReportsFilters } from "../components/reports/ReportsFilters";
import { portalPageShell, portalPageSubtitle, portalPageTitle } from "../lib/portalUi";

const PortalReportsPage: React.FC = () => {
  const { customer } = usePortalOutlet();
  const { theme } = useTheme();
  const { language } = useLanguage();
  const t = getPortalTranslations(language);
  const r = t.reports;
  const isLight = theme === "light";

  const data = usePortalReportsData(customer);

  const reports = React.useMemo(
    () => deriveReportsState({ data, t }),
    [data, t],
  );

  return (
    <div className={`${portalPageShell()} dashboard-home reports-center`}>
      <header className="space-y-1">
        <h1 className={portalPageTitle(isLight)}>{r.title}</h1>
        <p className={portalPageSubtitle(isLight)}>{r.subtitle}</p>
      </header>

      <ReportsOverview kpis={reports.overview} loading={data.loading} isLight={isLight} />

      <RevenueChart
        title={r.revenueChartTitle}
        placeholderMessage={reports.revenueChart.placeholderMessage}
        rangeLabels={r.revenueRanges}
      />

      <div className="live-dashboard-split">
        <HourlySalesChart data={reports.hourlySales} title={r.hourlySalesTitle} />
        <PaymentMethods
          methods={reports.paymentMethods}
          title={r.paymentMethodsTitle}
          chartPlaceholder={r.chartPlaceholder}
        />
      </div>

      <TopProducts
        products={reports.topProducts}
        loading={data.loading}
        title={r.topProductsTitle}
        emptyLabel={r.topProductsEmpty}
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
        columns={{
          employee: r.colEmployee,
          orders: r.colOrders,
          revenue: r.colRevenue,
          avgOrder: r.colAvgOrder,
        }}
      />

      <div className="live-dashboard-split">
        <TaxesOverview taxes={reports.taxes} title={r.taxesTitle} />
        <BusinessTrends trends={reports.trends} title={r.trendsTitle} />
      </div>

      <ReportsFilters r={r} />

      <ReportsExports actions={reports.exports} title={r.exportsTitle} />
    </div>
  );
};

export default PortalReportsPage;
