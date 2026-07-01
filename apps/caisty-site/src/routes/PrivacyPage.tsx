import type { ReactNode } from "react";
import { LEGAL_PATHS } from "../config/marketingRoutes";
import { LegalDocumentLink, legalDocumentLinkClass } from "../components/LegalDocumentLink";
import { useTheme } from "../lib/theme";

const EFFECTIVE_DATE = "1. Juli 2026";

export default function PrivacyPage() {
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
        <p className={`text-xs font-semibold uppercase tracking-wider ${meta}`}>Privacy Policy</p>
        <h1 className={`text-3xl font-semibold tracking-tight ${h1}`}>Datenschutzerklärung</h1>
        <p className={`text-sm ${meta}`}>Stand: {EFFECTIVE_DATE}</p>
        <p className={`text-sm leading-relaxed ${body}`}>
          Diese Datenschutzerklärung erläutert, wie Caisty personenbezogene Daten erhebt, nutzt, speichert und
          schützt, wenn Sie unsere Website, Caisty POS, das Kundenportal und zugehörige Dienste nutzen. Sie ist
          Teil des rechtlichen Rahmens von Caisty und sollte zusammen mit den{" "}
          <LegalDocumentLink to={LEGAL_PATHS.terms} isLight={isLight}>
            Allgemeinen Geschäftsbedingungen
          </LegalDocumentLink>
          , der{" "}
          <LegalDocumentLink to={LEGAL_PATHS.cookie} isLight={isLight}>
            Cookie-Richtlinie
          </LegalDocumentLink>
          , dem{" "}
          <LegalDocumentLink to={LEGAL_PATHS.eula} isLight={isLight}>
            EULA
          </LegalDocumentLink>{" "}
          und – soweit anwendbar – dem{" "}
          <LegalDocumentLink to={LEGAL_PATHS.dpa} isLight={isLight}>
            AVV
          </LegalDocumentLink>{" "}
          gelesen werden.
        </p>
      </header>

      <div className={`max-w-none space-y-8 text-sm leading-relaxed ${body}`}>
        <Section title="1. Verantwortlicher" h2={h2}>
          <p>Verantwortlicher im Sinne der Datenschutz-Grundverordnung (DSGVO) ist:</p>
          <div className={card}>
            <p className={`font-semibold ${h2}`}>Caisty</p>
            <p>Inhaber: Siraj Bettaieb</p>
            <p>Mollwitzstraße 5A</p>
            <p>14059 Berlin</p>
            <p>Deutschland</p>
            <p className="pt-2">
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
            <p>
              Datenschutz:{" "}
              <a href="mailto:privacy@caisty.com" className={legalDocumentLinkClass(isLight)}>
                privacy@caisty.com
              </a>
            </p>
          </div>
          <p>
            Soweit Caisty personenbezogene Daten im Auftrag von Geschäftskunden verarbeitet, kann Caisty als
            Auftragsverarbeiter im Sinne von Art. 28 DSGVO handeln. Einzelheiten ergeben sich dann aus dem{" "}
            <LegalDocumentLink to={LEGAL_PATHS.dpa} isLight={isLight}>
              Auftragsverarbeitungsvertrag (AVV)
            </LegalDocumentLink>
            .
          </p>
        </Section>

        <Section title="2. Geltungsbereich" h2={h2}>
          <p>Diese Datenschutzerklärung gilt für die Verarbeitung personenbezogener Daten im Zusammenhang mit:</p>
          <ul className="list-disc space-y-1 ps-5">
            <li>der Website caisty.com und zugehörigen Unterseiten;</li>
            <li>Caisty POS (Desktop-Software und zugehörige Cloud-Funktionen);</li>
            <li>dem Caisty Kundenportal;</li>
            <li>Cloud-Diensten, Synchronisation und Verwaltungsfunktionen;</li>
            <li>Lizenzierung, Aktivierung und Geräteverwaltung;</li>
            <li>Abrechnung, Rechnungsstellung und Abonnementverwaltung;</li>
            <li>Support-Kommunikation und Kundenanfragen;</li>
            <li>APIs und technischen Schnittstellen, soweit diese angeboten werden.</li>
          </ul>
          <p>
            Sie gilt unabhängig davon, ob Sie unsere Leistungen über Website, Software, Portal oder andere
            autorisierte Zugangswege nutzen – vor, während und nach einer Vertragsbeziehung, soweit Daten
            weiterhin gemäß Recht verarbeitet werden.
          </p>
        </Section>

        <Section title="3. Welche Daten wir verarbeiten" h2={h2}>
          <p>
            Je nach genutzter Leistung können wir unterschiedliche Kategorien personenbezogener Daten
            verarbeiten, insbesondere:
          </p>
          <ul className="list-disc space-y-1 ps-5">
            <li>Name und Kontaktdaten;</li>
            <li>Firmen- bzw. Unternehmensname;</li>
            <li>E-Mail-Adresse;</li>
            <li>Rechnungs- und Zahlungsbezogene Angaben;</li>
            <li>Kontodaten (Benutzerkennung, Spracheinstellungen, Profilinformationen);</li>
            <li>Lizenzdaten (Lizenzschlüssel, Plan, Status, Laufzeit);</li>
            <li>Gerätedaten (Gerätekennungen, Betriebssystem, App-Version, Aktivierungsstatus);</li>
            <li>IP-Adresse und Verbindungsdaten;</li>
            <li>Technische Protokolle und Fehlerberichte;</li>
            <li>Support-Nachrichten und Kommunikationsinhalte;</li>
            <li>Zahlungsstatus und Transaktionsreferenzen (ohne vollständige Kartendaten bei Caisty).</li>
          </ul>
          <p>
            Passwörter werden nicht im Klartext gespeichert. Geschäftsdaten, die Sie in Caisty POS oder im
            Portal eingeben (z. B. Artikel, Bestellungen, Kunden im Betrieb), können personenbezogene Daten
            Dritter enthalten; für deren rechtmäßige Verarbeitung bleiben Sie als Betreiber verantwortlich.
          </p>
        </Section>

        <Section title="4. Zwecke der Verarbeitung" h2={h2}>
          <p>Wir verarbeiten personenbezogene Daten insbesondere zu folgenden Zwecken:</p>
          <ul className="list-disc space-y-1 ps-5">
            <li>Erstellung und Verwaltung von Kundenkonten;</li>
            <li>E-Mail-Verifizierung und Authentifizierung;</li>
            <li>Anmeldung, Login und Zugriffskontrolle;</li>
            <li>Lizenzaktivierung, -verwaltung und Gerätezuordnung;</li>
            <li>Abonnement- und Vertragsverwaltung;</li>
            <li>Rechnungsstellung und buchhalterische Abwicklung;</li>
            <li>Zahlungsbestätigung und Mahnwesen;</li>
            <li>Kundensupport und Bearbeitung von Anfragen;</li>
            <li>Sicherheit, Betrugsprävention und Missbrauchserkennung;</li>
            <li>Betrieb, Wartung und Verbesserung unserer Leistungen;</li>
            <li>Erfüllung gesetzlicher Pflichten.</li>
          </ul>
        </Section>

        <Section title="5. Rechtsgrundlagen" h2={h2}>
          <p>Die Verarbeitung erfolgt auf Grundlage der DSGVO, insbesondere:</p>
          <ul className="list-disc space-y-1 ps-5">
            <li>
              <strong>Art. 6 Abs. 1 lit. b DSGVO</strong> – zur Durchführung vorvertraglicher Maßnahmen und zur
              Erfüllung des Vertrags (Konto, Lizenz, Abrechnung, Support);
            </li>
            <li>
              <strong>Art. 6 Abs. 1 lit. c DSGVO</strong> – zur Erfüllung rechtlicher Verpflichtungen (z. B.
              steuer- und handelsrechtliche Aufbewahrung);
            </li>
            <li>
              <strong>Art. 6 Abs. 1 lit. f DSGVO</strong> – auf Basis berechtigter Interessen (z. B. IT-Sicherheit,
              Stabilität, Fehleranalyse, Serviceverbesserung), sofern Ihre Interessen nicht überwiegen;
            </li>
            <li>
              <strong>Art. 6 Abs. 1 lit. a DSGVO</strong> – auf Grundlage Ihrer Einwilligung, soweit eine Einwilligung
              erforderlich ist (z. B. für nicht essenzielle Cookies oder optionale Marketing-Kommunikation).
            </li>
          </ul>
        </Section>

        <Section title="6. Zahlungsanbieter" h2={h2}>
          <p>
            Zahlungen können über externe Zahlungsdienstleister wie <strong>Stripe</strong>,{" "}
            <strong>PayPal</strong> oder andere im Kundenportal angezeigte Anbieter abgewickelt werden.
          </p>
          <p>
            Caisty speichert keine vollständigen Zahlungskartendaten. Zahlungsinformationen werden direkt durch
            den jeweiligen Zahlungsdienstleister verarbeitet. Wir erhalten in der Regel nur Informationen wie
            Zahlungsstatus, Transaktions-ID, Betrag und begrenzte Abrechnungsmetadaten, die für Vertrag und
            Buchhaltung erforderlich sind.
          </p>
          <p>
            Für die Verarbeitung durch Zahlungsdienstleister gelten deren eigene Datenschutzhinweise. Wir
            empfehlen, diese beim Checkout zu prüfen.
          </p>
        </Section>

        <Section title="7. Hosting und Dienstleister" h2={h2}>
          <p>
            Zur Bereitstellung unserer Leistungen setzen wir sorgfältig ausgewählte Dienstleister ein, etwa für:
          </p>
          <ul className="list-disc space-y-1 ps-5">
            <li>Hosting und Cloud-Infrastruktur;</li>
            <li>Speicherung und Betrieb von Anwendungen;</li>
            <li>E-Mail-Versand und Transaktionskommunikation;</li>
            <li>Zahlungsabwicklung;</li>
            <li>Sicherheits- und Monitoring-Dienste.</li>
          </ul>
          <p>
            Diese Dienstleister verarbeiten Daten nur im erforderlichen Umfang und – soweit sie
            Auftragsverarbeiter sind – auf Grundlage vertraglicher Vereinbarungen gemäß Art. 28 DSGVO. Eine
            Verarbeitung außerhalb des Europäischen Wirtschaftsraums erfolgt nur, wenn geeignete Garantien
            (z. B. Standardvertragsklauseln) vorliegen.
          </p>
        </Section>

        <Section title="8. Cookies" h2={h2}>
          <p>
            Unsere Website und Dienste können Cookies und ähnliche Technologien verwenden, z. B. für
            Anmeldung, Sicherheit, Spracheinstellungen oder – mit Einwilligung – Analysefunktionen.
          </p>
          <p>
            Einzelheiten zu verwendeten Cookies, Speicherdauer und Ihren Wahlmöglichkeiten finden Sie in unserer{" "}
            <LegalDocumentLink to={LEGAL_PATHS.cookie} isLight={isLight}>
              Cookie-Richtlinie
            </LegalDocumentLink>
            .
          </p>
        </Section>

        <Section title="9. Speicherdauer" h2={h2}>
          <p>
            Wir speichern personenbezogene Daten nur so lange, wie dies für die genannten Zwecke erforderlich
            ist oder gesetzliche Aufbewahrungspflichten bestehen.
          </p>
          <p>
            Vertrags- und Abrechnungsdaten können wir insbesondere für die Dauer der Vertragsbeziehung sowie
            darüber hinaus gemäß handels- und steuerrechtlichen Vorgaben aufbewahren. Support-Nachrichten und
            technische Protokolle werden nur so lange gespeichert, wie dies für Support, Sicherheit oder
            Nachweiszwecke erforderlich ist.
          </p>
          <p>
            Nach Ablauf der jeweiligen Fristen werden Daten gelöscht oder anonymisiert, sofern keine weitergehende
            Aufbewahrung gesetzlich zulässig oder erforderlich ist.
          </p>
        </Section>

        <Section title="10. Rechte der betroffenen Personen" h2={h2}>
          <p>Sie haben – je nach Voraussetzungen – folgende Rechte unter der DSGVO:</p>
          <ul className="list-disc space-y-1 ps-5">
            <li>
              <strong>Auskunft</strong> (Art. 15 DSGVO) über die Verarbeitung Ihrer Daten;
            </li>
            <li>
              <strong>Berichtigung</strong> (Art. 16 DSGVO) unrichtiger Daten;
            </li>
            <li>
              <strong>Löschung</strong> (Art. 17 DSGVO), soweit keine Aufbewahrungspflichten entgegenstehen;
            </li>
            <li>
              <strong>Einschränkung der Verarbeitung</strong> (Art. 18 DSGVO);
            </li>
            <li>
              <strong>Datenübertragbarkeit</strong> (Art. 20 DSGVO), soweit anwendbar;
            </li>
            <li>
              <strong>Widerspruch</strong> (Art. 21 DSGVO) gegen Verarbeitungen auf Basis berechtigter Interessen;
            </li>
            <li>
              <strong>Widerruf erteilter Einwilligungen</strong> (Art. 7 Abs. 3 DSGVO) mit Wirkung für die Zukunft.
            </li>
          </ul>
          <p>
            Zur Ausübung Ihrer Rechte wenden Sie sich an{" "}
            <a href="mailto:privacy@caisty.com" className={legalDocumentLinkClass(isLight)}>
              privacy@caisty.com
            </a>
            . Sie haben zudem das Recht, sich bei einer Datenschutz-Aufsichtsbehörde zu beschweren, insbesondere
            in dem EU-Mitgliedstaat Ihres Wohnsitzes, Arbeitsplatzes oder des Ortes des mutmaßlichen Verstoßes.
          </p>
        </Section>

        <Section title="11. Sicherheit" h2={h2}>
          <p>
            Caisty trifft angemessene technische und organisatorische Maßnahmen zum Schutz personenbezogener
            Daten vor unbefugtem Zugriff, Verlust, Manipulation oder Offenlegung, unter anderem:
          </p>
          <ul className="list-disc space-y-1 ps-5">
            <li>verschlüsselte Kommunikation (z. B. TLS/HTTPS);</li>
            <li>sichere Passwort-Speicherung (Hashing);</li>
            <li>rollenbasierte Zugriffskontrolle;</li>
            <li>regelmäßige Backups und Wiederherstellungskonzepte;</li>
            <li>Monitoring und Protokollierung sicherheitsrelevanter Ereignisse;</li>
            <li>regelmäßige Updates und Sicherheitsverbesserungen.</li>
          </ul>
          <p>
            Absolute Sicherheit kann technisch nicht garantiert werden. Sie sind ebenfalls verantwortlich für den
            Schutz Ihrer Zugangsdaten und der Geräte, auf denen Caisty POS genutzt wird.
          </p>
        </Section>

        <Section title="12. Verwandte rechtliche Dokumente" h2={h2}>
          <p>Diese Datenschutzerklärung ist Teil des rechtlichen Rahmens von Caisty. Weitere Dokumente:</p>
          <ul className="list-disc space-y-1 ps-5">
            <li>
              <LegalDocumentLink to={LEGAL_PATHS.terms} isLight={isLight}>
                Allgemeine Geschäftsbedingungen
              </LegalDocumentLink>
            </li>
            <li>
              <LegalDocumentLink to={LEGAL_PATHS.cookie} isLight={isLight}>
                Cookie-Richtlinie
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

        <Section title="13. Kontakt" h2={h2}>
          <p>Bei Fragen zum Datenschutz oder zur Ausübung Ihrer Rechte kontaktieren Sie uns:</p>
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
          <p className="pt-2">
            Wir behalten uns vor, diese Datenschutzerklärung anzupassen, wenn sich Rechtslage, Leistungen oder
            Verarbeitungsprozesse ändern. Die jeweils aktuelle Fassung ist auf dieser Seite abrufbar.
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
