import { Link } from "react-router-dom";
import { PRICING, TRIAL_DAYS, MAX_DEVICES, formatPrice } from "../config/pricing";
import { useCurrency } from "../lib/useCurrency";
import { useLanguage } from "../lib/LanguageContext";
import { translations } from "../lib/translations/index";
import { useTheme } from "../lib/theme";

export default function LandingPage() {
  const { currency } = useCurrency();
  const { language } = useLanguage();
  const { theme } = useTheme();
  const isLight = theme === "light";
  const t = translations[language].landing;
  
  const starter = PRICING[currency].starter;
  const pro = PRICING[currency].pro;
  const currencySymbol = currency === "EUR" ? "€" : "TND";
  const isTnd = currency === "TND";
  const pageBg = isLight ? "bg-slate-50 text-slate-900" : "bg-slate-950 text-slate-50";

  return (
    <div className={`min-h-screen ${pageBg}`}>
      {/* Hero */}
      <section className="max-w-5xl mx-auto px-4 pt-20 pb-16">
        <div
          className={`inline-flex items-center rounded-full border px-3 py-1 text-[11px] font-medium mb-6 ${
            isLight
              ? "border-emerald-300 bg-emerald-50 text-emerald-600"
              : "border-emerald-500/30 bg-emerald-500/10 text-emerald-300"
          }`}
        >
          {t.hero.badge}
        </div>

        <div className="grid gap-10 md:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)] items-center">
          {/* Text-Spalte */}
          <div className="space-y-6">
            <h1
              className={`text-3xl sm:text-4xl md:text-5xl font-semibold leading-tight ${
                isLight ? "text-slate-900" : "text-slate-50"
              }`}
            >
              {t.hero.title}{" "}
              <span className="text-emerald-500">{t.hero.titleHighlight}</span>
            </h1>
            <p
              className={`text-sm sm:text-base max-w-xl ${
                isLight ? "text-slate-600" : "text-slate-300"
              }`}
            >
              {t.hero.description}
            </p>

            <div className="flex flex-wrap gap-3 text-sm">
              <Link
                to="/pricing"
                className="inline-flex items-center justify-center rounded-full bg-emerald-500 px-5 py-2 text-sm font-medium text-slate-950 hover:bg-emerald-400 transition-colors"
              >
                {t.hero.ctaPricing}
              </Link>
              <Link
                to="/register"
                className={`inline-flex items-center justify-center rounded-full border px-5 py-2 text-sm font-medium transition-colors ${
                  isLight
                    ? "border-slate-300 text-slate-700 hover:bg-slate-50"
                    : "border-slate-700 text-slate-100 hover:bg-slate-800"
                }`}
              >
                {t.hero.ctaStart}
              </Link>
            </div>

            <p
              className={`text-[11px] max-w-md ${
                isLight ? "text-slate-600" : "text-slate-500"
              }`}
            >
              {t.hero.trialNote}{" "}
              <span
                className={`font-semibold ${
                  isLight ? "text-slate-700" : "text-slate-300"
                }`}
              >
                {TRIAL_DAYS}-{t.hero.trialDays}
              </span>{" "}
              {t.hero.trialNote2}
            </p>
            {isTnd && (
              <p className="text-[11px] text-amber-500">
                Hinweis: Die Abrechnung erfolgt aktuell in Euro per PayPal. TND-Preise sind nur zur Orientierung.
              </p>
            )}
          </div>

          {/* Dashboard-Mock */}
          <div
            className={`rounded-3xl border p-4 shadow-xl ${
              isLight
                ? "border-slate-200 bg-white shadow-emerald-200/40"
                : "border-slate-800 bg-slate-900/70 shadow-emerald-900/40"
            }`}
          >
            <div className="flex items-center justify-between mb-3">
              <div
                className={`text-[11px] uppercase tracking-wide ${
                  isLight ? "text-slate-500" : "text-slate-400"
                }`}
              >
                Beispiel-Ansicht
              </div>
              <div
                className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-[11px] ${
                  isLight
                    ? "bg-slate-100 text-slate-700"
                    : "bg-slate-800 text-slate-300"
                }`}
              >
                <span className="h-2 w-2 rounded-full bg-emerald-400" />
                Live-Portal
              </div>
            </div>

            <div
              className={`rounded-2xl border p-4 space-y-3 ${
                isLight
                  ? "border-slate-200 bg-slate-50"
                  : "border-slate-800 bg-slate-950/80"
              }`}
            >
              <div
                className={`text-xs font-semibold ${
                  isLight ? "text-slate-900" : "text-slate-200"
                }`}
              >
                Caisty Portal – Dashboard
              </div>
              <div className="grid gap-3 md:grid-cols-2 text-[11px]">
                <div
                  className={`rounded-xl border p-3 space-y-1 ${
                    isLight
                      ? "border-slate-200 bg-white"
                      : "border-slate-800 bg-slate-900/80"
                  }`}
                >
                  <div
                    className={`text-[11px] ${
                      isLight ? "text-slate-600" : "text-slate-400"
                    }`}
                  >
                    Aktive Lizenz
                  </div>
                  <div
                    className={`font-mono text-[11px] ${
                      isLight ? "text-slate-900" : "text-slate-100"
                    }`}
                  >
                    CSTY-XXXX-XXXX-XXXX
                  </div>
                  <div
                    className={`flex items-center justify-between text-[11px] ${
                      isLight ? "text-slate-600" : "text-slate-400"
                    }`}
                  >
                    <span>Starter · 1 Gerät</span>
                    <span>gültig bis 31.12.2025</span>
                  </div>
                </div>
                <div
                  className={`rounded-xl border p-3 space-y-2 ${
                    isLight
                      ? "border-slate-200 bg-white"
                      : "border-slate-800 bg-slate-900/80"
                  }`}
                >
                  <div
                    className={`flex items-center justify-between text-[11px] ${
                      isLight ? "text-slate-600" : "text-slate-400"
                    }`}
                  >
                    <span>Verbundene Geräte</span>
                    <span
                      className={`rounded-full px-2 py-0.5 text-[10px] ${
                        isLight
                          ? "bg-slate-100 text-slate-700"
                          : "bg-slate-800 text-slate-300"
                      }`}
                    >
                      Demo
                    </span>
                  </div>
                  <div className="text-2xl font-semibold text-emerald-500">
                    3
                  </div>
                  <div
                    className={`text-[11px] ${
                      isLight ? "text-slate-600" : "text-slate-400"
                    }`}
                  >
                    2 online · 1 offline
                  </div>
                </div>
              </div>

              <div
                className={`mt-2 rounded-xl border border-dashed p-3 text-[11px] ${
                  isLight
                    ? "border-slate-200 bg-slate-50 text-slate-600"
                    : "border-slate-800 bg-slate-900/60 text-slate-400"
                }`}
              >
                „Wir wollten eine Kasse, die einfach läuft – und ein Portal,
                das wir verstehen.“ – fiktives Bistro
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Warum Caisty? */}
      <section className="max-w-5xl mx-auto px-4 pb-10 space-y-6">
        <div className="space-y-4">
          <h2
            className={`text-xl font-semibold ${
              isLight ? "text-slate-900" : "text-slate-50"
            }`}
          >
            {t.why.title}
          </h2>
          <p
            className={`text-base leading-relaxed max-w-2xl ${
              isLight
                ? "text-slate-700"
                : "text-slate-200"
            }`}
          >
            {t.why.description}
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-3 text-sm">
          <FeatureCard
            title={t.why.feature1Title}
            text={t.why.feature1Text}
          />
          <FeatureCard
            title={t.why.feature2Title}
            text={t.why.feature2Text}
          />
          <FeatureCard
            title={t.why.feature3Title}
            text={t.why.feature3Text}
          />
        </div>
      </section>

      {/* Pläne & Lizenzen */}
      <section className="max-w-5xl mx-auto px-4 pb-12 space-y-5">
        <div className="space-y-4">
          <h2
            className={`text-xl font-semibold ${
              isLight ? "text-slate-900" : "text-slate-50"
            }`}
          >
            {t.plans.title}
          </h2>
          <p
            className={`text-base leading-relaxed max-w-2xl ${
              isLight
                ? "text-slate-700"
                : "text-slate-200"
            }`}
          >
            {t.plans.description}
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-3 text-sm">
          <PlanCard
            name={t.plans.trial.name}
            badge={t.plans.trial.badge}
            price={`0 ${currencySymbol}`}
            note={`${TRIAL_DAYS} ${t.plans.trial.note}`}
            details={[
              t.plans.trial.detail1,
              t.plans.trial.detail2,
              t.plans.trial.detail3,
            ]}
          />
          <PlanCard
            name={t.plans.starter.name}
            badge={t.plans.starter.badge}
            price={`${formatPrice(starter.monthly, currency)}`}
            subPrice={`${t.plans.starter.subPrice.replace("€", formatPrice(starter.yearly, currency))}`}
            note={`${MAX_DEVICES.starter} ${t.plans.starter.note}`}
            highlight
            details={[
              t.plans.starter.detail1,
              t.plans.starter.detail2,
              t.plans.starter.detail3,
            ]}
          />
          <PlanCard
            name={t.plans.pro.name}
            badge={t.plans.pro.badge}
            price={`${formatPrice(pro.monthly, currency)}`}
            subPrice={`${t.plans.pro.subPrice.replace("€", formatPrice(pro.yearly, currency))}`}
            note={`${MAX_DEVICES.pro} ${t.plans.pro.note}`}
            details={[
              t.plans.pro.detail1,
              t.plans.pro.detail2,
              t.plans.pro.detail3,
            ]}
          />
        </div>

        <p className="text-[11px] text-slate-500">
          {t.plans.note}
        </p>
        {isTnd && (
          <p className="text-[11px] text-amber-500">
            Hinweis: Abrechnung erfolgt in Euro per PayPal. TND-Preise sind eine Orientierung.
          </p>
        )}
      </section>

      {/* Zahlungsmethoden */}
      <section className="max-w-5xl mx-auto px-4 pb-12 space-y-5">
        <div className="space-y-4">
          <h2
            className={`text-xl font-semibold ${
              isLight ? "text-slate-900" : "text-slate-50"
            }`}
          >
            {t.payment.title}
          </h2>
          <p
            className={`text-base leading-relaxed max-w-2xl ${
              isLight
                ? "text-slate-700"
                : "text-slate-200"
            }`}
          >
            {t.payment.description}
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2 text-sm">
          <PaymentMethodCard
            title={t.payment.paypal.title}
            description={t.payment.paypal.description}
            icon="PayPal"
          />
          <PaymentMethodCard
            title={t.payment.stripe.title}
            description={t.payment.stripe.description}
            icon="Stripe"
            cards={t.payment.stripe.cards}
          />
        </div>

        <p className={`text-[11px] ${isLight ? "text-slate-600" : "text-slate-400"}`}>
          {t.payment.secure}
        </p>
      </section>

      {/* Für wen ist Caisty? */}
      <section className="max-w-5xl mx-auto px-4 pb-12 space-y-4">
        <h2 className="text-xl font-semibold">{t.forWhom.title}</h2>
        <div className="grid gap-4 md:grid-cols-3 text-sm">
          <FeatureCard
            title={t.forWhom.target1Title}
            text={t.forWhom.target1Text}
          />
          <FeatureCard
            title={t.forWhom.target2Title}
            text={t.forWhom.target2Text}
          />
          <FeatureCard
            title={t.forWhom.target3Title}
            text={t.forWhom.target3Text}
          />
        </div>
      </section>

      {/* Installations-Vorschau */}
      <section className="max-w-5xl mx-auto px-4 pb-16">
        <div
          className={`rounded-3xl border p-5 md:p-7 grid gap-6 md:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)] items-center ${
            isLight
              ? "border-slate-200 bg-white"
              : "border-slate-800 bg-slate-900/70"
          }`}
        >
          {/* Textseite */}
          <div className="space-y-3">
            <h2
              className={`text-lg font-semibold ${
                isLight ? "text-slate-900" : "text-slate-100"
              }`}
            >
              {t.install.title}
            </h2>
            <p
              className={`text-sm ${
                isLight ? "text-slate-600" : "text-slate-300"
              }`}
            >
              {t.install.description}
            </p>

            <ol
              className={`space-y-2 text-sm ${
                isLight ? "text-slate-700" : "text-slate-200"
              }`}
            >
              <li>
                <span
                  className={`inline-flex h-5 w-5 items-center justify-center rounded-full text-[11px] font-semibold mr-2 ${
                    isLight
                      ? "bg-emerald-100 text-emerald-600"
                      : "bg-emerald-500/10 text-emerald-300"
                  }`}
                >
                  1
                </span>
                {t.install.step1}
              </li>
              <li>
                <span
                  className={`inline-flex h-5 w-5 items-center justify-center rounded-full text-[11px] font-semibold mr-2 ${
                    isLight
                      ? "bg-emerald-100 text-emerald-600"
                      : "bg-emerald-500/10 text-emerald-300"
                  }`}
                >
                  2
                </span>
                {t.install.step2}
              </li>
              <li>
                <span
                  className={`inline-flex h-5 w-5 items-center justify-center rounded-full text-[11px] font-semibold mr-2 ${
                    isLight
                      ? "bg-emerald-100 text-emerald-600"
                      : "bg-emerald-500/10 text-emerald-300"
                  }`}
                >
                  3
                </span>
                {t.install.step3}
              </li>
            </ol>

            <p
              className={`text-[11px] ${
                isLight ? "text-slate-600" : "text-slate-500"
              }`}
            >
              {t.install.note}{" "}
              <span
                className={`font-semibold ${
                  isLight ? "text-slate-700" : "text-slate-300"
                }`}
              >
                {t.install.noteHighlight}
              </span>{" "}
              {t.install.noteEnd}
            </p>
          </div>

          {/* „Bild" / Preview-Kachel */}
          <div className="relative">
            <div
              className={`absolute -inset-1 rounded-3xl blur-xl ${
                isLight ? "bg-emerald-100/50" : "bg-emerald-500/10"
              }`}
            />
            <div
              className={`relative rounded-2xl border p-4 shadow-lg space-y-3 ${
                isLight
                  ? "border-slate-200 bg-gradient-to-b from-slate-50 to-white shadow-emerald-200/40"
                  : "border-slate-800 bg-gradient-to-b from-slate-900 to-slate-950 shadow-emerald-900/40"
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <div
                  className={`text-[11px] ${
                    isLight ? "text-slate-600" : "text-slate-400"
                  }`}
                >
                  Kundenportal · Installationsseite
                </div>
                <div className="flex gap-1">
                  <span className="h-2 w-2 rounded-full bg-emerald-400" />
                  <span className="h-2 w-2 rounded-full bg-amber-400" />
                  <span className="h-2 w-2 rounded-full bg-rose-400" />
                </div>
              </div>

              <div
                className={`rounded-xl border p-3 space-y-2 text-[11px] ${
                  isLight
                    ? "border-slate-200 bg-slate-50 text-slate-700"
                    : "border-slate-800 bg-slate-900/80 text-slate-300"
                }`}
              >
                <div className="flex justify-between items-center">
                  <span
                    className={`font-semibold ${
                      isLight ? "text-slate-900" : "text-slate-100"
                    }`}
                  >
                    Caisty POS installieren
                  </span>
                  <span
                    className={`rounded-full px-2 py-0.5 ${
                      isLight
                        ? "bg-emerald-100 text-emerald-600"
                        : "bg-emerald-500/10 text-emerald-300"
                    }`}
                  >
                    Vorschau
                  </span>
                </div>

                <div className="grid gap-2 sm:grid-cols-3 mt-1">
                  <StepPill label="Windows" active />
                  <StepPill label="Linux (bald)" />
                  <StepPill label="macOS (bald)" />
                </div>

                <div className="mt-2 grid gap-2 sm:grid-cols-3">
                  <SmallStep title="Download" number={1} />
                  <SmallStep title="Installation" number={2} />
                  <SmallStep title="Lizenz verbinden" number={3} />
                </div>

                <div
                  className={`mt-3 h-10 rounded-xl border border-dashed flex items-center justify-center text-[11px] ${
                    isLight
                      ? "border-slate-300 bg-slate-100 text-slate-600"
                      : "border-slate-700 bg-slate-900/80 text-slate-500"
                  }`}
                >
                  Download-Button &amp; Details erscheinen später direkt im
                  Portal – nicht auf der öffentlichen Website.
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Fiscal info / international use */}
      <section className="max-w-5xl mx-auto px-4 pb-20">
        <div
          className={`rounded-3xl border p-5 space-y-3 text-xs sm:text-sm ${
            isLight
              ? "border-slate-200 bg-white text-slate-700"
              : "border-slate-800 bg-slate-900/70 text-slate-300"
          }`}
        >
          <h2
            className={`text-sm sm:text-base font-semibold ${
              isLight ? "text-slate-900" : "text-slate-100"
            }`}
          >
            {t.fiscal.title}
          </h2>
          <p>
            {t.fiscal.paragraph1}{" "}
            <span className="font-semibold">
              {t.fiscal.modeName}
            </span>{" "}
            {t.fiscal.paragraph2.split("(TSE")[0]}
            <span className="font-semibold">{t.fiscal.comingSoon}</span> (TSE, RKSV,
            NF525, SAF-T, TicketBAI, myDATA …). {t.fiscal.paragraph2.includes("(TSE") ? t.fiscal.paragraph2.split("(TSE")[1] : ""}
          </p>
          <ul className="list-disc list-inside space-y-1">
            {t.fiscal.countries.map((country, idx) => (
              <li key={idx}>{country}</li>
            ))}
          </ul>
          <p>
            {t.fiscal.paragraph3}{" "}
            <span className="font-semibold">{t.fiscal.strictRequirement}</span>{" "}
            {t.fiscal.paragraph4}
          </p>
          <p>
            {t.fiscal.paragraph5}
          </p>
        </div>
      </section>
    </div>
  );
}

function FeatureCard(props: { title: string; text: string }) {
  const { theme } = useTheme();
  const isLight = theme === "light";
  return (
    <div className={`rounded-2xl border p-4 space-y-2 ${isLight ? "border-slate-200 bg-white" : "border-slate-800 bg-slate-900/70"}`}>
      <div className={`text-sm font-medium ${isLight ? "text-slate-900" : "text-slate-100"}`}>{props.title}</div>
      <p className={`text-xs ${isLight ? "text-slate-600" : "text-slate-300"}`}>{props.text}</p>
    </div>
  );
}

function PaymentMethodCard(props: {
  title: string;
  description: string;
  icon: "PayPal" | "Stripe";
  cards?: string;
}) {
  const { theme } = useTheme();
  const isLight = theme === "light";
  return (
    <div
      className={`rounded-2xl border p-4 space-y-3 ${
        isLight
          ? "border-slate-200 bg-white"
          : "border-slate-800 bg-slate-900/70"
      }`}
    >
      <div className="flex items-center justify-between gap-2">
        <div
          className={`text-sm font-semibold ${
            isLight ? "text-slate-900" : "text-slate-100"
          }`}
        >
          {props.title}
        </div>
        {props.icon === "PayPal" && (
          <div className="text-xs font-semibold text-[#0070ba]">PayPal</div>
        )}
        {props.icon === "Stripe" && (
          <div className="text-xs font-semibold text-[#635bff]">Stripe</div>
        )}
      </div>
      <p
        className={`text-xs leading-relaxed ${
          isLight ? "text-slate-600" : "text-slate-300"
        }`}
      >
        {props.description}
      </p>
      {props.cards && (
        <div
          className={`inline-flex items-center gap-2 rounded-lg border px-3 py-1.5 text-[10px] ${
            isLight
              ? "border-slate-200 bg-slate-50 text-slate-700"
              : "border-slate-700 bg-slate-900 text-slate-300"
          }`}
        >
          <span>💳</span>
          <span>{props.cards}</span>
        </div>
      )}
    </div>
  );
}

function PlanCard(props: {
  name: string;
  badge: string;
  price: string;
  subPrice?: string;
  note?: string;
  highlight?: boolean;
  details?: string[];
}) {
  const { theme } = useTheme();
  const isLight = theme === "light";
  const base =
    "rounded-2xl border p-4 space-y-3 text-xs sm:text-sm";
  const style = props.highlight
    ? isLight ? "border-emerald-300 shadow-lg shadow-emerald-200/40 bg-white" : "border-emerald-500/70 shadow-lg shadow-emerald-900/40 bg-slate-900/70"
    : isLight ? "border-slate-200 bg-white" : "border-slate-800 bg-slate-900/70";

  return (
    <div className={`${base} ${style}`}>
      <div className="flex items-center justify-between gap-2">
        <div className={`text-sm font-semibold ${isLight ? "text-slate-900" : "text-slate-100"}`}>
          {props.name}
        </div>
        <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] ${isLight ? "border-slate-200 bg-slate-50 text-slate-700" : "border-slate-700 bg-slate-900 text-slate-300"}`}>
          {props.badge}
        </span>
      </div>
      <div className="space-y-1">
        <div className="text-lg font-semibold text-emerald-400">
          {props.price}
        </div>
        {props.subPrice && (
          <div className={`text-[11px] ${isLight ? "text-slate-600" : "text-slate-400"}`}>{props.subPrice}</div>
        )}
        {props.note && (
          <div className={`text-[11px] ${isLight ? "text-slate-700" : "text-slate-300"}`}>{props.note}</div>
        )}
      </div>
      {props.details && props.details.length > 0 && (
        <ul className={`mt-2 space-y-1 text-[11px] ${isLight ? "text-slate-700" : "text-slate-300"}`}>
          {props.details.map((d, i) => (
            <li key={i}>• {d}</li>
          ))}
        </ul>
      )}
    </div>
  );
}

function StepPill({ label, active }: { label: string; active?: boolean }) {
  const { theme } = useTheme();
  const isLight = theme === "light";
  return (
    <div
      className={[
        "inline-flex items-center justify-center rounded-full border px-3 py-1 text-[11px]",
        active
          ? isLight
            ? "border-emerald-500/60 bg-emerald-50 text-emerald-600"
            : "border-emerald-500/60 bg-emerald-500/10 text-emerald-200"
          : isLight
          ? "border-slate-300 bg-slate-100 text-slate-600"
          : "border-slate-700 bg-slate-900 text-slate-400",
      ].join(" ")}
    >
      {label}
    </div>
  );
}

function SmallStep({ title, number }: { title: string; number: number }) {
  const { theme } = useTheme();
  const isLight = theme === "light";
  return (
    <div
      className={`rounded-xl border p-3 space-y-2 ${
        isLight
          ? "border-slate-200 bg-slate-50"
          : "border-slate-800 bg-slate-900/80"
      }`}
    >
      <div
        className={`inline-flex h-5 w-5 items-center justify-center rounded-full text-[11px] font-semibold ${
          isLight
            ? "bg-emerald-100 text-emerald-600"
            : "bg-emerald-500/15 text-emerald-300"
        }`}
      >
        {number}
      </div>
      <div
        className={`text-[11px] font-semibold ${
          isLight ? "text-slate-900" : "text-slate-100"
        }`}
      >
        {title}
      </div>
      <div
        className={`h-2 rounded ${isLight ? "bg-slate-200" : "bg-slate-800"}`}
      />
    </div>
  );
}
