import type { PortalTranslations } from "../translations/portal";
import type {
  PortalDeviceAllowedAction,
  PortalDeviceManagementDevice,
  PortalDeviceManagementResponse,
} from "./portalDeviceApi";
import type { DeviceManagementCardView, DeviceManagementDerivedState } from "./deviceManagementTypes";

const LIFECYCLE_ORDER: Record<string, number> = {
  pending_approval: 0,
  active: 1,
  blocked: 2,
  rejected: 3,
  released: 4,
};

function formatPlanLabel(plan: string, t: PortalTranslations): string {
  const p = plan.trim().toLowerCase();
  if (p === "trial") return t.pos.planTrial;
  if (p === "starter") return t.pos.planStarter;
  if (p === "pro") return t.pos.planPro;
  if (p === "business") return t.pos.planBusiness;
  if (p === "enterprise") return t.pos.planEnterprise;
  return plan;
}

function lifecycleLabel(
  status: string,
  t: PortalTranslations,
): string {
  const d = t.devices;
  switch (status) {
    case "pending_approval":
      return d.lifecyclePending;
    case "active":
      return d.lifecycleActive;
    case "blocked":
      return d.lifecycleBlocked;
    case "rejected":
      return d.lifecycleRejected;
    case "released":
      return d.lifecycleReleased;
    default:
      return status;
  }
}

function lifecycleDescription(
  device: PortalDeviceManagementDevice,
  t: PortalTranslations,
): string {
  const d = t.devices;
  switch (device.lifecycleStatus) {
    case "pending_approval":
      return d.lifecyclePendingDesc;
    case "active":
      return d.lifecycleActiveDesc;
    case "blocked":
      return d.lifecycleBlockedDesc;
    case "rejected":
      return d.lifecycleRejectedDesc;
    case "released":
      return d.lifecycleReleasedDesc;
    default:
      return d.lifecycleUnknownDesc;
  }
}

function connectivityLabel(
  status: PortalDeviceManagementDevice["connectivityStatus"],
  t: PortalTranslations,
): string {
  const d = t.devices;
  if (status === "online") return d.statusOnline;
  if (status === "offline") return d.statusOffline;
  return d.statusNeverSeen;
}

function normalizeType(type: string, t: PortalTranslations): string {
  const dash = t.labels.dash;
  if (!type?.trim()) return dash;
  const s = type.toLowerCase();
  if (s === "pos") return "POS";
  if (s === "kiosk") return "Kiosk";
  return type;
}

function sortDevices(
  devices: PortalDeviceManagementDevice[],
): PortalDeviceManagementDevice[] {
  return [...devices].sort((a, b) => {
    const oa = LIFECYCLE_ORDER[a.lifecycleStatus] ?? 99;
    const ob = LIFECYCLE_ORDER[b.lifecycleStatus] ?? 99;
    if (oa !== ob) return oa - ob;
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });
}

export function deriveDeviceManagementState(input: {
  response: PortalDeviceManagementResponse | null;
  locale: string;
  t: PortalTranslations;
}): DeviceManagementDerivedState {
  const d = input.t.devices;
  const dash = input.t.labels.dash;
  const summary = input.response?.summary;
  const devices = input.response?.devices ?? [];

  const planLabel = summary?.plan
    ? formatPlanLabel(summary.plan, input.t)
    : dash;

  const maxDevices = summary?.unlimitedDevices
    ? null
    : (summary?.maxDevices ?? null);

  const usedSeats = summary?.usedSeats ?? 0;
  const remainingSeats = summary?.unlimitedDevices
    ? Number.POSITIVE_INFINITY
    : Math.max(0, summary?.remainingSeats ?? 0);

  const percent =
    maxDevices && maxDevices > 0
      ? Math.min(100, Math.round((usedSeats / maxDevices) * 100))
      : 0;

  const cards: DeviceManagementCardView[] = sortDevices(devices).map(
    (device) => ({
      id: device.id,
      name: device.name?.trim() || d.unnamedDevice,
      lifecycleStatus: device.lifecycleStatus,
      lifecycleLabel: lifecycleLabel(device.lifecycleStatus, input.t),
      lifecycleBadgeClass: badgeClassForStatus(device.lifecycleStatus),
      connectivityLabel: connectivityLabel(device.connectivityStatus, input.t),
      typeLabel: normalizeType(device.type, input.t),
      createdAtLabel: device.createdAt
        ? new Date(device.createdAt).toLocaleString(input.locale)
        : dash,
      lastContactLabel:
        device.connectivityStatus === "never_seen"
          ? d.statusNeverSeen
          : device.connectivityStatus === "online"
            ? d.statusOnline
            : d.statusOffline,
      fingerprintMasked: device.fingerprintMasked,
      appVersion: device.appVersion?.trim() || dash,
      licensePlan: device.licensePlan
        ? formatPlanLabel(device.licensePlan, input.t)
        : dash,
      statusDescription: lifecycleDescription(device, input.t),
      allowedActions: [...device.allowedActions] as PortalDeviceAllowedAction[],
      isHistorical:
        device.lifecycleStatus === "rejected" ||
        device.lifecycleStatus === "released",
    }),
  );

  const actionableDevices = cards.filter(
    (c) => c.allowedActions.length > 0 || !c.isHistorical,
  );

  return {
    seats: {
      planLabel,
      hasLicense: Boolean(summary?.plan),
      maxDevices,
      unlimitedDevices: summary?.unlimitedDevices ?? false,
      usedDevices: usedSeats,
      availableSlots: remainingSeats,
      percent,
      overLimit: summary?.overLimit ?? false,
      activeCount: summary?.activeCount ?? 0,
      blockedCount: summary?.blockedCount ?? 0,
      pendingCount: summary?.pendingCount ?? 0,
      rejectedCount: summary?.rejectedCount ?? 0,
      releasedCount: summary?.releasedCount ?? 0,
    },
    devices: cards,
    hasDevices: devices.length > 0,
    hasActionableDevices: actionableDevices.some((c) => c.allowedActions.length > 0),
    canApproveNew:
      !summary?.overLimit &&
      (summary?.unlimitedDevices ||
        (summary?.remainingSeats ?? 0) > 0),
  };
}

function badgeClassForStatus(status: string): string {
  switch (status) {
    case "pending_approval":
      return "devices-status-badge--warning";
    case "active":
      return "devices-status-badge--online";
    case "blocked":
      return "devices-status-badge--offline";
    case "rejected":
    case "released":
      return "devices-status-badge--released";
    default:
      return "devices-status-badge--warning";
  }
}
