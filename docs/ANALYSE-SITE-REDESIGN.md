# Analyse: Company- & Caisty-POS-Marketingseiten (Vorstufe Redesign)

**Stand:** 2026-07-03 · **Scope:** `apps/caisty-site` · **Keine Code-Änderungen** — reine Bestandsaufnahme.

**Routen:** Company = `/` (`CompanyPage.tsx`) · Caisty POS = `/caisty-pos` (`LandingPage.tsx`)

---

## 1. Executive Summary

Die beiden Marketingseiten sind inhaltlich vollständig und mehrsprachig (EN/DE/FR/AR), technisch als React-SPA mit Tailwind v4 und scoped CSS-Tokens (`index.css` → `.landing-page`) umgesetzt. Visuell dominieren wiederholte Karten-Raster, Pastell-Icon-Quadrate (Lucide / ✓-Badges) und wenig typografische Hierarchie — das externe „2015“-Feedback trifft die Struktur, nicht den Inhalt. Die **Ein-Produkt-Strategie** ist noch nicht umgesetzt: Company listet „Business Management Tools“ und „Future Workforce Solutions“, Nav/Footer/Pre-Footer und eine eigene WorkTrack-Seite werben parallel zu Caisty POS. Styling ist hybrid: zentrale Tokens in `index.css`, aber viele hardcodierte Hex-Werte (`#f97316`, `#0b1220`) und Tailwind-Utility-Ketten inline in den Page-Komponenten. Lighthouse (Production-Build, `vite preview`, Mobile-Emulation) zeigt schwache Performance (FCP ~3,5–3,6 s, LCP teils nicht messbar) und **Kontrast-Fehler** (u. a. Company-CTA). SEO: dynamische Titles/Descriptions via `siteDocumentMeta.ts`, aber **kein** `sitemap.xml`, **kein** `hreflang`, **kein** `og:image`. Empfohlene Umbau-Reihenfolge: Design-Tokens → Nav/Footer/Pre-Footer → Company → POS, mit Regressionstests auf Portal-Routen und CTAs.

---

## 2. Sektions- & Komponenten-Inventar

### 2.1 Gemeinsame Shell (beide Seiten)

| Element | Datei | Zweck | Wiederverwendung |
|--------|-------|-------|------------------|
| Layout-Wrapper | `src/layouts/SiteLayout.tsx` | Sticky Header, Footer, `<Outlet />`, Cookie-Banner | Alle Marketing-Routen unter `SiteLayout` |
| Logo | `src/components/CaistyLogo.tsx` | Marken-Icon im Header | Header, Auth-Seiten |
| Sprache | `src/components/LanguageSelector.tsx` | EN/FR/DE/AR (ausgeblendet auf `tn.caisty.com`) | Header Desktop/Mobile |
| Theme | `src/components/ThemeToggle.tsx` + `src/lib/theme.tsx` | Light/Dark via `localStorage` `caisty_theme` | Global |
| POS-Nav-Dropdown | `src/components/CaistyPosQuickAccessMenu.tsx` | Desktop Hover + Mobile: Register/Login, Anker-Links | `SiteLayout` (ersetzt älteres Mega-Menu) |
| Pre-Footer-Band | `src/components/MarketingPreFooter.tsx` | Trust + Tech-Stack + Produkt-Karten | **Nur** `/caisty-pos` und `/pricing` — **nicht** auf Company `/` |
| Tech-Grid | `src/components/TechStackCardGrid.tsx` | Simple-Icons-Karten | `MarketingPreFooter` |
| Footer-Modals | `src/components/FooterModals.tsx` + `SiteModal` | Company-/Contact-Quickinfo | Footer-Buttons |
| Cookie | `src/components/CookieBanner.tsx` | Consent | Global |
| Routen-Konstanten | `src/config/marketingRoutes.ts` | `COMPANY_HOME`, `POS_LANDING_PATH`, Legal-Pfade | App, Links, Meta |
| Document-Meta | `src/lib/siteDocumentMeta.ts` | `document.title`, OG/Twitter per DOM-IDs | Company, POS, Contact |
| i18n-Kontext | `src/lib/LanguageContext.tsx` | Aktive Sprache | Alle Seiten |
| Markt (TN) | `src/lib/siteMarket.ts` | `tn.caisty.com` → `companyTn` / `landingTn` | Company + POS |

**Hinweis:** `src/components/ProductNavDropdown.tsx` (Mega-Menu mit POS + WorkTrack) ist **nicht eingebunden** — toter Code, Redesign-Kandidat zum Entfernen oder Reaktivieren.

### 2.2 Company-Seite (`/`)

| # | Sektion | Implementierung | i18n-Quelle | Shared CSS |
|---|---------|-----------------|-------------|------------|
| 1 | **Hero** | `CompanyPage.tsx` — Badge, H1, Subtitle, Gradient-Blobs | `company.hero.*` oder `companyTn.hero.*` | `landing-page`, `lp-font-heading`, Tailwind inline |
| 2 | **Who we are** | Fließtext, `lp-section-accent` + `lp-section-h2` | `company.whoWeAre.*` | wie oben |
| 3 | **Mission & Vision** | 2× `cardShell()` Grid, Lucide `Target` / `Eye` in Pastell-Quadraten | `company.mission.*`, `company.vision.*` | Lokale `cardShell()` in `CompanyPage.tsx` |
| 4 | **What we build** | 3-Spalten-Liste mit ✓-Kreis | `company.whatWeBuild.items[]` | Tailwind-Karten |
| 5 | **Our principles** | 5-Spalten-Icon-Karten (✓) | `company.principles.items[]` | Tailwind |
| 6 | **CTA** | Dunkles Band, Link → `/caisty-pos` | `company.cta.*` | Fest `#070d16`, Orange-Button inline |

**Kein** `MarketingPreFooter` auf Company — Footer kommt direkt aus `SiteLayout`.

### 2.3 Caisty-POS-Seite (`/caisty-pos`)

| # | Sektion | `id` | Implementierung | i18n (`landing.*`) |
|---|---------|------|-----------------|-------------------|
| 1 | Hero + Produkt-Mock | `#product` | 2-Spalten: CTAs + Glass-Mock (Lizenz/Demo) | `hero`, `preview` |
| 2 | Screenshots | `#screenshots` | Karussell + Thumb-Strip, Lightbox-Modal | `demo` |
| 3 | Why / Features | `#features` | 6× `FeatureCard` (lokal in `LandingPage.tsx`) | `why` |
| 4 | For whom | — | 4× `FeatureCard` + Lucide-Icons | `forWhom` |
| 5 | How it works | `#how-it-works` | 4 nummerierte Karten („Probe“) | `howItWorksProbe` |
| 6 | Hardware | — | Checklisten-Grid | `hardwareProbe` |
| 7 | Vergleichstabelle | — | Legacy vs. Caisty HTML-Table | `compareProbe` |
| 8 | Customer Portal | `#portal` | Einzelkarte mit Bullets | `portalBand` |
| 9 | Pricing | `#pricing` | 3× `PlanCard`, Billing-Toggle, Preise aus `config/pricing.ts` | `plans` + `pricing.*` |
| 10 | Payment | `#payment` | 2× `PaymentMethodCard` (SVG Logos) | `payment` |
| 11 | Install | — | Timeline + Mock-Panel | `install` |
| 12 | FAQ | `#faq` | `<details>` Akkordeon | `faq` |
| 13 | Fiscal | `#fiscal` | Shield-Box, Länderliste | `fiscal` |

**Lokale Subkomponenten** (nur `LandingPage.tsx`): `FeatureCard`, `PlanCard`, `PaymentMethodCard`, `StepPill`, `SmallStep`, PayPal/Stripe-SVGs.

**Danach:** `MarketingPreFooter` (Trust, Tech, WorkTrack-Karte auf Pricing — auf POS ausgeblendet) → `SiteLayout`-Footer.

### 2.4 Styling-System

| Aspekt | Ort | Details |
|--------|-----|---------|
| **Framework** | Tailwind v4 | `@import "tailwindcss"` in `src/index.css`; PostCSS |
| **Design-Tokens** | `src/index.css` → `.landing-page` | CSS-Variablen: `--color-accent`, `--color-text-primary`, `--color-bg`, …; Light-Override `.landing-page--light` |
| **Typografie** | Google Fonts in `index.css` | Body: DM Sans · Headings: Geist · Klassen `lp-font-heading`, `lp-section-h2`, `lp-title-h1` |
| **Komponenten-CSS** | `index.css` (scoped) | `lp-cta-primary/secondary`, `lp-surface-card`, `lp-reveal`, `lp-plan-highlight`, `lp-modal-*`, `lp-timeline-line`, … |
| **Inline / ad-hoc** | `CompanyPage.tsx`, `LandingPage.tsx`, `SiteLayout.tsx` | Viele `isLight ? "…" : "…"` Zweige, hardcodierte `#f97316`, `#0b1220`, `border-slate-200` |
| **CSS-Module** | — | **Nicht verwendet** |
| **Portal-Styling** | `index.css` (`.portal-*`) | Getrennt von Marketing — Redesign-Tokens sollten Portal **nicht** blind überschreiben |

**Company-Seite** nutzt Klassen `company-page landing-page` und profitiert damit von `lp-*`-Utilities, obwohl weniger Animationen als POS aktiv sind.

---

## 3. Content-Inventar: Zukunftsprodukte & Ein-Produkt-Strategie

### 3.1 Tabelle „Zukunftsprodukte“

| Stelle | Datei | Key / Text (EN) | Empfehlung |
|--------|-------|-----------------|------------|
| What we build — Item 4 | `src/lib/translations/company.ts` | `whatWeBuild.items[3]` → „Business Management Tools“ | **Entfernen** oder in Vision-Satz („We focus on one integrated platform…“) **überführen** |
| What we build — Item 5 | `company.ts` | `whatWeBuild.items[4]` → „Future Workforce Solutions“ | **„Coming soon“** (WorkTrack) oder **entfernen**; nicht als gleichwertiges Produkt listen |
| Footer Company-Modal | `src/lib/translations/common.ts` | `footer.companyModal.focusItems[3–4]` → Business tools / Future workforce | **Kürzen** auf POS + Portal + Cloud |
| Nav WorkTrack-Link | `src/layouts/SiteLayout.tsx` | `productMenu.worktrackTitle` | Behalten als **„WorkTrack (Coming soon)“** — kein gleichwertiger Nav-Eintrag neben POS; ggf. in Footer verschieben |
| Footer Produkt WorkTrack | `SiteLayout.tsx` + `common.footer` | `productWorktrackName`, `productWorktrackBlurb` | **„Coming soon“** beibehalten, Blurb kürzen |
| Pre-Footer WorkTrack-Karte | `MarketingPreFooter.tsx` | `preFooter` + `productMenu.worktrack*` | Auf **Pricing** sichtbar; auf POS ausgeblendet — nach Redesign: **eine** dezente Coming-soon-Zeile statt voller Karte |
| Product Mega-Menu (tot) | `ProductNavDropdown.tsx` | `worktrackTitle`, Features 1–5 | Datei löschen oder WorkTrack-Spalte streichen |
| Eigene WorkTrack-Seite | `src/routes/WorkTrackPage.tsx` | `worktrackPage.*` | Seite **behalten** als Coming-soon-Landing, aber **nicht** in Haupt-Nav prominieren |
| Pro-Plan Feature | `landing.ts` | `plans.pro.features[3]` → „Priority-ready structure for future features“ | **Neutral formulieren** (Multi-device), keine Produkt-Roadmap |
| Enterprise-Andeutung | — | Kein explizites ERP/CRM/AI auf Marketing-Seiten | — |
| ShiftIQ-Redirect | `App.tsx` | `/shiftiq` → `/worktrack` | Dokumentieren; bei Umbenennung beachten |

**POS-Seite selbst** fokussiert bereits auf Caisty POS + Portal; keine separaten Zukunftsprodukt-Listen außer generischen „future features“ in Pro-Plan.

### 3.2 i18n-Keys: Company (`company.*`)

Vollständig in `src/lib/translations/company.ts` für **en, fr, de, ar**. Struktur:

```
hero.badge | hero.headline | hero.subtitle
whoWeAre.title | whoWeAre.paragraphs[]
mission.title | mission.body
vision.title | vision.body
whatWeBuild.title | whatWeBuild.items[]   (5 Einträge)
principles.title | principles.items[]     (5 Einträge)
cta.headline | cta.ctaExplore
```

**Tunisia (`tn.caisty.com`):** `src/lib/translations/companyTn.ts` — festes **Französisch**, gleiche Key-Struktur; `CompanyPage` wählt `isTN ? companyTn : translations[language].company`.

### 3.3 i18n-Keys: Caisty POS (`landing.*`)

Quelle: `src/lib/translations/landing.ts` (en/fr/de/ar). Top-Level-Namespaces:

| Namespace | Keys (Auszug) |
|-----------|----------------|
| `hero` | badge, title, description, ctaPrimary, ctaSecondary, trialTrust, tagline, taglineLead |
| `preview` | title, caption, items[], liveBadge, demoBadge, devicesOnline, quote |
| `why` | title, description, feature1Title…feature6Text |
| `forWhom` | title, target1Title…target4Text |
| `plans` | title, intro, trial/starter/pro (je name, badge, priceLine, subline, features[]), note |
| `payment` | title, description, paypal.*, stripe.*, footnote |
| `install` | title, description, steps[], noteBefore/Highlight/After, mockTitle, platform*, downloadHint, small* |
| `fiscal` | title, lead, countries[], strict, disclaimer |
| `demo` | sectionTitle, shot*, carousel*, scrollStripHint, … |
| `portalBand` | title, description, bullets[] |
| `howItWorksProbe` | title, steps[] |
| `hardwareProbe` | title, intro, items[] |
| `compareProbe` | title, intro, col*, rows[], disclaimer |
| `faq` | title, items[{q,a}] |

**Tunisia:** `src/lib/translations/landingTn.ts` — Französisch, TND-Preise, Demo-CTA statt Pricing-Link (`LandingPage.tsx` Zeile 152–163).

**Pricing-Zusatzkeys:** `translations[language].pricing` für Billing-Toggle auf POS (`billing.monthly/yearly/discount`).

### 3.4 i18n-Status & Lücken

| Bereich | EN | DE | FR | AR | TN |
|---------|----|----|----|----|-----|
| `company` | ✓ | ✓ | ✓ | ✓ | FR-only via `companyTn` |
| `landing` | ✓ | ✓ | ✓ | ✓ | FR-only via `landingTn` |
| `common` (Nav/Footer/PreFooter) | ✓ | ✓ | ✓ | ✓ | Nav: kein LanguageSelector; Texte aus gewählter/globaler Sprache |
| `worktrackPage` | ✓ | ✓ | ✓ | ✓ | — |

**Fallbacks:** Kein automatischer EN-Fallback für fehlende Marketing-Keys (strukturell identisch). `html lang="en"` in `index.html` ist **statisch** — wechselt nicht mit AR/DE (A11y/SEO-Lücke). Portal-AR enthält vereinzelte EN-Strings — **nicht** auf Marketing-Seiten relevant.

**Gemeinsame Keys** (Nav/Footer, nicht in `company`/`landing`, aber sichtbar):

- `common.nav.company`, `common.productMenu.*`, `common.footer.*`, `common.preFooter.*`, `common.layout.*`

---

## 4. Assets & Medien

### 4.1 Verwendete Screenshots (POS-Galerie)

Eingebunden in `LandingPage.tsx` → `public/screenshots/`:

| Datei | ~Größe | Verwendung | Qualität |
|-------|--------|------------|----------|
| `CaistyPosDarkMode.png` | 95 KB | Galerie #0 | Echt — Dark POS |
| `dashboard.png` | 101 KB | #1 | Echt — Backoffice |
| `pos.png` | 86 KB | #2 | Echt — Checkout |
| `portal.png` | 66 KB | #3 | Echt — Portal (älterer Stand) |
| `pos-admin-pin.png` | 52 KB | #4 | Echt |
| `pos-product-management.png` | 74 KB | #5 | Echt |
| `pos-cashier-login.png` | 27 KB | #6 | Echt |
| `pos-queue-ticket.png` | 40 KB | #7 | Echt |
| `pos-admin-pins-settings.png` | 50 KB | #8 | Echt |
| `register.png` | **597 KB** | #9 | Echt, aber **zu schwer** — WebP/Resize nötig |

**Nicht in Galerie, aber im Repo:** `adminAccess.png`, `adminpin.png`, `login.png`, `produktmangement.png`, `queueticket.png` — vermutlich ältere Duplikate.

**Weitere Public-Assets:** `caisty-icon.svg`, `downloads/Caisty.PoS_0.3.0_x64-setup.exe` (Installer, nicht Marketing).

**Extern:** Footer-Tech-Badges laden `https://cdn.simpleicons.org/...` (Netzwerk-Abhängigkeit).

**Hero POS:** Kein echtes Screenshot — **CSS-Mock** (`preview`-Block) mit Platzhalter-Lizenz `CSTY-XXXX-XXXX-XXXX`.

### 4.2 Asset-Wunschliste (Screenshot-getriebenes Redesign)

| Asset | Zweck | Empfohlenes Format / Maß |
|-------|-------|---------------------------|
| Hero: POS-Verkaufsfläche (Light) | Above-the-fold, ersetzt Mock-Card | WebP, 1440×900 oder 16:10, <150 KB |
| Hero: POS Dark Mode | Alternativ-Hero / Theme-Demo | wie oben |
| Portal-Dashboard (aktuell) | Nach Phase III — Setup-Stepper sichtbar | 1280×800, WebP |
| Portal Business / Fiscal DE | „Cloud Platform“-Story | 1280×800 |
| Tisch-/Bestellansicht POS | Restaurant-Use-Case | 1440×900 |
| Beleg / Queue-Ticket Close-up | Druck-Story | 800×600 |
| Geräte-Bindung / Cloud-Sync POS-Admin | „Connected“-Narrativ | 1280×800 |
| Optional: 15–30 s Produktvideo | Hero oder Gallery | MP4 + Poster, <5 MB |
| OG-Image | Social Sharing (fehlt komplett) | 1200×630 PNG/WebP |
| Company-Seite | Abstrakt/Produkt-Montage oder Team — **kein** Screenshot-Zwang | Illustration oder 1 ruhiges Produktbild |

---

## 5. Technik & Qualität (Baseline)

### 5.1 Lighthouse (lokal, Production-Build)

**Setup:** `pnpm build` → `vite preview` Port 4173 → Lighthouse 12.8.2, Mobile-Emulation, 2026-07-03.

**Hinweis:** Category-Scores konnten wegen `LanternError: NO_LCP` (POS) nicht aggregiert werden; Einzel-Audits unten.

| Metrik / Audit | Company `/` | POS `/caisty-pos` |
|----------------|-------------|-------------------|
| FCP | 3,6 s (Score 0,32) | 3,5 s (0,34) |
| LCP | 4,8 s (0,31) | n/a (NO_LCP) |
| Speed Index | 5,9 s (0,48) | 5,8 s (0,50) |
| TBT | 150 ms (0,94) | n/a |
| CLS | 0,028 (1,0) | 0 (1,0) |
| TTI | 4,8 s (0,79) | n/a |
| `meta-description` | ✓ | ✓ |
| `document-title` | ✓ | ✓ |
| `html-has-lang` | ✓ (statisch `en`) | ✓ |
| `color-contrast` | **✗** (CTA-Link im dunklen Band) | **✗** |
| `image-alt` | n/a (keine Bilder) | ✓ |
| Bundle | `index-*.js` **773 KB** (gzip 214 KB) — ein Chunk | gleich |

**Performance-Hinweise:** Google Fonts blocking, großer JS-Bundle, `register.png` 597 KB, 10 Galerie-Bilder ohne responsive `srcset`/WebP.

### 5.2 SEO-Ist

| Thema | Status | Datei |
|-------|--------|-------|
| Default Title/Description | ✓ statisch in `index.html` | `apps/caisty-site/index.html` |
| Runtime Title/OG | ✓ `applyCompanySiteMeta()`, `applyCaistyPosProductMeta()` | `src/lib/siteDocumentMeta.ts` |
| OG URL | ✓ dynamisch (localhost / tn / www) | `siteDocumentMeta.ts` |
| OG Image | **✗ fehlt** | — |
| Twitter Card | `summary` (klein) | `index.html` |
| Canonical | **✗** | — |
| Sitemap | **✗** | — |
| robots.txt | **✗** (nicht im Repo) | — |
| hreflang | **✗** | — |
| `html lang` | Fix `en` — passt nicht zu DE/FR/AR-Umschaltung | `index.html` |

### 5.3 Responsivität (bekannte Punkte)

| Bereich | Beobachtung | Quelle |
|---------|-------------|--------|
| Hero-Glow Overflow | Mobile-Anpassung in CSS (`max-width` 768px) | `index.css` `.lp-hero-glow` |
| Nav | Hamburger `< lg`, Dropdown POS unter `CaistyPosQuickAccessMenu` | `SiteLayout.tsx` |
| Vergleichstabelle | `overflow-x-auto`, `min-w-[520px]` | `LandingPage.tsx` |
| Screenshot-Thumbs | Horizontal scroll, kleine Touch-Targets 88×52 px | `LandingPage.tsx` |
| Principles 5-Spalten | `lg:grid-cols-5` — auf Mobile gestapelt, wirkt leer | `CompanyPage.tsx` |
| Mega-Menu (tot) | `min-w-[42.5rem]` — nur relevant falls reaktiviert | `ProductNavDropdown.tsx` |

### 5.4 Dark Mode

| Aspekt | Implementierung |
|--------|-----------------|
| Mechanismus | `ThemeProvider` setzt `document.documentElement` Klasse `light`/`dark`; Pages lesen `useTheme()` |
| POS | `.landing-page` ohne `--light` = dunkle Tokens; `landing-page--light` für Hell |
| Company | Eigene `isLight`-Zweige + `landing-page--light`; CTA-Sektion **immer** dunkel |
| Portal | Separates Styling — nicht Teil dieser Seiten |
| Risiko | Viele `dark:` Tailwind-Klassen in Tabelle (`dark:border-white/10`) greifen nur mit Tailwind-`dark`-Variante; Hauptlogik läuft über `isLight`, nicht über `class="dark"` am Root → **inkonsistent**, aber funktional über Bedingungen |

### 5.5 Animationen & Interaktion

| Effekt | Umsetzung |
|--------|-----------|
| Hero Entrance | CSS `@keyframes lp-fade-up` auf `.lp-hero-*` | `index.css` |
| Scroll Reveal | `IntersectionObserver` → `.lp-reveal.visible` | `LandingPage.tsx` |
| Card Hover | `lp-card-over::after` Shimmer, `hover:shadow-md` | `index.css` |
| Badge Pulse | `lp-badge-pulse-dot` | `index.css` |
| Screenshot Lightbox | Fixed Modal `lp-modal-backdrop` | `LandingPage.tsx` |
| Nav Dropdown | Hover-Delay 130–160 ms | `CaistyPosQuickAccessMenu.tsx` |
| FAQ | Native `<details>` rotate ▾ | `LandingPage.tsx` |

Company-Seite: **kein** Scroll-Reveal; nur dezente `hover:shadow` auf Karten.

---

## 6. Risiken fürs Redesign

### 6.1 Mitbetroffene Seiten bei Shared-Component-Änderungen

| Änderung an | Betrifft auch |
|-------------|----------------|
| `SiteLayout` Header/Footer | **Alle** Marketing-Seiten, Legal, Auth, Contact, WorkTrack |
| `common.footer` / `productMenu` i18n | Footer-Modals, Nav, Pre-Footer |
| `index.css` `.landing-page` Tokens | Company, POS, ggf. Pricing |
| `MarketingPreFooter` | `/pricing`, indirekt POS (wenn Logik `showProductSection` ändert) |
| `CaistyLogo` / Header-Branding | Portal-Layout **nicht** — nur SiteLayout |
| `ThemeToggle` / `theme.tsx` | Portal + Marketing |
| `TechStackCardGrid` | Pre-Footer, ggf. zukünftige About-Seite |

**Portal** (`PortalLayout.tsx`) nutzt eigenes CSS — Marketing-Redesign sollte Portal-Tokens **nicht** ohne Abstimmung ändern.

### 6.2 Harte CTA- & Routen-Abhängigkeiten

| CTA / Link | Ziel | Dateien |
|------------|------|---------|
| Start free / Register | `/register` | `LandingPage`, `CaistyPosQuickAccessMenu`, `ProductNavDropdown` |
| Login | `/login` | wie oben |
| View pricing | `/pricing` oder `#pricing` auf POS | `LandingPage`, Nav-Pills |
| Explore Caisty POS | `/caisty-pos` | `CompanyPage` |
| Portal (nach Login) | `/portal`, `/portal/install`, … | Auth-Flow |
| WorkTrack | `/worktrack` | Nav, Footer, Pre-Footer |
| Legal | `/legal/*`, `/imprint` | Footer |
| Anker | `#product`, `#screenshots`, `#features`, `#pricing`, `#payment`, `#fiscal`, `#faq`, `#portal`, `#how-it-works` | POS, Nav-Dropdown |
| TN Demo | `mailto:info@caisty.com` | `LandingPage` (market `tn`) |
| WhatsApp | extern | `SiteLayout` (tn only) |

**Nicht brechen:** `vercel.json` SPA-Rewrites für `/portal/*`; Download-Header für `/downloads/*`.

### 6.3 Build & Deploy

| Thema | Details |
|-------|---------|
| Hosting | Vercel (`apps/caisty-site/vercel.json`) |
| SPA | Alle Nicht-`portal`/`downloads`-Pfade → `index.html` |
| Env | `VITE_CLOUD_API_URL`, `VITE_POS_WINDOWS_URL`, `VITE_POS_LATEST_VERSION` (`vite.config.ts`) |
| Bildoptimierung | **Keine** Pipeline (kein `vite-imagetools`, kein CDN-Resize) |
| Fonts | Extern Google Fonts — DSGVO/Performance-Risiko |
| Monorepo | `pnpm` Workspace; Build `tsc -b && vite build` |

---

## 7. Empfohlene Umbau-Reihenfolge

| Schritt | Inhalt | Testen |
|---------|--------|--------|
| **1. Tokens** | Zentrale Farben, Spacing, Typo-Skala in `index.css` / optional `tokens.ts`; Hex-Duplikate reduzieren | Light/Dark auf Company + POS; Kontrast-Fix CTA |
| **2. Nav & Footer** | Ein-Produkt-Nav (POS primary); WorkTrack dezentral; Footer-Modal-Listen kürzen; `ProductNavDropdown` entfernen oder konsolidieren | Mobile Menu, Dropdown, alle `common.*`-Sprachen, TN-Host |
| **3. Company** | Weniger Karten-Raster; Mission/Vision/Principles visuell straffen; `whatWeBuild` auf 3 Säulen (POS, Portal, Cloud) | i18n 4 Sprachen + `companyTn`; CTA → `/caisty-pos` |
| **4. POS** | Hero mit echtem Screenshot; Gallery optimieren (WebP, lazy); Sections zusammenführen (Probe-Blöcke); Pricing-Teaser vs. `/pricing` | Anker-Navigation, Billing-Toggle, `pricing.ts` EUR/TND, Lighthouse erneut |
| **5. SEO/A11y** | `og:image`, `lang`-Attribut dynamisch, Sitemap, hreflang für www/tn | Meta auf `/` und `/caisty-pos`, AR-RTL Layout |
| **6. Pre-Footer** | Optional nur auf `/pricing` oder ganz in Footer integrieren | `/pricing`, `/caisty-pos` |

---

## 8. Kurz-Fazit

Die Architektur ist klar (eine SPA, getrennte Copy-Module, Host-Market TN), aber das **visuelle System** ist gewachsen statt designed. Für die Ein-Produkt-Strategie sind vor allem **Company `whatWeBuild`**, **Footer/Pre-Footer/Nav** und die **WorkTrack-Sichtbarkeit** anzupassen — nicht die POS-Produktstory selbst. Technische Baseline: mittlere Performance, gute CLS, SEO-Grundlagen ohne Social/Sitemap, A11y-Kontrast als schneller Win. Redesign sollte mit Tokens und globaler Shell beginnen, bevor einzelne Sektionen „modernisiert“ werden.
