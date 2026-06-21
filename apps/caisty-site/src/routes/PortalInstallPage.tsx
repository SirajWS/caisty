// apps/caisty-site/src/routes/PortalInstallPage.tsx
import React from "react";
import { FlaskConical, Monitor, Terminal } from "lucide-react";
import { Link } from "react-router-dom";
import { usePortalOutlet } from "./PortalLayout";
import {
  fetchPortalLicenses,
  type PortalLicense,
} from "../lib/portalApi";
import { Button } from "../components/ui/Button";
import { useTheme } from "../lib/theme";
import { useLanguage } from "../lib/LanguageContext";
import { getPortalTranslations } from "../lib/translations";
import { portalLocaleTag } from "../lib/portalLocale";
import { pickPrimaryPortalLicense } from "../lib/portalLicensePick";
import { portalCardShell, portalLicenseStatusBadge, portalPrimaryCta } from "../lib/portalUi";

const WINDOWS_INSTALL_URL =
  import.meta.env.VITE_POS_WINDOWS_URL ||
  "https://www.caisty.com/downloads/Caisty.PoS_0.2.8_x64-setup.exe";

const WINDOWS_DEMO_URL =
  import.meta.env.VITE_POS_WINDOWS_DEMO_URL || null;

const PortalInstallPage: React.FC = () => {
  const { customer } = usePortalOutlet();
  const { theme } = useTheme();
  const { language } = useLanguage();
  const t = getPortalTranslations(language);
  const locale = portalLocaleTag(language);
  const isLight = theme === "light";
  const [licenses, setLicenses] = React.useState<PortalLicense[]>([]);
  const [loading, setLoading] = React.useState(true);

  function formatDate(value: string | null | undefined): string {
    if (!value) return t.labels.dash;
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return value;
    return d.toLocaleString(locale);
  }

  React.useEffect(() => {
    let cancelled = false;

    (async () => {
      setLoading(true);
      try {
        const items = await fetchPortalLicenses();
        if (!cancelled) setLicenses(items);
      } catch (err) {
        console.error(t.install.loadLicensesError, err);
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

  return (
    <div className="space-y-10">
      <header className="space-y-2">
        <h1
          className={`text-2xl sm:text-3xl font-semibold tracking-tight ${
            isLight ? "text-[#0B1220]" : "text-white"
          }`}
        >
          {t.install.title}
        </h1>
        <p
          className={`text-sm ${
            isLight ? "text-slate-700" : "text-slate-300"
          }`}
        >
          {t.install.subtitlePrefix}{" "}
          <span className={`font-medium ${isLight ? "text-slate-900" : "text-slate-100"}`}>{customer.name}</span>.
        </p>
      </header>

      <section className={`${portalCardShell(isLight)} space-y-5`}>
        <div className="flex gap-3">
          <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-orange-500 text-sm font-bold text-white">
            1
          </span>
          <div className="min-w-0 flex-1 space-y-1">
            <h2
              className={`text-sm font-semibold ${
                isLight ? "text-slate-900" : "text-slate-100"
              }`}
            >
              {t.install.step1Title}
            </h2>
            <p
              className={`text-xs ${
                isLight ? "text-slate-600" : "text-slate-400"
              }`}
            >
              {t.install.step1Hint}
            </p>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-3 text-xs">
          <div
            className={`rounded-xl border p-4 space-y-3 flex flex-col ${
              isLight
                ? "border-gray-200 bg-white"
                : "border-white/10 bg-white/[0.03]"
            }`}
          >
            <div className="flex items-center gap-2">
              <Monitor className={`h-5 w-5 shrink-0 ${isLight ? "text-orange-600" : "text-orange-400"}`} aria-hidden />
              <div
                className={`text-sm font-semibold ${
                  isLight ? "text-slate-900" : "text-slate-100"
                }`}
              >
                {t.install.winTitle}
              </div>
            </div>
            <p
              className={isLight ? "text-slate-800" : "text-slate-400"}
            >
              {t.install.winDesc}
            </p>
            <ul
              className={`space-y-1.5 text-xs ${
                isLight ? "text-slate-700" : "text-slate-400"
              }`}
            >
              <li className="flex gap-2">
                <span className="text-emerald-500" aria-hidden>
                  ✓
                </span>
                {t.install.winB1}
              </li>
              <li className="flex gap-2">
                <span className="text-emerald-500" aria-hidden>
                  ✓
                </span>
                {t.install.winB2}
              </li>
              <li className="flex gap-2">
                <span className="text-emerald-500" aria-hidden>
                  ✓
                </span>
                {t.install.winB3}
              </li>
            </ul>
            <div className="mt-3">
              <a
                href={WINDOWS_INSTALL_URL}
                target="_blank"
                rel="noreferrer noopener"
                className={`no-underline w-full ${portalPrimaryCta()} focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500 focus-visible:ring-offset-2 ${isLight ? "ring-offset-white" : "ring-offset-[#0B1220]"}`}
              >
                {t.install.winDownload}
              </a>
            </div>
          </div>

          <div
            className={`rounded-xl border p-4 space-y-3 flex flex-col ${
              isLight
                ? "border-gray-200 bg-white"
                : "border-white/10 bg-white/[0.03]"
            }`}
          >
            <div className="flex items-center gap-2">
              <Terminal className={`h-5 w-5 shrink-0 ${isLight ? "text-orange-600" : "text-orange-400"}`} aria-hidden />
              <div
                className={`text-sm font-semibold ${
                  isLight ? "text-slate-900" : "text-slate-100"
                }`}
              >
                {t.install.linuxTitle}
              </div>
            </div>
            <p
              className={isLight ? "text-slate-700" : "text-slate-400"}
            >
              {t.install.linuxDesc}
            </p>
            <ul
              className={`space-y-1.5 text-xs ${
                isLight ? "text-slate-700" : "text-slate-400"
              }`}
            >
              <li className="flex gap-2">
                <span className="text-emerald-500" aria-hidden>
                  ✓
                </span>
                {t.install.linuxB1}
              </li>
              <li className="flex gap-2">
                <span className="text-emerald-500" aria-hidden>
                  ✓
                </span>
                {t.install.linuxB2}
              </li>
              <li className="flex gap-2">
                <span className="text-emerald-500" aria-hidden>
                  ✓
                </span>
                {t.install.linuxB3}
              </li>
            </ul>
            <div className="mt-3">
              <Button
                variant="outline"
                className="w-full justify-center text-xs font-medium opacity-50 cursor-not-allowed"
                disabled
              >
                {t.install.comingSoon}
              </Button>
            </div>
          </div>

          <div
            className={`rounded-xl border p-4 space-y-3 flex flex-col ${
              isLight
                ? "border-gray-200 bg-white"
                : "border-white/10 bg-white/[0.03]"
            }`}
          >
            <div className="flex items-center gap-2">
              <FlaskConical className={`h-5 w-5 shrink-0 ${isLight ? "text-orange-600" : "text-orange-400"}`} aria-hidden />
              <div
                className={`text-sm font-semibold ${
                  isLight ? "text-slate-900" : "text-slate-100"
                }`}
              >
                {t.install.demoTitle}
              </div>
            </div>
            <p
              className={isLight ? "text-slate-700" : "text-slate-400"}
            >
              {t.install.demoDesc}
            </p>
            <ul
              className={`space-y-1.5 text-xs ${
                isLight ? "text-slate-700" : "text-slate-400"
              }`}
            >
              <li className="flex gap-2">
                <span className="text-emerald-500" aria-hidden>
                  ✓
                </span>
                {t.install.demoB1}
              </li>
              <li className="flex gap-2">
                <span className="text-emerald-500" aria-hidden>
                  ✓
                </span>
                {t.install.demoB2}
              </li>
              <li className="flex gap-2">
                <span className="text-emerald-500" aria-hidden>
                  ✓
                </span>
                {t.install.demoB3}
              </li>
            </ul>
            <div className="mt-3">
              {WINDOWS_DEMO_URL ? (
                <a
                  href={WINDOWS_DEMO_URL}
                  target="_blank"
                  rel="noreferrer noopener"
                  className={`inline-flex w-full items-center justify-center rounded-lg border px-4 py-2.5 text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500 focus-visible:ring-offset-2 ${
                    isLight
                      ? "border-slate-300 bg-transparent text-slate-900 hover:bg-slate-50"
                      : "border-white/15 bg-transparent text-slate-100 hover:bg-white/[0.06]"
                  }`}
                >
                  {t.install.demoBtn}
                </a>
              ) : (
                <Button
                  variant="outline"
                  className="w-full justify-center text-xs font-medium opacity-50 cursor-not-allowed"
                  disabled
                >
                  {t.install.comingSoon}
                </Button>
              )}
            </div>
          </div>
        </div>
      </section>

      <section
        className={`${portalCardShell(isLight)} space-y-5 text-xs`}
      >
        <div className="flex gap-3">
          <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-orange-500 text-sm font-bold text-white">
            2
          </span>
          <div className="min-w-0 flex-1 space-y-3">
            <h2
              className={`text-sm font-semibold ${
                isLight ? "text-slate-900" : "text-slate-100"
              }`}
            >
              {t.install.step2Title}
            </h2>
            <p
              className={isLight ? "text-slate-700" : "text-slate-300"}
            >
              {t.install.step2Body}
            </p>

            <div
              className={`rounded-xl border border-l-4 border-orange-500/45 p-4 space-y-2 ${
                isLight
                  ? "border-gray-200 bg-slate-50/80"
                  : "border-white/10 bg-white/[0.04]"
              }`}
            >
          <div
            className={`text-[11px] uppercase ${
              isLight ? "text-slate-500" : "text-slate-500"
            }`}
          >
            {t.install.currentLicenseLabel}
          </div>
          {loading ? (
            <div className="space-y-2">
              <div
                className={`h-3 w-40 rounded animate-pulse ${
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
              className={isLight ? "text-slate-600" : "text-slate-400"}
            >
              {t.install.noLicenseBody}
            </p>
          ) : (
            <>
              <div
                className={`font-mono text-lg font-semibold tracking-tight break-all ${
                  isLight ? "text-slate-900" : "text-slate-100"
                }`}
              >
                {activeLicense.key}
              </div>
              <div className={`flex flex-wrap items-center gap-2 ${isLight ? "text-slate-700" : "text-slate-300"}`}>
                {t.labels.plan}:{" "}
                <span className="font-medium capitalize">
                  {activeLicense.plan}
                </span>
                <span className="opacity-60">•</span>
                <span>{t.labels.status}:</span>
                <span className={portalLicenseStatusBadge(activeLicense.status, isLight)}>
                  {activeLicense.status}
                </span>
              </div>
              <div
                className={isLight ? "text-slate-600" : "text-slate-400"}
              >
                {t.labels.validUntil}:{" "}
                {activeLicense.validUntil
                  ? formatDate(activeLicense.validUntil)
                  : t.labels.dash}
              </div>
            </>
          )}
          <p
            className={`pt-2 ${
              isLight ? "text-slate-600" : "text-slate-400"
            }`}
          >
            {t.install.licensesLinkHint}
          </p>
        </div>

        <ol
          className={`list-decimal list-inside space-y-1 ${
            isLight ? "text-slate-700" : "text-slate-300"
          }`}
        >
          <li>{t.install.stepOL1}</li>
          <li>{t.install.stepOL2}</li>
          <li>
            {t.install.stepOL3Prefix}{" "}
            <span className="font-semibold">{t.install.stepOL3Mid}</span>{" "}
            {t.install.stepOL3Suffix}
          </li>
        </ol>
          </div>
        </div>
      </section>

      <section className={`${portalCardShell(isLight)} space-y-4 text-xs`}>
        <div className="flex gap-3">
          <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-orange-500 text-sm font-bold text-white">
            3
          </span>
          <div className="min-w-0 flex-1 space-y-3">
        <h2
          className={`text-sm font-semibold ${
            isLight ? "text-slate-900" : "text-slate-100"
          }`}
        >
          {t.install.step3Title}
        </h2>
        <ul
          className={`list-disc list-inside space-y-1 ${
            isLight ? "text-slate-700" : "text-slate-300"
          }`}
        >
          <li>{t.install.step3B1}</li>
          <li>
            {t.install.step3Li2Before}{" "}
            <Link to="/portal/devices" className={`font-semibold underline-offset-2 ${isLight ? "text-orange-700 hover:text-orange-800" : "text-orange-300 hover:text-orange-200"}`}>
              {t.layout.navDevices}
            </Link>
            {t.install.step3Li2After}
          </li>
          <li>
            {t.install.step3B3Prefix}{" "}
            <Link to="/portal/invoices" className={`font-semibold underline-offset-2 ${isLight ? "text-orange-700 hover:text-orange-800" : "text-orange-300 hover:text-orange-200"}`}>
              {t.layout.navInvoices}
            </Link>
            {t.install.step3B3Suffix}
          </li>
        </ul>
        <p
          className={`text-[11px] ${
            isLight ? "text-slate-500" : "text-slate-500"
          }`}
        >
          {t.install.footerNote}
        </p>
          </div>
        </div>
      </section>
    </div>
  );
};

export default PortalInstallPage;
