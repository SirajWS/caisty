import React from "react";
import {
  NavLink,
  Outlet,
  useLocation,
  useNavigate,
  useOutletContext,
} from "react-router-dom";
import {
  CreditCard,
  HardDrive,
  KeyRound,
  LayoutDashboard,
  LifeBuoy,
  LogOut,
  Menu,
  Receipt,
  User,
  X,
} from "lucide-react";
import {
  fetchPortalMe,
  clearPortalToken,
  type PortalCustomer,
} from "../lib/portalApi";
import ThemeToggle from "../components/ThemeToggle";
import LanguageSelector from "../components/LanguageSelector";
import { useTheme } from "../lib/theme";
import { useLanguage } from "../lib/LanguageContext";
import { getPortalTranslations } from "../lib/translations";
import { CaistyLogo } from "../components/CaistyLogo";

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

type NavItem = { to: string; label: string; icon: React.ReactNode; end?: boolean };

function usePortalNavItems(): NavItem[] {
  const { language } = useLanguage();
  const t = getPortalTranslations(language);
  return [
    { to: "/portal", label: t.layout.navDashboard, icon: <LayoutDashboard size={18} />, end: true },
    { to: "/portal/licenses", label: t.layout.navLicenses, icon: <KeyRound size={18} /> },
    { to: "/portal/plan", label: t.layout.navPlans, icon: <CreditCard size={18} /> },
    { to: "/portal/devices", label: t.layout.navDevices, icon: <HardDrive size={18} /> },
    { to: "/portal/invoices", label: t.layout.navInvoices, icon: <Receipt size={18} /> },
    { to: "/portal/support", label: t.layout.navSupport, icon: <LifeBuoy size={18} /> },
    { to: "/portal/account", label: t.layout.navAccount, icon: <User size={18} /> },
  ];
}

function pageTitle(pathname: string, items: NavItem[]): string {
  const match = items.find((item) =>
    item.end ? pathname === item.to : pathname.startsWith(item.to),
  );
  return match?.label ?? "Portal";
}

export default function PortalLayout() {
  const { language } = useLanguage();
  const t = getPortalTranslations(language);
  const { theme } = useTheme();
  const navItems = usePortalNavItems();
  const [customer, setCustomer] = React.useState<PortalCustomer | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [mobileOpen, setMobileOpen] = React.useState(false);
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
    setMobileOpen(false);
  }, [location.pathname]);

  React.useEffect(() => {
    const assignTableLabels = () => {
      const tables = Array.from(
        document.querySelectorAll<HTMLTableElement>(".portal-table"),
      );
      for (const table of tables) {
        const headers = Array.from(table.querySelectorAll("thead th")).map((th) =>
          (th.textContent || "").trim(),
        );
        const rows = Array.from(table.querySelectorAll("tbody tr"));
        for (const row of rows) {
          const cells = Array.from(row.querySelectorAll("td"));
          cells.forEach((cell, i) => {
            if (!cell.getAttribute("data-label")) {
              const label = headers[i] || "Value";
              cell.setAttribute("data-label", label);
            }
          });
        }
      }
    };

    assignTableLabels();
    const timer = window.setTimeout(assignTableLabels, 120);
    window.addEventListener("resize", assignTableLabels);
    return () => {
      window.clearTimeout(timer);
      window.removeEventListener("resize", assignTableLabels);
    };
  }, [location.pathname, loading, customer]);

  function handleLogout() {
    clearPortalToken();
    navigate("/login", { replace: true });
  }

  if (loading || !customer) {
    return (
      <div className={`portal-loading portal-root portal-root--${theme}`}>
        <div className="space-y-3 text-center">
          <div className="h-9 w-9 rounded-full border-2 border-orange-500 border-t-transparent animate-spin mx-auto" />
          <p className="text-sm" style={{ color: "var(--portal-muted)" }}>
            {t.layout.loading}
          </p>
        </div>
      </div>
    );
  }

  const title = pageTitle(location.pathname, navItems);

  return (
    <div className={`portal-root portal-root--${theme}`}>
      <aside className={`portal-sidebar ${mobileOpen ? "is-open" : ""}`}>
        <div className="portal-brand">
          <CaistyLogo className="portal-logo-svg" />
          <div className="portal-brand-copy">
            <span className="portal-brand-main">{t.layout.taglineTitle}</span>
            <span className="portal-brand-sub">{t.layout.taglineSubtitle}</span>
          </div>
        </div>
        <nav className="portal-nav">
          {navItems.map((item) => {
            const active = item.end
              ? location.pathname === item.to
              : location.pathname.startsWith(item.to);
            return (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={`portal-nav-link ${active ? "is-active" : ""}`}
              >
                {item.icon}
                <span>{item.label}</span>
              </NavLink>
            );
          })}
        </nav>
      </aside>

      <div
        className={`portal-backdrop ${mobileOpen ? "is-open" : ""}`}
        onClick={() => setMobileOpen(false)}
        aria-hidden
      />

      <div className="portal-main">
        <header className="portal-topbar">
          <div className="portal-topbar-left">
            <button
              type="button"
              className="portal-icon-btn portal-mobile-only"
              onClick={() => setMobileOpen((v) => !v)}
              aria-label={t.layout.menuOpenAria}
            >
              {mobileOpen ? <X size={18} /> : <Menu size={18} />}
            </button>
            <div className="portal-page-meta">
              <LayoutDashboard size={16} />
              <span>{title}</span>
            </div>
          </div>

          <div className="portal-topbar-right">
            <LanguageSelector variant="compact" />
            <ThemeToggle variant="compact" />
            <button
              type="button"
              onClick={handleLogout}
              className="portal-icon-btn portal-icon-btn--danger"
              title={t.layout.logout}
              aria-label={t.layout.logout}
            >
              <LogOut size={16} />
            </button>
            <div className="portal-user-chip">
              <span className="portal-user-name">{customer.name}</span>
              <span className="portal-user-email">{customer.email}</span>
            </div>
          </div>
        </header>

        <main className="portal-content">
          <div className="portal-content-inner">
            <Outlet context={{ customer, setCustomer }} />
          </div>
        </main>
      </div>
    </div>
  );
}
