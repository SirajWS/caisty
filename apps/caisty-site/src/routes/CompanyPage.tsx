import { useEffect } from "react";
import { Link } from "react-router-dom";
import { useLanguage } from "../lib/LanguageContext";
import { translations } from "../lib/translations/index";
import { companyTn } from "../lib/translations/companyTn";
import { getSiteMarket } from "../lib/siteMarket";
import { useTheme } from "../lib/theme";
import { TechStackCardGrid } from "../components/TechStackCardGrid";

const sectionShell = "w-full max-w-[1100px] mx-auto px-4 sm:px-6 lg:px-8";

export default function CompanyPage() {
  const { language } = useLanguage();
  const { theme } = useTheme();
  const market = getSiteMarket();
  const isTN = market === "tn";
  const isLight = theme === "light";
  const t = isTN ? companyTn : translations[language].company;
  const tc = translations[language].common;
  const productHomeHref = isTN ? "/#features" : "/#product";

  useEffect(() => {
    document.title = `${t.hero.badge} | Caisty`;
    return () => {
      document.title = "Caisty";
    };
  }, [t.hero.badge]);

  return (
    <div
      className={`company-page landing-page min-h-screen w-full max-w-[100vw] overflow-x-clip ${isLight ? "landing-page--light bg-[#f8fafc]" : "bg-[#0b1220]"}`}
    >
      {/* Hero */}
      <section className={`relative overflow-x-clip border-b ${isLight ? "border-slate-200/80" : "border-white/[0.06]"}`}>
        <div
          className={`pointer-events-none absolute inset-0 ${isLight ? "bg-gradient-to-br from-orange-500/[0.12] via-transparent to-slate-200/40" : "bg-gradient-to-br from-orange-500/10 via-transparent to-transparent"}`}
          aria-hidden
        />
        <div className={`${sectionShell} relative z-[1] pt-12 pb-16 sm:pt-16 sm:pb-20`}>
          <div className="grid gap-12 lg:gap-14 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)] items-start">
            <div className="space-y-6 min-w-0">
              <div
                className={`inline-flex items-center gap-2 rounded-full border px-3.5 py-1.5 text-xs font-semibold tracking-wide ${
                  isLight ? "border-slate-200 bg-white text-slate-700 shadow-sm" : "border-white/10 bg-white/[0.06] text-slate-200"
                }`}
              >
                <span className="h-1.5 w-1.5 rounded-full shrink-0 bg-[#f97316]" aria-hidden />
                {t.hero.badge}
              </div>
              <h1 className="text-3xl sm:text-4xl lg:text-[2.75rem] xl:text-5xl font-bold tracking-tight text-[var(--color-text-primary)] lp-font-heading leading-[1.12]">
                {t.hero.headline}
              </h1>
              <div className="space-y-4 text-base sm:text-lg lg:text-xl leading-relaxed text-[var(--color-text-muted)] max-w-xl">
                <p className="m-0">{t.hero.subtitle}</p>
                <p className="m-0">{t.hero.subtitleSecondary}</p>
              </div>
              <div className="flex flex-col sm:flex-row flex-wrap gap-3 pt-1">
                <Link
                  to={productHomeHref}
                  className="lp-cta-primary no-underline text-center justify-center w-full sm:w-auto"
                >
                  {t.hero.ctaExplore}
                </Link>
                <a
                  href="mailto:info@caisty.com"
                  className="lp-cta-secondary no-underline text-center justify-center w-full sm:w-auto"
                >
                  {t.hero.ctaContact}
                </a>
              </div>
            </div>

            <HeroMockPanel isLight={isLight} mock={t.mock} heroBadge={t.hero.badge} />
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className={`${sectionShell} py-14 sm:py-16`}>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
          {t.stats.cards.map((card) => (
            <div
              key={card.label}
              className={`rounded-2xl border p-5 sm:p-6 text-center transition-shadow hover:shadow-md ${
                isLight ? "border-slate-200/90 bg-white shadow-sm" : "border-white/10 bg-[#0f172a]/70"
              }`}
            >
              <div className="text-2xl sm:text-3xl font-bold text-[#f97316] lp-font-heading tabular-nums">{card.stat}</div>
              <div className={`mt-2 text-xs sm:text-sm font-medium ${isLight ? "text-slate-600" : "text-slate-400"}`}>
                {card.label}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Products */}
      <section className={`${sectionShell} py-14 sm:py-16 border-t ${isLight ? "border-slate-200/90" : "border-white/[0.06]"}`}>
        <div className="flex items-start gap-3 mb-10">
          <span className="lp-section-accent" aria-hidden />
          <h2 className="lp-section-h2">{t.products.title}</h2>
        </div>
        <div className="grid gap-6 lg:grid-cols-2">
          <div id="caisty-pos" className="scroll-mt-28 lg:scroll-mt-32 min-w-0">
            <ProductCardLink
              to="/"
              isLight={isLight}
              name={t.products.pos.name}
              description={t.products.pos.description}
              status={t.products.statusAvailableNow}
              statusTone="available"
              features={t.products.pos.features}
              ctaLabel={t.products.pos.ctaLearn}
              ctaVariant="primary"
            />
          </div>
          <div id="shiftiq" className="scroll-mt-28 lg:scroll-mt-32 min-w-0">
            <ProductCardLink
              to="/shiftiq"
              isLight={isLight}
              name={t.products.shiftiq.name}
              description={t.products.shiftiq.description}
              status={t.products.statusComingSoon}
              statusTone="soon"
              features={t.products.shiftiq.features}
              ctaLabel={t.products.shiftiq.ctaDisabled}
              ctaVariant="muted"
            />
          </div>
        </div>
      </section>

      {/* Why businesses choose Caisty */}
      <section className={`${sectionShell} py-14 sm:py-16 border-t ${isLight ? "border-slate-200/90" : "border-white/[0.06]"}`}>
        <div className="flex items-start gap-3 mb-8">
          <span className="lp-section-accent" aria-hidden />
          <h2 className="lp-section-h2">{t.whyChoose.title}</h2>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {t.whyChoose.points.map((pt) => (
            <div
              key={pt}
              className={`flex gap-3 rounded-2xl border p-4 sm:p-5 ${isLight ? "border-slate-200 bg-white shadow-sm" : "border-white/10 bg-[#0f172a]/60"}`}
            >
              <span className="text-[#f97316] font-bold shrink-0 mt-0.5" aria-hidden>
                ✓
              </span>
              <p className={`text-sm font-semibold leading-snug ${isLight ? "text-slate-800" : "text-slate-200"}`}>{pt}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Technology */}
      <section className={`${sectionShell} py-14 sm:py-16 border-t ${isLight ? "border-slate-200/90" : "border-white/[0.06]"}`}>
        <div className="flex items-start gap-3 mb-8">
          <span className="lp-section-accent" aria-hidden />
          <h2 className="lp-section-h2">{t.technology.title}</h2>
        </div>
        <TechStackCardGrid title="" items={t.technology.stack} isLight={isLight} />
      </section>

      {/* What we are building */}
      <section className={`${sectionShell} py-14 sm:py-20 border-t ${isLight ? "border-slate-200/90" : "border-white/[0.06]"}`}>
        <div className="flex items-start gap-3 mb-10">
          <span className="lp-section-accent" aria-hidden />
          <h2 className="lp-section-h2">{t.building.title}</h2>
        </div>
        <div className="grid gap-6 lg:grid-cols-2 max-w-4xl">
          <div
            className={`rounded-2xl border p-6 sm:p-7 space-y-4 relative overflow-hidden ${isLight ? "border-slate-200 bg-white shadow-sm" : "border-white/10 bg-[#0f172a]/70"}`}
          >
            <div className="absolute start-0 top-0 bottom-0 w-1 bg-gradient-to-b from-[#f97316] to-orange-600/40 rounded-full" aria-hidden />
            <h3 className="text-base font-bold text-[var(--color-text-primary)] lp-font-heading ps-3">{t.building.posTitle}</h3>
            <p className="text-xs font-bold uppercase tracking-wide text-[#f97316] ps-3">{t.building.posSub}</p>
            <ul className={`space-y-2.5 text-sm ps-3 ${isLight ? "text-slate-700" : "text-slate-300"}`}>
              {t.building.posItems.map((item) => (
                <li key={item} className="flex gap-2 items-start">
                  <span className="text-[#f97316] shrink-0 mt-0.5" aria-hidden>
                    ✓
                  </span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
          <div
            className={`rounded-2xl border p-6 sm:p-7 space-y-4 ${isLight ? "border-slate-200 bg-slate-50/90" : "border-white/10 bg-white/[0.04]"}`}
          >
            <h3 className="text-base font-bold text-[var(--color-text-primary)] lp-font-heading">{t.building.shiftiqTitle}</h3>
            <p className={`text-xs font-bold uppercase tracking-wide ${isLight ? "text-slate-500" : "text-slate-400"}`}>
              {t.building.shiftiqSub}
            </p>
            <ul className={`space-y-2.5 text-sm ${isLight ? "text-slate-600" : "text-slate-400"}`}>
              {t.building.shiftiqItems.map((item) => (
                <li key={item} className="flex gap-2 items-start">
                  <span className="text-slate-400 shrink-0 mt-0.5" aria-hidden>
                    ◆
                  </span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
        <p className="mt-10 text-xs text-[var(--color-text-subtle)] max-w-2xl">
          <Link to="/" className="text-[#f97316] hover:underline font-medium no-underline">
            Caisty POS
          </Link>
          {" · "}
          <Link to="/pricing" className="text-[#f97316] hover:underline font-medium no-underline">
            {tc.nav.pricing}
          </Link>
        </p>
      </section>

      {/* Contact CTA — dark band */}
      <section className="relative mt-4 overflow-hidden bg-[#070d16] text-slate-100 border-t border-white/10">
        <div className="pointer-events-none absolute -top-24 end-0 h-64 w-64 rounded-full bg-[#f97316]/25 blur-3xl" aria-hidden />
        <div className="pointer-events-none absolute bottom-0 start-1/4 h-48 w-96 rounded-full bg-orange-600/10 blur-3xl" aria-hidden />
        <div className={`${sectionShell} relative z-[1] py-16 sm:py-20`}>
          <div className="max-w-2xl space-y-6">
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-white lp-font-heading leading-tight">
              {t.contactCta.headline}
            </h2>
            <p className="text-sm sm:text-base leading-relaxed text-slate-300">{t.contactCta.body}</p>
            <div className="flex flex-col sm:flex-row flex-wrap gap-3 pt-2">
              <Link
                to="/register"
                className="inline-flex items-center justify-center rounded-full bg-[#f97316] px-6 py-3 min-h-[48px] text-sm font-semibold text-white no-underline shadow-lg shadow-orange-900/30 hover:bg-[#ea580c] transition-colors w-full sm:w-auto"
              >
                {t.contactCta.ctaStart}
              </Link>
              <a
                href="mailto:info@caisty.com"
                className="inline-flex items-center justify-center rounded-full border border-white/25 bg-white/5 px-6 py-3 min-h-[48px] text-sm font-semibold text-white no-underline hover:bg-white/10 transition-colors w-full sm:w-auto"
              >
                {t.contactCta.ctaContact}
              </a>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

function HeroMockPanel(props: {
  isLight: boolean;
  mock: { caption: string; liveBadge: string; items: string[]; footerNote: string };
  heroBadge: string;
}) {
  const { isLight, mock, heroBadge } = props;
  return (
    <div className="w-full min-w-0 lg:pt-2">
      <div
        className={`rounded-2xl p-5 sm:p-6 border shadow-xl ${
          isLight ? "border-slate-200 bg-white ring-1 ring-slate-200/60" : "border-white/10 bg-[#0f172a]/90 shadow-[0_24px_80px_rgba(0,0,0,0.45)]"
        }`}
      >
        <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
          <div className="text-[10px] sm:text-xs font-semibold uppercase tracking-wider text-[var(--color-text-subtle)]">
            {mock.caption}
          </div>
          <div
            className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[10px] sm:text-xs font-medium ${
              isLight ? "bg-slate-100 text-slate-700" : "bg-white/[0.08] text-slate-200"
            }`}
          >
            <span className="h-2 w-2 rounded-full shrink-0 bg-[#f97316]" />
            {mock.liveBadge}
          </div>
        </div>
        <div
          className={`rounded-xl border p-4 sm:p-5 space-y-3 ${
            isLight ? "border-slate-200 bg-gradient-to-br from-slate-50 to-white" : "border-white/[0.08] bg-black/30"
          }`}
        >
          <div className="text-xs font-bold text-[var(--color-text-primary)] lp-font-heading">{heroBadge}</div>
          <ul className="grid gap-2 sm:grid-cols-2 text-xs sm:text-sm text-[var(--color-text-primary)]">
            {mock.items.map((item) => (
              <li
                key={item}
                className={`flex items-center gap-2 rounded-lg border px-2.5 py-2 ${
                  isLight ? "border-slate-200 bg-white" : "border-white/10 bg-white/[0.04]"
                }`}
              >
                <span className="h-1.5 w-1.5 rounded-full bg-[#f97316] shrink-0" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
          <p className={`text-[11px] leading-relaxed border-t pt-3 ${isLight ? "border-slate-200 text-slate-500" : "border-white/10 text-slate-400"}`}>
            {mock.footerNote}
          </p>
        </div>
      </div>
    </div>
  );
}

function ProductCardLink(props: {
  to: string;
  isLight: boolean;
  name: string;
  description: string;
  status: string;
  statusTone: "available" | "soon";
  features: string[];
  ctaLabel: string;
  ctaVariant: "primary" | "muted";
}) {
  const { to, isLight, name, description, status, statusTone, features, ctaLabel, ctaVariant } = props;
  const shell = `rounded-2xl border p-6 sm:p-7 flex flex-col h-full min-h-[280px] transition-all hover:shadow-xl focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#f97316] ${
    isLight ? "border-slate-200 bg-white shadow-sm hover:border-orange-200" : "border-white/10 bg-[#0f172a]/50 hover:border-white/20"
  }`;
  const ctaClass =
    ctaVariant === "primary"
      ? "lp-cta-primary no-underline text-center justify-center w-full sm:w-auto text-sm py-2.5 min-h-[44px]"
      : `inline-flex w-full sm:w-auto items-center justify-center rounded-full border px-4 py-2.5 min-h-[44px] text-sm font-semibold no-underline ${
          isLight ? "border-slate-200 bg-slate-50 text-slate-600" : "border-white/10 bg-white/[0.04] text-slate-300"
        }`;

  return (
    <Link to={to} className={`${shell} no-underline text-inherit group`}>
      <div className="flex flex-wrap items-start justify-between gap-2 mb-3">
        <h3 className="text-lg font-bold text-[var(--color-text-primary)] lp-font-heading group-hover:text-[#f97316] transition-colors">
          {name}
        </h3>
        <span
          className={`text-[10px] font-bold uppercase tracking-wide rounded-full px-2.5 py-0.5 ${
            statusTone === "available"
              ? "bg-emerald-500/15 text-emerald-600 border border-emerald-500/30"
              : isLight
                ? "bg-slate-100 text-slate-600 border border-slate-200"
                : "bg-white/10 text-slate-300 border border-white/10"
          }`}
        >
          {status}
        </span>
      </div>
      <p className={`text-sm leading-relaxed mb-5 ${isLight ? "text-slate-600" : "text-slate-400"}`}>{description}</p>
      <ul className={`space-y-2 text-sm mb-6 flex-1 ${isLight ? "text-slate-700" : "text-slate-300"}`}>
        {features.map((f) => (
          <li key={f} className="flex gap-2 items-start">
            <span className="text-[#f97316] shrink-0 mt-0.5" aria-hidden>
              ✓
            </span>
            <span>{f}</span>
          </li>
        ))}
      </ul>
      <div className="mt-auto">
        <span className={ctaClass}>{ctaLabel}</span>
      </div>
    </Link>
  );
}
