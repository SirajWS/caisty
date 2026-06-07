// apps/caisty-site/src/routes/PortalLayout.tsx
import React from "react";
import {
  NavLink,
  Outlet,
  useLocation,
  useNavigate,
  useOutletContext,
} from "react-router-dom";
import {
  fetchPortalMe,
  clearPortalToken,
  type PortalCustomer,
} from "../lib/portalApi";
import { Button } from "../components/ui/Button";
import ThemeToggle from "../components/ThemeToggle";
import LanguageSelector from "../components/LanguageSelector";
import { useTheme } from "../lib/theme";
import { useLanguage } from "../lib/LanguageContext";
import { getPortalTranslations } from "../lib/translations";

export interface PortalOutletContext {
  customer: PortalCustomer;
  setCustomer: React.Dispatch<React.SetStateAction<PortalCustomer | null>>;
}

export function usePortalOutlet() {
  return useOutletContext<PortalOutletContext>();
}

export function usePortalCustomer() {
  return usePortalOutlet().customer;
}

export default function PortalLayout() {
  const { language } = useLanguage();
  const t = getPortalTranslations(language);
  const { theme } = useTheme();
  const isLight = theme === "light";
  const [customer, setCustomer] = React.useState<PortalCustomer | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [mobileNavOpen, setMobileNavOpen] = React.useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  React.useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const me = await fetchPortalMe();
        if (cancelled) return;

        if (!me) {
          clearPortalToken();
          navigate("/login", {
            replace: true,
            state: { from: location.pathname },
          });
          return;
        }

        setCustomer(me);
      } catch (err) {
        console.error(err);
        if (!cancelled) {
          clearPortalToken();
          navigate("/login", {
            replace: true,
            state: { from: location.pathname },
          });
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [navigate, location.pathname]);

  React.useEffect(() => {
    setMobileNavOpen(false);
  }, [location.pathname]);

  function handleLogout() {
    clearPortalToken();
    navigate("/login", { replace: true });
  }

  const shellBg = isLight ? "bg-[#f8fafc] text-slate-900" : "bg-[#0B1220] text-slate-100";
  const headerBar = isLight
    ? "border-slate-200/90 bg-white/90"
    : "border-white/[0.08] bg-[#0B1220]/90";

  if (loading || !customer) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${shellBg}`}>
        <div className="space-y-3 text-center">
          <div className="h-9 w-9 rounded-full border-2 border-orange-500 border-t-transparent animate-spin mx-auto" />
          <p className={`text-sm ${isLight ? "text-slate-600" : "text-slate-400"}`}>
            {t.layout.loading}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen flex flex-col ${shellBg}`}>
      <header className={`sticky top-0 z-40 border-b backdrop-blur-md ${headerBar}`}>
        <div className="max-w-6xl mx-auto px-4 sm:px-5 py-3 flex items-center justify-between gap-3 min-w-0">
          <div className="flex items-center gap-2.5 min-w-0 shrink-0">
            <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-orange-500 text-sm font-bold text-white shadow-sm">
              C
            </span>
            <div className="leading-tight min-w-0">
              <div className={`text-sm font-semibold tracking-tight truncate ${isLight ? "text-[#0B1220]" : "text-white"}`}>
                {t.layout.taglineTitle}
              </div>
              <div className={`text-[11px] truncate ${isLight ? "text-slate-500" : "text-slate-400"}`}>
                {t.layout.taglineSubtitle}
              </div>
            </div>
          </div>

          <div className="hidden lg:flex items-center gap-5 min-w-0 flex-1 justify-end">
            <nav className="flex items-center gap-1 text-[13px] font-medium flex-wrap justify-end">
              <PortalNavLink to="/portal">{t.layout.navDashboard}</PortalNavLink>
              <PortalNavLink to="/portal/licenses">{t.layout.navLicenses}</PortalNavLink>
              <PortalNavLink to="/portal/plan">{t.layout.navPlans}</PortalNavLink>
              <PortalNavLink to="/portal/devices">{t.layout.navDevices}</PortalNavLink>
              <PortalNavLink to="/portal/invoices">{t.layout.navInvoices}</PortalNavLink>
              <PortalNavLink to="/portal/support">{t.layout.navSupport}</PortalNavLink>
              <PortalNavLink to="/portal/account">{t.layout.navAccount}</PortalNavLink>
            </nav>

            <div
              className={`flex items-center gap-3 shrink-0 pl-2 border-l ${
                isLight ? "border-slate-200" : "border-white/10"
              }`}
            >
              <LanguageSelector />
              <ThemeToggle />
              <div className="hidden xl:flex flex-col items-end max-w-[200px]">
                <span className={`text-xs font-semibold truncate w-full text-end ${isLight ? "text-slate-900" : "text-slate-100"}`}>
                  {customer.name}
                </span>
                <span className={`text-[11px] truncate w-full text-end ${isLight ? "text-slate-500" : "text-slate-400"}`}>
                  {customer.email}
                </span>
              </div>
              <Button
                variant="outline"
                size="sm"
                type="button"
                onClick={handleLogout}
                className={
                  isLight
                    ? "!border-slate-300 !text-slate-800 hover:!bg-slate-50"
                    : "!border-white/20 !text-white hover:!bg-white/[0.06]"
                }
              >
                {t.layout.logout}
              </Button>
            </div>
          </div>

          <button
            type="button"
            className={`lg:hidden inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full border ${
              isLight
                ? "border-slate-300 bg-white text-slate-800"
                : "border-white/15 bg-white/[0.04] text-slate-100"
            }`}
            onClick={() => setMobileNavOpen((open) => !open)}
            aria-label={t.layout.menuOpenAria}
          >
            <span className="sr-only">{t.layout.menuSr}</span>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
              {mobileNavOpen ? <path d="M6 18L18 6M6 6l12 12" /> : <path d="M4 6h16M4 12h16M4 18h16" />}
            </svg>
          </button>
        </div>

        {mobileNavOpen && (
          <div
            className={`lg:hidden border-t max-h-[min(70vh,calc(100dvh-8rem))] overflow-y-auto ${
              isLight ? "border-slate-200 bg-white" : "border-white/[0.08] bg-[#0B1220]"
            }`}
          >
            <div className="max-w-6xl mx-auto px-4 pb-4 pt-3 space-y-4">
              <nav className="flex flex-col gap-1 text-sm font-medium">
                <PortalNavLink to="/portal" block>
                  {t.layout.navDashboard}
                </PortalNavLink>
                <PortalNavLink to="/portal/licenses" block>
                  {t.layout.navLicenses}
                </PortalNavLink>
                <PortalNavLink to="/portal/plan" block>
                  {t.layout.navPlans}
                </PortalNavLink>
                <PortalNavLink to="/portal/devices" block>
                  {t.layout.navDevices}
                </PortalNavLink>
                <PortalNavLink to="/portal/invoices" block>
                  {t.layout.navInvoices}
                </PortalNavLink>
                <PortalNavLink to="/portal/support" block>
                  {t.layout.navSupport}
                </PortalNavLink>
                <PortalNavLink to="/portal/account" block>
                  {t.layout.navAccount}
                </PortalNavLink>
              </nav>

              <div className={`flex flex-wrap items-center gap-3 pt-2 border-t ${isLight ? "border-slate-200" : "border-white/10"}`}>
                <LanguageSelector />
                <ThemeToggle />
                <div className="flex flex-col min-w-0 flex-1">
                  <span className={`text-xs font-semibold truncate ${isLight ? "text-slate-900" : "text-white"}`}>
                    {customer.name}
                  </span>
                  <span className={`text-[11px] truncate ${isLight ? "text-slate-500" : "text-slate-400"}`}>
                    {customer.email}
                  </span>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  type="button"
                  onClick={handleLogout}
                  className={
                    isLight
                      ? "!border-slate-300 !text-slate-800"
                      : "!border-white/20 !text-white"
                  }
                >
                  {t.layout.logout}
                </Button>
              </div>
            </div>
          </div>
        )}
      </header>

      <main className="flex-1 min-w-0">
        <div className="max-w-6xl mx-auto px-4 sm:px-5 py-8 sm:py-10 w-full min-w-0">
          <Outlet context={{ customer, setCustomer }} />
        </div>
      </main>
    </div>
  );
}

interface PortalNavLinkProps {
  to: string;
  children: React.ReactNode;
  block?: boolean;
}

function PortalNavLink({ to, children, block }: PortalNavLinkProps) {
  const { theme } = useTheme();
  const isLight = theme === "light";
  return (
    <NavLink
      to={to}
      end={to === "/portal"}
      className={({ isActive }) =>
        [
          block ? "px-3 py-2.5 rounded-xl text-left w-full" : "px-3 py-1.5 rounded-full whitespace-nowrap",
          "transition-colors",
          isActive
            ? "bg-orange-500 text-white shadow-sm font-semibold"
            : isLight
              ? "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
              : "text-slate-400 hover:bg-white/[0.06] hover:text-white",
        ].join(" ")
      }
    >
      {children}
    </NavLink>
  );
}
