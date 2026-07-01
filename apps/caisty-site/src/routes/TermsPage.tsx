import type { ReactNode } from "react";
import { LEGAL_PATHS } from "../config/marketingRoutes";
import { LegalDocumentLink, legalDocumentLinkClass } from "../components/LegalDocumentLink";
import { useTheme } from "../lib/theme";

const EFFECTIVE_DATE = "1. Juli 2026";

export default function TermsPage() {
  const { theme } = useTheme();
  const isLight = theme === "light";

  const body = isLight ? "text-slate-600" : "text-slate-300";
  const h1 = isLight ? "text-slate-900" : "text-white";
  const h2 = isLight ? "text-slate-900" : "text-slate-100";
  const meta = isLight ? "text-slate-500" : "text-slate-400";
  const card = isLight ? "rounded-lg border border-slate-200 bg-slate-50 p-4" : "rounded-lg border border-slate-800 bg-slate-900/50 p-4";

  return (
    <div className="max-w-4xl mx-auto space-y-8 px-4 sm:px-0 pb-12">
      <header className="space-y-3">
        <h1 className={`text-3xl font-semibold tracking-tight ${h1}`}>Allgemeine Geschäftsbedingungen</h1>
        <p className={`text-sm ${meta}`}>Stand: {EFFECTIVE_DATE}</p>
        <p className={`text-sm leading-relaxed ${body}`}>
          Diese Allgemeinen Geschäftsbedingungen (AGB) regeln die vertragliche Beziehung zwischen Caisty und
          Kunden, die unsere Software, Cloud-Dienste und das Kundenportal nutzen oder abonnieren. Sie sind
          Bestandteil des rechtlichen Rahmens von Caisty und sollten zusammen mit der{" "}
          <LegalDocumentLink to={LEGAL_PATHS.privacy} isLight={isLight}>
            Datenschutzerklärung
          </LegalDocumentLink>
          , der{" "}
          <LegalDocumentLink to={LEGAL_PATHS.cookie} isLight={isLight}>
            Cookie-Richtlinie
          </LegalDocumentLink>
          , dem{" "}
          <LegalDocumentLink to={LEGAL_PATHS.eula} isLight={isLight}>
            Endbenutzer-Lizenzvertrag (EULA)
          </LegalDocumentLink>
          , dem{" "}
          <LegalDocumentLink to={LEGAL_PATHS.dpa} isLight={isLight}>
            Auftragsverarbeitungsvertrag (AVV)
          </LegalDocumentLink>{" "}
          und dem{" "}
          <LegalDocumentLink to={LEGAL_PATHS.imprint} isLight={isLight}>
            Impressum
          </LegalDocumentLink>{" "}
          gelesen werden.
        </p>
      </header>

      <div className={`max-w-none space-y-8 text-sm leading-relaxed ${body}`}>
        <Section title="1. Geltungsbereich" h2={h2}>
          <p>
            Diese AGB gelten für alle Verträge und Nutzungsbeziehungen zwischen Caisty, vertreten durch Siraj
            Bettaieb, Mollwitzstraße 5A, 14059 Berlin, Deutschland (nachfolgend „Caisty“, „wir“ oder
            „Anbieter“), und natürlichen oder juristischen Personen, die unsere Leistungen beziehen
            (nachfolgend „Kunde“ oder „Sie“).
          </p>
          <p>
            Die AGB gelten für den Erwerb, das Abonnement, die Lizenzierung und die Nutzung der Caisty POS
            Software, des Kundenportals, zugehöriger Cloud-Dienste sowie weiterer digitaler Produkte und
            Dienstleistungen von Caisty.
          </p>
          <p>
            Abweichende oder ergänzende Bedingungen des Kunden finden nur Anwendung, wenn Caisty ihrer Geltung
            ausdrücklich schriftlich zugestimmt hat. Mit Registrierung, Bestellung, Abonnement, Installation
            oder Nutzung der Leistungen erkennen Sie diese AGB an.
          </p>
        </Section>

        <Section title="2. Vertragsgegenstand" h2={h2}>
          <p>Caisty stellt insbesondere folgende Leistungen bereit:</p>
          <ul className="list-disc space-y-1 ps-5">
            <li>Caisty POS – cloudbasierte Kassensoftware für den Einsatz in Betrieben</li>
            <li>Zugang zum Caisty Kundenportal zur Verwaltung von Lizenzen, Geräten, Abonnements und Rechnungen</li>
            <li>Cloud-Synchronisation, Verwaltungsfunktionen und technischer Support im Rahmen des gewählten Plans</li>
            <li>Weitere Softwareprodukte und Dienste, die Caisty künftig anbietet</li>
          </ul>
          <p>
            Umfang, Funktionen und Verfügbarkeit der Leistungen richten sich nach dem jeweils gebuchten
            Abonnement, der gültigen Produktbeschreibung auf der Website bzw. im Kundenportal sowie etwaigen
            individuellen Vereinbarungen.
          </p>
        </Section>

        <Section title="3. Registrierung und Kundenkonto" h2={h2}>
          <p>
            Für die Nutzung bestimmter Leistungen ist die Erstellung eines Kundenkontos erforderlich. Sie
            verpflichten sich, bei der Registrierung wahrheitsgemäße, vollständige und aktuelle Angaben zu
            machen und diese bei Änderungen unverzüglich zu aktualisieren.
          </p>
          <p>
            Sie sind für die Geheimhaltung Ihrer Zugangsdaten verantwortlich und stellen sicher, dass nur
            autorisierte Personen Zugang zu Ihrem Konto erhalten. Handlungen, die unter Verwendung Ihrer
            Zugangsdaten erfolgen, werden Ihnen zugerechnet, sofern Sie nicht nachweisen, dass ein
            Sicherheitsvorfall allein Caisty zuzurechnen ist.
          </p>
          <p>
            Caisty ist berechtigt, den Zugang zum Konto vorübergehend einzuschränken oder zu sperren, wenn dies
            zum Schutz der Sicherheit, Integrität oder ordnungsgemäßen Nutzung der Leistungen erforderlich ist.
          </p>
        </Section>

        <Section title="4. Lizenz und Nutzung der Software" h2={h2}>
          <p>
            Caisty POS und andere Softwareprodukte von Caisty werden <strong>lizenziert, nicht verkauft</strong>.
            Es wird Ihnen eine beschränkte, nicht ausschließliche, nicht übertragbare und widerrufliche Lizenz
            zur Nutzung der Software im Rahmen Ihres Abonnements und gemäß dem{" "}
            <LegalDocumentLink to={LEGAL_PATHS.eula} isLight={isLight}>
              EULA
            </LegalDocumentLink>{" "}
            eingeräumt.
          </p>
          <p>
            Eigentums- und Urheberrechte an der Software verbleiben bei Caisty bzw. deren Lizenzgebern. Eine
            Nutzung über den vereinbarten Leistungsumfang hinaus – insbesondere unbefugte Vervielfältigung,
            Weitergabe, Unterlizenzierung oder gewerbliche Weiterverwertung – ist untersagt.
          </p>
          <p>
            Sie sind allein dafür verantwortlich, die Software rechtmäßig und in Übereinstimmung mit geltendem
            Recht zu nutzen. Caisty erbringt keine Rechts-, Steuer- oder Buchführungsberatung.
          </p>
          <p>
            Caisty kann Updates, Sicherheitsverbesserungen und neue Versionen bereitstellen. Bestimmte Updates
            können automatisch installiert werden, soweit dies für Sicherheit oder Betrieb erforderlich ist.
          </p>
        </Section>

        <Section title="5. Abonnements, Preise und Zahlungen" h2={h2}>
          <p>
            Die Nutzung der Leistungen erfolgt in der Regel auf Basis wiederkehrender Abonnements mit
            unterschiedlichen Plänen, Funktionen und Preisen. Die jeweils gültigen Preise und Leistungsumfänge
            werden auf der Website und im Kundenportal ausgewiesen.
          </p>
          <p>
            Sofern nicht anders angegeben, verstehen sich Preise in Euro. Gesetzliche Steuern und Abgaben können
            zusätzlich anfallen, sofern und soweit sie gesetzlich geschuldet sind.
          </p>
          <p>
            Die Abrechnung erfolgt entsprechend dem gewählten Abrechnungszeitraum (z. B. monatlich oder
            jährlich). Zahlungen sind über die im Kundenportal angebotenen Zahlungsmethoden – derzeit
            insbesondere Karte und PayPal – zu leisten.
          </p>
          <p>
            Bei Zahlungsverzug, fehlgeschlagenen Zahlungen oder unberechtigter Nutzung ist Caisty berechtigt,
            Mahnungen zu versenden, den Zugang vorübergehend zu sperren und weitergehende Rechte geltend zu
            machen. Bereits entstandene Gebühren bleiben in jedem Fall geschuldet.
          </p>
          <p>
            Abonnements verlängern sich automatisch um den jeweiligen Abrechnungszeitraum, sofern sie nicht
            fristgerecht gekündigt werden.
          </p>
        </Section>

        <Section title="6. Testphase" h2={h2}>
          <p>
            Caisty kann kostenlose Test- oder Probezeiträume anbieten. Umfang, Dauer und Verfügbarkeit einer
            Testphase ergeben sich aus der jeweiligen Angebotsbeschreibung im Kundenportal oder auf der Website.
          </p>
          <p>
            Mit Ablauf der Testphase endet der kostenlose Zugang, sofern Sie kein kostenpflichtiges Abonnement
            abschließen. Caisty ist berechtigt, Testangebote jederzeit zu ändern oder einzustellen.
          </p>
        </Section>

        <Section title="7. Verfügbarkeit und Wartung" h2={h2}>
          <p>
            Caisty bemüht sich, die Leistungen zuverlässig und sicher bereitzustellen. Sofern nicht ausdrücklich
            in einer separaten schriftlichen Vereinbarung etwas anderes geregelt ist, erfolgt die
            Bereitstellung der Leistungen auf Basis{" "}
            <strong>wirtschaftlich zumutbarer Anstrengungen</strong> (commercially reasonable efforts). Eine
            unterbrechungsfreie oder fehlerfreie Verfügbarkeit wird nicht garantiert.
          </p>
          <p>
            Vorübergehende Einschränkungen können insbesondere durch Wartung, Updates, Infrastrukturarbeiten,
            Störungen bei Drittanbietern, Netzwerkprobleme, Sicherheitsvorfälle oder höhere Gewalt entstehen.
            Geplante Wartungsarbeiten werden, soweit zumutbar, im Voraus angekündigt.
          </p>
        </Section>

        <Section title="8. Pflichten des Kunden" h2={h2}>
          <p>Sie verpflichten sich insbesondere:</p>
          <ul className="list-disc space-y-1 ps-5">
            <li>die Leistungen nur für rechtmäßige geschäftliche Zwecke zu nutzen;</li>
            <li>geltendes Recht, diese AGB und den EULA einzuhalten;</li>
            <li>Zugangsdaten, Geräte und Netzwerke angemessen zu schützen;</li>
            <li>keine unbefugten Zugriffe, Manipulationen oder Störungen vorzunehmen;</li>
            <li>keine Schadsoftware einzubringen und keine Sicherheitsmechanismen zu umgehen;</li>
            <li>inhalte und Daten, die Sie verarbeiten, nur rechtmäßig zu erheben und zu verwenden;</li>
            <li>Sicherheitsvorfälle und mutmaßlichen Missbrauch unverzüglich an Caisty zu melden.</li>
          </ul>
          <p>
            Sie bleiben verantwortlich für die Einhaltung steuerlicher, buchhalterischer, arbeitsrechtlicher,
            datenschutzrechtlicher und branchenspezifischer Vorschriften in Ihrem Betrieb. Caisty ersetzt keine
            eigenständige Rechts- oder Compliance-Beratung.
          </p>
        </Section>

        <Section title="9. Datenschutz" h2={h2}>
          <p>
            Caisty verarbeitet personenbezogene Daten im Einklang mit der geltenden Datenschutzgesetzgebung.
            Einzelheiten zu Art, Umfang und Zweck der Verarbeitung, zu Ihren Rechten sowie zu
            Auftragsverarbeitungsbeziehungen ergeben sich aus der{" "}
            <LegalDocumentLink to={LEGAL_PATHS.privacy} isLight={isLight}>
              Datenschutzerklärung
            </LegalDocumentLink>{" "}
            und – soweit anwendbar – dem{" "}
            <LegalDocumentLink to={LEGAL_PATHS.dpa} isLight={isLight}>
              AVV
            </LegalDocumentLink>
            .
          </p>
          <p>
            Sie sind dafür verantwortlich, dass die von Ihnen in die Leistungen eingegebenen Daten rechtmäßig
            erhoben und verarbeitet werden und erforderliche Informationen gegenüber betroffenen Personen
            bereitgestellt werden.
          </p>
        </Section>

        <Section title="10. Drittanbieter" h2={h2}>
          <p>
            Die Leistungen können mit Produkten oder Diensten unabhängiger Drittanbieter verbunden sein, etwa
            Zahlungsdienstleistern, Cloud-Infrastruktur, Authentifizierungsdiensten, Hardware-Herstellern oder
            Fiskaldiensten.
          </p>
          <p>
            Caisty kontrolliert diese Drittanbieter nicht und übernimmt keine Verantwortung für deren
            Verfügbarkeit, Funktion, Sicherheit, Preise oder Vertragsbedingungen. Die Nutzung
            Drittanbieter-Leistungen unterliegt den jeweiligen Bedingungen und Datenschutzhinweisen des
            betreffenden Anbieters.
          </p>
        </Section>

        <Section title="11. Kündigung" h2={h2}>
          <p>
            Sie können Ihr Abonnement jederzeit über das Kundenportal oder per E-Mail an{" "}
            <a href="mailto:support@caisty.com" className={legalDocumentLinkClass(isLight)}>
              support@caisty.com
            </a>{" "}
            kündigen. Die Kündigung wird wirksam zum Ende des laufenden Abrechnungszeitraums, sofern nicht
            gesetzlich ein anderes Kündigungsrecht besteht.
          </p>
          <p>
            Eine Kündigung berechtigt grundsätzlich nicht zur Rückerstattung bereits gezahlter Entgelte für den
            laufenden Zeitraum. Bereits fällige Zahlungsansprüche bleiben unberührt.
          </p>
          <p>
            Caisty kann den Vertrag aus wichtigem Grund fristlos kündigen oder den Zugang sperren, insbesondere
            bei schwerwiegenden Verstößen gegen diese AGB, den EULA, Zahlungsverzug, betrügerischer Nutzung,
            erheblichen Sicherheitsrisiken oder wenn die weitere Bereitstellung rechtswidrig wäre. Soweit
            zumutbar, wird Caisty vorher eine Abhilfefrist setzen.
          </p>
          <p>
            Nach Beendigung endet Ihr Nutzungsrecht an den Leistungen. Soweit technisch möglich, sollten Sie
            relevante Daten vor Vertragsende exportieren. Caisty kann Daten nach Ablauf gesetzlicher oder
            vertraglicher Aufbewahrungsfristen löschen oder anonymisieren.
          </p>
        </Section>

        <Section title="12. Haftung" h2={h2}>
          <p>
            Caisty haftet unbeschränkt bei Vorsatz und grober Fahrlässigkeit sowie bei Schäden aus der
            Verletzung des Lebens, des Körpers oder der Gesundheit. Bei leicht fahrlässiger Verletzung
            wesentlicher Vertragspflichten (Kardinalpflichten) ist die Haftung auf den vertragstypischen,
            vorhersehbaren Schaden begrenzt.
          </p>
          <p>
            Im Übrigen ist die Haftung für leichte Fahrlässigkeit ausgeschlossen, soweit gesetzlich zulässig.
            Caisty haftet nicht für mittelbare Schäden, entgangenen Gewinn, Datenverluste oder
            Betriebsunterbrechungen, es sei denn, zwingendes Recht sieht etwas anderes vor.
          </p>
          <p>
            Soweit die Haftung nicht ausgeschlossen ist, ist die gesamtschuldnerische Haftung von Caisty auf
            den Betrag begrenzt, den Sie in den zwölf Monaten vor dem schadensauslösenden Ereignis für die
            betroffenen Leistungen tatsächlich gezahlt haben, sofern nicht zwingendes Recht eine weitergehende
            Haftung vorsieht.
          </p>
        </Section>

        <Section title="13. Änderungen der AGB" h2={h2}>
          <p>
            Caisty kann diese AGB ändern, wenn dies erforderlich ist, um rechtliche, technische oder
            betriebliche Entwicklungen zu berücksichtigen oder die Leistungen weiterzuentwickeln.
          </p>
          <p>
            Wesentliche Änderungen, die Ihre vertraglichen Rechte betreffen, werden Ihnen in geeigneter Form
            mitgeteilt, etwa per E-Mail, im Kundenportal oder auf der Website. Sofern gesetzlich zulässig,
            gilt Ihre fortgesetzte Nutzung nach Inkrafttreten der geänderten Fassung als Zustimmung. Widersprechen
            Sie wesentlichen Änderungen, können Sie den Vertrag zum Zeitpunkt des Inkrafttretens kündigen.
          </p>
        </Section>

        <Section title="14. Schlussbestimmungen" h2={h2}>
          <p>
            Diese AGB bilden zusammen mit dem EULA, der Datenschutzerklärung, der Cookie-Richtlinie, dem AVV
            (soweit anwendbar) und dem Impressum die vertragliche Grundlage, soweit nicht individuelle
            schriftliche Vereinbarungen etwas Abweichendes regeln. Bei Widersprüchen gilt für den jeweiligen
            Gegenstand das speziell hierfür vorgesehene Dokument.
          </p>
          <p>
            Es gilt das Recht der Bundesrepublik Deutschland unter Ausschluss des UN-Kaufrechts (CISG). Für
            Kaufleute ist ausschließlicher Gerichtsstand Berlin, sofern gesetzlich zulässig.
          </p>
          <p>
            Sollten einzelne Bestimmungen dieser AGB unwirksam sein oder werden, bleibt die Wirksamkeit der
            übrigen Bestimmungen unberührt. An die Stelle der unwirksamen Regelung tritt eine wirksame
            Regelung, die dem wirtschaftlichen Zweck am nächsten kommt.
          </p>
          <p>
            Caisty ist berechtigt, Rechte und Pflichten aus diesem Vertrag im Zusammenhang mit
            Unternehmensübertragungen, Umstrukturierungen oder Beteiligungswechseln an verbundene Unternehmen
            oder Rechtsnachfolger zu übertragen.
          </p>
        </Section>

        <Section title="15. Kontakt" h2={h2}>
          <div className={card}>
            <p className={`font-semibold ${h2}`}>Caisty</p>
            <p>Inhaber: Siraj Bettaieb</p>
            <p>Mollwitzstraße 5A</p>
            <p>14059 Berlin</p>
            <p>Deutschland</p>
            <p className="pt-2">
              Allgemeine Anfragen:{" "}
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
            <p className="pt-2">Wirtschafts-Identifikationsnummer: DE463279361</p>
          </div>
          <p className="pt-2">
            Weitere Informationen finden Sie im{" "}
            <LegalDocumentLink to={LEGAL_PATHS.imprint} isLight={isLight}>
              Impressum
            </LegalDocumentLink>
            .
          </p>
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
