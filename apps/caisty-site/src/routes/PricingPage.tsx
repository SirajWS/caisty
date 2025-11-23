export default function PricingPage() {
  return (
    <section className="space-y-8">
      <div className="space-y-3">
        <h1 className="text-3xl md:text-4xl font-bold">Preise</h1>
        <p className="text-slate-300 text-sm md:text-base max-w-xl">
          Einfaches, transparentes Pricing. Keine versteckten Gebühren. Du
          kannst jederzeit im Portal upgraden oder kündigen.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <PlanCard
          name="Starter"
          price="49 TND / Monat"
          description="Ideal für einzelne Standorte."
          features={[
            "1 Standort / Organisation",
            "Bis zu 2 aktive Geräte (Seats)",
            "Lizenzverwaltung über Caisty Cloud",
            "Kundenportal mit Rechnungsübersicht",
          ]}
          cta="Mit Starter beginnen"
          highlight={false}
        />
        <PlanCard
          name="Pro"
          price="99 TND / Monat"
          description="Für wachsende Ketten und mehrere Filialen."
          features={[
            "Mehrere Standorte",
            "Mehr Seats & Geräte pro Lizenz",
            "Erweiterte Reporting-Möglichkeiten",
            "Priorisierter Support",
          ]}
          cta="Pro anfragen / freischalten"
          highlight
        />
      </div>
    </section>
  );
}

function PlanCard(props: {
  name: string;
  price: string;
  description: string;
  features: string[];
  cta: string;
  highlight?: boolean;
}) {
  return (
    <div
      className={[
        "relative rounded-3xl border p-6 space-y-4",
        props.highlight
          ? "border-emerald-500/60 bg-slate-900/70 shadow-lg shadow-emerald-500/30"
          : "border-slate-800 bg-slate-900/50",
      ].join(" ")}
    >
      {props.highlight && (
        <div className="absolute -top-3 right-4 rounded-full bg-emerald-500 px-3 py-1 text-[10px] font-semibold text-slate-950 uppercase tracking-wide">
          Meist gewählt
        </div>
      )}

      <div className="space-y-1">
        <h2 className="text-xl font-semibold">{props.name}</h2>
        <p className="text-sm text-slate-400">{props.description}</p>
      </div>

      <div className="text-2xl font-bold text-emerald-400">{props.price}</div>

      <ul className="space-y-1.5 text-xs text-slate-300">
        {props.features.map((f) => (
          <li key={f} className="flex gap-2">
            <span className="mt-[3px] h-1.5 w-1.5 rounded-full bg-emerald-400" />
            <span>{f}</span>
          </li>
        ))}
      </ul>

      <button
        type="button"
        className={[
          "mt-2 w-full rounded-full px-4 py-2 text-sm font-medium",
          props.highlight
            ? "bg-emerald-500 text-slate-950 hover:bg-emerald-400"
            : "bg-slate-800 text-slate-100 hover:bg-slate-700",
        ].join(" ")}
      >
        {props.cta}
      </button>
    </div>
  );
}
