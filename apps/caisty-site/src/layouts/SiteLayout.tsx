import { useState } from "react";
import { Outlet, Link, NavLink, useLocation } from "react-router-dom";
import LanguageSelector from "../components/LanguageSelector";
import ThemeToggle from "../components/ThemeToggle";
import MarketingPreFooter from "../components/MarketingPreFooter";
import { FooterModals } from "../components/FooterModals";
import CookieBanner from "../components/CookieBanner";
import { useTheme } from "../lib/theme";
import { useLanguage } from "../lib/LanguageContext";
import { translations } from "../lib/translations/index";
import { tunisiaWhatsappUrl } from "../config/marketContact";
import { COMPANY_HOME, LEGAL_PATHS, POS_LANDING_PATH } from "../config/marketingRoutes";
import { CaistyLogo } from "../components/CaistyLogo";
import {
  DesktopCaistyPosQuickAccessMenu,
  MobileCaistyPosQuickAccessMenu,
} from "../components/CaistyPosQuickAccessMenu";

export default function SiteLayout() {
  const { theme } = useTheme();
  const { language } = useLanguage();
  const t = translations[language].common;
  const productMenu = t.productMenu;
  const isLight = theme === "light";
  const [mobileOpen, setMobileOpen] = useState(false);
  const [footerModal, setFooterModal] = useState<null | "company" | "contact">(null);

  const host = typeof window !== "undefined" ? window.location.hostname : "";
  const isTN = host === "tn.caisty.com";
  const waUrl = typeof window !== "undefined" ? tunisiaWhatsappUrl() : null;

  const closeMobile = () => setMobileOpen(false);

  const { pathname } = useLocation();
  const showMarketingPreFooter = pathname === POS_LANDING_PATH || pathname === "/pricing";

  const navLinkClass = ({ isActive }: { isActive: boolean }) =>
    ["mkt-nav-link", isActive ? "is-active" : ""].filter(Boolean).join(" ");

  const footerTextClass = "text-sm transition-colors no-underline";
  const footerMuted = { color: "var(--mkt-text-muted)" } as const;
  const footerLinkStyle = { ...footerMuted, background: "transparent", border: 0, padding: 0, cursor: "pointer", font: "inherit", textAlign: "start" as const };

  return (
    <div
      className={`marketing-site min-h-screen flex flex-col w-full min-w-0 ${isLight ? "" : "marketing-site--dark"}`}
      style={{ background: "var(--mkt-bg)", color: "var(--mkt-text)" }}
    >
      <header
        className="sticky top-0 z-40 border-b backdrop-blur-xl"
        style={{
          borderColor: "var(--mkt-border)",
          background: isLight ? "color-mix(in srgb, var(--mkt-bg) 88%, transparent)" : "color-mix(in srgb, var(--mkt-bg) 90%, transparent)",
        }}
      >
        <div className="mkt-shell py-3">
          <div className="flex items-center justify-between gap-3 min-w-0">
            <Link to={COMPANY_HOME} className="flex min-w-0 shrink-0 items-center gap-3 no-underline" onClick={closeMobile}>
              <CaistyLogo className="h-11 w-11" />
              <div className="flex min-w-0 flex-col leading-tight">
                <span className="text-lg font-semibold" style={{ color: "var(--mkt-text)" }}>
                  {t.layout.headerBrand}
                </span>
                <span className="text-xs font-medium" style={{ color: "var(--mkt-text-subtle)" }}>
                  {t.layout.headerSubtitle}
                </span>
              </div>
            </Link>

            <nav className="hidden lg:flex items-center gap-8">
              <NavLink to={COMPANY_HOME} end className={navLinkClass}>
                {t.nav.company}
              </NavLink>
              <DesktopCaistyPosQuickAccessMenu
                label={productMenu.posTitle}
                registerLabel={t.buttons.register}
                loginLabel={t.buttons.login}
                isLight={isLight}
              />
              <NavLink to="/pricing" className={navLinkClass}>
                {t.nav.pricing}
              </NavLink>
              <span className="mkt-nav-soon" title={productMenu.worktrackStatus}>
                {productMenu.worktrackNavSoon}
              </span>
            </nav>

            <div className="hidden lg:flex items-center gap-3 shrink-0">
              {!isTN && <LanguageSelector />}
              <ThemeToggle />
              {isTN && waUrl && (
                <a href={waUrl} target="_blank" rel="noopener noreferrer" className="mkt-nav-link text-xs">
                  WhatsApp
                </a>
              )}
            </div>

            <button
              type="button"
              className="lg:hidden inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full border"
              style={{ borderColor: "var(--mkt-border)", background: "var(--mkt-bg-elevated)", color: "var(--mkt-text)" }}
              aria-expanded={mobileOpen}
              aria-label={mobileOpen ? t.layout.menuClose : t.layout.menuOpen}
              onClick={() => setMobileOpen((o) => !o)}
            >
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
          <div className="lg:hidden border-t" style={{ borderColor: "var(--mkt-border)", background: "var(--mkt-bg-elevated)" }}>
            <div className="mkt-shell pb-4 pt-3 space-y-3">
              <NavLink to={COMPANY_HOME} end onClick={closeMobile} className={navLinkClass}>
                {t.nav.company}
              </NavLink>
              <MobileCaistyPosQuickAccessMenu
                label={productMenu.posTitle}
                registerLabel={t.buttons.register}
                loginLabel={t.buttons.login}
                isLight={isLight}
                onNavigate={closeMobile}
              />
              <NavLink to="/pricing" onClick={closeMobile} className={navLinkClass}>
                {t.nav.pricing}
              </NavLink>
              <p className="mkt-nav-soon py-2 m-0">{productMenu.worktrackNavSoon}</p>
              {isTN && waUrl && (
                <a href={waUrl} target="_blank" rel="noopener noreferrer" onClick={closeMobile} className={`${footerTextClass} block py-2`} style={footerMuted}>
                  WhatsApp
                </a>
              )}
              <div className="flex flex-wrap items-center gap-3 pt-3 border-t" style={{ borderColor: "var(--mkt-border)" }}>
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

      <footer className="border-t" style={{ borderColor: "var(--mkt-border)", background: "var(--mkt-bg-elevated)" }}>
        <div className="mkt-shell py-14 lg:py-16">
          <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4 lg:gap-12">
            <div className="sm:col-span-2 space-y-4 min-w-0">
              <h2 className="text-lg font-bold tracking-tight" style={{ color: "var(--mkt-text)" }}>
                {t.footer.companyBrand}
              </h2>
              <p className="text-sm leading-relaxed max-w-md m-0" style={{ color: "var(--mkt-text-muted)" }}>
                {t.footer.companyTagline}
              </p>
              <div className="pt-2 space-y-2 text-sm">
                <Link to={POS_LANDING_PATH} className="font-semibold no-underline" style={{ color: "var(--mkt-accent)" }}>
                  {t.footer.productPosName}
                </Link>
                <p className="m-0 text-xs leading-relaxed" style={{ color: "var(--mkt-text-muted)" }}>
                  {t.footer.productPosBlurb}
                </p>
                <p className="m-0 text-xs" style={{ color: "var(--mkt-text-subtle)" }}>
                  {t.footer.productWorktrackSoon}
                </p>
              </div>
            </div>

            <div className="space-y-3 min-w-0">
              <h3 className="text-xs font-bold uppercase tracking-wider" style={{ color: "var(--mkt-text-subtle)" }}>
                {t.footer.colCompany}
              </h3>
              <nav className="flex flex-col gap-2">
                <button type="button" className={footerTextClass} style={footerLinkStyle} onClick={() => setFooterModal("company")}>
                  {t.footer.linkCompany}
                </button>
                <button type="button" className={footerTextClass} style={footerLinkStyle} onClick={() => setFooterModal("contact")}>
                  {t.footer.linkContact}
                </button>
                <Link to="/pricing" className={footerTextClass} style={footerMuted}>
                  {t.nav.pricing}
                </Link>
              </nav>
            </div>

            <div className="space-y-3 min-w-0">
              <h3 className="text-xs font-bold uppercase tracking-wider" style={{ color: "var(--mkt-text-subtle)" }}>
                {t.footer.colLegal}
              </h3>
              <nav className="flex flex-col gap-2">
                {(
                  [
                    [LEGAL_PATHS.terms, t.footer.terms],
                    [LEGAL_PATHS.privacy, t.footer.privacy],
                    [LEGAL_PATHS.cookie, t.footer.cookiePolicy],
                    [LEGAL_PATHS.eula, t.footer.eula],
                    [LEGAL_PATHS.dpa, t.footer.dpa],
                    [LEGAL_PATHS.imprint, t.footer.imprint],
                  ] as const
                ).map(([to, label]) => (
                  <Link key={to} to={to} target="_blank" rel="noopener noreferrer" className={footerTextClass} style={footerMuted}>
                    {label}
                  </Link>
                ))}
              </nav>
            </div>
          </div>

          <div className="mt-12 pt-8 border-t flex flex-col gap-2 text-xs sm:text-sm" style={{ borderColor: "var(--mkt-border)", color: "var(--mkt-text-subtle)" }}>
            <span>{t.footer.copyright}</span>
            <span className="leading-relaxed max-w-3xl">{t.footer.developedIn}</span>
          </div>
        </div>
      </footer>

      <FooterModals active={footerModal} onClose={() => setFooterModal(null)} isLight={isLight} copy={t.footer} />

      <CookieBanner />
    </div>
  );
}
