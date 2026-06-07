// apps/caisty-site/src/layouts/SiteLayout.tsx
import { useState } from "react";
import { Outlet, Link, NavLink } from "react-router-dom";
import LanguageSelector from "../components/LanguageSelector";
import CurrencySelector from "../components/CurrencySelector";
import ThemeToggle from "../components/ThemeToggle";
import { useTheme } from "../lib/theme";
import { useLanguage } from "../lib/LanguageContext";
import { translations } from "../lib/translations/index";

function NavTextLink(props: {
  to: string;
  children: React.ReactNode;
  onClick?: () => void;
  isLight: boolean;
}) {
  return (
    <Link
      to={props.to}
      onClick={props.onClick}
      className={`text-sm font-medium no-underline transition-colors ${
        props.isLight ? "text-slate-600 hover:text-[#0b1220]" : "text-slate-300 hover:text-white"
      }`}
    >
      {props.children}
    </Link>
  );
}

export default function SiteLayout() {
  const { theme } = useTheme();
  const { language } = useLanguage();
  const t = translations[language].common;
  const isLight = theme === "light";
  const [mobileOpen, setMobileOpen] = useState(false);

  const baseBg = isLight ? "bg-[#f8fafc] text-slate-900" : "bg-[#0b1220] text-slate-50";
  const baseBorder = isLight ? "border-[#e2e8f0]" : "border-white/[0.08]";
  const strongText = isLight ? "text-[#0b1220]" : "text-white";
  const headerBg = isLight ? "bg-white/95" : "bg-[#0b1220]/95";

  const host = typeof window !== "undefined" ? window.location.hostname : "";
  const isTN = host === "tn.caisty.com";

  const closeMobile = () => setMobileOpen(false);

  return (
    <div className={`min-h-screen flex flex-col w-full min-w-0 ${baseBg}`}>
      <header
        className={`sticky top-0 z-40 border-b ${baseBorder} ${headerBg} backdrop-blur-md`}
      >
        <div className="max-w-6xl mx-auto w-full min-w-0 px-4 sm:px-5 py-3">
          <div className="flex items-center justify-between gap-3 min-w-0">
            <Link to="/" className="flex min-w-0 items-center gap-2.5 shrink-0" onClick={closeMobile}>
              <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-orange-500 text-sm font-bold text-white shadow-sm">
                C
              </span>
              <div className="flex min-w-0 flex-col leading-tight">
                <span className={`text-sm font-semibold tracking-tight truncate ${strongText}`}>Caisty</span>
                <span className={`text-[11px] truncate ${isLight ? "text-slate-500" : "text-slate-400"}`}>
                  {t.layout.tagline}
                </span>
              </div>
            </Link>

            {!isTN && (
              <nav
                className={`hidden lg:flex items-center gap-8 ${isLight ? "text-slate-600" : "text-slate-300"}`}
              >
                <NavTextLink to="/#product" isLight={isLight}>
                  {t.nav.product}
                </NavTextLink>
                <NavLink
                  to="/pricing"
                  className={({ isActive }) =>
                    [
                      "text-sm font-medium no-underline transition-colors",
                      isActive
                        ? "text-[#f97316]"
                        : isLight
                          ? "text-slate-600 hover:text-[#0b1220]"
                          : "text-slate-300 hover:text-white",
                    ].join(" ")
                  }
                >
                  {t.nav.pricing}
                </NavLink>
                <NavTextLink to="/#payment" isLight={isLight}>
                  {t.nav.payment}
                </NavTextLink>
                <NavTextLink to="/#fiscal" isLight={isLight}>
                  {t.nav.fiscal}
                </NavTextLink>
              </nav>
            )}

            <div className="hidden lg:flex items-center gap-3 shrink-0">
              <LanguageSelector />
              <CurrencySelector />
              <ThemeToggle />
              {!isTN && (
                <>
                  <Link
                    to="/login"
                    className={`text-sm font-medium no-underline px-2 ${isLight ? "text-slate-600 hover:text-[#0b1220]" : "text-slate-300 hover:text-white"}`}
                  >
                    {t.buttons.login}
                  </Link>
                  <Link
                    to="/register"
                    className="text-sm font-semibold no-underline rounded-full px-4 py-2.5 min-h-[44px] inline-flex items-center justify-center bg-[#f97316] text-white hover:bg-[#ea580c] transition-colors shadow-sm"
                  >
                    {t.buttons.startFree}
                  </Link>
                </>
              )}
            </div>

            {!isTN && (
              <button
                type="button"
                className={`lg:hidden inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full border ${
                  isLight
                    ? "border-slate-300 bg-white text-slate-800"
                    : "border-white/15 bg-white/[0.04] text-slate-100"
                }`}
                aria-expanded={mobileOpen}
                aria-label={mobileOpen ? t.layout.menuClose : t.layout.menuOpen}
                onClick={() => setMobileOpen((o) => !o)}
              >
                <span className="sr-only">{mobileOpen ? t.layout.menuClose : t.layout.menuOpen}</span>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
                  {mobileOpen ? (
                    <path d="M6 18L18 6M6 6l12 12" strokeLinecap="round" strokeLinejoin="round" />
                  ) : (
                    <path d="M4 6h16M4 12h16M4 18h16" strokeLinecap="round" strokeLinejoin="round" />
                  )}
                </svg>
              </button>
            )}
          </div>
        </div>

        {mobileOpen && !isTN && (
          <div
            className={`lg:hidden border-t ${baseBorder} ${isLight ? "bg-white" : "bg-[#0b1220]"}`}
          >
            <div className="max-w-6xl mx-auto px-4 sm:px-5 pb-4 pt-3 space-y-4">
              <Link
                to="/register"
                onClick={closeMobile}
                className="flex w-full min-h-[48px] items-center justify-center rounded-full bg-[#f97316] px-4 py-3 text-sm font-semibold text-white no-underline shadow-sm transition-colors hover:bg-[#ea580c]"
              >
                {t.buttons.startFree}
              </Link>
              <div className="flex flex-col gap-1">
                <NavTextLink to="/#product" isLight={isLight} onClick={closeMobile}>
                  {t.nav.product}
                </NavTextLink>
                <NavLink
                  to="/pricing"
                  onClick={closeMobile}
                  className={({ isActive }) =>
                    `text-sm font-medium py-2 no-underline ${isActive ? "text-[#f97316]" : isLight ? "text-slate-700" : "text-slate-200"}`
                  }
                >
                  {t.nav.pricing}
                </NavLink>
                <NavTextLink to="/#payment" isLight={isLight} onClick={closeMobile}>
                  {t.nav.payment}
                </NavTextLink>
                <NavTextLink to="/#fiscal" isLight={isLight} onClick={closeMobile}>
                  {t.nav.fiscal}
                </NavTextLink>
                <Link
                  to="/login"
                  onClick={closeMobile}
                  className={`text-sm font-medium py-2 no-underline ${isLight ? "text-slate-700" : "text-slate-200"}`}
                >
                  {t.buttons.login}
                </Link>
              </div>
              <div className={`flex flex-wrap items-center gap-3 pt-4 mt-2 border-t ${baseBorder}`}>
                <LanguageSelector />
                <CurrencySelector />
                <ThemeToggle />
              </div>
            </div>
          </div>
        )}
      </header>

      <main className="flex-1 w-full min-w-0 overflow-x-hidden">
        <Outlet />
      </main>

      <footer className={`border-t ${baseBorder} ${isLight ? "bg-white" : "bg-[#0b1220]"}`}>
        <div className="max-w-7xl mx-auto w-full min-w-0 px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
            <div className="space-y-3 min-w-0">
              <h3 className={`text-sm font-bold tracking-tight ${strongText}`}>Caisty</h3>
              <p className={`text-sm leading-relaxed ${isLight ? "text-slate-600" : "text-slate-400"}`}>
                {t.footer.brandTagline}
              </p>
            </div>
            <div className="space-y-3 min-w-0">
              <h3 className={`text-sm font-bold ${strongText}`}>{t.footer.contactTitle}</h3>
              <a
                href="mailto:info@caisty.com"
                className="text-sm text-[#f97316] hover:underline break-all"
              >
                info@caisty.com
              </a>
            </div>
            <div className="space-y-3 min-w-0">
              <h3 className={`text-sm font-bold ${strongText}`}>{t.footer.legalTitle}</h3>
              <div className={`flex flex-col gap-2 text-sm ${isLight ? "text-slate-600" : "text-slate-400"}`}>
                <Link to="/terms" className="hover:text-[#f97316] transition-colors no-underline">
                  {t.footer.terms}
                </Link>
                <Link to="/privacy" className="hover:text-[#f97316] transition-colors no-underline">
                  {t.footer.privacy}
                </Link>
                <Link to="/imprint" className="hover:text-[#f97316] transition-colors no-underline">
                  {t.footer.imprint}
                </Link>
              </div>
            </div>
            <div className="space-y-3 min-w-0">
              <h3 className={`text-sm font-bold ${strongText}`}>{t.footer.followTitle}</h3>
              <div className="flex flex-wrap gap-2">
                <a
                  href="https://facebook.com/caisty"
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`text-sm px-3 py-1.5 rounded-lg border no-underline transition-colors ${
                    isLight ? "border-slate-200 text-slate-700 hover:border-[#f97316]" : "border-white/10 text-slate-300 hover:border-[#f97316]"
                  }`}
                >
                  {t.footer.facebook}
                </a>
                <a
                  href="https://instagram.com/caisty"
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`text-sm px-3 py-1.5 rounded-lg border no-underline transition-colors ${
                    isLight ? "border-slate-200 text-slate-700 hover:border-[#f97316]" : "border-white/10 text-slate-300 hover:border-[#f97316]"
                  }`}
                >
                  {t.footer.instagram}
                </a>
                <a
                  href="https://youtube.com/@caisty"
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`text-sm px-3 py-1.5 rounded-lg border no-underline transition-colors ${
                    isLight ? "border-slate-200 text-slate-700 hover:border-[#f97316]" : "border-white/10 text-slate-300 hover:border-[#f97316]"
                  }`}
                >
                  {t.footer.youtube}
                </a>
              </div>
            </div>
          </div>

          <div
            className={`mt-10 pt-8 border-t ${baseBorder} flex flex-col gap-3 text-xs sm:text-sm ${isLight ? "text-slate-500" : "text-slate-500"}`}
          >
            <span>{t.footer.copyright}</span>
            <span className="leading-relaxed max-w-3xl">{t.footer.companyNote}</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
