import React from "react";
import { usePortalOutlet } from "./PortalLayout";
import { useTheme } from "../lib/theme";
import { useLanguage } from "../lib/LanguageContext";
import { getPortalTranslations } from "../lib/translations";
import { portalLocaleTag } from "../lib/portalLocale";
import { getPosReleaseConfig, getPortalEnvironmentLabel } from "../config/posConfig";
import { translatePortalEnvironment } from "../lib/posHub/format";
import { deriveDashboardState } from "../lib/dashboard/deriveDashboardState";
import { usePortalDashboardData } from "../lib/dashboard/usePortalDashboardData";
import {
  BusinessAlertCenter,
  DashboardQuickActions,
  DashboardRecentOrders,
  LiveDashboardHeader,
  LiveDashboardSkeleton,
  LiveKpiStrip,
  StoreStatusWidget,
  TodayActivityTimeline,
} from "../components/dashboard/LiveDashboardPanels";
import { OrdersErrorState } from "../components/orders/OrdersErrorState";
import { PaymentSummaryPair } from "../components/orders/PaymentSummaryPair";
import { portalPageShell } from "../lib/portalUi";

const PortalDashboard: React.FC = () => {
  const { customer } = usePortalOutlet();
  const { theme } = useTheme();
  const { language } = useLanguage();
  const t = getPortalTranslations(language);
  const l = t.dashboard.live;
  const o = t.orders;
  const locale = portalLocaleTag(language);
  const isLight = theme === "light";

  const release = React.useMemo(() => getPosReleaseConfig(), []);
  const data = usePortalDashboardData(customer);

  const envLabel = translatePortalEnvironment(getPortalEnvironmentLabel(), {
    production: t.pos.envProduction,
    staging: t.pos.envStaging,
    development: t.pos.envDevelopment,
  });

  const dashboard = React.useMemo(
    () =>
      deriveDashboardState({
        data,
        release,
        t,
        environmentLabel: envLabel,
        locale,
      }),
    [data, release, t, envLabel, locale],
  );

  const scrollToAlerts = React.useCallback(() => {
    document
      .getElementById("business-alerts")
      ?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, []);

  const showSalesError = !data.loading && data.salesSummaryError;

  if (data.loading && !data.lastSyncedAt) {
    return (
      <div className={portalPageShell()}>
        <LiveDashboardSkeleton />
      </div>
    );
  }

  return (
    <div className={`${portalPageShell()} dashboard-home live-dashboard`}>
      <LiveDashboardHeader
        businessName={dashboard.businessName}
        businessOnline={dashboard.businessOnline}
        environmentLabel={envLabel}
        locale={locale}
        alertCount={dashboard.alerts.length}
        onAlertsClick={scrollToAlerts}
        l={l}
        onRefresh={data.reload}
        refreshing={data.refreshing}
        refreshLabel={l.actionRefresh}
        refreshLoadingLabel={l.refreshLoading}
        autoRefreshHint={l.autoRefreshHint}
      />

      <LiveKpiStrip
        kpis={dashboard.kpis}
        loading={data.loading}
        isLight={isLight}
        gridClassName="dashboard-kpi-grid dashboard-kpi-grid--five"
      />

      {showSalesError ? (
        <OrdersErrorState
          headline={l.errorHeadline}
          description={l.errorDescription}
          retryLabel={l.errorRetry}
          onRetry={data.reload}
          isLight={isLight}
          loading={data.refreshing}
        />
      ) : null}

      <PaymentSummaryPair
        pos={{
          payments: dashboard.paymentCards,
          title: l.paymentSummaryTitle,
          hint: dashboard.hasSalesData ? undefined : o.paymentEmptyHint,
        }}
        online={{
          payments: dashboard.onlinePaymentCards,
          title: o.onlinePaymentSummaryTitle,
          hint: dashboard.hasSalesData ? undefined : o.paymentEmptyHint,
          infoHint: dashboard.hasSalesData ? o.onlinePaymentSummaryInfo : undefined,
          revenueHeader: dashboard.onlineRevenueHeader,
        }}
      />

      <DashboardRecentOrders
        orders={dashboard.recentOrders}
        title={l.recentOrdersTitle}
        emptyLabel={l.recentOrdersEmpty}
        loading={data.loading}
        loadingLabel={l.waiting}
        onlineBadgeLabel={o.onlineOrderBadge}
        columns={{
          time: o.colTime,
          orderNumber: o.colOrderNumber,
          status: o.colStatus,
          payment: o.colPayment,
          amount: o.colAmount,
          receipt: o.colReceiptLink,
        }}
      />

      <div className="live-dashboard-split">
        <StoreStatusWidget
          items={dashboard.storeStatus}
          title={l.storeStatusTitle}
          loading={data.loading}
          loadingLabel={l.waiting}
        />
        <DashboardQuickActions
          actions={dashboard.quickActions}
          release={release}
          title={l.quickActionsTitle}
        />
      </div>

      <BusinessAlertCenter
        alerts={dashboard.alerts}
        title={l.alertsTitle}
        emptyLabel={l.alertsEmpty}
      />

      <TodayActivityTimeline
        items={dashboard.activities}
        locale={locale}
        title={l.activityTitle}
        emptyLabel={l.activityEmpty}
        loading={data.loading}
        loadingLabel={l.waiting}
        compact
      />
    </div>
  );
};

export default PortalDashboard;
