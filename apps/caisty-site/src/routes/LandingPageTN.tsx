import { Link } from "react-router-dom";
import { useTheme } from "../lib/theme";

export default function LandingPageTN() {
  const { theme } = useTheme();
  const isLight = theme === "light";

  const pageBg = isLight ? "bg-slate-50 text-slate-900" : "bg-slate-950 text-slate-50";
  const strong = isLight ? "text-slate-900" : "text-slate-50";
  const muted = isLight ? "text-slate-600" : "text-slate-300";
  const border = isLight ? "border-slate-200" : "border-slate-800";
  const card = isLight ? "bg-white" : "bg-slate-900/70";

  return (
    <div className={`min-h-screen ${pageBg}`}>
      {/* HERO */}
      <section className="max-w-5xl mx-auto px-4 pt-16 pb-12">
        <div
          className={`inline-flex items-center rounded-full border px-3 py-1 text-[11px] font-medium mb-6 ${
            isLight
              ? "border-emerald-300 bg-emerald-50 text-emerald-600"
              : "border-emerald-500/30 bg-emerald-500/10 text-emerald-300"
          }`}
        >
          Version Tunisie TN
        </div>

        <div className="grid gap-10 md:grid-cols-[minmax(0,1.35fr)_minmax(0,1fr)] items-center">
          <div className="space-y-6">
            <h1 className={`text-3xl sm:text-4xl md:text-5xl font-semibold leading-tight ${strong}`}>
              Une caisse moderne{" "}
              <span className="text-emerald-500">simple et efficace</span>
            </h1>

            <p className={`text-sm sm:text-base max-w-xl ${muted}`}>
              Caisty POS est une solution de caisse intelligente avec un portail cloud intégré.
              Gérez vos ventes, licences, appareils et factures — sans complexité.
            </p>

            <div className="flex flex-wrap gap-3 text-sm">
              <Link
                to="/register"
                className="inline-flex items-center justify-center rounded-full bg-emerald-500 px-5 py-2 text-sm font-medium text-slate-950 hover:bg-emerald-400 transition-colors"
              >
                Commencer gratuitement
              </Link>

              <a
                href="#how"
                className={`inline-flex items-center justify-center rounded-full border px-5 py-2 text-sm font-medium transition-colors ${
                  isLight
                    ? "border-slate-300 text-slate-700 hover:bg-slate-50"
                    : "border-slate-700 text-slate-100 hover:bg-slate-800"
                }`}
              >
                Voir comment ça marche
              </a>
            </div>

            <p className={`text-[11px] max-w-md ${isLight ? "text-slate-500" : "text-slate-400"}`}>
              Essai gratuit. Aucun engagement. Vous pouvez évoluer vers Starter ou Pro plus tard.
            </p>
          </div>

          {/* Mini mock / aperçu */}
          <div className={`rounded-3xl border p-4 shadow-xl ${border} ${card}`}>
            <div className="flex items-center justify-between mb-3">
              <div className={`text-[11px] uppercase tracking-wide ${isLight ? "text-slate-500" : "text-slate-400"}`}>
                CAISTY • TN
              </div>
              <div
                className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-[11px] ${
                  isLight ? "bg-slate-100 text-slate-700" : "bg-slate-800 text-slate-300"
                }`}
              >
                <span className="h-2 w-2 rounded-full bg-emerald-400" />
                Portail • Dashboard
              </div>
            </div>

            <div className={`rounded-2xl border p-4 space-y-3 ${border} ${isLight ? "bg-slate-50" : "bg-slate-950/70"}`}>
              <div className={`text-xs font-semibold ${isLight ? "text-slate-900" : "text-slate-200"}`}>
                Aperçu rapide
              </div>

              <div className={`rounded-xl border p-3 ${border} ${isLight ? "bg-white" : "bg-slate-900/80"}`}>
                <div className={`text-[11px] ${muted}`}>Ventes du jour</div>
                <div className="mt-2 h-1.5 rounded bg-emerald-200">
                  <div className="h-1.5 w-1/2 rounded bg-emerald-500" />
                </div>
              </div>

              <div className={`rounded-xl border p-3 ${border} ${isLight ? "bg-white" : "bg-slate-900/80"}`}>
                <div className={`text-[11px] ${muted}`}>Appareils connectés</div>
                <div className={`mt-1 text-sm font-semibold ${isLight ? "text-slate-900" : "text-slate-100"}`}>
                  2 en ligne • 1 hors ligne
                </div>
              </div>

              <div className={`rounded-xl border border-dashed p-3 ${isLight ? "border-slate-300 bg-slate-100" : "border-slate-700 bg-slate-900/80"}`}>
                <div className={`text-[11px] ${isLight ? "text-slate-600" : "text-slate-300"}`}>
                  Simple à démarrer — on évolue avec vous.
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* POURQUOI */}
      <section className="max-w-5xl mx-auto px-4 pb-10 space-y-4">
        <h2 className={`text-xl font-semibold ${strong}`}>Pourquoi Caisty ?</h2>
        <p className={`text-sm max-w-3xl ${muted}`}>
          Caisty a été conçu pour aller à l’essentiel : une caisse rapide et fiable,
          avec un portail clair — sans systèmes compliqués ni coûts cachés.
        </p>

        <div className="grid gap-4 md:grid-cols-4 text-sm">
          <FeatureCard light={isLight} title="Caisse rapide" text="Interface intuitive, pensée pour la vitesse au comptoir." />
          <FeatureCard light={isLight} title="Portail client" text="Licences, appareils, factures, installation — tout au même endroit." />
          <FeatureCard light={isLight} title="Pensé pour évoluer" text="Commencez simple, ajoutez des options quand votre activité grandit." />
          <FeatureCard light={isLight} title="Contrôle total" text="Suivez vos appareils et vos licences en temps réel." />
        </div>
      </section>

      {/* POUR QUI */}
      <section className="max-w-5xl mx-auto px-4 pb-10 space-y-4">
        <h2 className={`text-xl font-semibold ${strong}`}>Pour qui est Caisty ?</h2>
        <div className="grid gap-4 md:grid-cols-4 text-sm">
          <AudienceCard light={isLight} title="Restaurants" text="Service rapide, suivi clair et gestion simple des ventes." />
          <AudienceCard light={isLight} title="Snacks / Fast-food" text="Commandes rapides, peu de clics, efficacité maximale." />
          <AudienceCard light={isLight} title="Cafés & bars" text="Articles simples, mises à jour rapides, rapports quotidiens." />
          <AudienceCard light={isLight} title="Boutiques modernes" text="POS, reçus et rapports essentiels — sans surplus inutile." />
        </div>
      </section>

      {/* COMMENT CA MARCHE */}
      <section id="how" className="max-w-5xl mx-auto px-4 pb-10 space-y-4">
        <h2 className={`text-xl font-semibold ${strong}`}>Comment ça marche ?</h2>
        <p className={`text-sm max-w-3xl ${muted}`}>
          Créez un compte, installez Caisty POS depuis votre portail, entrez la clé de licence — et commencez.
          L’essai est disponible immédiatement.
        </p>

        <div className="grid gap-4 md:grid-cols-3 text-sm">
          <StepCard
            light={isLight}
            n={1}
            title="Créer le compte"
            text="Créez votre compte Caisty et accédez au portail client. Une licence d’essai est générée automatiquement."
          />
          <StepCard
            light={isLight}
            n={2}
            title="Télécharger Caisty POS"
            text="Depuis le portail, téléchargez l’installateur pour votre système (Windows aujourd’hui, Linux/macOS bientôt)."
          />
          <StepCard
            light={isLight}
            n={3}
            title="Installer & commencer"
            text="Installez sur votre PC de caisse, entrez la clé de licence — terminé. Vous pouvez utiliser l’app immédiatement."
          />
        </div>
      </section>

      {/* DU TELECHARGEMENT */}
      <section className="max-w-5xl mx-auto px-4 pb-10">
        <div className={`rounded-3xl border p-6 md:p-7 ${border} ${card}`}>
          <div className="grid gap-6 md:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)] items-center">
            <div className="space-y-3">
              <h3 className={`text-lg font-semibold ${strong}`}>
                Du téléchargement à la caisse prête à l’emploi en quelques minutes
              </h3>
              <p className={`text-sm ${muted}`}>
                L’installation de Caisty POS se fait entièrement via votre portail client. Vous y trouvez :
                l’installateur officiel, votre clé de licence et un guide étape par étape.
              </p>

              <ul className={`text-sm space-y-2 ${isLight ? "text-slate-700" : "text-slate-200"}`}>
                <li className="flex gap-2"><Dot /> l’installateur officiel</li>
                <li className="flex gap-2"><Dot /> votre clé de licence</li>
                <li className="flex gap-2"><Dot /> un guide clair étape par étape</li>
              </ul>

              <p className={`text-[11px] ${isLight ? "text-slate-500" : "text-slate-400"}`}>
                La page d’installation détaillée est disponible après connexion dans le portail client,
                section <span className="font-semibold">« Installer Caisty POS »</span>.
              </p>
            </div>

            {/* Image placeholder */}
            <div className="relative">
              <div className={`absolute -inset-1 rounded-3xl blur-xl ${isLight ? "bg-emerald-100/60" : "bg-emerald-500/10"}`} />
              <div className={`relative rounded-2xl border p-4 ${border} ${isLight ? "bg-white" : "bg-slate-950/60"}`}>
                <div className={`text-[11px] ${isLight ? "text-slate-600" : "text-slate-400"} mb-2`}>
                  Aperçu Caisty POS (image bientôt)
                </div>
                <div className={`h-40 rounded-xl border border-dashed flex items-center justify-center ${isLight ? "border-slate-300 bg-slate-50 text-slate-500" : "border-slate-700 bg-slate-900/60 text-slate-400"}`}>
                  Zone image / screenshot POS
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* PORTAIL CLIENT */}
      <section className="max-w-5xl mx-auto px-4 pb-10 space-y-4">
        <h2 className={`text-xl font-semibold ${strong}`}>Le portail client Caisty</h2>

        <div className={`rounded-3xl border p-6 ${border} ${card}`}>
          <p className={`text-sm ${muted} mb-4`}>
            Le portail client Caisty vous permet de gérer votre activité simplement — accessible de partout :
          </p>

          <div className="grid gap-3 md:grid-cols-2 text-sm">
            <ListItem light={isLight} text="Licences actives et historique" />
            <ListItem light={isLight} text="Appareils connectés (PC de caisse)" />
            <ListItem light={isLight} text="Factures et abonnements" />
            <ListItem light={isLight} text="Installation et mises à jour Caisty POS" />
            <ListItem light={isLight} text="Support et contact" />
            <ListItem light={isLight} text="Gestion centralisée — sans complexité" />
          </div>
        </div>
      </section>

      {/* VIDEO PLACEHOLDER */}
      <section className="max-w-5xl mx-auto px-4 pb-10">
        <div className={`rounded-3xl border p-6 md:p-8 ${border} ${card}`}>
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="space-y-2">
              <h3 className={`text-lg font-semibold ${strong}`}>Découvrez Caisty POS en 90 secondes</h3>
              <p className={`text-sm ${muted}`}>
                Vidéo de présentation (bientôt). Parfait pour une campagne publicitaire.
              </p>
            </div>

            <button
              type="button"
              className={`inline-flex items-center justify-center rounded-full px-5 py-2 text-sm font-medium border transition-colors ${
                isLight
                  ? "border-slate-300 bg-white text-slate-700 hover:bg-slate-50"
                  : "border-slate-700 bg-slate-900 text-slate-100 hover:bg-slate-800"
              }`}
              onClick={() => {
                // plus tard: ouvrir une modal vidéo / youtube / mp4
                alert("Vidéo bientôt disponible 🙂");
              }}
            >
              ▶ Lire la vidéo
            </button>
          </div>

          <div className={`mt-5 h-56 rounded-2xl border border-dashed flex items-center justify-center ${
            isLight ? "border-slate-300 bg-slate-50 text-slate-500" : "border-slate-700 bg-slate-900/60 text-slate-400"
          }`}>
            Zone vidéo (YouTube / MP4 / Loom)
          </div>
        </div>
      </section>

      {/* PRIX */}
      <section id="pricing" className="max-w-5xl mx-auto px-4 pb-12 space-y-4">
        <div className="space-y-2">
          <h2 className={`text-xl font-semibold ${strong}`}>Prix (Tunisie)</h2>
          <p className={`text-sm ${muted}`}>
            Les moyens de paiement locaux arrivent bientôt. Pour l’instant : essai gratuit et demande de démo.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-3 text-sm">
          <PlanCardTN
            light={isLight}
            name="Essai"
            price="0 TND"
            subtitle="7 jours"
            bullets={["Sans carte", "Portail inclus", "Test réel"]}
          />
          <PlanCardTN
            light={isLight}
            name="Starter"
            price="À partir de 49 TND/mois"
            subtitle="Pour démarrer"
            bullets={["Une caisse", "Portail client", "Support"]}
            highlight
          />
          <PlanCardTN
            light={isLight}
            name="Pro"
            price="À partir de 99 TND/mois"
            subtitle="Pour grandir"
            bullets={["Fonctions avancées", "Rapports", "Support prioritaire"]}
          />
        </div>
      </section>

      {/* PAIEMENT */}
      <section className="max-w-5xl mx-auto px-4 pb-12 space-y-4">
        <h2 className={`text-xl font-semibold ${strong}`}>Méthodes de paiement sécurisées</h2>
        <div className={`rounded-2xl border p-4 ${border} ${card}`}>
          <p className={`text-sm ${muted}`}>
            Nous activons progressivement des solutions de paiement adaptées à la Tunisie.
            En attendant, vous pouvez commencer gratuitement et demander une démo — nous vous accompagnons personnellement.
          </p>
        </div>
      </section>

      {/* CTA FINAL */}
      <section className="max-w-5xl mx-auto px-4 pb-20">
        <div className={`rounded-3xl border p-6 md:p-8 ${border} ${card}`}>
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="space-y-1">
              <h3 className={`text-lg font-semibold ${strong}`}>Prêt à essayer Caisty POS ?</h3>
              <p className={`text-sm ${muted}`}>Créez votre compte gratuitement et démarrez l’essai sans engagement.</p>
            </div>
            <div className="flex gap-3">
              <Link
                to="/register"
                className="inline-flex items-center justify-center rounded-full bg-emerald-500 px-5 py-2 text-sm font-medium text-slate-950 hover:bg-emerald-400 transition-colors"
              >
                Commencer gratuitement
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

      {/* Petit spacing */}
      <div className="h-6" />
    </div>
  );
}

function Dot() {
  return <span className="mt-1.5 h-2 w-2 rounded-full bg-emerald-500 inline-block" />;
}

function FeatureCard(props: { light: boolean; title: string; text: string }) {
  return (
    <div className={`rounded-2xl border p-4 space-y-2 ${props.light ? "border-slate-200 bg-white" : "border-slate-800 bg-slate-900/70"}`}>
      <div className={`text-sm font-semibold ${props.light ? "text-slate-900" : "text-slate-100"}`}>{props.title}</div>
      <p className={`text-xs ${props.light ? "text-slate-600" : "text-slate-300"}`}>{props.text}</p>
    </div>
  );
}

function AudienceCard(props: { light: boolean; title: string; text: string }) {
  return (
    <div className={`rounded-2xl border p-4 space-y-2 ${props.light ? "border-slate-200 bg-white" : "border-slate-800 bg-slate-900/70"}`}>
      <div className={`text-sm font-semibold ${props.light ? "text-slate-900" : "text-slate-100"}`}>{props.title}</div>
      <p className={`text-xs ${props.light ? "text-slate-600" : "text-slate-300"}`}>{props.text}</p>
    </div>
  );
}

function StepCard(props: { light: boolean; n: number; title: string; text: string }) {
  return (
    <div className={`rounded-2xl border p-4 space-y-2 ${props.light ? "border-slate-200 bg-white" : "border-slate-800 bg-slate-900/70"}`}>
      <div className={`inline-flex h-7 w-7 items-center justify-center rounded-full text-xs font-semibold ${
        props.light ? "bg-emerald-100 text-emerald-600" : "bg-emerald-500/15 text-emerald-300"
      }`}>
        {props.n}
      </div>
      <div className={`text-sm font-semibold ${props.light ? "text-slate-900" : "text-slate-100"}`}>{props.title}</div>
      <p className={`text-xs leading-relaxed ${props.light ? "text-slate-600" : "text-slate-300"}`}>{props.text}</p>
    </div>
  );
}

function ListItem(props: { light: boolean; text: string }) {
  return (
    <div className={`rounded-xl border p-3 flex items-start gap-2 ${props.light ? "border-slate-200 bg-slate-50" : "border-slate-800 bg-slate-950/40"}`}>
      <span className="mt-0.5 text-emerald-500">✓</span>
      <span className={`${props.light ? "text-slate-700" : "text-slate-200"} text-sm`}>{props.text}</span>
    </div>
  );
}

function PlanCardTN(props: {
  light: boolean;
  name: string;
  price: string;
  subtitle: string;
  bullets: string[];
  highlight?: boolean;
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
          <span className={`text-[10px] rounded-full border px-2 py-0.5 ${
            props.light ? "border-slate-200 bg-slate-50 text-slate-700" : "border-slate-700 bg-slate-900 text-slate-300"
          }`}>
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
