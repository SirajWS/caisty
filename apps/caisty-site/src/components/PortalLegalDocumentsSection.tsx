import { Link } from "react-router-dom";
import { PORTAL_LEGAL_DOCUMENTS, type PortalLegalDocumentDef } from "../config/portalLegalDocuments";
import { useLanguage } from "../lib/LanguageContext";
import { getPortalTranslations } from "../lib/translations";
import { portalInnerCard, portalSecondaryCta } from "../lib/portalUi";
import { useTheme } from "../lib/theme";

export function PortalLegalDocumentsSection() {
  const { theme } = useTheme();
  const { language } = useLanguage();
  const t = getPortalTranslations(language);
  const isLight = theme === "light";

  return (
    <section className="space-y-5">
      <div>
        <p className={`text-sm font-semibold uppercase tracking-wider ${isLight ? "text-slate-500" : "text-slate-400"}`}>
          {t.legal.title}
        </p>
        <p className={`mt-1 text-sm ${isLight ? "text-slate-600" : "text-slate-400"}`}>
          {t.legal.subtitle}
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {PORTAL_LEGAL_DOCUMENTS.map((doc) => (
          <LegalDocumentCard key={doc.id} doc={doc} isLight={isLight} />
        ))}
      </div>
    </section>
  );
}

function LegalDocumentCard(props: { doc: PortalLegalDocumentDef; isLight: boolean }) {
  const { language } = useLanguage();
  const t = getPortalTranslations(language);
  const copy = t.legal.documents[props.doc.id];

  return (
    <article
      className={`flex h-full flex-col gap-3 rounded-xl border p-4 transition-colors ${portalInnerCard(props.isLight)} ${
        props.isLight ? "hover:border-slate-300" : "hover:border-white/20"
      }`}
    >
      <div className="flex items-start gap-3">
        <span
          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${
            props.isLight ? "bg-orange-50 text-orange-600" : "bg-orange-500/10 text-orange-400"
          }`}
          aria-hidden
        >
          <LegalDocIcon kind={props.doc.icon} />
        </span>
        <div className="min-w-0 flex-1 space-y-1">
          <h3 className={`text-sm font-semibold leading-snug ${props.isLight ? "text-slate-900" : "text-slate-100"}`}>
            {copy.title}
          </h3>
          <p className={`text-xs leading-relaxed ${props.isLight ? "text-slate-600" : "text-slate-400"}`}>
            {copy.description}
          </p>
        </div>
      </div>
      <div className="mt-auto pt-1">
        <Link
          to={props.doc.path}
          target="_blank"
          rel="noopener noreferrer"
          className={`${portalSecondaryCta(props.isLight)} w-full text-center text-xs no-underline sm:w-auto`}
        >
          {t.legal.open}
        </Link>
      </div>
    </article>
  );
}

function LegalDocIcon(props: { kind: PortalLegalDocumentDef["icon"] }) {
  const className = "h-5 w-5";
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
