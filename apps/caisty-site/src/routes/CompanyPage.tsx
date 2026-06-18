import { useEffect } from "react";
import { Link } from "react-router-dom";
import { Bot, Cloud, MapPinned, Monitor, ShieldCheck, Smartphone, Sparkles, type LucideIcon } from "lucide-react";
import { useLanguage } from "../lib/LanguageContext";
import { translations } from "../lib/translations/index";
import { companyTn } from "../lib/translations/companyTn";
import { getSiteMarket } from "../lib/siteMarket";
import { useTheme } from "../lib/theme";
import { TechStackCardGrid } from "../components/TechStackCardGrid";
import { POS_LANDING_PATH } from "../config/marketingRoutes";
import { applyCompanySiteMeta } from "../lib/siteDocumentMeta";

const sectionShell = "w-full max-w-[1100px] mx-auto px-4 sm:px-6 lg:px-8";
const sectionPad = "py-16 sm:py-20";

const aboutHighlightIcons: LucideIcon[] = [MapPinned, Sparkles, ShieldCheck];

const whatWeDoIcons: Record<"cloud" | "monitor" | "bot" | "smartphone", LucideIcon> = {
  cloud: Cloud,
  monitor: Monitor,
  bot: Bot,
  smartphone: Smartphone,
};

export default function CompanyPage() {
  const { language } = useLanguage();
  const { theme } = useTheme();
  const market = getSiteMarket();
  const isTN = market === "tn";
  const isLight = theme === "light";
  const t = isTN ? companyTn : translations[language].company;
  const productHomeHref = isTN ? `${POS_LANDING_PATH}#features` : `${POS_LANDING_PATH}#product`;

  useEffect(() => {
    applyCompanySiteMeta();
  }, []);

  return (
    <div
      className={`company-page landing-page min-h-screen w-full max-w-[100vw] overflow-x-clip ${isLight ? "landing-page--light bg-[#f8fafc]" : "bg-[#0b1220]"}`}
    >
      {/* Hero */}
      <section className={`relative overflow-x-clip border-b ${isLight ? "border-slate-200/80" : "border-white/[0.06]"}`}>
        <div
          className={`pointer-events-none absolute inset-0 ${isLight ? "bg-gradient-to-br from-orange-500/[0.14] via-transparent to-slate-200/50" : "bg-gradient-to-br from-orange-500/12 via-transparent to-transparent"}`}
          aria-hidden
        />
        <div
          className="pointer-events-none absolute -top-24 end-0 h-72 w-72 rounded-full bg-[#f97316]/20 blur-3xl"
          aria-hidden
        />
        <div
          className={`pointer-events-none absolute bottom-0 start-0 h-56 w-56 rounded-full ${isLight ? "bg-slate-300/30" : "bg-orange-600/10"} blur-3xl`}
          aria-hidden
        />
        <div className={`${sectionShell} relative z-[1] pt-12 pb-16 sm:pt-16 sm:pb-20`}>
          <div className="grid gap-12 lg:gap-14 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)] items-start">
            <div className="space-y-6 min-w-0">
              <div
                className={`inline-flex items-center gap-2 rounded-full border px-3.5 py-1.5 text-xs font-semibold tracking-wide shadow-sm ${
                  isLight ? "border-slate-200/90 bg-white text-slate-700" : "border-white/10 bg-white/[0.06] text-slate-200"
                }`}
              >
                <span className="h-1.5 w-1.5 rounded-full shrink-0 bg-[#f97316] shadow-[0_0_0_3px_rgba(249,115,22,0.25)]" aria-hidden />
                {t.hero.badge}
              </div>
              <h1 className="text-3xl sm:text-4xl lg:text-[2.75rem] xl:text-5xl font-bold tracking-tight text-[var(--color-text-primary)] lp-font-heading leading-[1.12]">
                {t.hero.headline}
              </h1>
              <p className="m-0 text-base sm:text-lg lg:text-xl leading-relaxed text-[var(--color-text-muted)] max-w-xl">
                {t.hero.subtitle}
              </p>
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

      {/* About */}
      <section className={`${sectionShell} ${sectionPad} border-b ${isLight ? "border-slate-200/90" : "border-white/[0.06]"}`}>
        <div className="flex items-start gap-3 mb-8 lg:mb-10">
          <span className="lp-section-accent" aria-hidden />
          <h2 className="lp-section-h2">{t.about.title}</h2>
        </div>
        <div className="grid gap-10 lg:gap-12 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)] items-start">
          <div className={`space-y-4 text-sm sm:text-base leading-relaxed max-w-2xl ${isLight ? "text-slate-700" : "text-slate-300"}`}>
            {t.about.paragraphs.map((p, i) => (
              <p key={i} className="m-0">
                {p}
              </p>
            ))}
          </div>
          <div className="grid gap-3 sm:gap-4 min-w-0">
            {t.about.highlights.map((h, i) => {
              const Icon = aboutHighlightIcons[i] ?? Sparkles;
              return (
              <div
                key={h.title}
                className={`rounded-2xl border p-4 sm:p-5 transition-shadow hover:shadow-md ${isLight ? "border-slate-200 bg-white shadow-sm hover:border-orange-100" : "border-white/10 bg-[#0f172a]/60 hover:border-white/15"}`}
              >
                <div
                  className={`mb-3 inline-flex h-9 w-9 items-center justify-center rounded-xl border ${isLight ? "border-orange-200/80 bg-orange-50 text-[#c2410c]" : "border-orange-500/25 bg-orange-500/10 text-orange-200"}`}
                  aria-hidden
                >
                  <Icon className="h-4 w-4" strokeWidth={2} />
                </div>
                <h3 className={`text-sm font-bold lp-font-heading mb-1.5 ${isLight ? "text-slate-900" : "text-slate-100"}`}>
                  {h.title}
                </h3>
                <p className={`text-xs sm:text-sm leading-relaxed m-0 ${isLight ? "text-slate-600" : "text-slate-400"}`}>{h.body}</p>
              </div>
            );
            })}
          </div>
        </div>
      </section>

      {/* Products */}
      <section className={`${sectionShell} ${sectionPad} border-b ${isLight ? "border-slate-200/90" : "border-white/[0.06]"}`}>
        <div className="flex items-start gap-3 mb-10">
          <span className="lp-section-accent" aria-hidden />
          <h2 className="lp-section-h2">{t.products.title}</h2>
        </div>
        <div className="grid gap-6 lg:grid-cols-2">
          <div id="caisty-pos" className="scroll-mt-28 lg:scroll-mt-32 min-w-0">
            <ProductCardLink
              to={POS_LANDING_PATH}
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
          <div id="worktrack" className="scroll-mt-28 lg:scroll-mt-32 min-w-0">
            <ProductCardLink
              to="/worktrack"
              isLight={isLight}
              name={t.products.worktrack.name}
              description={t.products.worktrack.description}
              status={t.products.statusComingSoon}
              statusTone="soon"
              features={t.products.worktrack.features}
              ctaLabel={t.products.worktrack.ctaDisabled}
              ctaVariant="muted"
            />
          </div>
        </div>
      </section>

      {/* What we do */}
      <section className={`${sectionShell} ${sectionPad} border-b ${isLight ? "border-slate-200/90" : "border-white/[0.06]"}`}>
        <div className="flex flex-col gap-3 mb-8 sm:mb-10 max-w-3xl">
          <div className="flex items-start gap-3">
            <span className="lp-section-accent" aria-hidden />
            <h2 className="lp-section-h2">{t.whatWeDo.title}</h2>
          </div>
          <p className={`text-sm sm:text-base leading-relaxed m-0 ps-0 sm:ps-9 ${isLight ? "text-slate-600" : "text-slate-400"}`}>
            {t.whatWeDo.subtitle}
          </p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {t.whatWeDo.items.map((item) => {
            const Icon = whatWeDoIcons[item.iconKey as keyof typeof whatWeDoIcons];
            return (
              <div
                key={item.title}
                className={`flex flex-col gap-3 rounded-2xl border p-5 sm:p-6 h-full transition-shadow hover:shadow-md ${isLight ? "border-slate-200 bg-white shadow-sm hover:border-orange-100" : "border-white/10 bg-[#0f172a]/60 hover:border-white/15"}`}
              >
                <div
                  className={`inline-flex h-11 w-11 items-center justify-center rounded-xl border shadow-sm ${isLight ? "border-orange-200/80 bg-gradient-to-br from-orange-50 to-white text-[#c2410c]" : "border-orange-500/30 bg-gradient-to-br from-orange-500/20 to-orange-500/5 text-orange-200"}`}
                  aria-hidden
                >
                  <Icon className="h-5 w-5" strokeWidth={2} />
                </div>
                <h3 className={`text-sm font-bold lp-font-heading leading-snug ${isLight ? "text-slate-900" : "text-slate-100"}`}>
                  {item.title}
                </h3>
                <p className={`text-xs sm:text-sm leading-relaxed m-0 flex-1 ${isLight ? "text-slate-600" : "text-slate-400"}`}>
                  {item.description}
                </p>
              </div>
            );
          })}
        </div>
      </section>

      {/* Why companies choose Caisty */}
      <section className={`${sectionShell} ${sectionPad} border-b ${isLight ? "border-slate-200/90" : "border-white/[0.06]"}`}>
        <div className="flex items-start gap-3 mb-8">
          <span className="lp-section-accent" aria-hidden />
          <h2 className="lp-section-h2">{t.whyChoose.title}</h2>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {t.whyChoose.points.map((pt, i) => (
            <div
              key={i}
              className={`flex gap-3 rounded-2xl border p-4 sm:p-5 transition-colors hover:border-orange-200/60 ${isLight ? "border-slate-200 bg-white shadow-sm" : "border-white/10 bg-[#0f172a]/60 hover:border-white/15"}`}
            >
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-orange-500/15 text-[#f97316] font-bold text-sm mt-0.5" aria-hidden>
                ✓
              </span>
              <p className={`text-sm font-semibold leading-snug ${isLight ? "text-slate-800" : "text-slate-200"}`}>{pt}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Product roadmap */}
      <section className={`${sectionShell} ${sectionPad} border-b ${isLight ? "border-slate-200/90" : "border-white/[0.06]"}`}>
        <div className="flex flex-col gap-3 mb-8 max-w-3xl">
          <div className="flex items-start gap-3">
            <span className="lp-section-accent" aria-hidden />
            <h2 className="lp-section-h2">{t.roadmap.title}</h2>
          </div>
          <p className={`text-sm sm:text-base leading-relaxed m-0 sm:ps-9 ${isLight ? "text-slate-600" : "text-slate-400"}`}>{t.roadmap.subtitle}</p>
        </div>
        <div className={`overflow-x-auto rounded-xl border ${isLight ? "border-slate-200 bg-white shadow-sm" : "border-white/10 bg-[#0f172a]/50"}`}>
          <table className="w-full min-w-[320px] text-sm border-collapse text-start">
            <thead>
              <tr className={isLight ? "bg-slate-50" : "bg-white/[0.04]"}>
                <th
                  className={`p-3 sm:p-4 font-bold lp-font-heading border-b text-start ${isLight ? "border-slate-200 text-slate-900" : "border-white/10 text-slate-100"}`}
                >
                  {t.roadmap.colProduct}
                </th>
                <th
                  className={`p-3 sm:p-4 font-bold lp-font-heading border-b text-start ${isLight ? "border-slate-200 text-slate-900" : "border-white/10 text-slate-100"}`}
                >
                  {t.roadmap.colStatus}
                </th>
              </tr>
            </thead>
            <tbody>
              {t.roadmap.rows.map((row) => (
                <tr key={row.product} className={`border-b last:border-0 transition-colors ${isLight ? "border-slate-100 hover:bg-orange-50/40" : "border-white/[0.06] hover:bg-white/[0.04]"}`}>
                  <td className={`p-3 sm:p-4 font-semibold ${isLight ? "text-slate-800" : "text-slate-200"}`}>{row.product}</td>
                  <td className="p-3 sm:p-4">
                    <RoadmapStatusBadge
                      variant={row.variant as "available" | "soon" | "planned" | "research"}
                      label={row.status}
                      isLight={isLight}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Technology */}
      <section className={`${sectionShell} py-12 sm:py-14 border-b ${isLight ? "border-slate-200/90" : "border-white/[0.06]"}`}>
        <div className="flex flex-col gap-2 mb-6">
          <div className="flex items-start gap-3">
            <span className="lp-section-accent" aria-hidden />
            <h2 className="lp-section-h2">{t.technology.title}</h2>
          </div>
          <p className={`text-xs sm:text-sm font-medium m-0 sm:ps-9 ${isLight ? "text-slate-500" : "text-slate-500"}`}>{t.technology.lead}</p>
        </div>
        <div className={`rounded-2xl border p-4 sm:p-5 ${isLight ? "border-slate-200/80 bg-slate-50/50" : "border-white/[0.06] bg-white/[0.02]"}`}>
          <div className="opacity-85 saturate-[0.92] hover:opacity-100 hover:saturate-100 transition-[opacity,saturate] duration-300">
            <TechStackCardGrid title="" items={t.technology.stack} isLight={isLight} compact />
          </div>
        </div>
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
                to={productHomeHref}
                className="inline-flex items-center justify-center rounded-full bg-[#f97316] px-6 py-3 min-h-[48px] text-sm font-semibold text-white no-underline shadow-lg shadow-orange-900/30 hover:bg-[#ea580c] transition-colors w-full sm:w-auto"
              >
                {t.contactCta.ctaPrimary}
              </Link>
              <a
                href="mailto:info@caisty.com"
                className="inline-flex items-center justify-center rounded-full border border-white/25 bg-white/5 px-6 py-3 min-h-[48px] text-sm font-semibold text-white no-underline hover:bg-white/10 transition-colors w-full sm:w-auto"
              >
                {t.contactCta.ctaSecondary}
              </a>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

function RoadmapStatusBadge(props: { variant: "available" | "soon" | "planned" | "research"; label: string; isLight: boolean }) {
  const { variant, label, isLight } = props;
  const base = "inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wide border";
  const styles =
    variant === "available"
      ? "bg-emerald-500/15 text-emerald-400 border-emerald-500/35"
      : variant === "soon"
        ? isLight
          ? "bg-orange-50 text-orange-800 border-orange-200"
          : "bg-orange-500/10 text-orange-200 border-orange-500/25"
        : variant === "planned"
          ? isLight
            ? "bg-slate-100 text-slate-600 border-slate-200"
            : "bg-white/[0.06] text-slate-400 border-white/10"
          : isLight
            ? "bg-sky-50 text-sky-800 border-sky-200"
            : "bg-sky-500/10 text-sky-200 border-sky-500/25";
  return <span className={`${base} ${styles}`}>{label}</span>;
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
            className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-[10px] sm:text-xs font-semibold tracking-wide ${
              isLight ? "border-slate-200/90 bg-white text-slate-700 shadow-sm" : "border-white/10 bg-white/[0.06] text-slate-200"
            }`}
          >
            <span className="h-1.5 w-1.5 rounded-full shrink-0 bg-[#f97316] shadow-[0_0_0_3px_rgba(249,115,22,0.25)]" />
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
