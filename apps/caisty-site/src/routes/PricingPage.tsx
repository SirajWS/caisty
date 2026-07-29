import { useState } from "react";
import { Link } from "react-router-dom";
import {
  MAX_DEVICES,
  resolvePlanPrice,
  isYearlyPlanAvailable,
  type Currency,
  type PaidPlanKey,
} from "../config/pricing";
import { useCurrency } from "../lib/useCurrency";
import { useLanguage } from "../lib/LanguageContext";
import { translations } from "../lib/translations/index";
import { useTheme } from "../lib/theme";

type BillingPeriod = "monthly" | "yearly";

export default function PricingPage() {
  const [billing, setBilling] = useState<BillingPeriod>("monthly");
  const { currency } = useCurrency();
  const { language } = useLanguage();
  const { theme } = useTheme();
  const isLight = theme === "light";
  const t = translations[language].pricing;
  const isTnd = currency === "TND";

  const pageBg = isLight ? "bg-white text-slate-900" : "bg-[#0B1220] text-slate-50";

  function planDevicesLabel(plan: PaidPlanKey): string {
    const max = MAX_DEVICES[plan];
    if (max === null) return t.plans.business.devicesUnlimited;
    const unit =
      plan === "starter"
        ? t.plans.starter.devicesLabel
        : plan === "pro"
          ? t.plans.pro.devicesLabel
          : t.plans.business.devicesLabel;
    return `${max} ${unit}`;
  }

  return (
    <div className={`min-h-screen ${pageBg}`}>
      <section className="max-w-5xl mx-auto px-4 pt-20 pb-16 space-y-8">
        <header className="text-center space-y-3">
          <h1
            className={`text-3xl sm:text-4xl font-semibold tracking-tight ${
              isLight ? "text-[#0B1220]" : "text-slate-50"
            }`}
          >
            {t.title}
          </h1>
          <p
            className={`text-sm max-w-2xl mx-auto leading-relaxed ${
              isLight ? "text-slate-600" : "text-slate-300"
            }`}
          >
            {t.description}
          </p>
        </header>

        <section className="max-w-3xl mx-auto">
          <div
            className={`rounded-2xl border px-4 py-3 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs sm:text-sm ${
              isLight
                ? "border-orange-200/80 bg-orange-50/90"
                : "border-orange-500/35 bg-orange-500/10"
            }`}
          >
            <div className="space-y-1">
              <div
                className={`inline-flex items-center gap-2 ${
                  isLight ? "text-orange-600" : "text-orange-300"
                }`}
              >
                <span className="h-1.5 w-1.5 rounded-full bg-orange-500" />
                <span className="font-semibold uppercase tracking-wide text-[11px]">
                  {t.trial.badge}
                </span>
              </div>
              <p className={isLight ? "text-slate-800" : "text-slate-100"}>
                {t.trial.title}{" "}
                <span className="font-semibold">{t.trial.daysLabel}</span>
                {t.trial.description}
              </p>
            </div>
            <Link
              to="/register"
              className="inline-flex items-center justify-center rounded-full bg-orange-500 px-5 py-2 text-xs sm:text-sm font-semibold text-white shadow-sm hover:bg-orange-600 transition-colors whitespace-nowrap"
            >
              {t.trial.cta}
            </Link>
          </div>
        </section>

        <section className="flex justify-center">
          <div
            className={`inline-flex items-center rounded-full border p-1 text-[11px] sm:text-xs ${
              isLight ? "border-slate-200 bg-slate-50" : "border-slate-700 bg-slate-900/80"
            }`}
          >
            <button
              type="button"
              onClick={() => setBilling("monthly")}
              className={[
                "px-3 py-1.5 rounded-full transition",
                billing === "monthly"
                  ? isLight
                    ? "bg-white text-slate-900 shadow-sm ring-1 ring-slate-200/80"
                    : "bg-slate-800 text-slate-50"
                  : isLight
                    ? "text-slate-500"
                    : "text-slate-400",
              ].join(" ")}
            >
              {t.billing.monthly}
            </button>
            <button
              type="button"
              onClick={() => setBilling("yearly")}
              className={[
                "px-3 py-1.5 rounded-full transition flex items-center gap-1",
                billing === "yearly"
                  ? isLight
                    ? "bg-white text-slate-900 shadow-sm ring-1 ring-slate-200/80"
                    : "bg-slate-800 text-slate-50"
                  : isLight
                    ? "text-slate-600"
                    : "text-slate-400",
              ].join(" ")}
            >
              {t.billing.yearly}
              <span
                className={`hidden sm:inline text-[10px] ${
                  isLight ? "text-orange-600" : "text-orange-300"
                }`}
              >
                {t.billing.discount}
              </span>
            </button>
          </div>
        </section>

        <div className="grid gap-6 md:grid-cols-3">
          <PlanCard
            title={t.plans.starter.title}
            badge={t.plans.starter.badge}
            billing={billing}
            plan="starter"
            displayCurrency={currency}
            description={t.plans.starter.description}
            devicesLabel={planDevicesLabel("starter")}
            features={t.plans.starter.features}
            planNote={t.planNote}
            highlight
          />

          <PlanCard
            title={t.plans.pro.title}
            badge={t.plans.pro.badge}
            billing={billing}
            plan="pro"
            displayCurrency={currency}
            description={t.plans.pro.description}
            devicesLabel={planDevicesLabel("pro")}
            features={t.plans.pro.features}
            planNote={t.planNote}
          />

          <PlanCard
            title={t.plans.business.title}
            badge={t.plans.business.badge}
            billing={billing}
            plan="business"
            displayCurrency={currency}
            description={t.plans.business.description}
            devicesLabel={planDevicesLabel("business")}
            features={t.plans.business.features}
            planNote={t.planNote}
          />
        </div>

        <div className="space-y-2 text-xs sm:text-sm">
          {isTnd && (
            <p className={isLight ? "text-amber-700" : "text-amber-300/90"}>
              {t.tndBillingNote}
            </p>
          )}
          <p className={isLight ? "text-slate-600" : "text-slate-400"}>{t.amountsNote}</p>
        </div>

        <section className="mt-6 space-y-4">
          <div className="grid gap-4 md:grid-cols-3 text-sm">
            <InfoCard title={t.info.contract.title} text={t.info.contract.text} />
            <InfoCard title={t.info.hardware.title} text={t.info.hardware.text} />
            <InfoCard title={t.info.nextSteps.title} text={t.info.nextSteps.text} />
          </div>

          <div
            className={`mt-4 flex flex-col sm:flex-row items-center justify-between gap-3 rounded-2xl border px-4 py-4 ${
              isLight ? "border-slate-200 bg-slate-50/80" : "border-slate-700/80 bg-slate-900/50"
            }`}
          >
            <div
              className={`text-xs sm:text-sm max-w-xl leading-relaxed ${
                isLight ? "text-slate-600" : "text-slate-300"
              }`}
            >
              <span className={`font-semibold ${isLight ? "text-[#0B1220]" : "text-slate-100"}`}>
                {t.cta.title}
              </span>{" "}
              {t.cta.description}
            </div>

            <div className="flex flex-wrap gap-3">
              <Link
                to="/register"
                className="inline-flex items-center justify-center rounded-full bg-orange-500 px-5 py-2 text-xs sm:text-sm font-semibold text-white shadow-sm hover:bg-orange-600 transition-colors"
              >
                {t.cta.button}
              </Link>
            </div>
          </div>

          <p className={`text-[11px] leading-relaxed ${isLight ? "text-slate-500" : "text-slate-500"}`}>
            {t.footer}
          </p>
        </section>
      </section>
    </div>
  );
}

interface PlanCardProps {
  title: string;
  badge?: string | null;
  billing: BillingPeriod;
  plan: PaidPlanKey;
  displayCurrency: Currency;
  description: string;
  devicesLabel: string;
  features: string[];
  planNote: string;
  highlight?: boolean;
}

function PlanCard({
  title,
  badge,
  billing,
  plan,
  displayCurrency,
  description,
  devicesLabel,
  features,
  planNote,
  highlight,
}: PlanCardProps) {
  const { language } = useLanguage();
  const { theme } = useTheme();
  const isLight = theme === "light";
  const tp = translations[language].pricing;
  const yearlyAvailable = isYearlyPlanAvailable(plan, displayCurrency);
  const showYearlyUnavailable = billing === "yearly" && !yearlyAvailable;

  const resolved = showYearlyUnavailable
    ? resolvePlanPrice(plan, "monthly", displayCurrency)
    : resolvePlanPrice(plan, billing, displayCurrency);

  const amount = resolved?.amount;
  const priceCurrency = resolved?.currency ?? displayCurrency;
  const currencySymbol = priceCurrency === "EUR" ? "€" : "TND";
  const suffix =
    showYearlyUnavailable || billing === "monthly"
      ? tp.priceMonthlySuffix
      : tp.priceYearlySuffix;

  return (
    <div
      className={[
        "rounded-3xl border p-6 flex flex-col justify-between",
        highlight
          ? isLight
            ? "border-orange-400/70 shadow-lg shadow-orange-500/10 bg-white ring-1 ring-orange-500/15"
            : "border-orange-500/50 shadow-lg shadow-orange-950/30 bg-slate-900/60"
          : isLight
            ? "border-slate-200 bg-slate-50/50"
            : "border-slate-700/80 bg-slate-900/40",
      ].join(" ")}
    >
      <div className="space-y-4">
        <div className="flex items-center justify-between gap-2">
          <div>
            <h2 className={`text-lg font-semibold ${isLight ? "text-[#0B1220]" : "text-slate-50"}`}>
              {title}
            </h2>
            <p className={`text-xs ${isLight ? "text-slate-600" : "text-slate-400"}`}>{description}</p>
          </div>
          {badge && (
            <span
              className={`inline-flex items-center rounded-full px-3 py-1 text-[11px] uppercase tracking-wide ${
                isLight ? "bg-orange-50 text-orange-800 border border-orange-200/80" : "bg-orange-500/15 text-orange-200 border border-orange-500/30"
              }`}
            >
              {badge}
            </span>
          )}
        </div>

        <div className="space-y-1">
          {typeof amount === "number" ? (
            <div className={`text-3xl font-semibold ${isLight ? "text-orange-600" : "text-orange-400"}`}>
              {amount} {currencySymbol}
              <span className={`text-base font-medium align-baseline ${isLight ? "text-slate-600" : "text-slate-300"}`}>
                {suffix}
              </span>
            </div>
          ) : (
            <div className={`text-3xl font-semibold ${isLight ? "text-slate-500" : "text-slate-400"}`}>
              {tp.yearlyNotAvailableShort}
            </div>
          )}
          {showYearlyUnavailable ? (
            <div className={`text-[11px] font-medium ${isLight ? "text-amber-700" : "text-amber-300/90"}`}>
              {tp.yearlyNotAvailable}
            </div>
          ) : null}
          <div className={`text-[11px] ${isLight ? "text-slate-600" : "text-slate-400"}`}>{devicesLabel}</div>
        </div>

        <ul className={`mt-4 space-y-2 text-sm ${isLight ? "text-slate-800" : "text-slate-200"}`}>
          {features.map((f) => (
            <li key={f} className="flex items-start gap-2">
              <span className="mt-[3px] h-1.5 w-1.5 shrink-0 rounded-full bg-orange-500" />
              <span>{f}</span>
            </li>
          ))}
        </ul>
      </div>
      <p className={`mt-4 text-[11px] leading-relaxed ${isLight ? "text-slate-500" : "text-slate-500"}`}>
        {planNote}
      </p>
    </div>
  );
}

function InfoCard({ title, text }: { title: string; text: string }) {
  const { theme } = useTheme();
  const isLight = theme === "light";
  return (
    <div
      className={`rounded-2xl border p-4 space-y-2 ${
        isLight ? "border-slate-200 bg-slate-50/60" : "border-slate-700/80 bg-slate-900/40"
      }`}
    >
      <div className={`text-sm font-medium ${isLight ? "text-[#0B1220]" : "text-slate-100"}`}>{title}</div>
      <p className={`text-xs leading-relaxed ${isLight ? "text-slate-600" : "text-slate-300"}`}>{text}</p>
    </div>
  );
}
