# Phase 2 — POS Landing Redesign

**Date:** 2026-07-03  
**Scope:** `/caisty-pos`, `MarketingPreFooter`, shared marketing components, performance/SEO prep.  
**Out of scope:** Portal, Admin, Checkout, Legal content, Company restructure.

---

## 1. Changed files

| File | Change |
|------|--------|
| `apps/caisty-site/src/routes/LandingPage.tsx` | Full rewrite on `marketing-site` / `mkt-*` tokens; new section order |
| `apps/caisty-site/src/index.css` | POS landing styles: hero frame, gallery, plans, FAQ, fiscal, flat CTA |
| `apps/caisty-site/src/lib/translations/landing.ts` | `bento`, `security`, `integrations`, `deployment`, `cta`; demo hero TODO keys (EN/DE/FR/AR) |
| `apps/caisty-site/src/lib/translations/landingTn.ts` | Same structure for Tunisia French |
| `apps/caisty-site/src/components/MarketingPreFooter.tsx` | Single POS card; WorkTrack only as muted line |
| `apps/caisty-site/src/components/TechStackCardGrid.tsx` | Migrated to `mkt-tech-card` tokens |
| `apps/caisty-site/src/App.tsx` | Route-based `React.lazy` code splitting |
| `apps/caisty-site/src/lib/siteDocumentMeta.ts` | POS OG image, hreflang EN/DE, improved POS description |
| `apps/caisty-site/src/routes/CompanyPage.tsx` | Regression: `TechStackCardGrid` without `isLight` prop |
| `apps/caisty-site/public/screenshots/pos-hero-placeholder.png` | Hero placeholder (16:10, from PO screenshot) |
| `apps/caisty-site/public/og/pos-default.svg` | POS OG placeholder |
| `apps/caisty-site/public/sitemap.xml` | New — Company, POS, Pricing, Contact |
| `apps/caisty-site/public/robots.txt` | New — allows crawl + sitemap |

---

## 2. Removed / merged sections (old → new)

| Old section (13+) | Fate |
|-------------------|------|
| Hero mock “preview card” | Replaced by product screenshot frame |
| `why` (6 small cards) | Merged into **Bento features** (6 larger cards) |
| `forWhom` (4 cards) | Removed from page (copy retained in i18n for reuse) |
| `howItWorksProbe` | Merged into **Deployment** steps |
| `hardwareProbe` | Merged into **Integrations** (peripherals) |
| `compareProbe` table | Removed |
| `portalBand` | Absorbed into Bento “Cloud customer portal” |
| `payment` (Stripe/PayPal cards) | Merged into **Integrations** (subscriptions) |
| `install` timeline + mock | Merged into **Deployment** |
| `lp-reveal` scroll animations | Removed (no new animation framework) |
| All `landing-page` / `lp-*` classes in `LandingPage.tsx` | Removed |
| Raw hex colours in POS page | Removed — `var(--mkt-*)` only |

---

## 3. New page structure (`/caisty-pos`)

1. **Hero** — headline, subline, Start free / View pricing, 16:10 screenshot frame (`fetchpriority="high"`)
2. **Bento features** — offline POS, portal, sync, inventory/reports, fast checkout, multi-language
3. **Screenshot gallery** — modernized stage + lazy thumbs; dashboard slide marked TODO
4. **Pricing** — trial / starter / pro with billing toggle
5. **Security** — 6 trust cards (backups, TLS, PINs, device activation, offline, updates)
6. **Integrations** — peripherals + Stripe/PayPal + fiscal-provider note (no Fiskaly claim)
7. **Deployment** — Windows / portal / cloud / offline + platform pills + steps
8. **FAQ** — accessible accordion (`button`, `aria-expanded`, `aria-controls`); first item open
9. **Fiscal infobox** — content unchanged, `mkt-fiscal-box` styling
10. **CTA band** — flat primary button (no glow)
11. **Footer** — via `SiteLayout` (+ `MarketingPreFooter` on POS/Pricing)

---

## 4. Screenshots

| File | Description |
|------|-------------|
| `docs/screenshots/pos-phase2-before-hero-1440.png` | **Before** — git `HEAD` landing (dark `landing-page` layout) |
| `docs/screenshots/pos-phase2-after-hero-1440.png` | **After** — hero desktop 1440×900 light |
| `docs/screenshots/pos-phase2-after-full-1440.png` | **After** — full page desktop |
| `docs/screenshots/pos-phase2-after-mobile-390.png` | **After** — full page mobile 390px |

---

## 5. Build result

```
pnpm build  →  ✓ success (tsc + vite)
pnpm test   →  ✓ 16/16 passed
```

---

## 6. Bundle sizes — before / after

| Metric | Phase 1 baseline | Phase 2 |
|--------|------------------|---------|
| Main entry `index-*.js` | **771 KB** (gzip 214 KB) | **510 KB** (gzip 156 KB) |
| CSS | 102 KB | 103 KB |
| `LandingPage` chunk | (in main bundle) | **28 KB** (gzip 8 KB) lazy |
| `CompanyPage` chunk | (in main bundle) | **6 KB** (gzip 2 KB) lazy |

Initial JS reduced by **~34%** (~261 KB) via route-based code splitting. Largest remaining chunk is still the shared shell (`index-BUC1XJ2m.js`).

---

## 7. Lighthouse comparison (mobile, production preview `:4173`)

Baseline from `docs/ANALYSE-SITE-REDESIGN.md` (2026-07-03). Phase 2 re-run with Lighthouse 12.8.2.

| Metric / audit | Company `/` before | Company `/` after | POS `/caisty-pos` before | POS `/caisty-pos` after |
|----------------|-------------------|-------------------|--------------------------|-------------------------|
| FCP | 3.6 s | **2.5 s** | 3.5 s | **2.9 s** |
| LCP | 4.8 s | **3.9 s** | n/a (NO_LCP) | n/a (NO_LCP) |
| Speed Index | 5.9 s | **2.5 s** | 5.8 s | **5.4 s** |
| CLS | 0.028 | ~0 | 0 | ~0 |
| `color-contrast` | ✗ | ✗ | ✗ | ✗ |
| `meta-description` | ✓ | ✓ | ✓ | ✓ |
| `document-title` | ✓ | ✓ | ✓ | ✓ |
| OG image | missing | ✓ company SVG | missing | ✓ pos SVG |
| sitemap / robots | ✗ | ✓ | ✗ | ✓ |
| hreflang EN/DE | ✗ | ✓ runtime | ✗ | ✓ runtime |
| `html lang` | static `en` | dynamic via `LanguageContext` | same | same |

**Notes:** Category scores were empty in Lighthouse 12 JSON export (`--only-categories`); individual audits used for comparison. LCP on POS still intermittently `NO_LCP` (hero image / lazy gallery). **color-contrast** still fails — likely cookie banner or third-party font contrast; needs follow-up outside POS layout.

Raw reports: `docs/lighthouse-pos-phase2.json`, `docs/lighthouse-company-phase2.json`.

---

## 8. MarketingPreFooter & shared components

- **WorkTrack** no longer shown as second product card; only `worktrackNavSoon` under POS card (Pricing) or omitted on POS page itself.
- **Trust** + **Tech stack** use same `mkt-bento` / `mkt-tech-card` tokens as Company page.
- **Company regression:** build green; `TechStackCardGrid` works without `isLight`.

---

## 9. Open points

| Item | Priority |
|------|----------|
| Replace `pos-hero-placeholder.png` + gallery assets with final PO screenshots | High |
| Replace `og/pos-default.svg` + `og/company-default.svg` with 1200×630 PNG/WebP | High |
| Compress or WebP-convert `register.png` (~597 KB) and other large gallery PNGs | Medium |
| Fix remaining **color-contrast** failures (cookie banner / fonts) | Medium |
| Responsive `srcset` / WebP for gallery images | Medium |
| POS LCP measurement stability (hero preload, font strategy) | Medium |
| Canonical URLs in meta (not implemented) | Low |
| Legal pages SEO (explicitly out of scope) | Low |
| AR/RTL manual QA on new POS sections | Low |

---

## 10. i18n

- **EN / DE / FR / AR:** new keys added for bento, security, integrations, deployment, cta, demo TODO labels.
- **TN (`landingTn.ts`):** mirrored structure in French.
- Legacy keys (`forWhom`, `compareProbe`, etc.) kept in translation files but unused on POS page.
