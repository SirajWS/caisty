import { countOnlineDevices } from "../dashboard/deriveDashboardState";
import { pickPrimaryPortalLicense } from "../portalLicensePick";
import { isUpdateAvailable, pickHighestSemver } from "../posHub/posVersion";
import { deriveFiscalVisibility } from "../useFiscalVisibility";
import type { PortalDevice } from "../portalApi";
import type { PosHubTone } from "../posHub/types";
import type {
  DeriveDevicesInput,
  DeviceAlert,
  DeviceCardStatus,
  DeviceCardView,
  DeviceDetailView,
  DeviceHealthItem,
  DeviceHealthStatus,
  DeviceKpi,
  DeviceSeatSummaryView,
  DeviceSlotView,
  DeviceTimelineEvent,
  DevicesDerivedState,
  RemoteAction,
  VersionManagementView,
} from "./types";

function resolveLicenseKey(device: PortalDevice): string | null {
  const key = device.licenseKey ?? device.licenseKeys?.[0]?.key ?? null;
  return key?.trim() ? key.trim() : null;
}

function formatPlanLabel(plan: string, t: DeriveDevicesInput["t"]): string {
  const p = plan.trim().toLowerCase();
  if (p === "trial") return t.pos.planTrial;
  if (p === "starter") return t.pos.planStarter;
  if (p === "pro") return t.pos.planPro;
  if (p === "business") return t.pos.planBusiness;
  if (p === "enterprise") return t.pos.planEnterprise;
  return plan || t.labels.dash;
}

function latestHeartbeat(devices: PortalDevice[]): string | null {
  let latest: number | null = null;
  for (const device of devices) {
    if (!device.lastSeenAt) continue;
    const ts = new Date(device.lastSeenAt).getTime();
    if (Number.isFinite(ts) && (latest === null || ts > latest)) {
      latest = ts;
    }
  }
  return latest !== null ? new Date(latest).toISOString() : null;
}

function normalizePlatform(
  raw: string | null | undefined,
  dash: string,
): string {
  if (!raw?.trim()) return dash;
  const s = raw.toLowerCase();
  if (s.includes("win")) return "Windows";
  if (s.includes("mac") || s.includes("darwin")) return "macOS";
  if (s.includes("linux")) return "Linux";
  if (s.includes("tablet") || s.includes("ipad") || s.includes("android")) {
    return "Tablet";
  }
  return raw.trim();
}

function isReleasedDevice(device: PortalDevice): boolean {
  return device.bindingStatus === "released";
}

function deriveCardStatus(device: PortalDevice): DeviceCardStatus {
  if (isReleasedDevice(device)) return "offline";
  const s = (device.status ?? "").toLowerCase();
  if (s === "online") return "online";
  if (s === "offline") return "offline";
  return "warning";
}

function statusTone(status: DeviceCardStatus): PosHubTone {
  if (status === "online") return "ok";
  if (status === "offline") return "unknown";
  return "attention";
}

function statusLabel(
  device: PortalDevice,
  t: DeriveDevicesInput["t"],
): string {
  if (isReleasedDevice(device)) return t.devices.statusReleased;
  const s = (device.status ?? "").toLowerCase();
  if (s === "online") return t.devices.statusOnline;
  if (s === "offline") return t.devices.statusOffline;
  if (s === "never_seen") return t.devices.statusWarning;
  return t.devices.statusWarning;
}

function statusToneForDevice(
  device: PortalDevice,
  cardStatus: DeviceCardStatus,
): PosHubTone {
  if (isReleasedDevice(device)) return "unknown";
  return statusTone(cardStatus);
}

function countNeedsAttention(devices: PortalDevice[], latestVersion: string): number {
  return devices.filter((d) => {
    if (isReleasedDevice(d)) return false;
    const s = (d.status ?? "").toLowerCase();
    if (s === "offline" || s === "never_seen") return true;
    if (!resolveLicenseKey(d)) return true;
    if (d.appVersion?.trim() && isUpdateAvailable(d.appVersion, latestVersion)) {
      return true;
    }
    return false;
  }).length;
}

function deriveOverview(input: DeriveDevicesInput): DeviceKpi[] {
  const d = input.t.devices;
  const dash = input.t.labels.dash;
  const waiting = d.waitingSync;
  const { devices } = input.data;
  const activeDevices = devices.filter((d) => !isReleasedDevice(d));
  const { online } = countOnlineDevices(activeDevices);
  const total = devices.length;
  const offline = devices.filter(
    (dev) =>
      !isReleasedDevice(dev) &&
      (dev.status ?? "").toLowerCase() === "offline",
  ).length;
  const needsAttention = countNeedsAttention(devices, input.release.latestVersion);
  const lastBeat = latestHeartbeat(devices);
  const installed = pickHighestSemver(devices.map((dev) => dev.appVersion));

  const lastSyncValue = lastBeat
    ? new Date(lastBeat).toLocaleString(input.locale)
    : dash;
  const lastSyncHint = lastBeat ? undefined : waiting;

  const versionValue = installed ?? dash;
  const versionHint = installed ? undefined : waiting;

  return [
    { id: "total", label: d.kpiTotal, value: String(total) },
    { id: "online", label: d.kpiOnline, value: String(online) },
    { id: "offline", label: d.kpiOffline, value: String(offline) },
    {
      id: "attention",
      label: d.kpiNeedsAttention,
      value: total > 0 ? String(needsAttention) : dash,
      hint: total === 0 ? waiting : undefined,
    },
    {
      id: "last_sync",
      label: d.kpiLastSync,
      value: lastSyncValue,
      hint: lastSyncHint,
    },
    {
      id: "pos_version",
      label: d.kpiPosVersion,
      value: versionValue,
      hint: versionHint,
    },
  ];
}

function deriveDeviceCards(input: DeriveDevicesInput): DeviceCardView[] {
  const d = input.t.devices;
  const dash = input.t.labels.dash;
  const waiting = d.waitingSync;
  const storeFallback =
    input.data.business?.legalName?.trim() ||
    input.data.business?.companyName?.trim() ||
    dash;

  return input.data.devices.map((device) => {
    const released = isReleasedDevice(device);
    const cardStatus = deriveCardStatus(device);
    const isOnline = !released && cardStatus === "online";
    const releasedAtLabel =
      released && device.releasedAt
        ? new Date(device.releasedAt).toLocaleString(input.locale)
        : null;

    return {
      id: device.id,
      name: device.name?.trim() || device.deviceId || dash,
      platform: normalizePlatform(device.platform, dash),
      version: device.appVersion?.trim() || waiting,
      currentUser: waiting,
      heartbeat: device.lastSeenAt
        ? new Date(device.lastSeenAt).toLocaleString(input.locale)
        : waiting,
      lastSync: input.data.lastSyncedAt
        ? input.data.lastSyncedAt.toLocaleString(input.locale)
        : waiting,
      connection: isOnline ? d.connectionConnected : d.connectionDisconnected,
      cloudStatus: isOnline ? d.cloudConnected : d.cloudDisconnected,
      environment: input.environmentLabel,
      license: released ? d.releasedLicense : resolveLicenseKey(device) || d.notLinked,
      store: device.storeName?.trim() || device.location?.trim() || storeFallback,
      status: cardStatus,
      statusLabel: statusLabel(device, input.t),
      statusTone: statusToneForDevice(device, cardStatus),
      isReleased: released,
      releasedAtLabel,
      source: device,
    };
  });
}

function deriveAlerts(input: DeriveDevicesInput): DeviceAlert[] {
  const d = input.t.devices;
  const alerts: DeviceAlert[] = [];
  const { devices, error } = input.data;
  const latest = input.release.latestVersion;
  const fiscal = deriveFiscalVisibility(input.data.business);

  if (error) {
    alerts.push({
      id: "cloud-disconnected",
      tone: "action_required",
      message: d.alertCloudDisconnected,
    });
  }

  for (const device of devices) {
    if (isReleasedDevice(device)) continue;
    const name = device.name?.trim() || device.deviceId || d.unnamedDevice;
    const s = (device.status ?? "").toLowerCase();

    if (s === "offline") {
      alerts.push({
        id: `offline-${device.id}`,
        tone: "attention",
        message: d.alertDeviceOffline.replace("{{name}}", name),
      });
    }

    if (s === "offline" && device.lastSeenAt) {
      alerts.push({
        id: `heartbeat-${device.id}`,
        tone: "attention",
        message: d.alertHeartbeatLost.replace("{{name}}", name),
      });
    }

    if (device.appVersion?.trim() && isUpdateAvailable(device.appVersion, latest)) {
      alerts.push({
        id: `update-${device.id}`,
        tone: "attention",
        message: d.alertUpdateAvailable.replace("{{name}}", name),
      });
    }
  }

  if (fiscal.fiscalRequired && !fiscal.isActive) {
    alerts.push({
      id: "fiscal-inactive",
      tone: "attention",
      message: d.alertFiscalInactive,
    });
  }

  return alerts.slice(0, 12);
}

function derivePageHealth(input: DeriveDevicesInput): DeviceHealthItem[] {
  const d = input.t.devices;
  const { online, total } = countOnlineDevices(input.data.devices);
  const cloudOnline: DeviceHealthStatus =
    input.data.error ? "offline" : total > 0 && online > 0 ? "online" : "unknown";

  const healthLabel = (status: DeviceHealthStatus): string => {
    if (status === "online") return d.healthOnline;
    if (status === "offline") return d.healthOffline;
    return d.healthUnknown;
  };

  const items: Array<{ id: string; label: string; status: DeviceHealthStatus }> = [
    { id: "cloud", label: d.healthCloud, status: cloudOnline },
    { id: "printer", label: d.healthPrinter, status: "unknown" },
    { id: "drawer", label: d.healthCashDrawer, status: "unknown" },
    { id: "fiscal", label: d.healthFiscal, status: "unknown" },
    { id: "scanner", label: d.healthScanner, status: "unknown" },
    { id: "display", label: d.healthCustomerDisplay, status: "unknown" },
    { id: "internet", label: d.healthInternet, status: "unknown" },
    { id: "updates", label: d.healthUpdates, status: "unknown" },
  ];

  return items.map((item) => ({
    ...item,
    statusLabel: healthLabel(item.status),
  }));
}

function deriveVersion(input: DeriveDevicesInput): VersionManagementView {
  const d = input.t.devices;
  const p = input.t.pos;
  const dash = input.t.labels.dash;
  const installed = pickHighestSemver(input.data.devices.map((dev) => dev.appVersion));
  const latest = input.release.latestVersion;
  const updateAvailable = isUpdateAvailable(installed, latest);

  const releaseDate = input.release.releaseDate
    ? new Date(input.release.releaseDate).toLocaleDateString(input.locale)
    : p.valueNotAvailable;

  const releaseNotes =
    input.release.releaseNotesSummary ||
    (input.release.releaseNotesUrl ? p.releaseNotesView : p.releaseNotesUnavailable);

  return {
    latestVersion: latest,
    installedVersion: installed ?? dash,
    updateAvailable,
    updateAvailableLabel: updateAvailable ? d.updateAvailableYes : d.updateAvailableNo,
    releaseDate,
    downloadUrl: input.release.installer.downloadUrl,
    releaseNotes,
    releaseNotesUrl: input.release.releaseNotesUrl ?? undefined,
    updateTone: updateAvailable ? "attention" : installed ? "ok" : "unknown",
  };
}

export function deriveDeviceDetail(
  card: DeviceCardView,
  input: DeriveDevicesInput,
): DeviceDetailView {
  const dash = input.t.labels.dash;
  const businessName =
    input.data.business?.legalName?.trim() ||
    input.data.business?.companyName?.trim() ||
    dash;

  return {
    deviceId: card.source.deviceId || dash,
    hostname: card.name,
    platform: card.platform,
    architecture: input.t.devices.waitingSync,
    installedVersion: card.source.appVersion?.trim() || dash,
    latestVersion: input.release.latestVersion,
    lastHeartbeat: card.heartbeat,
    cloudConnected: card.cloudStatus,
    environment: card.environment,
    license: card.license,
    store: card.store,
    business: businessName,
  };
}

export function deriveDeviceTimeline(
  card: DeviceCardView,
  input: DeriveDevicesInput,
): DeviceTimelineEvent[] {
  const d = input.t.devices;
  const items: DeviceTimelineEvent[] = [];
  const device = card.source;
  const name = card.name;

  if (device.lastSeenAt) {
    const isOnline = card.status === "online";
    items.push({
      id: `dev-${device.id}`,
      kind: isOnline ? "device_connected" : "device_disconnected",
      label: isOnline
        ? `${d.eventDeviceConnected} · ${name}`
        : `${d.eventDeviceDisconnected} · ${name}`,
      at: device.lastSeenAt,
    });
  }

  if (input.data.lastSyncedAt) {
    items.push({
      id: "cloud-sync",
      kind: "cloud_synced",
      label: d.eventCloudSynced,
      at: input.data.lastSyncedAt.toISOString(),
    });
  }

  return items
    .filter((e) => Number.isFinite(new Date(e.at).getTime()))
    .sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime())
    .slice(0, 10);
}

export function deriveDeviceHealth(
  card: DeviceCardView,
  input: DeriveDevicesInput,
): DeviceHealthItem[] {
  const d = input.t.devices;
  const cloudStatus: DeviceHealthStatus =
    card.status === "online" ? "online" : card.status === "offline" ? "offline" : "unknown";

  const healthLabel = (status: DeviceHealthStatus): string => {
    if (status === "online") return d.healthOnline;
    if (status === "offline") return d.healthOffline;
    return d.healthUnknown;
  };

  const items: Array<{ id: string; label: string; status: DeviceHealthStatus }> = [
    { id: "cloud", label: d.healthCloud, status: cloudStatus },
    { id: "printer", label: d.healthPrinter, status: "unknown" },
    { id: "drawer", label: d.healthCashDrawer, status: "unknown" },
    { id: "fiscal", label: d.healthFiscal, status: "unknown" },
    { id: "scanner", label: d.healthScanner, status: "unknown" },
    { id: "display", label: d.healthCustomerDisplay, status: "unknown" },
    { id: "internet", label: d.healthInternet, status: "unknown" },
    { id: "updates", label: d.healthUpdates, status: "unknown" },
  ];

  return items.map((item) => ({
    ...item,
    statusLabel: healthLabel(item.status),
  }));
}

export function deriveRemoteActions(input: DeriveDevicesInput): RemoteAction[] {
  const d = input.t.devices;
  const badge = d.comingSoon;

  return [
    { id: "open", label: d.actionOpenDesktop, disabled: false, action: "desktop_protocol" },
    { id: "restart_pos", label: d.actionRestartPos, disabled: true, badge },
    { id: "restart_sync", label: d.actionRestartSync, disabled: true, badge },
    { id: "download_logs", label: d.actionDownloadLogs, disabled: true, badge },
    { id: "restart_device", label: d.actionRestartDevice, disabled: true, badge },
    { id: "lock_pos", label: d.actionLockPos, disabled: true, badge },
    { id: "shutdown_pos", label: d.actionShutdownPos, disabled: true, badge },
  ];
}

/**
 * Seat/plan summary from the primary license. maxDevices comes from the license;
 * null / unlimitedDevices = unlimited seats (do not coerce to 0 or 1).
 */
export function deriveDeviceSeats(
  cards: DeviceCardView[],
  input: DeriveDevicesInput,
): DeviceSeatSummaryView {
  const primary = pickPrimaryPortalLicense(input.data.licenses);
  const plan = primary?.plan ?? "";
  const usedDevices = cards.filter((card) => !card.isReleased).length;
  const unlimitedDevices =
    Boolean(primary?.unlimitedDevices) ||
    (primary != null && primary.maxDevices === null);

  if (!primary) {
    return {
      plan,
      planLabel: formatPlanLabel(plan, input.t),
      hasLicense: false,
      maxDevices: 0,
      usedDevices,
      availableSlots: 0,
      percent: 0,
      unlimitedDevices: false,
    };
  }

  if (unlimitedDevices) {
    return {
      plan,
      planLabel: formatPlanLabel(plan, input.t),
      hasLicense: true,
      maxDevices: null,
      usedDevices,
      availableSlots: Number.POSITIVE_INFINITY,
      percent: 0,
      unlimitedDevices: true,
    };
  }

  const maxDevices = Math.max(0, primary.maxDevices ?? 0);
  const availableSlots = Math.max(0, maxDevices - usedDevices);
  const percent =
    maxDevices > 0 ? Math.min(100, Math.round((usedDevices / maxDevices) * 100)) : 0;

  return {
    plan,
    planLabel: formatPlanLabel(plan, input.t),
    hasLicense: true,
    maxDevices,
    usedDevices,
    availableSlots,
    percent,
    unlimitedDevices: false,
  };
}

/**
 * Ordered grid slots: registered devices first, then free seats up to maxDevices.
 * Unlimited plans show registered devices only (no empty-slot flood).
 */
export function deriveDeviceSlots(
  cards: DeviceCardView[],
  seats: DeviceSeatSummaryView,
): DeviceSlotView[] {
  const slots: DeviceSlotView[] = cards.map((card) => ({
    kind: "device",
    id: card.id,
    card,
  }));

  if (seats.unlimitedDevices || !Number.isFinite(seats.availableSlots)) {
    return slots;
  }

  for (let i = 0; i < seats.availableSlots; i += 1) {
    slots.push({ kind: "empty", id: `empty-${i}` });
  }

  return slots;
}

export function deriveDevicesState(input: DeriveDevicesInput): DevicesDerivedState {
  const d = input.t.devices;
  const cards = deriveDeviceCards(input);
  const seats = deriveDeviceSeats(cards, input);

  return {
    overview: deriveOverview(input),
    devices: cards,
    alerts: deriveAlerts(input),
    version: deriveVersion(input),
    multiStore: {
      title: d.multiStoreTitle,
      description: d.multiStoreDescription,
      stores: [d.multiStorePlaceholderA, d.multiStorePlaceholderB, d.multiStorePlaceholderC],
    },
    health: derivePageHealth(input),
    hasDevices: cards.length > 0,
    seats,
    slots: deriveDeviceSlots(cards, seats),
  };
}
