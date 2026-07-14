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
import { PaymentOverview } from "../components/orders/PaymentOverview";
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
      />

      <LiveKpiStrip kpis={dashboard.kpis} loading={data.loading} isLight={isLight} />

      {dashboard.paymentSummary ? (
        <PaymentOverview
          payments={[
            {
              id: "cash",
              label: t.orders.paymentCash,
              value: data.loading
                ? t.labels.dash
                : new Intl.NumberFormat(locale, {
                    style: "currency",
                    currency: dashboard.paymentSummary.currency || "EUR",
                  }).format(dashboard.paymentSummary.cashCents / 100),
              tone: dashboard.paymentSummary.cashCents > 0 ? "ok" : "unknown",
            },
            {
              id: "card",
              label: t.orders.paymentCard,
              value: data.loading
                ? t.labels.dash
                : new Intl.NumberFormat(locale, {
                    style: "currency",
                    currency: dashboard.paymentSummary.currency || "EUR",
                  }).format(dashboard.paymentSummary.cardCents / 100),
              tone: dashboard.paymentSummary.cardCents > 0 ? "ok" : "unknown",
            },
            {
              id: "voucher",
              label: t.orders.paymentVoucher,
              value: data.loading
                ? t.labels.dash
                : new Intl.NumberFormat(locale, {
                    style: "currency",
                    currency: dashboard.paymentSummary.currency || "EUR",
                  }).format(dashboard.paymentSummary.voucherCents / 100),
              tone: dashboard.paymentSummary.voucherCents > 0 ? "ok" : "unknown",
            },
            {
              id: "other",
              label: t.orders.paymentOther,
              value: data.loading
                ? t.labels.dash
                : new Intl.NumberFormat(locale, {
                    style: "currency",
                    currency: dashboard.paymentSummary.currency || "EUR",
                  }).format(dashboard.paymentSummary.otherCents / 100),
              tone: dashboard.paymentSummary.otherCents > 0 ? "ok" : "unknown",
            },
          ]}
          title={l.paymentSummaryTitle}
          hint={dashboard.paymentSummary.cashCents + dashboard.paymentSummary.cardCents + dashboard.paymentSummary.voucherCents + dashboard.paymentSummary.otherCents === 0 ? o.waitingPosSyncShort : undefined}
        />
      ) : null}

      <DashboardRecentOrders
        orders={dashboard.recentOrders}
        title={l.recentOrdersTitle}
        emptyLabel={l.recentOrdersEmpty}
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
        <StoreStatusWidget items={dashboard.storeStatus} title={l.storeStatusTitle} />
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
        compact
      />
    </div>
  );
};

export default PortalDashboard;
