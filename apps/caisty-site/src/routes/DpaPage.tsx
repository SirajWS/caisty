import type { ReactNode } from "react";
import { LEGAL_PATHS } from "../config/marketingRoutes";
import { LegalDocumentLink, legalDocumentLinkClass } from "../components/LegalDocumentLink";
import { useTheme } from "../lib/theme";

const EFFECTIVE_DATE = "1. Juli 2026";
const VERSION = "2.0 (Master Edition)";

export default function DpaPage() {
  const { theme } = useTheme();
  const isLight = theme === "light";

  const body = isLight ? "text-slate-600" : "text-slate-300";
  const h1 = isLight ? "text-slate-900" : "text-white";
  const h2 = isLight ? "text-slate-900" : "text-slate-100";
  const h3 = isLight ? "text-slate-800" : "text-slate-200";
  const meta = isLight ? "text-slate-500" : "text-slate-400";
  const card = isLight ? "rounded-lg border border-slate-200 bg-slate-50 p-4" : "rounded-lg border border-slate-800 bg-slate-900/50 p-4";
  const partShell = isLight ? "rounded-xl border border-slate-200 bg-white/50" : "rounded-xl border border-white/10 bg-white/[0.02]";

  return (
    <div className="max-w-4xl mx-auto space-y-8 px-4 sm:px-0 pb-12">
      <header className="space-y-3">
        <p className={`text-xs font-semibold uppercase tracking-wider ${meta}`}>Data Processing Agreement (DPA)</p>
        <h1 className={`text-3xl font-semibold tracking-tight ${h1}`}>Auftragsverarbeitungsvertrag (AVV)</h1>
        <p className={`text-sm ${meta}`}>
          Caisty · Version {VERSION} · Stand: {EFFECTIVE_DATE}
        </p>
        <p className={`text-sm leading-relaxed ${body}`}>
          Dieser Auftragsverarbeitungsvertrag („AVV“ oder „DPA“) regelt die Verarbeitung personenbezogener Daten,
          wenn Caisty als Auftragsverarbeiter im Auftrag des Kunden (Verantwortlicher) handelt. Er erfüllt die
          Anforderungen von Art. 28 DSGVO und ergänzt{" "}
          <LegalDocumentLink to={LEGAL_PATHS.eula} isLight={isLight}>
            EULA
          </LegalDocumentLink>
          ,{" "}
          <LegalDocumentLink to={LEGAL_PATHS.terms} isLight={isLight}>
            AGB
          </LegalDocumentLink>{" "}
          und{" "}
          <LegalDocumentLink to={LEGAL_PATHS.privacy} isLight={isLight}>
            Datenschutzerklärung
          </LegalDocumentLink>
          . Bei Widersprüchen zur Datenverarbeitung gilt dieser AVV vorrangig, soweit datenschutzrechtlich erforderlich.
        </p>
      </header>

      <div className={`max-w-none space-y-4 text-sm leading-relaxed ${body}`}>
        <CollapsiblePart title="Teil I – Allgemeine Bestimmungen" shell={partShell} h2={h2} defaultOpen>
          <Article title="Artikel 1 – Zweck" h3={h3}>
            <p>
              Dieser AVV ist Bestandteil der Vertragsbeziehung zwischen Caisty („Auftragsverarbeiter“) und dem Kunden
              („Verantwortlicher“) und regelt die Verarbeitung personenbezogener Daten im Zusammenhang mit den von Caisty
              bereitgestellten Services.
            </p>
            <p>
              Er soll die Anforderungen von Art. 28 der Datenschutz-Grundverordnung (EU) 2016/679 („DSGVO“) und weiterer
              anwendbarer Datenschutzgesetze erfüllen. Verarbeitet Caisty personenbezogene Daten im Auftrag des Kunden,
              regelt dieser AVV die Rechte und Pflichten beider Parteien.
            </p>
            <p>Der AVV ergänzt und ist zu lesen zusammen mit:</p>
            <ul className="list-disc space-y-1 ps-5">
              <li>Endbenutzer-Lizenzvereinbarung (EULA);</li>
              <li>Allgemeinen Geschäftsbedingungen;</li>
              <li>Abonnementvereinbarung;</li>
              <li>Datenschutzerklärung;</li>
              <li>geltenden Bestellformularen oder Servicevereinbarungen.</li>
            </ul>
          </Article>
          <Article title="Artikel 2 – Begriffe" h3={h3}>
            <ul className="list-disc space-y-1 ps-5">
              <li>
                <strong>Verantwortlicher</strong> – natürliche oder juristische Person, die Zwecke und Mittel der
                Verarbeitung bestimmt
              </li>
              <li>
                <strong>Auftragsverarbeiter</strong> – Caisty bei Verarbeitung im Auftrag des Verantwortlichen
              </li>
              <li>
                <strong>personenbezogene Daten</strong> – Informationen über identifizierte oder identifizierbare
                natürliche Personen gemäß anwendbarem Datenschutzrecht
              </li>
              <li>
                <strong>Verarbeitung</strong> – jeder Vorgang mit personenbezogenen Daten (Erhebung, Speicherung,
                Organisation, Abruf, Nutzung, Offenlegung, Übermittlung, Löschung u. a.)
              </li>
              <li>
                <strong>betroffene Person</strong> – Person, deren personenbezogene Daten verarbeitet werden
              </li>
              <li>
                <strong>Unterauftragsverarbeiter (Subprocessor)</strong> – Dritter, der im Auftrag personenbezogene Daten
                verarbeitet
              </li>
              <li>
                <strong>Verletzung des Schutzes personenbezogener Daten</strong> – Sicherheitsvorfall mit unbefugtem
                Zugriff, Verlust, Zerstörung oder Offenlegung
              </li>
            </ul>
            <p>Nicht definierte Begriffe haben die Bedeutung aus EULA oder AGB.</p>
          </Article>
          <Article title="Artikel 3 – Geltungsbereich" h3={h3}>
            <p>
              Der AVV gilt, wenn Caisty personenbezogene Daten im Auftrag des Verantwortlichen im Zusammenhang mit den
              Services verarbeitet, u. a. über:
            </p>
            <ul className="list-disc space-y-1 ps-5">
              <li>Caisty POS;</li>
              <li>Kundenportal;</li>
              <li>Cloud-Dienste;</li>
              <li>Administrative Schnittstellen;</li>
              <li>APIs;</li>
              <li>Software-Lizenzierung;</li>
              <li>Kundensupport-Systeme;</li>
              <li>Backup-Infrastruktur;</li>
              <li>Authentifizierungsdienste;</li>
              <li>künftige von Caisty betriebene Services.</li>
            </ul>
            <p>
              Der AVV gilt nicht, wenn Caisty als eigenständiger Verantwortlicher handelt (z. B. eigene Abrechnung,
              Compliance, Betrugsprävention, Sicherheit, Unternehmensverwaltung). Dies regelt die Datenschutzerklärung.
            </p>
          </Article>
          <Article title="Artikel 4 – Gegenstand der Verarbeitung" h3={h3}>
            <p>
              Gegenstand ist Bereitstellung, Betrieb, Wartung, Sicherheit, Support und kontinuierliche Verbesserung der
              Services. Verarbeitung kann umfassen:
            </p>
            <ul className="list-disc space-y-1 ps-5">
              <li>Hosting von Kundendaten;</li>
              <li>Speicherung und Übermittlung personenbezogener Daten;</li>
              <li>Organisation und Cloud-Synchronisation;</li>
              <li>Bereitstellung von Software-Funktionen;</li>
              <li>Kundensupport, Updates, technische Wartung;</li>
              <li>Disaster Recovery und Backup.</li>
            </ul>
            <p>Verarbeitung erfolgt ausschließlich für vom Verantwortlichen festgelegte Zwecke.</p>
          </Article>
          <Article title="Artikel 5 – Dauer der Verarbeitung" h3={h3}>
            <p>
              Die Verarbeitung dauert für die Laufzeit des Vertragsverhältnisses. Nach Beendigung werden Daten gemäß
              diesem AVV, vertraglicher Dokumentation, gesetzlicher Aufbewahrungspflichten und Datenschutzrecht
              aufbewahrt, zurückgegeben, gelöscht oder anonymisiert. Fortführung ist zulässig, wenn gesetzlich
              erforderlich oder zur Geltendmachung von Rechtsansprüchen nötig.
            </p>
          </Article>
          <Article title="Artikel 6 – Art und Zweck der Verarbeitung" h3={h3}>
            <p>
              Caisty verarbeitet personenbezogene Daten ausschließlich zur Erbringung der vom Verantwortlichen
              angeforderten Services, u. a. Erhebung, Speicherung, Organisation, Abruf, Übermittlung, Synchronisation,
              Hosting, Backup, Wiederherstellung, technischer Support, Wartung, Sicherheitsüberwachung und Löschung.
            </p>
            <p>
              Caisty verarbeitet keine personenbezogenen Daten für eigene unabhängige Zwecke, außer wo ausdrücklich
              gesetzlich erlaubt oder Caisty als eigenständiger Verantwortlicher handelt.
            </p>
          </Article>
          <Article title="Artikel 7 – Kategorien personenbezogener Daten" h3={h3}>
            <p>Je nach genutzten Services können u. a. verarbeitet werden:</p>
            <ul className="list-disc space-y-1 ps-5">
              <li>Namen, Geschäftskontaktdaten, E-Mail, Telefon;</li>
              <li>Mitarbeiter-, Kunden- und Lieferantendaten;</li>
              <li>Abrechnungs- und Transaktionsdaten, Kontoinformationen;</li>
              <li>Authentifizierungsinformationen, Gerätekennungen;</li>
              <li>technische Protokolle, Support-Kommunikation, Betriebsdaten.</li>
            </ul>
            <p>Die konkreten Kategorien hängen von der Nutzung durch den Verantwortlichen ab.</p>
          </Article>
          <Article title="Artikel 8 – Kategorien betroffener Personen" h3={h3}>
            <p>Betroffene Personen können sein:</p>
            <ul className="list-disc space-y-1 ps-5">
              <li>Mitarbeiter, autorisierte Nutzer, Kunden, Interessenten;</li>
              <li>Lieferanten, Auftragnehmer, Berater, Geschäftspartner;</li>
              <li>sonstige Personen, deren Daten der Verantwortliche in die Services eingibt.</li>
            </ul>
            <p>Der Verantwortliche bestimmt allein, welche Kategorien verarbeitet werden.</p>
          </Article>
          <Article title="Artikel 9 – Rollen der Parteien" h3={h3}>
            <p>
              Der Kunde ist Verantwortlicher; Caisty ist Auftragsverarbeiter bei Verarbeitung im Auftrag. Nichts in
              diesem AVV überträgt Eigentum oder Kontrolle über personenbezogene Daten vom Verantwortlichen an Caisty.
              Jede Partei erfüllt die ihr obliegenden Pflichten aus dem Datenschutzrecht.
            </p>
          </Article>
          <Article title="Artikel 10 – Allgemeine Pflichten des Auftragsverarbeiters" h3={h3}>
            <p>Caisty wird:</p>
            <ul className="list-disc space-y-1 ps-5">
              <li>personenbezogene Daten nur auf dokumentierte Weisung verarbeiten, sofern nicht gesetzlich anders vorgeschrieben;</li>
              <li>befugtes Personal zur Vertraulichkeit verpflichten;</li>
              <li>angemessene technische und organisatorische Maßnahmen umsetzen;</li>
              <li>den Verantwortlichen bei Datenschutzpflichten unterstützen;</li>
              <li>erforderliche Verarbeitungsnachweise führen;</li>
              <li>Datenschutzverletzungen melden;</li>
              <li>mit Aufsichtsbehörden kooperieren, soweit gesetzlich erforderlich;</li>
              <li>sicherstellen, dass Unterauftragsverarbeiter gleichwertige Pflichten übernehmen.</li>
            </ul>
            <p>Caisty verkauft, vermietet oder kommerzialisiert verarbeitete personenbezogene Daten nicht.</p>
          </Article>
        </CollapsiblePart>

        <CollapsiblePart title="Teil II – Sicherheit und Vertraulichkeit" shell={partShell} h2={h2}>
          <Article title="Artikel 11 – Vertraulichkeit" h3={h3}>
            <p>
              Caisty stellt sicher, dass alle Personen mit Zugang zu personenbezogenen Daten einer angemessenen
              Vertraulichkeitspflicht unterliegen – einschließlich Mitarbeiter, Beauftragter, Unterauftragsverarbeiter
              und sonstiger berechtigter Personen. Die Pflicht gilt auch nach Beendigung des Arbeits-/Vertragsverhältnisses
              oder dieses AVV. Zugang erfolgt strikt nach Need-to-know-Prinzip.
            </p>
          </Article>
          <Article title="Artikel 12 – Technische und organisatorische Maßnahmen (TOMs)" h3={h3}>
            <p>
              Caisty implementiert angemessene TOMs zum Schutz personenbezogener Daten vor Zerstörung, Verlust,
              Veränderung, unbefugter Offenlegung oder unbefugtem Zugriff. Je nach Service können u. a. gelten:
            </p>
            <ul className="list-disc space-y-1 ps-5">
              <li>Verschlüsselung bei Übertragung und – wo angemessen – bei Speicherung;</li>
              <li>sichere Authentifizierung, Passwort-Hashing, MFA wo verfügbar;</li>
              <li>rollenbasierte Zugriffe, Least-Privilege, Netzwerksegmentierung, Firewalls;</li>
              <li>Endpoint-Sicherheit, Schwachstellenmanagement, Malware-Schutz;</li>
              <li>Sicherheitsmonitoring, Backups, Disaster Recovery, regelmäßige Sicherheitsüberprüfungen.</li>
            </ul>
            <p>
              Details siehe Anhang II. TOMs dürfen aktualisiert werden, sofern das Schutzniveau nicht wesentlich gesenkt
              wird.
            </p>
          </Article>
          <Article title="Artikel 13 – Sicherheit der Verarbeitung" h3={h3}>
            <p>
              Unter Berücksichtigung des Stands der Technik, der Implementierungskosten, Art, Umfang, Kontext und Zweck
              der Verarbeitung sowie der Risiken für Rechte und Freiheiten natürlicher Personen setzt Caisty angemessene
              Sicherheitsmaßnahmen gemäß Art. 32 DSGVO um – zur Gewährleistung von Vertraulichkeit, Integrität,
              Verfügbarkeit und Belastbarkeit der Systeme. Caisty verbessert sein Sicherheitsprogramm regelmäßig durch
              Risikoanalysen, Reviews, Updates, Infrastrukturverbesserungen und Monitoring.
            </p>
          </Article>
          <Article title="Artikel 14 – Zugriffskontrollen" h3={h3}>
            <p>
              Zugriff ist auf autorisiertes Personal beschränkt. Maßnahmen können individuelle Konten, rollenbasierte
              Berechtigungen, Authentifizierung, Passwortrichtlinien, Sitzungsmanagement, Privileged Access Management,
              Protokollierung administrativer Aktivitäten, regelmäßige Zugriffsüberprüfungen und zeitnaher Entzug
              unnötiger Rechte umfassen.
            </p>
          </Article>
          <Article title="Artikel 15 – Incident Management" h3={h3}>
            <p>
              Caisty unterhält dokumentierte Verfahren zur Identifikation, Bewertung, Eindämmung, Untersuchung,
              Behebung und Auflösung von Sicherheitsvorfällen – einschließlich Erkennung, Klassifizierung,
              Risikobewertung, Forensik, Wiederherstellung und Nachbereitung mit Korrekturmaßnahmen.
            </p>
          </Article>
          <Article title="Artikel 16 – Verletzungen des Schutzes personenbezogener Daten" h3={h3}>
            <p>
              Wird Caisty einer Datenschutzverletzung im Auftrag des Verantwortlichen bewusst, informiert Caisty den
              Verantwortlichen unverzüglich. Soweit verfügbar, werden Art der Verletzung, betroffene Datenkategorien und
              Personengruppen, wahrscheinliche Folgen und ergriffene/vorgeschlagene Maßnahmen mitgeteilt – ggf.
              schrittweise. Caisty unterstützt den Verantwortlichen bei Meldepflichten gegenüber Aufsichtsbehörden.
            </p>
          </Article>
          <Article title="Artikel 17 – Business Continuity" h3={h3}>
            <p>
              Caisty unterhält Notfall- und Wiederherstellungsverfahren für kritische Services (u. a. Redundanz,
              verschlüsselte Backups, Wiederherstellungstests, Notfallpläne). Garantierte RTO/RPO bestehen nur bei
              separater schriftlicher SLA-Vereinbarung.
            </p>
          </Article>
          <Article title="Artikel 18 – Audits" h3={h3}>
            <p>
              Der Verantwortliche kann angemessene Compliance-Nachweise anfordern (Sicherheitsdokumentation, Auditberichte,
              Zertifikate, Fragebögen, TOM-Beschreibungen). Vor-Ort-Audits nur, wenn gesetzlich erforderlich und nicht
              durch Dokumentation ersetzbar – in gutem Einvernehmen, während üblicher Geschäftszeiten, ohne
              unverhältnismäßige Störung, unter Vertraulichkeit. Kosten trägt grundsätzlich der Verantwortliche.
            </p>
          </Article>
        </CollapsiblePart>

        <CollapsiblePart title="Teil III – Unterauftragsverarbeiter und internationale Übermittlungen" shell={partShell} h2={h2}>
          <Article title="Artikel 19 – Autorisierte Unterauftragsverarbeiter" h3={h3}>
            <p>
              Der Verantwortliche erteilt Caisty eine allgemeine Genehmigung, Unterauftragsverarbeiter einzusetzen, sofern
              vertraglich gleichwertige Datenschutzpflichten bestehen. Dienste können u. a. Hosting, Infrastruktur,
              Speicher, Backup, Zahlungsabwicklung, E-Mail, Monitoring, Cybersicherheit, Authentifizierung und Support
              umfassen. Caisty bleibt verantwortlich; die Beauftragung entbindet Caisty nicht von AVV-Pflichten.
            </p>
          </Article>
          <Article title="Artikel 20 – Beauftragung neuer Unterauftragsverarbeiter" h3={h3}>
            <p>Caisty kann zusätzliche Unterauftragsverarbeiter beauftragen, soweit für Services erforderlich. Caisty wird:</p>
            <ul className="list-disc space-y-1 ps-5">
              <li>eine aktuelle Liste führen;</li>
              <li>
                diese auf der Website, im Kundenportal oder über{" "}
                <LegalDocumentLink to={LEGAL_PATHS.subprocessors} isLight={isLight}>
                  /legal/subprocessors
                </LegalDocumentLink>{" "}
                veröffentlichen;
              </li>
              <li>bei wesentlichen Änderungen angemessen informieren.</li>
            </ul>
            <p>
              Bei berechtigtem Widerspruch suchen die Parteien in gutem Einvernehmen eine Lösung; scheitert dies und ist
              der Widerspruch rechtlich begründet, kann die betroffene Verarbeitung beendet werden.
            </p>
          </Article>
          <Article title="Artikel 21 – Internationale Datenübermittlungen" h3={h3}>
            <p>
              Übermittlungen außerhalb des EWR erfolgen nur mit geeigneten Garantien (Angemessenheitsbeschluss,
              EU-Standardvertragsklauseln, Zertifizierungen, Verhaltenskodizes, ergänzende technische/organisatorische
              Maßnahmen) und nur, soweit für die Services erforderlich. Caisty überprüft Transfermechanismen regelmäßig.
            </p>
          </Article>
          <Article title="Artikel 22 – Unterstützung des Verantwortlichen" h3={h3}>
            <p>
              Caisty unterstützt den Verantwortlichen angemessen bei Betroffenenanfragen, DSFA, Behördenkonsultationen,
              Sicherheitsmaßnahmen, Verletzungsmanagement, Compliance-Dokumentation und behördlichen Anfragen. Für
              Unterstützung über Standardpflichten hinaus können angemessene Gebühren anfallen, soweit vertraglich
              zulässig.
            </p>
          </Article>
          <Article title="Artikel 23 – Betroffenenrechte" h3={h3}>
            <p>
              Caisty unterstützt den Verantwortlichen bei Auskunft, Berichtigung, Löschung, Einschränkung, Datenportabilität,
              Widerspruch und automatisierten Entscheidungen, soweit rechtlich und technisch möglich. Direktanfragen von
              Betroffenen leitet Caisty an den Verantwortlichen weiter und antwortet nicht direkt, außer wo autorisiert
              oder gesetzlich vorgeschrieben.
            </p>
          </Article>
          <Article title="Artikel 24 – Behördenanfragen" h3={h3}>
            <p>
              Bei rechtmäßigen behördlichen Anfragen prüft Caisty die Rechtsgrundlage, gibt nur Erforderliches preis,
              setzt verfügbare Schutzmaßnahmen um und informiert den Verantwortlichen unverzüglich, soweit erlaubt.
              Freiwillige Offenlegung erfolgt nicht, außer gesetzlich erforderlich oder vom Verantwortlichen ausdrücklich
              genehmigt.
            </p>
          </Article>
          <Article title="Artikel 25 – Verarbeitungsverzeichnis" h3={h3}>
            <p>
              Caisty führt Verarbeitungsnachweise gemäß Art. 30 DSGVO, soweit anwendbar, und stellt sie Aufsichtsbehörden
              zur Verfügung, wenn gesetzlich erforderlich. Der Verantwortliche bleibt für eigene Verzeichnispflichten
              verantwortlich.
            </p>
          </Article>
        </CollapsiblePart>

        <CollapsiblePart title="Teil IV – Rückgabe, Löschung und Schlussbestimmungen" shell={partShell} h2={h2}>
          <Article title="Artikel 26 – Rückgabe oder Löschung personenbezogener Daten" h3={h3}>
            <p>
              Nach Beendigung der Services gibt Caisty – auf Weisung und soweit technisch machbar – Daten zurück,
              ermöglicht Export, löscht oder anonymisiert sie sicher. Aufbewahrung ist zulässig für gesetzliche,
              steuerliche, gerichtliche oder behördliche Pflichten sowie Rechtsverteidigung. Verbleibende Daten bleiben
              geschützt bis zur Löschung oder Anonymisierung.
            </p>
          </Article>
          <Article title="Artikel 27 – Haftung" h3={h3}>
            <p>
              Jede Partei haftet für ihre Datenschutzpflichten. Caisty haftet nicht für Verarbeitungsentscheidungen, die
              allein der Verantwortliche trifft, wenn Caisty dokumentierten Weisungen und AVV-Pflichten nachkommt. Der
              Verantwortliche trägt Verantwortung für Zwecke, Rechtsgrundlagen, Richtigkeit, Einwilligungen und eigene
              Compliance. Haftungsregelungen der AGB/EULA gelten ergänzend, soweit zulässig.
            </p>
          </Article>
          <Article title="Artikel 28 – Beendigung" h3={h3}>
            <p>
              Der AVV endet automatisch, wenn alle Auftragsverarbeitung beendet ist und Vertragsbeziehungen enden, sofern
              nicht gesetzliche Pflichten fortbestehen. Fortgeltende Pflichten (Vertraulichkeit, Datenschutz, Löschung,
              Haftung) bleiben wirksam.
            </p>
          </Article>
          <Article title="Artikel 29 – Anwendbares Recht" h3={h3}>
            <p>
              Dieser AVV unterliegt dem Recht der <strong>Bundesrepublik Deutschland</strong> und ist nach diesem auszulegen,
              soweit nicht zwingendes Datenschutzrecht etwas anderes vorschreibt. Zwingende Anforderungen der DSGVO oder
              anderer Datenschutzgesetze gehen vor. Streitigkeiten werden – ergänzend zu den Streitbeilegungsregelungen der
              AGB oder anderer vertraglicher Vereinbarungen – geklärt. Die Befugnisse der Aufsichtsbehörden bleiben unberührt.
            </p>
          </Article>
          <Article title="Artikel 30 – Schlussbestimmungen" h3={h3}>
            <p>
              Dieser AVV ist die vollständige Vereinbarung zur Auftragsverarbeitung und ersetzt frühere Vereinbarungen zu
              diesem Gegenstand. Unwirksame Bestimmungen berühren die übrigen nicht. Nichtdurchsetzung einzelner
              Bestimmungen ist kein Verzicht. Caisty kann den AVV bei Rechts-, Regulierungs- oder Technikänderungen
              anpassen; wesentliche Änderungen werden mitgeteilt.
            </p>
          </Article>
        </CollapsiblePart>

        <CollapsiblePart title="Anhang I – Beschreibung der Verarbeitung" shell={partShell} h2={h2}>
          <p><strong>Gegenstand:</strong> Bereitstellung cloud-basierter Business-Software und zugehöriger Dienste.</p>
          <p>
            <strong>Art der Verarbeitung:</strong> Erhebung, Aufzeichnung, Organisation, Speicherung, Abruf, Übermittlung,
            Synchronisation, Hosting, Backup, Wiederherstellung, Löschung, Anonymisierung.
          </p>
          <p>
            <strong>Zweck:</strong> Bereitstellung der Services, Software-Lizenzierung, Kundenportal, Cloud-Sync, Support,
            Sicherheit, Wartung, Disaster Recovery.
          </p>
          <p>
            <strong>Kategorien personenbezogener Daten:</strong> Identifikations-, Kontakt-, Authentifizierungs-,
            Abrechnungs-, Transaktions-, Mitarbeiter-, Kunden-, technische Protokoll- und Gerätedaten.
          </p>
          <p>
            <strong>Kategorien betroffener Personen:</strong> Kunden, Nutzer, Mitarbeiter, Kunden/Lieferanten des
            Verantwortlichen, Auftragnehmer, Berater und sonstige in die Services eingegebene Personen.
          </p>
        </CollapsiblePart>

        <CollapsiblePart title="Anhang II – Technische und organisatorische Maßnahmen (TOMs)" shell={partShell} h2={h2}>
          <p>Caisty unterhält angemessene TOMs, u. a.:</p>
          <ul className="list-disc space-y-1 ps-5">
            <li>Verschlüsselung bei Übertragung und – wo angemessen – bei Speicherung;</li>
            <li>rollenbasierte Zugriffskontrolle, Least-Privilege-Administration;</li>
            <li>sichere Authentifizierung, Passwort-Hashing, MFA wo verfügbar;</li>
            <li>Netzwerksicherheit, Firewalls, Schwachstellen- und Malware-Schutz;</li>
            <li>Infrastruktur-Monitoring, Security-Logging;</li>
            <li>verschlüsselte Backups, Disaster Recovery, Business Continuity;</li>
            <li>Vertraulichkeit des Personals, regelmäßige Sicherheitsüberprüfungen, Incident Response.</li>
          </ul>
          <p>Maßnahmen werden regelmäßig überprüft und dürfen aktualisiert werden, sofern das Schutzniveau nicht wesentlich gesenkt wird.</p>
        </CollapsiblePart>

        <CollapsiblePart title="Anhang III – Autorisierte Unterauftragsverarbeiter" shell={partShell} h2={h2}>
          <p>
            Je nach genutzten Services können Unterauftragsverarbeiter für Hosting, Infrastruktur, Zahlungen, E-Mail,
            Authentifizierung, Monitoring, Cybersicherheit, Backup und Support eingesetzt werden.
          </p>
          <p>
            Die aktuelle, verbindliche Liste autorisierter Unterauftragsverarbeiter ist verfügbar unter{" "}
            <LegalDocumentLink to={LEGAL_PATHS.subprocessors} isLight={isLight}>
              /legal/subprocessors
            </LegalDocumentLink>
            .
          </p>
        </CollapsiblePart>

        <section className="space-y-3">
          <h2 className={`text-xl font-semibold ${h2}`}>Parteien / Kontakt</h2>
          <div className={card}>
            <p className={`font-semibold ${h2}`}>Caisty · Inhaber: Siraj Bettaieb</p>
            <p>Mollwitzstraße 5A, 14059 Berlin, Deutschland</p>
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
            <p>
              Allgemein:{" "}
              <a href="mailto:info@caisty.com" className={legalDocumentLinkClass(isLight)}>
                info@caisty.com
              </a>
            </p>
            <p className="pt-2">
              <strong>Inkrafttreten (Effective Date):</strong> 1. Juli 2026
            </p>
          </div>
        </section>

        <section className={`space-y-3 pt-4 border-t ${isLight ? "border-slate-200" : "border-white/10"}`}>
          <h2 className={`text-xl font-semibold ${h2}`}>Related Documents</h2>
          <ul className="list-disc space-y-1 ps-5">
            <li>
              <LegalDocumentLink to={LEGAL_PATHS.terms} isLight={isLight}>
                Terms &amp; Conditions
              </LegalDocumentLink>
            </li>
            <li>
              <LegalDocumentLink to={LEGAL_PATHS.privacy} isLight={isLight}>
                Privacy Policy
              </LegalDocumentLink>
            </li>
            <li>
              <LegalDocumentLink to={LEGAL_PATHS.cookie} isLight={isLight}>
                Cookie Policy
              </LegalDocumentLink>
            </li>
            <li>
              <LegalDocumentLink to={LEGAL_PATHS.eula} isLight={isLight}>
                EULA
              </LegalDocumentLink>
            </li>
            <li>
              <LegalDocumentLink to={LEGAL_PATHS.imprint} isLight={isLight}>
                Imprint
              </LegalDocumentLink>
            </li>
          </ul>
        </section>
      </div>
    </div>
  );
}

function CollapsiblePart(props: { title: string; shell: string; h2: string; children: ReactNode; defaultOpen?: boolean }) {
  return (
    <details open={props.defaultOpen} className={`group ${props.shell}`}>
      <summary className={`cursor-pointer list-none px-4 py-4 font-semibold text-base sm:text-lg ${props.h2} [&::-webkit-details-marker]:hidden`}>
        <span className="inline-flex items-center gap-2">
          <span className="text-[#f97316] transition-transform group-open:rotate-90" aria-hidden>
            ▸
          </span>
          {props.title}
        </span>
      </summary>
      <div className="space-y-5 px-4 pb-5 pt-1">{props.children}</div>
    </details>
  );
}

function Article(props: { title: string; h3: string; children: ReactNode }) {
  return (
    <div className="space-y-2">
      <h3 className={`text-base font-semibold ${props.h3}`}>{props.title}</h3>
      <div className="space-y-2">{props.children}</div>
    </div>
  );
}
