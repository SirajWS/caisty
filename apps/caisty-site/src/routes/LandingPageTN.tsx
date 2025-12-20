// src/routes/LandingPageTN.tsx
import { Link } from "react-router-dom";
import { useLanguage } from "../lib/LanguageContext";
import { useTheme } from "../lib/theme";

export default function LandingPageTN() {
  const { language } = useLanguage();
  const { theme } = useTheme();
  const isLight = theme === "light";
  const pageBg = isLight ? "bg-slate-50 text-slate-900" : "bg-slate-950 text-slate-50";

  // super simple text map (später kannst du es in translations auslagern)
  const isAr = language === "ar";
  const t = isAr
    ? {
        badge: "نسخة تونس 🇹🇳",
        title: "كاشيّة ذكيّة للمطاعم",
        titleHighlight: "ساهلة و تخدمك كل نهار",
        desc: "بيعك، الكاشيّة، والتسيير… الكل في بلاصة وحدة. مناسبة للمطاعم، السناكات، القهاوي و المحلات.",
        ctaPrimary: "جرّب مجّانًا",
        ctaSecondary: "شوف الأسعار",
        whoTitle: "لشكون Caisty؟",
        whoItems: ["مطاعم", "سناكات / فاست فود", "قهاوي", "محلات عصرية"],
        howTitle: "كيفاش تخدم؟",
        howSteps: ["ركّب الكاشيّة", "ادخل للبورطال", "سيّر خدمتك و راقب المبيعات"],
        featuresTitle: "شنوّة يربحك Caisty؟",
        features: [
          { title: "كاشيّة سريعة", text: "بيع سريع و واجهة واضحة للڨارسون." },
          { title: "بورطال كلاود", text: "تراقب خدمتك من أي بلاصة." },
          { title: "إدارة الأجهزة", text: "تعرف شكون أونلاين و شكون أوفلاين." },
        ],
        pricingTitle: "الأسعار (تونس)",
        pricingNote: "طرق دفع محلية قريبًا. توا تنجم تجرّب و تبعث طلب ديمو.",
        plans: [
          { name: "تجربة", price: "0 TND", note: "7 أيّام", points: ["بدون بطاقة", "بورطال", "تجربة حقيقية"] },
          { name: "Starter", price: "ابتداءً من 49 TND/شهر", note: "للصغار", points: ["كاشيّة + بورطال", "متابعة الأجهزة", "دعم"] },
          { name: "Pro", price: "ابتداءً من 79 TND/شهر", note: "للأكثر نشاط", points: ["خصائص أكثر", "تقارير", "أولوية دعم"] },
        ],
        finalTitle: "تحب ديمو؟",
        finalDesc: "خلي رقمك/إيميلك و نحكيو معاك. ولا ابدأ تجربة مجّانية.",
        ctaDemo: "اطلب ديمو",
      }
    : {
        badge: "Version Tunisie 🇹🇳",
        title: "Une caisse moderne",
        titleHighlight: "simple et efficace",
        desc: "Ventes, caisse et gestion — tout en un. Parfait pour restaurants, snacks, cafés et boutiques modernes.",
        ctaPrimary: "Commencer gratuit",
        ctaSecondary: "Voir les prix",
        whoTitle: "Pour qui ?",
        whoItems: ["Restaurants", "Snacks / Fast-food", "Cafés", "Boutiques modernes"],
        howTitle: "Comment ça marche ?",
        howSteps: ["Installez la caisse", "Connectez-vous au portail", "Gérez et suivez vos ventes"],
        featuresTitle: "Pourquoi Caisty ?",
        features: [
          { title: "Caisse rapide", text: "Une interface claire, pensée pour le service." },
          { title: "Portail cloud", text: "Gardez tout sous contrôle, même à distance." },
          { title: "Gestion des appareils", text: "Suivez les appareils connectés en temps réel." },
        ],
        pricingTitle: "Prix (Tunisie)",
        pricingNote: "Les moyens de paiement locaux arrivent bientôt. Pour l’instant: essai + demande de démo.",
        plans: [
          { name: "Essai", price: "0 TND", note: "7 jours", points: ["Sans carte", "Portail inclus", "Test réel"] },
          { name: "Starter", price: "À partir de 49 TND/mois", note: "Pour démarrer", points: ["Caisse + portail", "Suivi appareils", "Support"] },
          { name: "Pro", price: "À partir de 79 TND/mois", note: "Pour grandir", points: ["Plus de fonctions", "Rapports", "Support prioritaire"] },
        ],
        finalTitle: "Besoin d’une démo ?",
        finalDesc: "Laissez votre contact — on vous rappelle. Ou démarrez un essai gratuit.",
        ctaDemo: "Demander une démo",
      };

  return (
    <div className={`min-h-screen ${pageBg}`}>
      {/* HERO */}
      <section className="max-w-5xl mx-auto px-4 pt-20 pb-14">
        <div
          className={`inline-flex items-center rounded-full border px-3 py-1 text-[11px] font-medium mb-6 ${
            isLight
              ? "border-emerald-300 bg-emerald-50 text-emerald-600"
              : "border-emerald-500/30 bg-emerald-500/10 text-emerald-300"
          }`}
        >
          {t.badge}
        </div>

        <div className="grid gap-10 md:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)] items-center">
          <div className="space-y-6">
            <h1 className={`text-3xl sm:text-4xl md:text-5xl font-semibold leading-tight ${isLight ? "text-slate-900" : "text-slate-50"}`}>
              {t.title} <span className="text-emerald-500">{t.titleHighlight}</span>
            </h1>
            <p className={`text-sm sm:text-base max-w-xl ${isLight ? "text-slate-600" : "text-slate-300"}`}>
              {t.desc}
            </p>

            <div className="flex flex-wrap gap-3 text-sm">
              <Link
                to="/register"
                className="inline-flex items-center justify-center rounded-full bg-emerald-500 px-5 py-2 text-sm font-medium text-slate-950 hover:bg-emerald-400 transition-colors"
              >
                {t.ctaPrimary}
              </Link>
              <a
                href="#pricing"
                className={`inline-flex items-center justify-center rounded-full border px-5 py-2 text-sm font-medium transition-colors ${
                  isLight
                    ? "border-slate-300 text-slate-700 hover:bg-slate-50"
                    : "border-slate-700 text-slate-100 hover:bg-slate-800"
                }`}
              >
                {t.ctaSecondary}
              </a>
            </div>
          </div>

          {/* simple mock */}
          <div className={`rounded-3xl border p-4 shadow-xl ${isLight ? "border-slate-200 bg-white" : "border-slate-800 bg-slate-900/70"}`}>
            <div className={`text-[11px] uppercase tracking-wide ${isLight ? "text-slate-500" : "text-slate-400"}`}>
              Caisty • TN
            </div>
            <div className={`mt-3 rounded-2xl border p-4 ${isLight ? "border-slate-200 bg-slate-50" : "border-slate-800 bg-slate-950/80"}`}>
              <div className={`text-xs font-semibold ${isLight ? "text-slate-900" : "text-slate-200"}`}>
                {isAr ? "لوحة تحكّم" : "Portail • Dashboard"}
              </div>
              <div className="mt-3 grid gap-3 text-[11px]">
                <div className={`rounded-xl border p-3 ${isLight ? "border-slate-200 bg-white" : "border-slate-800 bg-slate-900/80"}`}>
                  <div className={`${isLight ? "text-slate-600" : "text-slate-400"}`}>{isAr ? "مبيعات اليوم" : "Ventes du jour"}</div>
                  <div className="text-2xl font-semibold text-emerald-500">—</div>
                </div>
                <div className={`rounded-xl border p-3 ${isLight ? "border-slate-200 bg-white" : "border-slate-800 bg-slate-900/80"}`}>
                  <div className={`${isLight ? "text-slate-600" : "text-slate-400"}`}>{isAr ? "الأجهزة" : "Appareils"}</div>
                  <div className="text-2xl font-semibold text-emerald-500">—</div>
                </div>
              </div>
              <div className={`mt-3 text-[11px] ${isLight ? "text-slate-600" : "text-slate-400"}`}>
                {isAr ? "تجربة بسيطة… و من بعد نطورو معاك." : "Simple à démarrer — on évolue avec vous."}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* WHO */}
      <section className="max-w-5xl mx-auto px-4 pb-10 space-y-4">
        <h2 className={`text-xl font-semibold ${isLight ? "text-slate-900" : "text-slate-50"}`}>{t.whoTitle}</h2>
        <div className="grid gap-4 md:grid-cols-4 text-sm">
          {t.whoItems.map((x, i) => (
            <MiniCard key={i} text={x} />
          ))}
        </div>
      </section>

      {/* HOW */}
      <section className="max-w-5xl mx-auto px-4 pb-10 space-y-4">
        <h2 className={`text-xl font-semibold ${isLight ? "text-slate-900" : "text-slate-50"}`}>{t.howTitle}</h2>
        <div className="grid gap-4 md:grid-cols-3 text-sm">
          {t.howSteps.map((x, i) => (
            <StepCard key={i} number={i + 1} text={x} />
          ))}
        </div>
      </section>

      {/* FEATURES */}
      <section className="max-w-5xl mx-auto px-4 pb-10 space-y-4">
        <h2 className={`text-xl font-semibold ${isLight ? "text-slate-900" : "text-slate-50"}`}>{t.featuresTitle}</h2>
        <div className="grid gap-4 md:grid-cols-3 text-sm">
          {t.features.map((f, i) => (
            <FeatureCard key={i} title={f.title} text={f.text} />
          ))}
        </div>
      </section>

      {/* PRICING */}
      <section id="pricing" className="max-w-5xl mx-auto px-4 pb-14 space-y-4">
        <h2 className={`text-xl font-semibold ${isLight ? "text-slate-900" : "text-slate-50"}`}>{t.pricingTitle}</h2>
        <p className={`text-sm ${isLight ? "text-slate-600" : "text-slate-300"}`}>{t.pricingNote}</p>

        <div className="grid gap-4 md:grid-cols-3 text-sm">
          {t.plans.map((p, i) => (
            <PlanCardTN key={i} name={p.name} price={p.price} note={p.note} points={p.points} highlight={p.name === "Starter"} />
          ))}
        </div>
      </section>

      {/* FINAL CTA */}
      <section className="max-w-5xl mx-auto px-4 pb-20">
        <div className={`rounded-3xl border p-6 md:p-8 ${isLight ? "border-slate-200 bg-white" : "border-slate-800 bg-slate-900/70"}`}>
          <h3 className={`text-lg font-semibold ${isLight ? "text-slate-900" : "text-slate-100"}`}>{t.finalTitle}</h3>
          <p className={`mt-2 text-sm ${isLight ? "text-slate-600" : "text-slate-300"}`}>{t.finalDesc}</p>
          <div className="mt-4 flex flex-wrap gap-3">
            <Link
              to="/register"
              className="inline-flex items-center justify-center rounded-full bg-emerald-500 px-5 py-2 text-sm font-medium text-slate-950 hover:bg-emerald-400 transition-colors"
            >
              {t.ctaPrimary}
            </Link>
            <Link
              to="/contact"
              className={`inline-flex items-center justify-center rounded-full border px-5 py-2 text-sm font-medium transition-colors ${
                isLight ? "border-slate-300 text-slate-700 hover:bg-slate-50" : "border-slate-700 text-slate-100 hover:bg-slate-800"
              }`}
            >
              {t.ctaDemo}
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}

function MiniCard({ text }: { text: string }) {
  const { theme } = useTheme();
  const isLight = theme === "light";
  return (
    <div className={`rounded-2xl border p-4 text-xs ${isLight ? "border-slate-200 bg-white text-slate-700" : "border-slate-800 bg-slate-900/70 text-slate-300"}`}>
      {text}
    </div>
  );
}

function StepCard({ number, text }: { number: number; text: string }) {
  const { theme } = useTheme();
  const isLight = theme === "light";
  return (
    <div className={`rounded-2xl border p-4 space-y-2 ${isLight ? "border-slate-200 bg-white" : "border-slate-800 bg-slate-900/70"}`}>
      <div className={`inline-flex h-6 w-6 items-center justify-center rounded-full text-[11px] font-semibold ${isLight ? "bg-emerald-100 text-emerald-700" : "bg-emerald-500/15 text-emerald-300"}`}>
        {number}
      </div>
      <div className={`text-xs ${isLight ? "text-slate-700" : "text-slate-300"}`}>{text}</div>
    </div>
  );
}

function FeatureCard({ title, text }: { title: string; text: string }) {
  const { theme } = useTheme();
  const isLight = theme === "light";
  return (
    <div className={`rounded-2xl border p-4 space-y-2 ${isLight ? "border-slate-200 bg-white" : "border-slate-800 bg-slate-900/70"}`}>
      <div className={`text-sm font-medium ${isLight ? "text-slate-900" : "text-slate-100"}`}>{title}</div>
      <p className={`text-xs ${isLight ? "text-slate-600" : "text-slate-300"}`}>{text}</p>
    </div>
  );
}

function PlanCardTN(props: { name: string; price: string; note: string; points: string[]; highlight?: boolean }) {
  const { theme } = useTheme();
  const isLight = theme === "light";

  const style = props.highlight
    ? isLight
      ? "border-emerald-300 shadow-lg shadow-emerald-200/40 bg-white"
      : "border-emerald-500/70 shadow-lg shadow-emerald-900/40 bg-slate-900/70"
    : isLight
      ? "border-slate-200 bg-white"
      : "border-slate-800 bg-slate-900/70";

  return (
    <div className={`rounded-2xl border p-4 space-y-3 text-xs sm:text-sm ${style}`}>
      <div className="flex items-center justify-between">
        <div className={`text-sm font-semibold ${isLight ? "text-slate-900" : "text-slate-100"}`}>{props.name}</div>
      </div>
      <div className="text-lg font-semibold text-emerald-400">{props.price}</div>
      <div className={`text-[11px] ${isLight ? "text-slate-600" : "text-slate-400"}`}>{props.note}</div>
      <ul className={`mt-2 space-y-1 text-[11px] ${isLight ? "text-slate-700" : "text-slate-300"}`}>
        {props.points.map((p, i) => (
          <li key={i}>• {p}</li>
        ))}
      </ul>
    </div>
  );
}
