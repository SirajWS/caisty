import LanguageSelector from "../LanguageSelector";
import ThemeToggle from "../ThemeToggle";
import type { PortalTranslations } from "../../lib/translations/portal";

export function AccountPreferences({
  languageLabel,
  themeLabel,
  t,
}: {
  languageLabel: string;
  themeLabel: string;
  t: PortalTranslations;
}) {
  const c = t.account.center;

  return (
    <section className="dashboard-panel account-preferences">
      <h2 className="dashboard-panel-title">{c.sectionPreferences}</h2>
      <dl className="account-pref-list">
        <div className="account-pref-row">
          <dt>{c.prefLanguage}</dt>
          <dd className="account-pref-value">
            <span>{languageLabel}</span>
            <LanguageSelector variant="compact" />
          </dd>
        </div>
        <div className="account-pref-row">
          <dt>{c.prefTheme}</dt>
          <dd className="account-pref-value">
            <span>{themeLabel}</span>
            <ThemeToggle variant="compact" />
          </dd>
        </div>
      </dl>
    </section>
  );
}
