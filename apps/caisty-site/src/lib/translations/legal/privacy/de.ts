import { legalContact } from "../shared/contact";
import { legalLinkLabels, legalRelatedLabels } from "../shared/labels";
import type { PrivacyCopy } from "./types";

const { imprintNote: _imprintNote, ...privacyContactDe } = legalContact.de;

export const privacyDe: PrivacyCopy = {
  documentLabel: "Rechtliches",
  title: "Datenschutzerklärung",
  lastUpdatedLabel: "Stand",
  effectiveDate: "1. Juli 2026",
  intro:
    "Diese Datenschutzerklärung erläutert, wie Caisty personenbezogene Daten erhebt, nutzt, speichert und schützt, wenn Sie unsere Website, Caisty POS, das Kundenportal und zugehörige Dienste nutzen. Sie ist Teil des rechtlichen Rahmens von Caisty und sollte zusammen mit den {{terms}}, der {{cookie}}, dem {{eula}} und – soweit anwendbar – dem {{dpa}} gelesen werden.",
  linkLabels: legalLinkLabels.de,
  sections: [
    {
      title: "1. Verantwortlicher",
      paragraphs: [
        "Verantwortlicher im Sinne der Datenschutz-Grundverordnung (DSGVO) ist:",
        "Caisty, Inhaber Siraj Bettaieb, Mollwitzstraße 5A, 14059 Berlin, Deutschland. Allgemeine Anfragen: {{infoEmail}}. Support: {{supportEmail}}. Datenschutz: {{privacyEmail}}.",
        "Soweit Caisty personenbezogene Daten im Auftrag von Geschäftskunden verarbeitet, kann Caisty als Auftragsverarbeiter im Sinne von Art. 28 DSGVO handeln. Einzelheiten ergeben sich dann aus dem {{dpa}}.",
      ],
    },
    {
      title: "2. Geltungsbereich",
      paragraphs: [
        "Diese Datenschutzerklärung gilt für die Verarbeitung personenbezogener Daten im Zusammenhang mit:",
        "Sie gilt unabhängig davon, ob Sie unsere Leistungen über Website, Software, Portal oder andere autorisierte Zugangswege nutzen – vor, während und nach einer Vertragsbeziehung, soweit Daten weiterhin gemäß Recht verarbeitet werden.",
      ],
      list: [
        "der Website caisty.com und zugehörigen Unterseiten;",
        "Caisty POS (Desktop-Software und zugehörige Cloud-Funktionen);",
        "dem Caisty-Kundenportal;",
        "Cloud-Diensten, Synchronisation und Verwaltungsfunktionen;",
        "Lizenzierung, Aktivierung und Geräteverwaltung;",
        "Abrechnung, Rechnungsstellung und Abonnementverwaltung;",
        "Support-Kommunikation und Kundenanfragen;",
        "APIs und technischen Schnittstellen, soweit diese angeboten werden.",
      ],
    },
    {
      title: "3. Welche Daten wir verarbeiten",
      paragraphs: [
        "Je nach genutzter Leistung können wir unterschiedliche Kategorien personenbezogener Daten verarbeiten, insbesondere:",
        "Passwörter werden nicht im Klartext gespeichert. Geschäftsdaten, die Sie in Caisty POS oder im Portal eingeben (z. B. Artikel, Bestellungen, Kunden im Betrieb), können personenbezogene Daten Dritter enthalten; für deren rechtmäßige Verarbeitung bleiben Sie als Betreiber verantwortlich.",
      ],
      list: [
        "Name und Kontaktdaten;",
        "Firmen- bzw. Unternehmensname;",
        "E-Mail-Adresse;",
        "Rechnungs- und zahlungsbezogene Angaben;",
        "Kontodaten (Benutzerkennung, Spracheinstellungen, Profilinformationen);",
        "Lizenzdaten (Lizenzschlüssel, Plan, Status, Laufzeit);",
        "Gerätedaten (Gerätekennungen, Betriebssystem, App-Version, Aktivierungsstatus);",
        "IP-Adresse und Verbindungsdaten;",
        "technische Protokolle und Fehlerberichte;",
        "Support-Nachrichten und Kommunikationsinhalte;",
        "Zahlungsstatus und Transaktionsreferenzen (ohne vollständige Kartendaten bei Caisty).",
      ],
    },
    {
      title: "4. Zwecke der Verarbeitung",
      paragraphs: ["Wir verarbeiten personenbezogene Daten insbesondere zu folgenden Zwecken:"],
      list: [
        "Erstellung und Verwaltung von Kundenkonten;",
        "E-Mail-Verifizierung und Authentifizierung;",
        "Anmeldung, Login und Zugriffskontrolle;",
        "Lizenzaktivierung, -verwaltung und Gerätezuordnung;",
        "Abonnement- und Vertragsverwaltung;",
        "Rechnungsstellung und buchhalterische Abwicklung;",
        "Zahlungsbestätigung und Mahnwesen;",
        "Kundensupport und Bearbeitung von Anfragen;",
        "Sicherheit, Betrugsprävention und Missbrauchserkennung;",
        "Betrieb, Wartung und Verbesserung unserer Leistungen;",
        "Erfüllung gesetzlicher Pflichten.",
      ],
    },
    {
      title: "5. Rechtsgrundlagen",
      paragraphs: ["Die Verarbeitung erfolgt auf Grundlage der DSGVO, insbesondere:"],
      list: [
        "**Art. 6 Abs. 1 lit. b DSGVO** – zur Durchführung vorvertraglicher Maßnahmen und zur Erfüllung des Vertrags (Konto, Lizenz, Abrechnung, Support);",
        "**Art. 6 Abs. 1 lit. c DSGVO** – zur Erfüllung rechtlicher Verpflichtungen (z. B. steuer- und handelsrechtliche Aufbewahrung);",
        "**Art. 6 Abs. 1 lit. f DSGVO** – auf Basis berechtigter Interessen (z. B. IT-Sicherheit, Stabilität, Fehleranalyse, Serviceverbesserung), sofern Ihre Interessen nicht überwiegen;",
        "**Art. 6 Abs. 1 lit. a DSGVO** – auf Grundlage Ihrer Einwilligung, soweit eine Einwilligung erforderlich ist (z. B. für nicht essenzielle Cookies oder optionale Marketing-Kommunikation).",
      ],
    },
    {
      title: "6. Zahlungsanbieter",
      paragraphs: [
        "Zahlungen können über externe Zahlungsdienstleister wie **Stripe**, **PayPal** oder andere im Kundenportal angezeigte Anbieter abgewickelt werden.",
        "Caisty speichert keine vollständigen Zahlungskartendaten. Zahlungsinformationen werden direkt durch den jeweiligen Zahlungsdienstleister verarbeitet. Wir erhalten in der Regel nur Informationen wie Zahlungsstatus, Transaktions-ID, Betrag und begrenzte Abrechnungsmetadaten, die für Vertrag und Buchhaltung erforderlich sind.",
        "Für die Verarbeitung durch Zahlungsdienstleister gelten deren eigene Datenschutzhinweise. Wir empfehlen, diese beim Checkout zu prüfen.",
      ],
    },
    {
      title: "7. Hosting und Dienstleister",
      paragraphs: [
        "Zur Bereitstellung unserer Leistungen setzen wir sorgfältig ausgewählte Dienstleister ein, etwa für:",
        "Diese Dienstleister verarbeiten Daten nur im erforderlichen Umfang und – soweit sie Auftragsverarbeiter sind – auf Grundlage vertraglicher Vereinbarungen gemäß Art. 28 DSGVO. Eine aktuelle Übersicht wesentlicher {{subprocessors}} stellen wir gesondert bereit.",
        "Eine Verarbeitung außerhalb des Europäischen Wirtschaftsraums erfolgt nur, wenn geeignete Garantien (z. B. Standardvertragsklauseln) vorliegen.",
      ],
      list: [
        "Hosting und Cloud-Infrastruktur;",
        "Speicherung und Betrieb von Anwendungen;",
        "E-Mail-Versand und Transaktionskommunikation;",
        "Zahlungsabwicklung;",
        "Sicherheits- und Monitoring-Dienste.",
      ],
    },
    {
      title: "8. Cookies",
      paragraphs: [
        "Unsere Website und Dienste können Cookies und ähnliche Technologien verwenden, z. B. für Anmeldung, Sicherheit, Spracheinstellungen oder – mit Einwilligung – Analysefunktionen.",
        "Einzelheiten zu verwendeten Cookies, Speicherdauer und Ihren Wahlmöglichkeiten finden Sie in unserer {{cookie}}.",
      ],
    },
    {
      title: "9. Speicherdauer",
      paragraphs: [
        "Wir speichern personenbezogene Daten nur so lange, wie dies für die genannten Zwecke erforderlich ist oder gesetzliche Aufbewahrungspflichten bestehen.",
        "Vertrags- und Abrechnungsdaten können wir insbesondere für die Dauer der Vertragsbeziehung sowie darüber hinaus gemäß handels- und steuerrechtlichen Vorgaben aufbewahren. Support-Nachrichten und technische Protokolle werden nur so lange gespeichert, wie dies für Support, Sicherheit oder Nachweiszwecke erforderlich ist.",
        "Nach Ablauf der jeweiligen Fristen werden Daten gelöscht oder anonymisiert, sofern keine weitergehende Aufbewahrung gesetzlich zulässig oder erforderlich ist.",
      ],
    },
    {
      title: "10. Rechte der betroffenen Personen",
      paragraphs: [
        "Sie haben – je nach Voraussetzungen – folgende Rechte unter der DSGVO:",
        "Zur Ausübung Ihrer Rechte wenden Sie sich an {{privacyEmail}}. Sie haben zudem das Recht, sich bei einer Datenschutz-Aufsichtsbehörde zu beschweren, insbesondere in dem EU-Mitgliedstaat Ihres Wohnsitzes, Arbeitsplatzes oder des Ortes des mutmaßlichen Verstoßes.",
      ],
      list: [
        "**Auskunft** (Art. 15 DSGVO) über die Verarbeitung Ihrer Daten;",
        "**Berichtigung** (Art. 16 DSGVO) unrichtiger Daten;",
        "**Löschung** (Art. 17 DSGVO), soweit keine Aufbewahrungspflichten entgegenstehen;",
        "**Einschränkung der Verarbeitung** (Art. 18 DSGVO);",
        "**Datenübertragbarkeit** (Art. 20 DSGVO), soweit anwendbar;",
        "**Widerspruch** (Art. 21 DSGVO) gegen Verarbeitungen auf Basis berechtigter Interessen;",
        "**Widerruf erteilter Einwilligungen** (Art. 7 Abs. 3 DSGVO) mit Wirkung für die Zukunft.",
      ],
    },
    {
      title: "11. Sicherheit",
      paragraphs: [
        "Caisty trifft angemessene technische und organisatorische Maßnahmen zum Schutz personenbezogener Daten vor unbefugtem Zugriff, Verlust, Manipulation oder Offenlegung, unter anderem:",
        "Absolute Sicherheit kann technisch nicht garantiert werden. Sie sind ebenfalls verantwortlich für den Schutz Ihrer Zugangsdaten und der Geräte, auf denen Caisty POS genutzt wird.",
      ],
      list: [
        "verschlüsselte Kommunikation (z. B. TLS/HTTPS);",
        "sichere Passwort-Speicherung (Hashing);",
        "rollenbasierte Zugriffskontrolle;",
        "regelmäßige Backups und Wiederherstellungskonzepte;",
        "Monitoring und Protokollierung sicherheitsrelevanter Ereignisse;",
        "regelmäßige Updates und Sicherheitsverbesserungen.",
      ],
    },
  ],
  contactSectionTitle: "12. Kontakt",
  contactSectionIntro:
    "Bei Fragen zum Datenschutz, zur Ausübung Ihrer Rechte oder zu dieser Datenschutzerklärung erreichen Sie uns unter: Wir behalten uns vor, diese Datenschutzerklärung anzupassen, wenn sich Rechtslage, Leistungen oder Verarbeitungsprozesse ändern. Die jeweils aktuelle Fassung ist auf dieser Seite abrufbar.",
  contact: privacyContactDe,
  related: legalRelatedLabels.de,
  showOwnerInContact: false,
};
