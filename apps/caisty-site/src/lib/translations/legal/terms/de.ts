import { legalContact } from "../shared/contact";
import { legalLinkLabels, legalRelatedLabels } from "../shared/labels";
import type { TermsCopy } from "./types";

export const termsDe: TermsCopy = {
  documentLabel: "Rechtliches",
  title: "Allgemeine Geschäftsbedingungen",
  lastUpdatedLabel: "Stand",
  effectiveDate: "1. Juli 2026",
  intro:
    "Diese Allgemeinen Geschäftsbedingungen (AGB) regeln die vertragliche Beziehung zwischen Caisty und Kunden, die unsere Software, Cloud-Dienste und das Kundenportal nutzen oder abonnieren. Sie bilden den rechtlichen Rahmen von Caisty und sollten zusammen mit der {{privacy}}, der {{cookie}}, dem {{eula}}, dem {{dpa}} und dem {{imprint}} gelesen werden.",
  linkLabels: legalLinkLabels.de,
  emphasis: {
    licensedNotSold: "lizenziert, nicht verkauft",
    commercialEfforts: "wirtschaftlich zumutbarer Anstrengungen",
  },
  sections: [
    {
      title: "1. Geltungsbereich",
      paragraphs: [
        "Diese AGB gelten für alle Verträge und Nutzungsbeziehungen zwischen Caisty, vertreten durch Siraj Bettaieb, Mollwitzstraße 5A, 14059 Berlin, Deutschland (nachfolgend „Caisty“, „wir“ oder „Anbieter“), und natürlichen oder juristischen Personen, die unsere Leistungen beziehen (nachfolgend „Kunde“ oder „Sie“).",
        "Die AGB gelten für den Erwerb, das Abonnement, die Lizenzierung und die Nutzung der Caisty-POS-Software, des Kundenportals, zugehöriger Cloud-Dienste sowie weiterer digitaler Produkte und Dienstleistungen von Caisty.",
        "Abweichende oder ergänzende Bedingungen des Kunden finden nur Anwendung, wenn Caisty ihrer Geltung ausdrücklich schriftlich zugestimmt hat. Mit Registrierung, Bestellung, Abonnement, Installation oder Nutzung der Leistungen erkennen Sie diese AGB an.",
      ],
    },
    {
      title: "2. Vertragsgegenstand",
      paragraphs: [
        "Caisty stellt insbesondere folgende Leistungen bereit:",
        "Umfang, Funktionen und Verfügbarkeit der Leistungen richten sich nach dem jeweils gebuchten Abonnement, der gültigen Produktbeschreibung auf der Website bzw. im Kundenportal sowie etwaigen individuellen Vereinbarungen.",
      ],
      list: [
        "Caisty POS – cloudbasierte Kassensoftware für den Einsatz in Betrieben",
        "Zugang zum Caisty-Kundenportal zur Verwaltung von Lizenzen, Geräten, Abonnements und Rechnungen",
        "Cloud-Synchronisation, Verwaltungsfunktionen und technischer Support im Rahmen des gewählten Plans",
        "Weitere Softwareprodukte und Dienste, die Caisty künftig anbietet",
      ],
    },
    {
      title: "3. Registrierung und Kundenkonto",
      paragraphs: [
        "Für die Nutzung bestimmter Leistungen ist die Erstellung eines Kundenkontos erforderlich. Sie verpflichten sich, bei der Registrierung wahrheitsgemäße, vollständige und aktuelle Angaben zu machen und diese bei Änderungen unverzüglich zu aktualisieren.",
        "Sie sind für die Geheimhaltung Ihrer Zugangsdaten verantwortlich und stellen sicher, dass nur autorisierte Personen Zugang zu Ihrem Konto erhalten. Handlungen, die unter Verwendung Ihrer Zugangsdaten erfolgen, werden Ihnen zugerechnet, sofern Sie nicht nachweisen, dass ein Sicherheitsvorfall allein Caisty zuzurechnen ist.",
        "Caisty ist berechtigt, den Zugang zum Konto vorübergehend einzuschränken oder zu sperren, wenn dies zum Schutz der Sicherheit, der Integrität oder der ordnungsgemäßen Nutzung der Leistungen erforderlich ist.",
      ],
    },
    {
      title: "4. Lizenz und Nutzung der Software",
      paragraphs: [
        "Caisty POS und andere Softwareprodukte von Caisty werden {{licensedNotSold}}. Es wird Ihnen eine beschränkte, nicht ausschließliche, nicht übertragbare und widerrufliche Lizenz zur Nutzung der Software im Rahmen Ihres Abonnements und gemäß dem {{eula}} eingeräumt.",
        "Eigentums- und Urheberrechte an der Software verbleiben bei Caisty bzw. deren Lizenzgebern. Eine Nutzung über den vereinbarten Leistungsumfang hinaus – insbesondere unbefugte Vervielfältigung, Weitergabe, Unterlizenzierung oder gewerbliche Weiterverwertung – ist untersagt.",
        "Sie sind allein dafür verantwortlich, die Software rechtmäßig und in Übereinstimmung mit geltendem Recht zu nutzen. Caisty erbringt keine Rechts-, Steuer- oder Buchführungsberatung.",
        "Caisty kann Updates, Sicherheitsverbesserungen und neue Versionen bereitstellen. Bestimmte Updates können automatisch installiert werden, soweit dies für Sicherheit oder Betrieb erforderlich ist.",
      ],
    },
    {
      title: "5. Abonnements, Preise und Zahlungen",
      paragraphs: [
        "Die Nutzung der Leistungen erfolgt in der Regel auf Basis wiederkehrender Abonnements mit unterschiedlichen Plänen, Funktionen und Preisen. Die jeweils gültigen Preise und Leistungsumfänge werden auf der Website und im Kundenportal ausgewiesen.",
        "Sofern nicht anders angegeben, verstehen sich Preise in Euro. Gesetzliche Steuern und Abgaben können zusätzlich anfallen, sofern und soweit sie gesetzlich geschuldet sind.",
        "Die Abrechnung erfolgt entsprechend dem gewählten Abrechnungszeitraum (z. B. monatlich oder jährlich). Zahlungen sind über die im Kundenportal angebotenen Zahlungsmethoden – derzeit insbesondere Karte und PayPal – zu leisten.",
        "Bei Zahlungsverzug, fehlgeschlagenen Zahlungen oder unberechtigter Nutzung ist Caisty berechtigt, Mahnungen zu versenden, den Zugang vorübergehend zu sperren und weitergehende Rechte geltend zu machen. Bereits entstandene Gebühren bleiben in jedem Fall geschuldet.",
        "Abonnements verlängern sich automatisch um den jeweiligen Abrechnungszeitraum, sofern sie nicht fristgerecht gekündigt werden.",
      ],
    },
    {
      title: "6. Testphase",
      paragraphs: [
        "Caisty kann kostenlose Test- oder Probezeiträume anbieten. Umfang, Dauer und Verfügbarkeit einer Testphase ergeben sich aus der jeweiligen Angebotsbeschreibung im Kundenportal oder auf der Website.",
        "Mit Ablauf der Testphase endet der kostenlose Zugang, sofern Sie kein kostenpflichtiges Abonnement abschließen. Caisty ist berechtigt, Testangebote jederzeit zu ändern oder einzustellen.",
      ],
    },
    {
      title: "7. Verfügbarkeit und Wartung",
      paragraphs: [
        "Caisty bemüht sich, die Leistungen zuverlässig und sicher bereitzustellen. Sofern nicht ausdrücklich in einer separaten schriftlichen Vereinbarung etwas anderes geregelt ist, erfolgt die Bereitstellung der Leistungen auf Basis {{commercialEfforts}}. Eine unterbrechungsfreie oder fehlerfreie Verfügbarkeit wird nicht garantiert.",
        "Vorübergehende Einschränkungen können insbesondere durch Wartung, Updates, Infrastrukturarbeiten, Störungen bei Drittanbietern, Netzwerkprobleme, Sicherheitsvorfälle oder höhere Gewalt entstehen. Geplante Wartungsarbeiten werden, soweit zumutbar, im Voraus angekündigt.",
      ],
    },
    {
      title: "8. Pflichten des Kunden",
      paragraphs: [
        "Sie verpflichten sich insbesondere:",
        "Sie bleiben verantwortlich für die Einhaltung steuerlicher, buchhalterischer, arbeitsrechtlicher, datenschutzrechtlicher und branchenspezifischer Vorschriften in Ihrem Betrieb. Caisty ersetzt keine eigenständige Rechts- oder Compliance-Beratung.",
      ],
      list: [
        "die Leistungen nur für rechtmäßige geschäftliche Zwecke zu nutzen;",
        "geltendes Recht, diese AGB und den EULA einzuhalten;",
        "Zugangsdaten, Geräte und Netzwerke angemessen zu schützen;",
        "keine unbefugten Zugriffe, Manipulationen oder Störungen vorzunehmen;",
        "keine Schadsoftware einzubringen und keine Sicherheitsmechanismen zu umgehen;",
        "Inhalte und Daten, die Sie verarbeiten, nur rechtmäßig zu erheben und zu verwenden;",
        "Sicherheitsvorfälle und mutmaßlichen Missbrauch unverzüglich an Caisty zu melden.",
      ],
    },
    {
      title: "9. Datenschutz",
      paragraphs: [
        "Caisty verarbeitet personenbezogene Daten im Einklang mit der geltenden Datenschutzgesetzgebung. Einzelheiten zu Art, Umfang und Zweck der Verarbeitung, zu Ihren Rechten sowie zu Auftragsverarbeitungsbeziehungen ergeben sich aus der {{privacy}} und – soweit anwendbar – dem {{dpa}}.",
        "Sie sind dafür verantwortlich, dass die von Ihnen in die Leistungen eingegebenen Daten rechtmäßig erhoben und verarbeitet werden und erforderliche Informationen gegenüber betroffenen Personen bereitgestellt werden.",
      ],
    },
    {
      title: "10. Drittanbieter",
      paragraphs: [
        "Die Leistungen können mit Produkten oder Diensten unabhängiger Drittanbieter verbunden sein, etwa Zahlungsdienstleistern, Cloud-Infrastruktur, Authentifizierungsdiensten, Hardware-Herstellern oder Fiskaldiensten.",
        "Caisty kontrolliert diese Drittanbieter nicht und übernimmt keine Verantwortung für deren Verfügbarkeit, Funktion, Sicherheit, Preise oder Vertragsbedingungen. Die Nutzung von Drittanbieter-Leistungen unterliegt den jeweiligen Bedingungen und Datenschutzhinweisen des betreffenden Anbieters.",
      ],
    },
    {
      title: "11. Kündigung",
      paragraphs: [
        "Sie können Ihr Abonnement jederzeit über das Kundenportal oder per E-Mail an {{supportEmail}} kündigen. Die Kündigung wird wirksam zum Ende des laufenden Abrechnungszeitraums, sofern gesetzlich kein anderes Kündigungsrecht besteht.",
        "Eine Kündigung berechtigt grundsätzlich nicht zur Rückerstattung bereits gezahlter Entgelte für den laufenden Zeitraum. Bereits fällige Zahlungsansprüche bleiben unberührt.",
        "Caisty kann den Vertrag aus wichtigem Grund fristlos kündigen oder den Zugang sperren, insbesondere bei schwerwiegenden Verstößen gegen diese AGB, den EULA, Zahlungsverzug, betrügerischer Nutzung, erheblichen Sicherheitsrisiken oder wenn die weitere Bereitstellung rechtswidrig wäre. Soweit zumutbar, wird Caisty zuvor eine Abhilfefrist setzen.",
        "Nach Beendigung endet Ihr Nutzungsrecht an den Leistungen. Soweit technisch möglich, sollten Sie relevante Daten vor Vertragsende exportieren. Caisty kann Daten nach Ablauf gesetzlicher oder vertraglicher Aufbewahrungsfristen löschen oder anonymisieren.",
      ],
    },
    {
      title: "12. Haftung",
      paragraphs: [
        "Caisty haftet unbeschränkt bei Vorsatz und grober Fahrlässigkeit sowie bei Schäden aus der Verletzung des Lebens, des Körpers oder der Gesundheit. Bei leicht fahrlässiger Verletzung wesentlicher Vertragspflichten (Kardinalpflichten) ist die Haftung auf den vertragstypischen, vorhersehbaren Schaden begrenzt.",
        "Im Übrigen ist die Haftung für leichte Fahrlässigkeit ausgeschlossen, soweit gesetzlich zulässig. Caisty haftet nicht für mittelbare Schäden, entgangenen Gewinn, Datenverluste oder Betriebsunterbrechungen, es sei denn, zwingendes Recht sieht etwas anderes vor.",
        "Soweit die Haftung nicht ausgeschlossen ist, ist die gesamtschuldnerische Haftung von Caisty auf den Betrag begrenzt, den Sie in den zwölf Monaten vor dem schadensauslösenden Ereignis für die betroffenen Leistungen tatsächlich gezahlt haben, sofern nicht zwingendes Recht eine weitergehende Haftung vorsieht.",
      ],
    },
    {
      title: "13. Änderungen der AGB",
      paragraphs: [
        "Caisty kann diese AGB ändern, wenn dies erforderlich ist, um rechtliche, technische oder betriebliche Entwicklungen zu berücksichtigen oder die Leistungen weiterzuentwickeln.",
        "Wesentliche Änderungen, die Ihre vertraglichen Rechte betreffen, werden Ihnen in geeigneter Form mitgeteilt, etwa per E-Mail, im Kundenportal oder auf der Website. Sofern gesetzlich zulässig, gilt Ihre fortgesetzte Nutzung nach Inkrafttreten der geänderten Fassung als Zustimmung. Widersprechen Sie wesentlichen Änderungen, können Sie den Vertrag zum Zeitpunkt des Inkrafttretens kündigen.",
      ],
    },
    {
      title: "14. Schlussbestimmungen",
      paragraphs: [
        "Diese AGB bilden zusammen mit dem EULA, der Datenschutzerklärung, der Cookie-Richtlinie, dem AVV (soweit anwendbar) und dem Impressum die vertragliche Grundlage, soweit nicht individuelle schriftliche Vereinbarungen etwas Abweichendes regeln. Bei Widersprüchen gilt für den jeweiligen Gegenstand das speziell hierfür vorgesehene Dokument.",
        "Es gilt das Recht der Bundesrepublik Deutschland unter Ausschluss des UN-Kaufrechts (CISG). Für Kaufleute ist ausschließlicher Gerichtsstand Berlin, sofern gesetzlich zulässig.",
        "Sollten einzelne Bestimmungen dieser AGB unwirksam sein oder werden, bleibt die Wirksamkeit der übrigen Bestimmungen unberührt. An die Stelle der unwirksamen Regelung tritt eine wirksame Regelung, die dem wirtschaftlichen Zweck am nächsten kommt.",
        "Caisty ist berechtigt, Rechte und Pflichten aus diesem Vertrag im Zusammenhang mit Unternehmensübertragungen, Umstrukturierungen oder Beteiligungswechseln an verbundene Unternehmen oder Rechtsnachfolger zu übertragen.",
      ],
    },
  ],
  contactSectionTitle: "15. Kontakt",
  contactSectionIntro: "Bei Fragen zu diesen AGB erreichen Sie uns unter:",
  contact: legalContact.de,
  related: legalRelatedLabels.de,
  showOwnerInContact: false,
};
