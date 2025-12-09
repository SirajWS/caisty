// apps/caisty-site/src/routes/PortalLoginSuccessPage.tsx
import { useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { storePortalToken } from "../lib/portalApi";

export function PortalLoginSuccessPage() {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const token = params.get("token");
    // const state = params.get("state") || "login"; // Für zukünftige Verwendung (z.B. unterschiedliche Weiterleitung)

    if (!token) {
      // Kein Token → zurück auf Login
      navigate("/login", { replace: true });
      return;
    }

    // Token im LocalStorage speichern
    storePortalToken(token);

    // Wenn state=register → nach /portal (Dashboard)
    // Wenn state=login → auch nach /portal
    // (später könntest du hier unterscheiden)
    navigate("/portal", { replace: true });
  }, [location, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950 text-slate-100">
      <div className="rounded-xl border border-slate-700 bg-slate-900 px-6 py-4 shadow-lg">
        <p className="text-sm text-slate-300">
          Du wirst in dein Caisty-Konto eingeloggt&hellip;
        </p>
      </div>
    </div>
  );
}

export default PortalLoginSuccessPage;

