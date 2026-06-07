// apps/caisty-site/src/routes/PortalPlanBillingPage.tsx
import React from "react";
import { Link } from "react-router-dom";
import {
  createTrialLicense,
  fetchPortalLicenses,
  type PortalLicense,
} from "../lib/portalApi";
import { usePortalOutlet } from "./PortalLayout";
import { PRICING, TRIAL_DAYS, formatPrice } from "../config/pricing";
import { useTheme } from "../lib/theme";
import { useLanguage } from "../lib/LanguageContext";
import { getPortalTranslations } from "../lib/translations";
import { portalLocaleTag } from "../lib/portalLocale";
import { pickPrimaryPortalLicense } from "../lib/portalLicensePick";
import {
  portalCardShell,
  portalLicenseStatusBadge,
  portalPrimaryCta,
  portalSecondaryCta,
  portalTextLink,
} from "../lib/portalUi";

const PortalPlanBillingPage: React.FC = () => {
  const { customer } = usePortalOutlet();
  const { language } = useLanguage();
  const t = getPortalTranslations(language);
  const locale = portalLocaleTag(language);
  const { theme } = useTheme();
  const isLight = theme === "light";

  const [licenses, setLicenses] = React.useState<PortalLicense[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [busyTrial, setBusyTrial] = React.useState(false);
  const [busyPlan, setBusyPlan] = React.useState<"starter" | "pro" | null>(
    null,
  );
  const [error, setError] = React.useState<string | null>(null);

  const starterPrice = PRICING["EUR"].starter.monthly;
  const proPrice = PRICING["EUR"].pro.monthly;
  const currencySymbol = "€";

  function formatDate(value: string | null | undefined): string {
    if (!value) return t.labels.dash;
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return t.labels.dash;
    return d.toLocaleString(locale);
  }

  React.useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setLoading(true);
        setError(null);
        const lics = await fetchPortalLicenses();
        if (!cancelled) setLicenses(lics);
      } catch (err: unknown) {
        console.error("load licenses failed", err);
        if (!cancelled) {
          const msg = err instanceof Error ? err.message : null;
          setError(msg || getPortalTranslations(language).plan.loadError);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [language]);

  const primaryLicense: PortalLicense | null = React.useMemo(
    () => pickPrimaryPortalLicense(licenses),
    [licenses],
  );

  const hasTrialLicense = React.useMemo(
    () => licenses.some((l) => l.plan === "trial"),
    [licenses],
  );

  async function handleCreateTrial() {
    try {
      setError(null);
      setBusyTrial(true);
      const lic = await createTrialLicense();
      setLicenses((prev) => [lic, ...prev]);
    } catch (err: unknown) {
      console.error("create trial failed", err);
      setError(
        err instanceof Error ? err.message : t.plan.trialCreateError,
      );
    } finally {
      setBusyTrial(false);
    }
  }

  async function handleUpgradePlan(plan: "starter" | "pro") {
    try {
      setError(null);
      setBusyPlan(plan);
      window.location.href = `/portal/checkout?plan=${plan}`;
    } catch (err: unknown) {
      console.error("upgrade failed", err);
      setError(
        err instanceof Error ? err.message : t.plan.upgradeError,
      );
    } finally {
      setBusyPlan(null);
    }
  }

  const trialDaysLabel = t.plan.trialPriceSuffix.replace(
    "{{days}}",
    String(TRIAL_DAYS),
  );

  return (
    <div className="space-y-6">
      <header className="space-y-1">
        <h1 className={`text-3xl sm:text-4xl font-semibold tracking-tight ${isLight ? "text-[#0B1220]" : "text-white"}`}>
          {t.plan.title}
        </h1>
        <p className={`text-sm ${isLight ? "text-slate-600" : "text-slate-300"}`}>
          {t.plan.subtitle}
        </p>
      </header>

      {error && (
        <div className={`rounded-xl border px-3 py-2 text-xs ${isLight ? "border-red-300 bg-red-50 text-red-800" : "border-red-700 bg-red-900/40 text-red-100"}`}>
          {error}
        </div>
      )}

      <section className={`flex flex-col gap-4 md:flex-row md:items-start md:justify-between ${portalCardShell(isLight)}`}>
        <div className="space-y-2">
          <div className={`text-xs font-semibold tracking-wide uppercase ${isLight ? "text-orange-600" : "text-orange-400"}`}>
            {t.plan.currentPlanLabel}
          </div>

          {loading ? (
            <div className="space-y-2">
              <div className={`h-4 w-40 rounded animate-pulse ${isLight ? "bg-slate-200" : "bg-slate-800"}`} />
              <div className={`h-3 w-24 rounded animate-pulse ${isLight ? "bg-slate-200" : "bg-slate-800"}`} />
            </div>
          ) : !primaryLicense ? (
            <div className={`text-xs ${isLight ? "text-slate-700" : "text-slate-200"}`}>
              {t.plan.noActiveBody}
            </div>
          ) : (
            <>
              <div className={`flex flex-wrap items-center gap-2 text-sm font-semibold ${isLight ? "text-slate-900" : "text-slate-50"}`}>
                {primaryLicense.plan === "trial"
                  ? t.plan.trialTitle
                  : primaryLicense.plan === "starter"
                    ? "Starter"
                    : "Pro"}
                <span
                  className={portalLicenseStatusBadge(
                    primaryLicense.status,
                    isLight,
                  )}
                >
                  {primaryLicense.status}
                </span>
              </div>
              <div className={`text-xs ${isLight ? "text-slate-600" : "text-slate-300"}`}>
                {t.plan.licenseKeyLabel}{" "}
                <span className="font-mono text-[11px]">
                  {primaryLicense.key}
                </span>
              </div>
              <div className={`text-xs ${isLight ? "text-slate-500" : "text-slate-400"}`}>
                {t.labels.validUntil}: {formatDate(primaryLicense.validUntil)}
              </div>
            </>
          )}
        </div>

        <div className={`mt-2 space-y-1 text-xs text-right md:mt-0 ${isLight ? "text-slate-600" : "text-slate-400"}`}>
          <div>{t.plan.accountHolder} {customer.name}</div>
          {primaryLicense && (
            <div>
              {t.plan.licenseKeyLabel}{" "}
              <span className="font-mono text-[11px]">
                {primaryLicense.key}
              </span>
            </div>
          )}
          <div className={`text-[11px] ${isLight ? "text-slate-500" : "text-slate-500"}`}>
            {t.plan.paymentNote}
          </div>
        </div>
      </section>

      <section className="space-y-4">
        <h2 className={`text-sm font-semibold ${isLight ? "text-slate-900" : "text-slate-100"}`}>
          {t.plan.sectionTitle}
        </h2>

        <div className="grid gap-5 md:grid-cols-3">
          <div className={`flex flex-col justify-between ${portalCardShell(isLight)}`}>
            <div className="space-y-2">
              <div className={`text-sm font-semibold ${isLight ? "text-slate-900" : "text-slate-50"}`}>
                {t.plan.trialTitle}
              </div>
              <p className={`text-xs ${isLight ? "text-slate-600" : "text-slate-400"}`}>
                {t.plan.trialDesc}
              </p>
              <div className={`mt-2 text-2xl font-semibold ${isLight ? "text-orange-600" : "text-orange-400"}`}>
                0&nbsp;{currencySymbol}
                <span className={`text-xs font-normal ${isLight ? "text-slate-500" : "text-slate-400"}`}>
                  &nbsp;{trialDaysLabel}
                </span>
              </div>
              <div className={`mt-1 text-xs ${isLight ? "text-slate-500" : "text-slate-400"}`}>
                {t.plan.trialDeviceNote}
              </div>
            </div>

            <div className="mt-4">
              <button
                type="button"
                onClick={handleCreateTrial}
                disabled={busyTrial || hasTrialLicense}
                className={`w-full ${hasTrialLicense || busyTrial ? portalSecondaryCta(isLight) : portalPrimaryCta()}`}
              >
                {hasTrialLicense
                  ? t.plan.trialBtnUsed
                  : busyTrial
                    ? t.plan.trialBtnBusy
                    : t.plan.trialBtn}
              </button>
              <p className={`mt-2 text-[11px] ${isLight ? "text-slate-500" : "text-slate-500"}`}>
                {t.plan.trialHint}
              </p>
            </div>
          </div>

          <div
            className={`flex flex-col justify-between ring-2 ring-orange-500/50 ${portalCardShell(isLight)}`}
          >
            <div className="space-y-2">
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <div className={`text-sm font-semibold ${isLight ? "text-slate-900" : "text-slate-50"}`}>
                  Starter
                </div>
                <span
                  className={`inline-flex rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${
                    isLight ? "bg-orange-50 border-orange-200 text-orange-700" : "bg-orange-500/15 border-orange-500/40 text-orange-300"
                  }`}
                >
                  {t.labels.recommended}
                </span>
              </div>
              <p className={`text-xs ${isLight ? "text-slate-600" : "text-slate-400"}`}>
                {t.plan.starterDesc}
              </p>
              <div className={`mt-2 text-2xl font-semibold ${isLight ? "text-orange-600" : "text-orange-400"}`}>
                {formatPrice(starterPrice, "EUR")}
                <span className={`text-xs font-normal ${isLight ? "text-slate-500" : "text-slate-400"}`}>
                  &nbsp;{t.labels.perMonth}
                </span>
              </div>
            </div>

            <div className="mt-4">
              <button
                type="button"
                onClick={() => handleUpgradePlan("starter")}
                disabled={busyPlan === "starter"}
                className={`w-full ${portalPrimaryCta()}`}
              >
                {busyPlan === "starter"
                  ? t.plan.starterBtnBusy
                  : t.plan.starterBtn}
              </button>
              <p className={`mt-2 text-[11px] ${isLight ? "text-slate-500" : "text-slate-500"}`}>
                {t.plan.purchaseHint}
              </p>
            </div>
          </div>

          <div className={`flex flex-col justify-between ${portalCardShell(isLight)}`}>
            <div className="space-y-2">
              <div className={`text-sm font-semibold ${isLight ? "text-slate-900" : "text-slate-50"}`}>
                Pro
              </div>
              <p className={`text-xs ${isLight ? "text-slate-600" : "text-slate-400"}`}>
                {t.plan.proDesc}
              </p>
              <div className={`mt-2 text-2xl font-semibold ${isLight ? "text-orange-600" : "text-orange-400"}`}>
                {formatPrice(proPrice, "EUR")}
                <span className={`text-xs font-normal ${isLight ? "text-slate-500" : "text-slate-400"}`}>
                  &nbsp;{t.labels.perMonth}
                </span>
              </div>
            </div>

            <div className="mt-4">
              <button
                type="button"
                onClick={() => handleUpgradePlan("pro")}
                disabled={busyPlan === "pro"}
                className={`w-full ${portalPrimaryCta()}`}
              >
                {busyPlan === "pro"
                  ? t.plan.starterBtnBusy
                  : t.plan.starterBtn}
              </button>
              <p className={`mt-2 text-[11px] ${isLight ? "text-slate-500" : "text-slate-500"}`}>
                {t.plan.purchaseHint}
              </p>
            </div>
          </div>
        </div>

        <p className={`text-[11px] ${isLight ? "text-slate-500" : "text-slate-500"}`}>
          {t.plan.vatFootnote}
        </p>
      </section>

      <section className={`${portalCardShell(isLight)} text-xs ${isLight ? "text-slate-700" : "text-slate-300"}`}>
        {t.plan.invoicesLineStart}{" "}
        <Link to="/portal/invoices" className={`hover:underline ${portalTextLink(isLight)}`}>
          {t.layout.navInvoices}
        </Link>
        {t.plan.invoicesLineEnd}
      </section>
    </div>
  );
};

export default PortalPlanBillingPage;
