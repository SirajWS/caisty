import React from "react";
import { usePortalOutlet } from "./PortalLayout";
import { useTheme } from "../lib/theme";
import { useLanguage } from "../lib/LanguageContext";
import { getPortalTranslations } from "../lib/translations";
import { portalLocaleTag } from "../lib/portalLocale";
import { getPosReleaseConfig, getPortalEnvironmentLabel } from "../config/posConfig";
import { derivePosHubState } from "../lib/posHub/derivePosHubState";
import { translatePortalEnvironment } from "../lib/posHub/format";
import { usePortalPosHubData } from "../lib/posHub/usePortalPosHubData";
import {
  PosHubActionPanel,
  PosHubComingSoon,
  PosHubDevices,
  PosHubHeader,
  PosHubKpiRow,
  PosHubNotifications,
  PosHubReadinessPanel,
  PosHubReleaseCenter,
  PosHubSkeleton,
  PosHubSystemStatus,
} from "../components/posHub/PosHubPanels";
import { portalPageShell } from "../lib/portalUi";

const PortalPosPage: React.FC = () => {
  const { customer } = usePortalOutlet();
  const { theme } = useTheme();
  const { language } = useLanguage();
  const t = getPortalTranslations(language);
  const p = t.pos;
  const locale = portalLocaleTag(language);
  const isLight = theme === "light";
  const dash = t.labels.dash;

  const release = React.useMemo(() => getPosReleaseConfig(), []);
  const hubData = usePortalPosHubData(customer);

  const envLabel = translatePortalEnvironment(getPortalEnvironmentLabel(), {
    production: p.envProduction,
    staging: p.envStaging,
    development: p.envDevelopment,
  });

  const hub = React.useMemo(
    () =>
      derivePosHubState({
        data: hubData,
        release,
        t,
        environmentLabel: getPortalEnvironmentLabel(),
      }),
    [hubData, release, t],
  );

  const comingSoonItems = [
    p.comingSoonAutoUpdates,
    p.comingSoonPrinter,
    p.comingSoonCashDrawer,
    p.comingSoonOfflineSync,
    p.comingSoonFiscalStatus,
    p.comingSoonSystemHealth,
  ];

  if (hubData.loading && !hubData.lastSyncedAt) {
    return (
      <div className={`${portalPageShell()} pos-hub-home`}>
        <PosHubHeader hub={hub} envLabel={envLabel} loading p={p} isLight={isLight} />
        <PosHubSkeleton />
      </div>
    );
  }

  return (
    <div className={`${portalPageShell()} pos-hub-home`}>
      <PosHubHeader
        hub={hub}
        envLabel={envLabel}
        loading={hubData.loading}
        isLight={isLight}
        p={p}
      />

      <PosHubNotifications items={hub.notifications} />

      <PosHubKpiRow
        hub={hub}
        deviceCount={hubData.devices.length}
        loading={hubData.loading}
        isLight={isLight}
        p={p}
      />

      <PosHubActionPanel release={release} isLight={isLight} p={p} />

      <PosHubReadinessPanel
        hub={hub}
        items={hub.readiness}
        loading={hubData.loading}
        p={p}
        dash={dash}
      />

      <PosHubDevices
        devices={hubData.devices}
        loading={hubData.loading}
        isLight={isLight}
        p={p}
        locale={locale}
        dash={dash}
      />

      <PosHubReleaseCenter
        hub={hub}
        release={release}
        isLight={isLight}
        p={p}
        locale={locale}
      />

      <PosHubSystemStatus
        hub={hub}
        envLabel={envLabel}
        loading={hubData.loading}
        p={p}
        dash={dash}
      />

      <PosHubComingSoon items={comingSoonItems} isLight={isLight} p={p} />
    </div>
  );
};

export default PortalPosPage;
