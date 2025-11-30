// apps/caisty-site/src/routes/PortalDashboard.tsx
import React from "react";
import { Link } from "react-router-dom";
import {
  fetchPortalLicenses,
  fetchPortalDevices,
  fetchPortalInvoices,
  type PortalLicense,
  type PortalInvoice,
  type PortalDevice,
} from "../lib/portalApi";
import { usePortalOutlet } from "./PortalLayout";

function formatDate(value: string | null | undefined): string {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleString("de-DE");
}

function formatAmount(currency: string | null | undefined, amount: number): string {
  try {
    return new Intl.NumberFormat("de-DE", {
      style: "currency",
      currency: currency || "EUR",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  } catch {
    return `${amount} ${currency ?? ""}`.trim();
  }
}

const PortalDashboard: React.FC = () => {
  const { customer } = usePortalOutlet();

  const [licenses, setLicenses] = React.useState<PortalLicense[]>([]);
  const [deviceCount, setDeviceCount] = React.useState(0);
  const [latestInvoice, setLatestInvoice] =
    React.useState<PortalInvoice | null>(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    let cancelled = false;

    (async () => {
      setLoading(true);
      try {
        const [lics, devs, invs] = await Promise.all([
          fetchPortalLicenses(),
          fetchPortalDevices(),
          fetchPortalInvoices(),
        ]);

        if (cancelled) return;

        setLicenses(lics);

        // Geräte nach Hardware-ID (deviceId / fingerprint / id) gruppieren
        const uniqueDeviceIds = new Set<string>();
        (devs as PortalDevice[]).forEach((d) => {
          const key =
            (d as any).deviceId || // neues Feld aus /portal/devices
            (d as any).fingerprint ||
            d.id;
          if (key) uniqueDeviceIds.add(key);
        });
        setDeviceCount(uniqueDeviceIds.size);

        const sorted = [...invs].sort(
          (a, b) =>
            new Date(b.createdAt).getTime() -
            new Date(a.createdAt).getTime(),
        );
        setLatestInvoice(sorted[0] ?? null);
      } catch (err) {
        console.error("Fehler beim Laden des Portal-Dashboards:", err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  // aktivste / wichtigste Lizenz (zuerst "active", dann mit spätestem validUntil)
  const activeLicense: PortalLicense | null = React.useMemo(() => {
    if (!licenses.length) return null;

    const actives = licenses.filter(
      (l) => (l.status ?? "").toLowerCase() === "active",
    );

    const pool = actives.length ? actives : licenses;
    const sorted = [...pool].sort((a, b) => {
      const ta = a.validUntil ? new Date(a.validUntil).getTime() : 0;
      const tb = b.validUntil ? new Date(b.validUntil).getTime() : 0;
      return tb - ta;
    });

    return sorted[0] ?? null;
  }, [licenses]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">
          Willkommen, {customer.name}
        </h1>
        <p className="text-sm text-slate-300">
          Überblick über dein Caisty Konto – Lizenzen, Geräte und Rechnungen.
        </p>
      </header>

      {/* KPI-Row */}
      <div className="grid gap-4 md:grid-cols-3">
        {/* Aktive Lizenz */}
        <section className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4 space-y-3">
          <div className="text-xs font-semibold text-slate-300">
            Aktive Lizenz
          </div>

          {loading ? (
            <div className="space-y-2">
              <div className="h-4 w-40 rounded bg-slate-800 animate-pulse" />
              <div className="h-3 w-24 rounded bg-slate-800 animate-pulse" />
              <div className="h-3 w-32 rounded bg-slate-800 animate-pulse" />
            </div>
          ) : !activeLicense ? (
            <p className="text-xs text-slate-400">
              Aktuell ist in deinem Konto noch keine Lizenz hinterlegt.
              Sobald dir dein Anbieter einen Lizenzschlüssel zuweist,
              erscheint er hier.
            </p>
          ) : (
            <div className="space-y-2">
              <div className="font-mono text-[11px] text-slate-100 break-all">
                {activeLicense.key}
              </div>
              <div className="text-xs text-slate-300">
                Plan:{" "}
                <span className="font-medium capitalize">
                  {activeLicense.plan}
                </span>
              </div>
              <div className="flex items-center gap-2 text-xs">
                <span className="text-slate-300">Status:</span>
                <span className="inline-flex items-center rounded-full border border-emerald-500/60 bg-emerald-500/10 px-2.5 py-0.5 text-[11px] text-emerald-300 font-medium">
                  {activeLicense.status}
                </span>
              </div>
              <div className="text-xs text-slate-400">
                Gültig bis:{" "}
                {activeLicense.validUntil
                  ? formatDate(activeLicense.validUntil)
                  : "—"}
              </div>
            </div>
          )}
        </section>

        {/* Verbundene Geräte */}
        <section className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4 flex flex-col justify-between">
          <div className="space-y-3">
            <div className="text-xs font-semibold text-slate-300">
              Verbundene Geräte
            </div>

            {loading ? (
              <div className="h-8 w-12 rounded bg-slate-800 animate-pulse" />
            ) : (
              <div className="text-3xl font-semibold text-emerald-400">
                {deviceCount}
              </div>
            )}

            <p className="text-xs text-slate-400">
              Alle POS-Geräte, die aktuell mit deinen Lizenzen verbunden
              sind (nach Hardware-ID gruppiert).
            </p>
          </div>

          <div className="mt-3 text-xs">
            <Link
              to="/portal/devices"
              className="text-emerald-300 hover:text-emerald-200"
            >
              Geräte ansehen →
            </Link>
          </div>
        </section>

        {/* Letzte Rechnung */}
        <section className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4 flex flex-col justify-between">
          <div className="space-y-3">
            <div className="text-xs font-semibold text-slate-300">
              Letzte Rechnung
            </div>

            {loading ? (
              <div className="space-y-2">
                <div className="h-3 w-32 rounded bg-slate-800 animate-pulse" />
                <div className="h-3 w-24 rounded bg-slate-800 animate-pulse" />
                <div className="h-3 w-28 rounded bg-slate-800 animate-pulse" />
              </div>
            ) : !latestInvoice ? (
              <p className="text-xs text-slate-400">
                Noch keine Rechnungen für dieses Konto.
              </p>
            ) : (
              <div className="space-y-1 text-xs text-slate-300">
                <div className="font-mono text-[11px] text-slate-100">
                  {latestInvoice.number}
                </div>
                <div>
                  Betrag:{" "}
                  <span className="font-medium">
                    {formatAmount(
                      latestInvoice.currency,
                      latestInvoice.amountCents ? latestInvoice.amountCents / 100 : 0,
                    )}
                  </span>
                </div>
                <div>
                  Status:{" "}
                  <span className="font-medium">
                    {latestInvoice.status}
                  </span>
                </div>
                <div className="text-slate-400">
                  Erstellt am: {formatDate(latestInvoice.createdAt)}
                </div>
              </div>
            )}
          </div>

          <div className="mt-3 text-xs">
            <Link
              to="/portal/invoices"
              className="text-emerald-300 hover:text-emerald-200"
            >
              Rechnungen öffnen →
            </Link>
          </div>
        </section>
      </div>

      {/* Zweite Zeile: Kurzübersicht + Nächste Schritte */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Lizenzen-Kurzübersicht */}
        <section className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4 space-y-3">
          <div className="flex items-center justify-between gap-2">
            <div>
              <h2 className="text-sm font-semibold text-slate-100">
                Lizenzen (Kurzübersicht)
              </h2>
              <p className="text-xs text-slate-400">
                Schnellüberblick über deine Lizenzschlüssel.
              </p>
            </div>
            {licenses.length > 0 && (
              <Link
                to="/portal/licenses"
                className="text-[11px] text-emerald-300 hover:text-emerald-200"
              >
                Alle anzeigen →
              </Link>
            )}
          </div>

          {loading ? (
            <div className="space-y-2 pt-2">
              <div className="h-4 w-full rounded bg-slate-800 animate-pulse" />
              <div className="h-4 w-4/5 rounded bg-slate-800 animate-pulse" />
            </div>
          ) : licenses.length === 0 ? (
            <p className="text-xs text-slate-400">
              Noch keine Lizenzen im Portal sichtbar. Sobald dir dein
              Anbieter eine Lizenz zuweist, erscheint sie hier.
            </p>
          ) : (
            <div className="space-y-2 text-xs">
              {licenses.slice(0, 3).map((lic) => (
                <div
                  key={lic.id}
                  className="rounded-xl border border-slate-800 bg-slate-950/70 px-3 py-2 flex items-center justify-between gap-2"
                >
                  <div>
                    <div className="font-mono text-[11px] text-slate-100 break-all">
                      {lic.key}
                    </div>
                    <div className="text-[11px] text-slate-400">
                      {lic.plan} • gültig bis{" "}
                      {lic.validUntil
                        ? formatDate(lic.validUntil)
                        : "—"}
                    </div>
                  </div>
                  <span className="inline-flex items-center rounded-full border border-emerald-500/60 bg-emerald-500/10 px-2 py-0.5 text-[11px] text-emerald-300">
                    {lic.status}
                  </span>
                </div>
              ))}
              {licenses.length > 3 && (
                <div className="text-[11px] text-slate-400">
                  + {licenses.length - 3} weitere Lizenz(en)
                </div>
              )}
            </div>
          )}
        </section>

        {/* Nächste Schritte */}
        <section className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4 space-y-3">
          <h2 className="text-sm font-semibold text-slate-100">
            Nächste Schritte
          </h2>
          <ol className="space-y-2 text-xs text-slate-300 list-decimal list-inside">
            <li>
              <Link
                to="/portal/install"
                className="text-emerald-300 hover:text-emerald-200 font-medium"
              >
                Caisty POS installieren
              </Link>{" "}
              und mit deinem Lizenzschlüssel verbinden.
            </li>
            <li>
              In der Ansicht{" "}
              <Link
                to="/portal/devices"
                className="text-emerald-300 hover:text-emerald-200"
              >
                Geräte
              </Link>{" "}
              prüfen, ob dein Kassen-PC online ist.
            </li>
            <li>
              Sobald Abrechnungen erstellt werden, erscheinen sie unter{" "}
              <Link
                to="/portal/invoices"
                className="text-emerald-300 hover:text-emerald-200"
              >
                Rechnungen
              </Link>
              .
            </li>
          </ol>
          <p className="text-[11px] text-slate-500 mt-2">
            In späteren Versionen kommen hier Live-KPIs und letzte
            Aktivitäten dazu.
          </p>
        </section>
      </div>
    </div>
  );
};

export default PortalDashboard;
