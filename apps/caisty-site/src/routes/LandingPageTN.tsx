import { Link } from "react-router-dom";
import { useTheme } from "../lib/theme";

export default function LandingPageTN() {
  const { theme } = useTheme();
  const isLight = theme === "light";

  const pageBg = isLight ? "bg-slate-50 text-slate-900" : "bg-slate-950 text-slate-50";
  const cardBg = isLight ? "bg-white border-slate-200" : "bg-slate-900/70 border-slate-800";
  const muted = isLight ? "text-slate-600" : "text-slate-300";
  const strong = isLight ? "text-slate-900" : "text-slate-50";

  return (
    <div className={`min-h-screen ${pageBg}`}>
      {/* Hero */}
      <section className="max-w-5xl mx-auto px-4 pt-16 pb-12">
        <div className="inline-flex items-center rounded-full border border-emerald-300 bg-emerald-50 text-emerald-600 px-3 py-1 text-[11px] font-medium mb-6">
          Version Tunisie TN
        </div>

        <div className="grid gap-10 md:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)] items-center">
          <div className="space-y-6">
            <h1 className={`text-3xl sm:text-4xl md:text-5xl font-semibold leading-tight ${strong}`}>
              Une caisse moderne{" "}
              <span className="text-emerald-500">simple et efficace</span>
            </h1>

            <p className={`text-sm sm:text-base max-w-xl ${muted}`}>
              Ventes, caisse et gestion — tout en un. Parfait pour restaurants, snacks, cafés et boutiques modernes.
            </p>

            <div className="flex flex-wrap gap-3 text-sm">
              <Link
                to="/register"
                className="inline-flex items-center justify-center rounded-full bg-emerald-500 px-5 py-2 text-sm font-medium text-slate-950 hover:bg-emerald-400 transition-colors"
              >
                Commencer gratuit
              </Link>

              <a
                href="#pricing"
                className={`inline-flex items-center justify-center rounded-full border px-5 py-2 text-sm font-medium transition-colors ${
                  isLight
                    ? "border-slate-300 text-slate-700 hover:bg-slate-50"
                    : "border-slate-700 text-slate-100 hover:bg-slate-800"
                }`}
              >
                Voir les prix
              </a>
            </div>

            <p className={`text-[11px] max-w-md ${isLight ? "text-slate-500" : "text-slate-400"}`}>
              Commencez avec un essai sans paiement. Vous pouvez évoluer vers Starter ou Pro ensuite.
            </p>
          </div>

          {/* Mini mock light */}
          <div className={`rounded-3xl border p-4 shadow-xl ${cardBg}`}>
            <div className="flex items-center justify-between mb-3">
              <div className={`text-[11px] uppercase tracking-wide ${isLight ? "text-slate-500" : "text-slate-400"}`}>
                CAISTY • TN
              </div>
              <div className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-[11px] ${isLight ? "bg-slate-100 text-slate-700" : "bg-slate-800 text-slate-300"}`}>
                <span className="h-2 w-2 rounded-full bg-emerald-400" />
                Portail • Dashboard
              </div>
            </div>

            <div className={`rounded-2xl border p-4 space-y-3 ${isLight ? "border-slate-200 bg-slate-50" : "border-slate-800 bg-slate-950/80"}`}>
              <div className={`text-xs font-semibold ${isLight ? "text-slate-900" : "text-slate-200"}`}>
                Ventes du jour
              </div>
              <div className={`rounded-xl border p-3 ${isLight ? "border-slate-200 bg-white" : "border-slate-800 bg-slate-900/80"}`}>
                <div className={`text-[11px] ${muted}`}>Appareils</div>
                <div className="mt-2 h-1.5 rounded bg-emerald-200">
                  <div className="h-1.5 w-1/3 rounded bg-emerald-500" />
                </div>
              </div>
              <div className={`rounded-xl border p-3 ${isLight ? "border-slate-200 bg-white" : "border-slate-800 bg-slate-900/80"}`}>
                <div className={`text-[11px] ${muted}`}>Simple à démarrer — on évolue avec vous.</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Pour qui */}
      <section className="max-w-5xl mx-auto px-4 pb-10 space-y-4">
        <h2 className={`text-xl font-semibold ${strong}`}>Pour qui ?</h2>
        <div className="grid gap-4 md:grid-cols-4 text-sm">
          <SimpleChip label="Restaurants" />
          <SimpleChip label="Snacks / Fast-food" />
          <SimpleChip label="Cafés" />
          <SimpleChip label="Boutiques modernes" />
        </div>
      </section>

      {/* Comment ça marche */}
      <section className="max-w-5xl mx-auto px-4 pb-10 space-y-4">
        <h2 className={`text-xl font-semibold ${strong}`}>Comment ça marche ?</h2>
        <div className="grid gap-4 md:grid-cols-3 text-sm">
          <StepCard
            title="1"
            text="Installez la caisse"
            light={isLight}
          />
          <StepCard
            title="2"
            text="Connectez-vous au portail"
            light={isLight}
          />
          <StepCard
            title="3"
            text="Gérez et suivez vos ventes"
            light={isLight}
          />
        </div>
      </section>

      {/* Pourquoi */}
      <section className="max-w-5xl mx-auto px-4 pb-10 space-y-4">
        <h2 className={`text-xl font-semibold ${strong}`}>Pourquoi Caisty ?</h2>

        <div className="grid gap-4 md:grid-cols-3 text-sm">
          <FeatureCard
            title="Caisse rapide"
            text="Une interface claire, pensée pour le service."
            light={isLight}
          />
          <FeatureCard
            title="Portail cloud"
            text="Gardez tout sous contrôle, même à distance."
            light={isLight}
          />
          <FeatureCard
            title="Gestion des appareils"
            text="Suivez les appareils connectés en temps réel."
            light={isLight}
          />
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="max-w-5xl mx-auto px-4 pb-12 space-y-4">
        <div className="space-y-2">
          <h2 className={`text-xl font-semibold ${strong}`}>Prix (Tunisie)</h2>
          <p className={`${muted} text-sm`}>
            Les moyens de paiement locaux arrivent bientôt. Pour l’instant : essai + demande de démo.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-3 text-sm">
          <PlanCardTN
            name="Essai"
            price="0 TND"
            subtitle="7 jours"
            bullets={["Sans carte", "Portail inclus", "Test réel"]}
            highlight={false}
            light={isLight}
          />
          <PlanCardTN
            name="Starter"
            price="À partir de 49 TND/mois"
            subtitle="Pour démarrer"
            bullets={["Caisse + portail", "Suivi appareils", "Support"]}
            highlight
            light={isLight}
          />
          <PlanCardTN
            name="Pro"
            price="À partir de 99 TND/mois"
            subtitle="Pour grandir"
            bullets={["Plus de fonctions", "Rapports", "Support prioritaire"]}
            highlight={false}
            light={isLight}
          />
        </div>
      </section>

      {/* Paiement (sans mentionner PayPal/Stripe) */}
      <section className="max-w-5xl mx-auto px-4 pb-16 space-y-4">
        <h2 className={`text-xl font-semibold ${strong}`}>Méthodes de paiement sécurisées</h2>
        <div className={`rounded-2xl border p-4 ${isLight ? "border-slate-200 bg-white" : "border-slate-800 bg-slate-900/70"}`}>
          <p className={`text-sm ${muted}`}>
            Nous activons progressivement des solutions de paiement adaptées à la Tunisie.
            En attendant, vous pouvez commencer gratuitement et demander une démo — nous vous accompagnons pour la mise en place.
          </p>
        </div>
      </section>

      {/* CTA final */}
      <section className="max-w-5xl mx-auto px-4 pb-20">
        <div className={`rounded-3xl border p-6 md:p-8 ${isLight ? "border-slate-200 bg-white" : "border-slate-800 bg-slate-900/70"}`}>
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="space-y-1">
              <h3 className={`text-lg font-semibold ${strong}`}>Prêt à tester Caisty ?</h3>
              <p className={`text-sm ${muted}`}>Créez votre compte et démarrez l’essai gratuitement.</p>
            </div>
            <div className="flex gap-3">
              <Link
                to="/register"
                className="inline-flex items-center justify-center rounded-full bg-emerald-500 px-5 py-2 text-sm font-medium text-slate-950 hover:bg-emerald-400 transition-colors"
              >
                Commencer gratuit
              </Link>
              <Link
                to="/login"
                className={`inline-flex items-center justify-center rounded-full border px-5 py-2 text-sm font-medium transition-colors ${
                  isLight
                    ? "border-slate-300 text-slate-700 hover:bg-slate-50"
                    : "border-slate-700 text-slate-100 hover:bg-slate-800"
                }`}
              >
                Se connecter
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

function SimpleChip({ label }: { label: string }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700">
      {label}
    </div>
  );
}

function FeatureCard(props: { title: string; text: string; light: boolean }) {
  return (
    <div className={`rounded-2xl border p-4 space-y-2 ${props.light ? "border-slate-200 bg-white" : "border-slate-800 bg-slate-900/70"}`}>
      <div className={`text-sm font-medium ${props.light ? "text-slate-900" : "text-slate-100"}`}>{props.title}</div>
      <p className={`text-xs ${props.light ? "text-slate-600" : "text-slate-300"}`}>{props.text}</p>
    </div>
  );
}

function StepCard(props: { title: string; text: string; light: boolean }) {
  return (
    <div className={`rounded-2xl border p-4 ${props.light ? "border-slate-200 bg-white" : "border-slate-800 bg-slate-900/70"}`}>
      <div className={`inline-flex h-7 w-7 items-center justify-center rounded-full text-xs font-semibold ${props.light ? "bg-emerald-100 text-emerald-600" : "bg-emerald-500/15 text-emerald-300"}`}>
        {props.title}
      </div>
      <div className={`mt-2 text-sm font-medium ${props.light ? "text-slate-900" : "text-slate-100"}`}>{props.text}</div>
    </div>
  );
}

function PlanCardTN(props: {
  name: string;
  price: string;
  subtitle: string;
  bullets: string[];
  highlight?: boolean;
  light: boolean;
}) {
  const base = "rounded-2xl border p-4 space-y-3";
  const style = props.highlight
    ? props.light
      ? "border-emerald-300 shadow-lg shadow-emerald-200/40 bg-white"
      : "border-emerald-500/70 shadow-lg shadow-emerald-900/40 bg-slate-900/70"
    : props.light
    ? "border-slate-200 bg-white"
    : "border-slate-800 bg-slate-900/70";

  return (
    <div className={`${base} ${style}`}>
      <div className="flex items-center justify-between">
        <div className={`text-sm font-semibold ${props.light ? "text-slate-900" : "text-slate-100"}`}>{props.name}</div>
        {props.highlight && (
          <span className={`text-[10px] rounded-full border px-2 py-0.5 ${props.light ? "border-slate-200 bg-slate-50 text-slate-700" : "border-slate-700 bg-slate-900 text-slate-300"}`}>
            Populaire
          </span>
        )}
      </div>

      <div className="space-y-1">
        <div className="text-lg font-semibold text-emerald-500">{props.price}</div>
        <div className={`text-[11px] ${props.light ? "text-slate-600" : "text-slate-400"}`}>{props.subtitle}</div>
      </div>

      <ul className={`space-y-1 text-[11px] ${props.light ? "text-slate-700" : "text-slate-300"}`}>
        {props.bullets.map((b, i) => (
          <li key={i}>• {b}</li>
        ))}
      </ul>
    </div>
  );
}
