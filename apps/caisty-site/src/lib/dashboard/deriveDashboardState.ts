import type { PortalTranslations } from "../translations/portal";
import type { PortalDevice } from "../portalApi";
import {
  isStepCompanyDone,
  isStepInstallDone,
  isStepLicensePlanDone,
} from "../derivePortalSetupSteps";
import { formatLicenseStatus, formatProviderLabel } from "../caistyTerminology";
import { pickPrimaryPortalLicense } from "../portalLicensePick";
import { deriveFiscalVisibility } from "../useFiscalVisibility";
import { formatPortalOrderStatus, formatPortalPaymentMethod } from "../portal/portalSalesLabels";
import { formatMinorUnits } from "../money/formatMinorUnits";
import {
  deriveOnlinePaymentCards as buildOnlinePaymentCards,
  deriveOnlineRevenueHeader,
  derivePosPaymentCards,
} from "../portal/derivePaymentSummaryCards";
import { derivePosHubState } from "../posHub/derivePosHubState";
import { formatInstallerBytes } from "../posHub/format";
import { pickHighestSemver } from "../posHub/posVersion";
import type { PaymentMethodCard } from "../orders/types";
import type {
  BusinessAlert,
  DashboardActivity,
  DashboardData,
  DashboardDerivedState,
  DashboardHealth,
  DashboardHealthItem,
  DashboardKpi,
  DashboardQuickAction,
  DashboardRoadmapModule,
  DeriveDashboardInput,
  LiveDeviceCard,
  LiveReleaseCenter,
  LiveStoreStatusItem,
  PortalDashboardRecentOrder,
  RemoteAction,
  StoreSnapshot,
  SystemHealthItem,
} from "./types";

export type { DeriveDashboardInput };

function formatPlanLabel(plan: string, t: PortalTranslations): string {
  const p = plan.trim().toLowerCase();
  if (p === "trial") return t.pos.planTrial;
  if (p === "starter") return t.pos.planStarter;
  if (p === "pro") return t.pos.planPro;
  if (p === "business") return t.pos.planBusiness;
  if (p === "enterprise") return t.pos.planEnterprise;
  return plan || t.labels.dash;
}

export function countOnlineDevices(devices: DashboardData["devices"]): {
  online: number;
  total: number;
} {
  const total = devices.length;
  const online = devices.filter(
    (d) => (d.status ?? "").toLowerCase() === "online",
  ).length;
  return { online, total };
}

function latestHeartbeat(devices: DashboardData["devices"]): string | null {
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

function deriveHealth(input: DeriveDashboardInput): DashboardHealth {
  const h = input.t.dashboard.live;
  const { data } = input;
  const fiscal = deriveFiscalVisibility(data.business);

  const licenseDone = isStepLicensePlanDone(
    data.licenses,
    data.customer,
    data.invoices,
  );
  const profileDone = isStepCompanyDone(data.business);
  const deviceDone = isStepInstallDone(data.devices.length);
  const cloudDone = !data.error && !data.loading;
  const fiscalDone = !fiscal.fiscalRequired || fiscal.isActive;

  const items: DashboardHealthItem[] = [
    {
      id: "license",
      label: h.healthLicense,
      done: licenseDone,
      tone: licenseDone ? "ok" : "action_required",
    },
    {
      id: "profile",
      label: h.healthProfile,
      done: profileDone,
      tone: profileDone ? "ok" : "action_required",
    },
    {
      id: "device",
      label: h.healthDevice,
      done: deviceDone,
      tone: deviceDone ? "ok" : "attention",
    },
    {
      id: "cloud",
      label: h.healthCloud,
      done: cloudDone,
      tone: cloudDone ? "ok" : "action_required",
    },
    {
      id: "fiscal",
      label: h.healthFiscal,
      done: fiscalDone,
      tone: fiscalDone ? "ok" : fiscal.fiscalRequired ? "attention" : "ok",
    },
  ];

  const doneCount = items.filter((i) => i.done).length;
  const score = items.length ? Math.round((doneCount / items.length) * 100) : 0;

  return { score, items };
}

// POS Sales revenue is stored in ISO 4217 minor units (Cent for EUR, Millime for TND).
function formatMoney(minor: number, currency: string, locale: string): string {
  return formatMinorUnits(minor, currency, locale);
}

/** Safe template substitution — never calls `.replace` on null/undefined/non-strings. */
function applyTemplate(
  template: string | null | undefined,
  replacements: Record<string, string>,
  fallback = "",
): string {
  if (typeof template !== "string" || template.length === 0) {
    return fallback;
  }
  let out = template;
  for (const [token, value] of Object.entries(replacements)) {
    out = out.split(`{{${token}}}`).join(value);
  }
  return out;
}

/** Coerce API / partial summary numbers without inventing business totals. */
function asMinorOrCount(value: unknown): number {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim() !== "") {
    const n = Number(value);
    if (Number.isFinite(n)) return n;
  }
  return 0;
}

function resolveLastSynchronization(input: DeriveDashboardInput): string | null {
  const fromSummary = input.data.salesSummary?.lastSynchronizationAt ?? null;
  if (fromSummary) return fromSummary;
  return latestHeartbeat(input.data.devices);
}

function deriveKpis(input: DeriveDashboardInput): DashboardKpi[] {
  const l = input.t.dashboard.live;
  const dash = input.t.labels.dash;
  const { data } = input;
  const { online, total } = countOnlineDevices(data.devices);
  const syncHint =
    typeof l.waitingPosSyncShort === "string" && l.waitingPosSyncShort
      ? l.waitingPosSyncShort
      : dash;
  const sales = data.salesSummary;
  const hasSales = Boolean(sales?.hasSalesData);

  let posValue = syncHint;
  let posStatus: DashboardKpi["status"] = "waiting_sync";
  if (total > 0) {
    posValue =
      online > 0
        ? applyTemplate(l.posOnline, { count: String(online) }, String(online))
        : typeof l.posOffline === "string" && l.posOffline
          ? l.posOffline
          : dash;
    posStatus = "value";
  }

  const lastSyncIso = resolveLastSynchronization(input);
  let syncValue = dash;
  let syncStatus: DashboardKpi["status"] = "waiting_sync";
  if (lastSyncIso) {
    syncValue = new Date(lastSyncIso).toLocaleString(input.locale);
    syncStatus = "value";
  } else if (data.lastSyncedAt) {
    syncValue = data.lastSyncedAt.toLocaleString(input.locale);
    syncStatus = "value";
  }

  const currency =
    (typeof sales?.currency === "string" && sales.currency.trim()) ||
    data.business?.currency ||
    "EUR";

  const todayRevenueCents = asMinorOrCount(sales?.todayRevenueCents);
  const posRevenueCents = asMinorOrCount(sales?.posRevenueCents);
  const onlineRevenueCents = asMinorOrCount(sales?.onlineRevenueCents);
  const ordersToday = asMinorOrCount(sales?.ordersToday);
  const liveOrdersCount = asMinorOrCount(sales?.liveOrdersCount);
  const onlineOrdersCount = asMinorOrCount(sales?.onlineOrdersCount);
  const averageOrderMinor = asMinorOrCount(sales?.averageOrderMinor);

  const posRevenueLabel = formatMoney(posRevenueCents, currency, input.locale);
  const onlineRevenueLabel = formatMoney(
    onlineRevenueCents,
    currency,
    input.locale,
  );

  const revenueValue = hasSales
    ? formatMoney(todayRevenueCents, currency, input.locale)
    : dash;
  const revenueHint = hasSales
    ? applyTemplate(
        l.kpiRevenueSplitHint,
        { pos: posRevenueLabel, online: onlineRevenueLabel },
        `${posRevenueLabel} · ${onlineRevenueLabel}`,
      )
    : syncHint;
  const ordersValue = hasSales ? String(ordersToday) : dash;
  const ordersHint = hasSales
    ? applyTemplate(
        l.kpiOrdersSplitHint,
        {
          pos: String(liveOrdersCount),
          online: String(onlineOrdersCount),
        },
        `${liveOrdersCount} · ${onlineOrdersCount}`,
      )
    : syncHint;
  const avgOrderValue = hasSales
    ? formatMoney(averageOrderMinor, currency, input.locale)
    : dash;

  return [
    {
      id: "revenue",
      label: l.kpiRevenueToday,
      value: revenueValue,
      hint: hasSales ? revenueHint : syncHint,
      status: hasSales ? "value" : "waiting_sync",
    },
    {
      id: "orders",
      label: l.kpiOrdersToday,
      value: ordersValue,
      hint: hasSales ? ordersHint : syncHint,
      status: hasSales ? "value" : "waiting_sync",
    },
    {
      id: "avg_order",
      label: l.kpiAvgOrder,
      value: avgOrderValue,
      hint: hasSales ? undefined : syncHint,
      status: hasSales ? "value" : "waiting_sync",
    },
    {
      id: "pos_status",
      label: l.kpiPosStatus,
      value: posValue,
      status: posStatus,
      href: "/portal/devices",
    },
    {
      id: "last_sync",
      label: l.kpiLastSync,
      value: data.loading ? dash : syncValue,
      status: syncStatus,
    },
  ];
}

function deriveStoreStatus(input: DeriveDashboardInput): LiveStoreStatusItem[] {
  const l = input.t.dashboard.live;
  const { data } = input;
  const fiscal = deriveFiscalVisibility(data.business);
  const { online, total } = countOnlineDevices(data.devices);
  const profileDone = isStepCompanyDone(data.business);

  let posValue = l.waitingPosSyncShort;
  let posTone: LiveStoreStatusItem["tone"] = "unknown";
  if (total > 0) {
    posValue =
      online > 0
        ? applyTemplate(l.posOnline, { count: String(online) }, String(online))
        : typeof l.posOffline === "string" && l.posOffline
          ? l.posOffline
          : l.waitingPosSyncShort;
    posTone = online > 0 ? "ok" : "attention";
  }

  let fiscalValue = l.unknown;
  let fiscalTone: LiveStoreStatusItem["tone"] = "unknown";
  if (!data.business?.country) {
    fiscalValue = l.unknown;
  } else if (!fiscal.fiscalRequired) {
    fiscalValue = input.t.pos.statusNotRequired;
    fiscalTone = "ok";
  } else if (fiscal.isActive) {
    fiscalValue = input.t.pos.statusActive;
    fiscalTone = "ok";
  } else if (fiscal.isPendingSetup) {
    fiscalValue = input.t.pos.statusPending;
    fiscalTone = "attention";
  } else {
    fiscalValue = input.t.pos.statusIncomplete;
    fiscalTone = "action_required";
  }

  const cloudConnected = !data.error && !data.loading;

  return [
    { id: "pos", label: l.storePosLabel, value: posValue, tone: posTone },
    {
      id: "cloud",
      label: l.storeCloudConnection,
      value: cloudConnected ? input.t.pos.statusConnected : input.t.pos.statusDisconnected,
      tone: cloudConnected ? "ok" : "action_required",
    },
    { id: "fiscal", label: l.storeFiscalStatus, value: fiscalValue, tone: fiscalTone },
    {
      id: "profile",
      label: l.storeBusinessProfile,
      value: profileDone ? l.profileComplete : l.profileIncomplete,
      tone: profileDone ? "ok" : "attention",
    },
  ];
}

function alertIconForId(id: string): BusinessAlert["icon"] {
  if (id.includes("update")) return "update";
  if (id.includes("license")) return "license";
  if (id.includes("fiscal")) return "fiscal";
  if (id.includes("device")) return "device";
  if (id.includes("cloud")) return "cloud";
  if (id.includes("profile") || id.includes("business")) return "profile";
  return "sync";
}

const ALERT_SEVERITY_WEIGHT: Record<BusinessAlert["severity"], number> = {
  action_required: 0,
  attention: 1,
  ok: 2,
  unknown: 3,
};

const DASHBOARD_ALERT_LIMIT = 4;
const ACTIVITY_INVOICE_MAX_AGE_MS = 90 * 24 * 60 * 60 * 1000;

function alertActionLabel(
  notificationId: string,
  l: PortalTranslations["dashboard"]["live"],
): string | undefined {
  if (notificationId === "device-offline") return l.alertOpenDevices;
  if (notificationId === "fiscal") return l.alertOpenBusiness;
  if (notificationId === "license-expiry") return l.alertViewAction;
  if (notificationId === "cloud") return l.alertViewAction;
  return l.alertViewAction;
}

function deriveAlerts(
  input: DeriveDashboardInput,
  hubNotifications: ReturnType<typeof derivePosHubState>["notifications"],
): BusinessAlert[] {
  const l = input.t.dashboard.live;
  const { data } = input;

  const alerts: BusinessAlert[] = hubNotifications
    .filter((n) => n.id !== "update")
    .map((n) => ({
      id: n.id,
      severity: n.tone,
      icon: alertIconForId(n.id),
      message: n.message,
      actionLabel: n.href ? alertActionLabel(n.id, l) : undefined,
      href: n.href,
    }));

  if (!isStepCompanyDone(data.business)) {
    alerts.push({
      id: "profile-incomplete",
      severity: "attention",
      icon: "profile",
      message: l.alertProfileIncomplete,
      actionLabel: l.alertOpenBusiness,
      href: "/portal/business",
    });
  }

  return alerts
    .sort(
      (a, b) =>
        ALERT_SEVERITY_WEIGHT[a.severity] - ALERT_SEVERITY_WEIGHT[b.severity],
    )
    .slice(0, DASHBOARD_ALERT_LIMIT);
}

function deriveActivities(input: DeriveDashboardInput): DashboardActivity[] {
  const l = input.t.dashboard.live;
  const { data } = input;
  const items: DashboardActivity[] = [];
  const invoiceCutoff = Date.now() - ACTIVITY_INVOICE_MAX_AGE_MS;

  for (const inv of data.invoices) {
    const createdAt = new Date(inv.createdAt).getTime();
    if (!Number.isFinite(createdAt) || createdAt < invoiceCutoff) continue;

    const status = (inv.status ?? "").toLowerCase();
    const kind = status === "paid" ? "invoice_paid" : ("invoice_open" as const);
    items.push({
      id: `inv-${inv.id}`,
      kind,
      label:
        kind === "invoice_paid"
          ? `${l.activityInvoicePaid} · ${inv.number}`
          : `${l.activityInvoiceOpen} · ${inv.number}`,
      at: inv.createdAt,
      href: `/portal/invoices/${inv.id}`,
    });
  }

  for (const lic of data.licenses) {
    if (!lic.createdAt) continue;
    items.push({
      id: `lic-${lic.id}`,
      kind: "license_activated",
      label: `${l.activityLicenseActivated} · ${lic.plan}`,
      at: lic.createdAt,
      href: "/portal/licenses",
    });
  }

  for (const dev of data.devices) {
    if (!dev.lastSeenAt) continue;
    const isOnline = (dev.status ?? "").toLowerCase() === "online";
    if (!isOnline) continue;
    items.push({
      id: `dev-${dev.id}`,
      kind: "pos_connected",
      label: `${l.activityPosConnected} · ${dev.name || dev.deviceId}`,
      at: dev.lastSeenAt,
      href: "/portal/devices",
    });
  }

  const lastSyncIso = resolveLastSynchronization(input);
  if (lastSyncIso) {
    items.push({
      id: "cloud-sync",
      kind: "cloud_synced",
      label: l.activityCloudSynced,
      at: lastSyncIso,
    });
  }

  return items
    .filter((a) => Number.isFinite(new Date(a.at).getTime()))
    .sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime())
    .slice(0, 8);
}

function deriveRemoteActions(input: DeriveDashboardInput): RemoteAction[] {
  const l = input.t.dashboard.live;
  return [
    {
      id: "desktop",
      label: l.remoteOpenDesktop,
      description: l.remoteOpenDesktopDesc,
      enabled: true,
      onClick: "desktop_protocol",
    },
    {
      id: "restart_pos",
      label: l.remoteRestartPos,
      description: l.remoteRestartPosDesc,
      enabled: false,
      badge: l.comingSoon,
    },
    {
      id: "force_sync",
      label: l.remoteForceSync,
      description: l.remoteForceSyncDesc,
      enabled: false,
      badge: l.comingSoon,
    },
    {
      id: "download_logs",
      label: l.remoteDownloadLogs,
      description: l.remoteDownloadLogsDesc,
      enabled: false,
      badge: l.comingSoon,
    },
    {
      id: "restart_cloud",
      label: l.remoteRestartCloud,
      description: l.remoteRestartCloudDesc,
      enabled: false,
      badge: l.comingSoon,
    },
    {
      id: "lock_pos",
      label: l.remoteLockPos,
      description: l.remoteLockPosDesc,
      enabled: false,
      badge: l.comingSoon,
    },
  ];
}

function deriveSnapshot(
  input: DeriveDashboardInput,
  _hub: ReturnType<typeof derivePosHubState>,
): StoreSnapshot {
  const l = input.t.dashboard.live;
  const dash = input.t.labels.dash;
  const { data } = input;
  const primary = pickPrimaryPortalLicense(data.licenses);
  const installed = pickHighestSemver(data.devices.map((d) => d.appVersion));
  const profileDone = isStepCompanyDone(data.business);
  const cloudConnected = !data.error && !data.loading;

  const fiscalProvider = data.business?.fiscalProviderDisplayKey
    ? formatProviderLabel(data.business.fiscalProviderDisplayKey)
    : data.business?.fiscalProvider
      ? formatProviderLabel(data.business.fiscalProvider)
      : dash;

  return {
    storeName:
      data.business?.companyName?.trim() ||
      data.customer.name ||
      l.businessFallback,
    country: data.business?.country ?? dash,
    currency: data.business?.currency ?? dash,
    fiscalProvider,
    license: primary
      ? `${formatPlanLabel(primary.plan, input.t)} · ${formatLicenseStatus(primary.status)}`
      : l.noLicense,
    posVersion: installed ?? input.release.latestVersion,
    environment: input.environmentLabel,
    cloudStatus: cloudConnected ? input.t.pos.statusConnected : input.t.pos.statusDisconnected,
    cloudTone: cloudConnected ? "ok" : "action_required",
    profileStatus: profileDone ? l.profileComplete : l.profileIncomplete,
    profileTone: profileDone ? "ok" : "attention",
  };
}

function deriveLiveDevices(input: DeriveDashboardInput): LiveDeviceCard[] {
  const l = input.t.dashboard.live;
  const dash = input.t.labels.dash;
  const { data } = input;

  return data.devices.slice(0, 8).map((device: PortalDevice) => {
    const status = (device.status ?? "unknown").toLowerCase();
    const statusTone =
      status === "online" ? "ok" : status === "offline" ? "attention" : "unknown";

    return {
      id: device.id,
      name: device.name || device.deviceId,
      platform: device.platform ?? input.t.pos.updatesPlatform,
      version: device.appVersion?.trim() || l.deviceVersionWaiting,
      lastHeartbeat: device.lastSeenAt
        ? new Date(device.lastSeenAt).toLocaleString()
        : dash,
      status: device.status ?? dash,
      license: device.licenseKey ?? l.noLicense,
      environment: input.environmentLabel,
      statusTone,
    };
  });
}

function deriveReleaseCenter(
  input: DeriveDashboardInput,
  hub: ReturnType<typeof derivePosHubState>,
): LiveReleaseCenter {
  const { release, t } = input;
  const p = t.pos;

  const releaseDate = release.releaseDate
    ? new Date(release.releaseDate).toLocaleDateString()
    : p.valueNotAvailable;

  return {
    latestVersion: release.latestVersion,
    installedVersion: hub.version.installedLabel,
    releaseDate,
    installerName: release.installer.fileName,
    installerSize: formatInstallerBytes(
      release.installer.sizeBytes,
      "en",
      p.valueNotAvailable,
    ),
    updateStatus: hub.version.updateStatusLabel,
    updateTone: hub.version.updateTone,
    releaseNotes:
      release.releaseNotesSummary ||
      (release.releaseNotesUrl ? p.releaseNotesView : p.releaseNotesUnavailable),
    downloadUrl: release.installer.downloadUrl,
    releaseNotesUrl: release.releaseNotesUrl ?? undefined,
  };
}

function deriveSystemHealth(
  input: DeriveDashboardInput,
  hub: ReturnType<typeof derivePosHubState>,
): SystemHealthItem[] {
  const l = input.t.dashboard.live;
  const dash = input.t.labels.dash;
  const { data } = input;
  const { online, total } = countOnlineDevices(data.devices);
  const sales = data.salesSummary;
  const lastSyncIso = resolveLastSynchronization(input);

  let desktopValue = l.waitingPosSync;
  let desktopTone: SystemHealthItem["tone"] = "unknown";
  let desktopHealthy = false;
  if (total > 0) {
    desktopHealthy = online > 0;
    desktopValue = desktopHealthy ? l.healthy : l.posOffline;
    desktopTone = desktopHealthy ? "ok" : "attention";
  }

  const syncHealthy =
    !data.error &&
    Boolean(lastSyncIso || data.lastSyncedAt || sales?.hasSalesData);

  return [
    {
      id: "cloud_api",
      label: l.systemCloudApi,
      value: hub.system.cloudApiLabel,
      tone: hub.system.cloudApiTone,
      healthy: hub.system.cloudApiTone === "ok",
    },
    {
      id: "portal",
      label: l.systemPortal,
      value: hub.system.portalLabel,
      tone: hub.system.portalTone,
      healthy: true,
    },
    {
      id: "desktop_pos",
      label: l.systemDesktopPos,
      value: desktopValue,
      tone: desktopTone,
      healthy: desktopHealthy,
    },
    {
      id: "sync",
      label: l.systemSynchronization,
      value: syncHealthy ? input.t.pos.statusConnected : input.t.pos.statusDisconnected,
      tone: syncHealthy ? "ok" : "action_required",
      healthy: syncHealthy,
    },
    {
      id: "environment",
      label: l.systemEnvironment,
      value: input.environmentLabel,
      tone: "unknown",
      healthy: true,
    },
    {
      id: "last_sync",
      label: l.systemLastSync,
      value: lastSyncIso
        ? new Date(lastSyncIso).toLocaleString(input.locale)
        : data.lastSyncedAt
          ? data.lastSyncedAt.toLocaleString(input.locale)
          : dash,
      tone: lastSyncIso || data.lastSyncedAt ? "ok" : "unknown",
      healthy: Boolean(data.lastSyncedAt),
    },
  ];
}

function deriveQuickActions(input: DeriveDashboardInput): DashboardQuickAction[] {
  const l = input.t.dashboard.live;
  const { data } = input;

  const actions: DashboardQuickAction[] = [
    {
      id: "desktop",
      label: l.actionOpenDesktopPos,
      onClick: "desktop_protocol",
    },
    {
      id: "orders",
      label: l.actionViewOrders,
      href: "/portal/orders",
    },
    {
      id: "reports",
      label: l.actionViewReports,
      href: "/portal/reports",
    },
    {
      id: "devices",
      label: l.actionManageDevices,
      href: "/portal/devices",
    },
  ];

  if (!isStepCompanyDone(data.business)) {
    actions.push({
      id: "business",
      label: l.actionCompleteBusiness,
      href: "/portal/business",
    });
  }

  return actions;
}

function deriveRecentOrders(input: DeriveDashboardInput): PortalDashboardRecentOrder[] {
  const sales = input.data.salesSummary;
  const recent = Array.isArray(sales?.recentOrders) ? sales.recentOrders : [];
  if (!recent.length) return [];

  const timezone = sales?.timezone ?? "Europe/Berlin";
  const currency = sales?.currency || "EUR";
  const dash = input.t.labels?.dash ?? "—";

  return recent
    .filter((order): order is NonNullable<typeof order> => Boolean(order && typeof order === "object"))
    .map((order) => {
      const statusRaw =
        typeof order.normalizedStatus === "string"
          ? order.normalizedStatus
          : typeof (order as unknown as { status?: unknown }).status === "string"
            ? String((order as unknown as { status: string }).status)
            : null;
      const amountCents =
        typeof order.amountCents === "number" && Number.isFinite(order.amountCents)
          ? order.amountCents
          : 0;

      return {
        id: typeof order.id === "string" && order.id ? order.id : `recent-${order.localOrderId || "unknown"}`,
        time: order.soldAt
          ? new Date(order.soldAt).toLocaleTimeString(input.locale, {
              hour: "2-digit",
              minute: "2-digit",
              timeZone: timezone,
            })
          : dash,
        orderNumber: order.localOrderId || dash,
        status: formatPortalOrderStatus(statusRaw, input.t),
        statusKey: statusRaw || "unknown",
        payment:
          order.paymentDisplay ||
          formatPortalPaymentMethod(order.paymentMethod, input.t),
        amount: formatMoney(
          amountCents,
          order.currency || currency,
          input.locale,
        ),
        receiptNumber: order.receiptNumber?.trim() || dash,
        isProviderOrder: Boolean(order.isProviderOrder),
        providerName: order.providerName ?? null,
      };
    });
}

function derivePaymentCards(input: DeriveDashboardInput): PaymentMethodCard[] {
  const o = input.t.orders;
  const dash = input.t.labels.dash;
  const sales = input.data.salesSummary;

  return derivePosPaymentCards({
    summary: sales?.paymentSummary,
    labels: {
      paymentCash: o.paymentCash,
      paymentCard: o.paymentCard,
      paymentVoucher: o.paymentVoucher,
      paymentOther: o.paymentOther,
    },
    locale: input.locale,
    dash,
    hasData: Boolean(sales?.hasSalesData),
  });
}

function deriveOnlineRevenueHeaderState(input: DeriveDashboardInput) {
  const o = input.t.orders;
  const dash = input.t.labels.dash;
  const sales = input.data.salesSummary;
  const currency =
    sales?.paymentSummary.currency || sales?.currency || input.data.business?.currency || "EUR";

  return deriveOnlineRevenueHeader({
    onlineRevenueCents: sales?.onlineRevenueCents ?? 0,
    currency,
    labels: {
      kpiOnlineRevenue: o.kpiOnlineRevenue,
      kpiOnlineRevenueInfo: o.kpiOnlineRevenueInfo,
    },
    locale: input.locale,
    dash,
    hasData: Boolean(sales?.hasSalesData),
  });
}

function deriveOnlinePaymentCards(input: DeriveDashboardInput): PaymentMethodCard[] {
  const o = input.t.orders;
  const dash = input.t.labels.dash;
  const sales = input.data.salesSummary;

  return buildOnlinePaymentCards({
    summary: sales?.onlinePaymentSummary,
    labels: {
      onlineCashPaid: o.onlineCashPaid,
      onlineCardPaid: o.onlineCardPaid,
      onlinePaidOnline: o.onlinePaidOnline,
      onlinePending: o.onlinePending,
      onlinePaidTotal: o.onlinePaidTotal,
    },
    locale: input.locale,
    dash,
    hasData: Boolean(sales?.hasSalesData),
  });
}

function deriveRoadmap(input: DeriveDashboardInput): DashboardRoadmapModule[] {
  const h = input.t.dashboard.home;
  return [
    { id: "pos", label: h.roadmapPos, href: "/portal/pos", available: true },
    { id: "reports", label: h.roadmapReports, href: "/portal", available: false },
    { id: "inventory", label: h.roadmapInventory, href: "/portal", available: false },
    { id: "employees", label: h.roadmapEmployees, href: "/worktrack", available: false },
    { id: "web_pos", label: h.roadmapWebPos, href: "/portal/pos", available: false },
    { id: "crm", label: h.roadmapCrm, href: "/portal", available: false },
  ];
}

export function deriveDashboardState(
  input: DeriveDashboardInput,
): DashboardDerivedState {
  const { data, t } = input;
  const l = t.dashboard.live;

  const hub = derivePosHubState({
    data: { ...data, customer: data.customer },
    release: input.release,
    t,
    environmentLabel: input.environmentLabel,
  });

  const businessName =
    data.business?.companyName?.trim() ||
    data.customer.name ||
    l.businessFallback;

  const health = deriveHealth(input);
  const businessOnline =
    health.score >= 80 &&
    countOnlineDevices(data.devices).online > 0 &&
    isStepLicensePlanDone(data.licenses, data.customer, data.invoices);

  const hasSalesData = Boolean(data.salesSummary?.hasSalesData);

  return {
    businessName,
    businessOnline,
    hasSalesData,
    kpis: deriveKpis(input),
    health,
    activities: deriveActivities(input),
    notifications: hub.notifications,
    quickActions: deriveQuickActions(input),
    roadmap: deriveRoadmap(input),
    release: input.release,
    storeStatus: deriveStoreStatus(input),
    alerts: deriveAlerts(input, hub.notifications),
    remoteActions: deriveRemoteActions(input),
    snapshot: deriveSnapshot(input, hub),
    liveDevices: deriveLiveDevices(input),
    releaseCenter: deriveReleaseCenter(input, hub),
    systemHealth: deriveSystemHealth(input, hub),
    recentOrders: deriveRecentOrders(input),
    paymentSummary: data.salesSummary?.paymentSummary ?? null,
    onlinePaymentSummary: data.salesSummary?.onlinePaymentSummary ?? null,
    paymentCards: derivePaymentCards(input),
    onlinePaymentCards: deriveOnlinePaymentCards(input),
    onlineRevenueHeader: deriveOnlineRevenueHeaderState(input),
  };
}
