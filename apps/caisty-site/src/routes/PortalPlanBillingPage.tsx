// apps/caisty-site/src/routes/PortalPlanBillingPage.tsx
import React from "react";
import { Link } from "react-router-dom";
import {
  fetchPortalLicenses,
  type PortalLicense,
  fetchPortalMe,
  createTrialLicense,
} from "../lib/portalApi";
import { Button } from "../components/ui/Button";

type BillingPlanId = "trial" | "starter" | "pro";

interface BillingPlan {
  id: BillingPlanId;
  label: string;
  priceLabel: string;
  intervalLabel: string;
  tagline: string;
  devicesLabel: string;
  highlight?: "primary" | "secondary";
  bulletPoints: string[];
}

const BILLING_PLANS: BillingPlan[] = [
  {
    id: "trial",
    label: "Trial",
    priceLabel: "0 €",
    intervalLabel: "für 3 Tage",
    tagline: "Zum Testen vor Ort, ohne Zahlungsdaten.",
    devicesLabel: "1 aktives POS-Gerät",
    highlight: "secondary",
    bulletPoints: [
      "Funktional identisch mit Starter (1 Gerät)",
      "3 Tage volle Funktionen, um Caisty im Alltag zu testen",
      "Keine Zahlungsdaten erforderlich",
    ],
  },
  {
    id: "starter",
    label: "Starter",
    priceLabel: "19 €",
    intervalLabel: "pro Monat",
    tagline: "Ideal für eine Filiale oder einen Standort.",
    devicesLabel: "1 aktives POS-Gerät",
    highlight: "primary",
    bulletPoints: [
      "Lizenzverwaltung im Kundenportal",
      "Geräte-Übersicht & Basis-Statistiken",
      "Tagesabschlüsse & Export-Grundfunktionen",
      "E-Mail-Support zu Geschäftszeiten",
    ],
  },
  {
    id: "pro",
    label: "Pro",
    priceLabel: "35 €",
    intervalLabel: "pro Monat",
    tagline:
      "Für Betriebe mit mehreren Kassen oder kleinen Filialketten.",
    devicesLabel: "bis zu 3 aktive POS-Geräte",
    bulletPoints: [
      "Alle Starter-Funktionen",
      "Mehrere Geräte unter einer Lizenz",
      "Erweiterte Auswertungen (geplant)",
      "Priorisierter Support",
    ],
  },
];

function findMetaForLicense(lic: PortalLicense | null): BillingPlan | null {
  if (!lic) return null;
  const planKey = (lic.plan ?? "").toLowerCase();
  const byPlan = BILLING_PLANS.find((p) => p.id === planKey);
  if (byPlan) return byPlan;

  return {
    id: "starter",
    label: lic.plan ?? "Plan",
    priceLabel: "—",
    intervalLabel: "pro Monat",
    tagline: "Aktiver Plan aus deinem Konto.",
    devicesLabel: `${lic.maxDevices ?? 1} aktive POS-Geräte`,
    bulletPoints: [],
  };
}

const PortalPlanBillingPage: React.FC = () => {
  const [meName, setMeName] = React.useState<string | null>(null);
  const [licenses, setLicenses] = React.useState<PortalLicense[]>([]);
  const [loading, setLoading] = React.useState(true);

  const [trialBusy, setTrialBusy] = React.useState(false);
  const [trialError, setTrialError] = React.useState<string | null>(null);

  React.useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const [me, licList] = await Promise.all([
          fetchPortalMe(),
          fetchPortalLicenses(),
        ]);
        if (cancelled) return;
        setMeName(me?.name ?? null);
        setLicenses(licList);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  const activeLicense = React.useMemo(() => {
    if (!licenses.length) return null;
    const active = licenses.find((l) => l.status === "active");
    if (active) return active;
    return licenses[0];
  }, [licenses]);

  const activeMeta = React.useMemo(
    () => findMetaForLicense(activeLicense),
    [activeLicense],
  );

  const currentPlanId: BillingPlanId | null = React.useMemo(() => {
    if (!activeLicense) return null;
    const key = (activeLicense.plan ?? "").toLowerCase() as BillingPlanId;
    if (key === "starter" || key === "pro" || key === "trial") return key;
    return null;
  }, [activeLicense]);

  // ➜ Trial-Erkennung: bevorzugt kind === "trial", Fallback plan === "trial"
  const hasTrialLicense = React.useMemo(
    () =>
      licenses.some(
        (l) =>
          (l as any).kind === "trial" ||
          (l.plan ?? "").toLowerCase() === "trial",
      ),
    [licenses],
  );

  async function handleStartTrial() {
    try {
      setTrialError(null);
      setTrialBusy(true);

      const lic = await createTrialLicense();
      // Neue Trial vorne anhängen (falls /portal/licenses noch nicht aktualisiert ist)
      setLicenses((prev) => [lic, ...prev]);
    } catch (err: any) {
      // Wenn das Backend reason-Felder liefert, hübschere Meldungen anzeigen
      if (err?.reason === "trial_already_used") {
        setTrialError(
          "Für dieses Konto wurde bereits eine kostenlose Testlizenz angelegt.",
        );
      } else if (err?.reason === "active_plan_exists") {
        setTrialError(
          "Für dieses Konto existiert bereits ein aktiver, bezahlter Plan. Eine zusätzliche Testlizenz ist nicht möglich.",
        );
      } else {
        setTrialError(
          err?.message ??
            "Fehler beim Anlegen der Testlizenz. Bitte später erneut versuchen.",
        );
      }
    } finally {
      setTrialBusy(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <header className="space-y-2">
        <h1 className="text-xl md:text-2xl font-semibold tracking-tight">
          Plan &amp; Abrechnung
        </h1>
        <p className="text-sm text-slate-300 max-w-2xl">
          Hier siehst du deinen aktuellen Plan, die wichtigsten Details zu
          deiner Lizenz und eine Vorschau der verfügbaren Pakete. Deine
          kostenlose Testlizenz kannst du direkt hier im Portal starten –
          dauerhafte Pläne (Starter, Pro) werden in dieser ersten Version
          noch von deinem Anbieter aktiviert/angepasst.
        </p>
      </header>

      {trialError && (
        <section className="rounded-2xl border border-rose-500/60 bg-rose-500/10 px-4 py-3 text-[11px] text-rose-100">
          {trialError}
        </section>
      )}

      {/* Aktueller Plan */}
      <section className="rounded-2xl border border-slate-800 bg-slate-950/70 px-4 py-4 md:px-5 md:py-5 space-y-4">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          <div className="space-y-1">
            <div className="text-xs uppercase tracking-wide text-slate-400">
              Dein aktueller Plan
            </div>
            {loading ? (
              <div className="h-4 w-40 rounded-full bg-slate-800 animate-pulse" />
            ) : activeLicense && activeMeta ? (
              <>
                <div className="text-lg font-semibold text-slate-50 flex items-center gap-2">
                  {activeMeta.label}
                  <span className="text-xs font-normal px-2 py-0.5 rounded-full border border-emerald-500/40 text-emerald-300 bg-emerald-500/5">
                    {activeLicense.status === "active"
                      ? "aktiv"
                      : activeLicense.status}
                  </span>
                  {(activeLicense as any).kind === "trial" && (
                    <span className="text-[10px] px-2 py-0.5 rounded-full border border-sky-500/40 text-sky-300 bg-sky-500/5">
                      Testlizenz
                    </span>
                  )}
                </div>
                <div className="text-sm text-slate-300">
                  {activeMeta.priceLabel}{" "}
                  <span className="text-slate-400">
                    {activeMeta.intervalLabel}
                  </span>{" "}
                  · {activeMeta.devicesLabel}
                </div>
              </>
            ) : (
              <div className="text-sm text-slate-300">
                Aktuell ist in deinem Konto noch keine aktive Lizenz sichtbar.
                Sobald dir ein Plan zugewiesen oder eine Testlizenz erstellt
                wird, erscheint er hier.
              </div>
            )}
          </div>

          <div className="flex flex-col items-start md:items-end gap-2 text-xs">
            <div className="text-slate-400">
              Konto-Inhaber:{" "}
              <span className="text-slate-200 font-medium">
                {meName ?? "dein Konto"}
              </span>
            </div>
            {activeLicense && (
              <div className="text-slate-400">
                Aktiver Lizenzschlüssel:{" "}
                <span className="font-mono text-[11px] text-slate-100">
                  {activeLicense.key}
                </span>
              </div>
            )}
            <div className="text-[11px] text-slate-500 max-w-md text-right">
              Planwechsel &amp; Zahlungsmethoden für Starter/Pro werden später
              direkt hier im Portal verfügbar. Aktuell erfolgt die Umstellung
              über deinen Anbieter oder Support.
            </div>
          </div>
        </div>

        {activeLicense && (
          <div className="grid gap-3 md:grid-cols-3 text-xs md:text-sm text-slate-300 pt-3 border-t border-slate-800">
            <div>
              <div className="text-slate-400 text-[11px] uppercase tracking-wide mb-1.5">
                Plan-Details
              </div>
              <ul className="space-y-1">
                <li>{activeMeta?.tagline}</li>
                <li>
                  Max. Geräte:{" "}
                  <span className="font-medium text-slate-100">
                    {activeLicense.maxDevices ?? 1}
                  </span>
                </li>
                <li>
                  Status:{" "}
                  <span className="font-medium text-slate-100">
                    {activeLicense.status}
                  </span>
                </li>
              </ul>
            </div>
            <div>
              <div className="text-slate-400 text-[11px] uppercase tracking-wide mb-1.5">
                Laufzeit
              </div>
              <ul className="space-y-1">
                <li>
                  Gültig bis:{" "}
                  <span className="font-medium text-slate-100">
                    {formatDate(activeLicense.validUntil)}
                  </span>
                </li>
                <li>
                  Erstellt am:{" "}
                  <span className="font-medium text-slate-100">
                    {formatDate(activeLicense.createdAt)}
                  </span>
                </li>
              </ul>
            </div>
            <div className="space-y-2">
              <div className="text-slate-400 text-[11px] uppercase tracking-wide">
                Abrechnung &amp; Rechnungen
              </div>
              <p>
                Die eigentliche Abrechnung und Rechnungsdokumente findest du
                unter{" "}
                <Link
                  to="/portal/invoices"
                  className="text-emerald-300 hover:text-emerald-200 underline underline-offset-2"
                >
                  „Rechnungen“
                </Link>
                . In dieser Version können Rechnungen noch manuell erzeugt
                werden.
              </p>
            </div>
          </div>
        )}
      </section>

      {/* Pläne im Überblick */}
      <section className="space-y-3">
        <div className="flex items-center justify-between gap-2">
          <h2 className="text-sm md:text-base font-semibold text-slate-100">
            Pläne &amp; Lizenzen im Überblick
          </h2>
          <span className="text-[11px] text-slate-500">
            Die folgenden Informationen orientieren sich an der aktuellen
            Preisseite. Feinheiten können sich je nach Markt noch ändern.
          </span>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          {BILLING_PLANS.map((plan) => (
            <PlanCard
              key={plan.id}
              plan={plan}
              isCurrent={currentPlanId === plan.id}
              canStartTrial={plan.id === "trial" && !hasTrialLicense}
              onStartTrial={
                plan.id === "trial" && !hasTrialLicense
                  ? handleStartTrial
                  : undefined
              }
              busy={plan.id === "trial" && trialBusy}
            />
          ))}
        </div>
      </section>

      {/* Hinweis unten */}
      <section className="rounded-2xl border border-slate-800 bg-slate-950/70 px-4 py-4 text-[11px] md:text-xs text-slate-400 space-y-2">
        <p>
          <span className="font-semibold text-slate-100">
            Wie geht es weiter?
          </span>{" "}
          In einer späteren Ausbaustufe startest du von hier aus direkt einen
          Checkout (z.&nbsp;B. mit PayPal oder Karte), erhältst automatisch
          deine Lizenz und die passende Rechnung. Die POS-App erkennt deinen
          aktiven Plan und sperrt die Kasse, falls kein gültiger Plan mehr
          vorhanden ist.
        </p>
        <p>
          Aktuell verwaltet dein Anbieter die Starter-/Pro-Lizenzen noch für
          dich. Wenn du von Starter auf Pro wechseln möchtest, melde dich bitte
          beim Support oder nutze die Kontaktdaten auf der Website.
        </p>
      </section>
    </div>
  );
};

function PlanCard({
  plan,
  isCurrent,
  canStartTrial,
  onStartTrial,
  busy,
}: {
  plan: BillingPlan;
  isCurrent: boolean;
  canStartTrial?: boolean;
  onStartTrial?: () => void;
  busy?: boolean;
}) {
  const borderHighlight =
    plan.highlight === "primary"
      ? "border-emerald-500/70 shadow-[0_0_0_1px_rgba(16,185,129,0.35)]"
      : plan.highlight === "secondary"
      ? "border-sky-500/60"
      : "border-slate-800";

  const isTrial = plan.id === "trial";

  let actionText = "Plan wählen (bald)";
  let actionDisabled = true;
  let actionExplanation =
    "Self-Service-Kauf direkt hier im Portal ist geplant.";

  if (isTrial) {
    if (isCurrent || !canStartTrial) {
      actionText = "Testlizenz bereits genutzt";
      actionExplanation =
        "Für jedes Konto kann nur eine Testlizenz angelegt werden.";
      actionDisabled = true;
    } else {
      actionText = busy ? "Testlizenz wird angelegt …" : "Testlizenz starten";
      actionExplanation =
        "Lege einmalig deine kostenlose Testlizenz für dieses Konto an.";
      actionDisabled = busy;
    }
  }

  return (
    <div
      className={[
        "rounded-2xl bg-slate-950/70 p-4 flex flex-col justify-between gap-3 border",
        borderHighlight,
      ].join(" ")}
    >
      <div className="space-y-2">
        <div className="flex items-center justify-between gap-2">
          <div>
            <div className="text-sm font-semibold text-slate-100">
              {plan.label}
            </div>
            <div className="text-[11px] text-slate-400">
              {plan.tagline}
            </div>
          </div>
          {isCurrent && (
            <span className="inline-flex items-center rounded-full bg-emerald-500/15 px-3 py-1 text-[10px] font-medium text-emerald-300 uppercase tracking-wide">
              Aktueller Plan
            </span>
          )}
        </div>

        <div className="text-2xl font-semibold text-emerald-400">
          {plan.priceLabel}{" "}
          <span className="text-xs text-slate-300">
            {plan.intervalLabel}
          </span>
        </div>
        <div className="text-[11px] text-slate-400">
          {plan.devicesLabel}
        </div>

        <ul className="mt-2 space-y-1.5 text-xs text-slate-200">
          {plan.bulletPoints.map((bp) => (
            <li key={bp} className="flex items-start gap-2">
              <span className="mt-[5px] h-1.5 w-1.5 rounded-full bg-emerald-400" />
              <span>{bp}</span>
            </li>
          ))}
        </ul>
      </div>

      <div className="mt-2 pt-2 border-t border-slate-800 flex items-center justify-between gap-2 text-[11px] text-slate-400">
        <span>{actionExplanation}</span>
        <Button
          type="button"
          size="sm"
          variant={isTrial ? "default" : "outline"}
          disabled={actionDisabled}
          onClick={
            isTrial && onStartTrial && !actionDisabled
              ? onStartTrial
              : undefined
          }
          className={
            actionDisabled && !isTrial
              ? "cursor-not-allowed opacity-60"
              : undefined
          }
        >
          {actionText}
        </Button>
      </div>
    </div>
  );
}

function formatDate(value: string | null | undefined): string {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleString();
}

export default PortalPlanBillingPage;
