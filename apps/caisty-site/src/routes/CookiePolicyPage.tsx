import type { ReactNode } from "react";
import { LEGAL_PATHS } from "../config/marketingRoutes";
import { LegalDocumentLink, legalDocumentLinkClass } from "../components/LegalDocumentLink";
import { openCookiePreferences } from "../lib/cookieConsent";
import { useTheme } from "../lib/theme";

const EFFECTIVE_DATE = "1. Juli 2026";

export default function CookiePolicyPage() {
  const { theme } = useTheme();
  const isLight = theme === "light";

  const body = isLight ? "text-slate-600" : "text-slate-300";
  const h1 = isLight ? "text-slate-900" : "text-white";
  const h2 = isLight ? "text-slate-900" : "text-slate-100";
  const h3 = isLight ? "text-slate-800" : "text-slate-200";
  const meta = isLight ? "text-slate-500" : "text-slate-400";
  const card = isLight ? "rounded-lg border border-slate-200 bg-slate-50 p-4" : "rounded-lg border border-slate-800 bg-slate-900/50 p-4";

  return (
    <div className="max-w-4xl mx-auto space-y-8 px-4 sm:px-0 pb-12">
      <header className="space-y-3">
        <p className={`text-xs font-semibold uppercase tracking-wider ${meta}`}>Cookie Policy</p>
        <h1 className={`text-3xl font-semibold tracking-tight ${h1}`}>Cookie-Richtlinie</h1>
        <p className={`text-sm ${meta}`}>Stand: {EFFECTIVE_DATE}</p>
        <p className={`text-sm leading-relaxed ${body}`}>
          Diese Cookie-Richtlinie erläutert, wie Caisty Cookies und ähnliche Technologien einsetzt, wenn Sie
          unsere Website, Caisty POS, das Kundenportal und zugehörige Online-Dienste nutzen.
        </p>
      </header>

      <div className={`max-w-none space-y-8 text-sm leading-relaxed ${body}`}>
        <Section title="1. Verantwortlicher" h2={h2}>
          <div className={card}>
            <p className={`font-semibold ${h2}`}>Caisty</p>
            <p>Inhaber: Siraj Bettaieb</p>
            <p>Mollwitzstraße 5A</p>
            <p>14059 Berlin</p>
            <p>Deutschland</p>
            <p className="pt-2">
              Datenschutz:{" "}
              <a href="mailto:privacy@caisty.com" className={legalDocumentLinkClass(isLight)}>
                privacy@caisty.com
              </a>
            </p>
            <p>
              Support:{" "}
              <a href="mailto:support@caisty.com" className={legalDocumentLinkClass(isLight)}>
                support@caisty.com
              </a>
            </p>
          </div>
        </Section>

        <Section title="2. Geltungsbereich" h2={h2}>
          <p>Diese Cookie-Richtlinie gilt für Cookies und vergleichbare Technologien im Zusammenhang mit:</p>
          <ul className="list-disc space-y-1 ps-5">
            <li>caisty.com und zugehörigen Webseiten;</li>
            <li>Caisty POS und eingebetteten Web-/Cloud-Funktionen;</li>
            <li>dem Caisty Kundenportal;</li>
            <li>Cloud-Diensten und Synchronisationsfunktionen;</li>
            <li>APIs und administrativen Schnittstellen;</li>
            <li>künftigen Online-Diensten von Caisty.</li>
          </ul>
          <p>
            Sie ergänzt unsere{" "}
            <LegalDocumentLink to={LEGAL_PATHS.privacy} isLight={isLight}>
              Datenschutzerklärung
            </LegalDocumentLink>
            , die gilt, sobald Cookies personenbezogene Daten verarbeiten.
          </p>
        </Section>

        <Section title="3. Was sind Cookies?" h2={h2}>
          <p>
            Cookies sind kleine Textdateien, die beim Besuch einer Website oder Nutzung eines Online-Dienstes auf
            Ihrem Gerät gespeichert werden können. Sie helfen dabei, Einstellungen zu merken, Sitzungen
            aufrechtzuerhalten, die Sicherheit zu verbessern und die Nutzung zu vereinfachen.
          </p>
          <p>
            Cookies identifizieren Sie nicht automatisch namentlich. Werden Cookies jedoch mit weiteren
            Informationen verknüpft, können sie personenbezogene Daten darstellen.
          </p>
          <p>
            Neben klassischen Browser-Cookies können auch vergleichbare Technologien eingesetzt werden, etwa
            Local Storage, Session Storage, sichere Authentifizierungstoken oder verschlüsselte
            Sitzungskennungen. In dieser Richtlinie schließen wir diese Technologien ein, soweit sie vergleichbare
            Funktionen erfüllen.
          </p>
        </Section>

        <Section title="4. Welche Cookies verwenden wir?" h2={h2}>
          <p>Je nach genutzter Leistung können verschiedene Kategorien zum Einsatz kommen:</p>

          <Category title="Strictly Necessary Cookies (unbedingt erforderlich)" h3={h3}>
            Diese Cookies sind für den Betrieb der Dienste unerlässlich, z. B. für sichere Navigation, grundlegende
            Funktionen, Warenkorb-/Sitzungslogik oder technisch notwendige Speicherung. Ohne sie können
            wesentliche Funktionen nicht bereitgestellt werden.
          </Category>

          <Category title="Authentication Cookies (Authentifizierung)" h3={h3}>
            Diese Cookies erkennen angemeldete Nutzer und ermöglichen den sicheren Zugriff auf geschützte Bereiche
            wie das Kundenportal. Sie verhindern, dass Sie sich bei jeder Seitenansicht erneut anmelden müssen.
          </Category>

          <Category title="Security Cookies (Sicherheit)" h3={h3}>
            Sicherheits-Cookies unterstützen den Schutz von Konten und Systemen, z. B. durch Erkennung
            verdächtiger Aktivitäten, Missbrauchsprävention und Absicherung von Sitzungen.
          </Category>

          <Category title="Preference Cookies (Einstellungen)" h3={h3}>
            Diese Cookies speichern von Ihnen gewählte Einstellungen, etwa Sprache, Theme (Hell/Dunkel) oder
            andere Darstellungsoptionen, um Ihre Nutzung komfortabler zu gestalten.
          </Category>

          <Category title="Functional Cookies (Funktional)" h3={h3}>
            Funktionale Cookies ermöglichen erweiterte Komfortfunktionen, die nicht zwingend für den
            Grundbetrieb erforderlich sind, etwa das Merken früherer Auswahlen oder vereinfachte
            Wiederkehr-Nutzung.
          </Category>

          <Category title="Analytics Cookies (Analyse)" h3={h3}>
            Analyse-Cookies helfen zu verstehen, wie Website und Dienste genutzt werden (z. B. Seitenaufrufe,
            Navigationswege, Feature-Nutzung in aggregierter Form). Sie dienen der Verbesserung unserer
            Leistungen.
          </Category>

          <Category title="Performance Cookies (Leistung)" h3={h3}>
            Performance-Cookies messen Ladezeiten, Reaktionsgeschwindigkeit, Stabilität und technische
            Zuverlässigkeit, damit wir Engpässe erkennen und die Qualität der Dienste verbessern können.
          </Category>
        </Section>

        <Section title="5. Rechtsgrundlage" h2={h2}>
          <p>
            <strong>Unbedingt erforderliche Cookies</strong> werden auf Grundlage unseres berechtigten Interesses
            bzw. zur Bereitstellung der von Ihnen angeforderten Dienste eingesetzt. Für diese Cookies ist in der
            Regel keine Einwilligung erforderlich.
          </p>
          <p>
            <strong>Analyse-, Performance-, Funktions- und Präferenz-Cookies</strong>, die nicht zwingend
            erforderlich sind, setzen wir nur ein, wenn eine gültige Rechtsgrundlage besteht – insbesondere Ihre
            Einwilligung gemäß Art. 6 Abs. 1 lit. a DSGVO bzw. § 25 TTDSG, soweit gesetzlich erforderlich.
          </p>
          <p>
            Soweit zulässig, können bestimmte Sicherheits- und Stabilitätsmaßnahmen auch auf berechtigten
            Interessen beruhen (Art. 6 Abs. 1 lit. f DSGVO), sofern Ihre Interessen nicht überwiegen.
          </p>
        </Section>

        <Section title="6. Cookie-Banner und Einwilligung" h2={h2}>
          <p>
            Beim ersten Besuch unserer Website können Sie über unseren Cookie-Banner entscheiden, ob optionale
            Cookies gesetzt werden dürfen. Sie haben folgende Möglichkeiten:
          </p>
          <ul className="list-disc space-y-1 ps-5">
            <li>alle Cookies akzeptieren;</li>
            <li>nicht erforderliche Cookies ablehnen;</li>
            <li>Ihre Präferenzen nach Kategorien anpassen;</li>
            <li>Ihre Auswahl später erneut ändern.</li>
          </ul>
          <p>
            Ihre Einwilligung können Sie jederzeit mit Wirkung für die Zukunft widerrufen, indem Sie Ihre
            Cookie-Einstellungen erneut öffnen:
          </p>
          <button type="button" onClick={openCookiePreferences} className="lp-cta-primary text-sm py-2.5 min-h-[44px]">
            Cookie-Einstellungen öffnen
          </button>
        </Section>

        <Section title="7. Browser-Einstellungen" h2={h2}>
          <p>
            Sie können Cookies auch direkt in Ihrem Browser verwalten, blockieren oder löschen. Bitte beachten
            Sie, dass die Deaktivierung erforderlicher Cookies dazu führen kann, dass Teile der Website oder des
            Kundenportals nicht mehr korrekt funktionieren.
          </p>
          <p>
            Anleitungen finden Sie in der Hilfe Ihres Browsers (z. B. Chrome, Firefox, Safari, Edge). Nach dem
            Löschen von Cookies kann der Cookie-Banner erneut erscheinen.
          </p>
        </Section>

        <Section title="8. Speicherdauer" h2={h2}>
          <p>
            <strong>Session-Cookies</strong> werden gelöscht, wenn Sie Ihren Browser oder die Anwendungssitzung
            beenden. Sie dienen vor allem Authentifizierung, Sitzungskontinuität und temporären Einstellungen.
          </p>
          <p>
            <strong>Persistente Cookies</strong> verbleiben für einen definierten Zeitraum auf Ihrem Gerät oder
            bis Sie sie manuell löschen. Sie können z. B. Spracheinstellungen, Theme oder Ihre Cookie-Auswahl
            speichern. Die Speicherdauer richtet sich nach dem jeweiligen Zweck und geltenden rechtlichen
            Anforderungen.
          </p>
        </Section>

        <Section title="9. Datenschutz" h2={h2}>
          <p>
            Verarbeiten Cookies personenbezogene Daten, erfolgt die Verarbeitung gemäß unserer{" "}
            <LegalDocumentLink to={LEGAL_PATHS.privacy} isLight={isLight}>
              Datenschutzerklärung
            </LegalDocumentLink>
            . Dort finden Sie Informationen zu Ihren Rechten, Speicherdauer, Empfängern und Sicherheitsmaßnahmen.
          </p>
        </Section>

        <Section title="10. Änderungen" h2={h2}>
          <p>
            Caisty kann diese Cookie-Richtlinie anpassen, wenn sich Rechtslage, eingesetzte Technologien oder
            unsere Dienste ändern. Wesentliche Änderungen werden über die Website, das Kundenportal oder andere
            geeignete Kanäle mitgeteilt. Die jeweils aktuelle Fassung ist auf dieser Seite abrufbar.
          </p>
        </Section>

        <Section title="11. Kontakt und verwandte Dokumente" h2={h2}>
          <p>Bei Fragen zu Cookies oder Einwilligungen kontaktieren Sie uns:</p>
          <div className={card}>
            <p>
              Datenschutz:{" "}
              <a href="mailto:privacy@caisty.com" className={legalDocumentLinkClass(isLight)}>
                privacy@caisty.com
              </a>
            </p>
            <p>
              Support:{" "}
              <a href="mailto:support@caisty.com" className={legalDocumentLinkClass(isLight)}>
                support@caisty.com
              </a>
            </p>
          </div>
          <p className="pt-2">Verwandte Dokumente:</p>
          <ul className="list-disc space-y-1 ps-5">
            <li>
              <LegalDocumentLink to={LEGAL_PATHS.terms} isLight={isLight}>
                Allgemeine Geschäftsbedingungen
              </LegalDocumentLink>
            </li>
            <li>
              <LegalDocumentLink to={LEGAL_PATHS.privacy} isLight={isLight}>
                Datenschutzerklärung
              </LegalDocumentLink>
            </li>
            <li>
              <LegalDocumentLink to={LEGAL_PATHS.eula} isLight={isLight}>
                Endbenutzer-Lizenzvertrag (EULA)
              </LegalDocumentLink>
            </li>
            <li>
              <LegalDocumentLink to={LEGAL_PATHS.dpa} isLight={isLight}>
                Auftragsverarbeitungsvertrag (AVV)
              </LegalDocumentLink>
            </li>
            <li>
              <LegalDocumentLink to={LEGAL_PATHS.imprint} isLight={isLight}>
                Impressum
              </LegalDocumentLink>
            </li>
          </ul>
        </Section>
      </div>
    </div>
  );
}

function Section(props: { title: string; h2: string; children: ReactNode }) {
  return (
    <section className="space-y-3">
      <h2 className={`text-xl font-semibold ${props.h2}`}>{props.title}</h2>
      {props.children}
    </section>
  );
}

function Category(props: { title: string; h3: string; children: ReactNode }) {
  return (
    <div className="space-y-1.5 pt-2">
      <h3 className={`text-base font-semibold ${props.h3}`}>{props.title}</h3>
      <p className="m-0">{props.children}</p>
    </div>
  );
}
