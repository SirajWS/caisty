import { legalContact } from "../shared/contact";
import { legalLinkLabels, legalRelatedLabels } from "../shared/labels";
import type { CookiePolicyCopy } from "./types";

export const cookiePolicyDe: CookiePolicyCopy = {
  documentLabel: "Cookie-Richtlinie",
  title: "Cookie-Richtlinie",
  lastUpdatedLabel: "Stand",
  effectiveDate: "1. Juli 2026",
  intro:
    "Diese Cookie-Richtlinie erläutert, wie Caisty Cookies und ähnliche Technologien einsetzt, wenn Sie unsere Website, Caisty POS, das Kundenportal und zugehörige Online-Dienste nutzen.",
  linkLabels: legalLinkLabels.de,
  sections: [
    {
      title: "1. Verantwortlicher",
      paragraphs: [
        "Verantwortlicher für diese Cookie-Richtlinie ist Caisty, Inhaber Siraj Bettaieb, Mollwitzstraße 5A, 14059 Berlin, Deutschland. Vollständige Kontaktdaten finden Sie unter Abschnitt 11.",
      ],
    },
    {
      title: "2. Geltungsbereich",
      paragraphs: [
        "Diese Cookie-Richtlinie gilt für Cookies und vergleichbare Technologien im Zusammenhang mit:",
        "Sie ergänzt unsere {{privacy}}, die gilt, sobald Cookies personenbezogene Daten verarbeiten.",
      ],
      list: [
        "caisty.com und zugehörigen Webseiten;",
        "Caisty POS und eingebetteten Web-/Cloud-Funktionen;",
        "dem Caisty Kundenportal;",
        "Cloud-Diensten und Synchronisationsfunktionen;",
        "APIs und administrativen Schnittstellen;",
        "künftigen Online-Diensten von Caisty.",
      ],
    },
    {
      title: "3. Was sind Cookies?",
      paragraphs: [
        "Cookies sind kleine Textdateien, die beim Besuch einer Website oder Nutzung eines Online-Dienstes auf Ihrem Gerät gespeichert werden können. Sie helfen dabei, Einstellungen zu merken, Sitzungen aufrechtzuerhalten, die Sicherheit zu verbessern und die Nutzung zu vereinfachen.",
        "Cookies identifizieren Sie nicht automatisch namentlich. Werden Cookies jedoch mit weiteren Informationen verknüpft, können sie personenbezogene Daten darstellen.",
        "Neben klassischen Browser-Cookies können auch vergleichbare Technologien eingesetzt werden, etwa Local Storage, Session Storage, sichere Authentifizierungstoken oder verschlüsselte Sitzungskennungen. In dieser Richtlinie schließen wir diese Technologien ein, soweit sie vergleichbare Funktionen erfüllen.",
      ],
    },
    {
      title: "4. Welche Cookies verwenden wir?",
      paragraphs: ["Je nach genutzter Leistung können verschiedene Kategorien zum Einsatz kommen:"],
      subsections: [
        {
          title: "Strictly Necessary Cookies (unbedingt erforderlich)",
          paragraphs: [
            "Diese Cookies sind für den Betrieb der Dienste unerlässlich, z. B. für sichere Navigation, grundlegende Funktionen, Warenkorb-/Sitzungslogik oder technisch notwendige Speicherung. Ohne sie können wesentliche Funktionen nicht bereitgestellt werden.",
          ],
        },
        {
          title: "Authentication Cookies (Authentifizierung)",
          paragraphs: [
            "Diese Cookies erkennen angemeldete Nutzer und ermöglichen den sicheren Zugriff auf geschützte Bereiche wie das Kundenportal. Sie verhindern, dass Sie sich bei jeder Seitenansicht erneut anmelden müssen.",
          ],
        },
        {
          title: "Security Cookies (Sicherheit)",
          paragraphs: [
            "Sicherheits-Cookies unterstützen den Schutz von Konten und Systemen, z. B. durch Erkennung verdächtiger Aktivitäten, Missbrauchsprävention und Absicherung von Sitzungen.",
          ],
        },
        {
          title: "Preference Cookies (Einstellungen)",
          paragraphs: [
            "Diese Cookies speichern von Ihnen gewählte Einstellungen, etwa Sprache, Theme (Hell/Dunkel) oder andere Darstellungsoptionen, um Ihre Nutzung komfortabler zu gestalten.",
          ],
        },
        {
          title: "Functional Cookies (Funktional)",
          paragraphs: [
            "Funktionale Cookies ermöglichen erweiterte Komfortfunktionen, die nicht zwingend für den Grundbetrieb erforderlich sind, etwa das Merken früherer Auswahlen oder vereinfachte Wiederkehr-Nutzung.",
          ],
        },
        {
          title: "Analytics Cookies (Analyse)",
          paragraphs: [
            "Analyse-Cookies helfen zu verstehen, wie Website und Dienste genutzt werden (z. B. Seitenaufrufe, Navigationswege, Feature-Nutzung in aggregierter Form). Sie dienen der Verbesserung unserer Leistungen.",
          ],
        },
        {
          title: "Performance Cookies (Leistung)",
          paragraphs: [
            "Performance-Cookies messen Ladezeiten, Reaktionsgeschwindigkeit, Stabilität und technische Zuverlässigkeit, damit wir Engpässe erkennen und die Qualität der Dienste verbessern können.",
          ],
        },
      ],
    },
    {
      title: "5. Rechtsgrundlage",
      paragraphs: [
        "**Unbedingt erforderliche Cookies** werden auf Grundlage unseres berechtigten Interesses bzw. zur Bereitstellung der von Ihnen angeforderten Dienste eingesetzt. Für diese Cookies ist in der Regel keine Einwilligung erforderlich.",
        "**Analyse-, Performance-, Funktions- und Präferenz-Cookies**, die nicht zwingend erforderlich sind, setzen wir nur ein, wenn eine gültige Rechtsgrundlage besteht – insbesondere Ihre Einwilligung gemäß Art. 6 Abs. 1 lit. a DSGVO bzw. § 25 TTDSG, soweit gesetzlich erforderlich.",
        "Soweit zulässig, können bestimmte Sicherheits- und Stabilitätsmaßnahmen auch auf berechtigten Interessen beruhen (Art. 6 Abs. 1 lit. f DSGVO), sofern Ihre Interessen nicht überwiegen.",
      ],
    },
    {
      title: "6. Cookie-Banner und Einwilligung",
      paragraphs: [
        "Beim ersten Besuch unserer Website können Sie über unseren Cookie-Banner entscheiden, ob optionale Cookies gesetzt werden dürfen. Sie haben folgende Möglichkeiten:",
        "Ihre Einwilligung können Sie jederzeit mit Wirkung für die Zukunft widerrufen, indem Sie Ihre Cookie-Einstellungen erneut öffnen:",
      ],
      list: [
        "alle Cookies akzeptieren;",
        "nicht erforderliche Cookies ablehnen;",
        "Ihre Präferenzen nach Kategorien anpassen;",
        "Ihre Auswahl später erneut ändern.",
      ],
      cookiePreferencesLabel: "Cookie-Einstellungen öffnen",
    },
    {
      title: "7. Browser-Einstellungen",
      paragraphs: [
        "Sie können Cookies auch direkt in Ihrem Browser verwalten, blockieren oder löschen. Bitte beachten Sie, dass die Deaktivierung erforderlicher Cookies dazu führen kann, dass Teile der Website oder des Kundenportals nicht mehr korrekt funktionieren.",
        "Anleitungen finden Sie in der Hilfe Ihres Browsers (z. B. Chrome, Firefox, Safari, Edge). Nach dem Löschen von Cookies kann der Cookie-Banner erneut erscheinen.",
      ],
    },
    {
      title: "8. Speicherdauer",
      paragraphs: [
        "**Session-Cookies** werden gelöscht, wenn Sie Ihren Browser oder die Anwendungssitzung beenden. Sie dienen vor allem Authentifizierung, Sitzungskontinuität und temporären Einstellungen.",
        "**Persistente Cookies** verbleiben für einen definierten Zeitraum auf Ihrem Gerät oder bis Sie sie manuell löschen. Sie können z. B. Spracheinstellungen, Theme oder Ihre Cookie-Auswahl speichern. Die Speicherdauer richtet sich nach dem jeweiligen Zweck und geltenden rechtlichen Anforderungen.",
      ],
    },
    {
      title: "9. Datenschutz",
      paragraphs: [
        "Verarbeiten Cookies personenbezogene Daten, erfolgt die Verarbeitung gemäß unserer {{privacy}}. Dort finden Sie Informationen zu Ihren Rechten, Speicherdauer, Empfängern und Sicherheitsmaßnahmen.",
      ],
    },
    {
      title: "10. Änderungen",
      paragraphs: [
        "Caisty kann diese Cookie-Richtlinie anpassen, wenn sich Rechtslage, eingesetzte Technologien oder unsere Dienste ändern. Wesentliche Änderungen werden über die Website, das Kundenportal oder andere geeignete Kanäle mitgeteilt. Die jeweils aktuelle Fassung ist auf dieser Seite abrufbar.",
      ],
    },
  ],
  contactSectionTitle: "11. Kontakt",
  contactSectionIntro: "Bei Fragen zu Cookies oder Einwilligungen kontaktieren Sie uns:",
  contact: legalContact.de,
  related: legalRelatedLabels.de,
};
