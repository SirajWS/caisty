import { Link } from "react-router-dom";
import { useTheme } from "../lib/theme";
import { useLanguage } from "../lib/LanguageContext";
import { translations } from "../lib/translations/index";
import { TechStackCardGrid } from "./TechStackCardGrid";
import { POS_LANDING_PATH } from "../config/marketingRoutes";

export default function MarketingPreFooter() {
  const { theme } = useTheme();
  const { language } = useLanguage();
  const t = translations[language].common;
  const p = t.preFooter;
  const pm = t.productMenu;
  const isLight = theme === "light";

  const shell = isLight ? "border-slate-200/90 bg-slate-50/80" : "border-white/[0.06] bg-[#070d16]";
  const card = isLight
    ? "rounded-2xl border border-slate-200/90 bg-white p-6 shadow-sm"
    : "rounded-2xl border border-white/10 bg-[#0f172a]/60 p-6";
  const h2 = `text-lg sm:text-xl font-bold tracking-tight ${isLight ? "text-slate-900" : "text-white"}`;
  const muted = isLight ? "text-slate-600" : "text-slate-400";
  const trustCard = isLight
    ? "rounded-xl border border-slate-200/80 bg-white px-3 py-3 text-center shadow-sm"
    : "rounded-xl border border-white/[0.08] bg-white/[0.04] px-3 py-3 text-center";

  return (
    <div className={`border-t ${shell}`}>
      <div className="max-w-6xl mx-auto w-full min-w-0 px-4 sm:px-6 lg:px-8 py-14 sm:py-16 space-y-16 sm:space-y-20">
        {/* Our products */}
        <section aria-labelledby="prefooter-products-heading">
          <div className="flex items-start gap-3 mb-6">
            <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-[#f97316] shadow-[0_0_0_3px_rgba(249,115,22,0.25)]" aria-hidden />
            <h2 id="prefooter-products-heading" className={h2}>
              {p.ourProducts}
            </h2>
          </div>
          <div className="grid gap-6 md:grid-cols-2">
            <div className={card}>
              <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                <h3 className={`text-base font-bold ${isLight ? "text-slate-900" : "text-white"}`}>{pm.posTitle}</h3>
                <span className="rounded-full bg-emerald-500/15 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-emerald-700 ring-1 ring-emerald-500/25">
                  {pm.posStatus}
                </span>
              </div>
              <ul className={`space-y-2 text-sm mb-5 ${muted}`}>
                {p.posHighlights.map((line) => (
                  <li key={line} className="flex gap-2">
                    <span className="text-[#f97316] font-bold" aria-hidden>
                      ✓
                    </span>
                    <span>{line}</span>
                  </li>
                ))}
              </ul>
              <Link
                to={`${POS_LANDING_PATH}#product`}
                className={`inline-flex min-h-[44px] w-full items-center justify-center rounded-full border text-sm font-semibold no-underline transition-colors sm:w-auto sm:px-6 ${
                  isLight
                    ? "border-slate-200 bg-slate-50 text-slate-900 hover:border-[#f97316] hover:bg-orange-50 hover:text-[#c2410c]"
                    : "border-white/15 bg-white/[0.06] text-white hover:border-[#f97316] hover:bg-white/[0.1]"
                }`}
              >
                {p.posCtaLearn}
              </Link>
            </div>
            <div className={card}>
              <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                <h3 className={`text-base font-bold ${isLight ? "text-slate-900" : "text-white"}`}>{pm.shiftiqTitle}</h3>
                <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-slate-600 ring-1 ring-slate-200">
                  {pm.shiftiqStatus}
                </span>
              </div>
              <ul className={`space-y-2 text-sm mb-5 ${muted}`}>
                {p.shiftiqHighlights.map((line) => (
                  <li key={line} className="flex gap-2">
                    <span className="text-[#f97316] font-bold" aria-hidden>
                      ✓
                    </span>
                    <span>{line}</span>
                  </li>
                ))}
              </ul>
              <div className="flex flex-col gap-2">
                <Link
                  to="/shiftiq"
                  className={`inline-flex min-h-[44px] w-full items-center justify-center rounded-full border text-sm font-semibold no-underline transition-colors sm:w-auto sm:px-6 ${
                    isLight
                      ? "border-slate-200 bg-white text-slate-900 hover:border-[#f97316] hover:bg-orange-50 hover:text-[#c2410c]"
                      : "border-white/15 bg-white/[0.06] text-white hover:border-[#f97316] hover:bg-white/[0.1]"
                  }`}
                >
                  {pm.shiftiqNavCta}
                </Link>
                <p className={`text-center text-[10px] font-bold uppercase tracking-wide ${muted}`}>{p.shiftiqCtaDisabled}</p>
              </div>
            </div>
          </div>
        </section>

        {/* Trust */}
        <section aria-labelledby="prefooter-trust-heading">
          <div className="flex items-start gap-3 mb-6">
            <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-[#f97316] shadow-[0_0_0_3px_rgba(249,115,22,0.25)]" aria-hidden />
            <h2 id="prefooter-trust-heading" className={h2}>
              {p.trustTitle}
            </h2>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
            {p.trustPoints.map((pt) => (
              <div key={pt} className={trustCard}>
                <span className="text-emerald-600 font-bold text-sm" aria-hidden>
                  ✓
                </span>
                <p className={`mt-1 text-[11px] sm:text-xs font-semibold leading-snug ${isLight ? "text-slate-800" : "text-slate-200"}`}>
                  {pt}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* Technology */}
        <section aria-labelledby="prefooter-tech-heading">
          <div className="flex items-start gap-3 mb-2">
            <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-[#f97316] shadow-[0_0_0_3px_rgba(249,115,22,0.25)]" aria-hidden />
            <h2 id="prefooter-tech-heading" className={h2}>
              {p.techTitle}
            </h2>
          </div>
          <div className="mt-3">
            <TechStackCardGrid title="" items={p.techStack} isLight={isLight} />
          </div>
        </section>
      </div>
    </div>
  );
}
