import { Outlet, Link } from "react-router-dom";

export default function PortalLayout() {
  return (
    <div className="min-h-screen flex flex-col bg-slate-950 text-slate-100">
      <header className="border-b border-slate-800">
        <div className="max-w-5xl mx-auto px-4 py-3 flex justify-between">
          <Link to="/" className="font-semibold">
            Caisty Portal
          </Link>
          <nav className="text-sm">
            <Link to="/portal">Dashboard</Link>
          </nav>
        </div>
      </header>

      <main className="flex-1">
        <div className="max-w-5xl mx-auto px-4 py-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
