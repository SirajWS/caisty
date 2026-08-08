import React from "react";
import { usePortalOutlet } from "./PortalLayout";
import { useTheme } from "../lib/theme";
import { useLanguage } from "../lib/LanguageContext";
import { getPortalTranslations } from "../lib/translations";
import { portalLocaleTag } from "../lib/portalLocale";
import { getPosReleaseConfig } from "../config/posConfig";
import { deriveDeviceManagementState } from "../lib/devices/deriveDeviceManagementState";
import { usePortalDeviceManagement } from "../lib/devices/usePortalDeviceManagement";
import {
  formatDeviceApiError,
  PortalDeviceApiError,
  type PortalDeviceActionKind,
} from "../lib/devices/portalDeviceApi";
import type { DeviceDialogState } from "../lib/devices/deviceManagementTypes";
import { DeviceManagementOverview } from "../components/devices/DeviceManagementOverview";
import { DeviceLifecycleCard } from "../components/devices/DeviceLifecycleCard";
import { DeviceEmptyState } from "../components/devices/DeviceEmptyState";
import { DevicesFooter } from "../components/devices/DevicesFooter";
import { DeviceConfirmDialog } from "../components/devices/DeviceConfirmDialog";
import { portalPageShell, portalPageSubtitle, portalPageTitle } from "../lib/portalUi";

const PortalDevicesPage: React.FC = () => {
  const { customer: _customer } = usePortalOutlet();
  const { theme } = useTheme();
  const { language } = useLanguage();
  const t = getPortalTranslations(language);
  const d = t.devices;
  const locale = portalLocaleTag(language);
  const isLight = theme === "light";

  const release = React.useMemo(() => getPosReleaseConfig(), []);
  const mgmt = usePortalDeviceManagement();

  const [dialog, setDialog] = React.useState<DeviceDialogState>(null);
  const [dialogError, setDialogError] = React.useState<string | null>(null);
  const [dialogBusy, setDialogBusy] = React.useState(false);
  const [actionToast, setActionToast] = React.useState<string | null>(null);

  const state = React.useMemo(
    () =>
      deriveDeviceManagementState({
        response: mgmt.data,
        locale,
        t,
      }),
    [mgmt.data, locale, t],
  );

  const errorLabels = React.useMemo(
    () => ({
      default: d.actionError,
      unauthorized: d.errorUnauthorized,
      network: d.errorNetwork,
      notFound: d.errorNotFound,
      invalidTransition: d.errorInvalidTransition,
      limitReached: d.errorLimitReached,
      licenseInvalid: d.errorLicenseInvalid,
      orgMismatch: d.errorOrgMismatch,
      releaseFailed: d.releaseDialogError,
      serviceUnavailable: d.errorServiceUnavailable,
    }),
    [d],
  );

  const limitHint = React.useCallback(
    (used: number, max: number | null, remaining: number) =>
      d.errorLimitReachedDetail
        .replace("{{used}}", String(used))
        .replace("{{max}}", String(max ?? "—"))
        .replace("{{remaining}}", String(remaining)),
    [d],
  );

  const loadErrorMessage = React.useMemo(
    () =>
      mgmt.error
        ? formatDeviceApiError(mgmt.error, errorLabels, limitHint)
        : d.loadError,
    [mgmt.error, errorLabels, limitHint, d.loadError],
  );

  const closeDialog = React.useCallback(() => {
    if (dialogBusy) return;
    setDialog(null);
    setDialogError(null);
  }, [dialogBusy]);

  const openAction = React.useCallback(
    (deviceId: string, deviceName: string, kind: DeviceDialogState extends null ? never : NonNullable<DeviceDialogState>["kind"]) => {
      if (mgmt.actionBusyDeviceId) return;
      setDialogError(null);
      setDialog({ deviceId, deviceName, kind });
    },
    [mgmt.actionBusyDeviceId],
  );

  const confirmDialog = React.useCallback(async () => {
    if (!dialog || dialogBusy || mgmt.actionBusyDeviceId) return;
    setDialogBusy(true);
    setDialogError(null);
    try {
      await mgmt.runAction(dialog.deviceId, dialog.kind as PortalDeviceActionKind);
      setDialog(null);
      setActionToast(
        dialog.kind === "approve"
          ? d.actionApprove
          : dialog.kind === "reject"
            ? d.actionReject
            : dialog.kind === "block"
              ? d.actionBlock
              : dialog.kind === "unblock"
                ? d.actionUnblock
                : d.actionRelease,
      );
    } catch (err) {
      const message = formatDeviceApiError(err, errorLabels, limitHint);
      setDialogError(message);
      if (err instanceof PortalDeviceApiError && err.shouldReload) {
        await mgmt.reload();
      }
    } finally {
      setDialogBusy(false);
    }
  }, [dialog, dialogBusy, mgmt, errorLabels, limitHint, d]);

  React.useEffect(() => {
    if (!actionToast) return;
    const id = window.setTimeout(() => setActionToast(null), 4000);
    return () => window.clearTimeout(id);
  }, [actionToast]);

  const dialogContent = React.useMemo(() => {
    if (!dialog) return null;
    const seats = state.seats;
    const used = seats.usedDevices;
    const max = seats.maxDevices ?? 0;
    const remaining = seats.unlimitedDevices
      ? "∞"
      : String(Math.max(0, (seats.maxDevices ?? 0) - seats.usedDevices));

    switch (dialog.kind) {
      case "approve":
        return {
          title: d.dialogApproveTitle,
          description: d.dialogApproveDescription,
          notice: seats.unlimitedDevices
            ? d.dialogApproveNoticeUnlimited.replace("{{used}}", String(used))
            : d.dialogApproveNotice
                .replace("{{used}}", String(used))
                .replace("{{max}}", String(max))
                .replace("{{remaining}}", remaining),
          confirm: d.dialogApproveConfirm,
          variant: "default" as const,
        };
      case "reject":
        return {
          title: d.dialogRejectTitle,
          description: d.dialogRejectDescription,
          notice: d.dialogRejectNotice,
          confirm: d.dialogRejectConfirm,
          variant: "warning" as const,
        };
      case "block":
        return {
          title: d.dialogBlockTitle,
          description: d.dialogBlockDescription,
          notice: d.dialogBlockNotice,
          confirm: d.dialogBlockConfirm,
          variant: "warning" as const,
        };
      case "unblock":
        return {
          title: d.dialogUnblockTitle,
          description: d.dialogUnblockDescription,
          notice: d.dialogUnblockNotice,
          confirm: d.dialogUnblockConfirm,
          variant: "default" as const,
        };
      case "release":
        return {
          title: d.releaseDialogTitle,
          description: d.releaseDialogDescriptionExtended,
          notice: d.releaseDialogNoticeExtended,
          confirm: d.releaseDialogConfirm,
          variant: "destructive" as const,
        };
    }
  }, [dialog, d, state.seats]);

  const cardLabels = {
    type: d.colType,
    created: d.colCreated,
    contact: d.colContact,
    version: d.colVersion,
    plan: d.colLicense,
    fingerprint: d.colFingerprint,
    approve: d.actionApprove,
    reject: d.actionReject,
    block: d.actionBlock,
    unblock: d.actionUnblock,
    release: d.actionRelease,
    approveDisabled: d.approveDisabledNoSeats,
  };

  const footerLinks = [
    { id: "licenses", label: d.footerLicenses, href: "/portal/licenses" },
    { id: "pos", label: d.footerPos, href: "/portal/pos" },
    { id: "support", label: d.footerSupport, href: "/portal/support" },
  ];

  const showEmptyHero = !mgmt.loading && !mgmt.error && !state.hasDevices;

  return (
    <div className={`${portalPageShell()} dashboard-home devices-center`}>
      <header className="space-y-1">
        <h1 className={portalPageTitle(isLight)}>{d.title}</h1>
        <p className={portalPageSubtitle(isLight)}>{d.subtitle}</p>
      </header>

      {actionToast ? (
        <p className="devices-action-toast" role="status" aria-live="polite">
          {actionToast}
        </p>
      ) : null}

      {mgmt.loading ? (
        <p className={portalPageSubtitle(isLight)}>{d.loading}</p>
      ) : mgmt.error ? (
        <div className="devices-load-error" role="alert">
          <p>{loadErrorMessage}</p>
          <button
            type="button"
            className="devices-lifecycle-action devices-lifecycle-action--primary"
            onClick={() => void mgmt.reload()}
          >
            {d.retryLoad}
          </button>
        </div>
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
          <DeviceManagementOverview
            seats={state.seats}
            refreshing={mgmt.refreshing}
            labels={{
              planTitle: d.seatPlanTitle,
              noPlan: d.seatNoPlan,
              used: d.seatUsed,
              usedUnlimited: d.seatUsedUnlimited,
              available: d.seatAvailable,
              availableUnlimited: d.seatAvailableUnlimited,
              full: d.seatFull,
              overLimitBanner: d.overLimitBanner,
              statActive: d.statActive,
              statBlocked: d.statBlocked,
              statPending: d.statPending,
              refreshing: d.refreshing,
            }}
          />

          <section className="dashboard-panel dashboard-panel--wide devices-management">
            <h2 className="dashboard-panel-title">{d.managementTitle}</h2>
            {state.seats.pendingCount === 0 ? (
              <p className="devices-no-pending-hint">{d.noPendingHint}</p>
            ) : null}
            <div className="devices-grid devices-lifecycle-grid">
              {state.devices.map((device) => (
                <DeviceLifecycleCard
                  key={device.id}
                  device={device}
                  labels={cardLabels}
                  busy={mgmt.actionBusyDeviceId === device.id}
                  anyActionBusy={mgmt.actionBusyDeviceId !== null}
                  canApprove={state.canApproveNew}
                  onAction={(deviceId, action) => {
                    const card = state.devices.find((c) => c.id === deviceId);
                    openAction(deviceId, card?.name ?? d.unnamedDevice, action);
                  }}
                />
              ))}
            </div>
          </section>
        </>
      )}

      <DevicesFooter links={footerLinks} isLight={isLight} />

      {dialog && dialogContent ? (
        <DeviceConfirmDialog
          open
          title={dialogContent.title}
          description={dialogContent.description}
          notice={dialogContent.notice}
          cancelLabel={d.releaseDialogCancel}
          confirmLabel={dialogContent.confirm}
          variant={dialogContent.variant}
          busy={dialogBusy}
          error={dialogError}
          onCancel={closeDialog}
          onConfirm={() => void confirmDialog()}
        />
      ) : null}
    </div>
  );
};

export default PortalDevicesPage;
