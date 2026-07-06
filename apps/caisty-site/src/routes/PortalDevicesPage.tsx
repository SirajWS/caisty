import React from "react";
import { usePortalOutlet } from "./PortalLayout";
import { useTheme } from "../lib/theme";
import { useLanguage } from "../lib/LanguageContext";
import { getPortalTranslations } from "../lib/translations";
import { portalLocaleTag } from "../lib/portalLocale";
import { getPortalEnvironmentLabel, getPosReleaseConfig } from "../config/posConfig";
import { usePortalDevicesData } from "../lib/devices/usePortalDevicesData";
import {
  deriveDeviceDetail,
  deriveDeviceHealth,
  deriveDevicesState,
  deriveDeviceTimeline,
  deriveRemoteActions,
} from "../lib/devices/deriveDevicesState";
import { DeviceOverview } from "../components/devices/DeviceOverview";
import { DeviceGrid } from "../components/devices/DeviceGrid";
import { DeviceDetailsDrawer } from "../components/devices/DeviceDetailsDrawer";
import { DeviceTimeline } from "../components/devices/DeviceTimeline";
import { DeviceHealth } from "../components/devices/DeviceHealth";
import { RemoteActions } from "../components/devices/RemoteActions";
import { VersionManagement } from "../components/devices/VersionManagement";
import { DeviceAlerts } from "../components/devices/DeviceAlerts";
import { DeviceMultiStorePlaceholder } from "../components/devices/DeviceMultiStorePlaceholder";
import { DeviceEmptyState } from "../components/devices/DeviceEmptyState";
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

  const [selectedId, setSelectedId] = React.useState<string | null>(null);

  const deriveInput = React.useMemo(
    () => ({ data, release, environmentLabel, locale, t }),
    [data, release, environmentLabel, locale, t],
  );

  const monitor = React.useMemo(
    () => deriveDevicesState(deriveInput),
    [deriveInput],
  );

  const selectedDevice = React.useMemo(
    () => monitor.devices.find((dev) => dev.id === selectedId) ?? null,
    [monitor.devices, selectedId],
  );

  const selectedDetail = React.useMemo(
    () => (selectedDevice ? deriveDeviceDetail(selectedDevice, deriveInput) : null),
    [selectedDevice, deriveInput],
  );

  const selectedTimeline = React.useMemo(
    () => (selectedDevice ? deriveDeviceTimeline(selectedDevice, deriveInput) : []),
    [selectedDevice, deriveInput],
  );

  const selectedHealth = React.useMemo(
    () => (selectedDevice ? deriveDeviceHealth(selectedDevice, deriveInput) : monitor.health),
    [selectedDevice, deriveInput, monitor.health],
  );

  const remoteActions = React.useMemo(
    () => deriveRemoteActions(deriveInput),
    [deriveInput],
  );

  const showEmptyHero = !data.loading && !monitor.hasDevices;

  const cardLabels = {
    platform: d.colPlatform,
    version: d.colVersion,
    currentUser: d.colCurrentUser,
    heartbeat: d.colHeartbeat,
    connection: d.colConnection,
    cloudStatus: d.colCloudStatus,
    environment: d.colEnvironment,
    license: d.colLicense,
    store: d.colStore,
  };

  return (
    <div className={`${portalPageShell()} dashboard-home devices-center`}>
      <header className="space-y-1">
        <h1 className={portalPageTitle(isLight)}>{d.title}</h1>
        <p className={portalPageSubtitle(isLight)}>{d.subtitle}</p>
      </header>

      <DeviceOverview kpis={monitor.overview} loading={data.loading} isLight={isLight} />

      {showEmptyHero ? (
        <DeviceEmptyState
          headline={d.emptyHeadline}
          description={d.emptyDescription}
          ctaLabel={d.emptyCta}
          release={release}
        />
      ) : monitor.hasDevices ? (
        <DeviceGrid
          devices={monitor.devices}
          title={d.gridTitle}
          labels={cardLabels}
          onSelect={setSelectedId}
        />
      ) : null}

      <DeviceAlerts alerts={monitor.alerts} title={d.alertsTitle} emptyLabel={d.alertsEmpty} />

      <div className="live-dashboard-split">
        <DeviceHealth items={selectedHealth} title={d.healthTitle} />
        <DeviceTimeline
          events={selectedDevice ? selectedTimeline : []}
          locale={locale}
          title={d.timelineTitle}
          emptyLabel={selectedDevice ? d.timelineEmpty : d.timelineSelectDevice}
        />
      </div>

      <RemoteActions actions={remoteActions} title={d.remoteActionsTitle} release={release} />

      <VersionManagement
        version={monitor.version}
        labels={{
          title: d.versionTitle,
          latestVersion: d.versionLatest,
          installedVersion: d.versionInstalled,
          updateAvailable: d.versionUpdateAvailable,
          releaseDate: d.versionReleaseDate,
          downloadInstaller: d.versionDownload,
          releaseNotes: d.versionReleaseNotes,
        }}
      />

      <DeviceMultiStorePlaceholder multiStore={monitor.multiStore} futureLabel={d.comingSoon} />

      <DeviceDetailsDrawer
        open={Boolean(selectedDevice && selectedDetail)}
        device={selectedDevice}
        detail={selectedDetail}
        labels={{
          title: d.drawerTitle,
          close: d.drawerClose,
          deviceId: d.detailDeviceId,
          hostname: d.detailHostname,
          platform: d.detailPlatform,
          architecture: d.detailArchitecture,
          installedVersion: d.detailInstalledVersion,
          latestVersion: d.detailLatestVersion,
          lastHeartbeat: d.detailLastHeartbeat,
          cloudConnected: d.detailCloudConnected,
          environment: d.detailEnvironment,
          license: d.detailLicense,
          store: d.detailStore,
          business: d.detailBusiness,
        }}
        onClose={() => setSelectedId(null)}
      />
    </div>
  );
};

export default PortalDevicesPage;
