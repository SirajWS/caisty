// apps/caisty-site/src/routes/PortalInstallPage.tsx
import React from "react";
import { usePortalOutlet } from "./PortalLayout";
import {
  fetchPortalLicenses,
  type PortalLicense,
} from "../lib/portalApi";
import { Button } from "../components/ui/Button";

function formatDate(value: string | null | undefined): string {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleString();
}

const PortalInstallPage: React.FC = () => {
  const { customer } = usePortalOutlet();
  const [licenses, setLicenses] = React.useState<PortalLicense[]>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    let cancelled = false;

    (async () => {
      setLoading(true);
      try {
        const items = await fetchPortalLicenses();
        if (!cancelled) setLicenses(items);
      } catch (err) {
        console.error("Fehler beim Laden der Lizenzen:", err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  const activeLicense: PortalLicense | null = React.useMemo(() => {
    if (!licenses.length) return null;
    return (
      licenses.find(
        (lic) => lic.status?.toLowerCase() === "active",
      ) ?? licenses[0]
    );
  }, [licenses]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <header className="space-y-1">
        <h1 className="text-xl font-semibold tracking-tight">
          Caisty POS installieren
        </h1>
        <p className="text-sm text-slate-300">
          Lade den Installer herunter, installiere Caisty POS auf
          deinem Kassen-PC und verbinde ihn mit deinem Konto{" "}
          <span className="font-medium">{customer.name}</span>.
        </p>
      </header>

      {/* 1. Installer herunterladen */}
      <section className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 md:p-6 space-y-4">
        <div className="flex items-center justify-between gap-2">
          <div>
            <h2 className="text-sm font-semibold text-slate-100">
              1. Installer herunterladen
            </h2>
            <p className="text-xs text-slate-400">
              Wähle das passende Paket für dein System. Die Links sind
              aktuell Platzhalter und können später auf deine echten
              Builds zeigen.
            </p>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-3 text-xs">
          {/* Windows */}
          <div className="rounded-xl border border-slate-800 bg-slate-950/70 p-4 space-y-3 flex flex-col">
            <div className="text-sm font-semibold text-slate-100">
              Windows
            </div>
            <p className="text-slate-400">
              Empfohlen für die meisten Kassen-PCs. Enthält POS-Client
              und Auto-Update.
            </p>
            <ul className="list-disc list-inside text-slate-400 space-y-1">
              <li>Unterstützt Windows 10 / 11</li>
              <li>Installer im Assistent-Stil</li>
              <li>Optimiert für Maus &amp; Touchscreen</li>
            </ul>
            <div className="mt-3">
              <Button
                asChild
                className="w-full justify-center text-xs font-medium"
              >
                {/* TODO: echten Download-Link hinterlegen */}
                <a href="#download-windows">
                  Caisty POS für Windows herunterladen
                </a>
              </Button>
            </div>
          </div>

          {/* Linux */}
          <div className="rounded-xl border border-slate-800 bg-slate-950/70 p-4 space-y-3 flex flex-col">
            <div className="text-sm font-semibold text-slate-100">
              Linux
            </div>
            <p className="text-slate-400">
              Für leichte Kassen-Boxen oder eigene Linux-Setups.
            </p>
            <ul className="list-disc list-inside text-slate-400 space-y-1">
              <li>AppImage / .deb als Paket</li>
              <li>Ideal für Mini-PCs</li>
              <li>Geringer Ressourcenverbrauch</li>
            </ul>
            <div className="mt-3">
              <Button
                asChild
                variant="outline"
                className="w-full justify-center text-xs font-medium"
              >
                <a href="#download-linux">Linux-Paket herunterladen</a>
              </Button>
            </div>
          </div>

          {/* Demo / Testsystem */}
          <div className="rounded-xl border border-slate-800 bg-slate-950/70 p-4 space-y-3 flex flex-col">
            <div className="text-sm font-semibold text-slate-100">
              Demo &amp; Test
            </div>
            <p className="text-slate-400">
              Zum Ausprobieren auf einem Test-PC oder Laptop – nutzt
              trotzdem deinen echten Lizenzschlüssel.
            </p>
            <ul className="list-disc list-inside text-slate-400 space-y-1">
              <li>Gleiche Version wie Produktion</li>
              <li>Ideal für Schulungen</li>
              <li>Kann später als Live-Kasse weiterlaufen</li>
            </ul>
            <div className="mt-3">
              <Button
                asChild
                variant="outline"
                className="w-full justify-center text-xs font-medium"
              >
                <a href="#download-demo">Demo-Installer anzeigen</a>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* 2. Lizenzschlüssel verbinden */}
      <section className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 md:p-6 space-y-4 text-xs">
        <h2 className="text-sm font-semibold text-slate-100">
          2. Lizenzschlüssel im POS hinterlegen
        </h2>
        <p className="text-slate-300">
          Nach der Installation startet Caisty POS in einem kurzen
          Einrichtungs-Assistenten. Dort gibst du deinen
          Lizenzschlüssel ein, damit der POS sich mit deinem Konto
          verbindet.
        </p>

        <div className="rounded-xl border border-slate-800 bg-slate-950/70 p-4 space-y-2">
          <div className="text-[11px] uppercase text-slate-500">
            Deine aktuelle Lizenz
          </div>
          {loading ? (
            <div className="space-y-2">
              <div className="h-3 w-40 rounded bg-slate-800 animate-pulse" />
              <div className="h-3 w-32 rounded bg-slate-800 animate-pulse" />
            </div>
          ) : !activeLicense ? (
            <p className="text-slate-400">
              In deinem Konto ist aktuell noch keine Lizenz hinterlegt.
              Sobald dir dein Anbieter einen Lizenzschlüssel zuweist,
              erscheint er hier.
            </p>
          ) : (
            <>
              <div className="font-mono text-[11px] text-slate-100 break-all">
                {activeLicense.key}
              </div>
              <div className="text-slate-300">
                Plan:{" "}
                <span className="font-medium capitalize">
                  {activeLicense.plan}
                </span>{" "}
                • Status:{" "}
                <span className="font-medium">
                  {activeLicense.status}
                </span>
              </div>
              <div className="text-slate-400">
                Gültig bis:{" "}
                {activeLicense.validUntil
                  ? formatDate(activeLicense.validUntil)
                  : "—"}
              </div>
            </>
          )}
          <p className="text-slate-400 pt-2">
            Du findest alle Lizenzschlüssel jederzeit auch unter{" "}
            <span className="font-semibold">„Lizenzen“</span> im
            Portal.
          </p>
        </div>

        <ol className="list-decimal list-inside space-y-1 text-slate-300">
          <li>Caisty POS starten.</li>
          <li>
            Im Lizenz-Dialog den oben angezeigten Schlüssel
            einfügen.
          </li>
          <li>
            Verbindung bestätigen – das Gerät taucht anschließend unter{" "}
            <span className="font-semibold">„Geräte“</span> im Portal
            auf.
          </li>
        </ol>
      </section>

      {/* 3. Erste Schritte */}
      <section className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 md:p-6 space-y-3 text-xs">
        <h2 className="text-sm font-semibold text-slate-100">
          3. Erste Schritte im Alltag
        </h2>
        <ul className="list-disc list-inside space-y-1 text-slate-300">
          <li>
            Testbon kassieren und prüfen, ob der Bondrucker korrekt
            arbeitet.
          </li>
          <li>
            In den{" "}
            <span className="font-semibold">Geräten</span> im Portal
            nachsehen, ob dein Kassen-PC als{" "}
            <span className="font-semibold">online</span> markiert ist.
          </li>
          <li>
            Sobald du echte Umsätze machst, erscheinen sie als
            Rechnungen im Bereich{" "}
            <span className="font-semibold">„Rechnungen“</span>.
          </li>
        </ul>
        <p className="text-[11px] text-slate-500">
          Später kommen hier noch detaillierte Handbücher, Video-Guides
          und Hardware-Tipps dazu.
        </p>
      </section>
    </div>
  );
};

export default PortalInstallPage;
