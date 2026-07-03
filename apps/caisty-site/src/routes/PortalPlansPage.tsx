// apps/caisty-site/src/routes/PortalPlansPage.tsx
import { useTheme } from "../lib/theme";
import { useLanguage } from "../lib/LanguageContext";
import { getPortalTranslations } from "../lib/translations";
import { portalPageShell, portalPageSubtitle, portalPageTitle } from "../lib/portalUi";

export default function PortalPlansPage() {
  const { language } = useLanguage();
  const { theme } = useTheme();
  const t = getPortalTranslations(language);
  const isLight = theme === "light";

  return (
    <div className={portalPageShell()}>
      <header className="space-y-1">
        <h1 className={portalPageTitle(isLight)}>{t.plansPage.title}</h1>
        <p className={portalPageSubtitle(isLight)}>{t.plansPage.comingSoon}</p>
      </header>
    </div>
  );
}
