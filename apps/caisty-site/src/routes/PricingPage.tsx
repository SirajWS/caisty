import { useState } from "react";
import { Link } from "react-router-dom";
import { PRICING, TRIAL_DAYS, MAX_DEVICES } from "../config/pricing";
import { useCurrency } from "../lib/useCurrency";
import { useLanguage } from "../lib/LanguageContext";
import { translations } from "../lib/translations/index";

type BillingPeriod = "monthly" | "yearly";

export default function PricingPage() {
  const [billing, setBilling] = useState<BillingPeriod>("monthly");
  const { currency } = useCurrency();
  const { language } = useLanguage();
  const t = translations[language].pricing;

  const starterMonthly = PRICING[currency].starter.monthly;
  const starterYearly = PRICING[currency].starter.yearly;
  const starterDevices = MAX_DEVICES.starter;

  const proMonthly = PRICING[currency].pro.monthly;
  const proYearly = PRICING[currency].pro.yearly;
  const proDevices = MAX_DEVICES.pro;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-50">
      <section className="max-w-5xl mx-auto px-4 pt-20 pb-16 space-y-8">
        <header className="text-center space-y-3">
          <h1 className="text-3xl sm:text-4xl font-semibold">
            {t.title}
          </h1>
          <p className="text-sm text-slate-300 max-w-2xl mx-auto">
            {t.description}
          </p>
        </header>

        {/* Trial-Hinweis */}
        <section className="max-w-3xl mx-auto">
          <div className="rounded-2xl border border-emerald-500/40 bg-emerald-500/10 px-4 py-3 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs sm:text-sm">
            <div className="space-y-1">
              <div className="inline-flex items-center gap-2 text-emerald-200">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                <span className="font-semibold uppercase tracking-wide text-[11px]">
                  {t.trial.badge}
                </span>
              </div>
              <p className="text-slate-100">
                {t.trial.title}{" "}
                <span className="font-semibold">
                  {TRIAL_DAYS}-{language === "de" ? "Tage-Testlizenz" : language === "en" ? "day trial license" : language === "fr" ? "licence d'essai" : "ترخيص تجريبي"}
                </span>
                {t.trial.description}
              </p>
            </div>
            <Link
              to="/register"
              className="inline-flex items-center justify-center rounded-full bg-emerald-500 px-5 py-2 text-xs sm:text-sm font-medium text-slate-950 hover:bg-emerald-400 transition-colors whitespace-nowrap"
            >
              {t.trial.cta}
            </Link>
          </div>
        </section>

        {/* Billing Toggle */}
        <section className="flex justify-center">
          <div className="inline-flex items-center rounded-full border border-slate-800 bg-slate-900/80 p-1 text-[11px] sm:text-xs">
            <button
              type="button"
              onClick={() => setBilling("monthly")}
              className={[
                "px-3 py-1.5 rounded-full transition",
                billing === "monthly"
                  ? "bg-slate-800 text-slate-50"
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
                  ? "bg-slate-800 text-slate-50"
                  : "text-slate-400",
              ].join(" ")}
            >
              {t.billing.yearly}
              <span className="hidden sm:inline text-[10px] text-emerald-300">
                {t.billing.discount}
              </span>
            </button>
          </div>
        </section>

        <div className="grid gap-6 md:grid-cols-2">
          {/* Starter */}
          <PlanCard
            title={t.plans.starter.title}
            badge={t.plans.starter.badge}
            billing={billing}
            priceMonthly={starterMonthly}
            priceYearly={starterYearly}
            description={t.plans.starter.description}
            devicesLabel={`${starterDevices} ${t.plans.starter.devicesLabel}`}
            features={t.plans.starter.features}
            planNote={t.planNote}
            highlight
          />

          {/* Pro */}
          <PlanCard
            title={t.plans.pro.title}
            badge={t.plans.pro.badge}
            billing={billing}
            priceMonthly={proMonthly}
            priceYearly={proYearly}
            description={t.plans.pro.description}
            devicesLabel={`${proDevices} ${t.plans.pro.devicesLabel}`}
            features={t.plans.pro.features}
            planNote={t.planNote}
          />
        </div>

        {/* Hinweis & Call-to-Action */}
        <section className="mt-6 space-y-4">
          <div className="grid gap-4 md:grid-cols-3 text-sm">
            <InfoCard
              title={t.info.contract.title}
              text={t.info.contract.text}
            />
            <InfoCard
              title={t.info.hardware.title}
              text={t.info.hardware.text}
            />
            <InfoCard
              title={t.info.nextSteps.title}
              text={t.info.nextSteps.text}
            />
          </div>

          <div className="mt-4 flex flex-col sm:flex-row items-center justify-between gap-3 rounded-2xl border border-slate-800 bg-slate-900/70 px-4 py-4">
            <div className="text-xs sm:text-sm text-slate-300 max-w-xl">
              <span className="font-semibold text-slate-100">
                {t.cta.title}
              </span>{" "}
              {t.cta.description}
            </div>

            <div className="flex flex-wrap gap-3">
              <Link
                to="/register"
                className="inline-flex items-center justify-center rounded-full bg-emerald-500 px-5 py-2 text-xs sm:text-sm font-medium text-slate-950 hover:bg-emerald-400 transition-colors"
              >
                {t.cta.button}
              </Link>
            </div>
          </div>

          <p className="text-[11px] text-slate-500">
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
  priceMonthly: number;
  priceYearly: number;
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
  priceMonthly,
  priceYearly,
  description,
  devicesLabel,
  features,
  planNote,
  highlight,
}: PlanCardProps) {
  const { currency } = useCurrency();
  const isMonthly = billing === "monthly";
  const price = isMonthly ? priceMonthly : priceYearly;
  const currencySymbol = currency === "EUR" ? "€" : "TND";
  const suffix = isMonthly ? `${currencySymbol}/Monat` : `${currencySymbol}/Jahr`;

  return (
    <div
      className={[
        "rounded-3xl border bg-slate-900/70 p-6 flex flex-col justify-between",
        highlight
          ? "border-emerald-500/60 shadow-lg shadow-emerald-900/40"
          : "border-slate-800",
      ].join(" ")}
    >
      <div className="space-y-4">
        <div className="flex items-center justify-between gap-2">
          <div>
            <h2 className="text-lg font-semibold">{title}</h2>
            <p className="text-xs text-slate-400">{description}</p>
          </div>
          {badge && (
            <span className="inline-flex items-center rounded-full bg-slate-800 px-3 py-1 text-[11px] uppercase tracking-wide text-slate-300">
              {badge}
            </span>
          )}
        </div>

        <div className="space-y-1">
          <div className="text-3xl font-semibold text-emerald-400">
            {price}{" "}
            <span className="text-base align-baseline text-slate-300">
              {suffix}
            </span>
          </div>
          <div className="text-[11px] text-slate-400">{devicesLabel}</div>
        </div>

        <ul className="mt-4 space-y-2 text-sm text-slate-200">
          {features.map((f) => (
            <li key={f} className="flex items-start gap-2">
              <span className="mt-[3px] h-1.5 w-1.5 rounded-full bg-emerald-400" />
              <span>{f}</span>
            </li>
          ))}
        </ul>
      </div>
    <p className="mt-4 text-[11px] text-slate-500">
        {planNote}
      </p>
    </div>
  );
}

function InfoCard({ title, text }: { title: string; text: string }) {
  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4 space-y-2">
      <div className="text-sm font-medium text-slate-100">{title}</div>
      <p className="text-xs text-slate-300">{text}</p>
    </div>
  );
}

