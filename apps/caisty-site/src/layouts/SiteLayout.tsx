import { Outlet, Link, NavLink } from "react-router-dom";

function NavItem(props: { to: string; children: React.ReactNode }) {
  return (
    <NavLink
      to={props.to}
      className={({ isActive }) =>
        [
          "text-sm",
          isActive
            ? "text-emerald-400"
            : "text-slate-300 hover:text-slate-100",
        ].join(" ")
      }
    >
      {props.children}
    </NavLink>
  );
}

export default function SiteLayout() {
  return (
    <div className="min-h-screen flex flex-col bg-slate-950 text-slate-50">
      {/* Top-Bar */}
      <header className="border-b border-slate-800 bg-slate-950/80 backdrop-blur">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between gap-4">
          <Link to="/" className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-xl bg-emerald-500/90 flex items-center justify-center text-slate-950 font-bold text-sm">
              C
            </div>
            <div className="flex flex-col leading-tight">
              <span className="font-semibold text-sm">Caisty</span>
              <span className="text-xs text-slate-400">
                POS &amp; Cloud Platform
              </span>
            </div>
          </Link>

          <nav className="flex items-center gap-6">
            <NavItem to="/">Produkt</NavItem>
            <NavItem to="/pricing">Preise</NavItem>
            {/* Später z.B. /portal */}
          </nav>

          <div className="flex items-center gap-3">
            <Link
              to="/login"
              className="text-sm text-slate-300 hover:text-slate-100"
            >
              Login
            </Link>
            <Link
              to="/register"
              className="text-sm px-3 py-1.5 rounded-full bg-emerald-500 text-slate-950 font-medium hover:bg-emerald-400"
            >
              Kostenlos starten
            </Link>
          </div>
        </div>
      </header>

      {/* Seiteninhalt */}
      <main className="flex-1">
        <div className="max-w-6xl mx-auto px-4 py-12">
          <Outlet />
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800 bg-slate-950">
        <div className="max-w-6xl mx-auto px-4 py-6 flex flex-col sm:flex-row justify-between gap-3 text-xs text-slate-400">
          <span>© {new Date().getFullYear()} Caisty – All rights reserved.</span>
          <span>AGB · Datenschutz (Platzhalter)</span>
        </div>
      </footer>
    </div>
  );
}
