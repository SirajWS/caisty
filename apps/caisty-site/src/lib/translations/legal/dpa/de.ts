import { legalContact } from "../shared/contact";
import { legalLinkLabels, legalRelatedLabels } from "../shared/labels";
import type { DpaCopy } from "./types";

export const dpaDe: DpaCopy = {
  documentLabel: "Data Processing Agreement (DPA)",
  title: "Auftragsverarbeitungsvertrag (AVV)",
  lastUpdatedLabel: "Stand",
  effectiveDate: "1. Juli 2026",
  versionLabel: "Version",
  version: "2.0 (Master Edition)",
  intro:
    "Dieser Auftragsverarbeitungsvertrag („AVV“ oder „DPA“) regelt die Verarbeitung personenbezogener Daten, wenn Caisty als Auftragsverarbeiter im Auftrag des Kunden (Verantwortlicher) handelt. Er erfüllt die Anforderungen von Art. 28 DSGVO und ergänzt {{eula}}, {{terms}} und {{privacy}}. Bei Widersprüchen zur Datenverarbeitung gilt dieser AVV vorrangig, soweit datenschutzrechtlich erforderlich.",
  linkLabels: legalLinkLabels.de,
  sections: [
    {
      title: "Teil I – Allgemeine Bestimmungen",
      subsections: [
        {
          title: "Artikel 1 – Zweck",
          paragraphs: [
            "Dieser AVV ist Bestandteil der Vertragsbeziehung zwischen Caisty („Auftragsverarbeiter“) und dem Kunden („Verantwortlicher“) und regelt die Verarbeitung personenbezogener Daten im Zusammenhang mit den von Caisty bereitgestellten Services.",
            "Er soll die Anforderungen von Art. 28 der Datenschutz-Grundverordnung (EU) 2016/679 („DSGVO“) und weiterer anwendbarer Datenschutzgesetze erfüllen. Verarbeitet Caisty personenbezogene Daten im Auftrag des Kunden, regelt dieser AVV die Rechte und Pflichten beider Parteien.",
            "Der AVV ergänzt und ist zu lesen zusammen mit:",
          ],
          list: [
            "Endbenutzer-Lizenzvereinbarung (EULA);",
            "Allgemeinen Geschäftsbedingungen;",
            "Abonnementvereinbarung;",
            "Datenschutzerklärung;",
            "geltenden Bestellformularen oder Servicevereinbarungen.",
          ],
        },
        {
          title: "Artikel 2 – Begriffe",
          list: [
            "**Verantwortlicher** – natürliche oder juristische Person, die Zwecke und Mittel der Verarbeitung bestimmt",
            "**Auftragsverarbeiter** – Caisty bei Verarbeitung im Auftrag des Verantwortlichen",
            "**personenbezogene Daten** – Informationen über identifizierte oder identifizierbare natürliche Personen gemäß anwendbarem Datenschutzrecht",
            "**Verarbeitung** – jeder Vorgang mit personenbezogenen Daten (Erhebung, Speicherung, Organisation, Abruf, Nutzung, Offenlegung, Übermittlung, Löschung u. a.)",
            "**betroffene Person** – Person, deren personenbezogene Daten verarbeitet werden",
            "**Unterauftragsverarbeiter (Subprocessor)** – Dritter, der im Auftrag personenbezogene Daten verarbeitet",
            "**Verletzung des Schutzes personenbezogener Daten** – Sicherheitsvorfall mit unbefugtem Zugriff, Verlust, Zerstörung oder Offenlegung",
          ],
          paragraphs: ["Nicht definierte Begriffe haben die Bedeutung aus EULA oder AGB."],
        },
        {
          title: "Artikel 3 – Geltungsbereich",
          paragraphs: [
            "Der AVV gilt, wenn Caisty personenbezogene Daten im Auftrag des Verantwortlichen im Zusammenhang mit den Services verarbeitet.",
            "Der AVV gilt nicht, wenn Caisty als eigenständiger Verantwortlicher handelt (z. B. eigene Abrechnung, Compliance, Betrugsprävention, Sicherheit, Unternehmensverwaltung). Dies regelt die Datenschutzerklärung.",
          ],
          list: [
            "Caisty POS;",
            "Kundenportal;",
            "Cloud-Dienste;",
            "Administrative Schnittstellen;",
            "APIs;",
            "Software-Lizenzierung;",
            "Kundensupport-Systeme;",
            "Backup-Infrastruktur;",
            "Authentifizierungsdienste;",
            "künftige von Caisty betriebene Services.",
          ],
        },
        {
          title: "Artikel 4 – Gegenstand der Verarbeitung",
          paragraphs: [
            "Gegenstand ist Bereitstellung, Betrieb, Wartung, Sicherheit, Support und kontinuierliche Verbesserung der Services. Verarbeitung kann umfassen:",
            "Verarbeitung erfolgt ausschließlich für vom Verantwortlichen festgelegte Zwecke.",
          ],
          list: [
            "Hosting von Kundendaten;",
            "Speicherung und Übermittlung personenbezogener Daten;",
            "Organisation und Cloud-Synchronisation;",
            "Bereitstellung von Software-Funktionen;",
            "Kundensupport, Updates, technische Wartung;",
            "Disaster Recovery und Backup.",
          ],
        },
        {
          title: "Artikel 5 – Dauer der Verarbeitung",
          paragraphs: [
            "Die Verarbeitung dauert für die Laufzeit des Vertragsverhältnisses. Nach Beendigung werden Daten gemäß diesem AVV, vertraglicher Dokumentation, gesetzlicher Aufbewahrungspflichten und Datenschutzrecht aufbewahrt, zurückgegeben, gelöscht oder anonymisiert. Fortführung ist zulässig, wenn gesetzlich erforderlich oder zur Geltendmachung von Rechtsansprüchen nötig.",
          ],
        },
        {
          title: "Artikel 6 – Art und Zweck der Verarbeitung",
          paragraphs: [
            "Caisty verarbeitet personenbezogene Daten ausschließlich zur Erbringung der vom Verantwortlichen angeforderten Services, u. a. Erhebung, Speicherung, Organisation, Abruf, Übermittlung, Synchronisation, Hosting, Backup, Wiederherstellung, technischer Support, Wartung, Sicherheitsüberwachung und Löschung.",
            "Caisty verarbeitet keine personenbezogenen Daten für eigene unabhängige Zwecke, außer wo ausdrücklich gesetzlich erlaubt oder Caisty als eigenständiger Verantwortlicher handelt.",
          ],
        },
        {
          title: "Artikel 7 – Kategorien personenbezogener Daten",
          paragraphs: [
            "Je nach genutzten Services können u. a. verarbeitet werden:",
            "Die konkreten Kategorien hängen von der Nutzung durch den Verantwortlichen ab.",
          ],
          list: [
            "Namen, Geschäftskontaktdaten, E-Mail, Telefon;",
            "Mitarbeiter-, Kunden- und Lieferantendaten;",
            "Abrechnungs- und Transaktionsdaten, Kontoinformationen;",
            "Authentifizierungsinformationen, Gerätekennungen;",
            "technische Protokolle, Support-Kommunikation, Betriebsdaten.",
          ],
        },
        {
          title: "Artikel 8 – Kategorien betroffener Personen",
          paragraphs: [
            "Betroffene Personen können sein:",
            "Der Verantwortliche bestimmt allein, welche Kategorien verarbeitet werden.",
          ],
          list: [
            "Mitarbeiter, autorisierte Nutzer, Kunden, Interessenten;",
            "Lieferanten, Auftragnehmer, Berater, Geschäftspartner;",
            "sonstige Personen, deren Daten der Verantwortliche in die Services eingibt.",
          ],
        },
        {
          title: "Artikel 9 – Rollen der Parteien",
          paragraphs: [
            "Der Kunde ist Verantwortlicher; Caisty ist Auftragsverarbeiter bei Verarbeitung im Auftrag. Nichts in diesem AVV überträgt Eigentum oder Kontrolle über personenbezogene Daten vom Verantwortlichen an Caisty. Jede Partei erfüllt die ihr obliegenden Pflichten aus dem Datenschutzrecht.",
          ],
        },
        {
          title: "Artikel 10 – Allgemeine Pflichten des Auftragsverarbeiters",
          paragraphs: [
            "Caisty wird:",
            "Caisty verkauft, vermietet oder kommerzialisiert verarbeitete personenbezogene Daten nicht.",
          ],
          list: [
            "personenbezogene Daten nur auf dokumentierte Weisung verarbeiten, sofern nicht gesetzlich anders vorgeschrieben;",
            "befugtes Personal zur Vertraulichkeit verpflichten;",
            "angemessene technische und organisatorische Maßnahmen umsetzen;",
            "den Verantwortlichen bei Datenschutzpflichten unterstützen;",
            "erforderliche Verarbeitungsnachweise führen;",
            "Datenschutzverletzungen melden;",
            "mit Aufsichtsbehörden kooperieren, soweit gesetzlich erforderlich;",
            "sicherstellen, dass Unterauftragsverarbeiter gleichwertige Pflichten übernehmen.",
          ],
        },
      ],
    },
    {
      title: "Teil II – Sicherheit und Vertraulichkeit",
      subsections: [
        {
          title: "Artikel 11 – Vertraulichkeit",
          paragraphs: [
            "Caisty stellt sicher, dass alle Personen mit Zugang zu personenbezogenen Daten einer angemessenen Vertraulichkeitspflicht unterliegen – einschließlich Mitarbeiter, Beauftragter, Unterauftragsverarbeiter und sonstiger berechtigter Personen. Die Pflicht gilt auch nach Beendigung des Arbeits-/Vertragsverhältnisses oder dieses AVV. Zugang erfolgt strikt nach Need-to-know-Prinzip.",
          ],
        },
        {
          title: "Artikel 12 – Technische und organisatorische Maßnahmen (TOMs)",
          paragraphs: [
            "Caisty implementiert angemessene TOMs zum Schutz personenbezogener Daten vor Zerstörung, Verlust, Veränderung, unbefugter Offenlegung oder unbefugtem Zugriff. Je nach Service können u. a. gelten:",
            "Details siehe Anhang II. TOMs dürfen aktualisiert werden, sofern das Schutzniveau nicht wesentlich gesenkt wird.",
          ],
          list: [
            "Verschlüsselung bei Übertragung und – wo angemessen – bei Speicherung;",
            "sichere Authentifizierung, Passwort-Hashing, MFA wo verfügbar;",
            "rollenbasierte Zugriffe, Least-Privilege, Netzwerksegmentierung, Firewalls;",
            "Endpoint-Sicherheit, Schwachstellenmanagement, Malware-Schutz;",
            "Sicherheitsmonitoring, Backups, Disaster Recovery, regelmäßige Sicherheitsüberprüfungen.",
          ],
        },
        {
          title: "Artikel 13 – Sicherheit der Verarbeitung",
          paragraphs: [
            "Unter Berücksichtigung des Stands der Technik, der Implementierungskosten, Art, Umfang, Kontext und Zweck der Verarbeitung sowie der Risiken für Rechte und Freiheiten natürlicher Personen setzt Caisty angemessene Sicherheitsmaßnahmen gemäß Art. 32 DSGVO um – zur Gewährleistung von Vertraulichkeit, Integrität, Verfügbarkeit und Belastbarkeit der Systeme. Caisty verbessert sein Sicherheitsprogramm regelmäßig durch Risikoanalysen, Reviews, Updates, Infrastrukturverbesserungen und Monitoring.",
          ],
        },
        {
          title: "Artikel 14 – Zugriffskontrollen",
          paragraphs: [
            "Zugriff ist auf autorisiertes Personal beschränkt. Maßnahmen können individuelle Konten, rollenbasierte Berechtigungen, Authentifizierung, Passwortrichtlinien, Sitzungsmanagement, Privileged Access Management, Protokollierung administrativer Aktivitäten, regelmäßige Zugriffsüberprüfungen und zeitnaher Entzug unnötiger Rechte umfassen.",
          ],
        },
        {
          title: "Artikel 15 – Incident Management",
          paragraphs: [
            "Caisty unterhält dokumentierte Verfahren zur Identifikation, Bewertung, Eindämmung, Untersuchung, Behebung und Auflösung von Sicherheitsvorfällen – einschließlich Erkennung, Klassifizierung, Risikobewertung, Forensik, Wiederherstellung und Nachbereitung mit Korrekturmaßnahmen.",
          ],
        },
        {
          title: "Artikel 16 – Verletzungen des Schutzes personenbezogener Daten",
          paragraphs: [
            "Wird Caisty einer Datenschutzverletzung im Auftrag des Verantwortlichen bewusst, informiert Caisty den Verantwortlichen unverzüglich. Soweit verfügbar, werden Art der Verletzung, betroffene Datenkategorien und Personengruppen, wahrscheinliche Folgen und ergriffene/vorgeschlagene Maßnahmen mitgeteilt – ggf. schrittweise. Caisty unterstützt den Verantwortlichen bei Meldepflichten gegenüber Aufsichtsbehörden.",
          ],
        },
        {
          title: "Artikel 17 – Business Continuity",
          paragraphs: [
            "Caisty unterhält Notfall- und Wiederherstellungsverfahren für kritische Services (u. a. Redundanz, verschlüsselte Backups, Wiederherstellungstests, Notfallpläne). Garantierte RTO/RPO bestehen nur bei separater schriftlicher SLA-Vereinbarung.",
          ],
        },
        {
          title: "Artikel 18 – Audits",
          paragraphs: [
            "Der Verantwortliche kann angemessene Compliance-Nachweise anfordern (Sicherheitsdokumentation, Auditberichte, Zertifikate, Fragebögen, TOM-Beschreibungen). Vor-Ort-Audits nur, wenn gesetzlich erforderlich und nicht durch Dokumentation ersetzbar – in gutem Einvernehmen, während üblicher Geschäftszeiten, ohne unverhältnismäßige Störung, unter Vertraulichkeit. Kosten trägt grundsätzlich der Verantwortliche.",
          ],
        },
      ],
    },
    {
      title: "Teil III – Unterauftragsverarbeiter und internationale Übermittlungen",
      subsections: [
        {
          title: "Artikel 19 – Autorisierte Unterauftragsverarbeiter",
          paragraphs: [
            "Der Verantwortliche erteilt Caisty eine allgemeine Genehmigung, Unterauftragsverarbeiter einzusetzen, sofern vertraglich gleichwertige Datenschutzpflichten bestehen. Dienste können u. a. Hosting, Infrastruktur, Speicher, Backup, Zahlungsabwicklung, E-Mail, Monitoring, Cybersicherheit, Authentifizierung und Support umfassen. Caisty bleibt verantwortlich; die Beauftragung entbindet Caisty nicht von AVV-Pflichten.",
          ],
        },
        {
          title: "Artikel 20 – Beauftragung neuer Unterauftragsverarbeiter",
          paragraphs: [
            "Caisty kann zusätzliche Unterauftragsverarbeiter beauftragen, soweit für Services erforderlich. Caisty wird:",
            "Bei berechtigtem Widerspruch suchen die Parteien in gutem Einvernehmen eine Lösung; scheitert dies und ist der Widerspruch rechtlich begründet, kann die betroffene Verarbeitung beendet werden.",
          ],
          list: [
            "eine aktuelle Liste führen;",
            "diese auf der Website, im Kundenportal oder über {{subprocessors}} veröffentlichen;",
            "bei wesentlichen Änderungen angemessen informieren.",
          ],
        },
        {
          title: "Artikel 21 – Internationale Datenübermittlungen",
          paragraphs: [
            "Übermittlungen außerhalb des EWR erfolgen nur mit geeigneten Garantien (Angemessenheitsbeschluss, EU-Standardvertragsklauseln, Zertifizierungen, Verhaltenskodizes, ergänzende technische/organisatorische Maßnahmen) und nur, soweit für die Services erforderlich. Caisty überprüft Transfermechanismen regelmäßig.",
          ],
        },
        {
          title: "Artikel 22 – Unterstützung des Verantwortlichen",
          paragraphs: [
            "Caisty unterstützt den Verantwortlichen angemessen bei Betroffenenanfragen, DSFA, Behördenkonsultationen, Sicherheitsmaßnahmen, Verletzungsmanagement, Compliance-Dokumentation und behördlichen Anfragen. Für Unterstützung über Standardpflichten hinaus können angemessene Gebühren anfallen, soweit vertraglich zulässig.",
          ],
        },
        {
          title: "Artikel 23 – Betroffenenrechte",
          paragraphs: [
            "Caisty unterstützt den Verantwortlichen bei Auskunft, Berichtigung, Löschung, Einschränkung, Datenportabilität, Widerspruch und automatisierten Entscheidungen, soweit rechtlich und technisch möglich. Direktanfragen von Betroffenen leitet Caisty an den Verantwortlichen weiter und antwortet nicht direkt, außer wo autorisiert oder gesetzlich vorgeschrieben.",
          ],
        },
        {
          title: "Artikel 24 – Behördenanfragen",
          paragraphs: [
            "Bei rechtmäßigen behördlichen Anfragen prüft Caisty die Rechtsgrundlage, gibt nur Erforderliches preis, setzt verfügbare Schutzmaßnahmen um und informiert den Verantwortlichen unverzüglich, soweit erlaubt. Freiwillige Offenlegung erfolgt nicht, außer gesetzlich erforderlich oder vom Verantwortlichen ausdrücklich genehmigt.",
          ],
        },
        {
          title: "Artikel 25 – Verarbeitungsverzeichnis",
          paragraphs: [
            "Caisty führt Verarbeitungsnachweise gemäß Art. 30 DSGVO, soweit anwendbar, und stellt sie Aufsichtsbehörden zur Verfügung, wenn gesetzlich erforderlich. Der Verantwortliche bleibt für eigene Verzeichnispflichten verantwortlich.",
          ],
        },
      ],
    },
    {
      title: "Teil IV – Rückgabe, Löschung und Schlussbestimmungen",
      subsections: [
        {
          title: "Artikel 26 – Rückgabe oder Löschung personenbezogener Daten",
          paragraphs: [
            "Nach Beendigung der Services gibt Caisty – auf Weisung und soweit technisch machbar – Daten zurück, ermöglicht Export, löscht oder anonymisiert sie sicher. Aufbewahrung ist zulässig für gesetzliche, steuerliche, gerichtliche oder behördliche Pflichten sowie Rechtsverteidigung. Verbleibende Daten bleiben geschützt bis zur Löschung oder Anonymisierung.",
          ],
        },
        {
          title: "Artikel 27 – Haftung",
          paragraphs: [
            "Jede Partei haftet für ihre Datenschutzpflichten. Caisty haftet nicht für Verarbeitungsentscheidungen, die allein der Verantwortliche trifft, wenn Caisty dokumentierten Weisungen und AVV-Pflichten nachkommt. Der Verantwortliche trägt Verantwortung für Zwecke, Rechtsgrundlagen, Richtigkeit, Einwilligungen und eigene Compliance. Haftungsregelungen der AGB/EULA gelten ergänzend, soweit zulässig.",
          ],
        },
        {
          title: "Artikel 28 – Beendigung",
          paragraphs: [
            "Der AVV endet automatisch, wenn alle Auftragsverarbeitung beendet ist und Vertragsbeziehungen enden, sofern nicht gesetzliche Pflichten fortbestehen. Fortgeltende Pflichten (Vertraulichkeit, Datenschutz, Löschung, Haftung) bleiben wirksam.",
          ],
        },
        {
          title: "Artikel 29 – Anwendbares Recht",
          paragraphs: [
            "Dieser AVV unterliegt dem Recht der **Bundesrepublik Deutschland** und ist nach diesem auszulegen, soweit nicht zwingendes Datenschutzrecht etwas anderes vorschreibt. Zwingende Anforderungen der DSGVO oder anderer Datenschutzgesetze gehen vor. Streitigkeiten werden – ergänzend zu den Streitbeilegungsregelungen der AGB oder anderer vertraglicher Vereinbarungen – geklärt. Die Befugnisse der Aufsichtsbehörden bleiben unberührt.",
          ],
        },
        {
          title: "Artikel 30 – Schlussbestimmungen",
          paragraphs: [
            "Dieser AVV ist die vollständige Vereinbarung zur Auftragsverarbeitung und ersetzt frühere Vereinbarungen zu diesem Gegenstand. Unwirksame Bestimmungen berühren die übrigen nicht. Nichtdurchsetzung einzelner Bestimmungen ist kein Verzicht. Caisty kann den AVV bei Rechts-, Regulierungs- oder Technikänderungen anpassen; wesentliche Änderungen werden mitgeteilt.",
          ],
        },
      ],
    },
    {
      title: "Anhang I – Beschreibung der Verarbeitung",
      paragraphs: [
        "**Gegenstand:** Bereitstellung cloud-basierter Business-Software und zugehöriger Dienste.",
        "**Art der Verarbeitung:** Erhebung, Aufzeichnung, Organisation, Speicherung, Abruf, Übermittlung, Synchronisation, Hosting, Backup, Wiederherstellung, Löschung, Anonymisierung.",
        "**Zweck:** Bereitstellung der Services, Software-Lizenzierung, Kundenportal, Cloud-Sync, Support, Sicherheit, Wartung, Disaster Recovery.",
        "**Kategorien personenbezogener Daten:** Identifikations-, Kontakt-, Authentifizierungs-, Abrechnungs-, Transaktions-, Mitarbeiter-, Kunden-, technische Protokoll- und Gerätedaten.",
        "**Kategorien betroffener Personen:** Kunden, Nutzer, Mitarbeiter, Kunden/Lieferanten des Verantwortlichen, Auftragnehmer, Berater und sonstige in die Services eingegebene Personen.",
      ],
    },
    {
      title: "Anhang II – Technische und organisatorische Maßnahmen (TOMs)",
      paragraphs: [
        "Caisty unterhält angemessene TOMs, u. a.:",
        "Maßnahmen werden regelmäßig überprüft und dürfen aktualisiert werden, sofern das Schutzniveau nicht wesentlich gesenkt wird.",
      ],
      list: [
        "Verschlüsselung bei Übertragung und – wo angemessen – bei Speicherung;",
        "rollenbasierte Zugriffskontrolle, Least-Privilege-Administration;",
        "sichere Authentifizierung, Passwort-Hashing, MFA wo verfügbar;",
        "Netzwerksicherheit, Firewalls, Schwachstellen- und Malware-Schutz;",
        "Infrastruktur-Monitoring, Security-Logging;",
        "verschlüsselte Backups, Disaster Recovery, Business Continuity;",
        "Vertraulichkeit des Personals, regelmäßige Sicherheitsüberprüfungen, Incident Response.",
      ],
    },
    {
      title: "Anhang III – Autorisierte Unterauftragsverarbeiter",
      paragraphs: [
        "Je nach genutzten Services können Unterauftragsverarbeiter für Hosting, Infrastruktur, Zahlungen, E-Mail, Authentifizierung, Monitoring, Cybersicherheit, Backup und Support eingesetzt werden.",
        "Die aktuelle, verbindliche Liste autorisierter Unterauftragsverarbeiter ist verfügbar unter {{subprocessors}}.",
      ],
    },
  ],
  contactSectionTitle: "Parteien / Kontakt",
  contactSectionIntro: "Bei Fragen zu diesem AVV erreichen Sie uns unter:",
  contact: legalContact.de,
  related: legalRelatedLabels.de,
  showOwnerInContact: false,
};
