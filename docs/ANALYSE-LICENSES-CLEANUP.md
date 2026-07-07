# Analyse: Licenses-Seite — Customer Portal Cleanup (Sprint 1.6)

**Stand:** 2026-07-07  
**Branch:** `staging`  
**Scope:** Nur `/portal/licenses` — read-only Code- und UX-Analyse  
**Methode:** Review von `PortalLicensesPage`, Übersetzungen, `portalApi`, Abgleich mit Plans & Billing, Dashboard, Devices, Business, Orders, Install  
**Wichtig:** Dieses Dokument ist **nur Analyse**. Keine Code-, UI- oder API-Änderungen.

---

## Executive Summary

Die Licenses-Seite ist **bereits eine der fokussiertesten Seiten** im Customer Portal. Sie beantwortet klar eine Frage:

> **„Welche Lizenzschlüssel hat mein Konto — und in welchem Status sind sie?“**

Im Gegensatz zu Business, Account oder Devices vor dem Cleanup gibt es **keine KPI-Leiste**, keine Roadmap, keine Coming-soon-Grids und keine Operations-Duplikate auf der Seite selbst. Der Kern ist eine **read-only Tabelle** mit Statusfilter und Suche — ein legitimes SaaS-Muster (vergleichbar mit API-Key- oder Token-Listen bei Stripe/GitHub).

**Fazit:** Die Seite ist **nahe am Enterprise-/SaaS-Niveau**, aber noch nicht vollständig ausgereift. Die Lücken sind **überwiegend Copy, i18n und Empty/Error States** — nicht die Informationsarchitektur. Ein Sprint 1.6 wäre ein **leichter Polish-Sprint**, kein struktureller Umbau wie bei Business (1.5).

**Empfehlung:** Kein großer Cleanup nötig. Optional Sprint 1.6 für Copy-Polish, professionellen Empty State, Fehlerbehandlung und i18n-Lücken.

---

## 1. Informationsarchitektur

### Erfüllt die Seite genau einen Zweck?

**Ja — überwiegend.**

| Rolle | Licenses-Seite | Plans & Billing |
|-------|----------------|-----------------|
| Lizenzschlüssel-**Inventar** (alle Keys, Status, Limits) | **Hauptseite** | Nur Primary Key in Subscription |
| Plan **kaufen / upgraden / Trial** | Link weg | **Hauptseite** |
| Stripe Billing Portal | — | **Hauptseite** |
| Rechnungen | — | Invoices-Sektion |

Die Trennung **Licenses = Keys** vs. **Billing = Subscription & Zahlung** ist sinnvoll und entspricht SaaS-Konventionen (Stripe trennt „API Keys“ von „Billing“).

### Ist sofort klar: „Hier verwalte ich meine Lizenzen“?

**Ja**, mit Einschränkung:

- Titel „Licenses“ / DE „Meine Lizenzen“ ist eindeutig.
- Subtitle erklärt den Zweck (Keys für POS-Aktivierung).
- **Aber:** Der Hinweis *„Read-only license list“* klingt **technisch/entwicklerorientiert**, nicht wie ein Produkt-UI-Text.

### Gehört Inhalt woanders hin?

| Element auf Licenses | Bewertung |
|---------------------|-----------|
| Tabelle Key / Plan / Status / Max Devices / Valid Until | **Korrekt hier** |
| Link zu Plans & Billing | **Korrekt** — Billing ist der richtige Ort für Upgrades |
| Footer-Hinweis auf Upgrades | **Teilweise redundant** mit Header-Link |
| Subscription / Auto-Renewal / Payment | **Gehört zu Billing** — fehlt hier zu Recht |
| Geräte-Zuordnung pro Key | **Gehört zu Devices** — API liefert das nicht pro Lizenz |
| Fiscal Package | **Gehört zu Business** — korrekt nicht hier |

**Kein falsch platzierter Dashboard-/Device-/Business-Block** auf der Seite.

---

## 2. Scroll & Layout

### Geschätzte Höhe (Ist)

| Zustand | Höhe |
|---------|------|
| Header + Hint | ~100 px |
| Tabellen-Toolbar (Count + Filter) | ~60 px |
| 1 Lizenzzeile | ~48 px |
| Footer (wenn Lizenzen da) | ~40 px |
| **1–3 Lizenzen gesamt** | **~250–400 px** |
| **10+ Lizenzen** | natürliches Tabellen-Scrollen |

### Desktop / Tablet / Mobile

| Viewport | Bewertung |
|----------|-----------|
| **Desktop** | Kompakt, kein unnötiger Leerraum, Tabelle zentral — **gut** |
| **Tablet** | Filterzeile bricht sauber (`md:flex-row`) — **gut** |
| **Mobile** | `portal-table` wird zu Card-Layout; `data-label` wird via `PortalLayout` aus `<th>` gesetzt — **funktional**, aber Licenses setzt `data-label` nicht explizit (Layout-Effect übernimmt) |

### Leerraum

- Keine überdimensionierten Panels.
- `portal-page space-y-4` — angemessen.
- **Kein Problem** wie bei Business/Account vor Cleanup.

### Tabellenplatzierung

- Tabelle ist der **einzige Hauptinhalt** bei vorhandenen Lizenzen — optimal.
- `overflow-x-auto` für schmale Viewports — korrekt.

---

## 3. Header

### Ist-Zustand

| Element | EN | Bewertung |
|---------|-----|-----------|
| **Titel** | „Licenses“ | Professionell, kurz |
| **Subtitle** | „Cloud license keys for your organization. POS terminals activate with these keys.“ | Klar, leicht technisch („Cloud license keys“) |
| **Read-only Hinweis** | „Read-only license list. Plan & billing: Open Plans“ | **Zu technisch** — „Read-only“ ist Implementierungsdetail |
| **Billing-Link** | `/portal/billing` | Korrekt |

### DE-Abweichung

DE-Subtitle: *„Übersicht über alle Lizenzschlüssel, die deinem Konto zugeordnet sind.“* — **professioneller** als EN. EN sollte angleichen.

### Legacy-Keys (ungenutzt im UI)

Diese Übersetzungen existieren, werden aber **nicht gerendert**:

- `planBillingLabel`, `planBillingBody`, `planBillingPage`, `planBillingCta`
- `summaryPrefix`, `summaryYourAccount`, `summarySuffix`
- `emptyRow`

→ Hinweis auf ältere, ausführlichere Page-Version.

---

## 4. Lizenz-Tabelle

### Spalten (Ist)

| Spalte | Quelle | Bewertung |
|--------|--------|-----------|
| **Key** | `lic.key` | **Pflicht** — Kerninformation, `font-mono` sinnvoll |
| **Plan** | `lic.plan` | **Pflicht** — raw string + `capitalize` (trial/starter/pro) |
| **Status** | `lic.status` | **Pflicht** — Badge mit Farben |
| **Max Devices** | `lic.maxDevices` | **Sinnvoll** — Seat-Limit |
| **Valid Until** | `lic.validUntil` | **Sinnvoll** — Ablauf |
| **Created** | `lic.createdAt` | **Sekundär** — für Audit ok, für Endnutzer oft weniger relevant |

### Fehlt etwas?

| Feld | API vorhanden? | Empfehlung |
|------|----------------|------------|
| **License ID** | `lic.id` (intern) | Nicht nötig für Kunden |
| **Auto Renewal** | Nein | Gehört zu **Billing** |
| **Subscription** | Nein | Gehört zu **Billing** |
| **Assigned Devices** (Count) | Nein auf License-DTO | Nice-to-have via Devices-Link; **nicht ohne API** |
| **Fiscal Package** | Nein | Gehört zu **Business** |
| **Copy Key** | — | **Fehlt** — bei Stripe/GitHub Standard |

### Überflüssig?

- **Created** — optional ausblenden oder ans Ende; nicht kritisch.
- Keine Spalte ist klar falsch.

### Spaltenreihenfolge

Aktuell: Key → Plan → Status → Max Devices → Valid Until → Created

**Empfohlene SaaS-Reihenfolge:** Key → Plan → Status → Valid Until → Max Devices → (Created optional)

→ Valid Until ist für Nutzer oft wichtiger als Max Devices.

---

## 5. Filter

### Status-Filter

- Werte: `all`, `active`, `revoked`, `expired`
- **Problem:** Option-Labels sind **hardcoded Englisch** im JSX (`active`, `revoked`, `expired`) — in DE/FR/AR nicht übersetzt.

### Suche

- Sucht in `key` und `plan` — **sinnvoll** für Multi-License-Accounts.
- Placeholder ist i18n — gut.

### Fehlender Filter?

| Filter | Nötig? |
|--------|--------|
| Plan (trial/starter/pro) | Optional bei vielen Keys |
| Expiring soon | Nice-to-have, nicht Pflicht |

### Positionierung

- Rechts in Tabellen-Toolbar — **Standard-SaaS-Pattern** — gut.

---

## 6. Lizenzinformationen — reicht die Ansicht?

**Ja, für den aktuellen API-Umfang.**

`PortalLicense` liefert nur:

```typescript
id, key, plan, status, maxDevices, validUntil, createdAt
```

Alles Relevante aus dem DTO wird angezeigt. Subscription, Auto-Renewal und Zahlung sind bewusst auf **Plans & Billing** — korrekte Trennung.

**Optional ohne API-Änderung:**

- Copy-Button für Key
- Link „View devices“ (zu `/portal/devices` wenn `licenseKey` matcht — clientseitig aus Devices-Daten, nicht auf Licenses-Page heute)

---

## 7. Empty State

### Verhalten ohne Lizenzen

1. `loading` → Text „Loading licenses…“
2. `licenses.length === 0` → **Plain-Text-Paragraph** mit Link zu `/portal/billing`
3. Kein Hero, kein Icon, kein Primary-CTA-Button

### Bewertung

| Aspekt | Ist | SaaS-Ziel (Orders/Devices) |
|--------|-----|----------------------------|
| Visuelle Hierarchie | Schwach | Hero-Card mit Icon |
| CTA | Inline-Link „Plans“ | Button „Choose a plan“ |
| Link-Ziel | `/portal/billing` | Korrekt |
| Link-Text | „Plans“ | **Inkonsistent** — Seite heißt „Plans & Billing“ |

### Copy-Bug

`emptyStateLink` = `"Plans"`, Link führt zu `/portal/billing` — **Text und Ziel passen nicht perfekt**.

### API-Fehler vs. Empty

Bei `fetchPortalLicenses()`-Fehler: `catch` fehlt, `licenses` bleibt `[]` → Seite zeigt **Empty State**, obwohl **Ladefehler** vorliegt — **irreführend**.

---

## 8. Footer

### Ist (EN)

*"Questions about your key or upgrading from Starter to Pro? Contact your provider or Caisty support. Later you can start upgrades under “Plan & billing”."*

### Bewertung

| Kriterium | Bewertung |
|-----------|-----------|
| Zu lang? | **Ja** — 2 Sätze + Link |
| Zu technisch? | **Teilweise** — „Starter to Pro“ ist ok; „Later you can…“ ist **Beta-Sprache** |
| Überflüssig? | **Teilweise** — Header hat bereits Billing-Link |
| Professionell? | **Mittel** — wirkt wie Platzhalter-Copy aus früher Version |

**Empfehlung:** Auf eine Zeile kürzen: *„Manage plans and upgrades in Plans & Billing.“* Support-Link optional.

---

## 9. Redundanzen (Cross-Page)

Die **Seite selbst** wiederholt wenig. Aber **Lizenz-Fakten** erscheinen an anderen Stellen — das ist **erwartbar**, nicht zwingend ein Licenses-Problem:

| Information | Licenses | Auch auf |
|-------------|----------|----------|
| Primary license key | Alle Keys in Tabelle | Billing (`CurrentSubscription`), Install, Dashboard Activity |
| Plan + Status | Tabelle | Dashboard Business Status, POS Hub |
| Valid until | Tabelle | Billing, POS Hub |
| Max devices / seats | Tabelle | POS Hub (`licenseSeats`) |
| License fehlt | Empty State | Dashboard Alert, Business Setup (früher), Install |

**Bewertung:** Keine unnötige **UI-Redundanz auf der Licenses-Seite**. Cross-Page-Snippets sind **Navigation/Status**, kein Cleanup-Grund für Licenses — außer Billing-Link doppelt (Header + Footer).

---

## 10. Roadmap / Platzhalter

### Auf der gerenderten Seite

| Typ | Vorkommen |
|-----|-----------|
| **Coming soon** | **Keine** |
| **Disabled Buttons** | **Keine** |
| **Dummy-Daten** | **Keine** |
| **Beta-Sprache** | Footer: *„Later you can start upgrades…“* |
| **Technische Hinweise** | Header: *„Read-only license list“* |

### Nur in Übersetzungen (ungenutzt)

- `summarySuffix`: *„in this first version data is read-only“* — Legacy, nicht gerendert
- `emptyRow`: alter Platzhaltertext — nicht gerendert

**Keine Future-Modules- oder Quick-Actions-Roadmap** — positiv.

---

## 11. SaaS UX — Vergleich

| Produkt | Ähnliche Seite | Caisty Licenses |
|---------|----------------|-----------------|
| **Stripe** | API Keys — Tabelle, Status, Copy, Revoke | Ähnliche Tabelle; **kein Copy**, **kein Revoke** (read-only ok) |
| **Shopify** | App installs / Staff — anderes Modell | — |
| **Square** | Locations/Devices getrennt | Caisty trennt Licenses/Devices ähnlich |
| **GitHub** | PAT list — Key, Scope, Expiry, Revoke | Caisty: weniger Aktionen, mehr Read-only |
| **Linear** | Kein direktes Äquivalent | — |

### Enterprise-Niveau?

| Kriterium | Note (1–5) | Kommentar |
|-----------|------------|-----------|
| **Klarheit / Fokus** | 4/5 | Ein Zweck, Tabelle im Zentrum |
| **Kompaktheit** | 5/5 | Kein Bloat |
| **Professionalität Copy** | 3/5 | Read-only, „Later…“, EN/DE uneinheitlich |
| **i18n** | 3/5 | Status-Filter EN-hardcoded; `formatLicenseStatus` EN-only |
| **Empty / Error UX** | 2/5 | Plain text; Fehler = falscher Empty |
| **Funktionalität** | 4/5 | Echte API, Filter, Suche |
| **Konsistenz mit Portal** | 3/5 | Orders/Devices haben Hero-Empty; Licenses nicht |

**Gesamt:** **~3.5/5 — gut, Polish fehlt** — nicht „fertig wie Dashboard/Account nach Cleanup“, aber **deutlich besser als Business vor 1.5**.

---

## 12. Technische Analyse

### Verwendete Komponenten / Module

| Datei | Rolle | Sauber? |
|-------|-------|---------|
| `PortalLicensesPage.tsx` | **Alles in einer Datei** (~275 Zeilen) | Ok für Scope; Logik inline |
| `StatusBadge` | Lokale Subkomponente | Sauber |
| `fetchPortalLicenses` | API | Sauber |
| `formatLicenseStatus` | Status-Labels | **Nicht i18n** |
| `portalLicenseStatusBadge` | Shared UI | Sauber |
| `portalTableShell`, `portalInputClass` | Shared UI | Sauber |
| `Button` | Reset-Filter | Sauber |

### Nicht vorhanden (im Vergleich zu anderen Portal-Seiten)

| Pattern | Licenses | Andere Seiten |
|---------|----------|---------------|
| `derive*State.ts` | **Nein** | Dashboard, Orders, Business, Devices |
| Dedizierte Komponenten | **Nein** | Orders, Billing, Devices |
| Unit Tests | **Nein** | `deriveBusinessState.test.ts`, etc. |
| `usePortalLicensesData` Hook | **Nein** — fetch inline in Page | Billing/Dashboard nutzen shared hooks |

### Vereinfachungspotenzial

- **Kein Überbau** — eher **Extraktion optional** (`LicensesTable`, `LicensesEmptyState`) für Konsistenz mit Orders/Devices.
- **Ungenutzte Translation-Keys** können später bereinigt werden (nicht dringend).

### Ungenutzte Dateien

- **Keine** License-spezifischen Orphan-Komponenten.
- Legacy-Copy nur in i18n-Dateien.

---

## Positive Aspekte

1. **Klarer Single Purpose** — Lizenzschlüssel-Inventar, nicht vermischt mit Billing oder Devices.
2. **Kompaktes Layout** — keine KPI-Leiste, keine Roadmap, kein Scroll-Bloat.
3. **Echte Daten** — `GET /portal/licenses`, keine Hardcoded-Dummies.
4. **Nützliche Filter** — Status + Suche bei mehreren Keys.
5. **Professionelle Tabelle** — Shared `portal-table`, Status-Badges, Mobile-Cards via Layout.
6. **Saubere Abgrenzung** zu Plans & Billing — Upgrades gehören dorthin.
7. **Keine Coming-soon-Buttons** auf der Seite.
8. **Bereits aufgeräumter Charakter** — offenbar nie zum „Management Center“ aufgebläht.

---

## Problemliste nach Priorität

### HIGH

| # | Problem | Auswirkung |
|---|---------|------------|
| H1 | **Kein Error State** bei API-Fehler — zeigt Empty State | Nutzer denkt „keine Lizenz“, obwohl Laden fehlschlug |
| H2 | **Status-Filter-Optionen hardcoded EN** (`active`, `revoked`, `expired`) | Schlechte i18n in DE/FR/AR |
| H3 | **Footer Beta-Sprache** („Later you can start upgrades…“) | Wirkt unfertig, nicht Enterprise |

### MEDIUM

| # | Problem | Auswirkung |
|---|---------|------------|
| M1 | **Empty State** nur Plain-Text — kein Hero wie Orders/Devices | Schwächerer erster Eindruck |
| M2 | **Read-only Hinweis** im Header zu technisch | Produkt-Copy statt Dev-Copy |
| M3 | **Doppelter Billing-Link** (Header-Hint + Footer) | Redundant |
| M4 | `emptyStateLink` „Plans“ vs. Route `/portal/billing` | Verwirrende Benennung |
| M5 | **Plan-Labels** raw (`starter`) statt übersetzter Plan-Namen | Inkonsistent mit POS Hub / Billing |
| M6 | `formatLicenseStatus` nur Englisch | Status-Badge in DE/FR/AR zeigt EN |

### LOW

| # | Problem | Auswirkung |
|---|---------|------------|
| L1 | Kein **Copy-to-clipboard** für License Key | UX-Friction bei POS-Setup |
| L2 | Spalte **Created** geringer Nutzen | Leichter visueller Ballast |
| L3 | Ungenutzte i18n-Keys (`summaryPrefix`, `planBillingBody`, …) | Tech Debt |
| L4 | Kein `deriveLicensesState` / Tests | Weniger testbar als andere Seiten |
| L5 | Spaltenreihenfolge Valid Until / Max Devices | Minor UX |

---

## Empfohlenes Zielbild

**Kein struktureller Umbau.** Die Seite bleibt eine **schlanke Lizenz-Tabelle**.

```
Licenses
License keys for your organization — used to activate Caisty POS.

[ optional: one-line link → Plans & Billing for upgrades ]

┌─────────────────────────────────────────────────────────┐
│ 2 licenses          [Status ▼]  [Search…]  [Reset]      │
├─────────────────────────────────────────────────────────┤
│ Key          Plan     Status    Valid until   Seats     │
│ CAIS-…       Pro      Active    2026-12-01    3    [⎘] │
└─────────────────────────────────────────────────────────┘

Need a new plan or upgrade? → Plans & Billing
```

### Empty State (Ziel)

```
┌──────────────────────────────────────┐
│  🔑  No licenses yet                 │
│  Choose a plan to get your first     │
│  license key for Caisty POS.         │
│  [ Choose a plan ]                   │
└──────────────────────────────────────┘
```

### Was **nicht** hinzugefügt werden sollte (ohne API)

- Subscription / Auto-Renewal (Billing)
- Assigned Devices-Spalte (Devices)
- Fiscal Package (Business)
- KPI-Leiste, Quick Actions, Future Modules

---

## Empfohlene Sprint-1.6-Aufgaben

**Sprint empfohlen — aber LIGHT (geschätzt 0.5–1 Tag), kein Pflicht-Großcleanup.**

| # | Task | Priorität |
|---|------|-----------|
| 1 | Error State bei `fetchPortalLicenses` failure (Banner + Retry) | HIGH |
| 2 | Status-Filter-Labels i18n (active/revoked/expired) | HIGH |
| 3 | Footer kürzen — Beta-Sprache entfernen | HIGH |
| 4 | `LicensesEmptyState` Hero (analog Orders/Devices) + Primary CTA | MEDIUM |
| 5 | Header-Hint umformulieren (ohne „Read-only“) | MEDIUM |
| 6 | `formatLicenseStatus` / Plan-Labels über `t` | MEDIUM |
| 7 | `emptyStateLink` → „Plans & Billing“ konsistent | MEDIUM |
| 8 | Optional: Copy-Button für License Key | LOW |
| 9 | Optional: `deriveLicensesState` + Tests | LOW |
| 10 | Optional: Created-Spalte ausblenden oder ans Ende | LOW |

**Wenn Sprint 1.6 verschoben wird:** Seite ist **nutzbar und fokussiert** — keine Dringlichkeit wie Business 1.5.

---

## Betroffene Dateien (bei Sprint 1.6)

| Datei | Änderung |
|-------|----------|
| `src/routes/PortalLicensesPage.tsx` | Error state, ggf. Extraktion |
| `src/components/licenses/LicensesEmptyState.tsx` | **Neu** (optional) |
| `src/components/licenses/LicensesTable.tsx` | **Neu** (optional) |
| `src/lib/licenses/deriveLicensesState.ts` | **Neu** (optional) |
| `src/lib/licenses/deriveLicensesState.test.ts` | **Neu** (optional) |
| `src/lib/caistyTerminology.ts` | `formatLicenseStatus` i18n |
| `src/lib/translations/portal/en.ts` (+ de, fr, ar) | Copy + Filter-Labels |
| `src/index.css` | Empty-State-Styles (falls Hero) |

**Unverändert lassen:** `portalApi.ts`, Backend, `BusinessEditForm`, Billing-Seite.

---

## Manuelle Test-Checkliste

### Baseline (Ist)

- [ ] `/portal/licenses` lädt mit aktivem Konto
- [ ] Mit Lizenzen: Tabelle mit 6 Spalten
- [ ] Status-Badge: active = grün, expired = amber, revoked = rose
- [ ] Status-Filter filtert korrekt
- [ ] Suche nach Key-Teilstring funktioniert
- [ ] Reset setzt Filter zurück
- [ ] Ohne Lizenzen: Plain-Text Empty + Link zu Billing
- [ ] Header-Link „Open Plans“ → `/portal/billing`
- [ ] Footer nur wenn `hasLicenses`
- [ ] Mobile: Tabellenzeilen als Cards mit Spaltenlabels
- [ ] DE/FR/AR: Titel/Subtitle übersetzt; **Status-Filter EN** (bekannter Bug)

### Nach Sprint 1.6 (Ziel)

- [ ] API-Fehler zeigt Fehlermeldung, nicht Empty State
- [ ] Empty State als Hero mit CTA
- [ ] Kein „Read-only“ / „Later you can“ in Copy
- [ ] Status-Filter in allen Sprachen übersetzt
- [ ] Optional: Copy Key funktioniert

---

## Schlussbewertung

Die Licenses-Seite **hat bereits SaaS-/Enterprise-Charakter** in Struktur und Fokus. Sie gehört **nicht** in die Kategorie „massiver Cleanup nötig“ wie Business vor Sprint 1.5.

Was fehlt, sind **professionelle Details**: Fehler- und Empty-States, konsistente i18n, und Copy ohne Beta-/Dev-Sprache. Ein **leichter Sprint 1.6** lohnt sich für Portal-Konsistenz mit Orders, Account und Business — ist aber **optional**, nicht blockierend.

---

*Ende der Analyse — keine Codeänderungen vorgenommen.*
