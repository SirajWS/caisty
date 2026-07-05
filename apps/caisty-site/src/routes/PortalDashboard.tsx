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
  ConnectedDevicesWidget,
  LiveDashboardHeader,
  LiveDashboardSkeleton,
  LiveKpiStrip,
  ReleaseCenterWidget,
  RemoteControlWidget,
  StoreSnapshotCard,
  StoreStatusWidget,
  SystemHealthPanel,
  TodayActivityTimeline,
} from "../components/dashboard/LiveDashboardPanels";
import { portalPageShell } from "../lib/portalUi";

const PortalDashboard: React.FC = () => {
  const { customer } = usePortalOutlet();
  const { theme } = useTheme();
  const { language } = useLanguage();
  const t = getPortalTranslations(language);
  const l = t.dashboard.live;
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
      }),
    [data, release, t, envLabel],
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

      <div className="live-dashboard-split">
        <StoreStatusWidget items={dashboard.storeStatus} title={l.storeStatusTitle} />
        <RemoteControlWidget
          actions={dashboard.remoteActions}
          release={release}
          title={l.remoteTitle}
        />
      </div>

      <BusinessAlertCenter
        alerts={dashboard.alerts}
        title={l.alertsTitle}
        emptyLabel={l.alertsEmpty}
      />

      <div className="live-dashboard-split">
        <TodayActivityTimeline
          items={dashboard.activities}
          locale={locale}
          title={l.activityTitle}
          emptyLabel={l.activityEmpty}
        />
        <StoreSnapshotCard snapshot={dashboard.snapshot} l={l} />
      </div>

      <ConnectedDevicesWidget devices={dashboard.liveDevices} loading={data.loading} l={l} />

      <div className="live-dashboard-split">
        <ReleaseCenterWidget release={dashboard.releaseCenter} l={l} />
        <SystemHealthPanel items={dashboard.systemHealth} title={l.systemHealthTitle} />
      </div>
    </div>
  );
};

export default PortalDashboard;
