# Analyse: Plans & Billing — Customer Portal Cleanup (Sprint 1.8)

**Stand:** 2026-07-07  
**Scope:** Nur `/portal/billing` (`PortalPlanBillingPage`) — read-only Code- und UX-Analyse  
**Methode:** Review von `PortalPlanBillingPage`, allen Billing-Komponenten, `deriveBillingState`, `usePortalBillingData`, Übersetzungen, Abgleich mit Licenses, Business, Dashboard, Invoice-Detail  
**Wichtig:** Dieses Dokument ist **nur Analyse**. Keine Code-, UI-, API- oder Build-Änderungen.

---

## Executive Summary

Die Seite **Plans & Billing** ist funktional die wichtigste Monetarisierungs- und Abrechnungsfläche im Portal — sie vereint jedoch **zu viele Rollen auf einer langen Scroll-Seite**: Abo-Status, Lizenz-Key, Zahlungs-Platzhalter, vollständiger Plan-Katalog, Rechnungen, Steuerprofil, Download-Roadmap und Quick Actions.

Im Vergleich zu den bereits bereinigten Seiten (Business 1.5, Licenses 1.6, Devices 1.7) wirkt Plans & Billing noch wie ein **frühes „Billing Center + Pricing Page + Roadmap“-Hybrid**. Der Kunde muss scrollen, um die Kernfragen zu beantworten — und sieht dabei viele **Coming-soon-** und **Doppel-**Informationen.

**Kernproblem:** Die Seite beantwortet die Ziel-Frage *„Wie sieht mein Abonnement und meine Abrechnung aus?“* nur indirekt. Stattdessen dominiert der **Plan-Katalog** (4 Pricing Cards) und redundante KPI-/Subscription-Darstellungen.

**Fazit:** Die Seite ist **noch nicht auf Enterprise-/SaaS-Niveau** (Stripe, GitHub, Vercel, Linear). Ein Sprint 1.8 ist **sinnvoll und notwendig** — kein reiner Polish-Sprint wie Licenses 1.6, sondern ein **struktureller Cleanup** analog Business/Devices, mit Fokus auf kompakte Subscription Summary, echte Rechnungen und entfernte Platzhalter.

**Empfehlung:** Von ~9 Sektionen auf **4–5 fokussierte Bereiche** reduzieren. Ziel: Desktop ohne langes Scrollen für den Normalfall (bezahlter Plan + wenige Rechnungen).

---

## 1. Informationsarchitektur

### Aktuelle Sektionen (Ist)

| # | Sektion | Komponente | Datenquelle |
|---|---------|------------|-------------|
| 1 | Header | `PortalPlanBillingPage` | i18n |
| 2 | KPI-Leiste (6 Tiles) | `BillingOverview` | `deriveBillingState.overview` |
| 3 | Current Subscription | `CurrentSubscription` | `primaryLicense`, `customer`, Stripe-Flags |
| 4 | Payment | `PaymentSection` | `deriveBillingState.paymentPlaceholders` (100 % Platzhalter) |
| 5 | Plans (Pricing Cards) | `BillingPlansPanel` | `PRICING`, `licenses`, Checkout-Eligibility |
| 6 | Invoices | `InvoicesSection` + `InvoicesTable` | `fetchPortalInvoices()` |
| 7 | Billing History | `BillingHistorySection` | Statischer Empty-Text |
| 8 | VAT & Tax | `VatTaxSection` | `fetchPortalBusiness()` |
| 9 | Downloads | `BillingDownloads` | 3× Coming soon |
| 10 | Quick Actions | `BillingQuickActions` | `deriveBillingState.quickActions` |

Zusätzlich: Error-Banner für Lizenz-/Portal-Fehler.

### Welche Sektionen beantworten wirklich Billing?

| Sektion | Billing-relevant? | Bewertung |
|---------|-------------------|-----------|
| KPI-Leiste | Teilweise | Redundant zu Subscription |
| Current Subscription | **Ja** | Kern — aber zu groß |
| Payment | **Ja (Ziel)** | Aktuell wertlos (Platzhalter) |
| Plans | **Ja (Upgrade)** | Zu prominent als Vollkatalog |
| Invoices | **Ja** | Kern |
| Billing History | Nein | Leerer Platzhalter |
| VAT & Tax | Grenzfall | Read-only Business-Daten |
| Downloads | Nein | Roadmap |
| Quick Actions | Teilweise | Duplikat zu Subscription/Plans |

### Was gehört woanders hin?

| Inhalt | Aktuell auf Billing | Gehört eher zu |
|--------|---------------------|----------------|
| License Key (KPI + Subscription) | Doppelt | **Licenses** (Inventar aller Keys) — Billing nur Primary Key oder Link |
| VAT ID, Tax Mode, Receipt Mode | VAT-Sektion | **Business** (editierbar) — Billing nur Kurzinfo + Link |
| Vollständige Lizenz-Tabelle | — (separate Seite) | **Licenses** — korrekt getrennt, aber Billing dupliziert Primary Key |
| Geräte-Limits pro Plan | In Plan-Beschreibungen | **Devices** (Seat Summary) |
| Verkäufe / Umsatz | — | **Orders / Reports** |
| Support-Kontakt | Quick Action mailto | **Support** — als Footer-Link ok |
| Enterprise-Roadmap | Plan-Card „Coming soon“ | **Pricing-Landing** oder Sales-Kontakt |

### Abgrenzung zu Licenses (nach Sprint 1.6)

Die Trennung **Billing = Abo & Zahlung** vs. **Licenses = Key-Inventar** ist architektonisch richtig. Billing sollte **nicht** zur zweiten Licenses-Seite werden — der License Key darf in der Subscription Summary **einmal** erscheinen (oder nur verlinkt werden).

---

## 2. KPI-Leiste

### Ist-Zustand

6 KPIs in `BillingOverview` (`billing-kpi-grid`, Desktop 6 Spalten):

1. Current Plan  
2. Status  
3. License Key  
4. Valid Until  
5. Billing Interval  
6. Provider  

Quelle: `deriveBillingState.deriveOverview()` aus `primaryLicense` + `customer.paidBillingPeriod` + `stripeBillingPortalEligible`.

### Bewertung

| KPI | Sinnvoll? | Problem |
|-----|-----------|---------|
| Current Plan | Ja | **Doppelt** mit Current Subscription |
| Status | Ja | **Doppelt**; Status-String nicht i18n (`active` raw) |
| License Key | Grenzfall | **Doppelt**; gehört primär zu Licenses |
| Valid Until | Ja | **Doppelt**; für Renewal relevant |
| Billing Interval | Ja | **Doppelt** |
| Provider | Niedrig | Nur „Stripe“ oder „Not configured“ — wenig Mehrwert als eigene KPI |

### Empfehlung

**KPI-Leiste entfernen oder auf 0–2 Metriken reduzieren.**

Für ein modernes Billing Center reicht eine **Subscription Summary Card** oben:

- Plan + Status-Badge  
- Billing interval  
- Next renewal / Valid until  
- Primary CTA: Manage subscription (Stripe Portal)

Die 6-KPI-Leiste ist ein **Dashboard-Muster**, kein Billing-Muster (Stripe/Vercel zeigen keine KPI-Zeile über dem Abo).

---

## 3. Current Subscription

### Ist-Zustand (`CurrentSubscription.tsx`)

Große Karte mit:

- Orange Border-Accent, „YOUR CURRENT PLAN“  
- Plan-Name (Trial/Starter/Pro), Status-Badge  
- License Key (mono)  
- Valid Until  
- Monthly/Yearly-Hinweis (wenn paid)  
- Account holder + **veralteter** `paymentNote` („Payment … will be available later“)  
- Optional: Manage-Subscription-Button (nur wenn `stripeBillingPortalEligible`)

### Bewertung

| Aspekt | Bewertung |
|--------|-----------|
| Informationsgehalt | Hoch — beantwortet Plan, Status, Renewal, Key |
| Kompaktheit | **Niedrig** — visuell große Hero-Karte |
| Copy | `paymentNote` wirkt **veraltet** (Stripe Portal existiert bereits) |
| i18n Plan-Namen | Hardcoded „Starter“/„Pro“ statt `t.pos.planStarter` |
| Manage Subscription | **Korrekt** — zentraler SaaS-Flow |

### Kann daraus eine kompakte Summary werden?

**Ja — das ist das empfohlene Zielbild.**

Beispiel (SaaS-typisch):

```
Starter Plan          [Active]
Monthly · Renews Dec 31, 2026
License key: KEY-123…        [Copy]

[Manage subscription]   [Upgrade plan]
```

Statt einer großen Karte mit Account-Holder-Block und veraltetem Payment-Hinweis.

---

## 4. Payment

### Ist-Zustand (`PaymentSection` + `derivePaymentPlaceholders`)

Vier Zeilen, alle **„Coming soon“**:

- Payment method  
- Stripe  
- PayPal  
- SEPA  

Keine API-Anbindung. Keine Unterscheidung nach Stripe-Eligibility.

### Bewertung

| Frage | Antwort |
|-------|---------|
| Soll die Karte sichtbar sein ohne echte Daten? | **Nein** — wirkt wie unfertiges Produkt |
| Was tun bei Stripe-Portal-Eligibility? | Zahlungsmethode über **Stripe Billing Portal** verwalten — keine lokale Payment-Card nötig |
| PayPal/SEPA separat anzeigen? | Nur wenn API echte Methoden liefert — sonst nicht |

### Empfohlenes Zielbild

**Variante A (Stripe aktiv):** Keine eigene Payment-Sektion — „Manage subscription“ öffnet Stripe (Zahlungsmethode, Rechnungen, Kündigung).

**Variante B (kein Stripe / Trial):**

```
No payment method configured
Add a paid plan to set up billing.

[Choose plan]
```

Keine 4× Coming-soon-Zeilen. Das ist schlechter als gar keine Sektion.

---

## 5. Pricing Cards

### Ist-Zustand (`BillingPlansPanel.tsx`)

- Billing-Period-Toggle (Monthly / Yearly)  
- 4-Spalten-Grid: **Trial | Starter (Recommended) | Pro | Enterprise (Coming soon)**  
- Checkout-Eligibility-Logik (Upgrade, Downgrade, Interval-Wechsel)  
- Trial-Button (`createTrialLicense`)  
- Upgrade → `/portal/checkout?plan=…`  
- VAT-Footnote unten  

### Fehlende Informationen

| Fehlt | Relevanz |
|-------|----------|
| **Aktueller Plan visuell hervorgehoben** | Hoch — nur CTA-Text „Current plan“, Starter hat immer „Recommended“-Badge |
| Device-Limits (1 vs. 3) | Mittel — steht nur in Beschreibungstext |
| Nächstes Renewal / Preis des **aktuellen** Plans | Hoch für Billing Center |
| Was im aktuellen Plan enthalten ist (Kurz) | Mittel |
| Klare Upgrade-Pfade (nur relevante Cards) | Hoch |

### Doppelte Informationen

| Doppelt mit |
|-------------|
| KPI-Leiste + Subscription (Plan, Interval) |
| Licenses-Seite (Plan pro Key) |
| Öffentliche Pricing Page (`/pricing`) |
| Devices Seat Summary (Geräte-Limits) |

### Trial bei bezahltem Plan?

**Aktuell:** Trial-Card bleibt sichtbar, Button disabled („Trial already used“).

**Empfehlung:** Bei aktivem Starter/Pro **Trial-Card ausblenden oder einklappen**. SaaS zeigt keinen Trial-Tarif, wenn bereits bezahlt. Reduziert visuelles Rauschen und Scroll-Länge.

### Current Plan hervorheben?

**Ja.** Die aktive Plan-Card sollte:

- „Current plan“-Badge tragen (nicht generisch „Recommended“ auf Starter)  
- Andere Cards nur zeigen, wenn Upgrade/Wechsel möglich  
- Downgrade-Optionen nicht als aktive Cards darstellen  

### Enterprise

**Aktuell:** Volle Card mit „Coming soon“.

**Empfehlung:** Nur **kompakte Kontaktzeile** oder Link zu Sales — keine vierte Pricing-Card mit disabled Button. Entspricht Vercel/Linear („Contact us for Enterprise“).

---

## 6. Invoices

### Ist-Zustand (`InvoicesTable`)

Spalten: Number, Period, Amount, Status, Created At, Details →

- Empty State mit Hero (gut)  
- Detail-Seite `/portal/invoices/:id` mit **Print as PDF** (`fetchPortalInvoiceHtml`)  
- `/portal/invoices` leitet auf `/portal/billing#billing-invoices` um  

### Bewertung der Tabelle

| Feature | Vorhanden? | Bewertung |
|---------|------------|-----------|
| Basis-Tabelle | Ja | **Ausreichend** für MVP |
| Status (paid/open) | Ja (raw string) | Funktional, **i18n fehlt** |
| Detail-Link | Ja | Gut |
| PDF/Download | Nur auf Detail-Seite | **Fehlt in Tabelle** — Nice-to-have |
| Copy Invoice Number | Nein | Nice-to-have (wie License Key Copy) |
| Filter (Status) | Nein | Sinnvoll ab ~10 Rechnungen |
| Search | Nein | Nice-to-have |
| Pagination | Nein | API liefert volle Liste — ok für wenige Rechnungen |

### Empfehlung

Die Invoice-Tabelle ist der **stärkste echte Billing-Block** auf der Seite. Für Sprint 1.8:

- Behalten und ggf. **oberhalb** der Plan-Cards platzieren (Rechnungen = Abrechnung)  
- Optional: Download-Icon pro Zeile (wenn Detail-HTML-URL bekannt)  
- Kein separates „Billing History“-Panel nötig  

---

## 7. Billing History

### Ist-Zustand

`BillingHistorySection` — nur statischer Text: *„No billing history available yet.“*

Keine API, keine Daten, keine Aktion.

### Bewertung

| Frage | Antwort |
|-------|---------|
| Eigene Sektion nötig? | **Nein** |
| Reicht Invoice-Tabelle? | **Ja** — Invoices **sind** Billing History |

**Empfehlung:** Sektion **komplett entfernen** (nicht rendern). Kein Ersatz nötig.

---

## 8. VAT & Tax

### Ist-Zustand (`VatTaxSection`)

Read-only aus Business-Profil:

- VAT configuration (vatId oder „Not configured“)  
- Billing country  
- Currency  
- Tax mode (aus `receiptMode`)  

### Bewertung

| Aspekt | Bewertung |
|--------|-----------|
| Inhaltlich korrekt | Steuerdaten beeinflussen Rechnungen |
| Platzierung | **Grenzfall** — Bearbeitung gehört zu **Business** |
| Duplikat | Business-Seite hat Fiscal Summary + Edit Form |
| SaaS-Vergleich | Stripe zeigt Tax ID in Billing Settings, nicht als große eigene Card |

### Empfehlung

**Nicht als eigene große Sektion.** Stattdessen:

- In Subscription Summary oder Footer: *„Billing details · Edit in Business“*  
- Max. 1–2 Zeilen (Country, VAT ID) read-only  
- Vollständige Steuerkonfiguration → **Business**  

---

## 9. Downloads

### Ist-Zustand (`BillingDownloads`)

Drei disabled Buttons mit „Coming soon“:

- Download invoice  
- Download receipt  
- Export billing history  

### Bewertung

100 % Platzhalter. Invoice-PDF existiert bereits auf der **Invoice-Detail-Seite** (`printPdf`).

| Option | Empfehlung |
|--------|------------|
| Behalten | **Nein** — schadet Professionalität |
| In Rechnungen integrieren | **Ja** — Download pro Invoice-Zeile oder Detail |
| Export History | Erst wenn API existiert |

**Empfehlung:** Sektion **entfernen**. Downloads über Invoice-Detail/Tabelle.

---

## 10. Quick Actions

### Ist-Zustand (`BillingQuickActions`)

| Action | Status | Bewertung |
|--------|--------|-----------|
| Upgrade plan | Aktiv → `#billing-plans` | **Sinnvoll** |
| Manage subscription | Aktiv wenn Stripe | **Duplikat** zu CurrentSubscription-Button |
| Billing portal | Aktiv wenn Stripe | **Duplikat** — ruft dieselbe `handleManageSubscription()` auf |
| Contact billing | mailto support | **Sinnvoll** als Footer-Link |

### Empfehlung

Keine eigene Quick-Actions-Sektion. CTAs in **Subscription Summary** integrieren:

- Primary: Manage subscription (Stripe)  
- Secondary: Upgrade plan (scroll/expand plans)  
- Footer: Contact support  

„Billing portal“ und „Manage subscription“ sind **dieselbe Aktion** — nur einmal anbieten.

---

## 11. Scroll & Seitenlänge

### Geschätzte Höhe (Desktop, Ist)

| Block | ca. Höhe |
|-------|----------|
| Header + Subtitle | ~80 px |
| KPI-Leiste (6) | ~90 px |
| Subscription + Payment (Split) | ~220 px |
| Plans (Toggle + 4 Cards) | ~450–520 px |
| Invoices (3 Zeilen) | ~200 px |
| History + VAT (Split) | ~160 px |
| Downloads + Quick Actions | ~140 px |
| **Summe ohne viele Rechnungen** | **~1.350–1.400 px** |

Bei 1080p-Viewport mit Portal-Chrome: **deutliches Scrollen** nötig, bevor der Kunde alle Kerninfos sieht.

### Was kann entfallen?

| Entfernen | Einsparung |
|-----------|------------|
| KPI-Leiste | ~90 px + kognitive Last |
| Payment-Platzhalter | ~120 px |
| Billing History | ~80 px |
| VAT-Sektion (groß) | ~100 px |
| Downloads | ~80 px |
| Quick Actions | ~80 px |
| Trial-Card bei Paid | ~150 px |
| Enterprise-Card → Zeile | ~120 px |

### Was zusammenführen?

- KPI + Subscription → **eine** Subscription Summary  
- Manage Subscription + Billing Portal + Quick Actions → **ein** Stripe-CTA  
- History + Downloads → in Invoices aufgehen  

### Ziel

Desktop **~700–900 px** für Standardfall (Paid Plan, 0–5 Rechnungen, kompakte Plan-Zeile statt 4 Cards wenn kein Upgrade nötig).

---

## 12. Enterprise SaaS Vergleich

| Muster | Stripe | GitHub | Shopify | Vercel | Linear | Caisty Ist |
|--------|--------|--------|---------|--------|--------|------------|
| Plan + Status oben | ✅ Kompakt | ✅ | ✅ | ✅ | ✅ | KPI + große Card |
| Next renewal | ✅ | ✅ | ✅ | ✅ | — | Nur Valid Until |
| Payment method | ✅ oder Portal | Portal | ✅ | Portal | Portal | 4× Coming soon |
| Invoices Liste | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ (gut) |
| Pricing-Katalog auf Billing | Nein (separate Pricing) | Nein | Teilweise | Nein | Nein | **4 Cards** |
| Platzhalter-Sektionen | Nein | Nein | Nein | Nein | Nein | **4 Sektionen** |
| Steuerprofil | Kurz in Settings | — | Business | — | — | Eigene große Card |

**Fazit:** Caisty mischt **Billing Dashboard** mit **Pricing Page**. Marktführer trennen: Billing = *mein* Abo; Pricing = *Kaufentscheidung* (oft externe Seite oder Modal).

---

## 13. Single Purpose

### Soll die Seite primär beantworten?

> **„Wie sieht mein aktuelles Abonnement und meine Abrechnung aus?“**

| Rolle | Soll auf Billing? | Ist |
|-------|-------------------|-----|
| Aktueller Plan & Renewal | **Ja** | Ja (aber redundant) |
| Upgrade | **Ja** (sekundär) | **Dominierend** (4 Cards) |
| Rechnungen | **Ja** | Ja |
| Zahlungsmethode | **Ja** | Platzhalter |
| Lizenz-Key-Inventar | Nein (→ Licenses) | Teilweise dupliziert |
| Steuerkonfiguration | Nein (→ Business) | Eigene Sektion |
| Produktkatalog | Nein | 4 Pricing Cards |
| Roadmap | Nein | Downloads, Enterprise, Payment |
| Download Center | Nein | Downloads-Sektion |

**Bewertung:** Single Purpose ist **verletzt**. Die Seite ist zu 40 % echtes Billing, zu 40 % Pricing/Upgrade-UI, zu 20 % Roadmap/Platzhalter.

---

## 14. Technische Analyse

### Komponenten — bleiben (ggf. umbenannt/verschlankt)

| Komponente | Rolle nach Cleanup |
|------------|-------------------|
| `PortalPlanBillingPage` | Orchestrator — deutlich schlanker |
| `CurrentSubscription` | → **`SubscriptionSummary`** (kompakt) |
| `BillingPlansPanel` | → **`UpgradePlansSection`** (konditional, einklappbar) |
| `InvoicesSection` / `InvoicesTable` | Behalten — evtl. Download-Spalte |
| `deriveBillingState` | Vereinfachen — weniger Platzhalter-Derivation |
| `usePortalBillingData` | Unverändert — APIs bleiben |
| `BillingInfoGrid` | Nur falls kurze Meta-Zeilen (VAT-Link) |

### Komponenten — nicht mehr rendern (Dateien behalten)

| Komponente | Grund |
|------------|-------|
| `BillingOverview` | Redundant zu Subscription Summary |
| `PaymentSection` | Platzhalter — ersetzen durch conditional `PaymentMethodCard` oder Stripe-only |
| `BillingHistorySection` | Leer — Invoices reichen |
| `VatTaxSection` | → Business-Link |
| `BillingDownloads` | Roadmap |
| `BillingQuickActions` | CTAs in Summary/Footer |

### Neue Komponenten (empfohlen)

| Komponente | Zweck |
|------------|-------|
| `SubscriptionSummary` | Plan, Status, Interval, Renewal, Key (optional), Manage/Upgrade CTAs |
| `PaymentMethodCard` | Nur wenn sinnvoll: „No payment method“ oder Stripe-delegiert |
| `UpgradePlansSection` | Schlanker Plan-Block — nur relevante Cards |
| `BillingFooter` | Licenses · Support · Business (wie andere Portal-Seiten) |

### `deriveBillingState` — Anpassungen (konzeptionell)

- `overview` → entfernen oder in `subscriptionSummary` mergen  
- `paymentPlaceholders` → durch `paymentStatus: 'stripe_portal' | 'none' | 'coming_soon'` ersetzen  
- `downloadActions` → entfernen  
- `quickActions` → in Page/SubscriptionSummary inline  
- `vatFields` → optional `billingProfileSnippet` (2 Felder max)  

### APIs — unverändert (laut Scope)

- `fetchPortalLicenses`, `fetchPortalInvoices`, `fetchPortalBusiness`, `fetchPortalMe`  
- `createStripeBillingPortalSession`  
- `createTrialLicense`, Checkout-Redirect  

Keine neuen Endpoints für Sprint 1.8 nötig — Cleanup ist **UI/IA-only**.

---

## Problemliste

### HIGH

| # | Problem |
|---|---------|
| H1 | Seite zu lang — ~9 Sektionen, ~1.400 px Scroll |
| H2 | KPI-Leiste + Current Subscription — massive Redundanz |
| H3 | Payment-Sektion 100 % „Coming soon“ — wirkt unfertig |
| H4 | Billing History, Downloads, Quick Actions — leere/Roadmap-Sektionen |
| H5 | Plan-Katalog (4 Cards) dominiert statt Abo-Übersicht |
| H6 | Single Purpose verletzt — Billing + Pricing + Roadmap gemischt |

### MEDIUM

| # | Problem |
|---|---------|
| M1 | License Key doppelt (KPI + Subscription) — Licenses-Seite existiert |
| M2 | Trial-Card bei bezahltem Plan unnötig sichtbar |
| M3 | Starter immer „Recommended“ — nicht „Current plan“ |
| M4 | `paymentNote` veraltet trotz Stripe Portal |
| M5 | Manage Subscription + Billing Portal — identische Aktion doppelt |
| M6 | VAT & Tax — falsche Hauptseite (Business ist Source of Truth) |
| M7 | Status/Plan teils nicht i18n (raw `active`, hardcoded Starter/Pro) |
| M8 | Subtitle erwähnt „licenses“ — verwischt Abgrenzung zu Licenses-Seite |

### LOW

| # | Problem |
|---|---------|
| L1 | Invoice-Status nicht i18n |
| L2 | Kein Copy für Invoice Number |
| L3 | Kein PDF-Download direkt in Tabelle |
| L4 | Enterprise als volle Card statt Kontaktzeile |
| L5 | Provider-KPI geringer Informationswert |

---

## Redundanzanalyse

```
┌─────────────────────────────────────────────────────────────┐
│  KPI: Plan │ Status │ Key │ Valid │ Interval │ Provider    │
└──────────────────────────┬──────────────────────────────────┘
                           │ ~80% overlap
┌──────────────────────────▼──────────────────────────────────┐
│  Current Subscription: Plan, Status, Key, Valid, Interval      │
└──────────────────────────┬──────────────────────────────────┘
                           │
┌──────────────────────────▼──────────────────────────────────┐
│  Plans Panel: Plan-Namen, Interval-Toggle, Upgrade-CTAs        │
└─────────────────────────────────────────────────────────────┘

Payment (Coming soon)  ←→  Quick Actions: Billing Portal  ←→  Subscription: Manage
        (keine Daten)              (gleiche Stripe-URL)           (gleiche Funktion)

Billing History (leer)  ←→  Invoices Table (echte Daten)

VAT & Tax  ←→  Business Fiscal Summary + Edit Form

Downloads (Coming soon)  ←→  Invoice Detail: Print PDF (existiert)
```

---

## UX-Bewertung

| Kriterium | Note | Kommentar |
|-----------|------|-----------|
| Klarheit „Welchen Plan habe ich?“ | B+ | Info vorhanden, aber versteckt zwischen KPI und Cards |
| „Wann verlängert sich mein Abo?“ | B | Valid Until sichtbar, „Next renewal“-Sprache fehlt |
| „Wie upgraden?“ | A- | Checkout-Eligibility gut implementiert |
| „Welche Rechnungen?“ | B+ | Tabelle solide, Detail mit PDF |
| „Welche Zahlungsmethode?“ | D | Nur Platzhalter — keine Antwort |
| Professionalität | C+ | Zu viele Coming soon |
| Scroll-Effizienz | C | Deutlich unter Business/Devices nach Cleanup |
| Konsistenz mit Portal | B | Gleiche Panel-Sprache, aber mehr Ballast als Licenses/Devices |
| i18n | B- | Lücken bei Status, Plan-Namen in Subscription |

**Gesamt:** Funktional nutzbar, aber **nicht** auf dem Niveau der bereinigten Portal-Seiten. Sprint 1.8 ist gerechtfertigt.

---

## Empfohlenes Zielbild

Die Seite wird zum **Billing Center**:

1. Der Kunde sieht **sofort** Plan, Status, Intervall und nächste Verlängerung.  
2. **Eine** klare Aktion für Zahlung/Abo (Stripe Portal oder Plan wählen).  
3. **Rechnungen** direkt darunter — das ist die Abrechnungshistorie.  
4. **Upgrade-Optionen** nur wenn relevant — nicht als permanenter 4-Spalten-Katalog.  
5. **Keine** Coming-soon-Grids, keine leeren History/Download-Sektionen.  
6. Steuerdaten: Link zu Business, nicht eigene Card.  
7. Footer: Licenses · Business · Support.

---

## Empfohlene Seitenstruktur (Sprint 1.8)

```
Header
  Plans & Billing
  Your subscription and invoices.

Subscription Summary          ← ersetzt KPI + Current Subscription + Quick Actions
  Starter Plan · Active
  Monthly · Renews Dec 31, 2026
  [Manage subscription]  [Upgrade plan]

Payment (conditional)         ← nur wenn kein Stripe: "No payment method" + CTA
  — oder komplett weggelassen wenn Stripe Portal aktiv —

Invoices                      ← bestehende Tabelle (evtl. höher priorisiert)
  …

Upgrade Plans (conditional)   ← nur wenn Upgrade/Trial möglich; eingeklappt wenn Pro
  [Monthly | Yearly]
  relevante Plan-Cards only

Footer
  Licenses · Business · Support
```

**Nicht rendern:** KPI-Leiste, Billing History, VAT-Sektion (groß), Downloads, Quick Actions, Payment-Platzhalter-Grid, Enterprise-Card (→ Zeile).

---

## Empfohlene Komponenten

| Komponente | Beschreibung |
|------------|--------------|
| `SubscriptionSummary` | Kompakte Abo-Karte: Plan, Status, Interval, Renewal, optional Key + Copy, CTAs |
| `PaymentMethodCard` | Optional: Empty state oder Hinweis „Managed in Stripe“ |
| `InvoicesSection` | Bestehend — ggf. mit Download-Aktion |
| `UpgradePlansSection` | Refactor aus `BillingPlansPanel` — conditional rendering |
| `BillingFooter` | 3 Links, konsistent mit Business/Devices |
| `deriveSubscriptionSummary()` | Neuer derive-Block statt `overview` |
| `deriveUpgradeVisibility()` | Ob/welche Plan-Cards zeigen |

---

## Dateiliste (betroffen bei Umsetzung)

| Datei | Aktion |
|-------|--------|
| `src/routes/PortalPlanBillingPage.tsx` | Struktur reduzieren |
| `src/components/billing/CurrentSubscription.tsx` | → `SubscriptionSummary.tsx` oder umbauen |
| `src/components/billing/BillingOverview.tsx` | Nicht mehr rendern |
| `src/components/billing/PaymentSection.tsx` | Ersetzen/conditional |
| `src/components/billing/BillingPlansPanel.tsx` | Conditional Upgrade-Logik |
| `src/components/billing/BillingHistorySection.tsx` | Nicht mehr rendern |
| `src/components/billing/VatTaxSection.tsx` | Nicht mehr rendern |
| `src/components/billing/BillingDownloads.tsx` | Nicht mehr rendern |
| `src/components/billing/BillingQuickActions.tsx` | Nicht mehr rendern |
| `src/components/billing/InvoicesSection.tsx` | Behalten |
| `src/components/billing/InvoicesTable.tsx` | Optional erweitern |
| `src/lib/billing/deriveBillingState.ts` | Vereinfachen |
| `src/lib/billing/types.ts` | Neue Summary-Types |
| `src/lib/billing/deriveBillingState.test.ts` | Tests anpassen |
| `src/lib/translations/portal/{en,de,fr,ar}.ts` | Neue Copy, Subtitle, Renewal-Labels |
| `src/index.css` | Kompaktere Billing-Styles |

**Unverändert:** `usePortalBillingData.ts`, `portalApi.ts`, Checkout-Flow, `PortalInvoiceDetailPage.tsx`.

---

## Empfohlene Sprint-1.8-Aufgaben (Vorschau — nicht umsetzen)

1. KPI-Leiste und redundante Sektionen aus Rendering entfernen  
2. `SubscriptionSummary` implementieren (ersetzt KPI + Current Subscription)  
3. Payment-Platzhalter entfernen; Stripe-Portal als einziger Payment-Pfad  
4. `BillingPlansPanel` conditional: Trial/Enterprise ausblenden wenn irrelevant  
5. Current-Plan visuell markieren; „Recommended“ nur für Nicht-Kunden  
6. Invoices-Sektion beibehalten; History/Downloads entfernen  
7. VAT → Footer-Link zu Business  
8. `BillingFooter` (Licenses · Business · Support)  
9. Copy bereinigen (`paymentNote`, Subtitle, Renewal-Sprache)  
10. i18n für Plan/Status in Subscription  
11. Tests + Build  

---

## Manuelle Test-Checkliste (nach Umsetzung)

- [ ] Kein aktiver Plan: Trial/Upgrade klar, keine leeren Platzhalter-Sektionen  
- [ ] Trial aktiv: Summary zeigt Trial, Renewal/Valid Until, kein Payment-Coming-soon  
- [ ] Starter/Pro monatlich: Summary + Manage Subscription (Stripe) funktioniert  
- [ ] Starter/Pro jährlich: Interval korrekt, Upgrade Pro nur mit Yearly-Regel  
- [ ] Stripe nicht eligible: kein doppelter Portal-Button, sinnvoller Empty-State  
- [ ] Rechnungen: Tabelle, Detail, Print PDF — History-Sektion fehlt  
- [ ] 0 Rechnungen: Empty State, kein „Billing history“-Block  
- [ ] Keine KPI-Leiste sichtbar  
- [ ] License Key max. einmal (oder Link zu Licenses)  
- [ ] Footer-Links: Licenses, Business, Support  
- [ ] EN / DE / FR / AR — Plan, Status, Renewal-Texte  
- [ ] Desktop: Kerninfo ohne langen Scroll (~1 Viewport)  
- [ ] Mobile: Summary → Invoices → Upgrade stapeln  
- [ ] `#billing-invoices` Deep-Link funktioniert weiter  
- [ ] `/portal/invoices` Redirect auf Billing bleibt  

---

## Zusammenfassung

Plans & Billing ist **die letzte große überladene Hub-Seite** im Customer Portal. Die technische Basis (APIs, Stripe Portal, Checkout-Eligibility, Invoice-Detail) ist **solide** — das Problem ist **Informationsarchitektur und Platzhalter-UI**, nicht fehlende Backend-Logik.

Sprint 1.8 sollte die Seite auf dieselbe Linie bringen wie Dashboard, Orders, Reports, Business, Licenses und Devices: **eine klare Frage, wenig Scroll, keine Roadmap-Sektionen, echte Daten statt Coming soon.**
