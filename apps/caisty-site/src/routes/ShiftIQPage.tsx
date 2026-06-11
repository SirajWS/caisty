import { useEffect } from "react";
import { useLanguage } from "../lib/LanguageContext";
import { translations } from "../lib/translations/index";
import { useTheme } from "../lib/theme";
import { applyCompanySiteMeta } from "../lib/siteDocumentMeta";

const shell = "w-full max-w-[1100px] mx-auto px-4 sm:px-6 lg:px-8";

export default function ShiftIQPage() {
  const { language } = useLanguage();
  const { theme } = useTheme();
  const isLight = theme === "light";
  const t = translations[language].shiftiqPage;

  useEffect(() => {
    document.title = `${t.documentTitle} | Caisty`;
    return () => {
      applyCompanySiteMeta();
    };
  }, [t.documentTitle]);

  return (
    <div
      className={`shiftiq-page min-h-screen w-full max-w-[100vw] overflow-x-clip ${isLight ? "bg-[#f8fafc]" : "bg-[#0b1220]"}`}
    >
      <section className={`relative border-b ${isLight ? "border-slate-200/80" : "border-white/[0.06]"}`}>
        <div
          className={`pointer-events-none absolute inset-0 ${isLight ? "bg-gradient-to-br from-orange-500/[0.12] via-transparent to-slate-200/40" : "bg-gradient-to-br from-orange-500/10 via-transparent to-transparent"}`}
          aria-hidden
        />
        <div className={`${shell} relative z-[1] pt-12 pb-14 sm:pt-16 sm:pb-20`}>
          <div className="max-w-3xl space-y-5">
            <span
              className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-bold uppercase tracking-wide ${
                isLight ? "border-slate-200 bg-white text-slate-600" : "border-white/10 bg-white/[0.06] text-slate-300"
              }`}
            >
              {t.hero.badge}
            </span>
            <h1 className={`text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight leading-tight ${isLight ? "text-slate-900" : "text-white"}`}>
              {t.hero.title}
            </h1>
            <p className={`text-base sm:text-lg leading-relaxed max-w-2xl ${isLight ? "text-slate-600" : "text-slate-400"}`}>
              {t.hero.subtitle}
            </p>
          </div>
        </div>
      </section>

      <section className={`${shell} py-12 sm:py-16`}>
        <h2 className={`text-lg font-bold tracking-tight mb-6 ${isLight ? "text-slate-900" : "text-white"}`}>{t.featuresTitle}</h2>
        <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {t.features.map((f) => (
            <li
              key={f}
              className={`flex items-start gap-3 rounded-xl border px-4 py-3 text-sm font-medium ${
                isLight ? "border-slate-200 bg-white shadow-sm text-slate-800" : "border-white/10 bg-[#0f172a]/60 text-slate-200"
              }`}
            >
              <span className="text-emerald-500 font-bold shrink-0" aria-hidden>
                ✓
              </span>
              {f}
            </li>
          ))}
        </ul>
      </section>

      <section className={`${shell} pb-16 sm:pb-20 border-t ${isLight ? "border-slate-200/90 pt-12" : "border-white/[0.06] pt-12"}`}>
        <h2 className={`text-lg font-bold tracking-tight mb-4 ${isLight ? "text-slate-900" : "text-white"}`}>{t.whyTitle}</h2>
        <ul className={`space-y-3 max-w-2xl text-sm leading-relaxed ${isLight ? "text-slate-600" : "text-slate-400"}`}>
          {t.whyBody.map((line) => (
            <li key={line} className="flex gap-2">
              <span className="text-[#f97316] shrink-0" aria-hidden>
                •
              </span>
              <span>{line}</span>
            </li>
          ))}
        </ul>

        <div className="mt-10 flex flex-col sm:flex-row flex-wrap gap-3">
          <button
            type="button"
            disabled
            className={`inline-flex min-h-[48px] cursor-not-allowed items-center justify-center rounded-full border px-6 py-3 text-sm font-semibold opacity-60 ${
              isLight ? "border-slate-200 bg-slate-100 text-slate-500" : "border-white/10 bg-white/[0.04] text-slate-500"
            }`}
          >
            {t.ctaComingSoon}
          </button>
          <a
            href="mailto:info@caisty.com"
            className={`inline-flex min-h-[48px] items-center justify-center rounded-full border px-6 py-3 text-sm font-semibold no-underline transition-colors ${
              isLight
                ? "border-slate-300 text-slate-800 hover:border-[#f97316] hover:text-[#c2410c]"
                : "border-white/20 text-white hover:bg-white/10"
            }`}
          >
            {t.ctaContact}
          </a>
        </div>
      </section>
    </div>
  );
}
