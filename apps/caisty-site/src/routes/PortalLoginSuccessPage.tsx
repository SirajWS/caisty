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
      
      // Prüfe, ob wir auf der richtigen Domain/Port sind (Kundenportal, nicht Admin)
      const currentUrl = window.location.href;
      const currentHost = window.location.host;
      const currentPort = window.location.port;
      
      console.log("🔍 PortalLoginSuccessPage - Current URL:", currentUrl);
      console.log("🔍 PortalLoginSuccessPage - Current Host:", currentHost);
      console.log("🔍 PortalLoginSuccessPage - Current Port:", currentPort);
      
      // Wenn wir auf Port 5173 (Admin) sind, zur korrekten Portal-URL weiterleiten
      if (currentPort === "5173" || currentHost.includes("5173") || currentUrl.includes(":5173")) {
        console.warn("⚠️ Auf Admin-Port (5173) erkannt, leite zum Kundenportal (5175) weiter...");
        const portalUrl = currentUrl
          .replace(":5173", ":5175")
          .replace(/\/admin.*$/, "")
          .replace(/\/portal\/login\/success.*$/, "/portal/login/success") + `?token=${encodeURIComponent(token)}`;
        console.log("🔍 Redirecting to:", portalUrl);
        window.location.href = portalUrl;
        return;
      }
      
      // Kurze Verzögerung, damit localStorage gesetzt ist, dann weiterleiten
      setTimeout(() => {
        console.log("✅ Weiterleitung zu /portal");
        navigate("/portal", { replace: true });
      }, 50);
    } else {
      // Kein Token → zurück zum Login mit Fehlermeldung
      console.error("❌ Kein Token in URL-Parametern");
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

