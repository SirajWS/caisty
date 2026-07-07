# Analyse: Devices-Seite — Customer Portal Cleanup (Sprint 1.7)

**Stand:** 2026-07-07  
**Branch:** `staging`  
**Scope:** Nur `/portal/devices` — read-only Code- und UX-Analyse  
**Methode:** Review von `PortalDevicesPage`, Device-Komponenten, `deriveDevicesState`, Datenquellen (`usePortalDevicesData` / `usePortalPosHubData`), API (`GET /portal/devices`, `GET /portal/licenses`), Abgleich mit Dashboard, POS Hub, Licenses, Install, Cross-Portal-Audit  
**Wichtig:** Dieses Dokument ist **nur Analyse**. Keine Code-, UI- oder API-Änderungen.

---

## Executive Summary

Die Devices-Seite wurde als **„Device Monitoring Center“** (Sprint 6) aufgebaut. Subtitle und Struktur beantworten primär:

> **„Wie gesund ist mein POS — online, offline, Alerts, Health, Version?“**

Das **Zielbild für Sprint 1.7** ist dagegen:

> **„Welche POS-Geräte gehören meinem Unternehmen — wie viele darf ich nutzen, welche sind registriert, welche Slots sind frei?“**

**Kernbefund:** Die Seite ist **funktional reich**, aber **informationsarchitektonisch falsch ausgerichtet**. Bei Pro (3 Geräte) sieht der Kunde heute **keine Slot-Übersicht** (z. B. „2 von 3 belegt“), sondern 6 Monitoring-KPIs, eine überladene Device-Card mit 9 Metadaten-Zeilen (davon `currentUser` immer Platzhalter), Alerts, 8-Zeilen-Health (7× Unknown), Timeline, 6× Coming-soon Remote Actions, Version Management und Multi-Store-Roadmap.

**Datenlage:** `maxDevices` ist über die **bereits geladene Lizenz** verfügbar (`usePortalDevicesData` lädt `licenses` + `devices`). **Freie Slots** können clientseitig approximiert werden (`maxDevices − devices.length`). **Gerät entfernen / umbenennen** gibt es im Kundenportal **nicht** — nur Admin-API.

**Empfehlung Sprint 1.7:** Struktureller **Fokus-Shift** (kein Redesign-Branding), aber deutliche **IA-Umstellung**: eine **Device-Management-Container-Karte** mit Slot-Grid (registriert + frei), kompakte Geräte-Cards, verbesserter Empty Hero — Monitoring-Sektionen **entfernen oder in Drawer/secondary** verschieben.

---

## 1. Aktuelle Informationsarchitektur

### Sektionen in `PortalDevicesPage.tsx` (Reihenfolge)

| # | Sektion | Komponente | Immer sichtbar? |
|---|---------|------------|-----------------|
| 1 | Header | Inline | Ja |
| 2 | KPI Overview | `DeviceOverview` (6 KPIs) | Ja |
| 3 | Live devices **oder** Empty Hero | `DeviceGrid` / `DeviceEmptyState` | Bedingt |
| 4 | Alerts | `DeviceAlerts` | **Ja** (auch ohne Geräte) |
| 5 | Device Health | `DeviceHealth` | Ja |
| 6 | Recent Events | `DeviceTimeline` | Ja |
| 7 | Remote Actions | `RemoteActions` | Ja |
| 8 | Version Management | `VersionManagement` | Ja |
| 9 | Multi-Store Overview | `DeviceMultiStorePlaceholder` | Ja (Coming soon) |
| 10 | Device Details | `DeviceDetailsDrawer` | Bei Klick |

**Geschätzte Höhe (mit 1–3 Geräten):** ~1.800–2.400 px — **mehrfaches Scrollen** auf Desktop.

### Notwendigkeit vs. Zielbild

| Sektion | Für Device **Management**? | Für **Monitoring**? | Gehört woanders hin? |
|---------|---------------------------|---------------------|----------------------|
| KPI Overview (6) | Nein — zeigt nicht „3 Slots Pro“ | Ja | Dashboard (1–2 KPIs + Link) |
| Device Grid | **Ja** (Kern) | Teilweise | — |
| Empty Hero | **Ja** (erweitern) | — | Install-Seite (Download) |
| Alerts | Sekundär | Ja | Dashboard Alerts |
| Device Health (8 Zeilen, 7× Unknown) | Nein | Platzhalter | POS / später Hardware-API |
| Timeline | Sekundär | Ja | Drawer / Dashboard Activity |
| Remote Actions (6× CS) | Nein | Roadmap | **Caisty POS** / Admin |
| Version Management | Nein (sekundär) | Ja | **POS Hub** (Release Center) |
| Multi-Store | Nein | Roadmap | Eigene Seite / später |
| Details Drawer | **Ja** (Details) | Ja | — |

### Was gehört in Admin oder POS?

| Inhalt | Richtige Heimat |
|--------|-----------------|
| Restart POS, Lock, Shutdown, Download logs | **Admin / Remote Support** (Coming soon) |
| Printer, Cash drawer, Scanner Health | **POS Hardware** / später Device Telemetry |
| Release notes, Installer download | **Caisty POS** (Release Center) |
| Fiscal inactive Alert | **Business** (Setup) + Dashboard (1 Alert) |
| Device DELETE | **Cloud Admin** (`DELETE /admin/devices/:deviceId`) — nicht Kundenportal |

---

## 2. Device Cards — Container-Karte mit Slots

### Ist-Zustand

- `DeviceGrid` rendert **nur registrierte** Geräte aus `data.devices`.
- Keine Darstellung von **freien Slots**.
- Pro Gerät: `DeviceCard` mit **9 Metadaten-Zeilen** (Platform, Version, Current user, Heartbeat, Connection, Cloud, Environment, License, Store).
- `currentUser` ist **immer** `waitingSync` — reiner Platzhalter.

### Bewertung: Große Container-Karte „Device Management“

**Ja — sehr sinnvoll** für das Zielbild, besonders Pro (3 Geräte).

```
Device Management                    Pro · 2 of 3 seats used
┌──────────────────────────────────────────────────────────┐
│  [Till 1 · Online]    [Till 2 · Offline]    [ + Add ]    │
│   Berlin               Munich                Free slot    │
└──────────────────────────────────────────────────────────┘
```

| Aspekt | Bewertung |
|--------|-----------|
| Slot-Grid statt nur registrierte Cards | **Kern-UX für SaaS Seat-Modell** |
| Immer `maxDevices` Slots zeigen | Pro: 3 feste Plätze — sofort verständlich |
| Freier Slot als eigene Card | **Ja** — „+ Add device“ / „Waiting for activation“ |
| Eine Container-Karte | **Ja** — reduziert visuelles Rauschen vs. 8 lose Panels |

**Nicht:** Jede Metadaten-Zeile auf der Card — für Management reichen Name, Status, letzter Heartbeat; Rest in Drawer.

---

## 3. License Integration

### Welche Daten sind heute verfügbar?

| Datenpunkt | Quelle | Im Devices-UI genutzt? |
|------------|--------|------------------------|
| `licenses[]` | `fetchPortalLicenses()` via `usePortalDevicesData` | **Geladen, nicht angezeigt** |
| `license.maxDevices` | `PortalLicense` | **Nein** auf Devices-Seite |
| `devices[]` | `fetchPortalDevices()` | Ja (Grid) |
| `devices.length` | Client | Indirekt (KPI „Total“) |
| Primary License | `pickPrimaryPortalLicense(licenses)` | **Nicht verwendet** auf Devices-Page |

### Kann die Seite heute Slots berechnen?

**Ja — clientseitig, ohne API-Änderung (Display):**

```text
primaryLicense = pickPrimaryPortalLicense(licenses)
maxDevices     = primaryLicense?.maxDevices ?? 0   // Pro: 3, Starter: 1, Trial: 1
usedDevices    = devices.length                    // Näherung
freeSlots      = max(0, maxDevices - usedDevices)
```

**Einschränkungen:**

| Problem | Detail |
|---------|--------|
| `usedDevices` pro Lizenz | Backend `portal.ts` berechnet `usedDevices` — **aktive Route** `portal-licenses.ts` liefert das **nicht** |
| Mehrere Lizenzen | Slot-Limit sollte von **aktiver Primary License** kommen, nicht Summe aller Lizenzen |
| Abgelaufene Lizenz | `maxDevices` bei `status: expired` — UI muss Plan-Status berücksichtigen |
| Geräte ohne `licenseKey` | Zählen trotzdem in `devices.length` — kann Slots „füller“ wirken lassen |

### Empfohlene API-Erweiterung (später, für präzise Slots)

| Endpoint / Feld | Nutzen |
|-----------------|--------|
| `GET /portal/devices/summary` oder erweitertes `GET /portal/licenses` mit `usedDevices` | Exakte Seats pro Lizenz (wie in `portal.ts` Legacy) |
| `devices.remaining` aus `POST /licenses/verify` | Bereits in `docs/api-handshake.md` spezifiziert — für Install-Flow |

**Für Sprint 1.7 UI:** Client-Berechnung aus `pickPrimaryPortalLicense` + `devices.length` **ausreichend** für Slot-Anzeige.

---

## 4. Device Slot Konzept

### Bewertung des vorgeschlagenen UX-Modells

| Slot-Zustand | UI | Datenbasis heute | Umsetzbar Sprint 1.7? |
|--------------|-----|------------------|------------------------|
| **Registriertes Gerät** | Normale Device Card (kompakt) | `devices[]` | **Ja** |
| **Freier Slot** | „+ Add device“ | `maxDevices − used` | **Ja** (UI only) |
| **Nicht verbunden** | „Waiting for activation“ auf registriertem Gerät ohne Heartbeat | `status: never_seen` / kein `lastSeenAt` | **Ja** |
| **Gerät entfernt** | Slot wird wieder frei | Braucht **Release-API** | **Nein** (nur Admin DELETE) |

### Pro Plan (3 Slots) — Beispielszenarien

| Szenario | Slots |
|----------|-------|
| 0 Geräte, Pro aktiv | 3× Empty „Add device“ |
| 1 Gerät online, Pro | 1× Device Card + 2× Empty |
| 3 Geräte, Pro voll | 3× Device Cards, kein Empty |
| Starter (1 Slot) | 1 Slot total — Grid passt sich an `maxDevices` an |

**Fazit:** Slot-Konzept ist **UX-korrekt und priorisiert** — passt zu Caistys Lizenzmodell (`finalizePaidLicenseAfterPayment`: Starter=1, Pro=3).

---

## 5. Device Aktionen (nur Analyse)

### Welche Aktionen gehören auf die Device Card?

| Aktion | Auf Card? | Begründung | API heute |
|--------|-----------|------------|-----------|
| **Add device** (freier Slot) | **Ja** | Kern-Management | Link → `/portal/install` |
| **Open POS** | Sekundär (Icon) | Nützlich | Desktop-Protocol (existiert) |
| **View details** | **Ja** (Klick auf Card) | Drawer existiert | — |
| **Rename** | Card-Menü | Management | **Keine Kunden-API** |
| **Release device** | Card-Menü | Management | **Nur Admin DELETE** |
| Heartbeat / Version | **Drawer**, nicht Card | Monitoring-Detail | `lastSeenAt`, `appVersion` |
| License | Drawer oder Slot-Header | 1× pro Account | `licenseKey` auf Device |
| Last Sync | Drawer | Monitoring | `lastSeenAt` |

### Remote Actions (aktuell auf Page)

| Action | Status |
|--------|--------|
| Open Desktop POS | Funktioniert |
| Restart POS, Restart sync, Download logs, Restart device, Lock, Shutdown | **Coming soon** (6×) |

→ **Nicht auf Management-Card** — gehört zu POS Hub oder entfernt bis API da ist.

---

## 6. Welche Bereiche können verschwinden?

| Bereich | Entfernen / Reduzieren? | Begründung |
|---------|-------------------------|------------|
| **KPI-Leiste (6)** | **Ja** → 1 Zeile „2 of 3 devices · Pro“ | Redundant zu Slot-Grid; Monitoring-Dashboard |
| **Device Health (8 Zeilen)** | **Ja** (Page) → optional 1 Zeile im Drawer | 7/8 immer „Unknown“ — Platzhalter |
| **Recent Events / Timeline** | **Ja** (Page) → Drawer wenn Gerät gewählt | Erzeugt Scroll; wenig echte Events (max. 2 pro Gerät) |
| **Remote Actions** | **Ja** (Page) | 6× Coming soon; Duplikat POS Hub / Dashboard |
| **Version Management** | **Ja** (Page) → Link POS Hub | Duplikat Release Center |
| **Multi Store Overview** | **Ja** | 3× Placeholder + Coming soon Badge |
| **Alerts** | **Reduzieren** → max. 3 kompakt unter Management | Fiscal/Offline wichtig, aber nicht eigene große Sektion |
| **Device Grid** | **Behalten** — umbauen zu Slot-Grid | Kern |
| **Empty Hero** | **Behalten** — erweitern | Siehe §7 |
| **Details Drawer** | **Behalten** | Details + Monitoring secondary |

### Scroll-Einsparung (geschätzt)

| Entfernen | ~px gespart |
|-----------|-------------|
| KPI 6er | ~140 |
| Alerts Panel | ~120 |
| Health + Timeline Split | ~280 |
| Remote Actions | ~100 |
| Version Management | ~180 |
| Multi-Store | ~160 |
| **Summe** | **~980 px** |

Ziel nach Cleanup: **~700–900 px** mit Slot-Grid — vergleichbar Business/Licenses nach Cleanup.

---

## 7. Empty State

### Ist-Zustand (`DeviceEmptyState`)

- Headline: „No POS devices connected“
- Description: „Connect your first Caisty POS device to begin live monitoring.“
- **Ein CTA:** „Open Desktop POS“ (Desktop-Protocol)
- Copy fokussiert **Monitoring**, nicht **Management / Setup**

### Fehlende Orientierung

| Frage des Kunden | Beantwortet? |
|------------------|--------------|
| Wie viele Geräte darf ich? | **Nein** |
| Wie füge ich ein Gerät hinzu? | **Teilweise** (nur Open POS) |
| Wo lade ich den Installer? | **Nein** (Install-Seite) |
| Welchen License Key nutze ich? | **Nein** (Licenses-Seite) |

### Empfohlener Empty Hero (Ziel)

```
No POS device connected yet

Your Pro plan includes 3 device seats.
Install Caisty POS and activate with your license key.

[ Download Desktop POS ]   [ View license key ]
[ Open POS on this PC ]
```

**Bewertung:** Großer Hero **sinnvoll** — analog Orders/Reports/Licenses, aber mit **Management-CTAs** (Install, Licenses), nicht nur Monitoring.

---

## 8. Monitoring — Hauptaufgabe der Seite?

### Ist-Zustand

Subtitle: *„Monitor every POS device from anywhere — live status, health, and version control.“*

→ Monitoring **ist** die explizite Hauptaufgabe.

### Empfehlung

| Phase | Monitoring auf Devices-Seite |
|-------|------------------------------|
| **Kein Gerät** | **Nein** — nur Setup/Slots/Install |
| **Geräte vorhanden** | **Sekundär** — Status-Badge auf Card, Details im Drawer |
| **Dashboard** | Aggregierte KPIs (z. B. „2 online“) + Link Devices |
| **POS Hub** | Release, Remote, System Status |

**Monitoring sollte nicht verschwinden**, aber **nicht die Page dominieren**. Erst ab ≥1 Gerät, und dann kompakt.

---

## 9. Enterprise SaaS Vergleich

| Produkt | Device Management Pattern | Caisty Ist | Caisty Ziel |
|---------|---------------------------|------------|-------------|
| **Stripe Terminal** | Reader-Liste, Register, Assign location, Remove | Kein Register/Remove im Portal | Slot + Add flow |
| **Shopify POS** | Locations + POS devices pro Standort | Kein Location-Konzept | Später Multi-Store |
| **Square** | Device codes, Pair device, Deactivate | Bind via License Key (POS) | Install + Key + Slot UI |
| **GitHub** | — | — | — |
| **Linear** | — | — | — |

**Gemeinsames Muster:** **Seat/Slot-Modell sichtbar** → Liste registrierter Geräte → **klarer Add-Flow** → Remove/Deactivate als Card-Aktion.

Caisty hat Backend-Seat-Limit (`max_devices_reached` bei bind) — die **UI zeigt das dem Kunden nicht**.

---

## 10. Single Purpose

### Aktuelle Kernfrage

> **„Wie gesund ist mein POS?“**

Indizien: 6 Health/Monitoring KPIs, Health-Grid mit Peripherie, Alerts, Timeline, „live monitoring“ in Empty Copy.

### Ziel-Kernfrage

> **„Welche POS-Geräte gehören meinem Unternehmen?“**

Mit Unterfragen:

1. Wie viele darf ich? (`maxDevices`)
2. Welche sind registriert? (`devices[]`)
3. Welche Slots sind frei?
4. Wie füge ich hinzu? (Install + License Key)
5. Wie entferne ich? (später — API fehlt)

**Bewertung:** Der **Single-Purpose-Shift ist notwendig** und konsistent mit dem Cleanup anderer Portal-Seiten (Dashboard, Orders, Business, Account, Licenses).

---

## Positive Aspekte

1. **Echte Gerätedaten** — `GET /portal/devices`, Heartbeat-basierter Online-Status.
2. **Licenses werden bereits mitgeladen** — Slot-Berechnung ohne neuen Fetch möglich.
3. **Device Grid + Drawer** — gute Basis für Management + Details.
4. **Empty Hero existiert** — muss nur management-orientiert erweitert werden.
5. **`deriveDevicesState`** — testbar, klare Trennung State/UI.
6. **Responsive Grid** — 1/2/3 Spalten — passt zu Pro-3-Slots.
7. **Keine Dummy-Geräte** — nur echte `devices[]`.

---

## Problemliste nach Priorität

### HIGH

| # | Problem | Auswirkung |
|---|---------|------------|
| H1 | **Keine Slot-/Seat-Anzeige** (max/used/free) | Pro-Kunden sehen nicht „3 Geräte“ |
| H2 | Seite ist **Monitoring Center**, nicht Management | Falsche Kernfrage |
| H3 | **6 KPIs** ohne Seat-Bezug | Scroll + Redundanz |
| H4 | **Multi-Store + 6× Remote CS** auf Page | Wirkt unfertig, unnötiger Scroll |
| H5 | **Release device / Rename** nicht im Kundenportal | „Gerät entfernen“ nicht möglich (nur Admin) |
| H6 | Empty State **monitoring-fokussiert**, kein Install/License CTA | Schlechtes Onboarding |

### MEDIUM

| # | Problem | Auswirkung |
|---|---------|------------|
| M1 | Device Card **9 Zeilen**, `currentUser` immer Platzhalter | Überladen, unprofessionell |
| M2 | Device Health **7× Unknown** | Sinnlose Fläche |
| M3 | Version Management **dupliziert POS Hub** | Redundanz |
| M4 | Alerts + Timeline **immer sichtbar** | Scroll auch bei 1 Gerät |
| M5 | `usedDevices` nicht in aktiver Licenses-API | Ungenauer Slot-Count bei Edge Cases |
| M6 | Subtitle/Copy technisch („monitor“, „heartbeat“) | Nicht Management-Sprache |

### LOW

| # | Problem | Auswirkung |
|---|---------|------------|
| L1 | Fiscal Alert auf Devices | Gehört eher Business/Dashboard |
| L2 | Environment auf jeder Card | Infrastruktur-Detail |
| L3 | `tableFootnote` in i18n ungenutzt | Tech Debt |
| L4 | Drawer `architecture` = waitingSync | Platzhalter |

---

## UX-Bewertung (Ist-Zustand)

| Kriterium | Note (1–5) | Kommentar |
|-----------|------------|-----------|
| **Management-Klarheit** | 2/5 | Keine Slots, kein Add-Flow, kein Remove |
| **Monitoring** | 4/5 | Viel Status — aber zu dominant |
| **Kompaktheit** | 2/5 | ~9 Sektionen, starkes Scrollen |
| **Professionalität** | 3/5 | Design ok, viele CS/Unknown |
| **Pro-Plan-Tauglichkeit** | 2/5 | „3 Geräte“ nirgends sichtbar |
| **Daten-Ehrlichkeit** | 4/5 | Keine Fake-Geräte; Platzhalter bei Health/User |
| **Konsistenz mit Portal** | 2/5 | Andere Seiten nach Cleanup kompakter |

---

## Redundanzen (Cross-Page)

| Information | Devices | Auch auf |
|-------------|---------|----------|
| Online/Offline Count | KPI | Dashboard KPI, POS Hub |
| Last sync | KPI | Dashboard, Business (entfernt), Orders |
| POS Version | KPI + Version Mgmt | Dashboard, POS Hub Release |
| Connected devices list | Grid | Dashboard Widget, POS Hub |
| Remote Open POS | Remote Actions | Dashboard (entfernt), POS Hub |
| Release / Download | Version Mgmt | POS Hub, Install |
| License / Plan seats | Card field (nicht Slot) | Licenses, Billing, POS Hub |
| Fiscal inactive | Alert | Business, Dashboard |

Nach Dashboard/Business-Cleanup ist **Devices die größte verbleibende Monitoring-Duplikat-Quelle**.

---

## Empfohlenes Zielbild

### Kernfrage

> **„Welche POS-Geräte sind meinem Konto zugeordnet — und habe ich noch freie Plätze?“**

### Kompakte Seitenstruktur (Sprint 1.7)

```
Devices
Manage POS terminals registered to your account.

[ Pro plan · 2 of 3 device seats used ]     ← kompakte Zeile statt 6 KPIs

┌─ Device management ─────────────────────────────────────┐
│  [Device 1]      [Device 2]      [ + Add device ]       │
│  Online          Offline         Free slot              │
└─────────────────────────────────────────────────────────┘

[ Optional: max 2–3 compact alerts — offline, update available ]

Footer: Install POS · Licenses · Support

[ Drawer: Details, heartbeat, version, license — on card click ]
```

**Ohne Geräte:**

```
Empty Hero
- Plan seats info (e.g. "3 devices included")
- Download POS · View license · Open POS
```

**Monitoring** nur im Drawer oder als Status-Badge auf der Card — **nicht** als 6 separate Page-Sektionen.

---

## Empfohlene Seitenstruktur (Detail)

| Block | Behalten | Neu | Entfernen von Page |
|-------|----------|-----|-------------------|
| Header | ✓ (Subtitle ändern) | | |
| Seat summary line | | ✓ `DeviceSeatSummary` | KPI Grid |
| Device management container | | ✓ `DeviceManagement` | lose `DeviceGrid` |
| Slot grid | | ✓ `DeviceSlot` + `EmptySlotCard` | — |
| Device card (kompakt) | ✓ refactored | | 9-Zeilen-Meta |
| Alerts | | max 3 inline | `DeviceAlerts` Panel |
| Empty hero | ✓ erweitert | CTAs Install/License | |
| Health, Timeline, Remote, Version, Multi-Store | | | **Alle** |
| Details drawer | ✓ | + Monitoring fields | |

---

## Empfohlene neue Komponenten (Sprint 1.7)

| Komponente | Rolle |
|------------|-------|
| `DeviceSeatSummary` | „2 of 3 seats · Pro“ — eine Zeile |
| `DeviceManagement` | Container-Karte mit Titel + Slot-Grid |
| `DeviceSlotGrid` | Rendert `maxDevices` Slots |
| `DeviceCard` (kompakt) | Name, Status, letzter Kontakt; Klick → Drawer |
| `EmptySlotCard` | „+ Add device“ → `/portal/install` |
| `DevicesEmptyState` (erweitert) | Seats + Download + License CTAs |
| `DeviceFooter` | Install · Licenses · Support |
| `deriveDeviceSlots` in `deriveDevicesState` | Slots: registered / empty / pending |

**Optional später (API nötig):**

| Komponente | Rolle |
|------------|-------|
| `ReleaseDeviceDialog` | Kunden-Release — braucht `DELETE /portal/devices/:id` |
| `RenameDeviceInline` | braucht `PATCH /portal/devices/:id` |

---

## Betroffene Dateien (bei Sprint 1.7)

### Direkt ändern

| Datei |
|-------|
| `src/routes/PortalDevicesPage.tsx` |
| `src/lib/devices/deriveDevicesState.ts` |
| `src/lib/devices/types.ts` |
| `src/lib/devices/deriveDevicesState.test.ts` |
| `src/components/devices/DeviceCard.tsx` |
| `src/components/devices/DeviceGrid.tsx` → evtl. `DeviceManagement.tsx` |
| `src/components/devices/DeviceEmptyState.tsx` |
| `src/lib/translations/portal/en.ts` (+ de, fr, ar) |
| `src/index.css` (`.devices-*` — Slot-Styles) |

### Von Page entfernen (Dateien dürfen bleiben)

| Datei |
|-------|
| `DeviceOverview.tsx` |
| `DeviceAlerts.tsx` |
| `DeviceHealth.tsx` |
| `DeviceTimeline.tsx` |
| `RemoteActions.tsx` |
| `VersionManagement.tsx` |
| `DeviceMultiStorePlaceholder.tsx` |

### Unverändert (kurzfristig)

| Datei | Grund |
|-------|-------|
| `usePortalDevicesData.ts` | Lädt bereits licenses + devices |
| `portalApi.ts` | Kein API-Change in Sprint 1.7 UI-only |
| `DeviceDetailsDrawer.tsx` | Behalten für Details |

### API später (nicht Sprint 1.7 UI-only)

| API | Zweck |
|-----|-------|
| `PATCH /portal/devices/:id` | Rename |
| `DELETE /portal/devices/:id` | Release device (Kunde) |
| `usedDevices` auf `GET /portal/licenses` | Präzise Slot-Zählung |

---

## Empfohlene Sprint-1.7-Aufgaben

| # | Task | Aufwand |
|---|------|---------|
| 1 | Subtitle + Copy auf Management umstellen | Gering |
| 2 | `deriveDeviceSlots` — max/used/free aus license + devices | Mittel |
| 3 | `DeviceSeatSummary` — 1 Zeile statt 6 KPIs | Gering |
| 4 | `DeviceManagement` Container + Slot-Grid | Mittel |
| 5 | `EmptySlotCard` mit Link Install | Gering |
| 6 | `DeviceCard` kompakt (Name, Status, Heartbeat) | Mittel |
| 7 | Empty Hero erweitern (Download, License, Open POS) | Gering |
| 8 | KPI, Health, Timeline, Remote, Version, Multi-Store von Page entfernen | Gering |
| 9 | Alerts → max 3 kompakt oder in Drawer | Gering |
| 10 | `DeviceFooter` — Install · Licenses · Support | Gering |
| 11 | Übersetzungen EN/DE/FR/AR | Gering |
| 12 | Tests `deriveDeviceSlots` | Gering |
| 13 | Build + manuelle Tests | Gering |

**Nicht in Sprint 1.7 (ohne API):** Release device, Rename, echte Peripheral-Health.

---

## Manuelle Test-Checkliste

### Baseline (Ist)

- [ ] `/portal/devices` — 6 KPIs oben
- [ ] Mit Geräten: Grid mit 9 Metadaten-Zeilen pro Card
- [ ] Ohne Geräte: Empty Hero nur „Open Desktop POS“
- [ ] Alerts, Health (7× Unknown), Timeline immer sichtbar
- [ ] Remote: 1 aktiv, 6 Coming soon
- [ ] Version Management + Multi-Store sichtbar
- [ ] Keine Anzeige „X of Y devices“
- [ ] Drawer öffnet bei Card-Klick

### Ziel (nach Sprint 1.7)

- [ ] Seat-Zeile: „2 of 3 · Pro“ (bei Pro + 2 Geräten)
- [ ] Slot-Grid zeigt freie Plätze als „+ Add device“
- [ ] Kompakte Device Cards
- [ ] Empty Hero: Install + License + Open POS
- [ ] Keine KPI-Leiste, Health, Timeline, Remote, Version, Multi-Store auf Page
- [ ] Monitoring nur im Drawer / Status-Badge
- [ ] Footer-Links Install · Licenses · Support
- [ ] Pro: immer 3 Slots sichtbar (wenn aktive Pro-Lizenz)

---

## Schlussbewertung

Die Devices-Seite ist **technisch solide**, aber **produktseitig falsch priorisiert**. Sie wiederholt das Muster von Business/Account **vor** dem Cleanup: viele Monitoring-Sektionen, Coming-soon-Blöcke und Platzhalter — während die **zentrale Kundenfrage bei Pro (3 Geräte)** unbeantwortet bleibt.

**Sprint 1.7 sollte ein Fokus-Shift sein** (Management + Slots), **kein visuelles Redesign**. Das Slot-Grid-Konzept ist **UX-korrekt**, mit vorhandenen Daten **größtenteils umsetzbar**, und bringt die Seite auf das Niveau der bereinigten Portal-Seiten.

---

*Ende der Analyse — keine Codeänderungen vorgenommen.*
