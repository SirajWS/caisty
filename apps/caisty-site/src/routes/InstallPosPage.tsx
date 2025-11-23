// apps/caisty-site/src/routes/InstallPosPage.tsx
import React from "react";
import { Link } from "react-router-dom";

type OsKey = "windows" | "linux" | "mac";

const TABS: { id: OsKey; label: string; beta?: boolean }[] = [
  { id: "windows", label: "Windows" },
  { id: "linux", label: "Linux (bald)", beta: true },
  { id: "mac", label: "macOS (bald)", beta: true },
];

const InstallPosPage: React.FC = () => {
  const [activeOs, setActiveOs] = React.useState<OsKey>("windows");

  return (
    <div className="min-h-[calc(100vh-80px)] bg-slate-950 text-slate-100 py-10 md:py-14">
      <div className="max-w-5xl mx-auto px-4 space-y-10">
        {/* Hero */}
        <header className="space-y-4">
          <div className="inline-flex items-center rounded-full border border-emerald-500/40 bg-emerald-500/5 px-3 py-1 text-[11px] uppercase tracking-wide text-emerald-300">
            Caisty POS installieren
          </div>
          <h1 className="text-2xl md:text-3xl font-semibold tracking-tight">
            In wenigen Minuten vom Download zur einsatzbereiten Kasse.
          </h1>
          <p className="max-w-2xl text-sm text-slate-300">
            Folge den Schritten für dein Betriebssystem, verbinde Caisty POS
            mit deinem Lizenzschlüssel und lege direkt los. In dieser Version
            läuft alles lokal – später kommt Cloud-Sync dazu.
          </p>
        </header>

        {/* OS Tabs + Download */}
        <section className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 md:p-6 space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex gap-2 rounded-full bg-slate-950/60 p-1 text-xs">
              {TABS.map((tab) => {
                const isActive = activeOs === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setActiveOs(tab.id)}
                    className={[
                      "inline-flex items-center gap-1 rounded-full px-3 py-1 transition-colors",
                      isActive
                        ? "bg-emerald-500 text-slate-950 font-semibold"
                        : "text-slate-300 hover:bg-slate-800",
                    ].join(" ")}
                  >
                    {tab.label}
                    {tab.beta && (
                      <span className="rounded-full bg-slate-800 px-2 py-0.5 text-[9px] uppercase text-slate-400">
                        geplant
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            {activeOs === "windows" && (
              <a
                href="#"
                className="inline-flex items-center justify-center rounded-full bg-emerald-500 px-4 py-2 text-xs font-semibold text-slate-950 hover:bg-emerald-400"
              >
                Download Caisty POS für Windows
              </a>
            )}
          </div>

          {activeOs === "windows" ? (
            <WindowsSteps />
          ) : (
            <ComingSoonSteps os={activeOs} />
          )}
        </section>

        {/* Lizenz + Portal-Verknüpfung */}
        <section className="grid gap-5 md:grid-cols-2">
          <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 space-y-3 text-sm">
            <h2 className="text-sm font-semibold text-slate-100">
              Lizenzschlüssel aus dem Kundenportal
            </h2>
            <p className="text-slate-300 text-sm">
              Deinen persönlichen Lizenzschlüssel findest du im{" "}
              <span className="font-medium">Caisty Portal</span> unter{" "}
              <span className="font-semibold">„Lizenzen“</span>. Diesen gibst du
              beim ersten Start von Caisty POS ein.
            </p>
            <div className="flex flex-wrap gap-2 text-xs">
              <Link
                to="/portal/licenses"
                className="inline-flex items-center rounded-full border border-emerald-500/60 bg-emerald-500/10 px-3 py-1 text-emerald-200 hover:bg-emerald-500/20"
              >
                Zum Kundenportal
              </Link>
              <Link
                to="/login"
                className="inline-flex items-center rounded-full border border-slate-700 px-3 py-1 text-slate-100 hover:bg-slate-800"
              >
                Portal-Login öffnen
              </Link>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 space-y-3 text-sm">
            <h2 className="text-sm font-semibold text-slate-100">
              Systemvoraussetzungen (Empfehlung)
            </h2>
            <ul className="list-disc pl-5 text-[13px] text-slate-300 space-y-1">
              <li>Windows 10 oder 11 (64-bit)</li>
              <li>Mindestens 4 GB RAM (8 GB empfohlen)</li>
              <li>Stabile Internetverbindung für Lizenzprüfung</li>
              <li>Thermobondrucker (80 mm) oder A4-Drucker</li>
              <li>Optional: Kassenschublade, Kundendisplay, Barcode-Scanner</li>
            </ul>
          </div>
        </section>

        {/* Troubleshooting */}
        <section className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 md:p-6 space-y-3 text-[13px] text-slate-300">
          <h2 className="text-sm font-semibold text-slate-100">
            Hilfe &amp; Troubleshooting
          </h2>
          <p>
            Wenn etwas bei der Installation hakt (Drucker, Firewall,
            Virenscanner), helfen wir dir gerne. In einer späteren Version
            findest du hier eine vollständige Wissensdatenbank.
          </p>
          <p>
            Bis dahin erreichst du uns per Mail unter{" "}
            <a
              href="mailto:support@caisty.local"
              className="text-emerald-300 hover:text-emerald-200"
            >
              support@caisty.local
            </a>
            .
          </p>
        </section>
      </div>
    </div>
  );
};

const WindowsSteps: React.FC = () => {
  return (
    <div className="grid gap-5 md:grid-cols-3 text-xs text-slate-200">
      <Step
        number={1}
        title="Download"
        text="Caisty POS Installer für Windows herunterladen und die Datei auf deinem Kassen-PC speichern."
      />
      <Step
        number={2}
        title="Installation"
        text="Installer ausführen, den Assistenten durchklicken und Caisty POS starten. Es werden keine Admin-Rechte für das tägliche Arbeiten benötigt."
      />
      <Step
        number={3}
        title="Lizenz verbinden"
        text="Beim ersten Start deinen Lizenzschlüssel aus dem Portal eingeben. Danach öffnet sich direkt die Kassenoberfläche."
      />
    </div>
  );
};

const ComingSoonSteps: React.FC<{ os: OsKey }> = ({ os }) => {
  const label =
    os === "linux" ? "Linux" : os === "mac" ? "macOS" : "System";

  return (
    <div className="rounded-xl border border-slate-800 bg-slate-950/70 p-4 text-xs text-slate-300">
      <div className="text-sm font-semibold mb-1">
        {label}-Version in Vorbereitung
      </div>
      <p>
        Caisty POS wird zukünftig auch für {label} verfügbar sein. Der
        Funktionsumfang entspricht dann weitgehend der Windows-Version.
      </p>
      <p className="mt-2 text-slate-400">
        Wenn du frühzeitig testen möchtest, melde dich gerne beim Support.
      </p>
    </div>
  );
};

const Step: React.FC<{ number: number; title: string; text: string }> = ({
  number,
  title,
  text,
}) => (
  <div className="rounded-xl border border-slate-800 bg-slate-950/70 p-4 space-y-2">
    <div className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-emerald-500 text-[11px] font-bold text-slate-950">
      {number}
    </div>
    <div className="text-sm font-semibold">{title}</div>
    <p className="text-[11px] text-slate-300 leading-relaxed">{text}</p>
  </div>
);

export default InstallPosPage;
