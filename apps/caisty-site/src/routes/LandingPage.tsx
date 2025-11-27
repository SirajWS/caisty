import { Link } from "react-router-dom";
import { PRICING_PLANS } from "../config/pricingPlans";

export default function LandingPage() {
  const { trialDays, starter, pro } = PRICING_PLANS || {};

  return (
    <div className="min-h-screen bg-slate-950 text-slate-50">
      {/* Hero */}
      <section className="max-w-5xl mx-auto px-4 pt-20 pb-16">
        <div className="inline-flex items-center rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-[11px] font-medium text-emerald-300 mb-6">
          POS &amp; Cloud-Konto für moderne Gastro &amp; Shops
        </div>

        <div className="grid gap-10 md:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)] items-center">
          {/* Text-Spalte */}
          <div className="space-y-6">
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-semibold leading-tight">
              Eine Kasse, ein Portal –{" "}
              <span className="text-emerald-400">alles im Blick.</span>
            </h1>
            <p className="text-sm sm:text-base text-slate-300 max-w-xl">
              Caisty verbindet schnelles Kassieren am POS mit einem klaren
              Cloud-Portal: Lizenzen verwalten, Geräte im Blick behalten und
              Rechnungen zentral abrufen.
            </p>

            <div className="flex flex-wrap gap-3 text-sm">
              <Link
                to="/pricing"
                className="inline-flex items-center justify-center rounded-full bg-emerald-500 px-5 py-2 text-sm font-medium text-slate-950 hover:bg-emerald-400 transition-colors"
              >
                Preise ansehen
              </Link>
              <Link
                to="/register"
                className="inline-flex items-center justify-center rounded-full border border-slate-700 px-5 py-2 text-sm font-medium text-slate-100 hover:bg-slate-800 transition-colors"
              >
                Kostenlos starten
              </Link>
            </div>

            <p className="text-[11px] text-slate-500 max-w-md">
              Starte mit einer{" "}
              <span className="font-semibold text-slate-300">
                {trialDays ?? 3}-Tage-Testlizenz
              </span>{" "}
              ohne Zahlungsdaten. Danach kannst du jederzeit auf Starter oder Pro
              wechseln. Die Installation von Caisty POS erfolgt später direkt aus
              dem Kundenportal.
            </p>
          </div>

          {/* Dashboard-Mock */}
          <div className="rounded-3xl border border-slate-800 bg-slate-900/70 p-4 shadow-xl shadow-emerald-900/40">
            <div className="flex items-center justify-between mb-3">
              <div className="text-[11px] uppercase tracking-wide text-slate-400">
                Beispiel-Ansicht
              </div>
              <div className="inline-flex items-center gap-1 rounded-full bg-slate-800 px-3 py-1 text-[11px] text-slate-300">
                <span className="h-2 w-2 rounded-full bg-emerald-400" />
                Live-Portal
              </div>
            </div>

            <div className="rounded-2xl border border-slate-800 bg-slate-950/80 p-4 space-y-3">
              <div className="text-xs font-semibold text-slate-200">
                Caisty Portal – Dashboard
              </div>
              <div className="grid gap-3 md:grid-cols-2 text-[11px]">
                <div className="rounded-xl border border-slate-800 bg-slate-900/80 p-3 space-y-1">
                  <div className="text-[11px] text-slate-400">
                    Aktive Lizenz
                  </div>
                  <div className="font-mono text-[11px] text-slate-100">
                    CSTY-XXXX-XXXX-XXXX
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-slate-400">
                    <span>Starter · 1 Gerät</span>
                    <span>gültig bis 31.12.2025</span>
                  </div>
                </div>
                <div className="rounded-xl border border-slate-800 bg-slate-900/80 p-3 space-y-2">
                  <div className="flex items-center justify-between text-[11px] text-slate-400">
                    <span>Verbundene Geräte</span>
                    <span className="rounded-full bg-slate-800 px-2 py-0.5 text-[10px] text-slate-300">
                      Demo
                    </span>
                  </div>
                  <div className="text-2xl font-semibold text-emerald-400">
                    3
                  </div>
                  <div className="text-[11px] text-slate-400">
                    2 online · 1 offline
                  </div>
                </div>
              </div>

              <div className="mt-2 rounded-xl border border-dashed border-slate-800 bg-slate-900/60 p-3 text-[11px] text-slate-400">
                „Wir wollten eine Kasse, die einfach läuft – und ein Portal,
                das wir verstehen.“ – fiktives Bistro
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Warum Caisty? */}
      <section className="max-w-5xl mx-auto px-4 pb-10 space-y-6">
        <div className="space-y-2">
          <h2 className="text-xl font-semibold">Warum Caisty?</h2>
          <p className="text-sm text-slate-300 max-w-2xl">
            Caisty ist für Betreiber, die keine Lust auf komplizierte
            Backoffice-Systeme haben, sondern schnell starten wollen – mit
            klarer Struktur für Lizenzen, Geräte und Abrechnung.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-3 text-sm">
          <FeatureCard
            title="Schnell startklar"
            text="Installer laden, Lizenz verbinden, loskassieren – ohne wochenlange Einrichtung."
          />
          <FeatureCard
            title="Volle Übersicht"
            text="Im Portal siehst du jederzeit, welche Lizenzen aktiv sind und welche Geräte verbunden sind."
          />
          <FeatureCard
            title="Fair & transparent"
            text="Klare Pläne ohne versteckte Gebühren. Ideal, um klein zu starten und später zu wachsen."
          />
        </div>
      </section>

      {/* Pläne & Lizenzen */}
      <section className="max-w-5xl mx-auto px-4 pb-12 space-y-5">
        <div className="space-y-2">
          <h2 className="text-xl font-semibold">Pläne &amp; Lizenzen</h2>
          <p className="text-sm text-slate-300 max-w-2xl">
            Teste Caisty zuerst kostenlos und entscheide dann, ob du mit Starter
            oder Pro weitermachst. Du kannst monatlich zahlen oder mit einem
            Jahresplan sparen.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-3 text-sm">
          <PlanCard
            name="Trial"
            badge="Kostenlos testen"
            price={`0 €`}
            note={`${trialDays ?? 3} Tage, 1 Gerät`}
            details={[
              "Voller Funktionsumfang wie Starter",
              "Keine Zahlungsdaten nötig",
              "Ideal zum Ausprobieren im Live-Betrieb",
            ]}
          />
          <PlanCard
            name="Starter"
            badge="Für eine Kasse"
            price={`${starter?.monthly ?? 19} € / Monat`}
            subPrice={`oder ${starter?.yearly ?? 190} € / Jahr`}
            note={`${starter?.devices ?? 1} Gerät inklusive`}
            highlight
            details={[
              "Perfekt für einen Standort",
              "Basis-Reporting & Portalzugang",
              "Upgrade auf Pro jederzeit möglich",
            ]}
          />
          <PlanCard
            name="Pro"
            badge="Mehrere Geräte"
            price={`${pro?.monthly ?? 35} € / Monat`}
            subPrice={`oder ${pro?.yearly ?? 350} € / Jahr`}
            note={`${pro?.devices ?? 3} Geräte inklusive`}
            details={[
              "Ideal für 2–3 Kassen oder Filialen",
              "Alle Starter-Funktionen",
              "Mehrere Geräte unter einer Lizenz",
            ]}
          />
        </div>

        <p className="text-[11px] text-slate-500">
          Alle Preise zzgl. MwSt. – die genaue Abrechnung (monatlich oder
          jährlich) wählst du später direkt im Kundenportal. Dort kannst du
          auch jederzeit zwischen Starter und Pro wechseln.
        </p>
      </section>

      {/* Für wen ist Caisty? */}
      <section className="max-w-5xl mx-auto px-4 pb-12 space-y-4">
        <h2 className="text-xl font-semibold">Für wen ist Caisty?</h2>
        <div className="grid gap-4 md:grid-cols-3 text-sm">
          <FeatureCard
            title="Take-Away & Street-Food"
            text="Schnelle Bestellungen, wenige Knöpfe, fokussiert auf Tempo."
          />
          <FeatureCard
            title="Bars & Cafés"
            text="Einfache Artikelstrukturen, flexible Preisupdates und Tagesabrechnungen."
          />
          <FeatureCard
            title="Kleine Shops"
            text="Kasse, Belege und Basis-Reporting in einem System – ohne Overkill."
          />
        </div>
      </section>

      {/* Installations-Vorschau */}
      <section className="max-w-5xl mx-auto px-4 pb-16">
        <div className="rounded-3xl border border-slate-800 bg-slate-900/70 p-5 md:p-7 grid gap-6 md:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)] items-center">
          {/* Textseite */}
          <div className="space-y-3">
            <h2 className="text-lg font-semibold">
              In wenigen Minuten vom Download zur einsatzbereiten Kasse.
            </h2>
            <p className="text-sm text-slate-300">
              Die eigentliche Installation von Caisty POS läuft komplett über
              dein Kundenportal. Dort bekommst du den Installer, deinen
              Lizenzschlüssel und eine Schritt-für-Schritt-Anleitung.
            </p>

            <ol className="space-y-2 text-sm text-slate-200">
              <li>
                <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500/10 text-[11px] font-semibold text-emerald-300 mr-2">
                  1
                </span>
                Portalzugang anlegen und Lizenz erhalten.
              </li>
              <li>
                <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500/10 text-[11px] font-semibold text-emerald-300 mr-2">
                  2
                </span>
                Installer für dein Betriebssystem aus dem Portal herunterladen.
              </li>
              <li>
                <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500/10 text-[11px] font-semibold text-emerald-300 mr-2">
                  3
                </span>
                Auf dem Kassen-PC installieren und Lizenzschlüssel eingeben –
                fertig.
              </li>
            </ol>

            <p className="text-[11px] text-slate-500">
              Die detaillierte Installationsseite siehst du nach dem Login unter{" "}
              <span className="font-semibold text-slate-300">
                „Caisty POS installieren“
              </span>{" "}
              im Kundenportal.
            </p>
          </div>

          {/* „Bild“ / Preview-Kachel */}
          <div className="relative">
            <div className="absolute -inset-1 rounded-3xl bg-emerald-500/10 blur-xl" />
            <div className="relative rounded-2xl border border-slate-800 bg-gradient-to-b from-slate-900 to-slate-950 p-4 shadow-lg shadow-emerald-900/40 space-y-3">
              <div className="flex items-center justify-between mb-1">
                <div className="text-[11px] text-slate-400">
                  Kundenportal · Installationsseite
                </div>
                <div className="flex gap-1">
                  <span className="h-2 w-2 rounded-full bg-emerald-400" />
                  <span className="h-2 w-2 rounded-full bg-amber-400" />
                  <span className="h-2 w-2 rounded-full bg-rose-400" />
                </div>
              </div>

              <div className="rounded-xl border border-slate-800 bg-slate-900/80 p-3 space-y-2 text-[11px] text-slate-300">
                <div className="flex justify-between items-center">
                  <span className="font-semibold text-slate-100">
                    Caisty POS installieren
                  </span>
                  <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-emerald-300">
                    Vorschau
                  </span>
                </div>

                <div className="grid gap-2 sm:grid-cols-3 mt-1">
                  <StepPill label="Windows" active />
                  <StepPill label="Linux (bald)" />
                  <StepPill label="macOS (bald)" />
                </div>

                <div className="mt-2 grid gap-2 sm:grid-cols-3">
                  <SmallStep title="Download" number={1} />
                  <SmallStep title="Installation" number={2} />
                  <SmallStep title="Lizenz verbinden" number={3} />
                </div>

                <div className="mt-3 h-10 rounded-xl border border-dashed border-slate-700 bg-slate-900/80 flex items-center justify-center text-[11px] text-slate-500">
                  Download-Button &amp; Details erscheinen später direkt im
                  Portal – nicht auf der öffentlichen Website.
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Fiscal info / international use */}
      <section className="max-w-5xl mx-auto px-4 pb-20">
        <div className="rounded-3xl border border-slate-800 bg-slate-900/70 p-5 space-y-3 text-xs sm:text-sm text-slate-300">
          <h2 className="text-sm sm:text-base font-semibold text-slate-100">
            Fiscal info &amp; international use
          </h2>
          <p>
            Caisty currently offers a{" "}
            <span className="font-semibold">
              “No fiscal engine / generic receipts”
            </span>{" "}
            mode and shows several fiscal packs as{" "}
            <span className="font-semibold">“coming soon”</span> (TSE, RKSV,
            NF525, SAF-T, TicketBAI, myDATA …). You can already use the POS in
            many <span className="font-semibold">non-fiscal countries</span>,
            for example:
          </p>
          <ul className="list-disc list-inside space-y-1">
            <li>Netherlands (EUR)</li>
            <li>Ireland (EUR)</li>
            <li>Switzerland (CHF)</li>
            <li>United Kingdom (GBP)</li>
            <li>Czech Republic (CZK)</li>
            <li>Tunisia (TND)</li>
            <li>Morocco (MAD)</li>
            <li>Algeria (DZD)</li>
            <li>Libya (LYD)</li>
          </ul>
          <p>
            In countries with a{" "}
            <span className="font-semibold">strict fiscalization requirement</span>{" "}
            – for example Germany, Austria, Italy, France, Spain, Portugal and
            others – a certified fiscal device or certified software is often
            mandatory. As long as the matching Caisty fiscal pack is only shown
            as <span className="font-semibold">“coming soon”</span>, you are
            using the generic mode{" "}
            <span className="font-semibold">at your own responsibility</span>.
            Always confirm with your local tax advisor or authority whether this
            mode is allowed for your business.
          </p>
          <p>
            Caisty helps you technically (receipts, journals, exports), but it
            does not replace legal advice or official registration with tax
            authorities.
          </p>
        </div>
      </section>
    </div>
  );
}

function FeatureCard(props: { title: string; text: string }) {
  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4 space-y-2">
      <div className="text-sm font-medium text-slate-100">{props.title}</div>
      <p className="text-xs text-slate-300">{props.text}</p>
    </div>
  );
}

function PlanCard(props: {
  name: string;
  badge: string;
  price: string;
  subPrice?: string;
  note?: string;
  highlight?: boolean;
  details?: string[];
}) {
  const base =
    "rounded-2xl border p-4 space-y-3 bg-slate-900/70 text-xs sm:text-sm";
  const style = props.highlight
    ? "border-emerald-500/70 shadow-lg shadow-emerald-900/40"
    : "border-slate-800";

  return (
    <div className={`${base} ${style}`}>
      <div className="flex items-center justify-between gap-2">
        <div className="text-sm font-semibold text-slate-100">
          {props.name}
        </div>
        <span className="inline-flex items-center rounded-full border border-slate-700 bg-slate-900 px-2 py-0.5 text-[10px] text-slate-300">
          {props.badge}
        </span>
      </div>
      <div className="space-y-1">
        <div className="text-lg font-semibold text-emerald-400">
          {props.price}
        </div>
        {props.subPrice && (
          <div className="text-[11px] text-slate-400">{props.subPrice}</div>
        )}
        {props.note && (
          <div className="text-[11px] text-slate-300">{props.note}</div>
        )}
      </div>
      {props.details && props.details.length > 0 && (
        <ul className="mt-2 space-y-1 text-[11px] text-slate-300">
          {props.details.map((d, i) => (
            <li key={i}>• {d}</li>
          ))}
        </ul>
      )}
    </div>
  );
}

function StepPill({ label, active }: { label: string; active?: boolean }) {
  return (
    <div
      className={[
        "inline-flex items-center justify-center rounded-full border px-3 py-1 text-[11px]",
        active
          ? "border-emerald-500/60 bg-emerald-500/10 text-emerald-200"
          : "border-slate-700 bg-slate-900 text-slate-400",
      ].join(" ")}
    >
      {label}
    </div>
  );
}

function SmallStep({ title, number }: { title: string; number: number }) {
  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900/80 p-3 space-y-2">
      <div className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500/15 text-[11px] font-semibold text-emerald-300">
        {number}
      </div>
      <div className="text-[11px] font-semibold text-slate-100">{title}</div>
      <div className="h-2 rounded bg-slate-800" />
    </div>
  );
}
