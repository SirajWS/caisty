// apps/caisty-site/src/routes/PortalDashboard.tsx
import React from "react";
import { usePortalCustomer } from "./PortalLayout";
import {
  fetchPortalLicenses,
  fetchPortalDevices,
  fetchPortalInvoices,
  type PortalLicense,
  type PortalDevice,
  type PortalInvoice,
} from "../lib/portalApi";

const PortalDashboard: React.FC = () => {
  const customer = usePortalCustomer();

  const [licenses, setLicenses] = React.useState<PortalLicense[]>([]);
  const [devices, setDevices] = React.useState<PortalDevice[]>([]);
  const [invoices, setInvoices] = React.useState<PortalInvoice[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        setLoading(true);
        setError(null);

        const [lics, devs, invs] = await Promise.all([
          fetchPortalLicenses().catch(() => []),
          fetchPortalDevices().catch(() => []),
          fetchPortalInvoices().catch(() => []),
        ]);

        if (cancelled) return;

        setLicenses(lics);
        setDevices(devs);
        setInvoices(invs);
      } catch (err) {
        if (cancelled) return;
        console.error(err);
        setError("Daten konnten nicht geladen werden.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  const activeLicense =
    licenses.find((l) => String(l.status).toLowerCase() === "active") ??
    licenses[0] ??
    null;

  const deviceCount = devices.length;
  const lastInvoice = invoices[0] ?? null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <header className="space-y-1">
        <h1 className="text-xl font-semibold tracking-tight">
          Willkommen, {customer.name}
        </h1>
        <p className="text-sm text-slate-300">
          Überblick über dein Caisty Konto – Lizenzen, Geräte und Rechnungen.
        </p>
      </header>

      {/* Hinweis / Error */}
      {error && (
        <div className="rounded-2xl border border-rose-500/50 bg-rose-500/10 px-4 py-3 text-xs text-rose-100">
          {error}
        </div>
      )}

      {/* KPI-Row */}
      <section className="grid gap-4 md:grid-cols-3">
        <DashboardCard title="Aktive Lizenz">
          {loading ? (
            <SkeletonLines />
          ) : activeLicense ? (
            <div className="space-y-2 text-sm">
              <div className="font-mono text-[11px] text-slate-200 break-all">
                {activeLicense.key}
              </div>
              <div className="flex items-center justify-between text-xs text-slate-300">
                <span className="capitalize">{activeLicense.plan}</span>
                <StatusPill status={activeLicense.status} />
              </div>
              <div className="text-[11px] text-slate-400">
                gültig bis{" "}
                {activeLicense.validUntil
                  ? formatDateTime(activeLicense.validUntil)
                  : "—"}
              </div>
            </div>
          ) : (
            <EmptyHint text="Noch keine Lizenz im Portal sichtbar." />
          )}
        </DashboardCard>

        <DashboardCard title="Verbundene Geräte">
          {loading ? (
            <SkeletonLines />
          ) : (
            <div className="space-y-2">
              <div className="text-3xl font-semibold text-emerald-400">
                {deviceCount}
              </div>
              <p className="text-xs text-slate-400">
                Alle POS-Geräte, die aktuell mit deinen Lizenzen verbunden
                sind.
              </p>
            </div>
          )}
        </DashboardCard>

        <DashboardCard title="Letzte Rechnung">
          {loading ? (
            <SkeletonLines />
          ) : lastInvoice ? (
            <div className="space-y-2 text-sm">
              <div className="flex items-center justify-between">
                <span className="font-mono text-[11px] text-slate-200">
                  {lastInvoice.number}
                </span>
                <InvoiceStatusBadge status={lastInvoice.status} />
              </div>
              <div className="text-slate-200">
                {formatAmount(lastInvoice.amount, lastInvoice.currency)}
              </div>
              <div className="text-[11px] text-slate-400">
                erstellt am {formatDate(lastInvoice.createdAt)}
              </div>
            </div>
          ) : (
            <EmptyHint text="Noch keine Rechnungen für dieses Konto." />
          )}
        </DashboardCard>
      </section>

      {/* Detail-Row: Kurzlisten */}
      <section className="grid gap-4 md:grid-cols-2">
        {/* Lizenzen-Preview */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4 space-y-3">
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-slate-100">
              Lizenzen (Kurzüberblick)
            </span>
            <a
              href="/portal/licenses"
              className="text-emerald-300 hover:text-emerald-200"
            >
              Alle anzeigen
            </a>
          </div>
          {loading ? (
            <SkeletonTableRows />
          ) : licenses.length === 0 ? (
            <EmptyHint text="Keine Lizenzen gefunden." />
          ) : (
            <ul className="space-y-2 text-xs">
              {licenses.slice(0, 3).map((lic) => (
                <li
                  key={lic.id}
                  className="flex items-center justify-between rounded-lg border border-slate-800 bg-slate-950/60 px-3 py-2"
                >
                  <div className="min-w-0">
                    <div className="font-mono text-[11px] text-slate-200 truncate max-w-[220px]">
                      {lic.key}
                    </div>
                    <div className="text-[11px] text-slate-400 capitalize">
                      {lic.plan}
                    </div>
                  </div>
                  <StatusPill status={lic.status} />
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Geräte/Rechnungen-Hinweis */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4 space-y-3">
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-slate-100">
              Nächste Schritte
            </span>
          </div>
          <ol className="space-y-2 text-xs text-slate-300 list-decimal list-inside">
            <li>
              <span className="font-medium text-slate-100">
                Caisty POS installieren
              </span>{" "}
              und mit deinem Lizenzschlüssel verbinden.
            </li>
            <li>
              In der Ansicht{" "}
              <a
                href="/portal/devices"
                className="text-emerald-300 hover:text-emerald-200"
              >
                Geräte
              </a>{" "}
              prüfen, ob dein Kassen-PC online ist.
            </li>
            <li>
              Sobald Abrechnungen erstellt werden, erscheinen sie unter{" "}
              <a
                href="/portal/invoices"
                className="text-emerald-300 hover:text-emerald-200"
              >
                Rechnungen
              </a>
              .
            </li>
          </ol>
        </div>
      </section>
    </div>
  );
};

export default PortalDashboard;

// ---------------------------------------------------------------------------
// Hilfs-Komponenten
// ---------------------------------------------------------------------------

const DashboardCard: React.FC<{
  title: string;
  children: React.ReactNode;
}> = ({ title, children }) => {
  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4 space-y-2">
      <div className="text-xs font-semibold text-slate-200">{title}</div>
      {children}
    </div>
  );
};

const SkeletonLines: React.FC = () => (
  <div className="space-y-2">
    <div className="h-3 w-32 rounded-full bg-slate-800 animate-pulse" />
    <div className="h-3 w-24 rounded-full bg-slate-800 animate-pulse" />
    <div className="h-3 w-20 rounded-full bg-slate-800 animate-pulse" />
  </div>
);

const SkeletonTableRows: React.FC = () => (
  <div className="space-y-2">
    <div className="h-9 rounded-lg bg-slate-900 animate-pulse" />
    <div className="h-9 rounded-lg bg-slate-900 animate-pulse" />
    <div className="h-9 rounded-lg bg-slate-900 animate-pulse" />
  </div>
);

const EmptyHint: React.FC<{ text: string }> = ({ text }) => (
  <p className="text-xs text-slate-400">{text}</p>
);

const StatusPill: React.FC<{ status: string }> = ({ status }) => {
  const normalized = status.toLowerCase();
  let classes =
    "inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] border ";

  if (normalized === "active") {
    classes +=
      "border-emerald-500/60 bg-emerald-500/10 text-emerald-300 font-medium";
  } else if (normalized === "revoked" || normalized === "expired") {
    classes +=
      "border-rose-500/60 bg-rose-500/10 text-rose-300 font-medium";
  } else {
    classes += "border-slate-600 bg-slate-800 text-slate-300";
  }

  return <span className={classes}>{status}</span>;
};

const InvoiceStatusBadge: React.FC<{ status: string }> = ({ status }) => {
  const normalized = status.toLowerCase();
  let classes =
    "inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] border ";

  if (normalized === "paid") {
    classes +=
      "border-emerald-500/60 bg-emerald-500/10 text-emerald-300 font-medium";
  } else if (normalized === "open") {
    classes +=
      "border-amber-500/60 bg-amber-500/10 text-amber-300 font-medium";
  } else if (normalized === "failed") {
    classes +=
      "border-rose-500/60 bg-rose-500/10 text-rose-300 font-medium";
  } else {
    classes += "border-slate-600 bg-slate-800 text-slate-300";
  }

  return <span className={classes}>{status}</span>;
};

// ---------------------------------------------------------------------------
// Format-Helper
// ---------------------------------------------------------------------------

function formatDate(value: string): string {
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleDateString();
}

function formatDateTime(value: string): string {
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleString();
}

function formatAmount(amount: number, currency: string): string {
  if (!Number.isFinite(amount)) return "—";
  try {
    return new Intl.NumberFormat("de-DE", {
      style: "currency",
      currency: currency || "EUR",
      minimumFractionDigits: 2,
    }).format(amount);
  } catch {
    return `${amount.toFixed(2)} ${currency}`;
  }
}
