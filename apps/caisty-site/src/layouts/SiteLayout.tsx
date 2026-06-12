import { useState } from "react";
import { Outlet, Link, NavLink, useLocation } from "react-router-dom";
import LanguageSelector from "../components/LanguageSelector";
import ThemeToggle from "../components/ThemeToggle";
import { DesktopProductNavDropdown, MobileProductNavGroup } from "../components/ProductNavDropdown";
import MarketingPreFooter from "../components/MarketingPreFooter";
import { useTheme } from "../lib/theme";
import { useLanguage } from "../lib/LanguageContext";
import { translations } from "../lib/translations/index";
import { FOOTER_TECH_STRIP } from "../lib/translations/common";
import { ICON_COLORS } from "../components/TechStackCardGrid";
import { tunisiaWhatsappUrl } from "../config/marketContact";
import { COMPANY_HOME, POS_LANDING_PATH } from "../config/marketingRoutes";
import { CaistyLogo } from "../components/CaistyLogo";

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
  const waUrl = typeof window !== "undefined" ? tunisiaWhatsappUrl() : null;

  const closeMobile = () => setMobileOpen(false);

  const { pathname } = useLocation();
  /** POS marketing band: only on Caisty POS landing and standalone pricing. */
  const showMarketingPreFooter = pathname === POS_LANDING_PATH || pathname === "/pricing";

  const navLinkClass = ({ isActive }: { isActive: boolean }) =>
    [
      "text-sm font-medium no-underline transition-colors",
      isActive
        ? "text-[#f97316]"
        : isLight
          ? "text-slate-600 hover:text-[#0b1220]"
          : "text-slate-300 hover:text-white",
    ].join(" ");

  return (
    <div className={`min-h-screen flex flex-col w-full min-w-0 ${baseBg}`}>
      <header
        className={`sticky top-0 z-40 border-b ${baseBorder} ${headerBg} backdrop-blur-md`}
      >
        <div className="max-w-6xl mx-auto w-full min-w-0 px-4 sm:px-5 py-3">
          <div className="flex items-center justify-between gap-3 min-w-0">
            <Link
              to={COMPANY_HOME}
              className="flex min-w-0 max-w-full shrink-0 items-center gap-2 no-underline sm:gap-3"
              onClick={closeMobile}
            >
              <div className="flex items-center gap-[10px]">
                <CaistyLogo className="h-[44px] w-[44px]" />
                <div className="flex min-w-0 flex-col leading-[1.2]">
                  <span
                    className={`text-[18px] font-medium ${isLight ? "text-[#1a1a1a]" : "text-[#f0f0f0]"}`}
                  >
                    {t.layout.headerBrand}
                  </span>
                  <span className="text-[11px] font-light tracking-[0.5px] text-[#aaaaaa]">
                    {t.layout.headerSubtitle}
                  </span>
                </div>
              </div>
            </Link>

            <nav
              className={`hidden lg:flex items-center gap-8 ${isLight ? "text-slate-600" : "text-slate-300"}`}
            >
              <NavLink to={COMPANY_HOME} end className={navLinkClass}>
                {t.nav.company}
              </NavLink>
              <DesktopProductNavDropdown
                navProductLabel={t.nav.product}
                productMenu={t.productMenu}
                isLight={isLight}
              />
            </nav>

            <div className="hidden lg:flex items-center gap-3 shrink-0">
              {!isTN && <LanguageSelector />}
              <ThemeToggle />
              {isTN && waUrl && (
                <a
                  href={waUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`text-xs font-medium no-underline ${isLight ? "text-slate-500 hover:text-[#0b1220]" : "text-slate-400 hover:text-white"}`}
                >
                  WhatsApp
                </a>
              )}
            </div>

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
          </div>
        </div>

        {mobileOpen && (
          <div
            className={`lg:hidden border-t ${baseBorder} ${isLight ? "bg-white" : "bg-[#0b1220]"}`}
          >
            <div className="max-w-6xl mx-auto px-4 sm:px-5 pb-4 pt-3 space-y-3">
              <div className="flex flex-col gap-1">
                <NavLink
                  to={COMPANY_HOME}
                  end
                  onClick={closeMobile}
                  className={({ isActive }) =>
                    `text-sm font-medium py-2 no-underline ${isActive ? "text-[#f97316]" : isLight ? "text-slate-700" : "text-slate-200"}`
                  }
                >
                  {t.nav.company}
                </NavLink>
                <MobileProductNavGroup
                  navProductLabel={t.nav.product}
                  productMenu={t.productMenu}
                  isLight={isLight}
                  mobileMenuOpen={mobileOpen}
                  onCloseMobile={closeMobile}
                />
                {isTN && waUrl && (
                  <a
                    href={waUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={closeMobile}
                    className={`text-sm font-medium py-2 no-underline ${isLight ? "text-slate-700" : "text-slate-200"}`}
                  >
                    WhatsApp
                  </a>
                )}
              </div>
              <div className={`flex flex-wrap items-center gap-3 pt-3 border-t ${baseBorder}`}>
                {!isTN && <LanguageSelector />}
                <ThemeToggle />
              </div>
            </div>
          </div>
        )}
      </header>

      <main className="flex-1 w-full min-w-0 overflow-x-hidden">
        <Outlet />
      </main>

      {showMarketingPreFooter ? <MarketingPreFooter /> : null}

      <footer className={`border-t ${baseBorder} ${isLight ? "bg-white" : "bg-[#0b1220]"}`}>
        <div className="max-w-6xl mx-auto w-full min-w-0 px-4 sm:px-6 lg:px-8 py-12 lg:py-14">
          <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-5 lg:gap-12">
            <div className="sm:col-span-2 lg:col-span-2 space-y-4 min-w-0">
              <h2 className={`text-lg font-bold tracking-tight ${strongText}`}>{t.footer.companyBrand}</h2>
              <p className={`text-sm font-semibold ${isLight ? "text-slate-800" : "text-slate-100"}`}>{t.footer.companyTagline}</p>
              <p className={`text-sm leading-relaxed max-w-lg ${isLight ? "text-slate-600" : "text-slate-400"}`}>
                {t.footer.companyIntro}
              </p>
              <div className="pt-1">
                <h3 className={`text-xs font-bold uppercase tracking-wider mb-2 ${isLight ? "text-slate-500" : "text-slate-500"}`}>
                  {t.footer.productsHeading}
                </h3>
                <div className="space-y-3 text-sm">
                  <div>
                    <Link to={`${POS_LANDING_PATH}#product`} className="font-semibold text-[#f97316] hover:underline no-underline">
                      {t.footer.productPosName}
                    </Link>
                    <p className={`mt-0.5 text-xs leading-relaxed ${isLight ? "text-slate-600" : "text-slate-400"}`}>
                      {t.footer.productPosBlurb}
                    </p>
                  </div>
                  <div>
                    <Link to="/shiftiq" className="font-semibold text-[#f97316] hover:underline no-underline">
                      {t.footer.productShiftiqName}
                    </Link>
                    <span className="text-xs font-normal text-slate-500 ms-1">{t.footer.productShiftiqSuffix}</span>
                    <p className={`mt-0.5 text-xs leading-relaxed ${isLight ? "text-slate-600" : "text-slate-400"}`}>
                      {t.footer.productShiftiqBlurb}
                    </p>
                  </div>
                </div>
              </div>
            </div>
            <div className="space-y-3 min-w-0">
              <h3 className={`text-xs font-bold uppercase tracking-wide ${strongText}`}>{t.footer.colCompany}</h3>
              <nav className={`flex flex-col gap-2 text-sm ${isLight ? "text-slate-600" : "text-slate-400"}`}>
                <Link to={COMPANY_HOME} className="hover:text-[#f97316] transition-colors no-underline">
                  {t.footer.linkCompany}
                </Link>
                <a href="mailto:info@caisty.com" className="hover:text-[#f97316] transition-colors no-underline break-all">
                  {t.footer.linkContact}
                </a>
              </nav>
            </div>
            <div className="space-y-3 min-w-0">
              <h3 className={`text-xs font-bold uppercase tracking-wide ${strongText}`}>{t.footer.colLegal}</h3>
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
              <h3 className={`text-xs font-bold uppercase tracking-wide ${strongText}`}>{t.footer.followTitle}</h3>
              <div className="flex flex-col gap-2 text-sm">
                <a
                  href="https://facebook.com/caisty"
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`no-underline transition-colors hover:text-[#f97316] ${isLight ? "text-slate-600" : "text-slate-400"}`}
                >
                  {t.footer.facebook}
                </a>
                <a
                  href="https://instagram.com/caisty"
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`no-underline transition-colors hover:text-[#f97316] ${isLight ? "text-slate-600" : "text-slate-400"}`}
                >
                  {t.footer.instagram}
                </a>
                <a
                  href="https://youtube.com/@caisty"
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`no-underline transition-colors hover:text-[#f97316] ${isLight ? "text-slate-600" : "text-slate-400"}`}
                >
                  {t.footer.youtube}
                </a>
              </div>
            </div>
          </div>
          <div
            className={`mt-10 pt-8 border-t ${baseBorder} flex flex-col gap-4 text-xs sm:text-sm ${isLight ? "text-slate-500" : "text-slate-500"}`}
          >
            <div className="flex flex-wrap items-center gap-2 gap-y-2" aria-hidden>
              {FOOTER_TECH_STRIP.map((item) => {
                const hex = ICON_COLORS[item.slug] ?? "64748B";
                return (
                  <span
                    key={item.slug}
                    className={`inline-flex items-center gap-1.5 rounded-full border px-2 py-1 ${
                      isLight ? "border-slate-200/90 bg-slate-50" : "border-white/10 bg-white/[0.04]"
                    }`}
                    title={item.label}
                  >
                    <img
                      src={`https://cdn.simpleicons.org/${item.slug}/${hex}`}
                      alt=""
                      width={16}
                      height={16}
                      className="h-4 w-4 shrink-0 opacity-90"
                      loading="lazy"
                    />
                    <span className={`text-[10px] font-semibold ${isLight ? "text-slate-700" : "text-slate-300"}`}>
                      {item.label}
                    </span>
                  </span>
                );
              })}
            </div>
            <span>{t.footer.copyright}</span>
            <span className="leading-relaxed max-w-3xl">{t.footer.companyNote}</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
