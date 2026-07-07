# Analyse: Kundenportal Cleanup & POS-Sync

**Stand:** 2026-07-07  
**Branch/Scope:** `staging` / local — Caisty Repo, Kundenportal (`apps/caisty-site`)  
**Methode:** Code- und IA-Review aller Portal-Seiten + Abgleich mit `cloud-api`  
**Wichtig:** Dieses Dokument ist **nur Analyse**. Keine Code-, UI- oder Routing-Änderungen.

---

## Executive Summary

Das Kundenportal wurde in mehreren Sprints zu einem modularen **„Operations Center“-Muster** umgebaut (KPI-Streifen + Panels + Quick Actions). Das Design-System ist konsistent und wirkt SaaS-orientiert.

Das Hauptproblem ist **nicht fehlendes Polish**, sondern **überlappende Verantwortlichkeiten**:

- Dieselben Konzepte (POS-Status, Cloud, Sync, Lizenz, Fiscal, Release, Remote Actions) erscheinen auf **3–6 Seiten**.
- **Orders** und **Reports** zeigen identische Platzhalter-KPIs, obwohl **keine Sales-API** existiert.
- **`hasPosSync`** bedeutet nur: mindestens ein Gerät hat `lastSeenAt` — **nicht**, dass Umsatz/Bestellungen synchronisiert sind.
- Die POS Desktop App sendet heute nur **Heartbeat + Bind** — keine Verkaufs-, Beleg- oder Hardware-Daten.

**Empfehlung:** Cleanup-Sprint = IA vereinfachen (jede Information **eine** Hauptseite). Sync-Sprint = Cloud-API + POS Desktop erweitern, **danach** KPIs auf Orders/Reports/Dashboard befüllen.

---

## 1. Doppelte Informationen — Übersichtstabelle

| Information | Erscheint aktuell auf | Hauptseite (behalten) | Entfernen / kürzen auf |
|-------------|----------------------|------------------------|-------------------------|
| **Today revenue / Orders today / Receipts today** | Dashboard, Orders, Reports | Dashboard (Live-KPI, sobald Sync da) | Orders: nur Tagesdetail; Reports: nur Analyse-Zeitraum — **bis Sync: alle drei kürzen** |
| **POS online/offline / Geräte online** | Dashboard KPI, Dashboard Store Status, Devices KPI+Grid, Business Cloud, Support System Status, POS Hub KPI | **Devices** (Detail), Dashboard (1 KPI + Link) | Business Cloud-Panel, Support, POS Hub KPI-Duplikat |
| **Last synchronization** | Dashboard KPI, Business Cloud, Devices KPI, Orders-Timeline, POS Hub System Status, Support (indirekt) | **Devices** (letzter Device-Heartbeat) | Dashboard: nur Kurzlabel; **nicht** Portal-Fetch-Zeit als „POS-Sync“ verkaufen |
| **License key / Plan / Status** | Billing KPI + Subscription, Licenses-Tabelle, Business Checklist, Support KPI, Dashboard Snapshot, POS Hub KPI | **Plans & Billing** (Plan + Abo), **Licenses** oder Billing-Abschnitt (Keys) | Support KPI, Dashboard Snapshot (nur Link), POS Hub (Plan-Badge reicht) |
| **Billing interval / Provider (Stripe)** | Plans & Billing | **Plans & Billing** | Support System Status „Billing“, Dashboard |
| **Fiscal status / Provider** | Business Fiscal + Checklist, Dashboard Store Status, Devices Alerts, Support System Status, Reports Taxes | **Business** (Konfiguration), Reports (nur **Auswertung** wenn Sync da) | Dashboard Store Status (1 Zeile), Support |
| **Business profile incomplete** | Dashboard Alerts, Business Completion Checklist | **Business** (Checklist), Dashboard (1 Alert + Link) | — |
| **Completion / Readiness checklist** | Business (8 Items), Dashboard `health` (abgeleitet, **nicht gerendert**), POS Hub Readiness (5 Items), Account Security Checklist | Business = Setup; POS Hub = POS-Readiness; Account = Security | Dashboard: nicht zusätzlich einführen; POS Hub ≠ Business-Checklist duplizieren |
| **Connected devices (Liste)** | Dashboard Widget, Devices Grid, POS Hub Devices, Business Cloud „POS connected“ | **Devices** (voll), POS Hub (max. 8 Kurz), Dashboard (0–3 + „Alle anzeigen“) | Business |
| **Release center / Latest POS version** | Dashboard ReleaseCenter, Devices VersionManagement, POS Hub ReleaseCenter | **Caisty POS** (Release Center) | Dashboard, Devices (nur „Update verfügbar“-Badge + Link) |
| **Installed POS version** | Dashboard KPI-Hint, Devices KPI, POS Hub KPI, Device Cards | **Caisty POS** + **Devices** (pro Gerät) | Dashboard KPI-Hint |
| **Remote actions** (Open POS, Restart, Sync, Logs, Lock) | Dashboard RemoteControl, Devices RemoteActions, POS Hub ActionPanel | **Devices** (Remote), **Caisty POS** (Open + Download) | Dashboard RemoteControl-Block |
| **System health** (Cloud API, Portal, Environment) | Dashboard SystemHealthPanel, POS Hub SystemStatus, Support SystemServiceStatus, Business Cloud | **Caisty POS** oder **Devices** (eine Zeile) | Dashboard Panel, Support komplette Sektion |
| **Payment overview** (Cash/Card/…) | Orders, Reports | Orders (operativ), Reports (Analyse) | **Nur eine Quelle nach Sync** — nicht beide mit identischen Platzhaltern |
| **Invoices / Rechnungen** | Plans & Billing, Dashboard Activity | **Plans & Billing** | Dashboard Activity (optional 1 letzter Eintrag) |
| **VAT / Country / Currency** | Business Profil, Plans & Billing VAT-Sektion | Business (editierbar), Billing (read-only + Link) | — |
| **Support contact / Email** | Support, Account, Billing, Layout-Topbar | **Support** (Kontakt), Account (Identität) | Redundante mailto-Buttons reduzieren |
| **Activity / Timeline** | Dashboard, Orders (BusinessTimeline), Devices (pro Gerät) | Dashboard (cross-domain), Devices (gerätespezifisch) | Orders-Timeline entfernen |
| **Open shift / Current cashier** | Dashboard Store Status, Orders KPI | **Orders** (wenn Sync da) | Dashboard Store Status |
| **Device health** (Printer, Cash drawer, Scanner, Internet, Fiscal) | Devices Health, Dashboard Store Status, POS Hub Coming Soon | **Devices** | Dashboard |
| **Employees online** | Dashboard KPI | — (Coming soon) | Überall bis Feature da |
| **Help categories** | Support | Support | — (Badges „Coming soon“ trotz funktionierender Links verwirrend) |

---

## 2. Vorschlag: Klare Seiten-Struktur (Zielbild)

### Dashboard — Live Business Center

**Verantwortung:** „Was ist heute los? Was braucht Aufmerksamkeit?“

| Behalten | Entfernen / kürzen |
|----------|-------------------|
| Today revenue, Orders today, Receipts today (wenn Sync da) | Store Status Grid (9 Zeilen) → Link Devices |
| POS status (1 KPI: z. B. „2 online“) | Connected Devices Widget → max. 3 + Link |
| Last synchronization (Device-Heartbeat, nicht Portal-Fetch) | Release Center → Link Caisty POS |
| Wichtige Alerts (max. 5) | Remote Control Panel → Link Devices |
| Kurze Aktivität (letzte 5–8 Events) | System Health Panel → 1 Zeile oder weg |
| Store Snapshot (4 Felder: Name, Plan, Land, Fiscal-Kurz) | Vollständige License-Key-Anzeige |

---

### Orders — Operative Tagesdaten

**Verantwortung:** Heutiger Betrieb — Bestellungen, Belege, Zahlungen.

| Behalten | Entfernen |
|----------|-----------|
| Live orders / Recent receipts (Tabellen) | KPI-Streifen dupliziert Dashboard → nur wenn Orders-spezifische Metriken |
| Payment overview | BusinessTimeline / Device-Events |
| Refunds, Average order, Open shift | POS-/License-/Cloud-Karten |
| Filter (wenn an API gekoppelt) | Filter ohne Wirkung (aktuell UI-only) |
| Empty State bis Sync | Disabled Export-Buttons |

---

### Reports — Analyse

**Verantwortung:** Zeiträume, Trends, Steuer-Auswertung.

| Behalten | Entfernen |
|----------|-----------|
| Revenue chart, Sales by hour | Identische KPI-Streifen wie Orders |
| Payment methods (Aggregat) | Device-/Portal-Systemdaten |
| Top products, Top employees | — |
| Taxes / Fiscal summary (Auswertung) | Fiscal-**Konfiguration** (bleibt Business) |
| Period filter (wenn API da) | Platzhalter-Exporte |

---

### Business — Single Source of Truth (Firma)

**Verantwortung:** Firmenprofil, Adresse, Steuer, Fiscal, Setup-Fortschritt.

| Behalten | Entfernen |
|----------|-----------|
| Firmenprofil (Edit Form) | POS-Version / Release Center |
| Adresse, VAT, Tax ID | Ausführliches Cloud-Monitoring |
| Fiscal configuration | Device-Grid |
| Completion checklist (8 Items) | Future Modules Grid (optional 1 Zeile) |
| Kontakt (wenn erweitert) | Account-E-Mail als „Business-Kontakt“ ohne Label |

| Cloud-Panel | Kürzen auf: „POS verbunden: Ja/Nein“ + Link **Devices** |

---

### Devices — Geräteverwaltung

**Verantwortung:** Fleet, Heartbeat, Version, Hardware-Health, Remote.

| Behalten | Entfernen |
|----------|-----------|
| Geräteliste / Grid | Billing / Rechnungen |
| Heartbeat, last seen | Business-Profil-Details |
| Installed version pro Gerät | Release Center (→ Caisty POS) |
| Health: printer, cash drawer, internet, fiscal, scanner | License-Kauf-UI |
| Remote actions | Multi-store Platzhalter bis Feature |
| Alerts (offline, update, fiscal) | — |

---

### Plans & Billing — Abo & Zahlung

**Verantwortung:** Plan, Subscription, Zahlung, Rechnungen.

| Behalten | Entfernen |
|----------|-----------|
| Aktueller Plan, Subscription, Stripe Portal | Device health / POS readiness |
| Plan-Katalog (Trial/Starter/Pro) | Billing History Platzhalter (Invoices = History) |
| Invoices-Tabelle | Payment-Method-Platzhalter (4 Zeilen) wenn Stripe Portal reicht |
| VAT read-only + „Bearbeiten in Business“ | License Key doppelt (KPI + Card) |
| Licenses-Tabelle **eingliedern** (empfohlen) | Download-Platzhalter |

---

### Caisty POS — POS-Zentrale

**Verantwortung:** Software, Version, Installer, Readiness, Desktop öffnen.

| Behalten | Entfernen |
|----------|-----------|
| Latest vs. installed version | Vollständige Geräteliste (→ Link Devices) |
| Download installer, Open Desktop POS | Duplikat System Health |
| Readiness checklist (POS-spezifisch: license, device, version, cloud) | Sales-KPIs |
| Connected devices Kurzfassung (max. 8) | Business-Profil-Editor |
| Release center | Notifications die auf Business Alerts duplizieren |

---

### Account — Nutzerkonto

**Verantwortung:** Identität, Login, Security, Preferences.

| Behalten | Entfernen |
|----------|-----------|
| Name, Email, Passwort | Business-, POS-, Billing-, License-Daten |
| Sprache, Theme | System-/Cloud-Status |
| Security checklist, Sessions, Legal | — |

**Aktueller Stand:** Account ist bereits am saubersten getrennt. ✅

---

### Licenses (optional eigenständig)

**Empfehlung:** In **Plans & Billing** als Tab „License keys“ integrieren.  
Wenn separat: nur Tabelle + Filter, **keine** Plan-KPIs (die lebt in Billing).

---

### Support

**Empfehlung:** Tickets + Kontakt + Knowledge Base.  
**System & service status** entfernen oder auf 1 Zeile + Link Devices/POS reduzieren.

---

## 3. Seiten mit zu vielen Cards & redundante Cards

### Kritisch überladen

| Seite | Anzahl sinnvoller Sektionen | Problem |
|-------|----------------------------|---------|
| **Dashboard** | 9 Panels | Funktioniert als Mini-Devices + Mini-Business + Mini-POS gleichzeitig |
| **Plans & Billing** | 9 Sektionen | KPI + Subscription + Payment + Plans + Invoices + History + VAT + Downloads + Quick Actions |
| **Support** | 9 Sektionen | Support + NOC-Monitoring + Help + Remote + KB + Contact |
| **Business** | 9 Sektionen | Angemessen für Setup-Hub, aber Cloud + Future Modules redundant |
| **Devices** | 8 Sektionen | Angemessen, aber Release + Remote auch auf Dashboard |

### Redundante Cards (konkret)

1. **Dashboard `StoreStatusWidget`** ↔ **Devices Alerts/Health** ↔ **POS Hub Notifications**
2. **Dashboard `ConnectedDevicesWidget`** ↔ **Devices `DeviceGrid`** ↔ **POS Hub `PosHubDevices`**
3. **Dashboard `ReleaseCenterWidget`** ↔ **Devices `VersionManagement`** ↔ **POS Hub `PosHubReleaseCenter`**
4. **Dashboard `RemoteControlWidget`** ↔ **Devices `RemoteActions`**
5. **Dashboard `SystemHealthPanel`** ↔ **POS Hub `PosHubSystemStatus`** ↔ **Support `SystemServiceStatus`**
6. **Orders KPI-Streifen** ↔ **Reports KPI-Streifen** ↔ **Dashboard `LiveKpiStrip`** (identische Platzhalter)
7. **Orders `PaymentOverview`** ↔ **Reports `PaymentMethods`**
8. **Billing Overview KPIs** ↔ **Billing `CurrentSubscription`** (License Key doppelt)
9. **Business `CompletionChecklist`** ↔ **POS Hub `PosHubReadinessPanel`** (überlappende Setup-Themen)
10. **Business `CloudStatus`** ↔ **Devices KPI „Last sync“**

### Cards mit null Nutzen bis Sync/API

- Orders/Reports: KPI-Streifen, Filter, Exports
- Billing: Payment Section (4× Coming soon), Billing History, Downloads
- Support: Remote prep (5 Zeilen), Response time KPI, Help category badges
- Dashboard: Revenue/Orders/Receipts KPIs

---

## 4. Sync-Stand: Portal-Erwartung vs. Realität

### Was die Cloud API heute liefert

| Endpoint | Daten |
|----------|-------|
| `GET /portal/devices` | Geräte, `lastSeenAt`, `lastHeartbeatAt`, `status`, `licenseKeys` |
| `POST /devices/heartbeat` (POS → Cloud) | Nur `{ deviceId }` — aktualisiert Timestamps |
| `POST /devices/bind` | `licenseKey`, `deviceName`, `deviceType`, `fingerprint`, optional `cloudCustomer` |
| `GET /pos/config` | Business/Fiscal/License Pull für POS — **kein** Sales |
| `GET /portal/licenses`, `/portal/business`, `/portal/invoices` | Setup & Billing |

**Nicht vorhanden:** `/portal/orders`, `/portal/receipts`, `/portal/reports`, Sales-Aggregationen.

### UI-Feld vs. Sync-Status

| UI-Feld | Portal zeigt | Tatsächliche Datenquelle | Sync-Status |
|---------|--------------|--------------------------|-------------|
| Today revenue | `—` / Waiting for POS sync | Keine API | ❌ Nicht synchronisiert |
| Orders today | `—` | Keine API | ❌ |
| Receipts today | `—` | Keine API | ❌ |
| Average order | `—` | Keine API | ❌ |
| Refunds | `—` | Keine API | ❌ |
| Live orders (Tabelle) | Leer | `orders: []` hardcoded | ❌ |
| Recent receipts | Leer | `receipts: []` hardcoded | ❌ |
| Payment overview | Waiting… | Platzhalter | ❌ |
| Revenue chart / Hourly sales | Platzhalter | Keine API | ❌ |
| Top products / employees | Leer | Keine API | ❌ |
| Tax/Fiscal **summary** (Reports) | Waiting fiscal sync | Keine Sales/Fiscal-Receipt-API | ❌ |
| Fiscal **configuration** (Business) | Echt | `business_profiles` + fiscal config | ✅ Portal → Cloud |
| Installed POS version | Oft „Waiting for app heartbeat“ | `device.appVersion` — **Feld wird von Heartbeat nicht gesetzt**; DB-Spalte fehlt | ⚠️ Erwartet, nicht befüllt |
| Latest POS version | Echt | Statische `posConfig` / Release-Config im Frontend | ✅ Config, nicht Live |
| Current user / cashier | Waiting… | Keine API | ❌ |
| Open shift | `—` / Waiting… | Keine API | ❌ |
| POS online/offline | Teilweise echt | Abgeleitet aus `lastSeenAt` / `status` | ⚠️ Nur Liveness, nicht Verkaufsstatus |
| Device health (printer, drawer, …) | Unknown / Waiting | Keine API | ❌ |
| Last synchronization (Dashboard) | Zeitstempel | **Portal-Fetch-Zeit** (`lastSyncedAt`), nicht POS | ⚠️ Irreführend benannt |
| `hasPosSync` | true wenn `lastSeenAt` existiert | Heartbeat mindestens einmal | ⚠️ Nur „Gerät war online“, nicht Sales-Sync |
| Cloud connection | Connected | Portal API erreichbar | ✅ Portal-Health, nicht POS-Cloud-Sync |
| Business profile | Echt | `GET /portal/business` | ✅ |
| License / Plan | Echt | `GET /portal/licenses`, `/portal/me` | ✅ |
| Invoices | Echt | `GET /portal/invoices` | ✅ (Billing, nicht POS) |

### Bekannte technische Lücken

1. **Frontend `PortalDevice.appVersion`** — Backend liefert Feld aktuell nicht im Heartbeat.
2. **`GET /portal/devices`** — Response-Shape (grouped fingerprint) weicht von `PortalDevice`-Typ ab; Online/Offline-Logik inkonsistent.
3. **`hasPosSync`** schaltet nur Orders-Empty-Hero frei — KPIs bleiben leer (by design in `deriveOrdersState`).
4. **Reports** nutzt `hasPosSync` in der UI **gar nicht**.

---

## 5. Was muss die POS Desktop App künftig an Cloud senden?

Gruppiert nach Domäne. Basis: heute nur Heartbeat + Bind; Portal-UI erwartet deutlich mehr.

### A) Heartbeat / Device Status

| Feld | Zweck im Portal | Priorität |
|------|-----------------|-----------|
| `deviceId` | Gerätezuordnung | ✅ existiert |
| `lastSeenAt` / heartbeat timestamp | Online, Last sync | ✅ existiert |
| `appVersion` | Installed version (Devices, POS Hub) | **Hoch** |
| `platform` (Windows/macOS) | Device cards | Mittel |
| `storeName` / `location` | Multi-store später | Niedrig |
| `online` / operational state | POS status KPI | Hoch |
| `fingerprint` | Gerätegruppierung | ✅ existiert (bind) |

### B) Sales / Orders

| Feld | Portal-Seite |
|------|--------------|
| Orders heute (count, gross) | Dashboard, Orders, Reports |
| Live orders (Liste: id, time, total, status, cashier) | Orders |
| Refunds count/amount heute | Orders, Reports |
| Average order value | Orders, Reports |
| Open orders / parked sales | Orders (optional) |

### C) Receipts

| Feld | Portal-Seite |
|------|--------------|
| Receipts heute (count) | Dashboard, Orders, Reports |
| Recent receipts (number, time, amount, payment type) | Orders |
| Receipt fiscal signature status | Reports taxes, Devices fiscal health |

### D) Payments

| Feld | Portal-Seite |
|------|--------------|
| Payment breakdown (cash, card, voucher, other) — heute | Orders Payment overview |
| Payment breakdown — Zeitraum | Reports Payment methods |
| Largest receipt | Reports trends |

### E) Fiscal / Tax

| Feld | Portal-Seite |
|------|--------------|
| Fiscal receipts issued today | Reports taxes |
| Net / VAT / Gross aggregates | Reports taxes |
| Fiscal module health (signed, error, pending) | Devices health, Dashboard store status |
| TSE/Provider session status | Devices, Business (read-only mirror) |

### F) Shift / Cashier

| Feld | Portal-Seite |
|------|--------------|
| Open shift (yes/no, openedAt, openedBy) | Orders KPI, Dashboard store status |
| Current cashier name/id | Dashboard store status |
| Shift close summary (optional) | Reports |

### G) Product statistics

| Feld | Portal-Seite |
|------|--------------|
| Top products (name, qty, revenue) — Zeitraum | Reports |
| Top employees (name, sales count) | Reports |
| Best hour / best day | Reports trends |

### H) Hardware health

| Feld | Portal-Seite |
|------|--------------|
| Printer status | Devices health, Dashboard |
| Cash drawer status | Devices health, Dashboard |
| Scanner status | Devices health |
| Internet connectivity | Devices health |
| Display / customer display | Devices (later) |

### I) POS Version / Update status

| Feld | Portal-Seite |
|------|--------------|
| `appVersion` (installed) | Caisty POS, Devices |
| Update available (vs. cloud release channel) | Caisty POS, Devices alerts |
| Last update check timestamp | Caisty POS |
| Auto-update preference | Caisty POS (later) |

### Empfohlene Sync-Architektur (für spätere Tasks)

1. **Heartbeat erweitern** (leichtgewichtig): version, platform, shift summary, hardware flags, cashier.
2. **Batch-Upload** (periodisch): Orders/Receipts/Payments aggregiert (z. B. alle 1–5 Min).
3. **Portal-API** (neu): `GET /portal/sales/summary?date=`, `GET /portal/orders`, `GET /portal/receipts`, `GET /portal/analytics/...`.
4. **`config_version`** für Business/Fiscal Pull (bereits in `docs/ANALYSE-CLOUD-POS-BUSINESS-SYNC.md` empfohlen).

---

## 6. Empfehlungen & Folge-Tasks (ohne Implementierung)

### Phase A — Portal Cleanup (rein Frontend/IA)

| Prio | Task |
|------|------|
| **Hoch** | Dashboard entschlacken: Store Status, Connected Devices, Release, Remote, System Health → Links |
| **Hoch** | Orders + Reports: KPI-Streifen und Filter bis Sync entfernen oder auf 1 Empty State |
| **Hoch** | Support: System Status Sektion entfernen |
| **Hoch** | Licenses in Plans & Billing integrieren (Nav-Item reduzieren) |
| **Hoch** | Doppelte Quick Actions / disabled Buttons entfernen |
| **Mittel** | Billing: Payment-Platzhalter + Billing History + Downloads kürzen |
| **Mittel** | Business Cloud-Panel → 1 Zeile + Link Devices |
| **Mittel** | Terminologie vereinheitlichen (Plan / License / Subscription / Sync) |
| **Mittel** | Sidebar neu gruppieren: Operations \| Organization \| Account \| Support |
| **Niedrig** | Help Categories: „Coming soon“ entfernen wenn Link funktioniert |
| **Niedrig** | `lastSyncedAt` im UI umbenennen → „Portal refreshed“ vs. „Device last seen“ |

### Phase B — Cloud API (Voraussetzung für echte KPIs)

| Prio | Task |
|------|------|
| **Hoch** | Heartbeat Payload erweitern: `appVersion`, `platform` |
| **Hoch** | `GET /portal/devices` Response an Frontend-Typ anpassen |
| **Hoch** | Sales-Summary Endpoint (Tagesaggregat) |
| **Mittel** | Orders + Receipts List Endpoints |
| **Mittel** | Analytics Endpoints (hourly, payment mix, top products) |
| **Mittel** | Shift/Cashier im Heartbeat oder Shift-Endpoint |

### Phase C — POS Desktop

| Prio | Task |
|------|------|
| **Hoch** | Heartbeat: version + platform mitsenden |
| **Hoch** | Tagesaggregierte Sales/Receipts an Cloud senden |
| **Mittel** | Hardware-Status mitsenden |
| **Mittel** | Shift open/close Events |
| **Niedrig** | Live order stream (optional, später) |

### Phase D — Portal Daten anbinden (nach API)

| Prio | Task |
|------|------|
| **Hoch** | Dashboard KPIs aus Sales-Summary |
| **Hoch** | Orders Tabellen befüllen |
| **Mittel** | Reports Charts + Tabellen |
| **Mittel** | `hasPosSync` an echten Sales-Sync koppeln |

---

## 7. Zusammenfassung: Cards pro Seite (Soll-Zustand)

| Seite | Cards bleiben | Cards entfernen/verkleinern |
|-------|---------------|----------------------------|
| **Dashboard** | KPI Live (4–6), Alerts, Activity kurz, Snapshot mini | Store Status, Devices-Liste, Release, Remote, System Health |
| **Orders** | Tabellen, Payment overview, Shift KPI | KPI-Duplikat, Timeline, Exports, Filter ohne API |
| **Reports** | Charts, Tables, Taxes Auswertung | KPI-Duplikat, Exports, System/Device-Bezug |
| **Business** | Profil, Fiscal, Checklist, Store info | Cloud-Detail, Future Modules Grid |
| **Devices** | Grid, Alerts, Health, Remote, Version pro Gerät | Release Center (→ POS), Multi-store |
| **Plans & Billing** | Plan, Subscription, Plans, Invoices, VAT kurz | Payment 4×, History, Downloads, doppelter Key |
| **Caisty POS** | Version, Release, Actions, Readiness, Devices kurz | System Status Detail, Sales-KPIs |
| **Account** | Alles aktuell | — |
| **Support** | Form, Requests, Contact, KB | System Status, Plan-KPI, Remote 5 Zeilen → 1 Card |
| **Licenses** | → in Billing oder nur Tabelle | Separate Nav wenn merged |

---

## Referenzen im Repo

| Dokument / Code | Relevanz |
|-----------------|----------|
| `docs/ANALYSE-CLOUD-POS-BUSINESS-SYNC.md` | Business/Fiscal Portal ↔ POS Pull |
| `docs/api-handshake.md` | Device bind / heartbeat |
| `apps/caisty-site/src/lib/dashboard/deriveDashboardState.ts` | Dashboard Ableitungen |
| `apps/caisty-site/src/lib/orders/deriveOrdersState.ts` | Orders Platzhalter |
| `apps/caisty-site/src/lib/reports/deriveReportsState.ts` | Reports Platzhalter |
| `apps/caisty-site/src/lib/posHub/derivePosHubState.ts` | Caisty POS Hub |
| `apps/cloud-api/src/routes/public-license.ts` | Heartbeat Implementierung |

---

*Ende der Analyse — bereit für Portal Cleanup Sprint und POS Sync Backlog.*
