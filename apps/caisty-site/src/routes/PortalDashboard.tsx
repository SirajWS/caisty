// apps/caisty-site/src/routes/PortalDashboard.tsx
import React from "react";
import { Link } from "react-router-dom";
import {
  fetchPortalLicenses,
  fetchPortalDevices,
  fetchPortalInvoices,
  fetchPortalBusiness,
  fetchPortalMe,
  type PortalLicense,
  type PortalInvoice,
  type PortalDevice,
  type PortalBusinessProfile,
  type PortalCustomer,
} from "../lib/portalApi";
import { usePortalOutlet } from "./PortalLayout";
import { useTheme } from "../lib/theme";
import { useLanguage } from "../lib/LanguageContext";
import { getPortalTranslations } from "../lib/translations";
import { portalLocaleTag } from "../lib/portalLocale";
import { pickPrimaryPortalLicense } from "../lib/portalLicensePick";
import {
  portalCompactCard,
  portalInnerCard,
  portalInvoiceStatusBadge,
  portalPageShell,
  portalPageSubtitle,
  portalPageTitle,
  portalTextLink,
} from "../lib/portalUi";
import { formatLicenseStatus } from "../lib/caistyTerminology";
import {
  getFiscalCustomerCopy,
  useFiscalVisibility,
} from "../lib/useFiscalVisibility";
import { derivePortalSetupSteps, type SetupStepId } from "../lib/derivePortalSetupSteps";
import { PortalCompactLink, PortalSetupStepper } from "../components/PortalSetupStepper";

const PortalDashboard: React.FC = () => {
  const { customer } = usePortalOutlet();
  const { language } = useLanguage();
  const t = getPortalTranslations(language);
  const locale = portalLocaleTag(language);
  const { theme } = useTheme();
  const isLight = theme === "light";
  const dash = t.labels.dash;

  const [licenses, setLicenses] = React.useState<PortalLicense[]>([]);
  const [deviceCount, setDeviceCount] = React.useState(0);
  const [latestInvoice, setLatestInvoice] =
    React.useState<PortalInvoice | null>(null);
  const [invoices, setInvoices] = React.useState<PortalInvoice[]>([]);
  const [business, setBusiness] = React.useState<PortalBusinessProfile | null>(
    null,
  );
  const [me, setMe] = React.useState<PortalCustomer | null>(customer);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    let cancelled = false;

    (async () => {
      setLoading(true);
      try {
        const [lics, devs, invs, biz, portalMe] = await Promise.all([
          fetchPortalLicenses(),
          fetchPortalDevices(),
          fetchPortalInvoices(),
          fetchPortalBusiness().catch(() => null),
          fetchPortalMe().catch(() => null),
        ]);

        if (cancelled) return;

        setLicenses(lics);
        setInvoices(invs);
        setMe(portalMe ?? customer);

        const uniqueDeviceIds = new Set<string>();
        (devs as PortalDevice[]).forEach((d) => {
          const key =
            (d as { deviceId?: string }).deviceId ||
            (d as { fingerprint?: string }).fingerprint ||
            d.id;
          if (key) uniqueDeviceIds.add(key);
        });
        setDeviceCount(uniqueDeviceIds.size);

        const sorted = [...invs].sort(
          (a, b) =>
            new Date(b.createdAt).getTime() -
            new Date(a.createdAt).getTime(),
        );
        setLatestInvoice(sorted[0] ?? null);
        setBusiness(biz);
      } catch (err) {
        console.error("Portal dashboard load failed:", err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [customer]);

  const activeLicense: PortalLicense | null = React.useMemo(
    () => pickPrimaryPortalLicense(licenses),
    [licenses],
  );

  const fiscalVisibility = useFiscalVisibility(business);
  const fiscalCopy = getFiscalCustomerCopy(t, fiscalVisibility);

  const setupState = React.useMemo(
    () =>
      derivePortalSetupSteps({
        business,
        licenses,
        customer: me,
        invoices,
        deviceCount,
      }),
    [business, licenses, me, invoices, deviceCount],
  );

  const stepLabels: Record<SetupStepId, string> = {
    country_currency: t.dashboard.setupStepCountry,
    company: t.dashboard.setupStepCompany,
    license_plan: t.dashboard.setupStepLicense,
    install: t.dashboard.setupStepInstall,
  };

  function businessCountryLabel(code: string | null | undefined): string {
    if (!code) return t.dashboard.businessNotConfigured;
    const key = code as keyof typeof t.business.countries;
    return t.business.countries[key] ?? code;
  }

  function formatAmount(currency: string | null | undefined, amount: number): string {
    try {
      return new Intl.NumberFormat(locale, {
        style: "currency",
        currency: currency || "EUR",
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }).format(amount);
    } catch {
      return `${amount} ${currency ?? ""}`.trim();
    }
  }

  const welcomeTitle = t.dashboard.welcome.replace("{{name}}", customer.name);
  const subtitle = setupState.allDone
    ? t.dashboard.setupSubtitleReady
    : t.dashboard.setupStepsRemaining.replace(
        "{{count}}",
        String(setupState.remainingCount),
      );

  const currentStepLabel = setupState.currentStepId
    ? stepLabels[setupState.currentStepId]
    : "";

  const licensePlanLabel = activeLicense
    ? `${formatLicenseStatus(activeLicense.status)} · ${activeLicense.plan}`
    : t.dashboard.compactNoLicense;

  return (
    <div className={portalPageShell()}>
      <header className="space-y-1">
        <h1 className={portalPageTitle(isLight)}>{welcomeTitle}</h1>
        <p className={portalPageSubtitle(isLight)}>{subtitle}</p>
      </header>

      {loading ? (
        <div
          className={`h-24 rounded-xl animate-pulse ${
            isLight ? "bg-slate-200" : "bg-slate-800"
          }`}
        />
      ) : (
        <PortalSetupStepper
          state={setupState}
          stepLabels={stepLabels}
          nextStepTitle={`${t.dashboard.nextStepPrefix} ${currentStepLabel}`}
          nextStepCta={t.dashboard.nextStepCta}
          allReadyLine={t.dashboard.setupAllReady}
          isLight={isLight}
        />
      )}

      <div className="grid gap-3 sm:grid-cols-3">
        <div className={portalCompactCard(isLight)}>
          <div className={`text-[10px] uppercase tracking-wide font-semibold ${isLight ? "text-slate-500" : "text-slate-400"}`}>
            {t.dashboard.compactCountry}
          </div>
          <div className={`text-sm font-medium mt-1 ${isLight ? "text-slate-900" : "text-slate-100"}`}>
            {business?.country
              ? businessCountryLabel(business.country)
              : dash}
          </div>
          <div className="mt-2">
            <PortalCompactLink to="/portal/business" isLight={isLight}>
              {t.dashboard.compactChange} →
            </PortalCompactLink>
          </div>
        </div>

        <div className={portalCompactCard(isLight)}>
          <div className={`text-[10px] uppercase tracking-wide font-semibold ${isLight ? "text-slate-500" : "text-slate-400"}`}>
            {t.dashboard.compactCurrency}
          </div>
          <div className={`text-sm font-medium mt-1 ${isLight ? "text-slate-900" : "text-slate-100"}`}>
            {business?.currency ?? dash}
          </div>
        </div>

        <div className={portalCompactCard(isLight)}>
          <div className={`text-[10px] uppercase tracking-wide font-semibold ${isLight ? "text-slate-500" : "text-slate-400"}`}>
            {t.dashboard.compactLicensePlan}
          </div>
          <div className={`text-sm font-medium mt-1 capitalize ${isLight ? "text-slate-900" : "text-slate-100"}`}>
            {licensePlanLabel}
          </div>
          <div className="mt-2">
            <PortalCompactLink to="/portal/plan" isLight={isLight}>
              {t.dashboard.compactManage} →
            </PortalCompactLink>
          </div>
        </div>
      </div>

      <div className={`grid gap-3 sm:grid-cols-2 ${portalInnerCard(isLight)} p-3 sm:p-4`}>
        <div className="flex flex-wrap items-baseline justify-between gap-2 text-sm">
          <span className={isLight ? "text-slate-500" : "text-slate-400"}>
            {t.dashboard.compactDevices}
          </span>
          <span className={`font-semibold tabular-nums ${isLight ? "text-orange-600" : "text-orange-400"}`}>
            {loading ? "…" : deviceCount}
          </span>
          <Link to="/portal/devices" className={`text-xs no-underline ${portalTextLink(isLight)}`}>
            {t.dashboard.devicesLink}
          </Link>
        </div>

        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm min-w-0">
          <span className={`shrink-0 ${isLight ? "text-slate-500" : "text-slate-400"}`}>
            {t.dashboard.compactLastInvoice}
          </span>
          {loading ? (
            <span className={isLight ? "text-slate-600" : "text-slate-400"}>…</span>
          ) : !latestInvoice ? (
            <span className={isLight ? "text-slate-600" : "text-slate-400"}>
              {t.dashboard.compactNoInvoice}
            </span>
          ) : (
            <>
              <span className={`font-mono text-xs truncate ${isLight ? "text-slate-900" : "text-slate-100"}`}>
                {latestInvoice.number}
              </span>
              <span className={`font-medium ${isLight ? "text-slate-800" : "text-slate-200"}`}>
                {formatAmount(
                  latestInvoice.currency,
                  latestInvoice.amountCents ? latestInvoice.amountCents / 100 : 0,
                )}
              </span>
              <span className={portalInvoiceStatusBadge(latestInvoice.status, isLight)}>
                {latestInvoice.status}
              </span>
              <Link to="/portal/invoices" className={`text-xs no-underline ml-auto ${portalTextLink(isLight)}`}>
                {t.dashboard.invoicesLink}
              </Link>
            </>
          )}
        </div>
      </div>

      {fiscalCopy ? (
        <p
          className={`text-xs leading-relaxed rounded-lg border px-3 py-2 ${
            fiscalCopy.tone === "ok"
              ? isLight
                ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                : "border-emerald-500/30 bg-emerald-500/10 text-emerald-300"
              : isLight
                ? "border-amber-200 bg-amber-50 text-amber-900"
                : "border-amber-500/30 bg-amber-500/10 text-amber-200"
          }`}
        >
          {fiscalCopy.message}
        </p>
      ) : null}
    </div>
  );
};

export default PortalDashboard;
