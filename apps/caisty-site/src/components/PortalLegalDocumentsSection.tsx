import { Link } from "react-router-dom";
import { PORTAL_LEGAL_DOCUMENTS, type PortalLegalDocumentDef } from "../config/portalLegalDocuments";
import { useLanguage } from "../lib/LanguageContext";
import { getPortalTranslations } from "../lib/translations";
import { portalTextLink } from "../lib/portalUi";
import { useTheme } from "../lib/theme";

export function PortalLegalDocumentsSection() {
  const { theme } = useTheme();
  const { language } = useLanguage();
  const t = getPortalTranslations(language);
  const isLight = theme === "light";

  return (
    <div className="space-y-3">
      <div>
        <p className={`text-xs font-semibold uppercase tracking-wider ${isLight ? "text-slate-500" : "text-slate-400"}`}>
          {t.legal.title}
        </p>
        <p className={`mt-0.5 text-xs ${isLight ? "text-slate-600" : "text-slate-400"}`}>
          {t.legal.subtitle}
        </p>
      </div>

      <ul className="grid gap-x-6 gap-y-2 sm:grid-cols-2">
        {PORTAL_LEGAL_DOCUMENTS.map((doc) => (
          <LegalDocumentLink key={doc.id} doc={doc} isLight={isLight} />
        ))}
      </ul>
    </div>
  );
}

function LegalDocumentLink(props: { doc: PortalLegalDocumentDef; isLight: boolean }) {
  const { language } = useLanguage();
  const t = getPortalTranslations(language);
  const copy = t.legal.documents[props.doc.id];

  return (
    <li>
      <Link
        to={props.doc.path}
        target="_blank"
        rel="noopener noreferrer"
        className={`inline-flex items-center gap-2 text-sm no-underline hover:underline ${portalTextLink(props.isLight)}`}
      >
        <span
          className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-md ${
            props.isLight ? "bg-orange-50 text-orange-600" : "bg-orange-500/10 text-orange-400"
          }`}
          aria-hidden
        >
          <LegalDocIcon kind={props.doc.icon} />
        </span>
        <span className="font-medium">{copy.title}</span>
      </Link>
    </li>
  );
}

function LegalDocIcon(props: { kind: PortalLegalDocumentDef["icon"] }) {
  const className = "h-4 w-4";
  switch (props.kind) {
    case "privacy":
      return (
        <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 3l7 4v6c0 4-3 7-7 8-4-1-7-4-7-8V7l7-4z" />
        </svg>
      );
    case "cookie":
      return (
        <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
          <circle cx="12" cy="12" r="9" />
          <circle cx="9" cy="10" r="1" fill="currentColor" stroke="none" />
          <circle cx="14" cy="9" r="1" fill="currentColor" stroke="none" />
          <circle cx="15" cy="14" r="1" fill="currentColor" stroke="none" />
        </svg>
      );
    case "eula":
      return (
        <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
          <path strokeLinecap="round" strokeLinejoin="round" d="M8 4h8l4 4v12H8V4z" />
          <path strokeLinecap="round" d="M16 4v4h4M10 13h6M10 17h4" />
        </svg>
      );
    case "dpa":
      return (
        <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
          <path strokeLinecap="round" strokeLinejoin="round" d="M7 7h10v10H7V7z" />
          <path strokeLinecap="round" d="M9 10h6M9 14h4" />
        </svg>
      );
    case "imprint":
      return (
        <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
          <path strokeLinecap="round" strokeLinejoin="round" d="M4 20V6l8-3 8 3v14H4z" />
          <path strokeLinecap="round" d="M9 10h6M9 14h6" />
        </svg>
      );
    default:
      return (
        <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
          <path strokeLinecap="round" strokeLinejoin="round" d="M7 4h7l5 5v11H7V4z" />
          <path strokeLinecap="round" d="M14 4v5h5M10 13h6M10 17h4" />
        </svg>
      );
  }
}
