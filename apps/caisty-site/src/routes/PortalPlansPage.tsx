// apps/caisty-site/src/routes/PortalPlansPage.tsx
import { useLanguage } from "../lib/LanguageContext";
import { getPortalTranslations } from "../lib/translations";

export default function PortalPlansPage() {
  const { language } = useLanguage();
  const t = getPortalTranslations(language);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold mb-4">{t.plansPage.title}</h1>
      <p className="text-slate-400">{t.plansPage.comingSoon}</p>
    </div>
  );
}
