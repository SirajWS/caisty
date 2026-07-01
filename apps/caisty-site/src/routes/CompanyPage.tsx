import { useEffect } from "react";
import { Link } from "react-router-dom";
import { Check, Target, Eye } from "lucide-react";
import { useLanguage } from "../lib/LanguageContext";
import { translations } from "../lib/translations/index";
import { companyTn } from "../lib/translations/companyTn";
import { getSiteMarket } from "../lib/siteMarket";
import { useTheme } from "../lib/theme";
import { POS_LANDING_PATH } from "../config/marketingRoutes";
import { applyCompanySiteMeta } from "../lib/siteDocumentMeta";

const sectionShell = "w-full max-w-[1100px] mx-auto px-4 sm:px-6 lg:px-8";
const sectionPad = "py-16 sm:py-20";

function cardShell(isLight: boolean) {
  return `rounded-2xl border p-6 sm:p-7 transition-shadow hover:shadow-md ${
    isLight ? "border-slate-200 bg-white shadow-sm hover:border-orange-100" : "border-white/10 bg-[#0f172a]/60 hover:border-white/15"
  }`;
}

export default function CompanyPage() {
  const { language } = useLanguage();
  const { theme } = useTheme();
  const market = getSiteMarket();
  const isTN = market === "tn";
  const isLight = theme === "light";
  const t = isTN ? companyTn : translations[language].company;

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
        <div className="pointer-events-none absolute -top-24 end-0 h-72 w-72 rounded-full bg-[#f97316]/20 blur-3xl" aria-hidden />
        <div
          className={`pointer-events-none absolute bottom-0 start-0 h-56 w-56 rounded-full ${isLight ? "bg-slate-300/30" : "bg-orange-600/10"} blur-3xl`}
          aria-hidden
        />
        <div className={`${sectionShell} relative z-[1] pt-12 pb-16 sm:pt-16 sm:pb-20 max-w-3xl`}>
          <div className="space-y-6 min-w-0">
            <div
              className={`inline-flex items-center gap-2 rounded-full border px-3.5 py-1.5 text-xs font-semibold tracking-wide shadow-sm ${
                isLight ? "border-slate-200/90 bg-white text-slate-700" : "border-white/10 bg-white/[0.06] text-slate-200"
              }`}
            >
              <span className="h-1.5 w-1.5 rounded-full shrink-0 bg-[#f97316] shadow-[0_0_0_3px_rgba(249,115,22,0.25)]" aria-hidden />
              {t.hero.badge}
            </div>
            <h1 className="text-3xl sm:text-4xl lg:text-[2.75rem] font-bold tracking-tight text-[var(--color-text-primary)] lp-font-heading leading-[1.12]">
              {t.hero.headline}
            </h1>
            <p className="m-0 text-base sm:text-lg leading-relaxed text-[var(--color-text-muted)]">
              {t.hero.subtitle}
            </p>
          </div>
        </div>
      </section>

      {/* Who we are */}
      <section className={`${sectionShell} ${sectionPad} border-b ${isLight ? "border-slate-200/90" : "border-white/[0.06]"}`}>
        <div className="flex items-start gap-3 mb-8">
          <span className="lp-section-accent" aria-hidden />
          <h2 className="lp-section-h2">{t.whoWeAre.title}</h2>
        </div>
        <div className={`space-y-4 text-sm sm:text-base leading-relaxed max-w-3xl ${isLight ? "text-slate-700" : "text-slate-300"}`}>
          {t.whoWeAre.paragraphs.map((p, i) => (
            <p key={i} className="m-0">
              {p}
            </p>
          ))}
        </div>
      </section>

      {/* Mission & Vision */}
      <section className={`${sectionShell} ${sectionPad} border-b ${isLight ? "border-slate-200/90" : "border-white/[0.06]"}`}>
        <div className="grid gap-6 lg:grid-cols-2">
          <article className={cardShell(isLight)}>
            <div
              className={`mb-4 inline-flex h-10 w-10 items-center justify-center rounded-xl border ${isLight ? "border-orange-200/80 bg-orange-50 text-[#c2410c]" : "border-orange-500/25 bg-orange-500/10 text-orange-200"}`}
              aria-hidden
            >
              <Target className="h-5 w-5" strokeWidth={2} />
            </div>
            <h2 className={`text-lg font-bold lp-font-heading mb-3 ${isLight ? "text-slate-900" : "text-slate-100"}`}>{t.mission.title}</h2>
            <p className={`m-0 text-sm sm:text-base leading-relaxed ${isLight ? "text-slate-600" : "text-slate-400"}`}>{t.mission.body}</p>
          </article>
          <article className={cardShell(isLight)}>
            <div
              className={`mb-4 inline-flex h-10 w-10 items-center justify-center rounded-xl border ${isLight ? "border-orange-200/80 bg-orange-50 text-[#c2410c]" : "border-orange-500/25 bg-orange-500/10 text-orange-200"}`}
              aria-hidden
            >
              <Eye className="h-5 w-5" strokeWidth={2} />
            </div>
            <h2 className={`text-lg font-bold lp-font-heading mb-3 ${isLight ? "text-slate-900" : "text-slate-100"}`}>{t.vision.title}</h2>
            <p className={`m-0 text-sm sm:text-base leading-relaxed ${isLight ? "text-slate-600" : "text-slate-400"}`}>{t.vision.body}</p>
          </article>
        </div>
      </section>

      {/* What we build */}
      <section className={`${sectionShell} ${sectionPad} border-b ${isLight ? "border-slate-200/90" : "border-white/[0.06]"}`}>
        <div className="flex items-start gap-3 mb-8">
          <span className="lp-section-accent" aria-hidden />
          <h2 className="lp-section-h2">{t.whatWeBuild.title}</h2>
        </div>
        <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 max-w-4xl">
          {t.whatWeBuild.items.map((item) => (
            <li
              key={item}
              className={`flex items-center gap-3 rounded-xl border px-4 py-3.5 text-sm font-medium ${isLight ? "border-slate-200 bg-white text-slate-800 shadow-sm" : "border-white/10 bg-[#0f172a]/50 text-slate-200"}`}
            >
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-orange-500/15 text-[#f97316]" aria-hidden>
                <Check className="h-3.5 w-3.5" strokeWidth={2.5} />
              </span>
              {item}
            </li>
          ))}
        </ul>
      </section>

      {/* Our principles */}
      <section className={`${sectionShell} ${sectionPad} border-b ${isLight ? "border-slate-200/90" : "border-white/[0.06]"}`}>
        <div className="flex items-start gap-3 mb-8">
          <span className="lp-section-accent" aria-hidden />
          <h2 className="lp-section-h2">{t.principles.title}</h2>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          {t.principles.items.map((item) => (
            <div
              key={item}
              className={`flex flex-col items-center text-center gap-2 rounded-2xl border p-5 transition-colors hover:border-orange-200/60 ${isLight ? "border-slate-200 bg-white shadow-sm" : "border-white/10 bg-[#0f172a]/60 hover:border-white/15"}`}
            >
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-orange-500/15 text-[#f97316] font-bold text-sm" aria-hidden>
                ✓
              </span>
              <p className={`m-0 text-sm font-semibold leading-snug ${isLight ? "text-slate-800" : "text-slate-200"}`}>{item}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="relative overflow-hidden bg-[#070d16] text-slate-100 border-t border-white/10">
        <div className="pointer-events-none absolute -top-24 end-0 h-64 w-64 rounded-full bg-[#f97316]/25 blur-3xl" aria-hidden />
        <div className={`${sectionShell} relative z-[1] py-16 sm:py-20`}>
          <div className="max-w-2xl space-y-6 text-center mx-auto">
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-white lp-font-heading leading-tight">
              {t.cta.headline}
            </h2>
            <Link
              to={POS_LANDING_PATH}
              className="inline-flex items-center justify-center rounded-full bg-[#f97316] px-6 py-3 min-h-[48px] text-sm font-semibold text-white no-underline shadow-lg shadow-orange-900/30 hover:bg-[#ea580c] transition-colors"
            >
              {t.cta.ctaExplore}
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
