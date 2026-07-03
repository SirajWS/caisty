import { useEffect } from "react";
import { Link } from "react-router-dom";
import { Cloud, LayoutGrid, Monitor } from "lucide-react";
import { useLanguage } from "../lib/LanguageContext";
import { translations } from "../lib/translations/index";
import { companyTn } from "../lib/translations/companyTn";
import { TECH_STACK_ICONS } from "../lib/translations/common";
import { getSiteMarket } from "../lib/siteMarket";
import { useTheme } from "../lib/theme";
import { POS_LANDING_PATH } from "../config/marketingRoutes";
import { applyCompanySiteMeta } from "../lib/siteDocumentMeta";
import { TechStackCardGrid } from "../components/TechStackCardGrid";

const PRODUCT_ICONS = {
  pos: Monitor,
  portal: LayoutGrid,
  cloud: Cloud,
} as const;

function cardHref(id: string): string {
  if (id === "portal") return "/register";
  if (id === "cloud") return `${POS_LANDING_PATH}#portal`;
  return POS_LANDING_PATH;
}

export default function CompanyPage() {
  const { language } = useLanguage();
  const { theme } = useTheme();
  const market = getSiteMarket();
  const isLight = theme === "light";
  const t = market === "tn" ? companyTn : translations[language].company;

  useEffect(() => {
    applyCompanySiteMeta();
  }, []);

  return (
    <div className={`company-page marketing-site ${isLight ? "" : "marketing-site--dark"}`} style={{ background: "var(--mkt-bg)" }}>
      {/* Hero */}
      <section className="mkt-section border-b" style={{ borderColor: "var(--mkt-border)" }}>
        <div className="mkt-shell">
          <div className="max-w-3xl space-y-8">
            <div className="mkt-eyebrow">
              <span className="mkt-eyebrow-dot" aria-hidden />
              {t.hero.badge}
            </div>
            <h1 className="mkt-display">{t.hero.headline}</h1>
            <p className="mkt-lead m-0">{t.hero.subtitle}</p>
            <div className="flex flex-col sm:flex-row flex-wrap gap-3 pt-2">
              <Link to={POS_LANDING_PATH} className="mkt-btn-primary">
                {t.hero.ctaExplore}
              </Link>
              <Link to="/register" className="mkt-btn-secondary">
                {t.hero.ctaRegister}
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Trust */}
      <section className="mkt-section" style={{ background: "var(--mkt-bg-muted)" }}>
        <div className="mkt-shell space-y-10">
          <div className="space-y-4 max-w-2xl">
            <h2 className="mkt-section-title">{t.trust.title}</h2>
            <p className="mkt-section-desc m-0">{t.trust.subtitle}</p>
          </div>
          <div className="mkt-bento mkt-bento--trust">
            {t.trust.points.map((point) => (
              <article key={point.title} className="mkt-bento-card">
                <h3>{point.title}</h3>
                <p>{point.body}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* What we build — 3 cards */}
      <section className="mkt-section border-b" style={{ borderColor: "var(--mkt-border)" }}>
        <div className="mkt-shell space-y-10">
          <div className="space-y-4 max-w-2xl">
            <h2 className="mkt-section-title">{t.whatWeBuild.title}</h2>
            <p className="mkt-section-desc m-0">{t.whatWeBuild.subtitle}</p>
          </div>
          <div className="mkt-product-grid">
            {t.whatWeBuild.cards.map((card) => {
              const Icon = PRODUCT_ICONS[card.id as keyof typeof PRODUCT_ICONS] ?? Monitor;
              return (
                <article key={card.id} className="mkt-product-card">
                  <div
                    className="inline-flex h-11 w-11 items-center justify-center rounded-xl border"
                    style={{
                      borderColor: "color-mix(in srgb, var(--mkt-accent) 30%, var(--mkt-border))",
                      background: "var(--mkt-accent-soft)",
                      color: "var(--mkt-accent)",
                    }}
                    aria-hidden
                  >
                    <Icon className="h-5 w-5" strokeWidth={2} />
                  </div>
                  <h3>{card.title}</h3>
                  <p>{card.body}</p>
                  <Link to={cardHref(card.id)}>{card.cta} →</Link>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      {/* About / Facts */}
      <section className="mkt-section">
        <div className="mkt-shell space-y-10">
          <h2 className="mkt-section-title">{t.about.title}</h2>
          <dl className="mkt-facts">
            {t.about.facts.map((fact) => (
              <div key={fact.label} className="mkt-fact">
                <dt>{fact.label}</dt>
                <dd>{fact.value}</dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      {/* Technology */}
      <section className="mkt-section border-t" style={{ borderColor: "var(--mkt-border)", background: "var(--mkt-bg-muted)" }}>
        <div className="mkt-shell space-y-8">
          <div className="space-y-3 max-w-2xl">
            <h2 className="mkt-section-title">{t.tech.title}</h2>
            <p className="mkt-section-desc m-0">{t.tech.subtitle}</p>
          </div>
          <TechStackCardGrid title="" items={TECH_STACK_ICONS} compact />
        </div>
      </section>

      {/* CTA */}
      <section className="mkt-cta-band mkt-section">
        <div className="mkt-shell">
          <div className="max-w-2xl mx-auto text-center space-y-6">
            <h2 className="mkt-section-title">{t.cta.headline}</h2>
            <p className="mkt-section-desc mx-auto m-0">{t.cta.subline}</p>
            <div className="flex flex-col sm:flex-row flex-wrap justify-center gap-3 pt-2">
              <Link to={POS_LANDING_PATH} className="mkt-btn-primary">
                {t.cta.ctaExplore}
              </Link>
              <Link to="/register" className="mkt-btn-secondary">
                {t.cta.ctaRegister}
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
