import { LEGAL_PATHS } from "../config/marketingRoutes";
import { LegalDocumentLink } from "./LegalDocumentLink";
import { useLanguage } from "../lib/LanguageContext";
import { translations } from "../lib/translations/index";
import { isLanguage } from "../lib/translations/types";

type LegalAgreementCheckboxProps = {
  checked: boolean;
  onChange: (checked: boolean) => void;
  /** Auth pages support light/dark; portal checkout uses dark styling. */
  variant?: "auth-light" | "auth-dark" | "portal-dark";
  id?: string;
};

export function LegalAgreementCheckbox({
  checked,
  onChange,
  variant = "auth-dark",
  id = "legal-consent",
}: LegalAgreementCheckboxProps) {
  const { language } = useLanguage();
  const lang = isLanguage(language) ? language : "en";
  const t = translations[lang].common.legalConsent;

  const linkClass =
    variant === "auth-light"
      ? "font-medium text-orange-600 hover:text-orange-700 hover:underline"
      : "font-medium text-orange-400 hover:text-orange-300 hover:underline";

  const labelClass =
    variant === "auth-light"
      ? "text-xs leading-relaxed text-slate-600"
      : variant === "portal-dark"
        ? "text-xs leading-relaxed text-slate-400"
        : "text-xs leading-relaxed text-slate-400";

  const stopPropagation = (e: React.MouseEvent) => e.stopPropagation();

  return (
    <label
      htmlFor={id}
      className={`flex cursor-pointer items-start gap-2.5 ${labelClass}`}
    >
      <input
        id={id}
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="mt-0.5 h-4 w-4 shrink-0 accent-orange-500"
      />
      <span>
        {t.prefix}
        <LegalDocumentLink to={LEGAL_PATHS.terms} className={linkClass} onClick={stopPropagation}>
          {t.terms}
        </LegalDocumentLink>
        {t.betweenTermsPrivacy}
        <LegalDocumentLink to={LEGAL_PATHS.privacy} className={linkClass} onClick={stopPropagation}>
          {t.privacy}
        </LegalDocumentLink>
        {t.betweenPrivacyEula}
        <LegalDocumentLink to={LEGAL_PATHS.eula} className={linkClass} onClick={stopPropagation}>
          {t.eula}
        </LegalDocumentLink>
        {t.suffix}
      </span>
    </label>
  );
}
