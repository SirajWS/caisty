import { legalContact } from "../shared/contact";
import { legalLinkLabels, legalRelatedLabels } from "../shared/labels";
import type { EulaCopy } from "./types";

export const eulaDe: EulaCopy = {
  documentLabel: "End User License Agreement (EULA)",
  title: "Endbenutzer-Lizenzvereinbarung",
  lastUpdatedLabel: "Stand",
  effectiveDate: "1. Juli 2026",
  versionLabel: "Version",
  version: "2.0 (Master Edition)",
  intro:
    "Diese Endbenutzer-Lizenzvereinbarung („EULA“ oder „Vereinbarung“) ist ein rechtsverbindlicher Vertrag zwischen Caisty und Ihnen als Kunde bzw. Nutzer über die Lizenzierung und Nutzung von Caisty POS, zugehörigen Cloud-Diensten, dem Kundenportal, APIs und weiteren Services. Mit Installation, Aktivierung, Registrierung oder Nutzung erkennen Sie diese Vereinbarung an.",
  linkLabels: legalLinkLabels.de,
  emphasis: {
    licensedNotSold: "lizenziert, nicht verkauft",
    commercialEfforts: "wirtschaftlich zumutbarer Anstrengungen",
  },
  sections: [
    {
      title: "Teil I – Allgemeine Bestimmungen",
      subsections: [
        {
          title: "1. Einleitung",
          paragraphs: [
            "Diese Vereinbarung regelt die Lizenzierung und Nutzung der Software und ist integraler Bestandteil der vertraglichen Beziehung zwischen Caisty und dem Kunden. Wenn Sie den Bedingungen nicht zustimmen, dürfen Sie die Software nicht installieren, aktivieren oder nutzen.",
          ],
        },
        {
          title: "2. Begriffe",
          paragraphs: ["Wesentliche Begriffe in dieser Vereinbarung:"],
          list: [
            "**Software** – Caisty POS einschließlich Updates, Module und Dokumentation",
            "**Services** – Cloud-Infrastruktur, Kundenportal, Lizenzverwaltung, APIs, Support",
            "**Kunde / Nutzer** – Unternehmen bzw. autorisierte natürliche Personen",
            "**Konto, Gerät, Lizenz, Abonnement** – wie in der Produktbeschreibung definiert",
            "**Vertrauliche Informationen** – nicht öffentliche geschäftliche, technische oder sicherheitsrelevante Informationen",
          ],
        },
        {
          title: "3. Geltungsbereich",
          paragraphs: [
            "Diese EULA gilt für Caisty POS, das Kundenportal, Cloud-Dienste, Updates, APIs, Lizenzaktivierung, Abonnements und zugehörige digitale Inhalte. Bei Widerspruch zu einer von beiden Parteien unterzeichneten Individualvereinbarung gilt diese im Widerspruchsfall vor.",
          ],
        },
        {
          title: "4. Annahme",
          paragraphs: [
            "Sie akzeptieren diese Vereinbarung durch Kontoerstellung, Lizenzaktivierung, Installation, Nutzung des Kundenportals, Kauf oder Verlängerung eines Abonnements oder elektronische Bestätigung. Handeln Sie im Namen eines Unternehmens, versichern Sie, dazu berechtigt zu sein.",
          ],
        },
        {
          title: "5. Berechtigung",
          paragraphs: [
            "Die Services sind für geschäftliche und professionelle Nutzung bestimmt. Sie versichern, mindestens 18 Jahre alt bzw. geschäftsfähig zu sein, korrekte Registrierungsdaten anzugeben und die Services rechtmäßig zu nutzen.",
          ],
        },
        {
          title: "6. Vertragsschluss",
          paragraphs: [
            "Die Vereinbarung wird wirksam mit dem frühesten Ereignis aus Kontoerstellung, Lizenzaktivierung, Installation, Portalzugang, Abonnementkauf oder Nutzung. Eine handschriftliche Unterschrift ist nicht erforderlich, sofern gesetzlich zulässig.",
          ],
        },
        {
          title: "7.–8. Lizenzgewährung und Art der Lizenz",
          paragraphs: [
            "Vorbehaltlich Zahlung aller Gebühren und Einhaltung dieser Vereinbarung gewährt Caisty eine beschränkte, nicht ausschließliche, nicht übertragbare, nicht unterlizenzierbare, widerrufliche Lizenz zur Nutzung der Software ausschließlich für interne geschäftliche Zwecke. Die Software wird {{licensedNotSold}}. Es erfolgt kein Eigentums- oder IP-Rechtsübergang. Der Umfang richtet sich nach Abonnement, Geräte-/Nutzerlimits und technischen Vorgaben.",
          ],
        },
        {
          title: "9. Lizenzbeschränkungen",
          paragraphs: ["Sofern nicht gesetzlich zwingend erlaubt oder schriftlich genehmigt, ist es untersagt:"],
          list: [
            "die Software zu vervielfältigen, zu verbreiten oder öffentlich zugänglich zu machen;",
            "abgeleitete Werke zu erstellen oder Reverse Engineering durchzuführen;",
            "Urheber-, Marken- oder Lizenzschutz zu entfernen oder zu umgehen;",
            "unbefugte Lizenzschlüssel oder Aktivierungsmechanismen zu nutzen;",
            "die Software zu vermieten, weiterzulizenzieren oder für Wettbewerbsprodukte zu nutzen;",
            "Schadsoftware einzuschleusen oder die Services missbräuchlich automatisiert anzugreifen.",
          ],
        },
        {
          title: "10. Vorbehalt der Rechte",
          paragraphs: [
            "Caisty behält sämtliche Rechte an Software, Quell-/Objektcode, Datenbanken, APIs, Dokumentation, Marken, Know-how und Weiterentwicklungen. Der Kunde erhält nur die ausdrücklich eingeräumten Nutzungsrechte.",
            "Verstöße gegen Lizenzbeschränkungen können zur sofortigen Sperrung führen.",
          ],
        },
      ],
    },
    {
      title: "Teil II – Software und Dienste",
      subsections: [
        {
          title: "11. Benutzerkonto",
          paragraphs: [
            "Für bestimmte Funktionen ist ein Kundenkonto erforderlich. Sie sind für korrekte Daten, Geheimhaltung der Zugangsdaten, autorisierte Nutzer und alle Kontaktivitäten verantwortlich. Sicherheitsvorfälle sind unverzüglich zu melden.",
          ],
        },
        {
          title: "12. Geräteaktivierung",
          paragraphs: [
            "Die Software darf nur auf im Abonnement autorisierten Geräten aktiviert werden. Aktivierung kann Online-Prüfung, Gerätegrenzen und periodische Validierung umfassen. Manipulation oder Umgehung ist untersagt.",
          ],
        },
        {
          title: "13. Abonnements",
          paragraphs: [
            "Der Zugang erfolgt über Abonnementpläne mit unterschiedlichen Funktionen, Geräte-/Nutzerlimits, Support- und Integrationsumfang. Beschreibungen werden auf Website und im Kundenportal veröffentlicht.",
          ],
        },
        {
          title: "14. Installation",
          paragraphs: [
            "Installation nur über offizielle Caisty-Kanäle. Sie sind für kompatible Hardware, Betriebssysteme und Netzwerke verantwortlich. Caisty garantiert keine Kompatibilität mit nicht unterstützten Umgebungen.",
          ],
        },
        {
          title: "15. Updates und Upgrades",
          paragraphs: [
            "Während eines aktiven Abonnements können Updates, Sicherheitsfixes und neue Funktionen bereitgestellt werden. Sicherheitsupdates können automatisch installiert werden. Veraltete Versionen können eingestellt werden.",
          ],
        },
        {
          title: "16. Cloud-Dienste",
          paragraphs: [
            "Funktionen wie Authentifizierung, Lizenzprüfung, Synchronisation und Portal erfordern Internet. Caisty bemüht sich um Verfügbarkeit auf Basis {{commercialEfforts}}; unterbrechungsfreier Betrieb ist nicht garantiert.",
          ],
        },
        {
          title: "17. Kundenportal",
          paragraphs: [
            "Über das Portal können autorisierte Nutzer u. a. Lizenzen, Geräte, Abonnements, Rechnungen und Sicherheitseinstellungen verwalten. Alle Handlungen autorisiert er Nutzer werden dem Kunden zugerechnet.",
          ],
        },
        {
          title: "18. APIs und Integrationen",
          paragraphs: [
            "API-Nutzung unterliegt dieser Vereinbarung, Dokumentation, Limits und Sicherheitsvorgaben. Drittanbieter-Integrationen unterliegen deren eigenen Bedingungen; Caisty garantiert keine dauerhafte Kompatibilität.",
          ],
        },
        {
          title: "19. Support",
          paragraphs: [
            "Support im Rahmen des Abonnements kann technische Hilfe, Dokumentation und Fehlerbearbeitung umfassen, nicht jedoch individuelle Entwicklung, Hardware-Wartung oder Rechts-/Steuerberatung. Reaktionszeiten sind Zielwerte, sofern nicht schriftlich anders vereinbart.",
          ],
        },
        {
          title: "20. Verfügbarkeit",
          paragraphs: [
            "Wartung, Sicherheitsvorfälle, Infrastrukturstörungen und höhere Gewalt können Verfügbarkeit beeinträchtigen. Vorübergehende Unterbrechungen stellen grundsätzlich keinen Vertragsverstoß dar.",
          ],
        },
      ],
    },
    {
      title: "Teil III – Geistiges Eigentum und Daten",
      subsections: [
        {
          title: "21.–22. Geistiges Eigentum und Marken",
          paragraphs: [
            "Software und Services bleiben ausschließliches Eigentum von Caisty bzw. Lizenzgebern. Marken, Logos und Produktnamen dürfen nicht ohne Genehmigung genutzt oder verändert werden.",
          ],
        },
        {
          title: "23. Vertraulichkeit",
          paragraphs: [
            "Beide Parteien schützen vertrauliche Informationen der jeweils anderen Partei und nutzen diese nur für vertragsbezogene Zwecke. Die Pflichten überdauern die Beendigung der Vereinbarung.",
          ],
        },
        {
          title: "24. Kundendaten",
          paragraphs: [
            "Der Kunde behält das Eigentum an seinen Geschäftsdaten. Caisty erhält nur die zur Bereitstellung der Services erforderlichen Verarbeitungsrechte. Der Kunde ist für Rechtmäßigkeit, Richtigkeit und erforderliche Einwilligungen verantwortlich.",
          ],
        },
        {
          title: "25. Datenschutz",
          paragraphs: [
            "Personenbezogene Daten werden gemäß DSGVO, {{privacy}} und – soweit anwendbar – {{dpa}} verarbeitet. Verarbeitet Caisty Daten im Auftrag des Kunden, handelt Caisty als Auftragsverarbeiter.",
          ],
        },
        {
          title: "26. Sicherheit",
          paragraphs: [
            "Caisty setzt angemessene technische und organisatorische Maßnahmen ein, u. a. verschlüsselte Kommunikation, Passwort-Hashing, rollenbasierte Zugriffe, Monitoring, Updates und Wiederherstellungskonzepte. Absolute Sicherheit kann nicht garantiert werden; der Kunde trägt Mitverantwortung.",
          ],
        },
        {
          title: "27.–28. Backup und Aufbewahrung",
          paragraphs: [
            "Caisty kann betriebliche Backups durchführen; diese ersetzen keine eigenständige Datensicherung des Kunden. Daten werden nur so lange gespeichert, wie für Vertrag, Recht und Betrieb erforderlich, danach gelöscht oder anonymisiert.",
          ],
        },
        {
          title: "29.–30. Pflichten und Compliance des Kunden",
          paragraphs: [
            "Der Kunde nutzt die Software rechtmäßig, hält Gesetze ein (Steuer, Buchhaltung, Datenschutz, Branchenrecht) und trifft angemessene interne Sicherheitsmaßnahmen. Caisty erbringt keine Rechts-, Steuer- oder Buchführungsberatung.",
          ],
        },
      ],
    },
    {
      title: "Teil IV – Gewährleistung, Haftung und Kündigung",
      subsections: [
        {
          title: "31. Gewährleistungsausschluss",
          paragraphs: [
            "Caisty entwickelt die Software mit der Sorgfalt eines ordentlichen SaaS-Anbieters. Im gesetzlich zulässigen Umfang wird die Software „wie besehen“ und „wie verfügbar“ bereitgestellt. Es wird keine Garantie für fehlerfreien, unterbrechungsfreien Betrieb oder Eignung für jeden Zweck übernommen, soweit nicht zwingendes Recht entgegensteht.",
          ],
        },
        {
          title: "32. Haftungsbeschränkung",
          paragraphs: [
            "Caisty haftet unbeschränkt bei Vorsatz, grober Fahrlässigkeit und bei Schäden an Leben, Körper oder Gesundheit. Im Übrigen ist die Haftung für indirekte Schäden, entgangenen Gewinn, Datenverlust oder Betriebsunterbrechung ausgeschlossen, soweit zulässig. Die Gesamthaftung ist auf die in den zwölf Monaten vor dem schadensauslösenden Ereignis gezahlten Abonnementgebühren begrenzt, sofern nicht zwingendes Recht weitergehende Haftung vorsieht.",
          ],
        },
        {
          title: "33. Freistellung",
          paragraphs: [
            "Der Kunde stellt Caisty von Ansprüchen frei, die aus Verstößen gegen diese Vereinbarung, rechtswidriger Nutzung, rechtsverletzenden Kundendaten oder unsachgemäßem Schutz von Zugangsdaten entstehen.",
          ],
        },
        {
          title: "34.–35. Sperrung und Kündigung",
          paragraphs: [
            "Caisty kann Services bei Sicherheitsrisiken, Zahlungsverzug, Betrug oder schwerwiegenden Verstößen sperren oder kündigen. Der Kunde kann Abonnements über das Portal kündigen. Mit Beendigung erlischt die Lizenz.",
          ],
        },
        {
          title: "36. Folgen der Beendigung",
          paragraphs: [
            "Nach Beendigung endet das Nutzungsrecht; Zugänge können deaktiviert werden. Daten werden gemäß Datenschutzerklärung und AVV aufbewahrt oder gelöscht. Fortgeltende Regelungen (IP, Vertraulichkeit, Haftung, Freistellung, Recht) bleiben wirksam.",
          ],
        },
        {
          title: "37.–39. Höhere Gewalt, Exportkontrolle, Prüfungen",
          paragraphs: [
            "Keine Partei haftet für höhere Gewalt. Der Kunde beachtet Export- und Sanktionsrecht. Caisty darf zur Lizenzprüfung angemessene Nachweise anfordern, ohne unbeschränkten Systemzugang zu verlangen.",
          ],
        },
      ],
    },
    {
      title: "Teil V – Schlussbestimmungen",
      subsections: [
        {
          title: "41.–44. Änderungen, Abtretung, Salvatorische Klausel, Gesamtvereinbarung",
          paragraphs: [
            "Caisty kann diese Vereinbarung anpassen; wesentliche Änderungen werden mitgeteilt. Fortgesetzte Nutzung gilt als Zustimmung, sofern gesetzlich zulässig. Abtretung durch den Kunden bedarf Zustimmung. Unwirksame Bestimmungen werden durch wirksame ersetzt, die dem wirtschaftlichen Zweck am nächsten kommen. Diese EULA bildet mit AGB, Datenschutz, Cookies und AVV das vertragliche Gesamtwerk.",
          ],
        },
        {
          title: "45.–46. Anwendbares Recht und Streitbeilegung",
          paragraphs: [
            "Diese Vereinbarung unterliegt dem Recht der **Bundesrepublik Deutschland** unter Ausschluss des UN-Kaufrechts (CISG) und ohne Rückgriff auf Kollisionsnormen, die anderes Recht anwenden würden.",
            "Soweit gesetzlich zulässig – insbesondere bei Verträgen mit Kaufleuten (B2B) – ist ausschließlicher Gerichtsstand **Berlin, Deutschland**.",
            "Streitigkeiten werden zunächst einvernehmlich geklärt; danach können zuständige Gerichte angerufen werden. Einstweiliger Rechtsschutz bleibt vorbehalten.",
          ],
        },
        {
          title: "47.–48. Elektronische Annahme und Sprache",
          paragraphs: [
            "Die Vereinbarung kann elektronisch angenommen werden und hat – soweit zulässig – dieselbe Wirkung wie eine Unterschrift. Bei Abweichungen zwischen Übersetzungen und der maßgeblichen Fassung gilt die jeweils verbindliche Rechtsordnung bzw. die vereinbarte Master-Fassung.",
          ],
        },
        {
          title: "49.–50. Kontakt und Inkrafttreten",
          paragraphs: [
            "**Inkrafttreten:** 1. Juli 2026",
            "Mit Nutzung bestätigen Sie, diese Vereinbarung gelesen und akzeptiert zu haben.",
          ],
        },
      ],
    },
    {
      title: "Anhang A – Lizenzpläne",
      paragraphs: [
        "Abonnementpläne (z. B. Starter, Professional, Enterprise) definieren Geräte-, Nutzer- und Feature-Limits. Details werden auf der Website und im Kundenportal veröffentlicht. Lizenzen sind nicht übertragbar, sofern nicht schriftlich vereinbart. Fair-Use-Regeln dienen Stabilität und Sicherheit der Plattform.",
      ],
    },
    {
      title: "Anhang B – Acceptable Use Policy (AUP)",
      paragraphs: [
        "Die AUP schützt Sicherheit, Integrität und rechtmäßige Nutzung. Untersagt sind u. a. rechtswidrige Nutzung, Malware, unbefugter Zugriff, Umgehung von Lizenzmechanismen, übermäßige automatisierte Last, Wiederverkauf ohne Genehmigung und Entwicklung konkurrierender Produkte auf Basis proprietärer Komponenten. Bei Verstößen kann Caisty warnen, sperren oder kündigen.",
      ],
    },
    {
      title: "Anhang C – Service Level Objectives (SLO)",
      paragraphs: [
        "Caisty strebt hohe Verfügbarkeit der Cloud-Infrastruktur an (Ziel: ca. 99,5 % monatliche Uptime, ausgenommen Wartung, höhere Gewalt und Drittanbieter-Störungen). SLOs sind Betriebsziele, keine garantierten Service Levels, sofern nicht separat schriftlich vereinbart. Support erfolgt in den kommunizierten Geschäftszeiten.",
      ],
    },
  ],
  contactSectionTitle: "Kontakt und Inkrafttreten",
  contactSectionIntro: "Bei Fragen zu dieser Vereinbarung erreichen Sie uns unter:",
  contact: legalContact.de,
  related: legalRelatedLabels.de,
  showOwnerInContact: false,
};
