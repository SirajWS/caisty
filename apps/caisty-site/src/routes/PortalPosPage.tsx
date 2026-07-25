import React from "react";
import { usePortalOutlet } from "./PortalLayout";
import { useTheme } from "../lib/theme";
import { useLanguage } from "../lib/LanguageContext";
import { getPortalTranslations } from "../lib/translations";
import { portalLocaleTag } from "../lib/portalLocale";
import { getPosReleaseConfig } from "../config/posConfig";
import { derivePosHubState } from "../lib/posHub/derivePosHubState";
import { usePortalPosHubData } from "../lib/posHub/usePortalPosHubData";
import { PosHubNotifications } from "../components/posHub/PosHubPanels";
import { PosSummary } from "../components/posHub/PosSummary";
import { PosMainActions } from "../components/posHub/PosMainActions";
import { PosVersionUpdates } from "../components/posHub/PosVersionUpdates";
import { PosLaunchChecklist } from "../components/posHub/PosLaunchChecklist";
import { PosFooter } from "../components/posHub/PosFooter";
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

  const hub = React.useMemo(
    () =>
      derivePosHubState({
        data: hubData,
        release,
        t,
        environmentLabel: "",
      }),
    [hubData, release, t],
  );

  const footerLinks = [
    { id: "devices", label: p.footerDevices, href: "/portal/devices" },
    { id: "business", label: p.footerBusiness, href: "/portal/business" },
    { id: "support", label: p.footerSupport, href: "/portal/support" },
  ];

  if (hubData.loading && !hubData.lastSyncedAt) {
    return (
      <div className={`${portalPageShell()} pos-hub-home`}>
        <PosSummary
          summary={hub.summary}
          loading
          isLight={isLight}
          p={p}
          release={release}
          dash={dash}
        />
      </div>
    );
  }

  return (
    <div className={`${portalPageShell()} pos-hub-home`}>
      <PosSummary
        summary={hub.summary}
        loading={hubData.loading}
        isLight={isLight}
        p={p}
        release={release}
        dash={dash}
      />

      <PosHubNotifications items={hub.notifications} />

      <PosMainActions release={release} p={p} />

      <PosVersionUpdates hub={hub} release={release} p={p} locale={locale} />

      <PosLaunchChecklist
        hub={hub}
        items={hub.readiness}
        loading={hubData.loading}
        p={p}
        dash={dash}
      />

      <PosFooter links={footerLinks} isLight={isLight} />
    </div>
  );
};

export default PortalPosPage;
