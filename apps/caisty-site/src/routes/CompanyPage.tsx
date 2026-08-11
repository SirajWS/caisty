import { useEffect } from "react";
import { Link } from "react-router-dom";
import { useLanguage } from "../lib/LanguageContext";
import { translations } from "../lib/translations/index";
import { companyTn } from "../lib/translations/companyTn";
import { getSiteMarket } from "../lib/siteMarket";
import { useTheme } from "../lib/theme";
import { POS_LANDING_PATH } from "../config/marketingRoutes";
import { applyCompanySiteMeta } from "../lib/siteDocumentMeta";

const POS_IMAGE = "/screenshots/CaistyPosDarkMode.png";
const BUSINESS_DASHBOARD = "/screenshots/caisty-business-dashboard-tight.png";
const BUSINESS_REPORTS = "/screenshots/caisty-business-reports-tight.png";
const BUSINESS_MOBILE = "/screenshots/caisty-business-mobile.png";

export default function CompanyPage() {
  const { language } = useLanguage();
  const { theme } = useTheme();
  const market = getSiteMarket();
  const isLight = theme === "light";
  const t = market === "tn" ? companyTn : translations[language].company;

  useEffect(() => {
    applyCompanySiteMeta();
  }, []);

  const aboutParagraphs = t.about.body.split("\n\n").filter(Boolean);

  return (
    <div
      className={`company-page marketing-site ${isLight ? "" : "marketing-site--dark"}`}
      style={{ background: "var(--mkt-bg)" }}
    >
      {/* A. Company Hero */}
      <section className="mkt-section company-page__hero border-b" style={{ borderColor: "var(--mkt-border)" }}>
        <div className="mkt-shell company-page__shell">
          <div className="company-page__hero-grid">
            <div className="company-page__hero-copy">
              <div className="mkt-eyebrow">
                <span className="mkt-eyebrow-dot" aria-hidden />
                {t.hero.badge}
              </div>
              <h1 className="mkt-display company-page__hero-title m-0">{t.hero.headline}</h1>
              <p className="mkt-lead company-page__read m-0">{t.hero.subtitle}</p>
              <div className="company-page__hero-actions">
                <a href="#products" className="mkt-btn-primary">
                  {t.hero.ctaProducts}
                </a>
                <a href="#about" className="mkt-btn-secondary">
                  {t.hero.ctaAbout}
                </a>
              </div>
            </div>

            <aside className="company-page__hero-platform" aria-label={t.hero.platformLabel}>
              <p className="company-page__hero-platform-label">{t.hero.platformLabel}</p>
              <ol className="company-page__hero-modules">
                {t.platform.products.map((product, index) => (
                  <li
                    key={product.id}
                    className={`company-page__hero-module${product.id === "staff" ? " company-page__hero-module--soon" : ""}`}
                  >
                    <span className="company-page__hero-module-index" aria-hidden>
                      {String(index + 1).padStart(2, "0")}
                    </span>
                    <div className="company-page__hero-module-copy">
                      <div className="company-page__hero-module-head">
                        <span className="company-page__hero-module-name">{product.title}</span>
                        <span className="company-page__hero-module-status">{product.status}</span>
                      </div>
                      <span className="company-page__hero-module-line" aria-hidden />
                    </div>
                  </li>
                ))}
              </ol>
            </aside>
          </div>
        </div>
      </section>

      {/* B. Trust strip */}
      <section
        className="company-page__trust-bar"
        style={{ background: "var(--mkt-bg-muted)", borderColor: "var(--mkt-border)" }}
      >
        <div className="mkt-shell company-page__shell">
          <ul className="company-page__trust-list">
            {t.trustBar.items.map((item) => (
              <li key={item} className="company-page__trust-item">
                <span className="company-page__trust-mark" aria-hidden />
                {item}
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* C. Platform overview */}
      <section id="products" className="mkt-section company-page__platform scroll-mt-24">
        <div className="mkt-shell company-page__shell">
          <div className="company-page__section-intro">
            <h2 className="mkt-section-title company-page__h2 m-0">{t.platform.title}</h2>
            <p className="mkt-section-desc company-page__read m-0">{t.platform.subtitle}</p>
          </div>
          <ul className="company-page__product-rows">
            {t.platform.products.map((product) => (
              <li
                key={product.id}
                className={`company-page__product-row${product.id === "staff" ? " company-page__product-row--soon" : ""}`}
              >
                <div className="company-page__product-row-head">
                  <h3 className="company-page__product-row-title m-0">{product.title}</h3>
                  <span className="company-page__product-row-status">{product.status}</span>
                </div>
                <p className="company-page__product-row-body m-0">{product.body}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* D1. POS story */}
      <section className="mkt-section company-page__story company-page__story--muted">
        <div className="mkt-shell company-page__shell">
          <div className="company-page__split company-page__split--copy-first">
            <div className="company-page__split-copy">
              <h2 className="mkt-section-title company-page__h2 m-0">{t.storyPos.title}</h2>
              <p className="company-page__body company-page__read m-0">{t.storyPos.body}</p>
              <Link to={POS_LANDING_PATH} className="mkt-btn-primary">
                {t.storyPos.cta}
              </Link>
            </div>
            <figure className="company-page__split-media m-0">
              <div className="company-page__media-frame company-page__media-frame--dark">
                <div className="company-page__media-stage company-page__media-stage--pos">
                  <img
                    src={POS_IMAGE}
                    alt={t.storyPos.imageAlt}
                    width={1309}
                    height={867}
                    loading="lazy"
                    decoding="async"
                  />
                </div>
              </div>
            </figure>
          </div>
        </div>
      </section>

      {/* D2. Dashboard */}
      <section className="mkt-section company-page__story">
        <div className="mkt-shell company-page__shell">
          <div className="company-page__split company-page__split--media-first">
            <div className="company-page__split-copy">
              <h2 className="mkt-section-title company-page__h2 m-0">{t.storyDashboard.title}</h2>
              <p className="company-page__body company-page__read m-0">{t.storyDashboard.body}</p>
            </div>
            <figure className="company-page__split-media m-0">
              <div className="company-page__media-frame">
                <div className="company-page__media-stage company-page__media-stage--dashboard">
                  <img
                    src={BUSINESS_DASHBOARD}
                    alt={t.storyDashboard.imageAlt}
                    width={1464}
                    height={684}
                    loading="lazy"
                    decoding="async"
                  />
                </div>
              </div>
            </figure>
          </div>
        </div>
      </section>

      {/* D3. Reports */}
      <section className="mkt-section company-page__story company-page__story--muted">
        <div className="mkt-shell company-page__shell">
          <div className="company-page__split company-page__split--copy-first">
            <div className="company-page__split-copy">
              <h2 className="mkt-section-title company-page__h2 m-0">{t.storyReports.title}</h2>
              <p className="company-page__body company-page__read m-0">{t.storyReports.body}</p>
            </div>
            <figure className="company-page__split-media m-0">
              <div className="company-page__media-frame">
                <div className="company-page__media-stage company-page__media-stage--reports">
                  <img
                    src={BUSINESS_REPORTS}
                    alt={t.storyReports.imageAlt}
                    width={1468}
                    height={853}
                    loading="lazy"
                    decoding="async"
                  />
                </div>
              </div>
            </figure>
          </div>
        </div>
      </section>

      {/* D4. Mobile */}
      <section className="mkt-section company-page__story company-page__story--mobile">
        <div className="mkt-shell company-page__shell">
          <div className="company-page__split company-page__split--mobile">
            <div className="company-page__split-copy">
              <h2 className="mkt-section-title company-page__h2 m-0">{t.storyMobile.title}</h2>
              <p className="company-page__body company-page__read m-0">{t.storyMobile.body}</p>
            </div>
            <figure className="company-page__split-media company-page__split-media--phone m-0">
              <div className="company-page__phone-frame">
                <img
                  src={BUSINESS_MOBILE}
                  alt={t.storyMobile.imageAlt}
                  width={480}
                  height={907}
                  loading="lazy"
                  decoding="async"
                />
              </div>
            </figure>
          </div>
        </div>
      </section>

      {/* About */}
      <section
        id="about"
        className="mkt-section company-page__about-section scroll-mt-24 border-b"
        style={{ borderColor: "var(--mkt-border)", background: "var(--mkt-bg-muted)" }}
      >
        <div className="mkt-shell company-page__shell">
          <div className="company-page__about">
            <div className="company-page__about-copy">
              <h2 className="mkt-section-title company-page__h2 m-0">{t.about.title}</h2>
              {aboutParagraphs.map((paragraph) => (
                <p key={paragraph.slice(0, 32)} className="company-page__body company-page__read m-0">
                  {paragraph}
                </p>
              ))}
            </div>
            <ol className="company-page__values">
              {t.about.values.map((value, index) => (
                <li key={value.title} className="company-page__value">
                  <span className="company-page__value-index" aria-hidden>
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <div className="company-page__value-copy">
                    <h3 className="m-0">{value.title}</h3>
                    <p className="m-0">{value.body}</p>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="mkt-cta-band mkt-section company-page__cta">
        <div className="mkt-shell company-page__shell">
          <div className="company-page__cta-inner">
            <h2 className="mkt-section-title company-page__h2 m-0">{t.cta.headline}</h2>
            <p className="mkt-section-desc company-page__read m-0">{t.cta.subline}</p>
            <div className="company-page__hero-actions company-page__hero-actions--center">
              <a href="#products" className="mkt-btn-primary">
                {t.cta.ctaProducts}
              </a>
              <Link to={POS_LANDING_PATH} className="mkt-btn-secondary">
                {t.cta.ctaPos}
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
