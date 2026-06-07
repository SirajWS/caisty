// apps/caisty-site/src/routes/PortalLoginSuccessPage.tsx
import { useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { storePortalToken } from "../lib/portalApi";
import { useLanguage } from "../lib/LanguageContext";
import { getPortalTranslations } from "../lib/translations";

export default function PortalLoginSuccessPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { language } = useLanguage();
  const t = getPortalTranslations(language);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const token = params.get("token");

    if (!token) {
      navigate("/login", { replace: true });
      return;
    }

    storePortalToken(token);
    navigate("/portal", { replace: true });
  }, [location, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950 text-slate-100">
      <div className="rounded-xl border border-slate-700 bg-slate-900 px-6 py-4 shadow-lg">
        <p className="text-sm text-slate-300">
          {t.loginSuccess.signingIn}
        </p>
      </div>
    </div>
  );
}
