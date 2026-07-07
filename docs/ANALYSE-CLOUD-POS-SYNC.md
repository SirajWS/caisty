# Analyse: Cloud API → Portal/Admin POS-Synchronisation (Phase 2.1)

**Stand:** 2026-07-08  
**Scope:** `caisty` Monorepo — Cloud API, Customer Portal (`caisty-site`), Cloud Admin (`cloud-admin`)  
**Methode:** Read-only Code-Review von Routen, DB-Schema, Portal-Hooks/Derive-Logik, Admin-UI, bestehenden Analyse-Dokumenten  
**Wichtig:** Dieses Dokument ist **nur Analyse**. Keine Code-, DB-, API- oder Build-Änderungen.

**Zielbild der Kette:** Desktop POS → Cloud API → PostgreSQL → Customer Portal → Admin

---

## Executive Summary

**Aktueller Stand:** Caisty Cloud ist ein **Lizenz-, Geräte-, Business- und Billing-Backend** mit starkem Portal/Admin für Abonnements — aber **kein Sales-Sync-Backend**. Die Desktop POS sendet heute nur:

- Lizenzprüfung (`POST /licenses/verify`)
- Gerätebindung (`POST /devices/bind`)
- Heartbeat (`POST /devices/heartbeat` — nur `deviceId`)
- optional Legacy-Profil-Push (`cloudCustomer` → `customers.profile`)

**Phase V** hat den **Pull-Pfad** Portal → POS für Business/Fiscal/Lizenz ergänzt (`GET /pos/config`), nicht den **Push-Pfad** POS → Cloud für Verkaufsdaten.

**Fehlend für Phase 2:**

| Bereich | Status |
|---------|--------|
| DB-Tabellen für Orders, Receipts, POS-Payments, Shifts, Sync-Events | **Nicht vorhanden** |
| POST `/pos/sync/*` Endpunkte | **Nicht vorhanden** |
| GET `/portal/orders`, `/portal/reports`, `/portal/dashboard/summary` | **Nicht vorhanden** |
| Portal Orders/Reports/Dashboard Sales-KPIs | **100 % Platzhalter** (`waitingPosSync`) |
| Admin POS-Sales-Ansicht | **Nicht vorhanden** |
| Extended Heartbeat (Version, Queue, Last sync) | **Nicht vorhanden** |

**Kernempfehlung:** Phase 2 als **idempotente Event-Ingestion** (POS push) + **org-scoped Read-APIs** (Portal/Admin pull) + **Aggregat-Views** für Dashboard/Reports aufbauen. Billing-`payments` und POS-Zahlungen strikt trennen.

**Vorarbeit erledigt:** Customer Portal IA-Cleanup (Sprints 1.5–1.11) — UI ist bereit, wartet auf echte APIs.

---

## 1. Aktueller Cloud-Sync-Stand

### Was synchronisiert wird (heute)

| Richtung | Daten | Mechanismus | Speicher |
|----------|-------|-------------|----------|
| POS → Cloud | Lizenz/Gerät | verify, bind | `licenses`, `devices`, `license_events` |
| POS → Cloud | Liveness | heartbeat | `devices.last_*`, `license_events` |
| POS → Cloud | Legacy Kundenprofil | bind/verify `cloudCustomer` | `customers.profile` (Legacy) |
| Cloud → POS | Business + Fiscal + License | `GET /pos/config` | liest `business_profiles`, `fiscal_configurations` |
| Portal → Cloud | Business-Profil | `PATCH /portal/business` | `business_profiles` (+ `config_version`) |
| Portal ↔ Cloud | Lizenzen, Geräte, Rechnungen, Support | Portal-JWT APIs | bestehende Tabellen |

### Was **nicht** synchronisiert wird

Orders, Receipts, POS-Zahlungen, Umsatz, Schichten/Cashier, Produkte, Refunds, Fiscal-Receipt-Status (live), Offline-Queue, Sync-Fehler, Extended Device Telemetry (`appVersion` etc.).

### Semantik-Warnung: „Sync“ im Portal

| Begriff im UI | Bedeutet heute | Sollte bedeuten (Phase 2) |
|---------------|----------------|---------------------------|
| `lastSyncedAt` in Hooks | Zeitpunkt des **Portal-API-Fetches** | Letzter **POS→Cloud** Sales-Sync |
| `hasPosSync` (Reports) | `devices.some(d => d.lastSeenAt)` | Mindestens ein Sales-Event in Cloud |
| `waitingPosSync` KPIs | Platzhalter bis API da | Echte Daten oder leerer Zustand |
| Device `status: online` | Erwartet im Frontend | API liefert oft `active` (Heartbeat) |

---

## 2. Bestehende POS-Endpunkte (Cloud API)

### Öffentliche POS-Endpunkte (kein JWT — globaler Auth-Hook)

Registriert in `server.ts` als `isPublicRoute`:

| Methode | Pfad | Auth | Request | Response (Kern) |
|---------|------|------|---------|-----------------|
| `POST` | `/licenses/verify` | Keine | `licenseKey`, optional `deviceId`, `deviceName`, `deviceType` | Lizenzstatus, `offlineGraceDays`, Device-Info |
| `POST` | `/devices/bind` | Keine | `licenseKey`, `deviceName`, `fingerprint?`, `cloudCustomer?` | Device, License, optional Customer |
| `POST` | `/devices/heartbeat` | Keine | `deviceId` (UUID) | `ok`, `device.lastHeartbeatAt` |
| `GET` | `/pos/config` | Keine (scoped) | Query: `deviceId`, `licenseKey` | `business`, `fiscal`, `license`, `device`, `sync` |

**Implementierung:** `public-license.ts` (verify, bind, heartbeat), `pos-config.ts` (config pull).

**`/pos/config` Scope-Validierung:**

1. `licenseKey` → aktive Lizenz
2. `deviceId` → Device muss an diese Lizenz gebunden sein
3. `business_profiles` für `orgId` muss existieren

**Keine POS-Sales-Endpunkte:** Kein `POST /pos/sync/*`, kein `GET /portal/orders`, kein Receipt-Upload.

### Portal-Endpunkte (Portal-JWT: `Authorization: Bearer <portalToken>`)

Claims: `{ customerId, orgId }` — `portalJwt.ts`

| Methode | Pfad | Daten |
|---------|------|-------|
| `GET` | `/portal/me` | Kunde, Primary License, Stripe-Flags |
| `GET` | `/portal/devices` | Geräte (gruppiert nach Fingerprint) |
| `GET` | `/portal/licenses` | Lizenzliste |
| `GET` | `/portal/invoices` | Abo-Rechnungen |
| `GET` | `/portal/business` | Business-Profil |
| `PATCH` | `/portal/business` | Business speichern |
| `GET` | `/portal/business/pos-config` | POS-Config-Vorschau |
| `GET/POST` | `/portal/support-messages` | Support-Tickets |

### Admin-Endpunkte (Admin-JWT oder Legacy-JWT)

| Bereich | Pfade | POS-Sales? |
|---------|-------|------------|
| Kunden | `GET /customers`, `GET /customers/:id` | Nein |
| Geräte | `GET /devices`, `DELETE /admin/devices/:id` | Nein |
| Lizenzen | `GET /licenses`, Events | Nein |
| Abo-Rechnungen | `GET /invoices`, Payments | **SaaS-Revenue**, nicht POS |
| Analytics | `GET /admin/analytics/*` | **Invoice-Revenue**, nicht POS |
| Fiscal | `GET /admin/fiscal/*` | Konfiguration, nicht Receipts |
| Support | `GET /admin/support-messages` | Nein |

### Auth-Middleware (`server.ts`)

- Global `onRequest`-Hook
- `/portal/*` → **kein** Admin-JWT; Portal-Routen prüfen Token selbst
- POS-Routen → öffentlich, Vertrauen über **License Key + Device UUID**
- Admin-API → `Bearer` Admin-JWT oder Legacy-JWT
- Kein Device-Signing, kein mTLS, kein API-Key pro Gerät (nur UUID nach Bind)

### Erwartete Header/IDs (POS)

| Endpoint | Pflichtfelder |
|----------|---------------|
| verify | `licenseKey` |
| bind | `licenseKey`, `deviceName` |
| heartbeat | `deviceId` |
| config | `deviceId` + `licenseKey` (Query) |

---

## 3. Bestehende DB-Tabellen

### Vorhanden (relevant für Phase 2 Basis)

| Tabelle | Zweck | POS-Sales? |
|---------|-------|------------|
| `orgs` | Mandanten-Root | Scope |
| `customers` | Portal-Kunden + Legacy `profile` JSON | Nein |
| `users` | (Legacy) | — |
| `licenses` | Lizenzkeys, Plan, maxDevices | Nein |
| `license_events` | Audit (`heartbeat`, `device_bound`, …) | Telemetry only |
| `devices` | POS-Geräte, Fingerprint, Heartbeat | Liveness only |
| `business_profiles` | Portal Business SoT | Nein |
| `fiscal_configurations` | Fiskal-Snapshot | Config only |
| `country_config` | Länderregeln | Nein |
| `subscriptions` | SaaS-Abo | Nein |
| `invoices` | **SaaS-Rechnungen** (Stripe/PayPal) | ≠ POS Receipts |
| `invoice_lines` | SaaS-Rechnungspositionen | Nein |
| `payments` | **SaaS-Zahlungen** (provider_payment_id) | ≠ POS Payments |
| `billing_customers` | Stripe/PayPal Mapping | Nein |
| `idempotency_keys` | Billing-Idempotenz | Wiederverwendbar für Sync |
| `support_messages` | Support-Tickets | Nein |
| `notifications` | Admin-Benachrichtigungen | Nein |
| `webhooks` | Payment-Webhooks | Nein |
| `portal_*` | Auth, Password Reset, Email Verify | Nein |
| `admin_*` | Admin-User, Permissions | Nein |

### `devices` Schema (aktuell)

```
id, org_id, customer_id, name, type, status, last_seen_at, created_at,
license_id, fingerprint, last_heartbeat_at
```

**Fehlt:** `app_version`, `platform`, `last_sales_sync_at`, `offline_queue_count`, `sync_cursor`, `store_name`

### `license_events` — leichtgewichtiges Audit

Typen z. B. `heartbeat`, `device_bound` — **kein** Sales-Payload.

### Nicht vorhanden (Phase-2-Lücke)

| Benötigte Tabelle | Zweck |
|-------------------|-------|
| `pos_orders` | Verkaufsaufträge |
| `pos_order_lines` | Positionen |
| `pos_receipts` | Belege (inkl. Fiscal-Metadaten) |
| `pos_sale_payments` | Kassenzahlungen (Cash/Card/…) — **nicht** `payments` |
| `pos_shifts` / `pos_cashier_sessions` | Schichten |
| `pos_refunds` | Erstattungen |
| `pos_sync_batches` | Upload-Batches vom POS |
| `pos_sync_events` | Einzel-Events / Dead-letter |
| `pos_daily_aggregates` | Dashboard/Reports Materialized |
| `pos_product_sales` (optional) | Top Products |

**Keine** `audit_logs`-Tabelle für generisches Audit (nur `license_events`).

---

## 4. Fehlende APIs (Phase 2 Vorschlag — nicht implementieren)

### POS Push (Desktop → Cloud)

| Endpoint | Zweck | Priorität |
|----------|-------|-----------|
| `POST /pos/sync/batch` | Generischer Batch (Orders+Receipts+Payments in einem Call) | **P0** |
| oder granular: | | |
| `POST /pos/sync/orders` | Orders + Lines | P0 |
| `POST /pos/sync/receipts` | Receipts + Fiscal status | P0 |
| `POST /pos/sync/payments` | Sale payments | P0 |
| `POST /pos/sync/shifts` | Shift open/close | P1 |
| `POST /pos/sync/refunds` | Refunds | P1 |
| `POST /pos/heartbeat` (extended) | Version, queue depth, last local sync | P1 |

**Auth-Vorschlag:** Gleiches Modell wie `/pos/config`:

- Body/Header: `deviceId`, `licenseKey`
- Server validiert Bindung + aktive Lizenz → `orgId`, `customerId`

**Response:** `accepted`, `duplicate`, `rejected`, `syncCursor`, Fehler pro Item.

### Portal Pull (Cloud → Customer Portal)

| Endpoint | Zweck | Priorität |
|----------|-------|-----------|
| `GET /portal/dashboard/summary` | Revenue today, orders, receipts, last sync, POS online | **P0** |
| `GET /portal/orders` | Liste (heute / Zeitraum / Pagination) | P0 |
| `GET /portal/orders/:id` | Detail | P1 |
| `GET /portal/receipts` | Receipt-Liste | P0 |
| `GET /portal/receipts/:id` | Detail + Fiscal status | P1 |
| `GET /portal/reports/summary?period=` | Aggregates für Reports-Seite | P0 |
| `GET /portal/reports/payment-methods` | Cash/Card/… | P1 |
| `GET /portal/reports/taxes` | Net/VAT/Gross | P1 |
| `GET /portal/reports/top-products` | Top-N | P2 |

### Admin Pull

| Endpoint | Zweck |
|----------|-------|
| `GET /admin/customers/:id/sync` | Sync-Status, letzter Batch, Fehler, Queue |
| `GET /admin/customers/:id/orders` | Support-Debugging |
| `GET /admin/sync/failures` | Org-übergreifend Dead-letter |

---

## 5. Customer Portal — Datenfluss & Platzhalter

### Gemeinsame Daten-Hooks

| Hook | APIs | Verwendet von |
|------|------|---------------|
| `usePortalDashboardData` | licenses, devices, invoices, business | Dashboard, **Orders**, Reports, POS Hub, Devices, Business |
| `usePortalPosHubData` | = Dashboard (Alias) | POS Hub, Devices, Business |
| `usePortalOrdersData` | = Dashboard (Alias) | Orders |
| `usePortalReportsData` | = Dashboard (Alias) | Reports |

**Alle Sales-Seiten teilen dieselbe Datenquelle — ohne Sales-API.**

### Seiten-Matrix

| Seite | Echte Cloud-Daten heute | Platzhalter / abgeleitet | Phase-2-API-Bedarf |
|-------|-------------------------|--------------------------|-------------------|
| **Dashboard** | devices, business, licenses, invoices | Revenue, Orders, Receipts, Employees KPIs; Activities aus Heartbeat | `GET /portal/dashboard/summary` |
| **Orders** | — | Summary KPIs, leere Orders/Receipts-Tabellen, Payment cards | `GET /portal/orders`, `/portal/receipts` |
| **Reports** | devices (`hasPosSync` nur Heartbeat) | Alle KPIs, Charts, Taxes, Trends, Exports | `GET /portal/reports/*` |
| **Devices** | devices, licenses, business | `appVersion` (nicht in API), online/offline Mapping | Extended heartbeat + device fields |
| **POS Hub** | devices, licenses, business, release config | POS status aus device.status; „Cloud“ = API fetch OK | `last_sales_sync_at`, queue status |
| **Business** | business, fiscal | — | (kein Sales) |
| **Licenses** | licenses | — | — |
| **Billing** | invoices, subscriptions | — | — |
| **Support** | support messages | — | — |

### Derive-Dateien mit Phase-2-Erwartung

| Datei | Aktuell | Braucht |
|-------|---------|---------|
| `deriveDashboardState.ts` | `waiting_sync` für Revenue/Orders/Receipts | `dashboard/summary` oder orders aggregate |
| `deriveOrdersState.ts` | Leere Arrays, waiting KPIs | `/portal/orders`, `/portal/receipts` |
| `deriveReportsState.ts` | `hasData: false`, waiting überall | `/portal/reports/summary` + breakdowns |
| `deriveDevicesState.ts` | Heartbeat, `appVersion` optional (nie von API) | Device sync fields |
| `derivePosHubState.ts` | Device count, version from `appVersion` | `last_sales_sync_at` |

### Bekannte API↔UI-Lücken (vor Phase 2)

1. **`GET /portal/devices`** liefert gruppierte Objekte ohne `deviceId`, `appVersion`, `platform` — Frontend-Typ `PortalDevice` erwartet mehr Felder.
2. **Device `status`** in DB: `active` nach Heartbeat; UI filtert `online` → KPI „POS online“ oft **0**.
3. **`appVersion`** im Frontend-Typ, aber **keine DB-Spalte** und nicht im Heartbeat.

---

## 6. Admin — Datenfluss

### Heute sichtbar

| Bereich | Quelle | Dateien |
|---------|--------|---------|
| Kundenliste | `GET /customers` | `CustomersListPage.tsx` |
| Kundendetail | Customer, Subscriptions, Licenses, Devices, Legacy profile, Fiscal API | `CustomerDetailPage.tsx` |
| Geräte | `GET /devices` | `DevicesListPage.tsx` |
| Lizenzen | `GET /licenses` | `LicensesListPage.tsx` |
| Rechnungen | SaaS `invoices` | `InvoicesListPage.tsx` |
| Payments | SaaS `payments` | `PaymentsListPage.tsx` |
| Analytics | Invoice-Revenue | `AnalyticsPage.tsx` |
| Fiscal Compliance | `business_profiles` Pipeline | `FiscalCompliancePage.tsx` |
| Support | `support_messages` | via API |

### Nicht vorhanden

- Admin Orders/Receipts-Ansicht
- Sync-Fehler / Offline-Queue / Dead-letter
- POS Sales Revenue
- Per-Customer Sync Timeline

### Admin Support-Bedarf (Phase 2)

| Daten | Warum |
|-------|-------|
| Letzter erfolgreicher Sales-Sync | „Warum zeigt Portal keinen Umsatz?“ |
| Offline-Queue-Tiefe pro Device | POS sendet nicht |
| Letzte Sync-Fehler (422/409) | Debugging |
| Stichprobe letzter Orders/Receipts | Ticket-Bearbeitung |
| Device Version + Heartbeat | Bereits teilweise in Devices |

---

## 7. Idempotency & Sicherheit

### Idempotency (Vorschlag)

**Problem:** POS kann offline queue + Retry → doppelte Orders/Receipts.

**Bestehendes Muster:** `idempotency_keys` + `IdempotencyService` (Billing) — wiederverwendbar mit Scope `pos.sync.batch`.

| Entity | Empfohlener Unique Key | Anmerkung |
|--------|------------------------|-----------|
| Order | `(org_id, device_id, local_order_id)` | `local_order_id` = POS UUID/string |
| Receipt | `(org_id, device_id, local_receipt_id)` oder `(org_id, receipt_number, device_id)` | Fiscal receipt number wenn global pro Org |
| Payment | `(org_id, device_id, local_payment_id)` | Link zu order/receipt |
| Shift | `(org_id, device_id, local_shift_id)` | |
| Sync Batch | `Idempotency-Key` Header + `(org_id, device_id, batch_seq)` | Ganzes Batch deduplizieren |
| Sync Event | `sync_event_id` (UUID vom POS) | Einmalig pro Event |

**Strategie:**

1. POS sendet `syncBatchId` + monotonic `sequence` pro Batch
2. Cloud speichert Batch in `pos_sync_batches` (status: processing|completed|failed)
3. Upsert pro Entity mit Unique Constraint → `ON CONFLICT DO NOTHING` oder `UPDATE` wenn Status-Übergang
4. Response listet `accepted[]`, `duplicate[]`, `failed[]`

### Security-Konzept

| Akteur | Darf senden | Darf lesen |
|--------|-------------|------------|
| POS (bound device) | Sales-Events für **eigenes** `deviceId` + `license.orgId` | `GET /pos/config` (eigenes Device) |
| Portal User | — | Nur `customerId`/`orgId` aus JWT |
| Admin | — | Alle Orgs (mit Permission) |

**Isolation:**

- Jede Zeile: `org_id` NOT NULL (Pflicht)
- Portal-Queries: `WHERE org_id = jwt.orgId AND customer_id = jwt.customerId`
- POS-Push: License→Org validieren; Device→License validieren
- Kein Cross-Org via `deviceId` ohne License-Match

**Was POS nicht senden darf:**

- Andere `deviceId`
- Andere `orgId`
- Billing-Daten manipulieren
- Fremde License Keys (ohne Bindung)

**Erweiterungen (Phase 3):**

- Device-Secret nach Bind
- Request-Signing (HMAC)
- Rate limiting pro Device

---

## 8. Revenue / Dashboard-Konzept

### Revenue Today — Berechnung (Empfehlung)

| Option | Pro | Contra |
|--------|-----|--------|
| **Aus Receipts (gross)** | Fiscal-nah, Beleg = Wahrheit | Refunds separat |
| Aus Orders (closed) | Operativ | Order ≠ bezahlt |
| Pre-Aggregates (`pos_daily_aggregates`) | Schnell für Dashboard | Muss bei Sync aktualisiert werden |

**Empfehlung:** **Receipts** als Primärquelle für Revenue (gross_cents), **Refunds** als negative Adjustments, **Aggregates** für Dashboard-Performance.

### Parameter

| Thema | Empfehlung |
|-------|------------|
| **Zeitzone** | `business_profiles` → Org-TZ (neu) oder `Europe/Berlin` Default; „Today“ = Org-TZ Mitternacht |
| **Währung** | `business_profiles.currency` — keine Multi-Currency in Phase 2 |
| **VAT** | `net_cents`, `tax_cents`, `gross_cents` pro Receipt |
| **Fiscal status** | `fiscal_status` enum auf Receipt (`pending`, `signed`, `failed`) |
| **Refunds** | Separate Tabelle oder negative Receipt mit `type=refund` |

### Dashboard Summary API (Vorschlag)

```json
{
  "revenueTodayGrossCents": 125000,
  "ordersToday": 47,
  "receiptsToday": 45,
  "refundsToday": 2,
  "currency": "EUR",
  "posOnline": 2,
  "posTotal": 3,
  "lastSalesSyncAt": "2026-07-08T10:15:00Z",
  "timezone": "Europe/Berlin"
}
```

---

## 9. Reports-Konzept

### Aus Rohdaten berechenbar (Phase 2)

| Report | Quelle | Aggregation |
|--------|--------|---------------|
| Revenue by period | Receipts | `SUM(gross_cents) GROUP BY day` |
| Sales by hour | Receipts `sold_at` | Hour bucket |
| Payment methods | `pos_sale_payments` | `GROUP BY method` |
| Top products | `pos_order_lines` | `GROUP BY sku/name` |
| Taxes | Receipts net/tax | `SUM` per rate |
| Average order | Orders | `AVG(total_cents)` |
| Refunds | Refunds table | Count + sum |
| Receipts count | Receipts | `COUNT` |

### Portal Reports — API-Mapping

| UI-Komponente | Endpoint |
|---------------|----------|
| `ReportsOverview` (6 KPIs) | `/portal/reports/summary?period=` |
| `RevenueChart` | `/portal/reports/revenue-series?period=` |
| `HourlySalesChart` | `/portal/reports/hourly?date=` |
| `PaymentMethods` | `/portal/reports/payment-methods` |
| `TopProducts` | `/portal/reports/top-products` |
| `TaxesOverview` | `/portal/reports/taxes` |
| `BusinessTrends` | `/portal/reports/trends` |

Exports (PDF/CSV) → Phase 3.

---

## 10. Portal Integration — Bereinigte Seiten

Nach Sprints 1.5–1.11 — **welche echten APIs pro Seite:**

| Seite | Minimale Phase-2-APIs |
|-------|----------------------|
| **Dashboard** | `GET /portal/dashboard/summary` |
| **Orders** | `GET /portal/orders?date=`, `GET /portal/receipts?date=` |
| **Reports** | `GET /portal/reports/summary`, series + breakdowns |
| **Devices** | Erweitertes `GET /portal/devices` (version, lastSalesSync, queue) |
| **POS Hub** | `summary.lastSalesSyncAt`, `offlineQueueCount` (aus Device oder Summary) |

**Keine neuen Portal-Seiten nötig** — bestehende Derive-Schicht mit echten Daten füllen.

---

## 11. Zielarchitektur

```
┌─────────────────┐
│  Desktop POS    │
│  (offline queue)│
└────────┬────────┘
         │ POST /pos/sync/batch (+ heartbeat extended)
         │ Auth: deviceId + licenseKey
         ▼
┌─────────────────┐
│   Cloud API     │
│  validate scope │
│  idempotent upsert
└────────┬────────┘
         │
         ▼
┌─────────────────┐     ┌──────────────────┐
│  PostgreSQL     │────▶│ pos_daily_       │
│  pos_orders     │     │ aggregates (view)│
│  pos_receipts   │     └────────┬─────────┘
│  pos_sale_pays  │              │
│  pos_sync_*     │              ▼
└────────┬────────┘     ┌──────────────────┐
         │              │ Portal GET APIs  │
         │              │ dashboard/orders │
         │              │ reports          │
         ▼              └────────┬─────────┘
┌─────────────────┐              │
│  Admin APIs     │◀─────────────┘
│  sync debug     │
└─────────────────┘
```

**Pull vs Push:**

- **Push:** POS → Cloud (Sales, Heartbeat extended)
- **Pull:** POS ← Cloud (`GET /pos/config` — bereits Phase V)
- **Read:** Portal/Admin ← Cloud (neu)

---

## 12. Migrationsstrategie

### Neue Migrationen (Vorschlag)

1. `021_pos_sync_core.sql` — orders, receipts, sale_payments, sync_batches
2. `022_pos_shifts_refunds.sql` — shifts, refunds
3. `023_devices_sync_fields.sql` — app_version, last_sales_sync_at, offline_queue_count
4. `024_pos_daily_aggregates.sql` — Materialized View oder Tabelle + Refresh-Job

### Backfill

- **Nicht nötig** — keine historischen POS-Daten in Cloud
- Optional: Seed-Script für Dev (`scripts/seed-pos-sales.ts`)

### Indexes (Minimum)

- `(org_id, sold_at DESC)` auf receipts
- `(org_id, device_id, local_order_id)` UNIQUE
- `(org_id, customer_id, sold_at)` für Portal-Listen
- `(org_id, batch_id)` auf sync_events

### Retention

- Roh-Events: 12–24 Monate (konfigurierbar)
- Aggregates: unbegrenzt
- `pos_sync_events` Fehler: 90 Tage

---

## 13. Sprintplan Phase 2

| Sprint | Fokus | Deliverables |
|--------|-------|--------------|
| **2.2** | Cloud DB + API Contracts | Migrationen, OpenAPI/MD-Contract, `POST /pos/sync/batch` Stub, Types |
| **2.3** | Desktop Event Queue | POS offline queue, batch builder, retry (POS-Repo) |
| **2.4** | Orders/Receipts Sync | Ingestion, Idempotency, Receipt fiscal fields |
| **2.5** | Portal Orders/Reports | `GET /portal/orders`, `/portal/receipts`, deriveOrdersState befüllen |
| **2.6** | Dashboard Revenue | `GET /portal/dashboard/summary`, Aggregates, deriveDashboardState |
| **2.7** | Offline Retry | Dead-letter, extended heartbeat, queue status in Portal |
| **2.8** | Admin Monitoring | `/admin/customers/:id/sync`, Sync-Failure-Liste, Admin-UI |

**Abhängigkeiten:** 2.3 (POS) parallel zu 2.2; 2.5–2.6 blockiert auf 2.4; 2.8 nach 2.4.

---

## 14. Betroffene Dateien (bei Umsetzung)

### Cloud API (neu/geändert)

| Bereich | Dateien |
|---------|---------|
| Schema | `src/db/schema/pos*.ts`, `drizzle/02x_*.sql` |
| Routes | `src/routes/pos-sync.ts`, `src/routes/portal-orders.ts`, `portal-reports.ts`, `portal-dashboard.ts` |
| Services | `src/services/posSyncService.ts`, `posAggregateService.ts` |
| Auth | `src/lib/posDeviceAuth.ts` (validate device+license) |
| Tests | `src/**/__tests__/posSync*.test.ts` |

### Customer Portal

| Bereich | Dateien |
|---------|---------|
| API Client | `src/lib/portalApi.ts` |
| Hooks | `usePortalDashboardData.ts`, `usePortalOrdersData.ts`, `usePortalReportsData.ts` |
| Derive | `deriveDashboardState.ts`, `deriveOrdersState.ts`, `deriveReportsState.ts`, `deriveDevicesState.ts`, `derivePosHubState.ts` |
| Pages | `PortalDashboard.tsx`, `PortalOrdersPage.tsx`, `PortalReportsPage.tsx`, `PortalDevicesPage.tsx`, `PortalPosPage.tsx` |

### Cloud Admin

| Bereich | Dateien |
|---------|---------|
| API | `src/lib/api.ts` |
| Pages | `CustomerDetailPage.tsx` (Sync-Tab), ggf. `SyncFailuresPage.tsx` |

### Dokumentation

| Datei | Inhalt |
|-------|--------|
| `docs/api-handshake.md` | Phase-2 Sync-Contract ergänzen |
| `docs/PHASE-2-POS-SALES-SYNC.md` | Implementierungsbericht (später) |

---

## 15. Manuelle Test-Checkliste (nach Phase-2-Umsetzung)

### POS Push

- [ ] Bind Device → `deviceId` erhalten
- [ ] `POST /pos/sync/batch` mit Test-Order → 201 accepted
- [ ] Gleicher Batch erneut → duplicate, keine Doppel-Zeilen
- [ ] Falsche `licenseKey` → 403
- [ ] Fremdes `deviceId` → 403
- [ ] Extended Heartbeat → `app_version` in DB

### Portal

- [ ] Dashboard Revenue Today nach Sync ≠ „—“
- [ ] Orders-Seite zeigt echte Orders
- [ ] Reports Charts mit Daten
- [ ] Devices: last sales sync sichtbar
- [ ] POS Hub: korrekter Sync-Status
- [ ] Org-Isolation: Kunde A sieht nicht Kunde B

### Admin

- [ ] Kundendetail: Sync-Status
- [ ] Letzte Sync-Fehler sichtbar
- [ ] Sample Orders für Support

### Regression

- [ ] `GET /pos/config` unverändert funktional
- [ ] verify/bind/heartbeat weiterhin OK
- [ ] Portal Business/Billing/Support unberührt

---

## Anhang A — Problemliste

| ID | Severity | Problem |
|----|----------|---------|
| P1 | **HIGH** | Keine DB/API für POS Sales |
| P2 | **HIGH** | Portal Orders/Reports/Dashboard zeigen Platzhalter trotz „Sync“-Copy |
| P3 | **HIGH** | `hasPosSync` = Heartbeat ≠ Sales synchronisiert |
| P4 | **MEDIUM** | `payments`-Tabelle = SaaS, nicht POS — Namenskonflikt |
| P5 | **MEDIUM** | Device `status: active` vs UI `online` |
| P6 | **MEDIUM** | `appVersion` im Frontend, nicht in API/DB |
| P7 | **MEDIUM** | `/portal/devices` Response-Shape ≠ `PortalDevice` Typ |
| P8 | **LOW** | `license_events` für Heartbeat ohne Retention-Policy |
| P9 | **LOW** | Legacy `customers.profile` parallel zu `business_profiles` |

---

## Anhang B — Referenz-Dokumente im Repo

| Dokument | Inhalt |
|----------|--------|
| `docs/api-handshake.md` | POS verify/bind/heartbeat |
| `docs/ANALYSE-CLOUD-POS-BUSINESS-SYNC.md` | Business Pull Phase V |
| `docs/PHASE-V-CLOUD-BUSINESS-SYNC.md` | `/pos/config` Contract |
| `docs/ANALYSE-CUSTOMER-PORTAL-CLEANUP-AND-SYNC.md` | Portal Platzhalter-Matrix |
| `docs/ANALYSE-ORDERS-CLEANUP.md` | Orders-Seite IA |
| `docs/ANALYSE-REPORTS-CLEANUP.md` | Reports-Seite IA |
| `docs/ANALYSE-POS-HUB-CLEANUP.md` | POS Hub Phase 2 Live-Daten |

---

*Ende der Analyse — Phase 2.1 Read Only*
