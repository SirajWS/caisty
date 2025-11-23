export default function LandingPage() {
  return (
    <div className="space-y-16">
      {/* Hero */}
      <section className="grid gap-10 md:grid-cols-2 md:items-center">
        <div className="space-y-6">
          <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/40 bg-emerald-500/10 px-3 py-1 text-xs text-emerald-300">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
            Caisty POS + Cloud – für moderne Gastronomie & Shops
          </div>

          <div className="space-y-3">
            <h1 className="text-4xl md:text-5xl font-bold tracking-tight">
              Deine Kasse.{" "}
              <span className="text-emerald-400">Dein Cloud-Cockpit.</span>
            </h1>
            <p className="text-slate-300 text-sm md:text-base max-w-xl">
              Caisty verbindet eine schnelle, offlinefähige POS-App mit einem
              Cloud-Backend für Lizenzen, Seats, Geräte und Zahlungen. Ideal
              für kleine Restaurants, Cafés, Bäckereien und Shops.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <a
              href="/register"
              className="inline-flex items-center justify-center rounded-full bg-emerald-500 px-5 py-2.5 text-sm font-medium text-slate-950 hover:bg-emerald-400"
            >
              Jetzt kostenlos testen
            </a>
            <a
              href="/pricing"
              className="inline-flex items-center justify-center rounded-full border border-slate-700 px-4 py-2 text-sm text-slate-200 hover:bg-slate-900"
            >
              Preise ansehen
            </a>
          </div>

          <div className="flex flex-wrap gap-4 text-xs text-slate-400">
            <span>• Offline nutzbar mit Cloud-Sync</span>
            <span>• Lizenzverwaltung mit Seats &amp; Geräten</span>
            <span>• Kundenportal für Rechnungen &amp; Downloads</span>
          </div>
        </div>

        {/* POS/Cloud Mock – später echte Screenshots */}
        <div className="relative">
          <div className="absolute -inset-6 bg-emerald-500/20 blur-3xl opacity-60" />
          <div className="relative rounded-3xl border border-slate-800 bg-slate-900/70 p-5 shadow-xl shadow-emerald-500/20">
            <div className="flex justify-between items-center mb-4">
              <div className="text-sm font-medium text-slate-200">
                Caisty Cloud Dashboard
              </div>
              <span className="text-xs text-emerald-300">Demo-Ansicht</span>
            </div>
            <div className="grid grid-cols-3 gap-3 text-xs">
              <div className="rounded-xl bg-slate-900 border border-slate-800 p-3">
                <div className="text-slate-400">Aktive Lizenzen</div>
                <div className="mt-1 text-2xl font-semibold text-emerald-400">
                  12
                </div>
              </div>
              <div className="rounded-xl bg-slate-900 border border-slate-800 p-3">
                <div className="text-slate-400">Online-Geräte</div>
                <div className="mt-1 text-2xl font-semibold text-emerald-400">
                  9
                </div>
              </div>
              <div className="rounded-xl bg-slate-900 border border-slate-800 p-3">
                <div className="text-slate-400">Monatsumsatz</div>
                <div className="mt-1 text-2xl font-semibold">12.4k TND</div>
              </div>
            </div>
            <div className="mt-4 h-24 rounded-xl border border-slate-800 bg-gradient-to-tr from-slate-900 to-slate-950 flex items-center justify-center text-xs text-slate-400">
              Hier kommen später echte Screenshots von POS &amp; Portal hin.
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="grid gap-6 md:grid-cols-3">
        <FeatureCard
          title="POS für den Alltag"
          text="Schnelles Kassieren, einfache Oberfläche, optimiert für kleine Teams – auch wenn es im Laden stressig wird."
        />
        <FeatureCard
          title="Cloud-Licensing mit Seats"
          text="Mit Caisty Cloud steuerst du, welche Geräte auf welche Lizenz zugreifen. Volle Kontrolle über aktive Seats."
        />
        <FeatureCard
          title="Kundenportal"
          text="Deine Kunden erhalten Self-Service für Rechnungen, Planwechsel und POS-Download – weniger manueller Aufwand."
        />
      </section>

      {/* 3-Steps */}
      <section className="border border-slate-800 rounded-3xl bg-slate-900/40 p-6 md:p-8 space-y-6">
        <h2 className="text-xl font-semibold">
          So läuft dein Start mit Caisty in 3 Schritten
        </h2>
        <div className="grid gap-4 md:grid-cols-3 text-sm text-slate-300">
          <Step num={1} title="Konto anlegen">
            Registriere dich im Portal, wähle Starter oder Pro und lege deine
            Organisation an.
          </Step>
          <Step num={2} title="Plan buchen">
            Bezahle sicher online, erhalte automatisch deine License &amp; Seats
            und sieh alles im Portal.
          </Step>
          <Step num={3} title="POS verbinden">
            Installiere Caisty POS, trage deinen Lizenzschlüssel ein und starte
            sofort im Laden.
          </Step>
        </div>
      </section>
    </div>
  );
}

function FeatureCard(props: { title: string; text: string }) {
  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 space-y-2">
      <h3 className="text-sm font-semibold text-slate-100">{props.title}</h3>
      <p className="text-xs text-slate-300 leading-relaxed">{props.text}</p>
    </div>
  );
}

function Step(props: {
  num: number;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-2">
      <div className="inline-flex items-center gap-2">
        <span className="h-6 w-6 rounded-full bg-emerald-500 text-slate-950 text-xs flex items-center justify-center font-bold">
          {props.num}
        </span>
        <span className="font-medium text-slate-100 text-sm">
          {props.title}
        </span>
      </div>
      <p className="text-xs text-slate-300 leading-relaxed">
        {props.children}
      </p>
    </div>
  );
}
