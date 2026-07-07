# Analyse: Orders-Seite — Customer Portal Cleanup (Sprint 1.2)

**Stand:** 2026-07-07  
**Branch:** `staging`  
**Scope:** Nur `/portal/orders` — read-only Code- und UX-Analyse  
**Methode:** Review von `PortalOrdersPage`, `deriveOrdersState`, Komponenten, Übersetzungen, Datenquellen; Abgleich mit bereinigtem Dashboard  
**Wichtig:** Dieses Dokument ist **nur Analyse**. Keine Code-, UI- oder API-Änderungen.

---

## Executive Summary

Die Orders-Seite ist als **„Operations Center für Live Sales“** konzipiert (Subtitle: *„What happened in your business today — live sales operations.“*), liefert aber heute **keine Verkaufsdaten**. Alle Bestellungen, Belege und Zahlungswerte sind leer oder Platzhalter.

Tatsächlich zeigt die Seite eine **Mischung aus:**

- geplantem Live-Sales-Monitor (Tabellen + KPIs),
- deaktiviertem Order-/Receipt-Management (Aktionen ohne Funktion),
- Device-/Cloud-Events (wie Dashboard),
- und fünf **Coming-soon**-Quick-Actions.

Nach dem Dashboard-Cleanup (Sprint 1.1) ist Orders die **größte verbleibende Redundanz-Quelle** für Tages-KPIs und Activity-Timeline. Sprint 1.2 sollte die Seite auf ihre Kernfrage fokussieren:

> **„Was wurde heute verkauft — Bestellungen und Belege?“**

---

## 1. Zweck der Seite

### Soll-Zustand (laut Copy & Struktur)

| Konzept | Indiz im Code |
|---------|----------------|
| Live Sales Monitor | Subtitle, „Live orders“, KPI „Revenue today“ |
| Tagesübersicht | Date-Range-Filter (Today / Yesterday / Last 7 / Custom) |
| Order Management | `OrdersTable` mit Status, Cashier, Device |
| Receipt Management | `ReceiptsTable` mit View / Print / Download |
| Payment-Split | `PaymentOverview` (Cash / Card / Voucher / Other) |

### Ist-Zustand

| Aspekt | Realität |
|--------|----------|
| **Live Sales Monitor** | Nein — `orders: []`, `receipts: []` hardcoded in `deriveOrdersState` |
| **Order Management** | UI-Shell only — Tabelle rendert, aber immer Empty State |
| **Receipt Management** | UI-Shell + drei **deaktivierte** Aktions-Buttons pro Zeile (nie sichtbar, da keine Zeilen) |
| **Tagesübersicht** | Filter sind **rein lokal** (`useState`) — beeinflussen keine Daten |
| **Reports-Mischung** | KPIs Refunds / Average order + Export-Actions gehören analytisch zu Reports |
| **Dashboard-Mischung** | Business Events = Device-Heartbeat + Cloud-Sync (identisch zu Dashboard Activity) |

### Fazit Zweck

**Aktuell:** Hybrid aus **Zielbild Live-Sales-Ops** + **Dashboard-Duplikaten** + **Reports-Vorschau** — alles ohne echte Sales-Sync.

**Empfohlene Rolle nach Cleanup:**

**Operative Tagesseite** — heutige Bestellungen und Belege im Detail. Kein zweites Dashboard, kein Analytics-Hub.

---

## 2. Informationsblöcke (vollständige Liste)

Reihenfolge wie in `PortalOrdersPage.tsx`:

| # | Block | Komponente | Zweck |
|---|-------|------------|-------|
| 1 | **Page Header** | Inline `<header>` | Titel „Orders“ + Subtitle „live sales operations“ |
| 2 | **KPI Summary** | `OrdersSummary` | 6 Kennzahlen: Revenue, Orders, Receipts, Refunds, Avg order, Open shift |
| 3 | **Empty Hero** (bedingt) | `OrdersEmptyState` | Nur wenn `!hasPosSync` — Hinweis „No synchronized sales yet“ + CTA „Open Desktop POS“ |
| 4 | **Date Range** | `OrdersFilters` | Filter-Chips: Today, Yesterday, Last 7 days, Custom (+ Coming-soon-Hint) |
| 5 | **Live Orders** | `OrdersTable` | Tabelle: Time, Order #, Status, Payment, Amount, Cashier, Device |
| 6 | **Recent Receipts** | `ReceiptsTable` | Tabelle: Receipt, Time, Customer, Payment, Fiscal, Amount, Actions |
| 7 | **Payment Overview** | `PaymentOverview` | 4 Karten: Cash, Card, Voucher, Other |
| 8 | **Business Events** | `BusinessTimeline` | Chronologische Liste: POS connected, Device seen, Cloud synchronized |
| 9 | **Quick Actions** | `OrdersQuickActions` | Export CSV/Excel/PDF, View reports, Open analytics — alle disabled |

**Gesamt:** 9 sichtbare Bereiche (Block 3 nur ohne Device-Heartbeat).

---

## 3. Redundanzen vs. Dashboard

### Bereits im Dashboard (nach Sprint 1.1)

| Information | Dashboard | Orders | Bewertung |
|-------------|-----------|--------|-----------|
| Revenue today | KPI | KPI `kpiRevenue` | **Doppelt** |
| Orders today | KPI | KPI `kpiOrders` | **Doppelt** |
| Receipts today | KPI | KPI `kpiReceipts` | **Doppelt** |
| Device online / POS connected | KPI POS Status + Business Status | Events `eventPosConnected` | **Doppelt** (Orders detaillierter pro Gerät) |
| Cloud synchronized | Activity Timeline | Events `eventCloudSynced` | **Doppelt** |
| Open Desktop POS | Quick Action | Empty State CTA | **Akzeptabel** (kontextuell auf Orders) |
| Waiting for POS sync | KPI-Hint (kurz: `waitingPosSyncShort`) | KPI-Hint (lang: `waitingPosSync`) | **Inkonsistent** |

### Nur auf Orders (sinnvoll für diese Seite)

| Information | Block | Bewertung |
|-------------|-------|-----------|
| Live orders Tabelle | `OrdersTable` | **Kern** — einzigartig |
| Recent receipts Tabelle | `ReceiptsTable` | **Kern** — einzigartig |
| Refunds today | KPI | Orders-spezifisch (wenn Sync da) |
| Average order | KPI | Grenzfall Orders/Reports |
| Open shift | KPI | Orders-spezifisch (operativ) |
| Payment split (heute) | `PaymentOverview` | Orders-spezifisch (operativ, nicht analytisch) |
| Date range filter | `OrdersFilters` | Orders-spezifisch (wenn API angebunden) |

### Gehört eher Dashboard (nicht Orders)

| Information | Aktuell auf Orders | Empfehlung |
|-------------|-------------------|------------|
| Device heartbeat events | `BusinessTimeline` | **Entfernen** — Dashboard Activity |
| Cloud sync event | `BusinessTimeline` | **Entfernen** — Dashboard Activity |
| Revenue/Orders/Receipts KPIs (ohne Tabellen-Kontext) | `OrdersSummary` (3 von 6) | **Kürzen oder entfernen** — Dashboard hat bereits 3 identische KPIs |

### Gehört eher Reports

| Information | Aktuell auf Orders | Empfehlung |
|-------------|-------------------|------------|
| Average order (langfristig) | KPI | Reports (Zeitraum-Analyse) |
| Export CSV/Excel/PDF | Quick Actions | Reports Exports |
| Open analytics | Quick Action | Reports |
| Payment methods über Zeiträume | Duplikat mit Reports | Reports = Analyse; Orders = **nur heute kompakt** |

### Redundanz mit Reports (zusätzlich)

Reports (`deriveReportsState`) hat **identische** Platzhalter für Revenue, Orders, Receipts, Refunds, Avg order **und** Payment methods (Cash/Card/Voucher/Other). Drei Seiten zeigen dieselben leeren Sales-Metriken.

---

## 4. Analyse jeder Card

| Block / Karte | Wichtig? | Redundant? | Zukünftig wichtig? | Echte Daten heute? | Datenquelle / Placeholder |
|---------------|----------|------------|--------------------|--------------------|---------------------------|
| **Page Header** | Ja | Nein | Ja | Ja (Copy) | Übersetzungen |
| **KPI Revenue today** | Mittel | Ja (Dashboard) | Ja | Nein | `—` + `waitingPosSync` |
| **KPI Orders** | Mittel | Ja (Dashboard) | Ja | Nein | `—` + `waitingPosSync` |
| **KPI Receipts** | Mittel | Ja (Dashboard) | Ja | Nein | `—` + `waitingPosSync` |
| **KPI Refunds** | Ja | Nein (Orders-spezifisch) | Ja | Nein | `—` + `waitingPosSync` |
| **KPI Average order** | Niedrig | Teilweise (Reports) | Ja | Nein | `—` + `waitingPosSync` |
| **KPI Open shift** | Ja | Nein (war auf Dashboard, entfernt) | Ja | Nein | `—` + `waitingPosSync` |
| **Empty Hero** | Ja | Nein | Ja (bis Sync) | Bedingt | `hasPosSync` = mind. 1× `device.lastSeenAt` |
| **Date Range Filter** | Ja | Nein | Ja | Nein (UI-only) | Lokaler State, keine API |
| **Live Orders Tabelle** | **Hoch** | Nein | **Kern** | Nein | `orders: []` — Empty: `ordersEmpty` |
| **Recent Receipts Tabelle** | **Hoch** | Nein | **Kern** | Nein | `receipts: []` — Empty: `receiptsEmpty` |
| **Receipt Actions** (View/Print/PDF) | Ja | Nein | Ja | Nein | Immer `aria-disabled`, opacity 0.55 |
| **Payment Cash** | Mittel | Ja (Reports) | Ja | Nein | Wert = `waitingPosSync` (ganzer Satz!) |
| **Payment Card** | Mittel | Ja (Reports) | Ja | Nein | Placeholder |
| **Payment Voucher** | Mittel | Ja (Reports) | Ja | Nein | Placeholder |
| **Payment Other** | Mittel | Ja (Reports) | Ja | Nein | Placeholder |
| **Business Events** | Niedrig | **Ja (Dashboard)** | Nein auf Orders | Teilweise | `devices.lastSeenAt`, `lastSyncedAt` |
| **QA Export CSV** | Niedrig | Ja (Reports) | Ja | Nein | `disabled` + `Coming soon` |
| **QA Export Excel** | Niedrig | Ja (Reports) | Ja | Nein | disabled |
| **QA Export PDF** | Niedrig | Ja (Reports) | Ja | Nein | disabled |
| **QA View reports** | Mittel | Nein | Ja | Nein | disabled — sollte **Link** sein |
| **QA Open analytics** | Niedrig | Ja (Reports) | Ja | Nein | disabled |

---

## 5. Empty States & Placeholder

### Inventar aller Zustände

| Ort | Text / Wert | Typ | Bewertung |
|-----|-------------|-----|-----------|
| KPI-Wert | `—` (`labels.dash`) | Placeholder | Konsistent mit Dashboard |
| KPI-Hint (6×) | „Waiting for POS synchronization“ | Langform | **Inkonsistent** — Dashboard nutzt „Waiting for POS sync“ |
| Empty Hero Headline | „No synchronized sales yet“ | Kontextuell | Gut — ehrlich |
| Empty Hero Body | „Connect your POS…“ | Kontextuell | Professionell |
| Empty Hero CTA | „Open Desktop POS“ | Funktioniert | Gut |
| Orders-Tabelle | „No orders synchronized yet.“ | Empty | Klar |
| Receipts-Tabelle | „No receipts synchronized yet.“ | Empty | Klar |
| Payment-Karten | „Waiting for POS synchronization“ als **Wert** | Placeholder | **Unprofessionell** — ganzer Satz in KPI-Zelle |
| Business Events | „Waiting for activity…“ | Empty | OK, aber Block gehört nicht hierher |
| Filter Custom | „Custom date filtering coming soon.“ | Coming soon | Ehrlich, aber UI suggeriert Funktion |
| Quick Actions (5×) | „Coming soon“ Badge | Coming soon | **Überladen** — gesamter Block wertlos |
| Receipt Actions | Deaktivierte Buttons | Coming soon | Verwirrend in leerer Tabelle (nur Header sichtbar) |
| Loading | Skeleton KPIs + „…“ in Tabellen | Loading | OK |

### Konsistenz-Probleme

1. **Drei Formulierungen für dasselbe:** `waitingPosSync`, `eventsEmpty`, `ordersEmpty` / `receiptsEmpty`
2. **Dashboard vs. Orders:** Kurz vs. lang bei Sync-Hinweis
3. **`hasPosSync` vs. Empty Hero:** Wenn Gerät Heartbeat hat, verschwindet Empty Hero — aber Tabellen bleiben leer → Nutzer sieht 6 KPI-Platzhalter + leere Tabellen **ohne** erklärenden Hero
4. **Payment Overview zeigt 4× denselben Satz** — visuell laut, informativ null

### Wo zu viele Placeholder?

- **6 KPI-Karten** — alle identisch leer
- **4 Payment-Karten** — alle identischer Text
- **5 Quick Actions** — 100 % disabled
- **Business Events** — füllt sich mit Device-Daten, die nichts mit Sales zu tun haben

---

## 6. Payment Overview

### Ist-Zustand

Vier Karten in 2×2 / 4-Spalten-Grid. Jede zeigt denselben String `waitingPosSync` als Wert — keine Beträge, keine Prozentanteile.

### Bewertung

| Frage | Antwort |
|-------|---------|
| Sinnvoll im Prinzip? | **Ja** — operativer Tages-Split (Bar vs. Karte) gehört zur Kassenübersicht |
| Sinnvoll heute? | **Nein** — vier identische Platzhalter erzeugen Noise |
| Bleiben? | **Ja, aber:** erst anzeigen wenn Sales-Sync da **oder** als kompakte Zeile unter KPIs |
| Später Teil von Reports? | **Ja** — Reports = Zeitraum + Trends + Charts; Orders = **nur heute, kompakt** |
| Empfehlung | **Kompakte Darstellung** (eine Zeile: Cash · Card · Voucher · Other) statt 4 Karten mit Platzhalter; volle Karten erst mit echten Daten |

### Abgrenzung Orders vs. Reports

| | Orders | Reports |
|---|--------|---------|
| Zeitraum | Heute (Filter später) | 7d / 30d / 12M |
| Darstellung | Kompakt, operativ | Chart + Tabelle |
| Nutzerfrage | „Womit wurde heute bezahlt?“ | „Wie verteilen sich Zahlarten über Zeit?“ |

---

## 7. Business Events

### Ist-Zustand

`deriveEvents` in `deriveOrdersState.ts`:

- Iteriert `data.devices` → `pos_connected` / `device_connected`
- Fügt `cloud_synced` aus `data.lastSyncedAt` hinzu
- Max. 12 Einträge

**Keine** Sales-Events (`receipt_created`, `refund`, `shift_opened` etc.) — obwohl `BusinessEvent`-Typ diese vorsieht.

### Vergleich Dashboard `deriveActivities`

Dashboard zeigt **zusätzlich:** Rechnungen, Lizenzen, Device-Events, Cloud-Sync — breiter, aber Orders-Events sind **Teilmenge**.

### Empfehlung

| Option | Bewertung |
|--------|-----------|
| Business Events auf Orders behalten | **Nein** — Device-Heartbeat ist Infrastruktur, nicht Sales |
| Nur Sales-Events auf Orders (später) | **Ja** — receipt_created, refund, shift_opened/closed |
| Device/Cloud-Events nur Dashboard | **Ja** — bereits in „Today's Activity“ |

**Begründung:** Orders soll die Frage „Was wurde verkauft?“ beantworten. „POS connected · Till 1“ beantwortet „Läuft die Kasse?“ — das ist Dashboard-Territorium. Ein zweites Activity-Feed verwässert beide Seiten.

**Sprint 1.2:** Block **entfernen**. Bei späterem POS-Sync optional **Sales-Event-Feed** (nur receipt/refund/shift) — nicht Device-Mirror.

---

## 8. Quick Actions

### Existierende Actions (`deriveQuickActions`)

| ID | Label | Funktioniert? | Badge |
|----|-------|---------------|-------|
| `csv` | Export CSV | Nein | Coming soon |
| `excel` | Export Excel | Nein | Coming soon |
| `pdf` | Export PDF | Nein | Coming soon |
| `reports` | View reports | Nein | Coming soon |
| `analytics` | Open analytics | Nein | Coming soon |

Alle werden als `<span aria-disabled>` gerendert — kein Link, kein Handler.

### Was Nutzer auf Orders erwarten würden

| Erwartung | Status | Empfehlung |
|-----------|--------|------------|
| Einzelbeleg ansehen | UI da, disabled | Aktivieren wenn Sync da |
| Beleg drucken / PDF | UI da, disabled | Aktivieren wenn Sync da |
| Export heutiger Orders | Geplant, disabled | Reports oder hier — **nicht beides mit Coming soon** |
| Zu Reports wechseln | Disabled | **Sofort als Link** `/portal/reports` |
| Filter / Zeitraum | UI da, ohne Wirkung | Erst zeigen wenn API |

### Empfehlung Sprint 1.2

- **Gesamten Quick-Actions-Block entfernen** (wie Dashboard: keine disabled Coming-soon-Buttons)
- Stattdessen: funktionierender Link „View reports“ im Header oder unter Tabellen
- Export-Actions erst in Reports-Sprint oder wenn Export-API existiert

---

## 9. Datenquellen

### Hook & API

```
usePortalOrdersData → usePortalDashboardData (Alias)
```

**Fetch (parallel):**

| Endpoint | Verwendung auf Orders |
|----------|----------------------|
| `fetchPortalLicenses()` | Nicht direkt auf Orders-UI |
| `fetchPortalDevices()` | `hasPosSync`, Business Events |
| `fetchPortalInvoices()` | Nicht auf Orders-UI |
| `fetchPortalBusiness()` | Nicht auf Orders-UI |

**Kein** `fetchPortalOrders`, `fetchPortalReceipts`, `fetchPortalSales` o. ä.

### Datenherkunft pro Block

| Block | Quelle | Kann heute echte Sales-Daten zeigen? |
|-------|--------|--------------------------------------|
| KPIs (6) | Hardcoded `waitingKpi()` | **Nein** |
| Orders-Tabelle | `orders: []` hardcoded | **Nein** |
| Receipts-Tabelle | `receipts: []` hardcoded | **Nein** |
| Payment Overview | `derivePayments()` — statischer Text | **Nein** |
| Business Events | `devices[].lastSeenAt`, `lastSyncedAt` | **Ja** (aber nicht Sales) |
| Empty Hero | `hasPosSync` = `devices.some(d => d.lastSeenAt)` | **Ja** (Heartbeat, nicht Sales) |
| Date Filter | Lokaler React-State | **Nein** (keine Backend-Anbindung) |

### `hasPosSync` — semantisches Problem

```ts
// deriveOrdersState.ts
function hasPosSync(input): boolean {
  return input.data.devices.some((d) => Boolean(d.lastSeenAt?.trim()));
}
```

**Bedeutet:** Mindestens ein Gerät hat jemals Heartbeat gesendet.  
**Bedeutet nicht:** Orders/Receipts/Revenue wurden synchronisiert.

Folge: Empty Hero verschwindet bei Heartbeat, aber alle Sales-Blöcke bleiben leer — **schlechtere UX** als ohne Heartbeat.

### Bereiche die ohne POS-Sales-Sync **niemals** Daten zeigen können

| Bereich | Benötigte POS-Daten (zukünftig) |
|---------|--------------------------------|
| Revenue / Orders / Receipts KPIs | Tages-Aggregate aus POS |
| Refunds / Avg order | Sales-Aggregate |
| Open shift | Shift-Status vom POS |
| Live Orders Tabelle | Order-Stream / Snapshot |
| Recent Receipts | Receipt-Liste |
| Payment Overview | Payment-Totals pro Methode |
| Receipt View/Print/Download | Receipt-PDF / Detail-API |
| Date Filter (sinnvoll) | Zeitgefilterte Sales-Query |
| Sales-Events | Event-Stream vom POS |

### Was POS Desktop heute sendet (laut Portal-Analyse)

- Device **Heartbeat** (`lastSeenAt`, `status`, `appVersion`)
- License **Bind**
- **Keine** Verkäufe, Belege, Zahlungen, Schichten

---

## 10. Zielbild — professionelle SaaS-Orders-Seite

**Ohne neue Features.** Nur vorhandene Bausteine sinnvoll einsetzen.

### Kernfrage der Seite

> **„Was wurde heute an der Kasse verkauft?“**

### Behalten (sofort / Struktur)

| Block | Anpassung |
|-------|-----------|
| Page Header | Subtitle präziser: Fokus auf Bestellungen & Belege |
| **Live Orders** Tabelle | Zentrum der Seite — nach oben rücken |
| **Recent Receipts** Tabelle | Direkt unter Orders |
| Empty Hero | Behalten wenn **keine Sales-Daten** (nicht nur kein Heartbeat) |
| Open Desktop POS CTA | Im Empty State (funktioniert bereits) |

### Kürzen / kompakt (Sprint 1.2)

| Block | Maßnahme |
|-------|----------|
| KPI Summary | **Max. 3–4 KPIs:** Orders, Receipts, Refunds, Open shift — **nicht** Revenue (Dashboard) |
| Payment Overview | **Ausblenden** bis Sync **oder** eine kompakte Zeile statt 4 Platzhalter-Karten |
| Date Range | **Nur „Today“** anzeigen bis Filter API-seitig wirkt; Yesterday/Last7/Custom ausblenden |

### Entfernen (Sprint 1.2)

| Block | Grund |
|-------|-------|
| Business Events | Dashboard-Duplikat, keine Sales-Daten |
| Quick Actions (alle disabled) | Dashboard-Lesson: keine Coming-soon-Wand |
| KPI Revenue / Orders / Receipts (optional alle 3) | Wenn Dashboard-Link reicht — sonst nur Orders-spezifische KPIs |

### Verschieben (andere Seiten)

| Inhalt | Ziel |
|--------|------|
| Average order (langfristig) | Reports |
| Export CSV/Excel/PDF | Reports |
| Device / Cloud Events | Dashboard |
| Revenue today (Tages-KPI) | Dashboard |

### Später aktivieren (wenn POS-Sales-Sync existiert)

| Block | Voraussetzung |
|-------|---------------|
| Live Orders Tabelle | Order-API |
| Recent Receipts + Actions | Receipt-API + PDF |
| Payment Overview (kompakt) | Payment-Aggregate API |
| Refunds / Open shift KPIs | Shift + Refund-Sync |
| Date Filter (Yesterday, 7d, Custom) | Zeitgefilterte Sales-Query |
| Optional: Sales-Event-Feed | POS Event-Stream (nur Sales) |

### Vorgeschlagenes Layout (Zielbild)

```
┌─────────────────────────────────────────────┐
│ Orders                                      │
│ Today's sales — orders and receipts         │
├─────────────────────────────────────────────┤
│ [Empty Hero] — nur wenn keine Sales-Sync    │
├─────────────────────────────────────────────┤
│ KPI: Orders · Receipts · Refunds · Shift    │  (kompakt, 4 max)
├─────────────────────────────────────────────┤
│ Today ▾                    (Filter reduziert) │
├─────────────────────────────────────────────┤
│ LIVE ORDERS (Tabelle)                       │
├─────────────────────────────────────────────┤
│ RECENT RECEIPTS (Tabelle)                   │
├─────────────────────────────────────────────┤
│ Payment today: Cash · Card · …              │  (nur mit Daten)
└─────────────────────────────────────────────┘
```

---

## 11. Priorisierung UI-Aufräumarbeiten

| Priorität | Maßnahme | Aufwand | Impact |
|-----------|----------|---------|--------|
| **HIGH** | `BusinessTimeline` von Orders entfernen | Gering | Eliminiert Dashboard-Duplikat |
| **HIGH** | `OrdersQuickActions` entfernen (5× Coming soon) | Gering | Professionelleres Erscheinungsbild |
| **HIGH** | KPI-Streifen auf 3–4 Orders-spezifische KPIs kürzen (Revenue/Orders/Receipts-Duplikat zu Dashboard entfernen) | Mittel | Klare IA |
| **HIGH** | `waitingPosSync` → `waitingPosSyncShort` (wie Dashboard) | Gering | Text-Konsistenz |
| **HIGH** | `hasPosSync`-Logik vs. Empty Hero überdenken (Hero bei leeren Tabellen trotz Heartbeat) | Mittel | Bessere Empty UX |
| **MEDIUM** | `PaymentOverview` ausblenden oder kompakte Zeile bis echte Daten | Mittel | Weniger Placeholder-Noise |
| **MEDIUM** | `OrdersFilters` auf „Today“ reduzieren / Rest ausblenden | Gering | Keine falsche Interaktivität |
| **MEDIUM** | Tabellen nach oben (vor KPIs oder direkt nach Hero) | Gering | Fokus auf Kerninhalt |
| **MEDIUM** | Link „View reports“ als funktionierenden Text-Link (nicht Quick Action) | Gering | Navigation ohne Coming soon |
| **LOW** | Receipt-Action-Buttons erst rendern wenn Zeilen existieren | Gering | Sauberere leere Tabelle |
| **LOW** | Subtitle-Copy schärfen | Gering | Klarere Erwartung |
| **LOW** | `orders-ops` Gap / Spacing an Dashboard anpassen (16px) | Gering | Visuelle Konsistenz |

---

## 12. Technische Referenz (für Implementierung Sprint 1.2)

### Relevante Dateien

| Datei | Rolle |
|-------|-------|
| `src/routes/PortalOrdersPage.tsx` | Seiten-Orchestrierung |
| `src/lib/orders/deriveOrdersState.ts` | State-Ableitung (alles Placeholder außer Events) |
| `src/lib/orders/usePortalOrdersData.ts` | Alias → Dashboard-Data-Hook |
| `src/lib/orders/types.ts` | Typen für Orders, Receipts, Events |
| `src/components/orders/*` | UI-Komponenten |
| `src/lib/translations/portal/*.ts` | `orders.*` Keys |
| `src/index.css` | `.orders-*` Styles |

### Tests

`deriveOrdersState.test.ts` — 2 Tests:

- erfindet keine Orders/Receipts ✓
- `hasPosSync` aus Device-Heartbeat ✓

Bei Cleanup: Tests für gekürzte KPIs / entfernte Events anpassen.

### Abhängigkeit POS-Sync (kein Sprint 1.2 Scope)

Befüllung von Tabellen und KPIs erfordert **separaten Sync-Sprint** (Cloud-API + POS Desktop). Sprint 1.2 ist **rein UI/IA** — analog Dashboard 1.1.

---

## Anhang: Seitenvergleich KPI-Duplikation

| KPI | Dashboard | Orders | Reports |
|-----|-----------|--------|---------|
| Revenue | ✓ | ✓ | ✓ |
| Orders | ✓ | ✓ | ✓ |
| Receipts | ✓ | ✓ | ✓ |
| Refunds | — | ✓ | ✓ |
| Avg order | — | ✓ | ✓ |
| Open shift | — | ✓ | — |
| VAT | — | — | ✓ |
| POS Status | ✓ | — | — |
| Employees | ✓ | — | — |
| Last Sync | ✓ | — | — |

**Fazit:** Orders und Reports teilen sich ein **Sales-KPI-Raster ohne Datenquelle**. Nach Dashboard-Cleanup sollte Orders **nicht** das dritte Dashboard werden, sondern zur **Tabellen-zentrierten Ops-Seite** werden.

---

*Ende der Analyse — Sprint 1.2 Implementierung folgt separat auf Basis dieses Dokuments.*
