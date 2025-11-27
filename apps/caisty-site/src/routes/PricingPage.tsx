import { useState } from "react";
import { Link } from "react-router-dom";
import { PRICING_PLANS } from "../config/pricingPlans";

type BillingPeriod = "monthly" | "yearly";

export default function PricingPage() {
  const [billing, setBilling] = useState<BillingPeriod>("monthly");
  const { trialDays, starter, pro } = PRICING_PLANS || {};

  const starterMonthly = starter?.monthly ?? 19;
  const starterYearly = starter?.yearly ?? 190;
  const starterDevices = starter?.devices ?? 1;

  const proMonthly = pro?.monthly ?? 35;
  const proYearly = pro?.yearly ?? 350;
  const proDevices = pro?.devices ?? 3;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-50">
      <section className="max-w-5xl mx-auto px-4 pt-20 pb-16 space-y-8">
        <header className="text-center space-y-3">
          <h1 className="text-3xl sm:text-4xl font-semibold">
            Einfache Pläne für deinen Start mit Caisty.
          </h1>
          <p className="text-sm text-slate-300 max-w-2xl mx-auto">
            Starte zuerst mit einer kurzen Testphase und entscheide dann, ob du mit
            Starter oder Pro weitermachen möchtest. Du zahlst pro Lizenz – und kannst
            monatlich beginnen oder mit einem Jahresplan sparen.
          </p>
        </header>

        {/* Trial-Hinweis */}
        <section className="max-w-3xl mx-auto">
          <div className="rounded-2xl border border-emerald-500/40 bg-emerald-500/10 px-4 py-3 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs sm:text-sm">
            <div className="space-y-1">
              <div className="inline-flex items-center gap-2 text-emerald-200">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                <span className="font-semibold uppercase tracking-wide text-[11px]">
                  Testlizenz
                </span>
              </div>
              <p className="text-slate-100">
                Du startest immer mit einer{" "}
                <span className="font-semibold">
                  {trialDays ?? 3}-Tage-Testlizenz
                </span>{" "}
                (Funktionsumfang wie Starter, 1 Gerät). Keine Zahlungsdaten
                erforderlich – wenn dir Caisty gefällt, wählst du danach einfach
                Starter oder Pro.
              </p>
            </div>
            <Link
              to="/register"
              className="inline-flex items-center justify-center rounded-full bg-emerald-500 px-5 py-2 text-xs sm:text-sm font-medium text-slate-950 hover:bg-emerald-400 transition-colors whitespace-nowrap"
            >
              Kostenlos starten
            </Link>
          </div>
        </section>

        {/* Billing Toggle */}
        <section className="flex justify-center">
          <div className="inline-flex items-center rounded-full border border-slate-800 bg-slate-900/80 p-1 text-[11px] sm:text-xs">
            <button
              type="button"
              onClick={() => setBilling("monthly")}
              className={[
                "px-3 py-1.5 rounded-full transition",
                billing === "monthly"
                  ? "bg-slate-800 text-slate-50"
                  : "text-slate-400",
              ].join(" ")}
            >
              Monatlich
            </button>
            <button
              type="button"
              onClick={() => setBilling("yearly")}
              className={[
                "px-3 py-1.5 rounded-full transition flex items-center gap-1",
                billing === "yearly"
                  ? "bg-slate-800 text-slate-50"
                  : "text-slate-400",
              ].join(" ")}
            >
              Jährlich
              <span className="hidden sm:inline text-[10px] text-emerald-300">
                (Rabatt)
              </span>
            </button>
          </div>
        </section>

        <div className="grid gap-6 md:grid-cols-2">
          {/* Starter */}
          <PlanCard
            title="Starter"
            badge="Beliebt für einen Standort"
            billing={billing}
            priceMonthly={starterMonthly}
            priceYearly={starterYearly}
            description="Ideal für eine Filiale oder ein einzelnes Geschäft."
            devicesLabel={`${starterDevices} aktives POS-Gerät`}
            features={[
              "Lizenzverwaltung im Kundenportal",
              "Geräte-Übersicht & Basis-Statistiken",
              "Tagesabschlüsse & Export-Grundfunktionen",
              "E-Mail-Support zu Geschäftszeiten",
            ]}
            highlight
          />

          {/* Pro */}
          <PlanCard
            title="Pro"
            badge="Für mehrere Geräte"
            billing={billing}
            priceMonthly={proMonthly}
            priceYearly={proYearly}
            description="Für Betriebe mit mehreren Kassen oder kleinen Filialnetzen."
            devicesLabel={`Bis zu ${proDevices} aktive POS-Geräte`}
            features={[
              "Alle Starter-Funktionen",
              "Mehrere Geräte unter einer Lizenz",
              "Erweiterte Auswertungen (geplant)",
              "Priorisierter Support",
            ]}
          />
        </div>

        {/* Hinweis & Call-to-Action */}
        <section className="mt-6 space-y-4">
          <div className="grid gap-4 md:grid-cols-3 text-sm">
            <InfoCard
              title="Vertrag & Laufzeit"
              text="Du kannst mit einem monatlichen Plan beginnen und später jederzeit auf einen Jahresplan wechseln. Die Abrechnung läuft pro Lizenz, die du im Portal verwaltest."
            />
            <InfoCard
              title="Hardware"
              text="Caisty läuft auf Standard-Hardware: Windows-PC oder Mini-PC, Thermodrucker, optional Kassenschublade und Scanner. Keine Spezialkasse nötig."
            />
            <InfoCard
              title="Nächste Schritte"
              text="Portalzugang anlegen, Testlizenz erhalten und Caisty POS über die Installationsseite im Kundenportal installieren. Alles weitere steuerst du später zentral über dein Caisty-Konto."
            />
          </div>

          <div className="mt-4 flex flex-col sm:flex-row items-center justify-between gap-3 rounded-2xl border border-slate-800 bg-slate-900/70 px-4 py-4">
            <div className="text-xs sm:text-sm text-slate-300 max-w-xl">
              <span className="font-semibold text-slate-100">
                Bereit zum Testen?
              </span>{" "}
              Lege deinen Portalzugang an, erhalte automatisch deine Testlizenz
              und installiere Caisty POS anschließend über die Installationsseite
              im Kundenportal.
            </div>

            <div className="flex flex-wrap gap-3">
              <Link
                to="/register"
                className="inline-flex items-center justify-center rounded-full bg-emerald-500 px-5 py-2 text-xs sm:text-sm font-medium text-slate-950 hover:bg-emerald-400 transition-colors"
              >
                Portalzugang anlegen
              </Link>
            </div>
          </div>

          <p className="text-[11px] text-slate-500">
            Alle Beträge in Euro, zzgl. MwSt. – finale Konditionen können je nach
            Land und Steuerregeln variieren und werden im Kundenportal pro Markt
            hinterlegt.
          </p>
        </section>
      </section>
    </div>
  );
}

interface PlanCardProps {
  title: string;
  badge?: string | null;
  billing: BillingPeriod;
  priceMonthly: number;
  priceYearly: number;
  description: string;
  devicesLabel: string;
  features: string[];
  highlight?: boolean;
}

function PlanCard({
  title,
  badge,
  billing,
  priceMonthly,
  priceYearly,
  description,
  devicesLabel,
  features,
  highlight,
}: PlanCardProps) {
  const isMonthly = billing === "monthly";
  const price = isMonthly ? priceMonthly : priceYearly;
  const suffix = isMonthly ? "€/Monat" : "€/Jahr";

  return (
    <div
      className={[
        "rounded-3xl border bg-slate-900/70 p-6 flex flex-col justify-between",
        highlight
          ? "border-emerald-500/60 shadow-lg shadow-emerald-900/40"
          : "border-slate-800",
      ].join(" ")}
    >
      <div className="space-y-4">
        <div className="flex items-center justify-between gap-2">
          <div>
            <h2 className="text-lg font-semibold">{title}</h2>
            <p className="text-xs text-slate-400">{description}</p>
          </div>
          {badge && (
            <span className="inline-flex items-center rounded-full bg-slate-800 px-3 py-1 text-[11px] uppercase tracking-wide text-slate-300">
              {badge}
            </span>
          )}
        </div>

        <div className="space-y-1">
          <div className="text-3xl font-semibold text-emerald-400">
            {price}{" "}
            <span className="text-base align-baseline text-slate-300">
              {suffix}
            </span>
          </div>
          <div className="text-[11px] text-slate-400">{devicesLabel}</div>
        </div>

        <ul className="mt-4 space-y-2 text-sm text-slate-200">
          {features.map((f) => (
            <li key={f} className="flex items-start gap-2">
              <span className="mt-[3px] h-1.5 w-1.5 rounded-full bg-emerald-400" />
              <span>{f}</span>
            </li>
          ))}
        </ul>
      </div>
    <p className="mt-4 text-[11px] text-slate-500">
        Du kannst deinen Plan später im Portal wechseln – ein Upgrade ist in der
        Regel sofort möglich, ein Downgrade zur nächsten Abrechnungsperiode.
      </p>
    </div>
  );
}

function InfoCard({ title, text }: { title: string; text: string }) {
  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4 space-y-2">
      <div className="text-sm font-medium text-slate-100">{title}</div>
      <p className="text-xs text-slate-300">{text}</p>
    </div>
  );
}

