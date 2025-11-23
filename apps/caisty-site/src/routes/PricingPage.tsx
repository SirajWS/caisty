import { Link } from "react-router-dom";

export default function PricingPage() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-50">
      <section className="max-w-5xl mx-auto px-4 pt-20 pb-16 space-y-8">
        <header className="text-center space-y-3">
          <h1 className="text-3xl sm:text-4xl font-semibold">
            Einfache Pläne für deinen Start mit Caisty.
          </h1>
          <p className="text-sm text-slate-300 max-w-2xl mx-auto">
            Starte klein mit einer Kasse oder plane direkt mehrere Geräte. In
            dieser Phase sind die Preise Platzhalter – später kommen echte
            Konditionen pro Markt dazu.
          </p>
        </header>

        <div className="grid gap-6 md:grid-cols-2">
          {/* Starter */}
          <PlanCard
            title="Starter"
            badge={null}
            price="49"
            description="Ideal für eine Filiale"
            features={[
              "1 aktives POS-Gerät",
              "Lizenzverwaltung im Portal",
              "Geräte-Übersicht & Basis-Statistiken",
              "E-Mail-Support zu Geschäftszeiten",
            ]}
            footerNote="Später werden hier echte Konditionen pro Markt/Region hinterlegt."
          />

          {/* Pro */}
          <PlanCard
            title="Pro"
            badge="Geplant"
            price="129"
            description="Für wachsende Betriebe"
            features={[
              "Bis zu 5 aktive POS-Geräte",
              "Erweiterte Geräte-Übersicht",
              "Geplante Zusatzberichte & Exporte",
              "Priorisierter Support",
            ]}
            footerNote="Später werden hier echte Konditionen pro Markt/Region hinterlegt."
          />
        </div>

        {/* Hinweis & Call-to-Action */}
        <section className="mt-6 space-y-4">
          <div className="grid gap-4 md:grid-cols-3 text-sm">
            <InfoCard
              title="Vertrag & Laufzeit"
              text="In der finalen Version planen wir monatlich kündbare Verträge, abgerechnet pro Lizenz. Die hier dargestellten Preise sind Platzhalter für Tests."
            />
            <InfoCard
              title="Hardware"
              text="Du kannst Caisty mit Standard-Hardware nutzen: Windows-PC oder Mini-PC, Thermodrucker, optional Kassenschublade und Scanner. Keine Spezialkasse nötig."
            />
            <InfoCard
              title="Nächste Schritte"
              text="Portalzugang anlegen, Lizenz erhalten und Caisty POS installieren. Die Installationsschritte und der Download erfolgen ausschließlich im Kundenportal."
            />
          </div>

          <div className="mt-4 flex flex-col sm:flex-row items-center justify-between gap-3 rounded-2xl border border-slate-800 bg-slate-900/70 px-4 py-4">
            <div className="text-xs sm:text-sm text-slate-300 max-w-xl">
              <span className="font-semibold text-slate-100">
                Bereit zum Testen?
              </span>{" "}
              Lege deinen Portalzugang an, erhalte eine Lizenz und installiere
              Caisty POS anschließend über die Installationsseite im
              Kundenportal.
            </div>

            <div className="flex flex-wrap gap-3">
              <Link
                to="/register"
                className="inline-flex items-center justify-center rounded-full bg-emerald-500 px-5 py-2 text-xs sm:text-sm font-medium text-slate-950 hover:bg-emerald-400 transition-colors"
              >
                Portalzugang anlegen
              </Link>
              {/* Kein direkter POS-Installer-Button mehr hier */}
            </div>
          </div>
        </section>
      </section>
    </div>
  );
}

interface PlanCardProps {
  title: string;
  badge: string | null;
  price: string;
  description: string;
  features: string[];
  footerNote: string;
}

function PlanCard({
  title,
  badge,
  price,
  description,
  features,
  footerNote,
}: PlanCardProps) {
  return (
    <div className="rounded-3xl border border-slate-800 bg-slate-900/70 p-6 flex flex-col justify-between">
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

        <div className="text-3xl font-semibold text-emerald-400">
          {price}{" "}
          <span className="text-base align-baseline text-slate-300">
            €/Monat*
          </span>
        </div>
        <div className="text-[11px] text-slate-500">
          *monatlich (Platzhalter)
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

      <p className="mt-4 text-[11px] text-slate-500">{footerNote}</p>
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
