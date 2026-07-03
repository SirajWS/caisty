import { useEffect, useId, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  Building2,
  Languages,
  LayoutGrid,
  Minus,
  Monitor,
  Plus,
  Shield,
  ShoppingBag,
  WifiOff,
  type LucideIcon,
} from "lucide-react";
import { formatLandingPlanPriceLine, PRICING } from "../config/pricing";
import { useLanguage } from "../lib/LanguageContext";
import { translations } from "../lib/translations/index";
import { landingTn } from "../lib/translations/landingTn";
import { getSiteMarket } from "../lib/siteMarket";
import { useTheme } from "../lib/theme";
import { useCurrency } from "../lib/useCurrency";
import { applyCaistyPosProductMeta, applyCompanySiteMeta } from "../lib/siteDocumentMeta";

type BillingPeriod = "monthly" | "yearly";

const HERO_IMAGE = "/screenshots/pos-hero-placeholder.png";

const BENTO_ICONS: Record<string, LucideIcon> = {
  offline: WifiOff,
  verticals: ShoppingBag,
  portal: LayoutGrid,
  windows: Monitor,
  i18n: Languages,
  germany: Building2,
};

export default function LandingPage() {
  const { language } = useLanguage();
  const location = useLocation();
  const { theme } = useTheme();
  const { currency } = useCurrency();
  const [billingPeriod, setBillingPeriod] = useState<BillingPeriod>("monthly");
  const market = getSiteMarket();
  const isLight = theme === "light";
  const t = market === "tn" ? landingTn : translations[language].landing;
  const pricingCopy = translations[language].pricing;
  const [openFaq, setOpenFaq] = useState(0);

  useEffect(() => {
    applyCaistyPosProductMeta();
    return () => applyCompanySiteMeta();
  }, []);

  useEffect(() => {
    const hash = location.hash.replace(/^#/, "");
    if (!hash) return;
    const el = document.getElementById(hash);
    if (el) {
      window.requestAnimationFrame(() => {
        el.scrollIntoView({ behavior: "smooth", block: "start" });
      });
    }
  }, [location.hash, location.pathname]);

  const planPriceSuffix =
    billingPeriod === "monthly" ? pricingCopy.priceMonthlySuffix : pricingCopy.priceYearlySuffix;

  const landingPlanPriceLine = (plan: "starter" | "pro") =>
    formatLandingPlanPriceLine(
      PRICING[currency][plan][billingPeriod],
      currency,
      language,
      billingPeriod,
      planPriceSuffix,
    );

  return (
    <div
      className={`pos-landing marketing-site ${isLight ? "" : "marketing-site--dark"}`}
      style={{ background: "var(--mkt-bg)", color: "var(--mkt-text)" }}
    >
      {/* Hero */}
      <section id="product" className="mkt-section scroll-mt-24 border-b" style={{ borderColor: "var(--mkt-border)" }}>
        <div className="mkt-shell">
          <div className="grid gap-12 lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1.4fr)] lg:gap-14 items-center">
            <div className="space-y-8 min-w-0">
              <div className="mkt-eyebrow">
                <span className="mkt-eyebrow-dot" aria-hidden />
                {t.hero.badge}
              </div>
              <h1 className="mkt-display m-0">{t.hero.title}</h1>
              <p className="mkt-lead m-0">{t.hero.description}</p>
              <div className="flex flex-col sm:flex-row flex-wrap gap-3">
                <Link to="/register" className="mkt-btn-primary mkt-btn-primary--flat">
                  {t.hero.ctaPrimary}
                </Link>
                {market === "tn" ? (
                  <a
                    href="mailto:info@caisty.com?subject=D%C3%A9mo%20Caisty%20POS"
                    className="mkt-btn-secondary"
                  >
                    {t.hero.ctaSecondary}
                  </a>
                ) : (
                  <Link to="/pricing" className="mkt-btn-secondary">
                    {t.hero.ctaSecondary}
                  </Link>
                )}
              </div>
              <p className="text-sm m-0" style={{ color: "var(--mkt-text-subtle)" }}>
                {t.hero.trialTrust}
              </p>
            </div>

            <div className="mkt-hero-frame w-full min-w-0">
              <div className="mkt-hero-frame__chrome" aria-hidden>
                <span className="mkt-hero-frame__dot" />
                <span className="mkt-hero-frame__dot" />
                <span className="mkt-hero-frame__dot" />
              </div>
              <div className="mkt-hero-frame__media">
                <img
                  src={HERO_IMAGE}
                  alt={t.demo.heroImageAlt}
                  width={1280}
                  height={800}
                  fetchPriority="high"
                  decoding="async"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Why businesses choose Caisty */}
      <section id="features" className="mkt-section scroll-mt-24" style={{ background: "var(--mkt-bg-muted)" }}>
        <div className="mkt-shell space-y-10">
          <div className="space-y-4 max-w-2xl">
            <h2 className="mkt-section-title m-0">{t.bento.title}</h2>
            <p className="mkt-section-desc m-0">{t.bento.subtitle}</p>
          </div>
          <div className="mkt-bento mkt-bento--features">
            {t.bento.items.map((item) => {
              const Icon = BENTO_ICONS[item.id] ?? LayoutGrid;
              return (
                <article key={item.id} className="mkt-bento-card mkt-bento-card--feature">
                  <div className="mkt-bento-card__icon" aria-hidden>
                    <Icon className="h-5 w-5" strokeWidth={2} />
                  </div>
                  <h3>{item.title}</h3>
                  <p>{item.body}</p>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="mkt-section scroll-mt-24 border-b" style={{ borderColor: "var(--mkt-border)" }}>
        <div className="mkt-shell space-y-10">
          <div className="space-y-4 max-w-2xl">
            <h2 className="mkt-section-title m-0">{t.plans.title}</h2>
            <p className="mkt-section-desc m-0">{t.plans.intro}</p>
          </div>
          <div className="flex justify-center">
            <div className="inline-flex items-center rounded-full border p-1 text-xs" style={{ borderColor: "var(--mkt-border)", background: "var(--mkt-bg-elevated)" }}>
              <button
                type="button"
                onClick={() => setBillingPeriod("monthly")}
                className="px-3 py-1.5 rounded-full transition border-0 cursor-pointer font-semibold"
                style={{
                  background: billingPeriod === "monthly" ? "var(--mkt-bg-muted)" : "transparent",
                  color: billingPeriod === "monthly" ? "var(--mkt-accent-hover)" : "var(--mkt-text-muted)",
                  fontWeight: billingPeriod === "monthly" ? 700 : 600,
                }}
              >
                {pricingCopy.billing.monthly}
              </button>
              <button
                type="button"
                onClick={() => setBillingPeriod("yearly")}
                className="px-3 py-1.5 rounded-full transition border-0 cursor-pointer font-semibold flex items-center gap-1"
                style={{
                  background: billingPeriod === "yearly" ? "var(--mkt-bg-muted)" : "transparent",
                  color: billingPeriod === "yearly" ? "var(--mkt-accent-hover)" : "var(--mkt-text-muted)",
                  fontWeight: billingPeriod === "yearly" ? 700 : 600,
                }}
              >
                {pricingCopy.billing.yearly}
                <span className="hidden sm:inline text-[10px]" style={{ color: "var(--mkt-accent)" }}>
                  {pricingCopy.billing.discount}
                </span>
              </button>
            </div>
          </div>
          <div className="grid gap-5 lg:grid-cols-3">
            <PlanCard name={t.plans.trial.name} badge={t.plans.trial.badge} priceLine={t.plans.trial.priceLine} subline={t.plans.trial.subline} features={t.plans.trial.features} />
            <PlanCard
              name={t.plans.starter.name}
              badge={t.plans.starter.badge}
              recommended={t.plans.starter.recommended}
              priceLine={landingPlanPriceLine("starter")}
              subline={t.plans.starter.subline}
              features={t.plans.starter.features}
              highlight
            />
            <PlanCard name={t.plans.pro.name} badge={t.plans.pro.badge} priceLine={landingPlanPriceLine("pro")} subline={t.plans.pro.subline} features={t.plans.pro.features} />
          </div>
          <p className="text-sm m-0 max-w-3xl" style={{ color: "var(--mkt-text-subtle)" }}>
            {t.plans.note}
          </p>
        </div>
      </section>

      {/* Security */}
      <section id="security" className="mkt-section scroll-mt-24" style={{ background: "var(--mkt-bg-muted)" }}>
        <div className="mkt-shell space-y-10">
          <div className="space-y-4 max-w-2xl">
            <h2 className="mkt-section-title m-0">{t.security.title}</h2>
            <p className="mkt-section-desc m-0">{t.security.subtitle}</p>
          </div>
          <div className="mkt-bento mkt-bento--features">
            {t.security.items.map((item) => (
              <article key={item.title} className="mkt-bento-card mkt-bento-card--feature">
                <h3>{item.title}</h3>
                <p>{item.body}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* Supported hardware */}
      <section id="hardware" className="mkt-section scroll-mt-24 border-b" style={{ borderColor: "var(--mkt-border)" }}>
        <div className="mkt-shell space-y-6 max-w-2xl">
          <h2 className="mkt-section-title m-0">{t.supportedHardware.title}</h2>
          <p className="mkt-section-desc m-0">{t.supportedHardware.intro}</p>
          <ul className="mkt-list-check">
            {t.supportedHardware.items.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
          <p className="text-sm m-0" style={{ color: "var(--mkt-text-subtle)" }}>
            {t.supportedHardware.note}
          </p>
        </div>
      </section>

      {/* Deployment */}
      <section id="install" className="mkt-section scroll-mt-24">
        <div className="mkt-shell">
          <div className="grid gap-10 lg:grid-cols-2 lg:gap-14">
            <div className="space-y-8 min-w-0">
              <div className="space-y-4">
                <h2 className="mkt-section-title m-0">{t.deployment.title}</h2>
                <p className="mkt-section-desc m-0">{t.deployment.subtitle}</p>
              </div>
              <div className="flex flex-wrap gap-2">
                {t.deployment.platforms.map((p) => (
                  <span key={p.label} className={`mkt-platform-pill ${p.status === "available" ? "is-available" : ""}`}>
                    {p.label}
                  </span>
                ))}
              </div>
              <ol className="space-y-4 m-0 p-0 list-none">
                {t.deployment.steps.map((step, i) => (
                  <li key={step} className="flex gap-3 items-start text-sm" style={{ color: "var(--mkt-text)" }}>
                    <span className="mkt-step-num">{i + 1}</span>
                    <span className="pt-0.5">{step}</span>
                  </li>
                ))}
              </ol>
              <p className="text-sm m-0" style={{ color: "var(--mkt-text-subtle)" }}>
                {t.deployment.noteBefore}{" "}
                <span className="font-semibold" style={{ color: "var(--mkt-text)" }}>
                  {t.deployment.noteHighlight}
                </span>{" "}
                {t.deployment.noteAfter}
              </p>
            </div>
            <div className="mkt-bento m-0 grid-cols-1 gap-3">
              {t.deployment.channels.map((ch) => (
                <article key={ch.title} className="mkt-bento-card">
                  <h3>{ch.title}</h3>
                  <p>{ch.body}</p>
                </article>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="mkt-section scroll-mt-24" style={{ background: "var(--mkt-bg-muted)" }}>
        <div className="mkt-shell space-y-8">
          <h2 className="mkt-section-title m-0">{t.faq.title}</h2>
          <div className="max-w-3xl space-y-3">
            {t.faq.items.map((item, idx) => (
              <FaqItem
                key={item.q}
                question={item.q}
                answer={item.a}
                isOpen={openFaq === idx}
                onToggle={() => setOpenFaq((cur) => (cur === idx ? -1 : idx))}
              />
            ))}
          </div>
        </div>
      </section>

      {/* Fiscal */}
      <section id="fiscal" className="mkt-section scroll-mt-24">
        <div className="mkt-shell max-w-3xl">
          <div className="mkt-fiscal-box space-y-4 text-sm">
            <h2>
              <Shield className="h-5 w-5 shrink-0" strokeWidth={2} aria-hidden />
              {t.fiscal.title}
            </h2>
            {t.fiscal.paragraphs.map((paragraph) => (
              <p key={paragraph} className="m-0" style={{ color: "var(--mkt-text-muted)" }}>
                {paragraph}
              </p>
            ))}
            <p className="m-0 font-medium" style={{ color: "var(--mkt-text-muted)" }}>
              {t.fiscal.disclaimer}
            </p>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="mkt-cta-band mkt-section">
        <div className="mkt-shell">
          <div className="max-w-2xl mx-auto text-center space-y-6">
            <h2 className="mkt-section-title m-0">{t.cta.headline}</h2>
            <p className="mkt-section-desc mx-auto m-0">{t.cta.subline}</p>
            <div className="flex flex-col sm:flex-row flex-wrap justify-center gap-3 pt-2">
              <Link to="/register" className="mkt-btn-primary mkt-btn-primary--flat">
                {t.cta.ctaPrimary}
              </Link>
              {market === "tn" ? (
                <a href="mailto:info@caisty.com?subject=D%C3%A9mo%20Caisty%20POS" className="mkt-btn-secondary">
                  {t.cta.ctaSecondary}
                </a>
              ) : (
                <Link to="/pricing" className="mkt-btn-secondary">
                  {t.cta.ctaSecondary}
                </Link>
              )}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

function FaqItem(props: { question: string; answer: string; isOpen: boolean; onToggle: () => void }) {
  const panelId = useId();
  const triggerId = useId();
  return (
    <div className="mkt-faq-item">
      <button
        type="button"
        id={triggerId}
        className="mkt-faq-trigger"
        aria-expanded={props.isOpen}
        aria-controls={panelId}
        onClick={props.onToggle}
      >
        <span>{props.question}</span>
        <span className="mkt-faq-icon" aria-hidden>
          {props.isOpen ? <Minus className="h-3.5 w-3.5" /> : <Plus className="h-3.5 w-3.5" />}
        </span>
      </button>
      {props.isOpen ? (
        <div id={panelId} role="region" aria-labelledby={triggerId} className="mkt-faq-panel">
          {props.answer}
        </div>
      ) : null}
    </div>
  );
}

function PlanCard(props: {
  name: string;
  badge: string;
  priceLine: string;
  subline: string;
  features: string[];
  highlight?: boolean;
  recommended?: string;
}) {
  return (
    <div className={`mkt-plan-card ${props.highlight ? "is-highlight" : ""}`}>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="text-sm font-bold" style={{ color: "var(--mkt-text)" }}>
          {props.name}
        </div>
        <div className="flex flex-wrap items-center gap-2 justify-end">
          {props.recommended ? <span className="mkt-badge mkt-badge--accent">{props.recommended}</span> : null}
          <span className="mkt-badge">{props.badge}</span>
        </div>
      </div>
      <div className="space-y-1">
        <div className="mkt-plan-price">{props.priceLine}</div>
        <div className="text-sm" style={{ color: "var(--mkt-text-muted)" }}>
          {props.subline}
        </div>
      </div>
      {props.features.length > 0 ? (
        <ul className="mkt-list-check">
          {props.features.map((d) => (
            <li key={d}>{d}</li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
