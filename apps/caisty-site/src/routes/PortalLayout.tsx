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

export interface PortalOutletContext {
  customer: PortalCustomer;
  setCustomer: React.Dispatch<React.SetStateAction<PortalCustomer | null>>;
}

// ⬅️ alter Hook-Name, den andere Dateien erwarten
export function usePortalOutlet() {
  return useOutletContext<PortalOutletContext>();
}

// ⬅️ bequemer Hook nur für den Customer
export function usePortalCustomer() {
  return usePortalOutlet().customer;
}

export default function PortalLayout() {
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

  function handleLogout() {
    clearPortalToken();
    navigate("/login", { replace: true });
  }

  if (loading || !customer) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center">
        <div className="space-y-3 text-center">
          <div className="h-8 w-8 rounded-full border-2 border-emerald-500 border-t-transparent animate-spin mx-auto" />
          <p className="text-sm text-slate-400">Kundenportal wird geladen…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-slate-950 text-slate-100">
      <header className="border-b border-slate-800 bg-slate-950/80 backdrop-blur">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between gap-4">
          {/* Logo / Titel */}
          <div className="flex items-center gap-2">
            <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-emerald-500 text-slate-950 font-semibold">
              C
            </span>
            <div className="leading-tight">
              <div className="text-sm font-semibold">Caisty Portal</div>
              <div className="text-[11px] text-slate-400">
                POS &amp; Cloud-Konto
              </div>
            </div>
          </div>

          {/* Desktop-Navigation */}
          <div className="hidden md:flex items-center gap-4">
            <nav className="flex items-center gap-2 text-xs md:text-sm">
              {/* Reihenfolge: Dashboard · Lizenzen · Pläne · Geräte · Rechnungen · Support · Konto */}
              <PortalNavLink to="/portal">Dashboard</PortalNavLink>
              <PortalNavLink to="/portal/licenses">Lizenzen</PortalNavLink>
              <PortalNavLink to="/portal/plan">Pläne</PortalNavLink>
              <PortalNavLink to="/portal/devices">Geräte</PortalNavLink>
              <PortalNavLink to="/portal/invoices">Rechnungen</PortalNavLink>
              <PortalNavLink to="/portal/support">Support</PortalNavLink> {/* ⬅️ NEU */}
              <PortalNavLink to="/portal/account">Konto</PortalNavLink>
            </nav>

            <div className="flex items-center gap-3">
              <div className="hidden sm:flex flex-col items-end">
                <span className="text-xs font-medium truncate max-w-[160px]">
                  {customer.name}
                </span>
                <span className="text-[11px] text-slate-400 truncate max-w-[200px]">
                  {customer.email}
                </span>
              </div>
              <Button
                variant="outline"
                size="sm"
                type="button"
                onClick={handleLogout}
              >
                Logout
              </Button>
            </div>
          </div>

          {/* Mobile-Burger */}
          <button
            type="button"
            className="md:hidden inline-flex h-8 w-8 items-center justify-center rounded-full border border-slate-700 bg-slate-900 text-slate-200"
            onClick={() => setMobileNavOpen((open) => !open)}
            aria-label="Portal-Navigation öffnen oder schließen"
          >
            <span className="sr-only">Menü</span>
            <div className="space-y-1">
              <span className="block h-0.5 w-4 rounded-full bg-slate-200" />
              <span className="block h-0.5 w-4 rounded-full bg-slate-200" />
              <span className="block h-0.5 w-4 rounded-full bg-slate-200" />
            </div>
          </button>
        </div>

        {/* Mobile-Navigation */}
        {mobileNavOpen && (
          <div className="md:hidden border-t border-slate-800 bg-slate-950/95">
            <div className="max-w-5xl mx-auto px-4 pb-3 pt-2 space-y-3">
              <nav className="flex flex-wrap gap-2 text-xs">
                {/* gleiche Reihenfolge wie Desktop */}
                <PortalNavLink to="/portal">Dashboard</PortalNavLink>
                <PortalNavLink to="/portal/licenses">Lizenzen</PortalNavLink>
                <PortalNavLink to="/portal/plan">Pläne</PortalNavLink>
                <PortalNavLink to="/portal/devices">Geräte</PortalNavLink>
                <PortalNavLink to="/portal/invoices">Rechnungen</PortalNavLink>
                <PortalNavLink to="/portal/support">Support</PortalNavLink> {/* ⬅️ NEU */}
                <PortalNavLink to="/portal/account">Konto</PortalNavLink>
              </nav>

              <div className="flex items-center justify-between gap-3">
                <div className="flex flex-col">
                  <span className="text-xs font-medium truncate max-w-[160px]">
                    {customer.name}
                  </span>
                  <span className="text-[11px] text-slate-400 truncate max-w-[200px]">
                    {customer.email}
                  </span>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  type="button"
                  onClick={handleLogout}
                >
                  Logout
                </Button>
              </div>
            </div>
          </div>
        )}
      </header>

      <main className="flex-1">
        <div className="max-w-5xl mx-auto px-4 py-8">
          <Outlet context={{ customer, setCustomer }} />
        </div>
      </main>
    </div>
  );
}

interface PortalNavLinkProps {
  to: string;
  children: React.ReactNode;
}

function PortalNavLink({ to, children }: PortalNavLinkProps) {
  return (
    <NavLink
      to={to}
      end={to === "/portal"}
      className={({ isActive }) =>
        [
          "px-2 py-1 rounded-full transition-colors",
          isActive
            ? "bg-emerald-500 text-slate-950 font-semibold"
            : "text-slate-300 hover:bg-slate-800",
        ].join(" ")
      }
    >
      {children}
    </NavLink>
  );
}

