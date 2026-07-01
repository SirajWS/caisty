import { LEGAL_PATHS } from "../config/marketingRoutes";
import { LegalDocumentLink, legalDocumentLinkClass } from "../components/LegalDocumentLink";
import { useTheme } from "../lib/theme";

const LAST_UPDATED = "1. Juli 2026";

/** Placeholder until the official subprocessor register is published. */
const PLANNED_SUBPROCESSORS = [
  { name: "Hetzner", purpose: "Cloud-Hosting und Infrastruktur" },
  { name: "Stripe", purpose: "Zahlungsabwicklung" },
  { name: "PayPal", purpose: "Zahlungsabwicklung" },
  { name: "Vercel", purpose: "Website-Hosting und Bereitstellung" },
  { name: "Google", purpose: "OAuth-Authentifizierung (sofern aktiviert)" },
];

export default function SubprocessorsPage() {
  const { theme } = useTheme();
  const isLight = theme === "light";

  const body = isLight ? "text-slate-600" : "text-slate-300";
  const h1 = isLight ? "text-slate-900" : "text-white";
  const h2 = isLight ? "text-slate-900" : "text-slate-100";
  const meta = isLight ? "text-slate-500" : "text-slate-400";
  const card = isLight ? "rounded-lg border border-slate-200 bg-slate-50 p-4" : "rounded-lg border border-slate-800 bg-slate-900/50 p-4";
  const row = isLight ? "border-slate-200" : "border-white/10";

  return (
    <div className="max-w-4xl mx-auto space-y-8 px-4 sm:px-0 pb-12">
      <header className="space-y-3">
        <p className={`text-xs font-semibold uppercase tracking-wider ${meta}`}>Authorized Subprocessors</p>
        <h1 className={`text-3xl font-semibold tracking-tight ${h1}`}>Unterauftragsverarbeiter</h1>
        <p className={`text-sm ${meta}`}>Stand: {LAST_UPDATED}</p>
        <p className={`text-sm leading-relaxed ${body}`}>
          Diese Seite listet die von Caisty eingesetzten Unterauftragsverarbeiter (Subprocessor) gemäß Art. 28 Abs. 2
          lit. d DSGVO und unserem{" "}
          <LegalDocumentLink to={LEGAL_PATHS.dpa} isLight={isLight}>
            Auftragsverarbeitungsvertrag (AVV)
          </LegalDocumentLink>
          . Die Liste wird bei wesentlichen Änderungen aktualisiert.
        </p>
      </header>

      <div className={`rounded-xl border p-4 sm:p-5 text-sm ${isLight ? "border-amber-200 bg-amber-50 text-amber-950" : "border-amber-500/30 bg-amber-500/10 text-amber-100"}`}>
        <p className="m-0 leading-relaxed">
          <strong>Hinweis:</strong> Die offizielle, verbindliche Unterauftragsverarbeiter-Liste wird derzeit
          finalisiert. Die unten genannten Anbieter sind typische Kategorien, die Caisty je nach Service nutzen kann.
          Sobald die endgültige Liste veröffentlicht ist, ersetzt sie diese vorläufige Übersicht.
        </p>
      </div>

      <section className="space-y-4">
        <h2 className={`text-xl font-semibold ${h2}`}>Vorläufige Übersicht</h2>
        <div className={`overflow-x-auto rounded-xl border ${row}`}>
          <table className="w-full min-w-[320px] text-sm border-collapse text-start">
            <thead>
              <tr className={isLight ? "bg-slate-50" : "bg-white/[0.04]"}>
                <th className={`p-3 font-bold border-b ${row} ${h2}`}>Anbieter</th>
                <th className={`p-3 font-bold border-b ${row} ${h2}`}>Zweck</th>
              </tr>
            </thead>
            <tbody>
              {PLANNED_SUBPROCESSORS.map((sp) => (
                <tr key={sp.name} className={`border-b last:border-0 ${row}`}>
                  <td className={`p-3 font-medium ${isLight ? "text-slate-800" : "text-slate-200"}`}>{sp.name}</td>
                  <td className="p-3">{sp.purpose}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className={`space-y-3 text-sm leading-relaxed ${body}`}>
        <h2 className={`text-xl font-semibold ${h2}`}>Kontakt</h2>
        <div className={card}>
          <p>
            Fragen zu Unterauftragsverarbeitern:{" "}
            <a href="mailto:privacy@caisty.com" className={legalDocumentLinkClass(isLight)}>
              privacy@caisty.com
            </a>
          </p>
        </div>
        <p>
          <LegalDocumentLink to={LEGAL_PATHS.dpa} isLight={isLight}>
            ← Zurück zum AVV
          </LegalDocumentLink>
        </p>
      </section>
    </div>
  );
}
