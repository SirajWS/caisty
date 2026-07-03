import { Link, useLocation } from "react-router-dom";
import { useLanguage } from "../lib/LanguageContext";
import { translations } from "../lib/translations/index";
import { TechStackCardGrid } from "./TechStackCardGrid";
import { POS_LANDING_PATH } from "../config/marketingRoutes";

export default function MarketingPreFooter() {
  const { pathname } = useLocation();
  const showProductSection = pathname !== POS_LANDING_PATH;
  const { language } = useLanguage();
  const t = translations[language].common;
  const p = t.preFooter;
  const pm = t.productMenu;

  return (
    <div className="border-t" style={{ borderColor: "var(--mkt-border)", background: "var(--mkt-bg-muted)" }}>
      <div className="mkt-shell py-14 sm:py-16 space-y-14 sm:space-y-16">
        {showProductSection ? (
          <section aria-labelledby="prefooter-products-heading">
            <div className="space-y-6 max-w-3xl">
              <h2 id="prefooter-products-heading" className="mkt-section-title text-xl sm:text-2xl m-0">
                {p.ourProducts}
              </h2>
              <article className="mkt-product-card">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h3 className="m-0 text-lg font-bold" style={{ color: "var(--mkt-text)" }}>
                    {pm.posTitle}
                  </h3>
                  <span className="mkt-badge" style={{ color: "var(--mkt-accent)", borderColor: "color-mix(in srgb, var(--mkt-accent) 35%, var(--mkt-border))" }}>
                    {pm.posStatus}
                  </span>
                </div>
                <ul className="mkt-list-check">
                  {p.posHighlights.map((line) => (
                    <li key={line}>{line}</li>
                  ))}
                </ul>
                <Link to={POS_LANDING_PATH} className="mkt-btn-secondary self-start">
                  {p.posCtaLearn}
                </Link>
                <p className="text-xs m-0 pt-1" style={{ color: "var(--mkt-text-subtle)" }}>
                  {pm.worktrackNavSoon}
                </p>
              </article>
            </div>
          </section>
        ) : null}

        <section aria-labelledby="prefooter-trust-heading">
          <h2 id="prefooter-trust-heading" className="mkt-section-title text-xl sm:text-2xl m-0 mb-6">
            {p.trustTitle}
          </h2>
          <div className="mkt-bento mkt-bento--trust">
            {p.trustPoints.map((pt) => (
              <article key={pt} className="mkt-bento-card text-center">
                <p className="m-0 text-sm font-semibold" style={{ color: "var(--mkt-text)" }}>
                  {pt}
                </p>
              </article>
            ))}
          </div>
        </section>

        <section aria-labelledby="prefooter-tech-heading">
          <h2 id="prefooter-tech-heading" className="mkt-section-title text-xl sm:text-2xl m-0 mb-6">
            {p.techTitle}
          </h2>
          <TechStackCardGrid title="" items={p.techStack} compact />
        </section>
      </div>
    </div>
  );
}
