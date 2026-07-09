import React from "react";
import { usePortalOutlet } from "./PortalLayout";
import { useTheme } from "../lib/theme";
import { useLanguage } from "../lib/LanguageContext";
import { getPortalTranslations } from "../lib/translations";
import { portalLocaleTag } from "../lib/portalLocale";
import { getPortalEnvironmentLabel, getPosReleaseConfig } from "../config/posConfig";
import { usePortalDevicesData } from "../lib/devices/usePortalDevicesData";
import { deriveDevicesState } from "../lib/devices/deriveDevicesState";
import { releasePortalDevice } from "../lib/portalApi";
import { DeviceSeatSummary } from "../components/devices/DeviceSeatSummary";
import { DeviceManagement } from "../components/devices/DeviceManagement";
import { DeviceEmptyState } from "../components/devices/DeviceEmptyState";
import { DevicesFooter } from "../components/devices/DevicesFooter";
import { ReleaseDeviceDialog } from "../components/devices/ReleaseDeviceDialog";
import { portalPageShell, portalPageSubtitle, portalPageTitle } from "../lib/portalUi";

const PortalDevicesPage: React.FC = () => {
  const { customer } = usePortalOutlet();
  const { theme } = useTheme();
  const { language } = useLanguage();
  const t = getPortalTranslations(language);
  const d = t.devices;
  const locale = portalLocaleTag(language);
  const isLight = theme === "light";

  const release = React.useMemo(() => getPosReleaseConfig(), []);
  const environmentLabel = React.useMemo(() => getPortalEnvironmentLabel(), []);
  const data = usePortalDevicesData(customer);

  const [releaseTargetId, setReleaseTargetId] = React.useState<string | null>(null);
  const [releaseBusy, setReleaseBusy] = React.useState(false);
  const [releaseError, setReleaseError] = React.useState<string | null>(null);

  const deriveInput = React.useMemo(
    () => ({ data, release, environmentLabel, locale, t }),
    [data, release, environmentLabel, locale, t],
  );

  const state = React.useMemo(() => deriveDevicesState(deriveInput), [deriveInput]);

  const showEmptyHero = !data.loading && !state.hasDevices;

  const cardLabels = {
    version: d.colVersion,
    heartbeat: d.colHeartbeat,
    lastSync: d.cardLastSync,
    license: d.colLicense,
    openPos: d.cardOpenPos,
    releaseDevice: d.cardReleaseDevice,
    releasedOn: d.releasedOn,
  };

  const slotLabels = {
    title: d.slotTitle,
    text: d.slotText,
    add: d.slotAdd,
    hint: d.slotHint,
  };

  const footerLinks = [
    { id: "licenses", label: d.footerLicenses, href: "/portal/licenses" },
    { id: "pos", label: d.footerPos, href: "/portal/pos" },
    { id: "support", label: d.footerSupport, href: "/portal/support" },
  ];

  const closeReleaseDialog = React.useCallback(() => {
    if (releaseBusy) return;
    setReleaseTargetId(null);
    setReleaseError(null);
  }, [releaseBusy]);

  const confirmRelease = React.useCallback(async () => {
    if (!releaseTargetId || releaseBusy) return;
    setReleaseBusy(true);
    setReleaseError(null);
    try {
      await releasePortalDevice(releaseTargetId);
      setReleaseTargetId(null);
      data.reload();
    } catch (err) {
      setReleaseError(
        err instanceof Error ? err.message : d.releaseDialogError,
      );
    } finally {
      setReleaseBusy(false);
    }
  }, [releaseTargetId, releaseBusy, data, d.releaseDialogError]);

  return (
    <div className={`${portalPageShell()} dashboard-home devices-center`}>
      <header className="space-y-1">
        <h1 className={portalPageTitle(isLight)}>{d.title}</h1>
        <p className={portalPageSubtitle(isLight)}>{d.subtitle}</p>
      </header>

      {data.loading ? (
        <p className={portalPageSubtitle(isLight)}>{d.loading}</p>
      ) : showEmptyHero ? (
        <DeviceEmptyState
          headline={d.emptyHeadline}
          description={d.emptyDescription}
          ctaLabel={d.emptyCta}
          downloadLabel={d.emptyDownload}
          release={release}
        />
      ) : (
        <>
          <DeviceSeatSummary
            seats={state.seats}
            labels={{
              planTitle: d.seatPlanTitle,
              noPlan: d.seatNoPlan,
              used: d.seatUsed,
              available: d.seatAvailable,
              full: d.seatFull,
            }}
          />
          <DeviceManagement
            title={d.managementTitle}
            slots={state.slots}
            cardLabels={cardLabels}
            slotLabels={slotLabels}
            release={release}
            onRelease={setReleaseTargetId}
          />
        </>
      )}

      <DevicesFooter links={footerLinks} isLight={isLight} />

      <ReleaseDeviceDialog
        open={releaseTargetId !== null}
        title={d.releaseDialogTitle}
        description={d.releaseDialogDescription}
        notice={d.releaseDialogNotice}
        cancelLabel={d.releaseDialogCancel}
        confirmLabel={d.releaseDialogConfirm}
        busy={releaseBusy}
        error={releaseError}
        onCancel={closeReleaseDialog}
        onConfirm={confirmRelease}
      />
    </div>
  );
};

export default PortalDevicesPage;
