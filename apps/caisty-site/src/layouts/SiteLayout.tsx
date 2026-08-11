import { useEffect, useState } from "react";
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
import {
  COMPANY_HOME,
  CONTACT_PATH,
  LEGAL_PATHS,
  POS_LANDING_PATH,
  STAFF_LANDING_PATH,
} from "../config/marketingRoutes";
import { CaistyLogo } from "../components/CaistyLogo";
import { DesktopProductsNavMenu, MobileProductsNavMenu } from "../components/ProductsNavMenu";

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

  useEffect(() => {
    if (!mobileOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMobileOpen(false);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [mobileOpen]);

  const navLinkClass = ({ isActive }: { isActive: boolean }) =>
    ["mkt-nav-link", isActive ? "is-active" : ""].filter(Boolean).join(" ");

  const productsCopy = {
    productsLabel: t.nav.product,
    posTitle: productMenu.posTitle,
    posStatus: productMenu.posStatus,
    businessTitle: productMenu.businessTitle,
    businessStatus: productMenu.businessStatus,
    staffTitle: productMenu.worktrackTitle,
    staffStatus: productMenu.worktrackStatus,
  };

  const footerTextClass = "text-sm transition-colors no-underline";
  const footerMuted = { color: "var(--mkt-footer-muted)" } as const;
  const footerLinkStyle = {
    ...footerMuted,
    background: "transparent",
    border: 0,
    padding: 0,
    cursor: "pointer",
    font: "inherit",
    textAlign: "start" as const,
  };

  return (
    <div
      className={`marketing-site min-h-screen flex flex-col w-full min-w-0 ${isLight ? "" : "marketing-site--dark"}`}
      style={{ background: "var(--mkt-bg)", color: "var(--mkt-text)" }}
    >
      <header
        className="sticky top-0 z-40 border-b"
        style={{
          borderColor: "var(--mkt-border)",
          background: isLight
            ? "color-mix(in srgb, var(--mkt-bg) 94%, transparent)"
            : "color-mix(in srgb, var(--mkt-bg) 94%, transparent)",
        }}
      >
        <div className="mkt-shell py-3">
          <div className="flex items-center justify-between gap-3 min-w-0">
            <Link
              to={COMPANY_HOME}
              className="flex min-w-0 shrink-0 items-center gap-3 no-underline"
              onClick={closeMobile}
            >
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

            <nav className="hidden lg:flex items-center gap-6 xl:gap-8" aria-label={t.layout.headerBrand}>
              <NavLink to={COMPANY_HOME} end className={navLinkClass}>
                {t.nav.company}
              </NavLink>
              <DesktopProductsNavMenu copy={productsCopy} />
              <NavLink to="/pricing" className={navLinkClass}>
                {t.nav.pricing}
              </NavLink>
              <NavLink to={CONTACT_PATH} className={navLinkClass}>
                {t.nav.contact}
              </NavLink>
            </nav>

            <div className="hidden lg:flex items-center gap-3 shrink-0">
              <Link to="/login" className="mkt-nav-link">
                {t.buttons.login}
              </Link>
              <Link to="/register" className="mkt-btn-primary !min-h-[2.25rem] !px-4 !text-xs !shadow-none">
                {t.buttons.register}
              </Link>
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
              className="lg:hidden inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full border"
              style={{
                borderColor: "var(--mkt-border)",
                background: "var(--mkt-bg-elevated)",
                color: "var(--mkt-text)",
              }}
              aria-expanded={mobileOpen}
              aria-controls="mkt-mobile-nav"
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
          <div
            id="mkt-mobile-nav"
            className="lg:hidden border-t"
            style={{ borderColor: "var(--mkt-border)", background: "var(--mkt-bg-elevated)" }}
          >
            <div className="mkt-shell pb-4 pt-3 space-y-1">
              <NavLink to={COMPANY_HOME} end onClick={closeMobile} className={navLinkClass}>
                {t.nav.company}
              </NavLink>
              <MobileProductsNavMenu copy={productsCopy} onNavigate={closeMobile} />
              <NavLink to="/pricing" onClick={closeMobile} className={navLinkClass}>
                {t.nav.pricing}
              </NavLink>
              <NavLink to={CONTACT_PATH} onClick={closeMobile} className={navLinkClass}>
                {t.nav.contact}
              </NavLink>
              <div className="pt-2 flex flex-col gap-2">
                <Link to="/register" onClick={closeMobile} className="mkt-btn-primary !min-h-[2.5rem] !text-sm">
                  {t.buttons.register}
                </Link>
                <Link to="/login" onClick={closeMobile} className="mkt-btn-secondary !min-h-[2.5rem] !text-sm">
                  {t.buttons.login}
                </Link>
              </div>
              {isTN && waUrl && (
                <a
                  href={waUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={closeMobile}
                  className={`${footerTextClass} block py-2`}
                  style={{ color: "var(--mkt-text-muted)" }}
                >
                  WhatsApp
                </a>
              )}
              <div
                className="flex flex-wrap items-center gap-3 pt-3 border-t"
                style={{ borderColor: "var(--mkt-border)" }}
              >
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

      <footer className="mkt-site-footer border-t" style={{ borderColor: "var(--mkt-footer-border)" }}>
        <div className="mkt-shell py-14 lg:py-16">
          <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4 lg:gap-12">
            <div className="space-y-4 min-w-0">
              <h2 className="text-lg font-bold tracking-tight m-0" style={{ color: "var(--mkt-footer-text)" }}>
                {t.footer.companyBrand}
              </h2>
              <p className="text-sm leading-relaxed max-w-md m-0" style={{ color: "var(--mkt-footer-muted)" }}>
                {t.footer.companyTagline}
              </p>
            </div>

            <div className="space-y-3 min-w-0">
              <h3
                className="text-xs font-bold uppercase tracking-wider m-0"
                style={{ color: "var(--mkt-footer-subtle)" }}
              >
                {t.footer.colCompany}
              </h3>
              <nav className="flex flex-col gap-2" aria-label={t.footer.colCompany}>
                <Link to={COMPANY_HOME} className={footerTextClass} style={footerMuted}>
                  {t.footer.linkCompany}
                </Link>
                <Link to={CONTACT_PATH} className={footerTextClass} style={footerMuted}>
                  {t.footer.linkContact}
                </Link>
                <button
                  type="button"
                  className={footerTextClass}
                  style={footerLinkStyle}
                  onClick={() => setFooterModal("company")}
                >
                  {t.footer.companyModal.title}
                </button>
              </nav>
            </div>

            <div className="space-y-3 min-w-0">
              <h3
                className="text-xs font-bold uppercase tracking-wider m-0"
                style={{ color: "var(--mkt-footer-subtle)" }}
              >
                {t.footer.colProducts}
              </h3>
              <nav className="flex flex-col gap-2" aria-label={t.footer.colProducts}>
                <Link to={POS_LANDING_PATH} className={footerTextClass} style={footerMuted}>
                  {t.footer.productPosName}
                </Link>
                <Link to={`${COMPANY_HOME}#products`} className={footerTextClass} style={footerMuted}>
                  {productMenu.businessTitle}
                </Link>
                <Link to={STAFF_LANDING_PATH} className={`${footerTextClass} mkt-footer-soon`} style={footerMuted}>
                  <span>{productMenu.worktrackTitle}</span>
                  <span className="mkt-footer-soon__badge">{productMenu.worktrackStatus}</span>
                </Link>
                <Link to="/pricing" className={footerTextClass} style={footerMuted}>
                  {t.nav.pricing}
                </Link>
              </nav>
            </div>

            <div className="space-y-3 min-w-0">
              <h3
                className="text-xs font-bold uppercase tracking-wider m-0"
                style={{ color: "var(--mkt-footer-subtle)" }}
              >
                {t.footer.colLegal}
              </h3>
              <nav className="flex flex-col gap-2" aria-label={t.footer.colLegal}>
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
                  <Link
                    key={to}
                    to={to}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={footerTextClass}
                    style={footerMuted}
                  >
                    {label}
                  </Link>
                ))}
              </nav>
            </div>
          </div>

          <div
            className="mt-12 pt-8 border-t flex flex-col gap-2 text-xs sm:text-sm"
            style={{ borderColor: "var(--mkt-footer-border)", color: "var(--mkt-footer-subtle)" }}
          >
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
