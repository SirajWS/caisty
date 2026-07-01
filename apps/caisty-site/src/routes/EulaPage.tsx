import type { ReactNode } from "react";
import { LEGAL_PATHS } from "../config/marketingRoutes";
import { LegalDocumentLink, legalDocumentLinkClass } from "../components/LegalDocumentLink";
import { useTheme } from "../lib/theme";

const EFFECTIVE_DATE = "1. Juli 2026";
const VERSION = "2.0 (Master Edition)";

export default function EulaPage() {
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
        <p className={`text-xs font-semibold uppercase tracking-wider ${meta}`}>End User License Agreement (EULA)</p>
        <h1 className={`text-3xl font-semibold tracking-tight ${h1}`}>Endbenutzer-Lizenzvereinbarung</h1>
        <p className={`text-sm ${meta}`}>
          Caisty POS · Version {VERSION} · Stand: {EFFECTIVE_DATE}
        </p>
        <p className={`text-sm leading-relaxed ${body}`}>
          Diese Endbenutzer-Lizenzvereinbarung („EULA“ oder „Vereinbarung“) ist ein rechtsverbindlicher Vertrag zwischen
          Caisty und Ihnen als Kunde bzw. Nutzer über die Lizenzierung und Nutzung von Caisty POS, zugehörigen
          Cloud-Diensten, dem Kundenportal, APIs und weiteren Services. Mit Installation, Aktivierung, Registrierung
          oder Nutzung erkennen Sie diese Vereinbarung an.
        </p>
      </header>

      <div className={`max-w-none space-y-4 text-sm leading-relaxed ${body}`}>
        <CollapsiblePart title="Teil I – Allgemeine Bestimmungen" shell={partShell} h2={h2} defaultOpen>
          <Article title="1. Einleitung" h3={h3}>
            Diese Vereinbarung regelt die Lizenzierung und Nutzung der Software und ist integraler Bestandteil der
            vertraglichen Beziehung zwischen Caisty und dem Kunden. Wenn Sie den Bedingungen nicht zustimmen, dürfen Sie
            die Software nicht installieren, aktivieren oder nutzen.
          </Article>
          <Article title="2. Begriffe" h3={h3}>
            <p>Wesentliche Begriffe in dieser Vereinbarung:</p>
            <ul className="list-disc space-y-1 ps-5">
              <li>
                <strong>Software</strong> – Caisty POS einschließlich Updates, Module und Dokumentation
              </li>
              <li>
                <strong>Services</strong> – Cloud-Infrastruktur, Kundenportal, Lizenzverwaltung, APIs, Support
              </li>
              <li>
                <strong>Kunde / Nutzer</strong> – Unternehmen bzw. autorisierte natürliche Personen
              </li>
              <li>
                <strong>Konto, Gerät, Lizenz, Abonnement</strong> – wie in der Produktbeschreibung definiert
              </li>
              <li>
                <strong>Vertrauliche Informationen</strong> – nicht öffentliche geschäftliche, technische oder
                sicherheitsrelevante Informationen
              </li>
            </ul>
          </Article>
          <Article title="3. Geltungsbereich" h3={h3}>
            Diese EULA gilt für Caisty POS, das Kundenportal, Cloud-Dienste, Updates, APIs, Lizenzaktivierung,
            Abonnements und zugehörige digitale Inhalte. Bei Widerspruch zu einer von beiden Parteien unterzeichneten
            Individualvereinbarung gilt diese im Widerspruchsfall vor.
          </Article>
          <Article title="4. Annahme" h3={h3}>
            Sie akzeptieren diese Vereinbarung durch Kontoerstellung, Lizenzaktivierung, Installation, Nutzung des
            Kundenportals, Kauf oder Verlängerung eines Abonnements oder elektronische Bestätigung. Handeln Sie im
            Namen eines Unternehmens, versichern Sie, dazu berechtigt zu sein.
          </Article>
          <Article title="5. Berechtigung" h3={h3}>
            Die Services sind für geschäftliche und professionelle Nutzung bestimmt. Sie versichern, mindestens 18 Jahre
            alt bzw. geschäftsfähig zu sein, korrekte Registrierungsdaten anzugeben und die Services rechtmäßig zu
            nutzen.
          </Article>
          <Article title="6. Vertragsschluss" h3={h3}>
            Die Vereinbarung wird wirksam mit dem frühesten Ereignis aus Kontoerstellung, Lizenzaktivierung,
            Installation, Portalzugang, Abonnementkauf oder Nutzung. Eine handschriftliche Unterschrift ist nicht
            erforderlich, sofern gesetzlich zulässig.
          </Article>
          <Article title="7.–8. Lizenzgewährung und Art der Lizenz" h3={h3}>
            Vorbehaltlich Zahlung aller Gebühren und Einhaltung dieser Vereinbarung gewährt Caisty eine beschränkte,
            nicht ausschließliche, nicht übertragbare, nicht unterlizenzierbare, widerrufliche Lizenz zur Nutzung der
            Software ausschließlich für interne geschäftliche Zwecke. Die Software wird <strong>lizenziert, nicht
            verkauft</strong>. Es erfolgt kein Eigentums- oder IP-Rechtsübergang. Der Umfang richtet sich nach
            Abonnement, Geräte-/Nutzerlimits und technischen Vorgaben.
          </Article>
          <Article title="9. Lizenzbeschränkungen" h3={h3}>
            <p>Sofern nicht gesetzlich zwingend erlaubt oder schriftlich genehmigt, ist es untersagt:</p>
            <ul className="list-disc space-y-1 ps-5">
              <li>die Software zu vervielfältigen, zu verbreiten oder öffentlich zugänglich zu machen;</li>
              <li>abgeleitete Werke zu erstellen oder Reverse Engineering durchzuführen;</li>
              <li>Urheber-, Marken- oder Lizenzschutz zu entfernen oder zu umgehen;</li>
              <li>unbefugte Lizenzschlüssel oder Aktivierungsmechanismen zu nutzen;</li>
              <li>die Software zu vermieten, weiterzulizenzieren oder für Wettbewerbsprodukte zu nutzen;</li>
              <li>Schadsoftware einzuschleusen oder die Services missbräuchlich automatisiert anzugreifen.</li>
            </ul>
            <p>Verstöße können zur sofortigen Sperrung führen.</p>
          </Article>
          <Article title="10. Vorbehalt der Rechte" h3={h3}>
            Caisty behält sämtliche Rechte an Software, Quell-/Objektcode, Datenbanken, APIs, Dokumentation, Marken,
            Know-how und Weiterentwicklungen. Der Kunde erhält nur die ausdrücklich eingeräumten Nutzungsrechte.
          </Article>
        </CollapsiblePart>

        <CollapsiblePart title="Teil II – Software und Dienste" shell={partShell} h2={h2}>
          <Article title="11. Benutzerkonto" h3={h3}>
            Für bestimmte Funktionen ist ein Kundenkonto erforderlich. Sie sind für korrekte Daten, Geheimhaltung der
            Zugangsdaten, autorisierte Nutzer und alle Kontaktivitäten verantwortlich. Sicherheitsvorfälle sind
            unverzüglich zu melden.
          </Article>
          <Article title="12. Geräteaktivierung" h3={h3}>
            Die Software darf nur auf im Abonnement autorisierten Geräten aktiviert werden. Aktivierung kann
            Online-Prüfung, Gerätegrenzen und periodische Validierung umfassen. Manipulation oder Umgehung ist untersagt.
          </Article>
          <Article title="13. Abonnements" h3={h3}>
            Der Zugang erfolgt über Abonnementpläne mit unterschiedlichen Funktionen, Geräte-/Nutzerlimits, Support-
            und Integrationsumfang. Beschreibungen werden auf Website und im Kundenportal veröffentlicht.
          </Article>
          <Article title="14. Installation" h3={h3}>
            Installation nur über offizielle Caisty-Kanäle. Sie sind für kompatible Hardware, Betriebssysteme und
            Netzwerke verantwortlich. Caisty garantiert keine Kompatibilität mit nicht unterstützten Umgebungen.
          </Article>
          <Article title="15. Updates und Upgrades" h3={h3}>
            Während eines aktiven Abonnements können Updates, Sicherheitsfixes und neue Funktionen bereitgestellt
            werden. Sicherheitsupdates können automatisch installiert werden. Veraltete Versionen können eingestellt
            werden.
          </Article>
          <Article title="16. Cloud-Dienste" h3={h3}>
            Funktionen wie Authentifizierung, Lizenzprüfung, Synchronisation und Portal erfordern Internet. Caisty
            bemüht sich um Verfügbarkeit auf Basis wirtschaftlich zumutbarer Anstrengungen; unterbrechungsfreier Betrieb
            ist nicht garantiert.
          </Article>
          <Article title="17. Kundenportal" h3={h3}>
            Über das Portal können autorisierte Nutzer u. a. Lizenzen, Geräte, Abonnements, Rechnungen und
            Sicherheitseinstellungen verwalten. Alle Handlungen autorisiert er Nutzer werden dem Kunden zugerechnet.
          </Article>
          <Article title="18. APIs und Integrationen" h3={h3}>
            API-Nutzung unterliegt dieser Vereinbarung, Dokumentation, Limits und Sicherheitsvorgaben. Drittanbieter-
            Integrationen unterliegen deren eigenen Bedingungen; Caisty garantiert keine dauerhafte Kompatibilität.
          </Article>
          <Article title="19. Support" h3={h3}>
            Support im Rahmen des Abonnements kann technische Hilfe, Dokumentation und Fehlerbearbeitung umfassen, nicht
            jedoch individuelle Entwicklung, Hardware-Wartung oder Rechts-/Steuerberatung. Reaktionszeiten sind
            Zielwerte, sofern nicht schriftlich anders vereinbart.
          </Article>
          <Article title="20. Verfügbarkeit" h3={h3}>
            Wartung, Sicherheitsvorfälle, Infrastrukturstörungen und höhere Gewalt können Verfügbarkeit beeinträchtigen.
            Vorübergehende Unterbrechungen stellen grundsätzlich keinen Vertragsverstoß dar.
          </Article>
        </CollapsiblePart>

        <CollapsiblePart title="Teil III – Geistiges Eigentum und Daten" shell={partShell} h2={h2}>
          <Article title="21.–22. Geistiges Eigentum und Marken" h3={h3}>
            Software und Services bleiben ausschließliches Eigentum von Caisty bzw. Lizenzgebern. Marken, Logos und
            Produktnamen dürfen nicht ohne Genehmigung genutzt oder verändert werden.
          </Article>
          <Article title="23. Vertraulichkeit" h3={h3}>
            Beide Parteien schützen vertrauliche Informationen der jeweils anderen Partei und nutzen diese nur für
            vertragsbezogene Zwecke. Die Pflichten überdauern die Beendigung der Vereinbarung.
          </Article>
          <Article title="24. Kundendaten" h3={h3}>
            Der Kunde behält das Eigentum an seinen Geschäftsdaten. Caisty erhält nur die zur Bereitstellung der Services
            erforderlichen Verarbeitungsrechte. Der Kunde ist für Rechtmäßigkeit, Richtigkeit und erforderliche
            Einwilligungen verantwortlich.
          </Article>
          <Article title="25. Datenschutz" h3={h3}>
            Personenbezogene Daten werden gemäß DSGVO,{" "}
            <LegalDocumentLink to={LEGAL_PATHS.privacy} isLight={isLight}>
              Datenschutzerklärung
            </LegalDocumentLink>{" "}
            und – soweit anwendbar –{" "}
            <LegalDocumentLink to={LEGAL_PATHS.dpa} isLight={isLight}>
              AVV
            </LegalDocumentLink>{" "}
            verarbeitet. Verarbeitet Caisty Daten im Auftrag des Kunden, handelt Caisty als Auftragsverarbeiter.
          </Article>
          <Article title="26. Sicherheit" h3={h3}>
            Caisty setzt angemessene technische und organisatorische Maßnahmen ein, u. a. verschlüsselte Kommunikation,
            Passwort-Hashing, rollenbasierte Zugriffe, Monitoring, Updates und Wiederherstellungskonzepte. Absolute
            Sicherheit kann nicht garantiert werden; der Kunde trägt Mitverantwortung.
          </Article>
          <Article title="27.–28. Backup und Aufbewahrung" h3={h3}>
            Caisty kann betriebliche Backups durchführen; diese ersetzen keine eigenständige Datensicherung des Kunden.
            Daten werden nur so lange gespeichert, wie für Vertrag, Recht und Betrieb erforderlich, danach gelöscht oder
            anonymisiert.
          </Article>
          <Article title="29.–30. Pflichten und Compliance des Kunden" h3={h3}>
            Der Kunde nutzt die Software rechtmäßig, hält Gesetze ein (Steuer, Buchhaltung, Datenschutz, Branchenrecht)
            und trifft angemessene interne Sicherheitsmaßnahmen. Caisty erbringt keine Rechts-, Steuer- oder
            Buchführungsberatung.
          </Article>
        </CollapsiblePart>

        <CollapsiblePart title="Teil IV – Gewährleistung, Haftung und Kündigung" shell={partShell} h2={h2}>
          <Article title="31. Gewährleistungsausschluss" h3={h3}>
            Caisty entwickelt die Software mit der Sorgfalt eines ordentlichen SaaS-Anbieters. Im gesetzlich zulässigen
            Umfang wird die Software „wie besehen“ und „wie verfügbar“ bereitgestellt. Es wird keine Garantie für
            fehlerfreien, unterbrechungsfreien Betrieb oder Eignung für jeden Zweck übernommen, soweit nicht zwingendes
            Recht entgegensteht.
          </Article>
          <Article title="32. Haftungsbeschränkung" h3={h3}>
            Caisty haftet unbeschränkt bei Vorsatz, grober Fahrlässigkeit und bei Schäden an Leben, Körper oder
            Gesundheit. Im Übrigen ist die Haftung für indirekte Schäden, entgangenen Gewinn, Datenverlust oder
            Betriebsunterbrechung ausgeschlossen, soweit zulässig. Die Gesamthaftung ist auf die in den zwölf Monaten
            vor dem schadensauslösenden Ereignis gezahlten Abonnementgebühren begrenzt, sofern nicht zwingendes Recht
            weitergehende Haftung vorsieht.
          </Article>
          <Article title="33. Freistellung" h3={h3}>
            Der Kunde stellt Caisty von Ansprüchen frei, die aus Verstößen gegen diese Vereinbarung, rechtswidriger
            Nutzung, rechtsverletzenden Kundendaten oder unsachgemäßem Schutz von Zugangsdaten entstehen.
          </Article>
          <Article title="34.–35. Sperrung und Kündigung" h3={h3}>
            Caisty kann Services bei Sicherheitsrisiken, Zahlungsverzug, Betrug oder schwerwiegenden Verstößen sperren
            oder kündigen. Der Kunde kann Abonnements über das Portal kündigen. Mit Beendigung erlischt die Lizenz.
          </Article>
          <Article title="36. Folgen der Beendigung" h3={h3}>
            Nach Beendigung endet das Nutzungsrecht; Zugänge können deaktiviert werden. Daten werden gemäß
            Datenschutzerklärung und AVV aufbewahrt oder gelöscht. Fortgeltende Regelungen (IP, Vertraulichkeit,
            Haftung, Freistellung, Recht) bleiben wirksam.
          </Article>
          <Article title="37.–39. Höhere Gewalt, Exportkontrolle, Prüfungen" h3={h3}>
            Keine Partei haftet für höhere Gewalt. Der Kunde beachtet Export- und Sanktionsrecht. Caisty darf zur
            Lizenzprüfung angemessene Nachweise anfordern, ohne unbeschränkten Systemzugang zu verlangen.
          </Article>
        </CollapsiblePart>

        <CollapsiblePart title="Teil V – Schlussbestimmungen" shell={partShell} h2={h2}>
          <Article title="41.–44. Änderungen, Abtretung, Salvatorische Klausel, Gesamtvereinbarung" h3={h3}>
            Caisty kann diese Vereinbarung anpassen; wesentliche Änderungen werden mitgeteilt. Fortgesetzte Nutzung gilt
            als Zustimmung, sofern gesetzlich zulässig. Abtretung durch den Kunden bedarf Zustimmung. Unwirksame
            Bestimmungen werden durch wirksame ersetzt, die dem wirtschaftlichen Zweck am nächsten kommen. Diese EULA
            bildet mit AGB, Datenschutz, Cookies und AVV das vertragliche Gesamtwerk.
          </Article>
          <Article title="45.–46. Anwendbares Recht und Streitbeilegung" h3={h3}>
            <p>
              Diese Vereinbarung unterliegt dem Recht der <strong>Bundesrepublik Deutschland</strong> unter Ausschluss
              des UN-Kaufrechts (CISG) und ohne Rückgriff auf Kollisionsnormen, die anderes Recht anwenden würden.
            </p>
            <p>
              Soweit gesetzlich zulässig – insbesondere bei Verträgen mit Kaufleuten (B2B) – ist ausschließlicher
              Gerichtsstand <strong>Berlin, Deutschland</strong>.
            </p>
            <p>
              Streitigkeiten werden zunächst einvernehmlich geklärt; danach können zuständige Gerichte angerufen werden.
              Einstweiliger Rechtsschutz bleibt vorbehalten.
            </p>
          </Article>
          <Article title="47.–48. Elektronische Annahme und Sprache" h3={h3}>
            Die Vereinbarung kann elektronisch angenommen werden und hat – soweit zulässig – dieselbe Wirkung wie eine
            Unterschrift. Bei Abweichungen zwischen Übersetzungen und der maßgeblichen Fassung gilt die jeweils
            verbindliche Rechtsordnung bzw. die vereinbarte Master-Fassung.
          </Article>
          <Article title="49.–50. Kontakt und Inkrafttreten" h3={h3}>
            <div className={card}>
              <p className={`font-semibold ${h2}`}>Caisty · Inhaber: Siraj Bettaieb</p>
              <p>Mollwitzstraße 5A, 14059 Berlin, Deutschland</p>
              <p className="pt-2">
                Allgemein / Rechtliches:{" "}
                <a href="mailto:info@caisty.com" className={legalDocumentLinkClass(isLight)}>
                  info@caisty.com
                </a>
              </p>
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
              <p className="pt-2">
                <strong>Inkrafttreten:</strong> {EFFECTIVE_DATE}
              </p>
            </div>
            <p className="pt-2">
              Mit Nutzung bestätigen Sie, diese Vereinbarung gelesen und akzeptiert zu haben.
            </p>
          </Article>
        </CollapsiblePart>

        <CollapsiblePart title="Anhang A – Lizenzpläne" shell={partShell} h2={h2}>
          <p>
            Abonnementpläne (z. B. Starter, Professional, Enterprise) definieren Geräte-, Nutzer- und Feature-Limits.
            Details werden auf der Website und im Kundenportal veröffentlicht. Lizenzen sind nicht übertragbar, sofern
            nicht schriftlich vereinbart. Fair-Use-Regeln dienen Stabilität und Sicherheit der Plattform.
          </p>
        </CollapsiblePart>

        <CollapsiblePart title="Anhang B – Acceptable Use Policy (AUP)" shell={partShell} h2={h2}>
          <p>
            Die AUP schützt Sicherheit, Integrität und rechtmäßige Nutzung. Untersagt sind u. a. rechtswidrige Nutzung,
            Malware, unbefugter Zugriff, Umgehung von Lizenzmechanismen, übermäßige automatisierte Last, Wiederverkauf
            ohne Genehmigung und Entwicklung konkurrierender Produkte auf Basis proprietärer Komponenten. Bei Verstößen
            kann Caisty warnen, sperren oder kündigen.
          </p>
        </CollapsiblePart>

        <CollapsiblePart title="Anhang C – Service Level Objectives (SLO)" shell={partShell} h2={h2}>
          <p>
            Caisty strebt hohe Verfügbarkeit der Cloud-Infrastruktur an (Ziel: ca. 99,5 % monatliche Uptime,
            ausgenommen Wartung, höhere Gewalt und Drittanbieter-Störungen). SLOs sind Betriebsziele, keine
            garantierten Service Levels, sofern nicht separat schriftlich vereinbart. Support erfolgt in den
            kommunizierten Geschäftszeiten.
          </p>
        </CollapsiblePart>

        <section className={`space-y-3 pt-4 border-t ${isLight ? "border-slate-200" : "border-white/10"}`}>
          <h2 className={`text-xl font-semibold ${h2}`}>Verwandte Dokumente</h2>
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
              <LegalDocumentLink to={LEGAL_PATHS.cookie} isLight={isLight}>
                Cookie-Richtlinie
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
