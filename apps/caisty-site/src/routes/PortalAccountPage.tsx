import React from "react";
import { fetchPortalMe, type PortalCustomer } from "../lib/portalApi";

const PortalAccountPage: React.FC = () => {
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

  return (
    <div className="space-y-4">
      <header className="space-y-1">
        <h1 className="text-xl font-semibold tracking-tight">Konto</h1>
        <p className="text-sm text-slate-300">
          Stammdaten, Kontaktinformationen und Sicherheitseinstellungen.
        </p>
      </header>

      <section className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 md:p-6 space-y-4">
        <div className="flex items-center justify-between gap-2">
          <div>
            <h2 className="text-sm font-semibold text-slate-100">
              Stammdaten
            </h2>
            <p className="text-xs text-slate-400">
              Basisinformationen deines Caisty Kontos.
            </p>
          </div>
          <span className="inline-flex items-center rounded-full border border-slate-700 px-3 py-1 text-[11px] text-slate-300">
            Erste Version – noch ohne Bearbeitung
          </span>
        </div>

        <div className="grid gap-4 md:grid-cols-2 text-xs">
          <Field label="Name" value={customer?.name} loading={loading} />
          <Field label="E-Mail" value={customer?.email} loading={loading} />
          <Field
            label="Kunden-ID"
            value={customer?.id}
            loading={loading}
            mono
          />
          <Field
            label="Organisation-ID"
            value={customer?.orgId}
            loading={loading}
            mono
          />
        </div>
      </section>

      <section className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 md:p-6 space-y-4">
        <div className="flex items-center justify-between gap-2">
          <div>
            <h2 className="text-sm font-semibold text-slate-100">
              Sicherheit
            </h2>
            <p className="text-xs text-slate-400">
              Zugangsdaten zu deinem Kundenportal.
            </p>
          </div>
        </div>

        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 text-xs">
          <div className="space-y-1 text-slate-300">
            <div className="text-[11px] uppercase text-slate-500">
              Passwort
            </div>
            <div>Dein Passwort wird verschlüsselt gespeichert.</div>
            <div className="text-[11px] text-slate-500">
              In einer späteren Version kannst du hier das Passwort ändern oder
              Zwei-Faktor-Authentifizierung aktivieren.
            </div>
          </div>
          <button
            type="button"
            className="self-start rounded-full border border-slate-700 px-4 py-2 text-xs font-medium text-slate-100 hover:bg-slate-800"
          >
            Passwort ändern (bald)
          </button>
        </div>
      </section>

      <section className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 md:p-6 space-y-3 text-[11px] text-slate-400">
        <h2 className="text-xs font-semibold text-slate-200">
          Daten &amp; Export
        </h2>
        <p>
          Du kannst jederzeit einen Export deiner bei Caisty gespeicherten
          Daten anfordern (z.&nbsp;B. für Datenschutz-Anfragen). In einer
          späteren Version kannst du das direkt hier im Portal auslösen.
        </p>
        <p>
          Bis dahin wende dich bitte an{" "}
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
  );
};

const Field: React.FC<{
  label: string;
  value?: string | null;
  loading?: boolean;
  mono?: boolean;
}> = ({ label, value, loading, mono }) => {
  const base =
    "mt-1 rounded-lg border border-slate-800 bg-slate-950/60 px-3 py-2 text-xs";
  const contentClass = mono
    ? "font-mono text-[11px] text-slate-200 break-all"
    : "text-slate-200";

  return (
    <div className="space-y-1">
      <div className="text-[11px] uppercase text-slate-500">{label}</div>
      <div className={base}>
        {loading ? (
          <div className="h-3 w-24 rounded-full bg-slate-800 animate-pulse" />
        ) : (
          <span className={contentClass}>{value ?? "—"}</span>
        )}
      </div>
    </div>
  );
};

export default PortalAccountPage;
