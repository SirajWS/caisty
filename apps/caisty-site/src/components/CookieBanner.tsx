import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { LEGAL_PATHS } from "../config/marketingRoutes";
import { useLanguage } from "../lib/LanguageContext";
import { translations } from "../lib/translations/index";
import { useTheme } from "../lib/theme";
import {
  ALL_OPTIONAL_COOKIES,
  DEFAULT_OPTIONAL_COOKIES,
  OPEN_COOKIE_PREFERENCES_EVENT,
  readCookieConsent,
  writeCookieConsent,
  type OptionalCookieCategories,
} from "../lib/cookieConsent";

export default function CookieBanner() {
  const { language } = useLanguage();
  const { theme } = useTheme();
  const t = translations[language].common.cookieBanner;
  const isLight = theme === "light";

  const [visible, setVisible] = useState(false);
  const [customizeOpen, setCustomizeOpen] = useState(false);
  const [optional, setOptional] = useState<OptionalCookieCategories>(DEFAULT_OPTIONAL_COOKIES);

  useEffect(() => {
    const existing = readCookieConsent();
    if (!existing) {
      setVisible(true);
      return;
    }
    setOptional(existing.optional);
  }, []);

  useEffect(() => {
    function onOpenPreferences() {
      const existing = readCookieConsent();
      if (existing) setOptional(existing.optional);
      setCustomizeOpen(true);
      setVisible(true);
    }
    window.addEventListener(OPEN_COOKIE_PREFERENCES_EVENT, onOpenPreferences);
    return () => window.removeEventListener(OPEN_COOKIE_PREFERENCES_EVENT, onOpenPreferences);
  }, []);

  function save(choices: OptionalCookieCategories) {
    writeCookieConsent(choices);
    setOptional(choices);
    setCustomizeOpen(false);
    setVisible(false);
  }

  if (!visible) return null;

  const shell = isLight
    ? "border-slate-200 bg-white/95 text-slate-800 shadow-xl"
    : "border-white/10 bg-[#0f172a]/95 text-slate-100 shadow-2xl";
  const muted = isLight ? "text-slate-600" : "text-slate-400";
  const panel = isLight ? "border-slate-200 bg-slate-50" : "border-white/10 bg-white/[0.04]";
  const toggleRow = isLight ? "border-slate-200" : "border-white/10";

  return (
    <div
      className="fixed inset-x-0 bottom-0 z-[90] p-4 sm:p-5 pointer-events-none"
      role="region"
      aria-label={t.regionLabel}
    >
      <div className={`pointer-events-auto mx-auto max-w-4xl rounded-2xl border backdrop-blur-md ${shell}`}>
        <div className="p-4 sm:p-5 space-y-4">
          <div className="space-y-2">
            <h2 className="text-sm sm:text-base font-bold lp-font-heading">{t.title}</h2>
            <p className={`text-xs sm:text-sm leading-relaxed ${muted}`}>
              {t.description}{" "}
              <Link to={LEGAL_PATHS.cookie} target="_blank" rel="noopener noreferrer" className="text-[#f97316] hover:underline no-underline font-medium">
                {t.policyLink}
              </Link>
              {" · "}
              <Link to={LEGAL_PATHS.privacy} target="_blank" rel="noopener noreferrer" className="text-[#f97316] hover:underline no-underline font-medium">
                {t.privacyLink}
              </Link>
            </p>
          </div>

          {customizeOpen && (
            <div className={`rounded-xl border p-3 sm:p-4 space-y-3 text-xs sm:text-sm ${panel}`}>
              <ToggleRow
                label={t.categories.necessary}
                hint={t.categories.necessaryHint}
                checked
                disabled
                muted={muted}
                rowClass={toggleRow}
              />
              <ToggleRow
                label={t.categories.preferences}
                hint={t.categories.preferencesHint}
                checked={optional.preferences}
                onChange={(v) => setOptional((o) => ({ ...o, preferences: v }))}
                muted={muted}
                rowClass={toggleRow}
              />
              <ToggleRow
                label={t.categories.functional}
                hint={t.categories.functionalHint}
                checked={optional.functional}
                onChange={(v) => setOptional((o) => ({ ...o, functional: v }))}
                muted={muted}
                rowClass={toggleRow}
              />
              <ToggleRow
                label={t.categories.analytics}
                hint={t.categories.analyticsHint}
                checked={optional.analytics}
                onChange={(v) => setOptional((o) => ({ ...o, analytics: v }))}
                muted={muted}
                rowClass={toggleRow}
              />
              <ToggleRow
                label={t.categories.performance}
                hint={t.categories.performanceHint}
                checked={optional.performance}
                onChange={(v) => setOptional((o) => ({ ...o, performance: v }))}
                muted={muted}
                rowClass={toggleRow}
              />
            </div>
          )}

          <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
            <button type="button" className="lp-cta-primary justify-center text-sm py-2.5 min-h-[44px]" onClick={() => save(ALL_OPTIONAL_COOKIES)}>
              {t.acceptAll}
            </button>
            <button
              type="button"
              className={`justify-center text-sm py-2.5 min-h-[44px] rounded-full border px-5 font-semibold transition-colors ${
                isLight ? "border-slate-300 bg-white text-slate-800 hover:bg-slate-50" : "border-white/15 bg-white/[0.04] text-slate-100 hover:bg-white/10"
              }`}
              onClick={() => save(DEFAULT_OPTIONAL_COOKIES)}
            >
              {t.rejectOptional}
            </button>
            <button
              type="button"
              className={`justify-center text-sm py-2.5 min-h-[44px] rounded-full border px-5 font-semibold transition-colors ${
                isLight ? "border-slate-300 bg-white text-slate-800 hover:bg-slate-50" : "border-white/15 bg-white/[0.04] text-slate-100 hover:bg-white/10"
              }`}
              onClick={() => (customizeOpen ? save(optional) : setCustomizeOpen(true))}
            >
              {customizeOpen ? t.savePreferences : t.customize}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function ToggleRow(props: {
  label: string;
  hint: string;
  checked: boolean;
  disabled?: boolean;
  muted: string;
  rowClass: string;
  onChange?: (value: boolean) => void;
}) {
  const { label, hint, checked, disabled, muted, rowClass, onChange } = props;
  return (
    <label className={`flex items-start justify-between gap-3 border-b pb-3 last:border-0 last:pb-0 ${rowClass}`}>
      <span className="min-w-0">
        <span className="block font-semibold">{label}</span>
        <span className={`block text-xs mt-0.5 ${muted}`}>{hint}</span>
      </span>
      <input
        type="checkbox"
        className="mt-1 h-4 w-4 shrink-0 accent-[#f97316]"
        checked={checked}
        disabled={disabled}
        onChange={(e) => onChange?.(e.target.checked)}
      />
    </label>
  );
}
