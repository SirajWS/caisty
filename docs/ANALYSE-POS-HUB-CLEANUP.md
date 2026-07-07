# Analyse: Caisty POS Hub — Customer Portal Cleanup (Sprint 1.11)

**Stand:** 2026-07-08  
**Scope:** Nur `/portal/pos` (`PortalPosPage`) — read-only Code- und UX-Analyse  
**Methode:** Review von `PortalPosPage`, `PosHubPanels`, `derivePosHubState`, `usePortalPosHubData`, `posConfig`, Abgleich mit Dashboard, Business, Devices (Sprint 1.7), Licenses, Plans & Billing (Sprint 1.8), Support (Sprint 1.9), Sidebar (Sprint 1.10)  
**Wichtig:** Dieses Dokument ist **nur Analyse**. Keine Code-, UI-, API- oder Build-Änderungen.

---

## Executive Summary

Die Seite **Caisty POS** (`/portal/pos`) ist der vorgesehene **Einstiegspunkt zwischen Customer Portal und Desktop POS** — und die letzte große Portal-Seite vor Phase 2 (POS ↔ Cloud Synchronisation).

**Kernbefund:** Die Seite ist funktional reich, aber **informationsarchitektonisch überladen**. Sie kombiniert Launch-Hub, Setup-Checklist, Device-Monitoring, Lizenz-Übersicht, Release Center, System-Status und eine 6×-Coming-soon-Roadmap auf **einer langen Scroll-Seite mit 9 Hauptbereichen**.

Im Vergleich zu den bereinigten Seiten (Business 1.5, Devices 1.7, Billing 1.8, Support 1.9) wirkt POS Hub noch wie ein **frühes „Operations Dashboard“** — nicht wie ein fokussierter **„Start / Install / Update“-Hub**.

**Ziel-Frage heute:** *„Ich möchte meine POS starten, installieren oder verwalten.“*  
**Antwort der Seite heute:** Nur indirekt — nach Scrollen durch KPIs, Readiness-Ring, Device-Cards und System-Status.

**Empfehlung Sprint 1.11:** Struktureller Cleanup analog Devices/Billing/Support — von ~9 Bereichen auf **4–5 fokussierte Sektionen**: kompakte POS Summary, Main Actions, Version & Updates (ein Panel), optional kompakte Setup-Hinweise, Footer mit Querverweisen. **Entfernen:** KPI-Leiste, Device-Grid, System Status, Coming Soon, redundante Header-Badges.

**Phase-2-Vorbereitung:** Die Seite ist der **richtige Ort** für Live-Sync-Status (POS online, letzter Sync, Queue) — aber nur **nach** echter Sync-API. Heute zeigt „Last sync“ nur den **Zeitpunkt des letzten Portal-API-Fetches**, nicht POS↔Cloud-Sync.

---

## 1. Informationsarchitektur

### Aktuelle Sektionen (`PortalPosPage.tsx`, Reihenfolge)

| # | Bereich | Komponente | Immer sichtbar? | Datenquelle |
|---|---------|------------|-----------------|-------------|
| 1 | Header | `PosHubHeader` | Ja | `derivePosHubState`, `posConfig` |
| 2 | Badges (im Header) | `PosHubHeader` | Ja | Version, Plan, Cloud, Environment |
| 3 | Fiscal / Alerts | `PosHubNotifications` | Bedingt | `deriveNotifications` |
| 4 | KPI Cards (6) | `PosHubKpiRow` | Ja | `hub.version`, `hub.license`, devices, system |
| 5 | Main Actions (3 Karten) | `PosHubActionPanel` | Ja | `getPosReleaseConfig()` |
| 6 | POS Readiness | `PosHubReadinessPanel` | Ja | `deriveReadiness` + Progress Ring |
| 7 | Connected Devices | `PosHubDevices` | Ja (bis 8 Cards) | `fetchPortalDevices()` |
| 8 | Release Center | `PosHubReleaseCenter` | Ja | `posConfig` + `hub.version` |
| 9 | System Status | `PosHubSystemStatus` | Ja | `deriveSystemStatus` |
| 10 | Coming Soon (6) | `PosHubComingSoon` | Ja | Statische i18n-Liste |

**Geschätzte Höhe:** ~2.200–2.800 px Desktop (mit Geräten und Notifications) — **mehrfaches Scrollen** erforderlich.

### Was gehört wirklich zum POS Hub?

| Bereich | Gehört auf POS Hub? | Begründung |
|---------|---------------------|------------|
| Main Actions (Desktop öffnen, Download) | **Ja — Kern** | Primäre Nutzerintention |
| Version & Update (ein Panel) | **Ja — Kern** | Zentraler Update-Einstieg |
| Kompakte POS-Verbindung (online/offline) | **Ja** | Hub-Rolle Desktop ↔ Cloud |
| Alert-Streifen (Update, Offline) | **Ja (kompakt)** | Handlungsorientiert |
| POS Readiness (kompakt) | **Teilweise** | Nur als „Launch blockers“ mit Links |
| KPI-Leiste (6) | **Nein** | Dashboard-Duplikat |
| Device-Grid (8 Cards) | **Nein** | Devices-Seite (Sprint 1.7) |
| Release Center (separat von Actions) | **Nein** | Mit Version/Actions mergen |
| System Status (Env, Portal) | **Nein** | Intern / später Status-Page |
| Coming Soon (6) | **Nein** | Roadmap-Rauschen |
| Header-Badges (4) | **Nein** | In Summary-Bar verdichten |
| License Plan / Upgrade CTA | **Teilweise** | Kurzverweis → Billing/Licenses |
| Fiscal Alert | **Teilweise** | Link → Business (nicht POS-spezifisch) |

### Was gehört bereits auf andere Seiten?

| Information | Aktuell auf POS | Richtige Heimat |
|-------------|-----------------|-----------------|
| Device-Liste, Slots, Heartbeat | `PosHubDevices` | **Devices** (`DeviceManagement`, `DeviceSeatSummary`) |
| Business-Profil, Fiscal Pack Setup | Readiness + Notifications | **Business** (`BusinessSetupProgress`, `FiscalSummary`) |
| Lizenz-Key, Plan-Inventar | Readiness, KPI, Header | **Licenses** |
| Abo, Upgrade, Ablauf | Readiness Footer, Notifications | **Plans & Billing** |
| POS Online/Offline (aggregiert) | KPI, Notifications | **Dashboard** (`StoreStatusWidget`, KPI) |
| Cloud API / Environment | Header, System Status | **Entfernen** (Kunde) oder **Status Page** (später) |
| Support bei Cloud-Fehler | Notification → `/portal/support` | **Support** (ok als Link, nicht als POS-Inhalt) |

---

## 2. Redundanzen

### Vergleich mit bereinigten Portal-Seiten

| Information | POS Hub | Dashboard | Business | Devices | Licenses | Billing | Support |
|-------------|---------|-----------|----------|---------|----------|---------|---------|
| License Plan | Header, KPI, Readiness | Health | — | Seat Summary | Tabelle | Subscription Summary | — |
| Fiscal Status | Notification, Readiness | Store Status, Alerts | Fiscal Summary | — | — | — | — |
| Device Count / Online | KPI, Devices Grid | KPI, Store Status | — | Seat Summary, Cards | — | — | — |
| Installed / Latest Version | KPI×2, Readiness, Release, Devices | Snapshot (derived, nicht gerendert) | — | Card meta | — | — | — |
| Update Available | KPI, Notification, Release | Alert (via hub) | — | — | — | — | — |
| Open Desktop POS | Main Action | Quick Action | — | Card action | — | — | — |
| Download Installer | Main Action, Release | — | — | Empty State CTA | — | — | — |
| Cloud Connected | Header, KPI, Readiness, System | Store Status | — | — | — | — | — |
| Last Sync | System Status | — | — | Card meta | — | — | — |
| Setup Checklist | Readiness (6 Items) | Health (4 Items) | Setup Progress | — | — | — | — |

### Schwere Redundanzen (HIGH)

1. **Version dreifach:** Header-Badge „Latest“, KPI „Installed“ + „Latest“ + „Update status“, Readiness „Version status“, Release Center (4 Meta-Felder), pro Device `appVersion`.
2. **License Plan dreifach:** Header-Badge, KPI, Readiness + optional Upgrade-Footer.
3. **Download doppelt:** Main Actions Karte + Release Center Button.
4. **Devices doppelt:** KPI „Connected devices“ (Link) + vollständiges Device-Grid (bis 8 Cards) — Devices-Seite ist nach Sprint 1.7 die autoritative Quelle.
5. **Cloud Status vierfach:** Header-Badge, KPI, Readiness „Cloud connection“, System Status „Cloud API“.

### Bereits besser dargestellt woanders

| Auf POS Hub | Besser auf |
|-------------|------------|
| Device-Grid mit 6 Metadaten-Zeilen | **Devices** — Slot-Grid, kompakte Cards |
| Fiscal Pack Detail | **Business** — editierbar, Fiscal Summary |
| License Key / Seats | **Licenses** + **Devices** Seat Summary |
| Plan Upgrade | **Billing** — Subscription Summary |
| Aggregierte Alerts (Fiscal, License expiry) | **Dashboard** — `BusinessAlertCenter` |

### Geteilte Datenpipeline (technisch)

`usePortalPosHubData` wird wiederverwendet als:
- `usePortalBusinessData`
- `usePortalDevicesData`
- `usePortalDashboardData` (eigener Hook, gleiche APIs)

`derivePosHubState` wird im **Dashboard** (`deriveDashboardState`) für Notifications und Health mitgenutzt — Alerts erscheinen faktisch **zweimal** (Dashboard + POS), wenn der Nutzer beide Seiten besucht.

---

## 3. Hauptaufgabe der Seite

### Ziel-Frage

> „Ich möchte meine POS starten, installieren oder verwalten.“

### Bewertung

| Kriterium | Score | Kommentar |
|-----------|-------|-----------|
| Klarheit der Hauptaufgabe | **3/10** | Subtitle verspricht „Manage tills, devices, updates“ — zu breit |
| Time-to-Action (Desktop öffnen) | **6/10** | Main Actions sind sichtbar, aber nach Header + KPIs + ggf. Notifications |
| Install-Pfad | **7/10** | Download-Karte funktioniert; Konkurrenz durch Release Center |
| Verwaltung | **4/10** | Device-Verwaltung gehört zu Devices; POS zeigt trotzdem volles Grid |
| Dashboard-Feeling | **8/10** (negativ) | 6 KPIs + Progress Ring + System Grid = starkes Dashboard |

**Fazit:** Die Seite wirkt heute **eher wie ein Operations-Dashboard** als wie ein **Launch-Hub**. Die drei Main Actions sind der richtige Kern — werden aber von 6 weiteren Sektionen visuell untergraben.

---

## 4. Main Actions

### Ist-Zustand (`PosHubActionPanel`)

| Karte | Status | Verhalten |
|-------|--------|-----------|
| **Open Desktop POS** | Aktiv | `caisty://open` Protocol, Fallback-Hinweis wenn nicht installiert, Mobile-Hinweis |
| **Open Web POS** | Disabled (Standard) | `VITE_POS_WEB_ENABLED` — Button „Coming soon“ |
| **Download latest** | Aktiv | Installer-Link aus `posConfig` |

### Bewertung

| Action | Richtig platziert? | Empfehlung |
|--------|-------------------|------------|
| Open Desktop POS | **Ja** | Behalten, prominent (Primary) |
| Download Installer | **Ja** | Behalten — ggf. mit Version in einem Panel statt zweiter Karte + Release Center |
| Open Web POS | **Fraglich** | **Nicht als volle Karte**, solange disabled — stattdessen: eine Zeile „Web POS — coming soon“ oder komplett ausblenden bis `web.enabled` |

### Open Web POS — Sichtbarkeit

| Option | Pro | Contra |
|--------|-----|--------|
| Volle Karte (heute) | Setzt Erwartung | Nimmt 33 % Grid ein für toten Button |
| Nur wenn enabled | Sauberes UX | Nutzer wissen nicht, dass Web POS geplant ist |
| Kompakte Hinweiszeile | Balance | Weniger Marketing-Fläche |

**Empfehlung:** Web POS **nicht als gleichwertige Hauptkarte** — nur anzeigen wenn `release.web.enabled === true`, sonst optional einzeiliger Hinweis im Footer oder unter Version-Panel.

---

## 5. Version Management

### Ist-Zustand (verteilt über die Seite)

| Ort | Felder |
|-----|--------|
| Header Badge | Latest version |
| KPI Row | Installed, Latest, Update status |
| Readiness | Version status (done wenn up-to-date) |
| Release Center | Latest, Installed, Release date, Update status, Notes, Size, Download |
| Device Cards | `appVersion` pro Gerät |

### Datenbasis

- **Installed:** `pickHighestSemver(devices.map(d => d.appVersion))` — höchste gemeldete Version über alle Geräte
- **Latest:** Build-time `VITE_POS_WINDOWS_URL` / `VITE_POS_LATEST_VERSION` via `getPosReleaseConfig()`
- **Update:** `isUpdateAvailable(installed, latest)` in `posVersion.ts`

### Was ein Kunde wirklich braucht

| Information | Priorität | Heute vorhanden? |
|-------------|-----------|------------------|
| „Bin ich up to date?“ | **Hoch** | Ja (aber 4× wiederholt) |
| „Welche Version läuft?“ | **Hoch** | Ja |
| „Wo downloaden?“ | **Hoch** | Ja (2×) |
| Release Notes (kurz) | Mittel | Ja (env-basiert) |
| Installer-Größe / Dateiname | Niedrig | Ja |
| SHA256 | Niedrig | In Config, nicht UI |
| Pro-Gerät Version | Mittel | Nur im Device-Grid (→ Devices) |
| Auto-Update Status | — | Coming soon (nicht implementiert) |
| Versionshistorie | Niedrig | Fehlt |

### Was fehlt

- **Ein** konsolidiertes Version-Panel statt vier Darstellungen
- Klarheit bei **mehreren Geräten** mit unterschiedlichen Versionen („2 of 3 on latest“)
- Echte **Release Notes** (API statt env summary) — Phase 2/3
- **Auto-update** Kanal — Phase 3

---

## 6. POS Readiness

### Ist-Zustand (`deriveReadiness`)

| Item | Prüfung | Link |
|------|---------|------|
| Business profile | `isStepCompanyDone(business)` | `/portal/business` |
| Fiscal Pack | `deriveFiscalVisibility` | `/portal/business` |
| License | `isStepLicensePlanDone` | `/portal/licenses` |
| Connected device | `devices.length > 0` | `/portal/devices` |
| Cloud connection | `!loading && !error` (API-Fetch) | `/portal/support` ⚠️ |
| Version status | `!updateAvailable && installed` | (inline) |

Plus: **Progress Ring** (% erledigt) und optional **Upgrade CTA** → `/portal/billing`.

### Bewertung

| Aspekt | Sinnvoll auf POS? | Alternative |
|--------|-------------------|-------------|
| Business + Fiscal | **Grenzfall** | Business `BusinessSetupProgress` ist autoritativ |
| License | **Grenzfall** | Licenses + Billing |
| Connected device | **Ja** | Kompakt + Link Devices |
| Cloud | **Nein (so definiert)** | „Cloud“ = Portal-API erreichbar — irreführend |
| Version | **Ja** | In Version-Panel integrieren |

**Empfehlung:** Readiness **drastisch verdichten** zu „Launch checklist“ (max. 3–4 Zeilen):
- Device verbunden?
- Version aktuell?
- Blocker? → Link Business/Billing/Devices

Progress Ring (%) ist **Dashboard-Pattern** — auf POS Hub entbehrlich.

---

## 7. Connected Devices

### Ist-Zustand

- `PosHubDevices`: Grid mit bis zu **8 Device Cards**
- Pro Card: Name, Status, Platform, Version, Last seen, License binding, Store
- Link „View all devices“ → `/portal/devices`

### Nach Sprint 1.7 (Devices)

Devices-Seite bietet:
- `DeviceSeatSummary` (Plan · X of Y used)
- `DeviceManagement` mit Slot-Grid
- `openDesktopPos` auf Cards
- Footer mit POS / Licenses / Support

### Braucht POS Hub noch eine Device-Übersicht?

| Option | Bewertung |
|--------|-----------|
| Volles Grid (heute) | **Nein** — klare Redundanz |
| Kompakt: „2 devices · 1 online“ + Link | **Ja** — ausreichend für Hub |
| Gar nichts | Möglich, wenn Summary-Bar Device-Count zeigt |

**Empfehlung:** Ersetzen durch **eine Zeile** in POS Summary oder kleines Status-Panel:

```
Connected: 2 of 3 seats · 1 online · View devices →
```

---

## 8. Release / Update — zukünftiger Update-Hub?

### Soll `/portal/pos` der zentrale Update-Hub werden?

**Ja** — das ist architektonisch korrekt und konsistent mit der Sidebar-Gruppe „POS“.

| Funktion | Heute | Ziel-Hub |
|----------|-------|----------|
| Download Installer | Main Action + Release Center | **Ein** Version & Updates Panel |
| Release Notes | Env-Text + optional URL | API-gestützt (Phase 2) |
| Versionshistorie | Fehlt | Phase 3 |
| Auto Update | Coming soon | Phase 3 |
| Per-device Update | Device Cards | Phase 2 (Sync) |

### Was von Devices/Dashboard hierher wandern sollte

| Quelle | Inhalt | Aktion |
|--------|--------|--------|
| POS Hub (heute) | Release Center | Behalten, mergen |
| Devices (entfernt in 1.7) | Version Management Panel | **Nicht** zurückholen |
| Dashboard (derived, nicht gerendert) | `releaseCenter`, `systemHealth` | Toten Code nicht auf POS duplizieren |

---

## 9. Phase-2-Vorbereitung — Live-Daten Roadmap

| Datenpunkt | Phase | Heutige Basis | Zukünftige Quelle |
|------------|-------|---------------|-------------------|
| POS Online | **2** | Device `status` via Heartbeat | Live Sync / WebSocket |
| Cloud verbunden | **1** (teilweise) | API-Fetch erfolgreich | Echter Cloud-Health-Endpoint |
| Letzter Sync | **1** (irreführend) | `lastSyncedAt` = Portal-Reload | POS-reported `lastSyncAt` |
| Bestellungen synchronisiert | **2** | — | Sync-Status API |
| Receipts synchronisiert | **2** | — | Sync-Status API |
| Offline Queue (Anzahl) | **2–3** | — | POS Queue Telemetry |
| Update verfügbar | **1** | Semver-Vergleich | Behalten + API Release |
| Cloud API erreichbar | **1** | Fetch error flag | Dedizierter Health-Check |
| Fiscal Live Status | **2–3** | Business profile | Fiskaly Sync |
| Web POS verfügbar | **3** | Env flag | Product Launch |
| Auto Update | **3** | — | Updater Channel |
| API Latenz / System Health | **3** | Coming soon | Observability |

### Empfohlene neue Sektion (Phase 2)

**„Live Synchronisation“** — kompaktes Panel:

```
POS: Online · Cloud: Connected · Last sync: 2 min ago
Orders today: 47 synced · Receipts: 47 · Queue: 0 pending
```

Nur wenn echte Daten existieren — keine Platzhalter wie auf anderen bereinigten Seiten.

---

## 10. SaaS Benchmark

| Produkt | Hub-Fokus | Was professionell wirkt | Was Caisty fehlt |
|---------|-----------|-------------------------|------------------|
| **Square Dashboard** | Locations, Launch app | Klarer Primary CTA, wenig KPI-Rauschen | Eindeutiger „Open app“-Fokus ohne 6 KPIs |
| **Shopify POS** | Channel-Status, Install | Saubere Trennung Online Store / POS | Web vs Desktop klar getrennt wenn relevant |
| **Lightspeed** | Register-Liste in Settings | Updates unter „Software“ nicht auf Home | Update nicht 3× zeigen |
| **Toast POS** | Download + Device Management getrennt | Dedizierte Geräteverwaltung | POS Hub ≠ Device Manager |
| **Stripe Terminal** | Register reader, Status, Update | Ein Status-Streifen, eine Update-Zeile | Kompakte Summary statt Dashboard |

### Elemente die Caisty übernehmen sollte

1. **Ein Primary Action** above the fold (Open Desktop POS)
2. **Ein Status-Streifen** (online / version / sync) — nicht 6 KPIs
3. **Sekundäre Links** zu Devices, Billing, Business — nicht Duplicate Content
4. **Keine internen Metriken** (Environment, Portal online) im Kunden-UI
5. **Keine Coming-soon-Grids** auf produktiven Hub-Seiten

---

## 11. Zielbild (Struktur — keine Implementierung)

### Empfohlene Seitenstruktur (Sprint 1.11+)

```
┌─────────────────────────────────────────────────────────────┐
│ POS Summary (horizontal bar)                                │
│ Caisty POS · Subtitle                                       │
│ [Online 1/2] [v0.3.2 · Up to date] [Open Desktop POS btn]   │
├─────────────────────────────────────────────────────────────┤
│ Alerts (nur wenn relevant: Update, Offline, Fiscal blocker) │
│ max. 2–3 Zeilen, dismissible später                         │
├─────────────────────────────────────────────────────────────┤
│ Main Actions (2 Karten oder 1 Row)                          │
│ [Open Desktop POS]  [Download v0.3.2]                       │
│ (Web POS: hidden until enabled)                             │
├─────────────────────────────────────────────────────────────┤
│ Version & Updates (ein Panel)                               │
│ Installed · Latest · Release date · Notes · Download        │
├─────────────────────────────────────────────────────────────┤
│ Launch Checklist (kompakt, 3–4 Zeilen max)                  │
│ ✓ Device connected  ✓ Version  ⚠ Fiscal → Business          │
├─────────────────────────────────────────────────────────────┤
│ Live Sync (Phase 2 — Platzhalter weglassen bis API da)      │
├─────────────────────────────────────────────────────────────┤
│ Footer: Devices · Licenses · Install · Support              │
└─────────────────────────────────────────────────────────────┘
```

### Alternative (noch kompakter, „Stripe-like“)

Summary + Actions + Version in **einem** above-the-fold Block; Checklist und Footer darunter. Ziel: **Desktop ohne Scrollen** im Normalfall (POS installiert, up to date).

### Was entfällt im Zielbild

- KPI Grid (6)
- Device Grid (8 Cards)
- Release Center als eigene Sektion
- System Status Panel
- Coming Soon Grid (6)
- Header Badges (4)
- Progress Ring Readiness

---

## Problemliste

### HIGH

| ID | Problem | Auswirkung |
|----|---------|------------|
| H1 | 9 Sektionen / starkes Dashboard-Feeling | Nutzer finden Hauptaktion nicht sofort |
| H2 | Device-Grid dupliziert Devices-Seite (Sprint 1.7) | Wartungsdoppelung, verwirrende IA |
| H3 | Version/License/Cloud jeweils 3–4× dargestellt | Visuelles Rauschen, inkonsistente Werte möglich |
| H4 | „Last sync“ = Portal-Fetch, nicht POS-Sync | Irreführend vor Phase 2 |
| H5 | „Cloud connection“ in Readiness = API OK | Falscher mental model für Kunden |

### MEDIUM

| ID | Problem | Auswirkung |
|----|---------|------------|
| M1 | Open Web POS als volle disabled Karte | Verschwendeter Platz |
| M2 | Release Center + Download Action redundant | Doppelter CTA |
| M3 | Notifications überlappen mit Dashboard Alerts | Gleiche Alerts an zwei Orten |
| M4 | Readiness mischt Setup (Business) mit Launch (POS) | Falsche Seite für Fiscal/Business |
| M5 | Environment Badge (Production/Staging) | Intern, nicht kundennutzen |
| M6 | Kein Footer wie andere bereinigte Seiten | Inkonsistentes Portal |

### LOW

| ID | Problem | Auswirkung |
|----|---------|------------|
| L1 | Coming Soon Grid (6 Items) | Roadmap-Rauschen |
| L2 | SHA256 in Config aber nicht UI | OK — kein Handlungsbedarf |
| L3 | `PosHubSkeleton` zeigt 6 KPI-Platzhalter | Verstärkt Dashboard-Erwartung |
| L4 | Subtitle „Manage tills, devices…“ zu breit | Schwächt Hub-Fokus |

---

## Empfohlene Sprint-1.11-Aufgaben

### Phase A — Entfernen (Rendering only, Dateien behalten)

1. `PosHubKpiRow` aus `PortalPosPage` entfernen
2. `PosHubDevices` entfernen → kompakte Zeile in Summary
3. `PosHubSystemStatus` entfernen
4. `PosHubComingSoon` entfernen
5. Header-Badges in kompakte `PosSummary`-Bar migrieren

### Phase B — Zusammenführen

6. `PosHubReleaseCenter` in ein **Version & Updates** Panel mergen (mit Download)
7. `PosHubActionPanel` auf 2 primäre Actions reduzieren; Web POS conditional
8. `PosHubReadinessPanel` → kompakte **Launch Checklist** (max 4 Items, kein Ring)

### Phase C — Konsistenz

9. `PosHubFooter` analog Devices/Billing/Support
10. Subtitle schärfen: *„Open, install, and update your desktop POS.“*
11. CSS: `pos-hub-home` gap reduzieren, Summary-Bar Pattern (wie Billing/Support)
12. Skeleton an neues Layout anpassen

### Phase D — Tests & Docs

13. `derivePosHubState.test.ts` erweitern falls derive vereinfacht wird
14. Manuelle Route-Checks aller `/portal/*` Links

### Bewusst NICHT in Sprint 1.11

- API-Änderungen / echte Sync-Daten (Phase 2)
- Web POS aktivieren
- Auto-Update
- Device Management Logik ändern

---

## Betroffene Dateien (bei Umsetzung)

| Datei | Rolle |
|-------|-------|
| `apps/caisty-site/src/routes/PortalPosPage.tsx` | Seitenkomposition |
| `apps/caisty-site/src/components/posHub/PosHubPanels.tsx` | UI-Sektionen (split/merge) |
| `apps/caisty-site/src/lib/posHub/derivePosHubState.ts` | Summary-Ableitung, Readiness vereinfachen |
| `apps/caisty-site/src/lib/posHub/types.ts` | `PosSummaryView` o.ä. |
| `apps/caisty-site/src/lib/translations/portal/{en,de,fr,ar}.ts` | Neue Summary/Checklist/Footer Keys |
| `apps/caisty-site/src/index.css` | `.pos-summary-bar`, kompaktere Abstände |

**Wiederverwendung (nicht duplizieren):**
- `openDesktopPos.ts` (Devices) — gleiche Desktop-Launch-Logik
- `getPosReleaseConfig()` — weiterhin Single Source für Version/Download

**Nicht löschen (nur aus Rendering nehmen):**
- `PosHubKpiRow`, `PosHubDevices`, `PosHubSystemStatus`, `PosHubComingSoon` Komponenten

---

## Build- & Teststatus (Analyse-Lauf)

| Check | Status | Anmerkung |
|-------|--------|-----------|
| Code-Änderungen | **Keine** | Read-only Analyse |
| `npm run build` | **Nicht ausgeführt** | Laut Auftrag nicht erforderlich |
| `npm test` | **Nicht ausgeführt** | Keine Code-Änderungen |
| Vorheriger Projektstand | 52/52 Tests grün (Sprint 1.9/1.10) | Referenz |

---

## Manuelle Test-Checkliste (für Sprint 1.11 Umsetzung)

### Routen & Navigation

- [ ] `/portal/pos` lädt ohne Fehler
- [ ] Sidebar: POS-Gruppe, Active State auf POS
- [ ] Footer-Links: Devices, Licenses, Support, Install

### Hauptaktionen

- [ ] „Open Desktop POS“ startet Protocol (`caisty://open`)
- [ ] Fallback-Hinweis wenn Desktop nicht installiert (nach Timeout)
- [ ] Mobile: Hinweis Windows-only / Download
- [ ] Download Installer lädt korrekte `.exe` (Version aus URL)

### Version & Updates

- [ ] Installed vs Latest korrekt (mit/ohne Geräte)
- [ ] „Update available“ wenn `installed < latest`
- [ ] Release Notes Link (wenn env gesetzt)

### Kompakte Statuszeile

- [ ] Device-Count / Online stimmt
- [ ] Link zu `/portal/devices` funktioniert

### Entfernte Bereiche (dürfen nicht mehr sichtbar sein)

- [ ] Keine 6 KPI-Karten
- [ ] Kein Device-Grid
- [ ] Kein System Status (Environment, Portal)
- [ ] Kein Coming Soon Grid

### Redundanz-Check

- [ ] Keine doppelte Download-Schaltfläche
- [ ] License Plan nicht 3× auf einer Seite

### Cross-Portal

- [ ] Dashboard Alerts weiterhin funktional (derivePosHubState unangetastet oder bewusst angepasst)
- [ ] Devices-Seite unverändert in Kernfunktion
- [ ] DE / FR / AR Übersetzungen vollständig

### Responsive

- [ ] Desktop: möglichst ohne Scrollen (Normalfall)
- [ ] Mobile: Main Actions stapeln sauber
- [ ] Sidebar Mobile unverändert funktional

---

## Anhang: Technische Referenz

### Seitenkomposition (aktuell)

```tsx
// PortalPosPage.tsx — Reihenfolge
PosHubHeader
PosHubNotifications      // bedingt
PosHubKpiRow               // 6 KPIs
PosHubActionPanel          // 3 Karten
PosHubReadinessPanel       // Ring + 6 Items
PosHubDevices              // bis 8 Cards
PosHubReleaseCenter
PosHubSystemStatus
PosHubComingSoon           // 6 Items
```

### Daten-Hook (`usePortalPosHubData`)

Parallel-Fetch: `licenses`, `devices`, `invoices`, `business`  
`lastSyncedAt`: Zeitpunkt des **letzten erfolgreichen Portal-Loads**, nicht POS-Sync.

### Release-Konfiguration (`getPosReleaseConfig`)

Build-time Env: `VITE_POS_WINDOWS_URL`, `VITE_POS_LATEST_VERSION`, `VITE_POS_WEB_ENABLED`, …  
Kommentar im Code: *Future: replace with GET /portal/pos/release API* — Phase 2 Kandidat.

---

*Ende der Analyse — Sprint 1.11 Read Only*
