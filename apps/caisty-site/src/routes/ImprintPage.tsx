import { legalDocumentLinkClass } from "../components/LegalDocumentLink";
import { useTheme } from "../lib/theme";

export default function ImprintPage() {
  const { theme } = useTheme();
  const isLight = theme === "light";

  const body = isLight ? "text-slate-600" : "text-slate-300";
  const h1 = isLight ? "text-slate-900" : "text-white";
  const h2 = isLight ? "text-slate-900" : "text-slate-100";
  const cardTitle = isLight ? "text-slate-900" : "text-slate-100";
  const card = isLight
    ? "rounded-lg border border-slate-200 bg-white p-4 shadow-sm"
    : "rounded-lg border border-slate-800 bg-slate-900/50 p-4";

  return (
    <div className="max-w-4xl mx-auto space-y-8 px-4 sm:px-0 pb-12">
      <header className="space-y-3">
        <h1 className={`text-3xl font-semibold tracking-tight ${h1}`}>Impressum</h1>
      </header>

      <div className={`max-w-none space-y-6 text-sm leading-relaxed ${body}`}>
        <section className="space-y-3">
          <h2 className={`text-xl font-semibold ${h2}`}>Angaben gemäß § 5 TMG</h2>
          <div className={`${card} space-y-2`}>
            <p className={`font-semibold ${cardTitle}`}>Caisty</p>
            <p>Inhaber: Siraj Bettaieb</p>
            <p>Mollwitzstraße 5A</p>
            <p>14059 Berlin</p>
            <p>Deutschland</p>
          </div>
        </section>

        <section className="space-y-3">
          <h2 className={`text-xl font-semibold ${h2}`}>Kontakt</h2>
          <div className={`${card} space-y-2`}>
            <p>
              E-Mail:{" "}
              <a href="mailto:info@caisty.com" className={legalDocumentLinkClass(isLight)}>
                info@caisty.com
              </a>
            </p>
            <p>
              Support:{" "}
              <a href="mailto:support@caisty.com" className={legalDocumentLinkClass(isLight)}>
                support@caisty.com
              </a>
            </p>
          </div>
        </section>

        <section className="space-y-3">
          <h2 className={`text-xl font-semibold ${h2}`}>Wirtschafts-Identifikationsnummer</h2>
          <div className={card}>
            <p>DE463279361</p>
          </div>
        </section>
      </div>
    </div>
  );
}
