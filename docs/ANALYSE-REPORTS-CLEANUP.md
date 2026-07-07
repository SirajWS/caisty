# Analyse: Reports-Seite — Customer Portal Cleanup (Sprint 1.3)

**Stand:** 2026-07-07  
**Branch:** `staging` (caisty monorepo)  
**Scope:** Nur `/portal/reports` — read-only Code- und UX-Analyse  
**Methode:** Review von `PortalReportsPage`, `deriveReportsState`, Komponenten, Übersetzungen, Datenquellen; Abgleich mit bereinigtem Dashboard (Sprint 1.1) und Orders (Sprint 1.2)  
**Wichtig:** Dieses Dokument ist **nur Analyse**. Keine Code-, UI- oder API-Änderungen.

---

## Executive Summary

Die Reports-Seite ist **strukturell gut aufgebaut** — klare Komponenten, saubere `deriveReportsState`-Schicht, Tests gegen erfundene Daten, ehrliche Platzhalter. Sie leidet aber unter **drei konzeptionellen Problemen**, die vor POS-Sales-Sync bereinigt werden sollten:

1. **Rollenvermischung:** Die Seite zeigt gleichzeitig Analytics-Zielbild (Charts, Trends, Top-N), operative Tages-KPIs (wie Dashboard) und fiskalische Auswertung (Grenze zu Business/Fiscal) — alles ohne echte Sales-Daten.
2. **Doppelte Filter:** Zwei unabhängige Perioden-Steuerungen (Revenue-Chart oben vs. Period-Panel unten) ohne gemeinsame State-Logik — untypisch für Enterprise-SaaS (Stripe, Shopify: **ein** globaler Date Range).
3. **Redundanz-Triade:** Dashboard, Orders und Reports teilen dieselbe Datenquelle (`usePortalDashboardData`) und zeigen **identische leere Sales-Metriken** mit leicht unterschiedlichen Labels — Nutzer sehen dreimal dasselbe `—`.

**Empfohlene Rolle nach Cleanup:**

> **„Wie performt mein Business über Zeit?“** — Analyse, Trends, Exporte.  
> Nicht: Live-Ops (Orders), nicht: Setup (Business), nicht: Geräte (Devices).

**Sprint 1.3** sollte **kein Redesign** sein, sondern: überflüssige Blöcke entfernen/zusammenführen, Filter vereinheitlichen, Empty State ergänzen, disabled Export-Block reduzieren — **bevor** echte POS-/Receipt-Analytics angebunden werden.

---

## 1. Seitenziel

### Soll-Zustand (laut Copy & Struktur)

| Konzept | Indiz |
|---------|--------|
| Sales Analytics | Subtitle: *„Understand how your business performs — sales analytics and trends.“* |
| Zeitraum-Analyse | Revenue Chart mit Today / 7d / 30d / 12m / All time |
| Produkt-/Mitarbeiter-Rankings | Top Products, Top Employees Tabellen |
| Steuer-Auswertung | Taxes (Net, VAT, Gross, Fiscal receipts) |
| Insights / Records | Business Trends (Best day, Largest receipt, …) |
| Export | PDF, Excel, CSV, Print |

### Ist-Zustand

| Aspekt | Realität |
|--------|----------|
| **Analytics-Seite** | UI ja — aber **100 % Platzhalter**, keine Sales-API |
| **Dashboard-Duplikat** | 6 KPIs überlappen mit Dashboard (Revenue/Orders/Receipts) und Orders (gleiche 6er-Liste) |
| **Orders-Duplikat** | Payment Methods = identisches 4-Karten-Muster wie Orders Payment Overview |
| **Device-Seite** | Nein — aber `hasPosSync` wird berechnet und **nirgends in der UI verwendet** |
| **Business-Seite** | Taxes + Fiscal receipts gehören konzeptionell zu Business/Fiscal Setup |
| **Operative Live-Daten** | Nein — keine Tabellen einzelner Orders/Receipts (korrekt für Reports) |

### Fazit Zweck

**Aktuell:** Professionell aussehendes **Analytics-Mockup** mit zu vielen gleichzeitigen Zuständigkeiten und ohne zentrale Perioden-Steuerung.

**Kernfrage der Seite (Ziel):** *Wie entwickeln sich Umsatz, Zahlarten, Produkte und Steuern über einen wählbaren Zeitraum?*

---

## 2. Informationsarchitektur (vollständige Liste)

Reihenfolge wie in `PortalReportsPage.tsx`:

| # | Block | Komponente | CSS-Klassen / Layout |
|---|-------|------------|----------------------|
| 1 | **Page Header** | Inline `<header>` | Titel + Subtitle |
| 2 | **KPI Overview** | `ReportsOverview` | 6 KPI-Karten (`reports-kpi-grid`) |
| 3 | **Revenue Chart** | `RevenueChart` | Wide panel + **eigene** Range-Filter (5 Chips) |
| 4 | **Sales by Hour** | `HourlySalesChart` | Split links |
| 5 | **Payment Methods** | `PaymentMethods` | Split rechts — 4 Stat-Karten + Pie-Placeholder |
| 6 | **Top Products** | `TopProducts` | Wide table |
| 7 | **Top Employees** | `TopEmployees` | Wide table |
| 8 | **Taxes** | `TaxesOverview` | Split links — 4 Tax-Karten |
| 9 | **Business Trends** | `BusinessTrends` | Split rechts — 5 Trend-Karten |
| 10 | **Period Filter** | `ReportsFilters` | Wide panel + **zweite** Filter-Reihe (6 Chips) |
| 11 | **Exports** | `ReportsExports` | 4 disabled Actions |

**Gesamt:** 11 Bereiche auf einer langen Scroll-Seite.

### Gehört hierher / gehört nicht hierher

| Block | Reports? | Begründung |
|-------|----------|------------|
| KPI Overview (6) | **Teilweise** | Nur **zeitraumbezogene** Analytics-KPIs; nicht „heute live“ |
| Revenue Chart | **Ja** | Kern-Analytics |
| Sales by Hour | **Ja** | Analytics (Intraday-Muster) |
| Payment Methods (Analyse) | **Ja** | Wenn Zeitraum + Chart/%, nicht operative Tageskarten |
| Top Products | **Ja** | Klassisches Reporting |
| Top Employees | **Ja** | Wenn Employee-Sync existiert; sonst später |
| Taxes (Summary) | **Grenzfall** | Auswertung ja; Konfiguration → Business/Fiscal |
| Business Trends | **Ja** | Analytics-Insights |
| Period Filter (global) | **Ja** | Aber **nur einmal**, oben |
| Exports | **Ja** | Aber erst mit Daten sinnvoll |
| Device/POS Status | **Nein** | → Devices / Dashboard |
| Live Orders/Receipts Tabellen | **Nein** | → Orders |
| Business Profile | **Nein** | → Business |

---

## 3. KPI-Analyse

Alle KPIs aus `deriveOverview()` — Wert immer `—`, Hint immer `waitingPosSync`.

| KPI | ID | Gehört in Reports? | Dashboard-Duplikat? | Orders-Duplikat? | Später behalten? |
|-----|-----|-------------------|----------------------|------------------|------------------|
| **Revenue** | `revenue` | Ja (Zeitraum) | **Ja** — Dashboard `kpiRevenueToday` | **Ja** — `kpiRevenue` | **Ja** — Label an Zeitraum koppeln |
| **Orders** | `orders` | Ja | **Ja** — `kpiOrdersToday` | **Ja** | **Ja** |
| **Receipts** | `receipts` | Ja | **Ja** — `kpiReceiptsToday` | **Ja** | **Ja** |
| **Refunds** | `refunds` | Ja | Nein auf Dashboard | **Ja** — Orders-spezifisch | **Ja** |
| **Average order** | `avg_order` | Ja | Nein | **Ja** | **Ja** |
| **VAT** | `vat` | Ja | Nein | Nein | **Ja** — oder nur unter Taxes |

### KPI-Probleme

1. **Kein Zeitraum im Label:** Dashboard sagt „Revenue **today**“; Reports nur „Revenue“ — wirkt wie Gesamtumsatz, ist aber Platzhalter.
2. **6 identische Karten** ohne Kontext — nach Device-Heartbeat (`hasPosSync=true`) weiterhin leer, **ohne Empty Hero** (Orders hat `OrdersEmptyState`, Reports nicht).
3. **`hasPosSync` ungenutzt:** In `ReportsDerivedState` berechnet, aber `PortalReportsPage` rendert keinen Sync-/Empty-State.

### Empfehlung KPIs

| Priorität | Maßnahme |
|-----------|----------|
| HIGH | KPI-Streifen auf **4 Analytics-KPIs** kürzen: Revenue, Orders, Avg order, VAT (Receipts/Refunds in Tabellen/Details) **oder** 6 behalten aber Zeitraum im Label |
| HIGH | Empty State / Sync-Banner wenn `!hasPosSync` (wie Orders) |
| MEDIUM | Dashboard behält **3 Live-Tages-KPIs**; Reports **keine** identischen unqualifizierten Labels |

---

## 4. Chart-Analyse

### Revenue Chart (`RevenueChart.tsx`)

| Kriterium | Bewertung |
|-----------|-----------|
| Sinnvoll? | **Ja** — zentrales Analytics-Element |
| Reihenfolge | **Gut** — direkt nach KPIs |
| Größe | Wide panel — angemessen |
| Priorität | **Hoch** |
| Daten | `hasData: false` immer; Range-State **lokal**, nicht an `deriveReportsState` gebunden |
| Placeholder | SVG-Linie auf Null + `chartPlaceholder` |

**Problem:** Filter-Chips ändern nur lokalen React-State — **kein Effekt** auf andere Blöcke.

### Sales by Hour (`HourlySalesChart.tsx`)

| Kriterium | Bewertung |
|-----------|-----------|
| Sinnvoll? | **Ja** für Gastronomie/Retail |
| Reihenfolge | **Gut** — neben Payment Methods |
| Größe | Halbe Breite — OK |
| Daten | 7 feste Stunden (`08`–`14`), alle `value: null` |
| Placeholder | `waitingPosSync` unter leeren Balken |

### Payment Methods (`PaymentMethods.tsx`)

| Kriterium | Bewertung |
|-----------|-----------|
| Sinnvoll? | **Ja** als Analytics (Verteilung) |
| Reihenfolge | **Gut** neben Hourly |
| Darstellung | 4 Text-Karten + Pie-Placeholder |
| Daten | Alle 4 Werte = ganzer Satz `waitingPosSync` |
| Redundanz | **Identisch** zu Orders `PaymentOverview` |

**Empfehlung:** In Reports **Chart/Anteile** zeigen; in Orders **nur heute kompakt**. Nicht beide mit 4× gleichem Platzhalter-Satz.

### Chart-Priorität (empfohlene Reihenfolge nach Cleanup)

1. Global Period Filter (einmal, oben)
2. KPI Strip (kompakt)
3. Revenue Chart (primary)
4. Sales by Hour + Payment Methods (secondary row)
5. Top Products
6. Top Employees (wenn Feature)
7. Taxes + Trends
8. Exports (wenn Daten)

---

## 5. Tabellen

### Top Products

| Frage | Antwort |
|-------|---------|
| Sinnvoll? | **Ja** — Standard-Report |
| Daten heute | `topProducts: []` — Empty: `topProductsEmpty` |
| Spalten | Product, Quantity, Revenue, Category — gut |
| Fehlt? | Trend vs. Vorperiode, % Anteil — später |
| Auslagern? | **Nein** — gehört zu Reports |

### Top Employees

| Frage | Antwort |
|-------|---------|
| Sinnvoll? | **Ja** wenn Cashier/Employee aus POS kommt |
| Daten heute | `[]` — Empty: **`Coming soon`** (nicht „No synchronized…“) |
| Spalten | Employee, Orders, Revenue, Avg order — gut |
| Beide Tabellen wichtig? | Products **ja**; Employees **später** bis POS Employee-Sync |
| Auslagern? | Optional zu „Staff“-Modul später; für Sprint 1.3: **behalten aber als Coming-soon-Sektion kompakter** |

**Empfehlung:** Top Employees nicht gleichwertig zu Top Products promoten — eine Tabelle reicht bis Employee-Daten da sind.

---

## 6. Taxes-Bereich

`TaxesOverview` — 4 Karten aus `deriveTaxes()`:

| Karte | Wert heute | Hint-Quelle |
|-------|------------|-------------|
| Net revenue | `waitingFiscalSync` | Fiscal, nicht POS |
| VAT | `waitingFiscalSync` | |
| Gross revenue | `waitingFiscalSync` | |
| Fiscal receipts | `waitingFiscalSync` | |

### Bewertung

| Frage | Antwort |
|-------|---------|
| Tax **Analytics** hier? | **Ja** — aggregierte Steuer-Auswertung über Zeitraum |
| Tax **Konfiguration** hier? | **Nein** — → Business / Fiscal |
| vs. Business | Business = Provider, Status, Compliance; Reports = **Zahlen** |
| vs. Fiscal API | Braucht später `/portal/analytics/fiscal` oder Sales+Signatur-Metadaten |

**Empfehlung:** Block **behalten**, aber klar als „Tax summary (period)“ labeln; `waitingFiscalSync` ist ehrlicher als `waitingPosSync`. Optional mit POS-Sales-Sync erst **Net/VAT/Gross** befüllen; Fiscal receipts erst mit certified signing.

---

## 7. Business Trends

5 Karten aus `deriveTrends()` — alle Wert `—`:

| Trend | Analytics oder Dashboard? |
|-------|---------------------------|
| Best sales day | **Reports** — Perioden-Insight |
| Best sales hour | **Reports** — korreliert mit Hourly Chart |
| Largest receipt | **Reports** — Record-Statistik |
| Most used payment | **Reports** — korreliert mit Payment Methods |
| Most sold product | **Reports** — korreliert mit Top Products |

### Fazit

**Gehören zu Reports**, nicht zum Dashboard — Dashboard zeigt **Live-Status**, Trends sind **historische Extrema**.

**Problem heute:** 5× `—` ohne Erklärung — wirkt wie leeres Dashboard-Widget. Besser: Sektion **einklappbar** oder erst anzeigen wenn `hasData`.

---

## 8. Export-Bereich

`ReportsExports` — 4 Actions, alle `disabled: true`, Badge `Coming soon`:

| Export | Sinnvoll? | Jetzt anzeigen? |
|--------|-----------|-----------------|
| PDF | Ja | **Nein** — disabled ohne Daten verwirrt |
| Excel | Ja | **Nein** |
| CSV | Ja | **Nein** |
| Print | Ja | **Nein** |

### SaaS-Vergleich

Stripe / Shopify: Export-Buttons erscheinen **wenn Report Daten hat** oder sind aktiv mit leerem Export-Hinweis — nicht 4× grauer Button.

### Empfehlung

| Priorität | Maßnahme |
|-----------|----------|
| HIGH | **Gesamten Export-Block entfernen** bis Export-API da (wie Orders Quick Actions) |
| MEDIUM | Oder: einzeiliger Hinweis „Exports available after sales sync“ |
| LOW | PDF zuerst implementieren wenn Analytics-API steht |

---

## 9. Filter-Analyse (kritisch)

### Zwei unabhängige Filter-Systeme

**A) Revenue Chart** (`RevenueChart.tsx`, Zeilen 17–41)

| Option | ID |
|--------|-----|
| Today | `today` |
| 7 days | `7d` |
| 30 days | `30d` |
| 12 months | `12m` |
| All time | `all` |

- Lokaler `useState<RevenueTimeRange>`
- **Nicht** mit `deriveReportsState.revenueChart.range` verbunden (der ist hardcoded `"today"`)
- Beeinflusst **keine** anderen Komponenten

**B) Period Panel** (`ReportsFilters.tsx`, unten auf der Seite)

| Option | ID |
|--------|-----|
| Today | `today` |
| Yesterday | `yesterday` |
| This week | `week` |
| This month | `month` |
| This year | `year` |
| Custom | `custom` (+ Hint „coming soon“) |

- Eigener lokaler `useState<FilterId>`
- Steht **nach** allen Charts/Tabellen — Nutzer scrollen vorbei
- **Keine** Wirkung auf Daten

### Warum zwei Filter?

Vermutlich **iteratives UI-Wachstum**: Chart bekam Analytics-Ranges; später wurde separates „Period“-Panel ergänzt — ohne Konsolidierung.

### Wie lösen professionelle SaaS-Produkte das?

| Produkt | Muster |
|---------|--------|
| **Stripe** | Ein Date Picker oben rechts — alle Widgets reagieren |
| **Shopify** | Ein Zeitraum + Vergleichsperiode — global |
| **Square** | Report-Typ + Date Range in Header |
| **Toast** | Single date filter controls entire page |

**Regel:** **Ein** `selectedPeriod` State in Page oder Context → KPIs, Charts, Tabellen, Exports lesen dieselbe Query.

### Empfehlung Filter

| Priorität | Maßnahme |
|-----------|----------|
| **HIGH** | **ReportsFilters nach oben** (unter Header, vor KPIs) |
| **HIGH** | **RevenueChart-Filter entfernen** oder mit globalem State mergen |
| **HIGH** | Ein Perioden-Modell: `today \| yesterday \| 7d \| 30d \| 12m \| ytd \| custom` |
| MEDIUM | `custom` erst verstecken bis Datepicker da |
| LOW | Vergleichsperiode „vs. previous period“ (Stripe-Style) — später |

---

## 10. Empty States & Placeholder

### Inventar

| Ort | Text | Typ | Count |
|-----|------|-----|-------|
| KPI-Wert (6×) | `—` | Placeholder | 6 |
| KPI-Hint (6×) | `Waiting for POS synchronization` | Langform | 6 |
| Revenue Chart | `Waiting for POS synchronization` | Placeholder | 1 |
| Hourly Chart | `Waiting for POS synchronization` | Placeholder | 1 |
| Payment (4×) | `Waiting for POS synchronization` als **Wert** | Placeholder | 4 |
| Pie Chart | `Waiting for POS synchronization` | Placeholder | 1 |
| Top Products | `No synchronized products.` | Empty | 1 |
| Top Employees | `Coming soon` | Empty | 1 |
| Taxes (4×) | `Waiting for fiscal synchronization` | Placeholder | 4 |
| Trends (5×) | `—` | Placeholder | 5 |
| Exports (4×) | `Coming soon` Badge | Disabled | 4 |
| Filters Custom | `Custom date filtering coming soon.` | Hint | 1 |

**Geschätzt: 30+ Placeholder-Elemente** auf einer Seite.

### UX-Bewertung

| Problem | Schwere |
|---------|---------|
| Identischer Sync-Text 12+ mal | **Hoch** — unprofessionell |
| Kein Empty Hero bei `!hasPosSync` | **Hoch** — Orders hat eines, Reports nicht |
| `hasPosSync` berechnet aber ignoriert | **Mittel** — verschwendete Logik |
| Trends + KPIs alle `—` | **Mittel** — keine Differenzierung |
| Zwei verschiedene Sync-Messages (POS vs Fiscal) | **Gut** — sinnvolle Trennung bei Taxes |

### Empfehlung Empty States

1. **Ein** Page-Level Banner: „Waiting for POS sales sync“ + CTA Open Desktop POS
2. Sekundäre Blöcke **ausblenden** oder collapsed bis Daten da
3. Payment: nicht 4× denselben Satz — eine Zeile oder Skeleton

---

## 11. Datenquellen

### Hook

```
usePortalReportsData → usePortalDashboardData (Re-Export)
```

**Gleiche Fetch-Pipeline wie Dashboard und Orders:**

| API | Verwendung auf Reports |
|-----|------------------------|
| `fetchPortalLicenses()` | Nicht direkt in Reports-UI |
| `fetchPortalDevices()` | Nur `hasPosSync` (device `lastSeenAt`) |
| `fetchPortalInvoices()` | Nicht in Reports-UI |
| `fetchPortalBusiness()` | Nicht in Reports-UI |

**Kein Sales-/Analytics-Endpoint.**

### Daten pro Bereich (Zukunft vs. heute)

| Bereich | Zukünftige Quelle | Heute |
|---------|-------------------|-------|
| KPI Overview | POS Sales Aggregation API | ❌ Keine |
| Revenue Chart | Sales time-series | ❌ |
| Sales by Hour | POS receipts by hour | ❌ |
| Payment Methods | POS payments aggregate | ❌ |
| Top Products | POS products + sales lines | ❌ |
| Top Employees | POS cashier/employee on sales | ❌ |
| Taxes | Fiscal config + signed receipts / sales tax lines | ❌ |
| Business Trends | Derived from sales aggregates | ❌ |
| Exports | Analytics export service | ❌ |
| Period Filter | Query param → API | ❌ UI-only |

### Geplante API-Richtung (nicht im Code)

Laut `ANALYSE-CUSTOMER-PORTAL-CLEANUP-AND-SYNC.md`: Sales-Sync-Sprint vor KPI-Befüllung. `deriveReportsState` ist **vorbereitet** für spätere WebSocket/API-Merge (`ReportsDerivedState` kommentiert als serializable snapshot).

---

## 12. Redundanzen (Dashboard / Orders / Business)

### Triade KPI-Platzhalter

| Metrik | Dashboard | Orders | Reports |
|--------|-----------|--------|---------|
| Revenue | `kpiRevenueToday` | `kpiRevenue` | `kpiRevenue` |
| Orders | `kpiOrdersToday` | `kpiOrders` | `kpiOrders` |
| Receipts | `kpiReceiptsToday` | `kpiReceipts` | `kpiReceipts` |
| Refunds | — | `kpiRefunds` | `kpiRefunds` |
| Avg order | — | `kpiAvgOrder` | `kpiAvgOrder` |
| VAT | — | — | `kpiVat` |

**Drei Seiten, dieselbe leere Sales-Story.**

### Payment Methods

| | Orders | Reports |
|---|--------|---------|
| Komponente | `PaymentOverview` | `PaymentMethods` |
| Karten | Cash, Card, Voucher, Other | Identisch |
| Wert | `waitingPosSync` | `waitingPosSync` |
| Zusatz | — | Pie chart placeholder |

### Was nur einmal existieren soll

| Information | Einzige Heimat |
|-------------|----------------|
| Live Tages-KPIs (heute) | **Dashboard** |
| Einzelne Orders/Receipts heute | **Orders** |
| Zeitraum-Analyse & Charts | **Reports** |
| Fiscal Provider/Status | **Business** |
| Device online / Heartbeat | **Devices** |
| Plan / License | **Plans & Billing** |

### Reports vs. Business

| Reports (Auswertung) | Business (Stammdaten) |
|----------------------|-------------------------|
| VAT collected (period) | VAT ID, tax rates config |
| Fiscal receipts count | Fiscal provider, certification status |
| Net/Gross revenue | Company legal name, country |

---

## 13. SaaS UX Bewertung

| Kriterium | Score | Kommentar |
|-----------|-------|-----------|
| **Klarheit** | 6/10 | Subtitle klar; Inhalt widerspricht (zu viele leere Blöcke) |
| **Fokus** | 5/10 | Analytics + Fiscal + Export + doppelte Filter |
| **Professionalität** | 7/10 | Gutes Visual System (`dashboard-panel`, Tables); Text-Wiederholung schwächt |
| **Informationshierarchie** | 6/10 | Chart oben gut; Filter unten falsch; KPIs zu dominant für leere Daten |
| **White Space** | 8/10 | Luftig, Enterprise-tauglich |
| **Card-Struktur** | 8/10 | Konsistent mit Dashboard/Orders |
| **Skalierbarkeit** | 7/10 | `deriveReportsState` + Komponenten modular |
| **Enterprise-Tauglichkeit** | 5/10 | Doppelte Filter + 30 Placeholders = Demo, nicht Production |

**Vergleich Zielbild:** Näher an **Shopify Analytics** / **Square Reports** als an Dashboard — aber noch nicht bei **Stripe Sigma**-Reife (dafür braucht es echte Daten + einen Filter).

---

## 14. Sprint 1.3 Empfehlungen

### HIGH

| # | Aktion | Bereich |
|---|--------|---------|
| H1 | **Einen globalen Period Filter** oben; RevenueChart-Chips entfernen oder anbinden | Filter |
| H2 | **ReportsFilters** von unten nach oben (unter Header) | IA |
| H3 | **Empty/Sync Banner** wenn `!hasPosSync` (nutzt vorhandenes Flag) | Empty State |
| H4 | **Export-Block entfernen** (4× disabled Coming soon) | Exports |
| H5 | **Payment Methods:** nicht 4× `waitingPosSync` als Wert — kompakt oder ausblenden | Placeholder |
| H6 | **KPI-Labels** mit Zeitraum qualifizieren („Revenue · 7 days“) | KPI |
| H7 | Dokumentieren: Dashboard = live today; Reports = period analytics | IA / Docs |

### MEDIUM

| # | Aktion | Bereich |
|---|--------|---------|
| M1 | KPI-Streifen von 6 auf 4 reduzieren oder Secondary KPIs in Chart-Header | KPI |
| M2 | **Top Employees** Sektion visuell zurückstufen (Coming soon) | Tabellen |
| M3 | **Business Trends** erst zeigen wenn mindestens ein Trend befüllbar | Trends |
| M4 | **Taxes** Subtitle „Requires fiscal sync“ | Taxes |
| M5 | Placeholder-Texte vereinheitlichen (`waitingPosSyncShort` wie Dashboard) | Copy |
| M6 | `deriveReportsState.revenueChart.range` an Page-State koppeln (wenn Filter merged) | Code (später) |

### LOW

| # | Aktion | Bereich |
|---|--------|---------|
| L1 | Vergleichsperiode (vs. previous) | Später mit API |
| L2 | Chart-Interaktion (Hover, Tooltip) | Nach Daten |
| L3 | Drill-down von Top Product → Product detail | Später |
| L4 | Custom Date Range Datepicker | Nach API |

### Beibehalten (keine Änderung nötig)

- Komponenten-Architektur (`components/reports/*`)
- `deriveReportsState` + Tests (keine erfundenen Umsätze)
- Top Products Tabelle (Struktur)
- Revenue Chart + Hourly Split Layout
- Trennung POS-Sync-Hint vs. Fiscal-Sync-Hint bei Taxes
- Subtitle & Seiten-Routing `/portal/reports`

### Entfernen / Zusammenführen / Vereinfachen / Später

| Maßnahme | Was |
|----------|-----|
| **Entfernen** | Export-Block (bis API) |
| **Entfernen** | Duplikat-Filter im Revenue Chart (nach Merge) |
| **Zusammenführen** | Zwei Filter → ein Period Control |
| **Vereinfachen** | KPI 6→4; Payment 4 Karten → 1 Zeile |
| **Später (POS-Daten)** | Alle Werte, Charts, Tabellen, Exports |
| **Später** | Top Employees, Custom range |

---

## Anhang: Relevante Dateien

| Datei | Rolle |
|-------|-------|
| `apps/caisty-site/src/routes/PortalReportsPage.tsx` | Page composition |
| `apps/caisty-site/src/lib/reports/deriveReportsState.ts` | State derivation (placeholders) |
| `apps/caisty-site/src/lib/reports/usePortalReportsData.ts` | Re-export Dashboard data hook |
| `apps/caisty-site/src/lib/reports/types.ts` | Type definitions |
| `apps/caisty-site/src/lib/reports/deriveReportsState.test.ts` | Guards against invented data |
| `apps/caisty-site/src/components/reports/*.tsx` | 10 UI components |
| `apps/caisty-site/src/lib/translations/portal/en.ts` | `reports.*` copy |
| `docs/ANALYSE-ORDERS-CLEANUP.md` | Parallele Analyse Orders |
| `docs/ANALYSE-CUSTOMER-PORTAL-CLEANUP-AND-SYNC.md` | Cross-portal redundancy matrix |

---

## Anhang: Tests nach Cleanup (für Implementierungs-Sprint)

| Test | Erwartung |
|------|-----------|
| `/portal/reports` ohne Device-Sync | Sync-Banner sichtbar; keine 30× identischer Texte |
| `/portal/reports` mit Device-Sync | Banner optional weg; weiterhin ehrliche Empty States in Tabellen |
| Period Filter | Eine Steuerung; wechselt Label/Zeitraum (auch wenn Daten noch leer) |
| Kein Export-Block | Seite endet ohne 4 disabled Buttons |
| Dashboard / Orders / Reports | Keine identischen unqualifizierten KPI-Labels mehr |
| `deriveReportsState.test.ts` | Weiterhin grün — keine erfundenen Zahlen |

---

*Ende der Analyse — Sprint 1.3 Read-Only. Keine Codeänderungen in dieser Session.*
