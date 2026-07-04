import type { PosReleaseConfig } from "../../config/posConfig";
import {
  isStepCompanyDone,
  isStepInstallDone,
  isStepLicensePlanDone,
} from "../derivePortalSetupSteps";
import { pickPrimaryPortalLicense } from "../portalLicensePick";
import type {
  PortalCustomer,
  PortalDevice,
  PortalInvoice,
  PortalLicense,
} from "../portalApi";
import { deriveFiscalVisibility } from "../useFiscalVisibility";
import { formatLicenseStatus } from "../caistyTerminology";
import {
  isUpdateAvailable,
  pickHighestSemver,
} from "./posVersion";
import type {
  DerivePosHubInput,
  PosHubDerivedState,
  PosHubLicenseView,
  PosHubNotification,
  PosHubReadinessItem,
  PosHubSystemStatus,
  PosHubTone,
  PosHubVersionView,
} from "./types";

const LICENSE_EXPIRY_WARNING_DAYS = 30;

function deriveInstalledVersion(devices: PortalDevice[]): string | null {
  return pickHighestSemver(devices.map((d) => d.appVersion));
}

function licenseStatusTone(
  license: PortalLicense | null,
  status: string,
): PosHubTone {
  const s = status.toLowerCase();
  if (!license) return "action_required";
  if (s === "active") return "ok";
  if (s === "expired" || s === "revoked" || s === "suspended") {
    return "action_required";
  }
  if (s === "pending") return "attention";
  return "unknown";
}

function formatPlanLabel(plan: string, t: DerivePosHubInput["t"]): string {
  const p = plan.trim().toLowerCase();
  if (p === "trial") return t.pos.planTrial;
  if (p === "starter") return t.pos.planStarter;
  if (p === "pro") return t.pos.planPro;
  if (p === "enterprise") return t.pos.planEnterprise;
  return plan || t.labels.dash;
}

function daysUntil(iso: string | null | undefined): number | null {
  if (!iso) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  const diff = d.getTime() - Date.now();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

function deriveLicenseView(
  licenses: PortalLicense[],
  customer: PortalCustomer,
  invoices: PortalInvoice[],
  t: DerivePosHubInput["t"],
): PosHubLicenseView {
  const primary = pickPrimaryPortalLicense(licenses);
  const dash = t.labels.dash;
  const upgradeHref = "/portal/plan";

  if (!primary) {
    return {
      planLabel: dash,
      statusLabel: t.pos.statusNoLicense,
      statusTone: "action_required",
      validUntilLabel: dash,
      showUpgrade: true,
      upgradeHref,
      maxDevices: null,
    };
  }

  const status = (primary.status ?? "").toLowerCase();
  const planLabel = formatPlanLabel(primary.plan, t);
  const statusLabel = formatLicenseStatus(primary.status);
  const validUntilLabel = primary.validUntil
    ? new Date(primary.validUntil).toLocaleDateString()
    : dash;

  const showUpgrade =
    status === "expired" ||
    status === "revoked" ||
    status === "suspended" ||
    (primary.plan ?? "").toLowerCase() === "trial" ||
    !isStepLicensePlanDone(licenses, customer, invoices);

  return {
    planLabel,
    statusLabel,
    statusTone: licenseStatusTone(primary, status),
    validUntilLabel,
    showUpgrade,
    upgradeHref,
    maxDevices: primary.maxDevices ?? null,
  };
}

function deriveVersionView(
  devices: PortalDevice[],
  release: PosReleaseConfig,
  t: DerivePosHubInput["t"],
): PosHubVersionView {
  const installed = deriveInstalledVersion(devices);
  const latest = release.latestVersion;
  const updateAvailable = isUpdateAvailable(installed, latest);

  return {
    installed,
    installedLabel: installed ?? t.pos.versionUnknown,
    latest,
    updateAvailable,
    updateStatusLabel: updateAvailable
      ? t.pos.updateAvailable
      : installed
        ? t.pos.upToDate
        : t.pos.versionUnknown,
    updateTone: updateAvailable
      ? "attention"
      : installed
        ? "ok"
        : "unknown",
  };
}

function deriveReadiness(
  input: DerivePosHubInput,
  fiscalVisibility: ReturnType<typeof deriveFiscalVisibility>,
): PosHubReadinessItem[] {
  const { data, t } = input;
  const p = t.pos;
  const { business, licenses, devices, customer, invoices } = data;

  const businessDone = isStepCompanyDone(business);
  const licenseDone = isStepLicensePlanDone(licenses, customer, invoices);
  const deviceDone = isStepInstallDone(devices.length);
  const cloudDone = !data.error && !data.loading;

  const fiscalDone =
    !fiscalVisibility.fiscalRequired || fiscalVisibility.isActive;

  function fiscalStatus(): { label: string; tone: PosHubTone } {
    if (!business?.country) {
      return { label: p.statusNotConfigured, tone: "unknown" };
    }
    if (!fiscalVisibility.fiscalRequired) {
      return { label: p.statusNotRequired, tone: "ok" };
    }
    if (fiscalVisibility.isActive) {
      return { label: p.statusActive, tone: "ok" };
    }
    if (fiscalVisibility.isPendingSetup) {
      return { label: p.statusPending, tone: "attention" };
    }
    return { label: p.statusIncomplete, tone: "action_required" };
  }

  const fiscal = fiscalStatus();

  return [
    {
      id: "business",
      label: p.readinessBusiness,
      statusLabel: businessDone ? p.statusReady : p.statusIncomplete,
      tone: businessDone ? "ok" : "action_required",
      done: businessDone,
      href: "/portal/business",
    },
    {
      id: "fiscal",
      label: p.readinessFiscal,
      statusLabel: fiscal.label,
      tone: fiscal.tone,
      done: fiscalDone,
      href: "/portal/business",
    },
    {
      id: "license",
      label: p.readinessLicense,
      statusLabel: licenseDone
        ? formatPlanLabel(
            pickPrimaryPortalLicense(licenses)?.plan ?? "",
            t,
          )
        : p.statusNoLicense,
      tone: licenseDone ? "ok" : "action_required",
      done: licenseDone,
      href: "/portal/licenses",
    },
    {
      id: "device",
      label: p.readinessDevice,
      statusLabel: deviceDone
        ? p.statusConnected
        : p.statusNotConfigured,
      tone: deviceDone ? "ok" : "attention",
      done: deviceDone,
      href: "/portal/devices",
    },
    {
      id: "cloud",
      label: p.readinessCloud,
      statusLabel: cloudDone ? p.statusConnected : p.statusDisconnected,
      tone: cloudDone ? "ok" : "action_required",
      done: cloudDone,
      href: "/portal/support",
    },
  ];
}

function deriveNotifications(
  input: DerivePosHubInput,
  version: PosHubVersionView,
  license: PosHubLicenseView,
  fiscalVisibility: ReturnType<typeof deriveFiscalVisibility>,
): PosHubNotification[] {
  const { data, t } = input;
  const p = t.pos;
  const items: PosHubNotification[] = [];

  if (version.updateAvailable) {
    items.push({
      id: "update",
      tone: "attention",
      message: p.notifyUpdateAvailable.replace(
        "{{version}}",
        version.latest,
      ),
      href: "#pos-release-center",
    });
  }

  const primary = pickPrimaryPortalLicense(data.licenses);
  const days = daysUntil(primary?.validUntil);
  if (
    primary &&
    days !== null &&
    days >= 0 &&
    days <= LICENSE_EXPIRY_WARNING_DAYS
  ) {
    items.push({
      id: "license-expiry",
      tone: days <= 7 ? "action_required" : "attention",
      message: p.notifyLicenseExpires.replace("{{days}}", String(days)),
      href: "/portal/plan",
    });
  }

  if (
    fiscalVisibility.fiscalRequired &&
    !fiscalVisibility.isActive &&
    data.business?.country
  ) {
    items.push({
      id: "fiscal",
      tone: "attention",
      message: p.notifyFiscalMissing,
      href: "/portal/business",
    });
  }

  const offlineDevice = data.devices.find(
    (d) => (d.status ?? "").toLowerCase() === "offline",
  );
  if (offlineDevice) {
    items.push({
      id: "device-offline",
      tone: "attention",
      message: p.notifyDeviceOffline.replace(
        "{{name}}",
        offlineDevice.name,
      ),
      href: "/portal/devices",
    });
  }

  if (data.error) {
    items.push({
      id: "cloud",
      tone: "action_required",
      message: p.notifyCloudDisconnected,
      href: "/portal/support",
    });
  }

  if (!license.showUpgrade && (primary?.plan ?? "").toLowerCase() === "trial") {
    // trial without upgrade flag already handled via license expiry
  }

  return items;
}

function deriveSystemStatus(
  input: DerivePosHubInput,
): PosHubSystemStatus {
  const { data, t, environmentLabel } = input;
  const p = t.pos;

  const lastSync =
    data.lastSyncedAt?.toLocaleString() ?? t.labels.dash;

  return {
    cloudApiLabel: data.error ? p.statusDisconnected : p.statusConnected,
    cloudApiTone: data.error ? "action_required" : "ok",
    portalLabel: p.statusOnline,
    portalTone: "ok",
    environmentLabel,
    lastSyncLabel: lastSync,
  };
}

export function derivePosHubState(input: DerivePosHubInput): PosHubDerivedState {
  const fiscalVisibility = deriveFiscalVisibility(input.data.business);
  const version = deriveVersionView(
    input.data.devices,
    input.release,
    input.t,
  );
  const license = deriveLicenseView(
    input.data.licenses,
    input.data.customer,
    input.data.invoices,
    input.t,
  );
  const readiness = deriveReadiness(input, fiscalVisibility);
  const notifications = deriveNotifications(
    input,
    version,
    license,
    fiscalVisibility,
  );
  const system = deriveSystemStatus(input);

  return {
    release: input.release,
    version,
    license,
    readiness,
    notifications,
    system,
  };
}
