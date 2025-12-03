// apps/caisty-site/src/routes/PortalPlanBillingPage.tsx
import React from "react";
import { Link } from "react-router-dom";
import {
  createTrialLicense,
  fetchPortalLicenses,
  type PortalLicense,
} from "../lib/portalApi";
import { usePortalOutlet } from "./PortalLayout";
import { PRICING, TRIAL_DAYS, formatPrice } from "../config/pricing";
import { useCurrency } from "../lib/useCurrency";

function formatDate(value: string | null | undefined): string {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString("de-DE");
}

const PortalPlanBillingPage: React.FC = () => {
  const { customer } = usePortalOutlet();
  const { currency } = useCurrency();

  const [licenses, setLicenses] = React.useState<PortalLicense[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [busyTrial, setBusyTrial] = React.useState(false);
  const [busyPlan, setBusyPlan] = React.useState<"starter" | "pro" | null>(
    null,
  );
  const [error, setError] = React.useState<string | null>(null);

  const starterPrice = PRICING[currency].starter.monthly;
  const proPrice = PRICING[currency].pro.monthly;
  const currencySymbol = currency === "EUR" ? "€" : "TND";

  React.useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setLoading(true);
        setError(null);
        const lics = await fetchPortalLicenses();
        if (!cancelled) setLicenses(lics);
      } catch (err: any) {
        console.error("load licenses failed", err);
        if (!cancelled) {
          setError(
            err?.message ?? "Lizenzen konnten nicht geladen werden.",
          );
        }
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

  const hasTrialLicense = React.useMemo(
    () => licenses.some((l) => l.plan === "trial"),
    [licenses],
  );

  async function handleCreateTrial() {
    try {
      setError(null);
      setBusyTrial(true);
      const lic = await createTrialLicense();
      setLicenses((prev) => [lic, ...prev]);
    } catch (err: any) {
      console.error("create trial failed", err);
      setError(err?.message ?? "Testlizenz konnte nicht erstellt werden.");
    } finally {
      setBusyTrial(false);
    }
  }

  async function handleUpgradePlan(plan: "starter" | "pro") {
    try {
      setError(null);
      setBusyPlan(plan);
      
      // Weiterleitung zur Checkout-Seite mit Plan-Parameter
      window.location.href = `/portal/checkout?plan=${plan}`;
    } catch (err: any) {
      console.error("upgrade failed", err);
      setError(err?.message ?? "Upgrade konnte nicht gestartet werden.");
    } finally {
      setBusyPlan(null);
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">
          Plan &amp; Abrechnung
        </h1>
        <p className="text-sm text-slate-300">
          Hier siehst du deinen aktuellen Plan, die wichtigsten Details zu
          deiner Lizenz und eine Vorschau der verfügbaren Pakete.
        </p>
      </header>

      {error && (
        <div className="rounded-xl border border-red-700 bg-red-900/40 px-3 py-2 text-xs text-red-100">
          {error}
        </div>
      )}

      {/* Aktueller Plan */}
      <section className="flex flex-col gap-4 rounded-2xl border border-slate-800 bg-slate-900/60 p-4 md:flex-row md:items-start md:justify-between">
        <div className="space-y-2">
          <div className="text-xs font-semibold text-emerald-300">
            DEIN AKTUELLER PLAN
          </div>

          {loading ? (
            <div className="space-y-2">
              <div className="h-4 w-40 rounded bg-slate-800 animate-pulse" />
              <div className="h-3 w-24 rounded bg-slate-800 animate-pulse" />
            </div>
          ) : !activeLicense ? (
            <div className="text-xs text-slate-200">
              Noch keine aktive Lizenz. Du kannst{" "}
              <span className="font-medium">unten eine Testlizenz</span>{" "}
              starten oder später einen bezahlten Plan wählen.
            </div>
          ) : (
            <>
              <div className="flex items-center gap-2 text-sm font-semibold text-slate-50">
                {activeLicense.plan === "trial"
                  ? "Trial"
                  : activeLicense.plan === "starter"
                    ? "Starter"
                    : "Pro"}
                <span className="inline-flex items-center rounded-full border border-emerald-500/60 bg-emerald-500/10 px-2 py-0.5 text-[11px] font-medium text-emerald-300">
                  aktiv
                </span>
              </div>
              <div className="text-xs text-slate-300">
                Lizenzschlüssel:{" "}
                <span className="font-mono text-[11px]">
                  {activeLicense.key}
                </span>
              </div>
              <div className="text-xs text-slate-400">
                Gültig bis: {formatDate(activeLicense.validUntil)}
              </div>
            </>
          )}
        </div>

        <div className="mt-2 space-y-1 text-xs text-right text-slate-400 md:mt-0">
          <div>Konto-Inhaber: {customer.name}</div>
          {activeLicense && (
            <div>
              Aktiver Lizenzschlüssel:{" "}
              <span className="font-mono text-[11px]">
                {activeLicense.key}
              </span>
            </div>
          )}
          <div className="text-[11px] text-slate-500">
            Zahlungsweise für Starter/Pro wird später direkt im Portal
            verfügbar.
          </div>
        </div>
      </section>

      {/* Karten: Trial / Starter / Pro */}
      <section className="space-y-4">
        <h2 className="text-sm font-semibold text-slate-100">
          Pläne &amp; Lizenzen im Überblick
        </h2>

        <div className="grid gap-4 md:grid-cols-3">
          {/* Trial */}
          <div className="flex flex-col justify-between rounded-2xl border border-slate-800 bg-slate-950/60 p-4">
            <div className="space-y-2">
              <div className="text-sm font-semibold text-slate-50">
                Trial
              </div>
              <p className="text-xs text-slate-400">
                Zum Testen vor Ort, ohne Zahlungsdaten. Funktional identisch
                mit Starter (1 Gerät), aber zeitlich begrenzt.
              </p>
              <div className="mt-2 text-2xl font-semibold text-emerald-400">
                0&nbsp;{currencySymbol}
                <span className="text-xs font-normal text-slate-400">
                  &nbsp;für {TRIAL_DAYS} Tage
                </span>
              </div>
              <div className="mt-1 text-xs text-slate-400">
                1 aktives POS-Gerät · keine Zahlungsdaten nötig.
              </div>
            </div>

            <div className="mt-4">
              <button
                type="button"
                onClick={handleCreateTrial}
                disabled={busyTrial || hasTrialLicense}
                className="inline-flex w-full items-center justify-center rounded-full bg-emerald-500 px-4 py-2 text-xs font-semibold text-slate-950 hover:bg-emerald-400 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {hasTrialLicense
                  ? "Testlizenz bereits genutzt"
                  : busyTrial
                    ? "Testlizenz wird angelegt…"
                    : "Testlizenz starten"}
              </button>
              <p className="mt-2 text-[11px] text-slate-500">
                Für jedes Konto kann nur eine Testlizenz angelegt werden.
              </p>
            </div>
          </div>

          {/* Starter */}
          <div className="flex flex-col justify-between rounded-2xl border border-slate-800 bg-slate-950/60 p-4">
            <div className="space-y-2">
              <div className="text-sm font-semibold text-slate-50">
                Starter
              </div>
              <p className="text-xs text-slate-400">
                Ideal für eine Filiale oder einen Standort. Lizenzverwaltung im
                Kundenportal, Basis-Statistiken &amp; Export-Grundfunktionen.
              </p>
              <div className="mt-2 text-2xl font-semibold text-emerald-400">
                {formatPrice(starterPrice, currency)}
                <span className="text-xs font-normal text-slate-400">
                  &nbsp;pro Monat
                </span>
              </div>
            </div>

            <div className="mt-4">
              <button
                type="button"
                onClick={() => handleUpgradePlan("starter")}
                disabled={busyPlan === "starter"}
                className="inline-flex w-full items-center justify-center rounded-full bg-emerald-500 px-4 py-2 text-xs font-semibold text-slate-950 hover:bg-emerald-400 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {busyPlan === "starter"
                  ? "Weiterleitung zu PayPal…"
                  : "Plan wählen"}
              </button>
              <p className="mt-2 text-[11px] text-slate-500">
                Self-Service-Kauf direkt hier im Portal. Abrechnung über
                PayPal-Sandbox für Tests.
              </p>
            </div>
          </div>

          {/* Pro */}
          <div className="flex flex-col justify-between rounded-2xl border border-slate-800 bg-slate-950/60 p-4">
            <div className="space-y-2">
              <div className="text-sm font-semibold text-slate-50">
                Pro
              </div>
              <p className="text-xs text-slate-400">
                Für Betriebe mit mehreren Kassen oder kleinen Filialketten.
                Mehrere Geräte unter einer Lizenz, erweiterte Auswertungen
                (geplant), priorisierter Support.
              </p>
              <div className="mt-2 text-2xl font-semibold text-emerald-400">
                {formatPrice(proPrice, currency)}
                <span className="text-xs font-normal text-slate-400">
                  &nbsp;pro Monat
                </span>
              </div>
            </div>

            <div className="mt-4">
              <button
                type="button"
                onClick={() => handleUpgradePlan("pro")}
                disabled={busyPlan === "pro"}
                className="inline-flex w-full items-center justify-center rounded-full bg-emerald-500 px-4 py-2 text-xs font-semibold text-slate-950 hover:bg-emerald-400 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {busyPlan === "pro"
                  ? "Weiterleitung zu PayPal…"
                  : "Plan wählen"}
              </button>
              <p className="mt-2 text-[11px] text-slate-500">
                Self-Service-Kauf direkt hier im Portal. Abrechnung über
                PayPal-Sandbox für Tests.
              </p>
            </div>
          </div>
        </div>

        <p className="text-[11px] text-slate-500">
          Die folgenden Informationen orientieren sich an der aktuellen
          Preisliste. Alle Preise verstehen sich zzgl. MwSt.
        </p>
      </section>

      <section className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4 text-xs text-slate-300">
        Die eigentliche Abrechnung und Rechnungsdokumente findest du unter{" "}
        <Link
          to="/portal/invoices"
          className="text-emerald-300 hover:text-emerald-200"
        >
          Rechnungen
        </Link>
        . In dieser Version können Rechnungen noch manuell erzeugt werden.
      </section>
    </div>
  );
};

export default PortalPlanBillingPage;
