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
  PosHubComingSoon,
  PosHubDevices,
  PosHubDownloadCard,
  PosHubLicenseCard,
  PosHubNotifications,
  PosHubQuickActions,
  PosHubReadiness,
  PosHubReleaseCenter,
  PosHubSystemStatus,
  PosHubVersionHero,
} from "../components/posHub/PosHubPanels";
import { portalPageShell, portalPageSubtitle, portalPageTitle } from "../lib/portalUi";

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

  const envLabel = translatePortalEnvironment(getPortalEnvironmentLabel(), {
    production: p.envProduction,
    staging: p.envStaging,
    development: p.envDevelopment,
  });

  const comingSoonItems = [
    p.comingSoonApiLatency,
    p.comingSoonSeatCount,
    p.comingSoonAutoUpdates,
    p.comingSoonPrinter,
    p.comingSoonCashDrawer,
    p.comingSoonOfflineSync,
    p.comingSoonFiscalStatus,
    p.comingSoonSystemHealth,
  ];

  return (
    <div className={portalPageShell()}>
      <header className="space-y-1">
        <h1 className={portalPageTitle(isLight)}>{p.title}</h1>
        <p className={portalPageSubtitle(isLight)}>{p.subtitle}</p>
      </header>

      <PosHubNotifications items={hub.notifications} isLight={isLight} />

      <PosHubVersionHero hub={hub} loading={hubData.loading} isLight={isLight} p={p} />

      <PosHubLicenseCard hub={hub} loading={hubData.loading} isLight={isLight} p={p} />

      <PosHubQuickActions release={release} isLight={isLight} p={p} />

      <PosHubDownloadCard release={release} isLight={isLight} p={p} locale={locale} />

      <PosHubReadiness
        items={hub.readiness}
        loading={hubData.loading}
        isLight={isLight}
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

      <PosHubSystemStatus
        hub={hub}
        envLabel={envLabel}
        loading={hubData.loading}
        isLight={isLight}
        p={p}
        dash={dash}
      />

      <PosHubReleaseCenter hub={hub} release={release} isLight={isLight} p={p} locale={locale} />

      <PosHubComingSoon items={comingSoonItems} isLight={isLight} p={p} />
    </div>
  );
};

export default PortalPosPage;
