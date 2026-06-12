import { useEffect, useRef, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { useLanguage } from "../lib/LanguageContext";
import { translations } from "../lib/translations/index";
import { landingTn } from "../lib/translations/landingTn";
import { getSiteMarket } from "../lib/siteMarket";
import { useTheme } from "../lib/theme";
import { applyCaistyPosProductMeta, applyCompanySiteMeta } from "../lib/siteDocumentMeta";

export default function LandingPage() {
  const { language } = useLanguage();
  const location = useLocation();
  const { theme } = useTheme();
  const market = getSiteMarket();
  const isLight = theme === "light";
  const t = market === "tn" ? landingTn : translations[language].landing;
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const landingRef = useRef<HTMLDivElement>(null);

  const screenshots = [
    { id: 1, src: "/screenshots/dashboard.png", alt: t.demo.shotDashboard, title: t.demo.shotDashboard },
    { id: 2, src: "/screenshots/pos.png", alt: t.demo.shotPos, title: t.demo.shotPos },
    { id: 3, src: "/screenshots/portal.png", alt: t.demo.shotPortal, title: t.demo.shotPortal },
  ];

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

  useEffect(() => {
    const root = landingRef.current;
    if (!root) return;
    const els = root.querySelectorAll(".lp-reveal, .lp-reveal-stagger");
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) e.target.classList.add("visible");
        });
      },
      { threshold: 0.06, rootMargin: "0px 0px -40px 0px" },
    );
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, [language, theme, market]);

  const sectionShell = "w-full max-w-[1100px] mx-auto px-4 sm:px-6 lg:px-8";

  return (
    <div
      ref={landingRef}
      className={`landing-page min-h-screen w-full max-w-[100vw] overflow-x-clip ${isLight ? "landing-page--light" : ""}`}
    >
      {/* Hero + product */}
      <section id="product" className="relative overflow-x-clip scroll-mt-20">
        <div className="lp-hero-glow" aria-hidden />
        <div className={`${sectionShell} relative z-[1] pt-10 pb-12 sm:pt-14 sm:pb-16`}>
          <div
            className={`inline-flex items-center gap-2 rounded-full border px-3.5 py-1.5 text-xs font-semibold tracking-wide ${
              isLight ? "border-slate-200 bg-white text-slate-700 shadow-sm" : "border-white/10 bg-white/[0.06] text-slate-200"
            }`}
          >
            <span
              className="lp-badge-pulse-dot h-1.5 w-1.5 rounded-full shrink-0"
              style={{ backgroundColor: "var(--color-accent)" }}
            />
            {t.hero.badge}
          </div>

          <div className="grid gap-10 lg:gap-14 lg:grid-cols-[minmax(0,1.25fr)_minmax(0,1fr)] items-start mt-8 w-full min-w-0">
            <div className="space-y-6 min-w-0">
              <div className="lp-hero-title-block lp-font-heading">
                <h1 className="lp-title-h1">{t.hero.title}</h1>
                <p className="mt-4 text-base sm:text-lg leading-relaxed text-[var(--color-text-muted)] max-w-xl">
                  {t.hero.description}
                </p>
              </div>

              <div className="lp-hero-cta flex flex-col sm:flex-row flex-wrap gap-3 w-full min-w-0">
                <Link to="/register" className="lp-cta-primary no-underline text-center justify-center w-full sm:w-auto">
                  {t.hero.ctaPrimary}
                </Link>
                {market === "tn" ? (
                  <a
                    href="mailto:info@caisty.com?subject=D%C3%A9mo%20Caisty%20POS"
                    className="lp-cta-secondary no-underline text-center justify-center w-full sm:w-auto"
                  >
                    {t.hero.ctaSecondary}
                  </a>
                ) : (
                  <Link to="/pricing" className="lp-cta-secondary no-underline text-center justify-center w-full sm:w-auto">
                    {t.hero.ctaSecondary}
                  </Link>
                )}
              </div>

              <p className="lp-hero-trial text-sm max-w-xl leading-relaxed text-[var(--color-text-subtle)]">
                {t.hero.trialTrust}
              </p>
            </div>

            <div className="lp-mock-card-enter w-full min-w-0">
              <div
                className={`rounded-2xl p-5 sm:p-6 border shadow-lg ${
                  isLight ? "border-slate-200 bg-white" : "lp-glass-mock shadow-[0_24px_80px_rgba(0,0,0,0.35)]"
                }`}
              >
                <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
                  <div className="text-xs font-semibold uppercase tracking-wider text-[var(--color-text-subtle)]">
                    {t.preview.caption}
                  </div>
                  <div
                    className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium ${
                      isLight ? "bg-slate-100 text-slate-700" : "bg-white/[0.08] text-slate-200"
                    }`}
                  >
                    <span className="h-2 w-2 rounded-full shrink-0 bg-[#f97316]" />
                    {t.preview.liveBadge}
                  </div>
                </div>

                <div
                  className={`rounded-xl border p-4 sm:p-5 space-y-4 ${
                    isLight ? "border-slate-200 bg-slate-50" : "border-white/[0.08] bg-black/30"
                  }`}
                >
                  <div className="text-sm font-bold text-[var(--color-text-primary)] lp-font-heading">{t.preview.title}</div>
                  <ul className="grid gap-2 sm:grid-cols-2 text-sm text-[var(--color-text-primary)]">
                    {t.preview.items.map((item) => (
                      <li
                        key={item}
                        className={`flex items-center gap-2 rounded-lg border px-3 py-2 ${
                          isLight ? "border-slate-200 bg-white" : "border-white/10 bg-white/[0.04]"
                        }`}
                      >
                        <span className="h-1.5 w-1.5 rounded-full bg-[#f97316] shrink-0" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>

                  <div className="grid gap-3 sm:grid-cols-2 text-xs sm:text-sm">
                    <div
                      className={`rounded-xl border p-3 sm:p-4 space-y-1 ${
                        isLight ? "border-slate-200 bg-white" : "border-white/10 bg-white/[0.04]"
                      }`}
                    >
                      <div className="text-[11px] font-semibold uppercase tracking-wide text-[var(--color-text-subtle)]">
                        {t.preview.items[0]}
                      </div>
                      <div className="font-mono text-xs text-[var(--color-text-primary)]">CSTY-XXXX-XXXX-XXXX</div>
                    </div>
                    <div
                      className={`rounded-xl border p-3 sm:p-4 space-y-2 ${
                        isLight ? "border-slate-200 bg-white" : "border-white/10 bg-white/[0.04]"
                      }`}
                    >
                      <div className="flex items-center justify-between text-[11px] text-[var(--color-text-subtle)]">
                        <span>{t.preview.items[1]}</span>
                        <span
                          className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                            isLight ? "bg-slate-100 text-slate-700" : "bg-white/10 text-slate-200"
                          }`}
                        >
                          {t.preview.demoBadge}
                        </span>
                      </div>
                      <div className="lp-stat-devices lp-font-heading">3</div>
                      <div className="text-[11px] text-[var(--color-text-subtle)]">{t.preview.devicesOnline}</div>
                    </div>
                  </div>

                  <div
                    className={`rounded-xl border border-dashed p-3 text-xs sm:text-sm leading-relaxed ${
                      isLight ? "border-slate-200 bg-white text-slate-600" : "border-white/10 text-slate-400"
                    }`}
                  >
                    {t.preview.quote}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Why */}
      <section id="features" className={`${sectionShell} py-16 sm:py-24 scroll-mt-20`}>
        <div className="lp-reveal space-y-4">
          <div className="flex items-start gap-3">
            <span className="lp-section-accent" aria-hidden />
            <div className="space-y-3 min-w-0">
              <h2 className="lp-section-h2">{t.why.title}</h2>
              <p className="lp-section-desc max-w-2xl">{t.why.description}</p>
            </div>
          </div>
        </div>
        <div className="lp-reveal lp-reveal-stagger grid gap-5 sm:grid-cols-2 lg:grid-cols-4 mt-10 text-sm">
          <div className="lp-reveal-item">
            <FeatureCard title={t.why.feature1Title} text={t.why.feature1Text} />
          </div>
          <div className="lp-reveal-item">
            <FeatureCard title={t.why.feature2Title} text={t.why.feature2Text} />
          </div>
          <div className="lp-reveal-item">
            <FeatureCard title={t.why.feature3Title} text={t.why.feature3Text} />
          </div>
          <div className="lp-reveal-item">
            <FeatureCard title={t.why.feature4Title} text={t.why.feature4Text} />
          </div>
        </div>
      </section>

      {/* For whom */}
      <section className={`${sectionShell} py-16 sm:py-24`}>
        <div className="lp-reveal flex items-start gap-3 mb-10">
          <span className="lp-section-accent" aria-hidden />
          <h2 className="lp-section-h2">{t.forWhom.title}</h2>
        </div>
        <div className="lp-reveal lp-reveal-stagger grid gap-5 sm:grid-cols-2 lg:grid-cols-3 text-sm">
          <div className="lp-reveal-item">
            <FeatureCard title={t.forWhom.target1Title} text={t.forWhom.target1Text} />
          </div>
          <div className="lp-reveal-item">
            <FeatureCard title={t.forWhom.target2Title} text={t.forWhom.target2Text} />
          </div>
          <div className="lp-reveal-item sm:col-span-2 lg:col-span-1">
            <FeatureCard title={t.forWhom.target3Title} text={t.forWhom.target3Text} />
          </div>
        </div>
      </section>

      {/* Probe: compact journey + hardware + comparison (easy to remove if not wanted) */}
      <section id="how-it-works" className={`${sectionShell} py-16 sm:py-24 scroll-mt-20`}>
        <div className="lp-reveal space-y-4 mb-10">
          <div className="flex items-start gap-3">
            <span className="lp-section-accent" aria-hidden />
            <div className="space-y-3 min-w-0">
              <h2 className="lp-section-h2">{t.howItWorksProbe.title}</h2>
            </div>
          </div>
        </div>
        <div className="lp-reveal lp-reveal-stagger grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {t.howItWorksProbe.steps.map((step, i) => (
            <div
              key={`how-step-${i}`}
              className={`lp-reveal-item flex min-h-0 flex-col rounded-xl border p-4 sm:p-5 ${
                isLight ? "border-slate-200 bg-white shadow-sm" : "border-white/10 bg-[#0f172a]/60"
              }`}
            >
              <div
                className={`inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold mb-3 ${
                  isLight ? "bg-orange-100 text-[#c2410c]" : "bg-[#f97316]/20 text-orange-200"
                }`}
              >
                {i + 1}
              </div>
              <p className="text-sm font-semibold text-[var(--color-text-primary)] lp-font-heading leading-snug">{step}</p>
            </div>
          ))}
        </div>
      </section>

      <section className={`${sectionShell} py-16 sm:py-24`}>
        <div className="lp-reveal space-y-4 mb-8">
          <div className="flex items-start gap-3">
            <span className="lp-section-accent" aria-hidden />
            <div className="space-y-3 min-w-0">
              <h2 className="lp-section-h2">{t.hardwareProbe.title}</h2>
              <p className="lp-section-desc max-w-2xl">{t.hardwareProbe.intro}</p>
            </div>
          </div>
        </div>
        <ul className="lp-reveal grid gap-3 sm:grid-cols-2 max-w-3xl text-sm text-[var(--color-text-muted)]">
          {t.hardwareProbe.items.map((item) => (
            <li key={item} className="flex gap-2 items-start">
              <span className="text-[#f97316] shrink-0 mt-0.5" aria-hidden>
                ✓
              </span>
              <span>{item}</span>
            </li>
          ))}
        </ul>
      </section>

      <section className={`${sectionShell} py-16 sm:py-24`}>
        <div className="lp-reveal space-y-4 mb-8">
          <div className="flex items-start gap-3">
            <span className="lp-section-accent" aria-hidden />
            <div className="space-y-3 min-w-0">
              <h2 className="lp-section-h2">{t.compareProbe.title}</h2>
              <p className="lp-section-desc max-w-2xl">{t.compareProbe.intro}</p>
            </div>
          </div>
        </div>
        <div className="lp-reveal overflow-x-auto rounded-xl border border-slate-200/80 dark:border-white/10">
          <table className="w-full min-w-[520px] text-sm border-collapse" dir="ltr">
            <thead>
              <tr className={isLight ? "bg-slate-50" : "bg-white/[0.04]"}>
                <th className="text-start p-3 sm:p-4 font-bold text-[var(--color-text-primary)] lp-font-heading border-b border-slate-200 dark:border-white/10">
                  {t.compareProbe.colFeature}
                </th>
                <th className="text-start p-3 sm:p-4 font-bold text-[var(--color-text-primary)] lp-font-heading border-b border-slate-200 dark:border-white/10">
                  {t.compareProbe.colLegacy}
                </th>
                <th className="text-start p-3 sm:p-4 font-bold text-[#f97316] lp-font-heading border-b border-slate-200 dark:border-white/10">
                  {t.compareProbe.colCaisty}
                </th>
              </tr>
            </thead>
            <tbody>
              {t.compareProbe.rows.map((row) => (
                <tr key={row.feature} className="border-b border-slate-100 dark:border-white/[0.06] last:border-0">
                  <td className="p-3 sm:p-4 font-semibold text-[var(--color-text-primary)]">{row.feature}</td>
                  <td className="p-3 sm:p-4 text-[var(--color-text-muted)]">{row.legacy}</td>
                  <td className="p-3 sm:p-4 text-[var(--color-text-muted)]">{row.caisty}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="lp-reveal mt-4 text-xs sm:text-sm text-[var(--color-text-subtle)] max-w-3xl">{t.compareProbe.disclaimer}</p>
      </section>

      {/* Customer portal (supporting product) */}
      <section id="portal" className={`${sectionShell} py-16 sm:py-24 scroll-mt-20`}>
        <div
          className={`lp-reveal rounded-2xl border p-6 sm:p-10 space-y-6 lp-surface-card max-w-3xl ${
            isLight ? "bg-white shadow-sm" : ""
          }`}
        >
          <div className="space-y-4 min-w-0">
            <div className="flex items-start gap-3">
              <span className="lp-section-accent mt-1" aria-hidden />
              <div className="space-y-3 min-w-0">
                <h2 className="lp-section-h2 text-xl sm:text-2xl">{t.portalBand.title}</h2>
                <p className="text-sm sm:text-base leading-relaxed text-[var(--color-text-muted)] max-w-2xl">{t.portalBand.description}</p>
              </div>
            </div>
            <ul className="space-y-3 text-sm text-[var(--color-text-muted)] max-w-2xl ps-1 sm:ps-2">
              {t.portalBand.bullets.map((b) => (
                <li key={b} className="flex gap-2 items-start">
                  <span className="text-[#f97316] shrink-0 mt-0.5" aria-hidden>
                    ✓
                  </span>
                  <span>{b}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* Demo / POS screenshots */}
      <section id="screenshots" className={`${sectionShell} py-16 sm:py-24 scroll-mt-20`}>
        <div className="lp-reveal mb-6 flex items-start gap-3">
          <span className="lp-section-accent" aria-hidden />
          <h2 className="lp-section-h2">{t.demo.sectionTitle}</h2>
        </div>
        <div className={`lp-reveal max-w-3xl mx-auto w-full rounded-2xl border overflow-hidden lp-surface-card ${isLight ? "shadow-md" : ""}`}>
          <div className="aspect-video lp-video-shell flex items-center justify-center relative overflow-hidden max-h-[320px] sm:max-h-none">
            <div className="absolute inset-0 lp-shimmer opacity-30" aria-hidden />
            <div className="absolute inset-0 flex items-center justify-center z-[1]">
              <div className="relative w-16 h-16 sm:w-[72px] sm:h-[72px] flex items-center justify-center">
                <span className="lp-play-ring" />
                <button
                  type="button"
                  className={`relative z-[2] rounded-full p-3 sm:p-4 transition-transform hover:scale-105 ${
                    isLight ? "bg-white text-slate-900 shadow-lg" : "bg-white/10 text-white border border-white/10"
                  }`}
                  aria-label={t.demo.videoAria}
                >
                  <svg className="w-8 h-8 sm:w-10 sm:h-10" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M8 5v14l11-7z" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="lp-reveal lp-reveal-stagger grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-5 mt-8 w-full min-w-0">
          {screenshots.map((screenshot) => (
            <div key={screenshot.id} className="lp-reveal-item w-full min-w-0">
              <ScreenshotThumb screenshot={screenshot} isLight={isLight} onOpen={() => setSelectedImage(screenshot.src)} />
            </div>
          ))}
        </div>
      </section>

      {/* Pricing (marketing summary — detail on /pricing) */}
      <section id="pricing" className={`${sectionShell} py-16 sm:py-24 scroll-mt-20`}>
        <div className="lp-reveal space-y-4">
          <div className="flex items-start gap-3">
            <span className="lp-section-accent" aria-hidden />
            <div className="space-y-3 min-w-0">
              <h2 className="lp-section-h2">{t.plans.title}</h2>
              <p className="lp-section-desc max-w-2xl">{t.plans.intro}</p>
            </div>
          </div>
        </div>
        <div className="lp-reveal lp-reveal-stagger grid gap-5 lg:grid-cols-3 mt-10">
          <div className="lp-reveal-item w-full min-w-0">
            <PlanCard
              name={t.plans.trial.name}
              badge={t.plans.trial.badge}
              priceLine={t.plans.trial.priceLine}
              subline={t.plans.trial.subline}
              features={t.plans.trial.features}
            />
          </div>
          <div className="lp-reveal-item w-full min-w-0">
            <PlanCard
              name={t.plans.starter.name}
              badge={t.plans.starter.badge}
              recommended={t.plans.starter.recommended}
              priceLine={t.plans.starter.priceLine}
              subline={t.plans.starter.subline}
              features={t.plans.starter.features}
              highlight
            />
          </div>
          <div className="lp-reveal-item w-full min-w-0">
            <PlanCard
              name={t.plans.pro.name}
              badge={t.plans.pro.badge}
              priceLine={t.plans.pro.priceLine}
              subline={t.plans.pro.subline}
              features={t.plans.pro.features}
            />
          </div>
        </div>
        <p className="mt-8 text-xs sm:text-sm leading-relaxed text-[var(--color-text-subtle)] max-w-3xl">{t.plans.note}</p>
      </section>

      {/* Payment */}
      <section id="payment" className={`${sectionShell} py-16 sm:py-24 scroll-mt-20`}>
        <div className="lp-reveal space-y-4">
          <div className="flex items-start gap-3">
            <span className="lp-section-accent" aria-hidden />
            <div className="space-y-3 min-w-0">
              <h2 className="lp-section-h2">{t.payment.title}</h2>
              <p className="lp-section-desc max-w-2xl">{t.payment.description}</p>
            </div>
          </div>
        </div>
        <div className="lp-reveal lp-reveal-stagger grid gap-5 md:grid-cols-2 mt-10">
          <div className="lp-reveal-item w-full min-w-0">
            <PaymentMethodCard
              title={t.payment.paypal.title}
              description={t.payment.paypal.description}
              icon="PayPal"
            />
          </div>
          <div className="lp-reveal-item w-full min-w-0">
            <PaymentMethodCard
              title={t.payment.stripe.title}
              description={t.payment.stripe.description}
              icon="Stripe"
            />
          </div>
        </div>
        <p className="mt-8 text-xs sm:text-sm text-[var(--color-text-subtle)] max-w-3xl">{t.payment.footnote}</p>
      </section>

      {/* Install */}
      <section className={`${sectionShell} py-16 sm:py-24`}>
        <div
          className={`lp-reveal rounded-2xl border p-6 sm:p-10 grid gap-10 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,1fr)] items-start lp-surface-card ${
            isLight ? "bg-white shadow-sm" : ""
          }`}
        >
          <div className="space-y-6 min-w-0">
            <div className="flex items-start gap-3">
              <span className="lp-section-accent mt-1" aria-hidden />
              <div className="space-y-3 min-w-0">
                <h2 className="lp-section-h2 text-xl sm:text-2xl">{t.install.title}</h2>
                <p className="text-sm sm:text-base leading-relaxed text-[var(--color-text-muted)] max-w-xl">{t.install.description}</p>
              </div>
            </div>

            <div className="relative ps-10 space-y-0 isolate">
              <div className="lp-timeline-line" aria-hidden />
              <ol className="space-y-5 text-sm sm:text-base text-[var(--color-text-primary)]">
                {t.install.steps.map((step, i) => (
                  <li key={i} className="flex gap-3 items-start min-w-0">
                    <span className="lp-step-circle shrink-0">{i + 1}</span>
                    <span className="pt-0.5 min-w-0">{step}</span>
                  </li>
                ))}
              </ol>
            </div>

            <p className="text-xs sm:text-sm text-[var(--color-text-subtle)] max-w-xl ps-10 sm:ps-10">
              {t.install.noteBefore}{" "}
              <span className="font-semibold text-[var(--color-text-primary)]">{t.install.noteHighlight}</span>{" "}
              {t.install.noteAfter}
            </p>
          </div>

          <div className="relative w-full min-w-0">
            <div
              className={`rounded-2xl border p-5 sm:p-6 space-y-4 ${isLight ? "border-slate-200 bg-slate-50" : "border-white/10 bg-[#0f172a]/80"}`}
            >
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <div className="text-[10px] sm:text-xs font-semibold uppercase tracking-wide text-[var(--color-text-subtle)]">
                  {t.install.mockTitle}
                </div>
                <span className="rounded-full border border-[#f97316]/40 bg-[#f97316]/10 text-[#f97316] text-[10px] font-semibold px-2 py-0.5">
                  {t.install.previewBadge}
                </span>
              </div>
              <div className="flex flex-wrap gap-2">
                <StepPill label={t.install.platformWin} active />
                <StepPill label={t.install.platformLinux} />
                <StepPill label={t.install.platformMac} />
              </div>
              <div className="grid gap-2 grid-cols-1 sm:grid-cols-3">
                <SmallStep title={t.install.smallDownload} number={1} />
                <SmallStep title={t.install.smallInstall} number={2} />
                <SmallStep title={t.install.smallLicense} number={3} />
              </div>
              <div
                className={`rounded-xl border border-dashed px-3 py-3 text-xs leading-relaxed ${
                  isLight ? "border-slate-200 bg-white text-slate-600" : "border-white/10 text-slate-400"
                }`}
              >
                {t.install.downloadHint}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className={`${sectionShell} py-16 sm:py-24 scroll-mt-20`}>
        <div className="lp-reveal space-y-4 mb-8">
          <div className="flex items-start gap-3">
            <span className="lp-section-accent" aria-hidden />
            <h2 className="lp-section-h2">{t.faq.title}</h2>
          </div>
        </div>
        <div className="lp-reveal grid gap-3 max-w-3xl">
          {t.faq.items.map((item) => (
            <details
              key={item.q}
              className={`group rounded-xl border overflow-hidden ${isLight ? "border-slate-200 bg-white" : "border-white/10 bg-[#0f172a]/60"}`}
            >
              <summary className="cursor-pointer list-none flex items-center justify-between gap-3 px-4 py-3.5 text-sm font-semibold text-[var(--color-text-primary)] lp-font-heading [&::-webkit-details-marker]:hidden">
                <span>{item.q}</span>
                <span className="text-[#f97316] text-lg leading-none group-open:rotate-180 transition-transform">▾</span>
              </summary>
              <div
                className={`px-4 pb-4 text-sm leading-relaxed text-[var(--color-text-muted)] border-t ${isLight ? "border-slate-100" : "border-white/5"} pt-3`}
              >
                {item.a}
              </div>
            </details>
          ))}
        </div>
      </section>

      {/* Fiscal */}
      <section id="fiscal" className={`${sectionShell} py-16 sm:py-24 scroll-mt-20`}>
        <div className={`lp-reveal lp-fiscal-box border p-6 sm:p-8 space-y-4 text-sm leading-relaxed ${isLight ? "border-slate-200" : "border-white/10"}`}>
          <h2 className="lp-font-heading text-base sm:text-lg font-bold text-[var(--color-text-primary)]">{t.fiscal.title}</h2>
          <p className="text-[var(--color-text-muted)]">{t.fiscal.lead}</p>
          <ul className="list-disc ps-5 space-y-1.5 text-[var(--color-text-muted)]">
            {t.fiscal.countries.map((c) => (
              <li key={c}>{c}</li>
            ))}
          </ul>
          <p className="text-[var(--color-text-muted)]">{t.fiscal.strict}</p>
          <p className="text-[var(--color-text-muted)] font-medium">{t.fiscal.disclaimer}</p>
        </div>
      </section>

      {selectedImage && (
        <div
          className="lp-modal-backdrop fixed inset-0 z-50 flex items-center justify-center p-4"
          onClick={() => setSelectedImage(null)}
          role="presentation"
        >
          <div className="relative max-w-5xl w-full min-w-0">
            <button
              type="button"
              className="absolute -top-10 end-0 text-white hover:text-slate-300 transition-colors z-10"
              onClick={() => setSelectedImage(null)}
              aria-label={t.demo.closeLabel}
            >
              <svg className="w-9 h-9" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            <div className={`lp-modal-panel rounded-xl border overflow-hidden ${isLight ? "border-slate-300 bg-white" : "border-slate-700 bg-slate-900"}`}>
              <img
                src={selectedImage}
                alt=""
                className="w-full h-auto max-h-[80vh] object-contain"
                onClick={(e) => e.stopPropagation()}
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.style.display = "none";
                }}
              />
            </div>
            <p className={`text-center mt-4 text-xs sm:text-sm ${isLight ? "text-slate-600" : "text-slate-400"}`}>{t.demo.clickOutside}</p>
          </div>
        </div>
      )}
    </div>
  );
}

function ScreenshotThumb(props: {
  screenshot: { id: number; src: string; alt: string; title: string };
  isLight: boolean;
  onOpen: () => void;
}) {
  const [failed, setFailed] = useState(false);
  const { screenshot, isLight, onOpen } = props;
  return (
    <button
      type="button"
      onClick={onOpen}
      className={`lp-shot-thumb group w-full min-w-0 text-start rounded-2xl border overflow-hidden relative ${
        isLight ? "border-slate-200 bg-white" : "border-white/10 bg-[#0f172a]"
      }`}
    >
      <div className="aspect-video relative overflow-hidden bg-[#0b1220]">
        <div className="absolute inset-0 lp-shimmer opacity-25" aria-hidden />
        {!failed ? (
          <img
            src={screenshot.src}
            alt={screenshot.alt}
            className="relative z-[1] w-full h-full object-cover"
            onError={() => setFailed(true)}
          />
        ) : (
          <div className="absolute inset-0 z-[2] flex flex-col items-center justify-center gap-2 p-4 text-center">
            <span className={`text-xs font-semibold ${isLight ? "text-slate-600" : "text-slate-400"}`}>{screenshot.title}</span>
          </div>
        )}
        <div className="absolute inset-0 z-[3] bg-[#f97316]/0 group-hover:bg-[#f97316]/10 transition-colors flex items-center justify-center pointer-events-none">
          <svg className="w-7 h-7 text-[#f97316] opacity-0 group-hover:opacity-100 transition-opacity" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v6m3-3H7" />
          </svg>
        </div>
      </div>
    </button>
  );
}

function FeatureCard(props: { title: string; text: string }) {
  const { theme } = useTheme();
  const isLight = theme === "light";
  return (
    <div className={`lp-surface-card lp-card-over p-6 sm:p-7 space-y-3 h-full ${isLight ? "bg-white shadow-sm" : ""}`}>
      <div className="relative z-[1] text-sm font-bold text-[var(--color-text-primary)] lp-font-heading">{props.title}</div>
      <p className={`relative z-[1] text-sm leading-relaxed ${isLight ? "text-slate-600" : "text-slate-400"}`}>{props.text}</p>
    </div>
  );
}

function PayPalLogo({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 101 32" fill="none" aria-hidden>
      <path
        fill="#003087"
        d="M12.2 4.2h7.4c4.1 0 6.7 2.5 6.7 6.4 0 4.4-3.4 7.4-8.6 7.4h-4.9L12.2 4.2zm4.1 10.3h2.1c2.4 0 3.8-1.3 3.8-3.4 0-2-1.3-3.1-3.6-3.1h-1.5l-.8 6.5z"
      />
      <path
        fill="#009CDE"
        d="M23.8 4.2h7.3c4 0 6.5 2.4 6.5 6.2 0 4.2-3.2 7.1-8.1 7.1h-4.8l-.9-13.3zm4 10.1h2c2.3 0 3.6-1.2 3.6-3.2 0-1.9-1.2-2.9-3.4-2.9h-1.4l-.8 6.1z"
      />
      <path
        fill="#012169"
        d="M38.5 8.5h3.2l-.5 3.4h2.9c2.8 0 4.3 1.2 4.3 3.5 0 2.6-2 4.1-5.5 4.1h-4.6l1.2-11zm.7 8.1h1.6c1.4 0 2.1-.6 2.1-1.6 0-1-.7-1.5-2-1.5h-1.1l-.6 3.1z"
      />
      <path
        fill="#FFC439"
        d="M52.1 8.5h3.1l-.2 1.6c.9-1.1 2.3-1.8 4-1.8 2.6 0 4.1 1.6 4.1 4.2 0 3.3-2.4 5.6-5.8 5.6-1.2 0-2.1-.3-2.7-.8l-.3 2.8h-3.1l1.9-11.6zm2.4 5.6c0 1.2.8 2 2.1 2 1.5 0 2.4-1.1 2.4-2.6 0-1.1-.6-1.8-1.7-1.8-1.4 0-2.4 1-2.8 2.4z"
      />
    </svg>
  );
}

function StripeLogo({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 120 50" fill="none" aria-hidden>
      <path
        fill="#635BFF"
        d="M11.4 20.4c0-1.9-1.1-3.3-3.2-3.3-1.6 0-2.8.8-3.6 1.4l-0.6-2.4c0.9-0.7 2.6-1.5 4.8-1.5 3.7 0 5.8 2 5.8 5.6v10.1H12l-0.2-1.4h-0.1c-1.1 1-2.5 1.7-4 1.7-2.5 0-4.2-1.7-4.2-4.2 0-2.8 2.5-4.4 6.6-4.8v-0.3c0-1.5-0.8-2.3-2.4-2.3-1.2 0-2.3.4-3.2 1l-0.6-2.1c1.1-0.6 2.5-1.2 4.3-1.2 3.2 0 5 1.7 5 5.3v6.8c0 1.6 0.1 3.1 0.3 4.2h-3.1l-0.3-2.1zM9.8 31.2c1.2 0 2.1-0.5 2.9-1.3v-3.5c-2.8 0.3-4.1 1.2-4.1 2.6 0 1.3 0.7 2.2 1.2 2.2z"
      />
      <path
        fill="#635BFF"
        d="M24.2 16.6h3.4l2.3 12.8c0.4 2 0.6 3.8 0.8 5.2h0.1c0.2-1.3 0.5-3.1 1-5.1l1.8-8.5h3.1l1.8 8.5c0.5 2.1 0.8 3.8 1 5.1h0.1c0.2-1.4 0.4-3.2 0.8-5.2l2.2-12.8h3.2l-4.1 21.4h-3.9l-1.7-8.1c-0.4-2-0.7-3.8-0.9-5.5h-0.1c-0.2 1.7-0.5 3.5-0.9 5.5l-1.7 8.1h-3.8l-4.2-21.4z"
      />
      <path
        fill="#635BFF"
        d="M52.8 16.2c4.1 0 6.3 2.9 6.3 7.4 0 5-2.8 8-7.3 8-4.1 0-6.3-2.9-6.3-7.3 0-5.1 2.8-8.1 7.3-8.1zm-0.1 11.8c0 2.6 0.9 4.1 2.6 4.1 1.8 0 2.6-1.8 2.6-4.6 0-2.4-0.8-4-2.6-4-1.7 0-2.6 1.6-2.6 4.5z"
      />
      <path fill="#635BFF" d="M62.4 16.6h3.1l0.3 2.8h0.1c1.1-2 2.8-3.2 4.9-3.2 1 0 1.7 0.2 2.2 0.4l-0.7 3.1c-0.6-0.2-1.2-0.3-2-0.3-2.2 0-3.8 1.6-4.3 4.2l-1.7 9.4h-3.4l3.5-16.4z" />
    </svg>
  );
}

function PaymentMethodCard(props: { title: string; description: string; icon: "PayPal" | "Stripe" }) {
  const { theme } = useTheme();
  const isLight = theme === "light";
  return (
    <div className={`lp-surface-card lp-card-over p-6 sm:p-7 space-y-4 flex flex-col h-full ${isLight ? "bg-white shadow-sm" : ""}`}>
      <div className="relative z-[1] h-8 shrink-0 flex items-center">
        {props.icon === "PayPal" ? <PayPalLogo className="h-8 w-[88px] max-w-none" /> : <StripeLogo className="h-8 w-[96px] max-w-none" />}
      </div>
      <div className="relative z-[1] space-y-2">
        <div className="text-sm font-bold text-[var(--color-text-primary)] lp-font-heading">{props.title}</div>
        <p className={`text-sm leading-relaxed ${isLight ? "text-slate-600" : "text-slate-400"}`}>{props.description}</p>
      </div>
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
  const { theme } = useTheme();
  const isLight = theme === "light";
  const highlight = props.highlight ? "lp-plan-highlight" : "";
  return (
    <div
      className={`lp-surface-card lp-card-over p-6 sm:p-7 space-y-4 text-sm h-full w-full min-w-0 ${highlight} ${
        isLight ? "bg-white shadow-sm" : ""
      }`}
    >
      <div className="relative z-[1] flex flex-wrap items-center justify-between gap-2">
        <div className="text-sm font-bold text-[var(--color-text-primary)] lp-font-heading">{props.name}</div>
        <div className="flex flex-wrap items-center gap-2 justify-end">
          {props.recommended && (
            <span className="rounded-full bg-[#f97316] text-white text-[10px] font-bold uppercase tracking-wide px-2.5 py-0.5">
              {props.recommended}
            </span>
          )}
          <span
            className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${
              isLight ? "border-slate-200 bg-slate-50 text-slate-600" : "border-white/10 bg-white/[0.06] text-slate-300"
            }`}
          >
            {props.badge}
          </span>
        </div>
      </div>
      <div className="relative z-[1] space-y-1">
        <div className="lp-plan-price lp-font-heading">{props.priceLine}</div>
        <div className="text-xs sm:text-sm text-[var(--color-text-muted)]">{props.subline}</div>
      </div>
      {props.features.length > 0 && (
        <ul className="relative z-[1] mt-2 space-y-2 text-xs sm:text-sm text-[var(--color-text-muted)]">
          {props.features.map((d) => (
            <li key={d} className="flex gap-2 items-start">
              <span className="text-[#f97316] shrink-0 mt-0.5" aria-hidden>
                ✓
              </span>
              <span>{d}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function StepPill({ label, active }: { label: string; active?: boolean }) {
  const { theme } = useTheme();
  const isLight = theme === "light";
  return (
    <div
      className={[
        "inline-flex items-center justify-center rounded-full border px-3 py-1.5 text-xs font-medium",
        active
          ? isLight
            ? "border-[#f97316]/50 bg-orange-50 text-[#c2410c]"
            : "border-[#f97316]/50 bg-[#f97316]/15 text-orange-200"
          : isLight
            ? "border-slate-200 bg-slate-100 text-slate-600"
            : "border-white/10 bg-white/[0.04] text-slate-500",
      ].join(" ")}
    >
      {label}
    </div>
  );
}

function SmallStep({ title, number }: { title: string; number: number }) {
  const { theme } = useTheme();
  const isLight = theme === "light";
  return (
    <div className={`rounded-xl border p-3 space-y-2 min-w-0 ${isLight ? "border-slate-200 bg-white" : "border-white/10 bg-white/[0.04]"}`}>
      <div
        className={`inline-flex h-6 w-6 items-center justify-center rounded-full text-[11px] font-bold ${
          isLight ? "bg-orange-100 text-[#c2410c]" : "bg-[#f97316]/20 text-orange-200"
        }`}
      >
        {number}
      </div>
      <div className="text-[11px] font-semibold text-[var(--color-text-primary)] lp-font-heading leading-snug">{title}</div>
      <div className={`h-1.5 rounded ${isLight ? "bg-slate-200" : "bg-white/10"}`} />
    </div>
  );
}
