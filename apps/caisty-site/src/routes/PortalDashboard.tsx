// apps/caisty-site/src/routes/PortalDashboard.tsx
import React from "react";
import { Link } from "react-router-dom";
import {
  fetchPortalLicenses,
  fetchPortalDevices,
  fetchPortalInvoices,
  fetchPortalBusiness,
  type PortalLicense,
  type PortalInvoice,
  type PortalDevice,
  type PortalBusinessProfile,
} from "../lib/portalApi";
import { usePortalOutlet } from "./PortalLayout";
import { useTheme } from "../lib/theme";
import { useLanguage } from "../lib/LanguageContext";
import { getPortalTranslations } from "../lib/translations";
import { portalLocaleTag } from "../lib/portalLocale";
import { pickPrimaryPortalLicense } from "../lib/portalLicensePick";
import {
  portalCardShell,
  portalCloudStatusTone,
  portalInnerCard,
  portalInvoiceStatusBadge,
  portalLicenseStatusBadge,
  portalMutedLink,
  portalSectionLabel,
  portalTextLink,
} from "../lib/portalUi";
import {
  accountStatusTone,
  businessCompletenessTone,
  deviceConnectionTone,
  fiscalStatusTone,
  formatFiscalStatus,
  formatLicenseStatus,
  formatProviderLabel,
  formatReceiptMode,
  licenseStatusTone,
  statusToneLabel,
} from "../lib/caistyTerminology";

const PortalDashboard: React.FC = () => {
  const { customer } = usePortalOutlet();
  const { language } = useLanguage();
  const t = getPortalTranslations(language);
  const locale = portalLocaleTag(language);
  const { theme } = useTheme();
  const isLight = theme === "light";

  const dash = t.labels.dash;

  function formatDate(value: string | null | undefined): string {
    if (!value) return dash;
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return value;
    return d.toLocaleString(locale);
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

  const [licenses, setLicenses] = React.useState<PortalLicense[]>([]);
  const [deviceCount, setDeviceCount] = React.useState(0);
  const [latestInvoice, setLatestInvoice] =
    React.useState<PortalInvoice | null>(null);
  const [business, setBusiness] = React.useState<PortalBusinessProfile | null>(
    null,
  );
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    let cancelled = false;

    (async () => {
      setLoading(true);
      try {
        const [lics, devs, invs, biz] = await Promise.all([
          fetchPortalLicenses(),
          fetchPortalDevices(),
          fetchPortalInvoices(),
          fetchPortalBusiness().catch(() => null),
        ]);

        if (cancelled) return;

        setLicenses(lics);

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
  }, []);

  const activeLicense: PortalLicense | null = React.useMemo(
    () => pickPrimaryPortalLicense(licenses),
    [licenses],
  );

  function businessCountryLabel(code: string | null | undefined): string {
    if (!code) return t.dashboard.businessNotConfigured;
    const key = code as keyof typeof t.business.countries;
    return t.business.countries[key] ?? code;
  }

  function fiscalStatusLabel(status: string | undefined): string {
    if (!status) return dash;
    const key = status as keyof typeof t.business.statusFiscal;
    return t.business.statusFiscal[key] ?? status;
  }

  function complianceLabel(status: string | undefined): string {
    if (!status) return dash;
    const key = status as keyof typeof t.business.statusCompliance;
    return t.business.statusCompliance[key] ?? status;
  }

  function posReadinessLabel(status: string | undefined): string {
    if (!status) return dash;
    const key = status as keyof typeof t.business.statusPos;
    return t.business.statusPos[key] ?? status;
  }

  const welcomeTitle = t.dashboard.welcome.replace("{{name}}", customer.name);

  const accountTone = accountStatusTone(customer.portalStatus);
  const businessTone = businessCompletenessTone({
    country: business?.country,
    complianceStatus: business?.complianceStatus,
  });
  const licenseTone = activeLicense
    ? licenseStatusTone(activeLicense.status)
    : "action_required";
  const deviceTone = deviceConnectionTone(deviceCount);
  const fiscalTone = business
    ? fiscalStatusTone(business.fiscalStatus)
    : "unknown";

  const fiscalSummary = business
    ? business.country === "DE" && business.fiscalStatus === "pending_setup"
      ? t.dashboard.fiskalyPending
      : business.fiscalStatus === "pending_setup"
        ? t.dashboard.fiscalSetupPending
        : formatFiscalStatus(business.fiscalStatus)
    : t.dashboard.businessNotConfigured;

  return (
    <div className="space-y-8">
      <header className="space-y-2">
        <h1
          className={`text-2xl sm:text-3xl font-semibold tracking-tight ${
            isLight ? "text-[#0B1220]" : "text-white"
          }`}
        >
          {welcomeTitle}
        </h1>
        <p
          className={`text-sm max-w-2xl leading-relaxed ${
            isLight ? "text-slate-600" : "text-slate-400"
          }`}
        >
          {t.dashboard.subtitle}
        </p>
      </header>

      <section className={`space-y-3 ${portalCardShell(isLight)}`}>
        <div>
          <h2
            className={`text-sm font-semibold ${
              isLight ? "text-slate-900" : "text-slate-100"
            }`}
          >
            {t.dashboard.cloudOverviewTitle}
          </h2>
          <p
            className={`text-xs mt-1 ${
              isLight ? "text-slate-600" : "text-slate-400"
            }`}
          >
            {t.dashboard.cloudOverviewHint}
          </p>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          {(
            [
              {
                title: t.dashboard.cardAccount,
                tone: accountTone,
                detail:
                  customer.portalStatus === "active"
                    ? t.dashboard.accountActive
                    : customer.portalStatus === "blocked"
                      ? t.dashboard.accountBlocked
                      : t.dashboard.accountPending,
                href: "/portal/account",
              },
              {
                title: t.dashboard.cardBusiness,
                tone: businessTone,
                detail: business
                  ? business.complianceStatus === "ready"
                    ? t.dashboard.businessReady
                    : t.dashboard.businessIncomplete
                  : t.dashboard.businessNotConfigured,
                href: "/portal/business",
                cta:
                  businessTone !== "ok"
                    ? t.dashboard.completeBusinessProfile
                    : undefined,
              },
              {
                title: t.dashboard.cardLicense,
                tone: licenseTone,
                detail: activeLicense
                  ? `${formatLicenseStatus(activeLicense.status)} · ${activeLicense.plan}`
                  : t.dashboard.noLicenseShort,
                href: "/portal/licenses",
              },
              {
                title: t.dashboard.cardDevices,
                tone: deviceTone,
                detail:
                  deviceCount > 0
                    ? t.dashboard.devicesBound.replace(
                        "{{count}}",
                        String(deviceCount),
                      )
                    : t.dashboard.noDevicesShort,
                href: "/portal/devices",
              },
              {
                title: t.dashboard.cardFiscal,
                tone: fiscalTone,
                detail: fiscalSummary,
                href: "/portal/business",
                cta:
                  business?.fiscalStatus === "pending_setup"
                    ? t.dashboard.fiscalSetupPending
                    : undefined,
              },
            ] as const
          ).map((card) => (
            <Link
              key={card.title}
              to={card.href}
              className={`block rounded-xl border p-3 no-underline transition-colors ${
                isLight
                  ? "border-slate-200 bg-slate-50 hover:border-orange-200 hover:bg-orange-50/40"
                  : "border-white/10 bg-white/[0.03] hover:border-orange-500/30 hover:bg-white/[0.05]"
              }`}
            >
              <div className="flex items-center justify-between gap-2 mb-2">
                <span
                  className={`text-[11px] font-semibold uppercase tracking-wide ${
                    isLight ? "text-slate-500" : "text-slate-400"
                  }`}
                >
                  {card.title}
                </span>
                <span className={portalCloudStatusTone(card.tone, isLight)}>
                  {statusToneLabel(card.tone)}
                </span>
              </div>
              <p
                className={`text-xs leading-relaxed ${
                  isLight ? "text-slate-800" : "text-slate-200"
                }`}
              >
                {card.detail}
              </p>
              {business && card.title === t.dashboard.cardFiscal ? (
                <p
                  className={`text-[10px] mt-2 ${
                    isLight ? "text-slate-500" : "text-slate-500"
                  }`}
                >
                  {formatProviderLabel(
                    business.fiscalProvider,
                    business.providerLabel,
                  )}{" "}
                  · {formatReceiptMode(business.receiptMode)}
                </p>
              ) : null}
              {"cta" in card && card.cta ? (
                <p className={`text-[11px] mt-2 font-medium ${portalTextLink(isLight)}`}>
                  {card.cta} →
                </p>
              ) : null}
            </Link>
          ))}
        </div>
        <p
          className={`text-[10px] ${
            isLight ? "text-slate-500" : "text-slate-500"
          }`}
        >
          {t.layout.cloudManaged} · {t.layout.syncedFromCloud}
        </p>
      </section>

      <div className="portal-stat-grid">
        <section className={`portal-stat-card space-y-4`}>
          <div className={portalSectionLabel(isLight)}>{t.dashboard.activeLicense}</div>

          {loading ? (
            <div className="space-y-2">
              <div
                className={`h-4 w-40 rounded animate-pulse ${
                  isLight ? "bg-slate-200" : "bg-slate-800"
                }`}
              />
              <div
                className={`h-3 w-24 rounded animate-pulse ${
                  isLight ? "bg-slate-200" : "bg-slate-800"
                }`}
              />
              <div
                className={`h-3 w-32 rounded animate-pulse ${
                  isLight ? "bg-slate-200" : "bg-slate-800"
                }`}
              />
            </div>
          ) : !activeLicense ? (
            <p
              className={`text-xs ${
                isLight ? "text-slate-600" : "text-slate-400"
              }`}
            >
              {t.dashboard.noLicenseBody}
            </p>
          ) : (
            <div className="space-y-2">
              <div
                className={`font-mono text-sm break-all ${
                  isLight ? "text-slate-900" : "text-slate-100"
                }`}
              >
                {activeLicense.key}
              </div>
              <div
                className={`text-xs ${
                  isLight ? "text-slate-700" : "text-slate-300"
                }`}
              >
                {t.labels.plan}:{" "}
                <span className="font-medium capitalize">
                  {activeLicense.plan}
                </span>
              </div>
              <div className="flex items-center gap-2 text-xs">
                <span
                  className={isLight ? "text-slate-700" : "text-slate-300"}
                >
                  {t.labels.status}:
                </span>
                <span className={portalLicenseStatusBadge(activeLicense.status, isLight)}>
                  {formatLicenseStatus(activeLicense.status)}
                </span>
              </div>
              <div
                className={`text-xs ${
                  isLight ? "text-slate-600" : "text-slate-400"
                }`}
              >
                {t.labels.validUntil}:{" "}
                {activeLicense.validUntil
                  ? formatDate(activeLicense.validUntil)
                  : dash}
              </div>
            </div>
          )}
        </section>

        <section className="portal-stat-card flex flex-col justify-between">
          <div className="space-y-4">
            <div className={portalSectionLabel(isLight)}>{t.dashboard.devicesTitle}</div>

            {loading ? (
              <div
                className={`h-10 w-14 rounded animate-pulse ${
                  isLight ? "bg-slate-200" : "bg-slate-800"
                }`}
              />
            ) : (
              <div
                className={`text-4xl font-bold tabular-nums tracking-tight ${
                  isLight ? "text-orange-600" : "text-orange-400"
                }`}
              >
                {deviceCount}
              </div>
            )}

            <p
              className={`text-xs ${
                isLight ? "text-slate-600" : "text-slate-400"
              }`}
            >
              {t.dashboard.devicesHint}
            </p>
          </div>

          <div className="mt-auto pt-2 text-xs">
            <Link to="/portal/devices" className={`no-underline ${portalTextLink(isLight)}`}>
              {t.dashboard.devicesLink}
            </Link>
          </div>
        </section>

        <section className="portal-stat-card flex flex-col justify-between">
          <div className="space-y-4">
            <div className={portalSectionLabel(isLight)}>{t.dashboard.latestInvoice}</div>

            {loading ? (
              <div className="space-y-2">
                <div
                  className={`h-3 w-32 rounded animate-pulse ${
                    isLight ? "bg-slate-200" : "bg-slate-800"
                  }`}
                />
                <div
                  className={`h-3 w-24 rounded animate-pulse ${
                    isLight ? "bg-slate-200" : "bg-slate-800"
                  }`}
                />
                <div
                  className={`h-3 w-28 rounded animate-pulse ${
                    isLight ? "bg-slate-200" : "bg-slate-800"
                  }`}
                />
              </div>
            ) : !latestInvoice ? (
              <p
                className={`text-xs ${
                  isLight ? "text-slate-600" : "text-slate-400"
                }`}
              >
                {t.dashboard.noInvoices}
              </p>
            ) : (
              <div
                className={`space-y-1 text-xs ${
                  isLight ? "text-slate-700" : "text-slate-300"
                }`}
              >
                <div
                  className={`font-mono text-xs ${
                    isLight ? "text-slate-900" : "text-slate-100"
                  }`}
                >
                  {latestInvoice.number}
                </div>
                <div>
                  {t.dashboard.amountLabel}{" "}
                  <span className="font-medium">
                    {formatAmount(
                      latestInvoice.currency,
                      latestInvoice.amountCents ? latestInvoice.amountCents / 100 : 0,
                    )}
                  </span>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className={isLight ? "text-slate-700" : "text-slate-300"}>{t.labels.status}:</span>
                  <span className={portalInvoiceStatusBadge(latestInvoice.status, isLight)}>
                    {latestInvoice.status}
                  </span>
                </div>
                <div
                  className={isLight ? "text-slate-600" : "text-slate-400"}
                >
                  {t.dashboard.createdAtLabel} {formatDate(latestInvoice.createdAt)}
                </div>
              </div>
            )}
          </div>

          <div className="mt-auto pt-2 text-xs">
            <Link to="/portal/invoices" className={`no-underline ${portalTextLink(isLight)}`}>
              {t.dashboard.invoicesLink}
            </Link>
          </div>
        </section>

        <section className="portal-stat-card flex flex-col justify-between md:col-span-2 lg:col-span-1">
          <div className="space-y-3">
            <div className={portalSectionLabel(isLight)}>
              {t.dashboard.businessStatusTitle}
            </div>
            <p
              className={`text-[11px] ${
                isLight ? "text-slate-600" : "text-slate-400"
              }`}
            >
              {t.dashboard.businessStatusHint}
            </p>

            {loading ? (
              <div className="space-y-2">
                <div
                  className={`h-3 w-full rounded animate-pulse ${
                    isLight ? "bg-slate-200" : "bg-slate-800"
                  }`}
                />
                <div
                  className={`h-3 w-4/5 rounded animate-pulse ${
                    isLight ? "bg-slate-200" : "bg-slate-800"
                  }`}
                />
              </div>
            ) : !business ? (
              <p
                className={`text-xs ${
                  isLight ? "text-slate-600" : "text-slate-400"
                }`}
              >
                {t.dashboard.businessNotConfigured}
              </p>
            ) : (
              <dl
                className={`space-y-1.5 text-xs ${
                  isLight ? "text-slate-700" : "text-slate-300"
                }`}
              >
                <div className="flex justify-between gap-2">
                  <dt className={isLight ? "text-slate-500" : "text-slate-500"}>
                    {t.dashboard.businessCountry}
                  </dt>
                  <dd className="font-medium text-right">
                    {businessCountryLabel(business.country)}
                  </dd>
                </div>
                <div className="flex justify-between gap-2">
                  <dt className={isLight ? "text-slate-500" : "text-slate-500"}>
                    {t.dashboard.businessCurrency}
                  </dt>
                  <dd className="font-medium">{business.currency}</dd>
                </div>
                <div className="flex justify-between gap-2">
                  <dt className={isLight ? "text-slate-500" : "text-slate-500"}>
                    {t.dashboard.businessFiscalStatus}
                  </dt>
                  <dd className="font-medium text-right">
                    {fiscalStatusLabel(business.fiscalStatus)}
                  </dd>
                </div>
                <div className="flex justify-between gap-2">
                  <dt className={isLight ? "text-slate-500" : "text-slate-500"}>
                    {t.dashboard.businessPosReadiness}
                  </dt>
                  <dd className="font-medium text-right">
                    {posReadinessLabel(business.posReadiness)}
                  </dd>
                </div>
                <div className="flex justify-between gap-2">
                  <dt className={isLight ? "text-slate-500" : "text-slate-500"}>
                    {t.dashboard.businessCompliance}
                  </dt>
                  <dd className="font-medium text-right">
                    {complianceLabel(business.complianceStatus)}
                  </dd>
                </div>
              </dl>
            )}
          </div>

          <div className="mt-auto pt-2 text-xs">
            <Link
              to="/portal/business"
              className={`no-underline ${portalTextLink(isLight)}`}
            >
              {t.dashboard.businessLink}
            </Link>
          </div>
        </section>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <section className={`space-y-3 ${portalCardShell(isLight)}`}>
          <div className="flex items-center justify-between gap-2">
            <div>
              <h2
                className={`text-sm font-semibold ${
                  isLight ? "text-slate-900" : "text-slate-100"
                }`}
              >
                {t.dashboard.licensesTitle}
              </h2>
              <p
                className={`text-xs ${
                  isLight ? "text-slate-600" : "text-slate-400"
                }`}
              >
                {t.dashboard.licensesHint}
              </p>
            </div>
            {licenses.length > 0 && (
              <Link to="/portal/licenses" className={`text-xs no-underline ${portalMutedLink(isLight)}`}>
                {t.dashboard.showAll}
              </Link>
            )}
          </div>

          {loading ? (
            <div className="space-y-2 pt-2">
              <div
                className={`h-4 w-full rounded animate-pulse ${
                  isLight ? "bg-slate-200" : "bg-slate-800"
                }`}
              />
              <div
                className={`h-4 w-4/5 rounded animate-pulse ${
                  isLight ? "bg-slate-200" : "bg-slate-800"
                }`}
              />
            </div>
          ) : licenses.length === 0 ? (
            <p
              className={`text-xs ${
                isLight ? "text-slate-600" : "text-slate-400"
              }`}
            >
              {t.dashboard.noLicensesBody}
            </p>
          ) : (
            <div className="space-y-2 text-xs">
              {licenses.slice(0, 3).map((lic) => (
                <div
                  key={lic.id}
                  className={`rounded-xl border px-3 py-2.5 flex items-center justify-between gap-2 ${portalInnerCard(isLight)}`}
                >
                  <div>
                    <div
                      className={`font-mono text-sm break-all ${
                        isLight ? "text-slate-900" : "text-slate-100"
                      }`}
                    >
                      {lic.key}
                    </div>
                    <div
                      className={`text-[11px] ${
                        isLight ? "text-slate-600" : "text-slate-400"
                      }`}
                    >
                      {lic.plan} • {t.dashboard.validUntilShort}{" "}
                      {lic.validUntil
                        ? formatDate(lic.validUntil)
                        : dash}
                    </div>
                  </div>
                  <span className={portalLicenseStatusBadge(lic.status, isLight)}>{formatLicenseStatus(lic.status)}</span>
                </div>
              ))}
              {licenses.length > 3 && (
                <div
                  className={`text-[11px] ${
                    isLight ? "text-slate-600" : "text-slate-400"
                  }`}
                >
                  {t.dashboard.moreLicenses.replace(
                    "{{count}}",
                    String(licenses.length - 3),
                  )}
                </div>
              )}
            </div>
          )}
        </section>

        <section className={`space-y-4 ${portalCardShell(isLight)}`}>
          <h2
            className={`text-sm font-semibold ${
              isLight ? "text-slate-900" : "text-slate-100"
            }`}
          >
            {t.dashboard.nextStepsTitle}
          </h2>
          <ul className={`space-y-3 text-xs ${isLight ? "text-slate-700" : "text-slate-300"}`}>
            <li className="flex gap-3">
              <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-orange-500 text-[11px] font-bold text-white">
                1
              </span>
              <span className="min-w-0 leading-relaxed">
                <Link to="/portal/install" className={`no-underline underline-offset-2 hover:underline ${portalTextLink(isLight)}`}>
                  {t.dashboard.step1Link}
                </Link>{" "}
                {t.dashboard.step1Suffix}
              </span>
            </li>
            <li className="flex gap-3">
              <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-orange-500 text-[11px] font-bold text-white">
                2
              </span>
              <span className="min-w-0 leading-relaxed">
                {t.dashboard.step2Before}{" "}
                <Link to="/portal/devices" className={`no-underline underline-offset-2 hover:underline ${portalTextLink(isLight)}`}>
                  {t.dashboard.step2Link}
                </Link>
                {t.dashboard.step2After}
              </span>
            </li>
            <li className="flex gap-3">
              <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-orange-500 text-[11px] font-bold text-white">
                3
              </span>
              <span className="min-w-0 leading-relaxed">
                {t.dashboard.step3Before}{" "}
                <Link to="/portal/invoices" className={`no-underline underline-offset-2 hover:underline ${portalTextLink(isLight)}`}>
                  {t.dashboard.step3Link}
                </Link>
                {t.dashboard.step3After}
              </span>
            </li>
          </ul>
          <p
            className={`text-[11px] pt-1 ${
              isLight ? "text-slate-500" : "text-slate-500"
            }`}
          >
            {t.dashboard.footerHint}
          </p>
        </section>
      </div>
    </div>
  );
};

export default PortalDashboard;
