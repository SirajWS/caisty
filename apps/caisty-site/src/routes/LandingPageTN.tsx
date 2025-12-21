// apps/caisty-site/src/routes/LandingPageTN.tsx
import { Link } from "react-router-dom";
import { useTheme } from "../lib/theme";
import { useMemo, useState } from "react";

export default function LandingPageTN() {
  const { theme } = useTheme();
  const isLight = theme === "light";

  const pageBg = isLight ? "bg-slate-50 text-slate-900" : "bg-slate-950 text-slate-50";
  const strong = isLight ? "text-slate-900" : "text-slate-50";
  const muted = isLight ? "text-slate-600" : "text-slate-300";
  const border = isLight ? "border-slate-200" : "border-slate-800";
  const card = isLight ? "bg-white" : "bg-slate-900/70";

  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  // Screenshots für Video-Section unten
  const screenshots = useMemo(
    () => [
      { id: 1, src: "/tn/pos-1.png", alt: "Caisty POS — écran de vente", title: "Écran de vente" },
      { id: 2, src: "/tn/pos-2.png", alt: "Caisty POS — panier / commande", title: "Panier" },
      { id: 3, src: "/tn/pos-3.png", alt: "Caisty POS — clôture / rapport", title: "Rapport" },
    ],
    []
  );

  return (
    <div className={`min-h-screen ${pageBg}`}>
      {/* HERO */}
      <section className="max-w-5xl mx-auto px-4 pt-16 pb-10">
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
              Caisty POS est une solution de caisse rapide, avec un portail cloud clair.
              Gérez vos licences, vos appareils et vos factures — sans complexité.
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
            En attendant, vous pouvez commencer gratuitement et demander une démo — nous vous accompagnons.
          </p>
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
          Créez un compte, téléchargez Caisty POS depuis votre portail, entrez la clé de licence — et commencez.
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

      {/* INSTALLATION */}
      <section className="max-w-5xl mx-auto px-4 pb-10">
        <div className={`rounded-3xl border p-6 md:p-7 ${border} ${card}`}>
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
        </div>
      </section>

      {/* Video-Box und Screenshots ganz unten */}
      <section className="max-w-5xl mx-auto px-4 pb-20 pt-12">
        {/* Video-Box */}
        <div
          className={`rounded-3xl border overflow-hidden shadow-xl ${
            isLight
              ? "border-slate-200 bg-white shadow-emerald-200/40"
              : "border-slate-800 bg-slate-900/70 shadow-emerald-900/40"
          }`}
        >
          <div className="aspect-video bg-slate-900 flex items-center justify-center relative">
            {/* Platzhalter für Video */}
            <div className="absolute inset-0 flex items-center justify-center">
              <button
                className={`rounded-full p-4 ${
                  isLight
                    ? "bg-white/90 text-slate-900 hover:bg-white"
                    : "bg-slate-800/90 text-slate-100 hover:bg-slate-800"
                } transition-all hover:scale-110`}
                aria-label="Lire la vidéo"
                onClick={() => {
                  alert("Vidéo bientôt disponible 🙂");
                }}
              >
                <svg
                  className="w-12 h-12"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M8 5v14l11-7z" />
                </svg>
              </button>
            </div>
            {/* Optional: Video-Thumbnail als Hintergrund */}
            <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/20 to-slate-900/80" />
          </div>
        </div>

        {/* 3 Screenshots direkt unter dem Video */}
        <div className="grid grid-cols-3 gap-4 mt-6">
          {screenshots.map((screenshot) => (
            <button
              key={screenshot.id}
              onClick={() => setSelectedImage(screenshot.src)}
              className={`group rounded-xl border overflow-hidden transition-all hover:scale-105 relative ${
                isLight
                  ? "border-slate-200 bg-white hover:border-emerald-300"
                  : "border-slate-800 bg-slate-900/70 hover:border-emerald-500/50"
              }`}
            >
              <div className="aspect-video bg-slate-800 flex items-center justify-center relative">
                {/* Platzhalter für Bild */}
                <span
                  className={`text-xs transition-opacity ${
                    isLight ? "text-slate-400" : "text-slate-500"
                  }`}
                >
                  {screenshot.title}
                </span>
                {/* Hover-Overlay */}
                <div className="absolute inset-0 bg-emerald-500/0 group-hover:bg-emerald-500/10 transition-colors flex items-center justify-center">
                  <svg
                    className="w-8 h-8 text-emerald-400 opacity-0 group-hover:opacity-100 transition-opacity"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v6m3-3H7"
                    />
                  </svg>
                </div>
              </div>
            </button>
          ))}
        </div>
      </section>

      {/* Screenshot/Image Modal */}
      {selectedImage && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4 backdrop-blur-sm"
          onClick={() => setSelectedImage(null)}
        >
          <div className="relative max-w-5xl w-full">
            <button
              className="absolute -top-12 right-0 text-white hover:text-slate-300 transition-colors z-10"
              onClick={() => setSelectedImage(null)}
              aria-label="Fermer"
            >
              <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            <div
              className={`rounded-xl border overflow-hidden ${
                isLight
                  ? "border-slate-300 bg-white"
                  : "border-slate-700 bg-slate-900"
              }`}
            >
              <img
                src={selectedImage}
                alt="Screenshot"
                className="w-full h-auto max-h-[80vh] object-contain"
                onClick={(e) => e.stopPropagation()}
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.style.display = "none";
                  const parent = target.parentElement;
                  if (parent) {
                    parent.innerHTML = `
                      <div class="p-20 text-center ${
                        isLight ? "text-slate-600" : "text-slate-400"
                      }">
                        <p class="text-sm">Image en cours de chargement...</p>
                        <p class="text-xs mt-2">Chemin: ${selectedImage}</p>
                      </div>
                    `;
                  }
                }}
              />
            </div>
          </div>
        </div>
      )}
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
      <div
        className={`inline-flex h-7 w-7 items-center justify-center rounded-full text-xs font-semibold ${
          props.light ? "bg-emerald-100 text-emerald-600" : "bg-emerald-500/15 text-emerald-300"
        }`}
      >
        {props.n}
      </div>
      <div className={`text-sm font-semibold ${props.light ? "text-slate-900" : "text-slate-100"}`}>{props.title}</div>
      <p className={`text-xs leading-relaxed ${props.light ? "text-slate-600" : "text-slate-300"}`}>{props.text}</p>
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
          <span
            className={`text-[10px] rounded-full border px-2 py-0.5 ${
              props.light ? "border-slate-200 bg-slate-50 text-slate-700" : "border-slate-700 bg-slate-900 text-slate-300"
            }`}
          >
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
