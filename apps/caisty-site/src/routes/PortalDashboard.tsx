// apps/caisty-site/src/routes/PortalDashboard.tsx
import React from "react";
import { Link } from "react-router-dom";
import {
  fetchPortalLicenses,
  fetchPortalDevices,
  fetchPortalInvoices,
  type PortalLicense,
  type PortalInvoice,
  type PortalDevice,
} from "../lib/portalApi";
import { usePortalOutlet } from "./PortalLayout";
import { useTheme } from "../lib/theme";
import { useLanguage } from "../lib/LanguageContext";
import { getPortalTranslations } from "../lib/translations";
import { portalLocaleTag } from "../lib/portalLocale";
import { pickPrimaryPortalLicense } from "../lib/portalLicensePick";
import {
  portalCardShell,
  portalInnerCard,
  portalInvoiceStatusBadge,
  portalLicenseStatusBadge,
  portalMutedLink,
  portalSectionLabel,
  portalTextLink,
} from "../lib/portalUi";

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
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    let cancelled = false;

    (async () => {
      setLoading(true);
      try {
        const [lics, devs, invs] = await Promise.all([
          fetchPortalLicenses(),
          fetchPortalDevices(),
          fetchPortalInvoices(),
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

  const welcomeTitle = t.dashboard.welcome.replace("{{name}}", customer.name);

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

      <div className="grid gap-6 md:grid-cols-3">
        <section className={`space-y-4 ${portalCardShell(isLight)}`}>
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
                  {activeLicense.status}
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

        <section className={`${portalCardShell(isLight)} flex flex-col justify-between`}>
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

        <section className={`${portalCardShell(isLight)} flex flex-col justify-between`}>
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
                  <span className={portalLicenseStatusBadge(lic.status, isLight)}>{lic.status}</span>
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
