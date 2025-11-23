import React from "react";
import { Link } from "react-router-dom";
import { fetchPortalMe, type PortalCustomer } from "../lib/portalApi";

const PortalDashboard: React.FC = () => {
  const [customer, setCustomer] = React.useState<PortalCustomer | null>(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    let cancelled = false;

    (async () => {
      setLoading(true);
      const me = await fetchPortalMe();
      if (cancelled) return;
      setCustomer(me);
      setLoading(false);
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  const name = customer?.name ?? "dein Konto";

  return (
    <div className="space-y-8">
      {/* Titel */}
      <div className="space-y-2">
        <div className="text-[11px] tracking-[0.25em] text-emerald-400 uppercase">
          Kundenportal
        </div>
        <h1 className="text-2xl md:text-3xl font-semibold tracking-tight">
          Willkommen, {name.split(" ")[0] ?? name}
        </h1>
        <p className="text-sm text-slate-300 max-w-2xl">
          Hier verwaltest du dein Caisty Konto. In dieser ersten Version siehst
          du deine Basisdaten und die nächsten Schritte. Später kommen hier
          noch deine Rechnungen, Lizenzen und Downloads dazu.
        </p>
      </div>

      {/* Grid: Account + Next steps */}
      <div className="grid gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(0,1.3fr)]">
        {/* Kontoinformationen */}
        <section className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 md:p-6 space-y-4">
          <div className="flex items-center justify-between gap-2">
            <div>
              <h2 className="text-sm font-semibold text-slate-100">
                Kontoinformationen
              </h2>
              <p className="text-xs text-slate-400">
                Stammdaten deines Kundenkontos.
              </p>
            </div>
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 border border-emerald-500/40 px-3 py-1 text-[11px] text-emerald-300">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
              {customer?.portalStatus === "active"
                ? "Konto aktiv"
                : "Status unbekannt"}
            </span>
          </div>

          <div className="grid gap-4 md:grid-cols-2 text-xs">
            <div className="space-y-1">
              <div className="text-[11px] uppercase text-slate-500">Name</div>
              <div className="font-medium text-slate-100">
                {loading ? "…" : customer?.name ?? "—"}
              </div>
            </div>

            <div className="space-y-1">
              <div className="text-[11px] uppercase text-slate-500">E-Mail</div>
              <div className="font-medium text-slate-100 break-all">
                {loading ? "…" : customer?.email ?? "—"}
              </div>
            </div>

            <div className="space-y-1">
              <div className="text-[11px] uppercase text-slate-500">
                Kunden-ID
              </div>
              <div className="font-mono text-[11px] text-slate-300 break-all">
                {loading ? "…" : customer?.id ?? "—"}
              </div>
            </div>

            <div className="space-y-1">
              <div className="text-[11px] uppercase text-slate-500">
                Organisation-ID
              </div>
              <div className="font-mono text-[11px] text-slate-300 break-all">
                {loading ? "…" : customer?.orgId ?? "—"}
              </div>
            </div>
          </div>
        </section>

        {/* Nächste Schritte */}
        <section className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 md:p-6 space-y-4">
          <div className="flex items-center justify-between gap-2">
            <div>
              <h2 className="text-sm font-semibold text-slate-100">
                Nächste Schritte
              </h2>
              <p className="text-xs text-slate-400">
                So verbindest du Caisty POS mit deinem Konto.
              </p>
            </div>
          </div>

          <ol className="space-y-3 text-xs text-slate-300">
            <StepChip
              num={1}
              title="Caisty POS installieren"
              text="Lade die Desktop-App herunter und installiere sie auf deinem Kassen-PC."
            />
            <StepChip
              num={2}
              title="Lizenzschlüssel eintragen"
              text="Verwende den License-Key, den du von deinem Anbieter oder aus der Admin-Konsole erhalten hast."
            />
            <StepChip
              num={3}
              title="Erste Verkäufe buchen"
              text="Sobald das POS mit der Cloud verbunden ist, erscheinen hier mehr Details zu Lizenzen, Geräten und Umsätzen."
            />
          </ol>
        </section>
      </div>

      {/* POS & Lizenzen + Schnellzugriff */}
      <div className="grid gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(0,1.3fr)]">
        {/* POS & Lizenzen Übersicht */}
        <section className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 md:p-6 space-y-4">
          <div className="flex items-center justify-between gap-2">
            <div>
              <h2 className="text-sm font-semibold text-slate-100">
                POS &amp; Lizenzen
              </h2>
              <p className="text-xs text-slate-400">
                Kurzer Überblick über deine Caisty Nutzung.
              </p>
            </div>
            <span className="text-[11px] rounded-full border border-slate-700 px-3 py-1 text-slate-300">
              Erste Version
            </span>
          </div>

          <div className="grid gap-4 md:grid-cols-3 text-xs">
            <StatCard
              label="Lizenzen"
              value="0"
              description="Deine aktiven Lizenzschlüssel werden hier angezeigt."
            />
            <StatCard
              label="Geräte"
              value="0"
              description="Sobald Geräte gebunden sind, siehst du sie hier."
            />
            <StatCard
              label="Rechnungen"
              value="0"
              description="Deine Rechnungen werden in einer späteren Version sichtbar."
            />
          </div>

          <p className="mt-2 text-[11px] text-slate-500">
            Hinweis: Du hast bereits eine License in der Admin-Konsole. In einem
            nächsten Schritt verbinden wir diese Ansicht direkt mit deinen
            Lizenzen und Rechnungen.
          </p>
        </section>

        {/* Schnellzugriff */}
        <section className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 md:p-6 space-y-4">
          <div>
            <h2 className="text-sm font-semibold text-slate-100">
              Schnellzugriff
            </h2>
            <p className="text-xs text-slate-400">
              Wichtige Aktionen rund um dein Caisty Konto.
            </p>
          </div>

          {/* Haupt-Call-to-Action */}
          <button
            type="button"
            className="w-full rounded-full bg-emerald-500 text-slate-950 text-sm font-medium py-2.5 hover:bg-emerald-400 transition-colors"
          >
            Caisty POS Download (bald)
          </button>

          <div className="space-y-2 text-xs">
            <QuickLink
              to="/portal/licenses"
              title="Meine Lizenzen"
              text="Alle Lizenzschlüssel einsehen, Laufzeiten prüfen."
            />
            <QuickLink
              to="/portal/invoices"
              title="Rechnungen"
              text="Übersicht deiner Rechnungen &amp; Zahlungen."
            />
            <QuickLink
              to="/portal/devices"
              title="Verbundene Geräte"
              text="Welche POS-Geräte aktuell mit deinem Konto verbunden sind."
            />
          </div>

          <div className="pt-2 border-t border-slate-800 text-[11px] text-slate-500">
            <div className="font-medium text-slate-300 mb-1">Support</div>
            <p>
              Fragen zu deinem Konto oder zur Lizenz? Schreib uns eine kurze
              Nachricht – wir helfen dir gern weiter.
            </p>
            <p className="mt-1">
              E-Mail:{" "}
              <a
                href="mailto:support@caisty.local"
                className="text-emerald-300 hover:text-emerald-200"
              >
                support@caisty.local
              </a>
            </p>
          </div>
        </section>
      </div>
    </div>
  );
};

const StepChip: React.FC<{
  num: number;
  title: string;
  text: string;
}> = ({ num, title, text }) => {
  return (
    <li className="flex items-start gap-3">
      <span className="mt-[2px] flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500 text-slate-950 text-[11px] font-bold">
        {num}
      </span>
      <div className="space-y-0.5">
        <div className="font-medium text-slate-100 text-xs">{title}</div>
        <p className="text-[11px] text-slate-400">{text}</p>
      </div>
    </li>
  );
};

const StatCard: React.FC<{
  label: string;
  value: string;
  description: string;
}> = ({ label, value, description }) => (
  <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-4 space-y-2">
    <div className="text-[11px] uppercase text-slate-500">{label}</div>
    <div className="text-2xl font-semibold text-emerald-400">{value}</div>
    <p className="text-[11px] text-slate-400">{description}</p>
  </div>
);

const QuickLink: React.FC<{
  to: string;
  title: string;
  text: string;
}> = ({ to, title, text }) => (
  <Link
    to={to}
    className="flex items-center justify-between rounded-xl border border-slate-800 bg-slate-950/60 px-3 py-2 hover:border-emerald-500/60 hover:bg-slate-900/80 transition-colors"
  >
    <div className="space-y-0.5">
      <div className="text-xs font-medium text-slate-100">{title}</div>
      <p className="text-[11px] text-slate-400">{text}</p>
    </div>
    <span className="text-xs text-slate-500">›</span>
  </Link>
);

export default PortalDashboard;
