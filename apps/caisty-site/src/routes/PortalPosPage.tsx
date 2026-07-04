import React from "react";
import { Link } from "react-router-dom";
import {
  Check,
  Cloud,
  Download,
  ExternalLink,
  HardDrive,
  Monitor,
  Sparkles,
  X,
} from "lucide-react";
import {
  fetchPortalBusiness,
  fetchPortalDevices,
  fetchPortalInvoices,
  fetchPortalLicenses,
  type PortalBusinessProfile,
  type PortalDevice,
  type PortalInvoice,
  type PortalLicense,
} from "../lib/portalApi";
import { usePortalOutlet } from "./PortalLayout";
import { useTheme } from "../lib/theme";
import { useLanguage } from "../lib/LanguageContext";
import { getPortalTranslations } from "../lib/translations";
import { portalLocaleTag } from "../lib/portalLocale";
import { pickPrimaryPortalLicense } from "../lib/portalLicensePick";
import {
  isStepCompanyDone,
  isStepInstallDone,
  isStepLicensePlanDone,
} from "../lib/derivePortalSetupSteps";
import {
  deriveFiscalVisibility,
  getFiscalCustomerCopy,
} from "../lib/useFiscalVisibility";
import { formatLicenseStatus } from "../lib/caistyTerminology";
import {
  getPosLatestVersion,
  getPosWebUrl,
  getPosWebUrlTarget,
  getPosWindowsDownloadUrl,
  isPosDownloadConfigured,
  isPosWebEnabled,
} from "../config/businessCountries";
import {
  portalCardShell,
  portalCloudStatusTone,
  portalCompactCard,
  portalConnectionBadge,
  portalPageShell,
  portalPageSubtitle,
  portalPageTitle,
  portalPrimaryCta,
  portalSecondaryCta,
  portalSectionLabel,
  portalTextLink,
} from "../lib/portalUi";

const DESKTOP_PROTOCOL = "caisty://open";
const DESKTOP_OPEN_TIMEOUT_MS = 1800;

function isMobileUserAgent(): boolean {
  if (typeof navigator === "undefined") return false;
  return /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent);
}

type ReadinessRow = {
  id: string;
  label: string;
  done: boolean;
  statusLabel: string;
  href?: string;
};

const PortalPosPage: React.FC = () => {
  const { customer } = usePortalOutlet();
  const { theme } = useTheme();
  const { language } = useLanguage();
  const t = getPortalTranslations(language);
  const p = t.pos;
  const locale = portalLocaleTag(language);
  const isLight = theme === "light";
  const dash = t.labels.dash;

  const [licenses, setLicenses] = React.useState<PortalLicense[]>([]);
  const [devices, setDevices] = React.useState<PortalDevice[]>([]);
  const [invoices, setInvoices] = React.useState<PortalInvoice[]>([]);
  const [business, setBusiness] = React.useState<PortalBusinessProfile | null>(
    null,
  );
  const [loading, setLoading] = React.useState(true);
  const [desktopFallback, setDesktopFallback] = React.useState(false);
  const [desktopMobileHint, setDesktopMobileHint] = React.useState(false);
  const desktopTimerRef = React.useRef<number | null>(null);

  const latestVersion = getPosLatestVersion();
  const downloadUrl = getPosWindowsDownloadUrl();
  const downloadAvailable = isPosDownloadConfigured();
  const webPosEnabled = isPosWebEnabled();
  const webPosUrl = getPosWebUrl();
  const webPosTarget = getPosWebUrlTarget();
  const webPosDesc = webPosEnabled
    ? p.openWebPosDesc
    : p.openWebPosDescFuture.replace("{{url}}", webPosTarget);

  React.useEffect(() => {
    let cancelled = false;

    (async () => {
      setLoading(true);
      try {
        const [lics, devs, biz, invs] = await Promise.all([
          fetchPortalLicenses(),
          fetchPortalDevices(),
          fetchPortalBusiness().catch(() => null),
          fetchPortalInvoices().catch(() => []),
        ]);
        if (cancelled) return;
        setLicenses(lics);
        setDevices(devs);
        setBusiness(biz);
        setInvoices(invs);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  React.useEffect(() => {
    return () => {
      if (desktopTimerRef.current !== null) {
        window.clearTimeout(desktopTimerRef.current);
      }
    };
  }, []);

  const primaryLicense = React.useMemo(
    () => pickPrimaryPortalLicense(licenses),
    [licenses],
  );

  const fiscalVisibility = deriveFiscalVisibility(business);
  const fiscalCopy = getFiscalCustomerCopy(t, fiscalVisibility);

  const licenseDone = isStepLicensePlanDone(licenses, customer, invoices);
  const businessDone = isStepCompanyDone(business);
  const deviceDone = isStepInstallDone(devices.length);

  function licenseHeroLabel(): string {
    if (!primaryLicense) return p.statusNoLicense;
    return `${formatLicenseStatus(primaryLicense.status)} · ${primaryLicense.plan}`;
  }

  function businessHeroLabel(): string {
    if (!business) return p.statusNotConfigured;
    if (business.complianceStatus === "ready") return p.statusReady;
    if (business.complianceStatus === "incomplete") return p.statusIncomplete;
    return p.statusNotConfigured;
  }

  function fiscalHeroLabel(): string {
    if (!business?.country) return p.statusNotConfigured;
    if (!fiscalVisibility.fiscalRequired) return p.statusNotRequired;
    if (fiscalVisibility.isActive) return p.statusActive;
    if (fiscalVisibility.isPendingSetup) return p.statusPending;
    return p.statusPending;
  }

  function fiscalReadinessLabel(): string {
    if (!business?.country) return p.statusNotConfigured;
    if (!fiscalVisibility.fiscalRequired) return p.statusNotRequired;
    if (fiscalVisibility.isActive) return p.statusReady;
    if (fiscalVisibility.isPendingSetup) return p.statusPending;
    return p.statusIncomplete;
  }

  const readinessRows: ReadinessRow[] = [
    {
      id: "business",
      label: p.readinessBusiness,
      done: businessDone,
      statusLabel: businessDone ? p.statusReady : p.statusIncomplete,
      href: "/portal/business",
    },
    {
      id: "fiscal",
      label: p.readinessFiscal,
      done:
        !fiscalVisibility.fiscalRequired ||
        fiscalVisibility.isActive,
      statusLabel: fiscalReadinessLabel(),
      href: "/portal/business",
    },
    {
      id: "license",
      label: p.readinessLicense,
      done: licenseDone,
      statusLabel: licenseDone
        ? primaryLicense
          ? `${formatLicenseStatus(primaryLicense.status)} · ${primaryLicense.plan}`
          : p.statusReady
        : p.statusNoLicense,
      href: "/portal/plan",
    },
    {
      id: "device",
      label: p.readinessDevice,
      done: deviceDone,
      statusLabel: deviceDone ? p.statusReady : p.statusNotConfigured,
      href: "/portal/devices",
    },
  ];

  function clearDesktopTimer() {
    if (desktopTimerRef.current !== null) {
      window.clearTimeout(desktopTimerRef.current);
      desktopTimerRef.current = null;
    }
  }

  function handleOpenDesktopPos() {
    setDesktopFallback(false);
    setDesktopMobileHint(false);

    if (isMobileUserAgent()) {
      setDesktopMobileHint(true);
      return;
    }

    const onBlur = () => {
      clearDesktopTimer();
      window.removeEventListener("blur", onBlur);
      setDesktopFallback(false);
    };

    window.addEventListener("blur", onBlur);
    desktopTimerRef.current = window.setTimeout(() => {
      window.removeEventListener("blur", onBlur);
      desktopTimerRef.current = null;
      setDesktopFallback(true);
    }, DESKTOP_OPEN_TIMEOUT_MS);

    window.location.href = DESKTOP_PROTOCOL;
  }

  function formatSeen(value: string | null | undefined): string {
    if (!value) return dash;
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return value;
    return d.toLocaleString(locale);
  }

  const comingSoonItems = [
    p.comingSoonReleaseNotes,
    p.comingSoonAutoUpdates,
    p.comingSoonPrinter,
    p.comingSoonCashDrawer,
    p.comingSoonOfflineSync,
    p.comingSoonFiscalStatus,
    p.comingSoonSystemHealth,
  ];

  const heroStats = [
    { label: p.latestVersion, value: latestVersion },
    { label: p.licenseStatus, value: licenseHeroLabel() },
    { label: p.cloudConnection, value: loading ? dash : p.statusConnected },
    { label: p.businessProfile, value: businessHeroLabel() },
    { label: p.fiscalPack, value: fiscalHeroLabel() },
  ];

  return (
    <div className={portalPageShell()}>
      <header className="space-y-2">
        <h1 className={portalPageTitle(isLight)}>{p.title}</h1>
        <p className={portalPageSubtitle(isLight)}>{p.subtitle}</p>
      </header>

      {/* Hero stats */}
      <section
        className={`${portalCardShell(isLight)} grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5`}
      >
        {heroStats.map((stat) => (
          <div key={stat.label} className="min-w-0">
            <div className={portalSectionLabel(isLight)}>{stat.label}</div>
            <div
              className={`mt-1 text-sm font-semibold truncate ${
                isLight ? "text-slate-900" : "text-slate-100"
              }`}
            >
              {loading ? (
                <span
                  className={`inline-block h-4 w-20 rounded animate-pulse ${
                    isLight ? "bg-slate-200" : "bg-slate-700"
                  }`}
                />
              ) : (
                stat.value
              )}
            </div>
          </div>
        ))}
      </section>

      {fiscalCopy && !loading ? (
        <p
          className={`text-xs leading-relaxed rounded-lg border px-3 py-2 ${
            isLight
              ? "border-emerald-200 bg-emerald-50 text-emerald-800"
              : "border-emerald-500/30 bg-emerald-500/10 text-emerald-300"
          }`}
        >
          {fiscalCopy.message}
        </p>
      ) : null}

      {/* Quick actions */}
      <section className="space-y-3">
        <h2 className={portalSectionLabel(isLight)}>{p.quickActions}</h2>
        <div className="grid gap-3 md:grid-cols-3">
          <div className={`${portalCardShell(isLight)} flex flex-col gap-3`}>
            <div className="flex items-center gap-2">
              <ExternalLink
                size={18}
                className={isLight ? "text-orange-600" : "text-orange-400"}
                aria-hidden
              />
              <span
                className={`text-sm font-semibold ${
                  isLight ? "text-slate-900" : "text-slate-100"
                }`}
              >
                {p.openWebPos}
              </span>
            </div>
            <p className={`text-xs flex-1 ${isLight ? "text-slate-600" : "text-slate-400"}`}>
              {webPosDesc}
            </p>
            {webPosEnabled && webPosUrl ? (
              <a
                href={webPosUrl}
                target="_blank"
                rel="noopener noreferrer"
                className={`no-underline w-full text-center ${portalPrimaryCta()}`}
              >
                {p.openWebPos}
              </a>
            ) : (
              <button
                type="button"
                disabled
                className={`w-full ${portalSecondaryCta(isLight)} opacity-70 cursor-not-allowed`}
                title={webPosTarget}
              >
                {p.statusComingSoon}
              </button>
            )}
          </div>

          <div className={`${portalCardShell(isLight)} flex flex-col gap-3`}>
            <div className="flex items-center gap-2">
              <Monitor
                size={18}
                className={isLight ? "text-orange-600" : "text-orange-400"}
                aria-hidden
              />
              <span
                className={`text-sm font-semibold ${
                  isLight ? "text-slate-900" : "text-slate-100"
                }`}
              >
                {p.openDesktopPos}
              </span>
            </div>
            <p className={`text-xs flex-1 ${isLight ? "text-slate-600" : "text-slate-400"}`}>
              {p.openDesktopPosDesc}
            </p>
            {desktopFallback ? (
              <div
                className={`rounded-lg border px-3 py-2 text-xs ${
                  isLight
                    ? "border-amber-200 bg-amber-50 text-amber-900"
                    : "border-amber-500/30 bg-amber-500/10 text-amber-200"
                }`}
                role="status"
              >
                {p.desktopNotInstalled}
              </div>
            ) : null}
            {desktopMobileHint ? (
              <div
                className={`rounded-lg border px-3 py-2 text-xs ${
                  isLight
                    ? "border-slate-200 bg-slate-50 text-slate-700"
                    : "border-white/10 bg-white/[0.04] text-slate-300"
                }`}
                role="status"
              >
                {p.desktopWindowsOnly}
              </div>
            ) : null}
            <button
              type="button"
              onClick={handleOpenDesktopPos}
              className={`w-full ${portalSecondaryCta(isLight)}`}
            >
              {desktopFallback ? p.tryAgain : p.openDesktopPos}
            </button>
          </div>

          <div className={`${portalCardShell(isLight)} flex flex-col gap-3`}>
            <div className="flex items-center gap-2">
              <Download
                size={18}
                className={isLight ? "text-orange-600" : "text-orange-400"}
                aria-hidden
              />
              <span
                className={`text-sm font-semibold ${
                  isLight ? "text-slate-900" : "text-slate-100"
                }`}
              >
                {p.downloadLatest}
              </span>
            </div>
            <p className={`text-xs flex-1 ${isLight ? "text-slate-600" : "text-slate-400"}`}>
              {p.downloadLatestDesc}
            </p>
            {downloadAvailable && downloadUrl ? (
              <a
                href={downloadUrl}
                download={`Caisty.PoS_${latestVersion}_x64-setup.exe`}
                className={`no-underline w-full text-center ${portalPrimaryCta()}`}
              >
                {p.downloadLatest} ({latestVersion})
              </a>
            ) : (
              <button
                type="button"
                disabled
                className={`w-full ${portalPrimaryCta()} opacity-50 cursor-not-allowed`}
              >
                {p.downloadUnavailable}
              </button>
            )}
          </div>
        </div>
      </section>

      {/* Business readiness */}
      <section className="space-y-3">
        <h2 className={portalSectionLabel(isLight)}>{p.readinessTitle}</h2>
        <div className={`${portalCardShell(isLight)} divide-y ${
          isLight ? "divide-slate-100" : "divide-white/10"
        }`}>
          {readinessRows.map((row) => (
            <div
              key={row.id}
              className="flex flex-wrap items-center justify-between gap-2 py-3 first:pt-0 last:pb-0"
            >
              <div className="flex items-center gap-2 min-w-0">
                <span
                  className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full ${
                    row.done
                      ? "bg-emerald-500 text-white"
                      : isLight
                        ? "bg-slate-200 text-slate-500"
                        : "bg-slate-700 text-slate-400"
                  }`}
                  aria-hidden
                >
                  {row.done ? <Check size={14} /> : <X size={14} />}
                </span>
                <span
                  className={`text-sm font-medium ${
                    isLight ? "text-slate-900" : "text-slate-100"
                  }`}
                >
                  {row.label}
                </span>
              </div>
              <div className="flex items-center gap-3">
                <span
                  className={`text-xs ${isLight ? "text-slate-600" : "text-slate-400"}`}
                >
                  {loading ? dash : row.statusLabel}
                </span>
                {row.href ? (
                  <Link to={row.href} className={`text-xs no-underline ${portalTextLink(isLight)}`}>
                    →
                  </Link>
                ) : null}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Connected devices */}
      <section className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className={portalSectionLabel(isLight)}>{p.devicesTitle}</h2>
          {devices.length > 0 ? (
            <Link to="/portal/devices" className={`text-xs no-underline ${portalTextLink(isLight)}`}>
              {p.devicesViewAll} →
            </Link>
          ) : null}
        </div>
        <div className={portalCardShell(isLight)}>
          {loading ? (
            <p className={`text-sm ${isLight ? "text-slate-600" : "text-slate-400"}`}>
              {p.devicesLoading}
            </p>
          ) : devices.length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-6 text-center">
              <HardDrive
                size={28}
                className={isLight ? "text-slate-300" : "text-slate-600"}
                aria-hidden
              />
              <p className={`text-sm ${isLight ? "text-slate-600" : "text-slate-400"}`}>
                {p.devicesEmpty}
              </p>
            </div>
          ) : (
            <ul className="space-y-3">
              {devices.slice(0, 5).map((device) => (
                <li
                  key={device.id}
                  className={`flex flex-wrap items-center justify-between gap-2 rounded-lg border px-3 py-2 ${
                    isLight ? "border-slate-100 bg-slate-50/80" : "border-white/10 bg-white/[0.03]"
                  }`}
                >
                  <div className="min-w-0">
                    <div
                      className={`text-sm font-medium truncate ${
                        isLight ? "text-slate-900" : "text-slate-100"
                      }`}
                    >
                      {device.name}
                    </div>
                    <div
                      className={`text-[11px] font-mono truncate ${
                        isLight ? "text-slate-500" : "text-slate-500"
                      }`}
                    >
                      {device.deviceId}
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <span className={portalConnectionBadge(device.status, isLight)}>
                      {device.status}
                    </span>
                    <span className={`text-[10px] ${isLight ? "text-slate-500" : "text-slate-500"}`}>
                      {formatSeen(device.lastSeenAt)}
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>

      {/* Updates */}
      <section className="space-y-3">
        <h2 className={portalSectionLabel(isLight)}>{p.updatesTitle}</h2>
        <div
          className={`${portalCardShell(isLight)} flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between`}
        >
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <Cloud size={16} className={isLight ? "text-orange-600" : "text-orange-400"} aria-hidden />
              <span
                className={`text-sm font-semibold ${
                  isLight ? "text-slate-900" : "text-slate-100"
                }`}
              >
                {p.latestVersion}: {latestVersion}
              </span>
              <span className={portalCloudStatusTone("ok", isLight)}>
                {p.updatesPlatform}
              </span>
            </div>
            <p className={`text-xs ${isLight ? "text-slate-500" : "text-slate-500"}`}>
              {p.updatesReleaseNotes}
            </p>
          </div>
          {downloadAvailable && downloadUrl ? (
            <a
              href={downloadUrl}
              download={`Caisty.PoS_${latestVersion}_x64-setup.exe`}
              className={`no-underline shrink-0 ${portalPrimaryCta()}`}
            >
              {p.updatesDownload}
            </a>
          ) : (
            <button
              type="button"
              disabled
              className={`shrink-0 ${portalPrimaryCta()} opacity-50 cursor-not-allowed`}
            >
              {p.downloadUnavailable}
            </button>
          )}
        </div>
      </section>

      {/* Coming soon */}
      <section className="space-y-3">
        <h2 className={portalSectionLabel(isLight)}>{p.comingSoonTitle}</h2>
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {comingSoonItems.map((label) => (
            <div
              key={label}
              className={`${portalCompactCard(isLight)} flex items-center justify-between gap-2 opacity-75`}
            >
              <span
                className={`text-xs font-medium ${
                  isLight ? "text-slate-700" : "text-slate-300"
                }`}
              >
                {label}
              </span>
              <span className="inline-flex items-center gap-1">
                <Sparkles size={12} className="text-orange-500" aria-hidden />
                <span
                  className={`text-[10px] font-semibold uppercase tracking-wide ${
                    isLight ? "text-slate-500" : "text-slate-500"
                  }`}
                >
                  {p.statusComingSoon}
                </span>
              </span>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};

export default PortalPosPage;
