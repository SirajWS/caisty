// apps/caisty-site/src/routes/PortalLoginSuccessPage.tsx
import React from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { setStoredPortalToken } from "../lib/portalApi";

export default function PortalLoginSuccessPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");

  React.useEffect(() => {
    if (token) {
      // Token sofort speichern
      setStoredPortalToken(token);
      // Kurze Verzögerung, damit localStorage gesetzt ist, dann weiterleiten
      setTimeout(() => {
        navigate("/portal", { replace: true });
      }, 50);
    } else {
      // Kein Token → zurück zum Login mit Fehlermeldung
      navigate("/login?error=missing_token", { replace: true });
    }
  }, [token, navigate]);

  return (
    <div className="min-h-[calc(100vh-80px)] flex items-center justify-center py-8">
      <div className="text-center space-y-4">
        <div className="h-8 w-8 rounded-full border-2 border-emerald-500 border-t-transparent animate-spin mx-auto" />
        <p className="text-sm text-slate-300">Anmeldung erfolgreich, weiterleitung…</p>
      </div>
    </div>
  );
}

