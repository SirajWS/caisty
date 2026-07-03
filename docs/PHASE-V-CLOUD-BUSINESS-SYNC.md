# Phase V — Cloud Business Sync Contract (abgeschlossen)

**Datum:** 2026-07-03  
**Scope:** Cloud API, Portal, Admin — **kein POS-Repo**  
**Vorgänger:** `docs/ANALYSE-CLOUD-POS-BUSINESS-SYNC.md`

---

## 1. Geänderte Dateien

### Cloud API

| Datei | Änderung |
|-------|----------|
| `drizzle/020_business_profiles_config_version.sql` | Spalte `config_version` |
| `src/db/schema/businessProfiles.ts` | `configVersion` Feld |
| `src/fiscal/buildPosSyncConfig.ts` | **neu** — POS-Sync-Payload-Builder |
| `src/fiscal/__tests__/buildPosSyncConfig.test.ts` | **neu** — Contract-Tests TN/DE |
| `src/routes/pos-config.ts` | Phase-V-Response |
| `src/routes/portal-business.ts` | `configVersion` bump bei PATCH; Portal-Preview |
| `src/routes/admin/fiscal.ts` | `business` + `fiscal` im Customer-Endpoint |
| `src/fiscal/fiscalConfigurationService.ts` | `getAdminBusinessSnapshotByCustomerId()` |
| `src/routes/public-license.ts` | Legacy-Kommentar für `customers.profile` |
| `src/fiscal/__tests__/buildFiscalConfiguration.test.ts` | `configVersion` in Fixture |

### Customer Portal (`caisty-site`)

| Datei | Änderung |
|-------|----------|
| `src/lib/useFiscalVisibility.ts` | Country-aware Copy (TN/DE) |
| `src/lib/useFiscalVisibility.test.ts` | Aktualisierte Tests |
| `src/lib/translations/portal/en.ts` | `standardReceiptsMessage`, `fiscalRequiredMessage` |
| `src/lib/translations/portal/de.ts` | DE-Übersetzungen |
| `src/lib/translations/portal/fr.ts` | EN-Fallback-Strings |
| `src/lib/translations/portal/ar.ts` | EN-Fallback-Strings |
| `src/routes/PortalDashboard.tsx` | Amber/Green je nach Fiscal-Tone |
| `src/routes/PortalBusinessPage.tsx` | Fiscal-Zeile auch für TN |

### Cloud Admin

| Datei | Änderung |
|-------|----------|
| `src/lib/fiscalApi.ts` | `AdminBusinessSnapshot` Typ |
| `src/pages/Customers/CustomerDetailPage.tsx` | Business aus API; Legacy-POS als Archiv |

### Dokumentation

| Datei | Änderung |
|-------|----------|
| `docs/api-handshake.md` | §8 Phase-V-Contract |
| `docs/PHASE-V-CLOUD-BUSINESS-SYNC.md` | dieser Bericht |

---

## 2. Neuer `/pos/config` Contract

**Request:** `GET /pos/config?deviceId={uuid}&licenseKey={key}`

**Response (200):**

```json
{
  "ok": true,
  "business": { "companyName", "legalName", "country", "currency", "defaultLanguage", "street", "city", "postalCode", "vatId", "taxNumber", "updatedAt" },
  "fiscal": { "fiscalRequired", "provider", "receiptMode", "status", "countryRule" },
  "license": { "id", "key", "plan", "status", "maxDevices", "validUntil" },
  "device": { "id", "name", "status", "fingerprint", "lastHeartbeatAt" },
  "sync": { "configVersion", "updatedAt" }
}
```

**Breaking change:** Das alte `{ ok, config: SafePosFiscalConfig }` Format entfällt. POS 0.3.x muss im **POS Phase V** Client angepasst werden.

**Builder:** `buildPosSyncConfig()` in `apps/cloud-api/src/fiscal/buildPosSyncConfig.ts`

**Portal-Preview:** `GET /portal/business/pos-config` liefert `{ ok, business, fiscal, sync }` (ohne license/device).

---

## 3. Datenquelle vorher / nachher

| Bereich | Vorher | Nachher |
|---------|--------|---------|
| Portal Business Save | `business_profiles` | unverändert (Source of Truth) |
| POS Pull | Nur Fiskal (`SafePosFiscalConfig`) | Vollständig: Business + Fiscal + License + Device + Sync |
| Admin Customer Business | `customers.profile` (POS-Push) + Fiskal-API | `business_profiles` via `/admin/fiscal/customers/:id` → `business` Block |
| Admin Fiscal | `business_profiles` Pipeline | unverändert (+ Business-Felder im selben Endpoint) |
| POS Push `cloudCustomer` | Schreibt `customers.profile` | **Legacy-Archiv** — nicht für POS-Pull/Admin-Fiscal |
| Versionierung | nur `updated_at` | `config_version` + `updated_at` |

---

## 4. Country Rules

Zentrale Tabelle `country_config` (Migration `019_country_config.sql`):

| Land | Währung | fiscalRequired | Provider | receiptMode | countryRule (fiscalProfileKey) |
|------|---------|----------------|----------|-------------|--------------------------------|
| **TN** | TND | `false` | `none` | `standard` | `generic_standard` |
| **DE** | EUR | `true` | `fiskaly` | `certified` | `de_fiskaly_api` |

**Portal Dashboard / Business:**

- TN: *"Standard receipts included — no fiscal pack required."*
- DE (pending): *"Fiscal pack required before your till is ready."*
- DE (active): bestehende Active-Message

---

## 5. Tests

### Cloud API (`pnpm test` in `apps/cloud-api`) — **20/20 grün**

- `buildPosSyncConfig.test.ts`
  - TN → TND, `fiscalRequired=false`, `receiptMode=standard`
  - DE → EUR, `fiscalRequired=true`, `provider=fiskaly`, `receiptMode=certified`
  - Country-Wechsel TN → DE
  - `nextConfigVersion()` Inkrement
  - Alle Business-Felder im Payload
- Bestehende Fiskal-/Country-Config-Tests unverändert grün

### Portal (`pnpm test` in `apps/caisty-site`) — **16/16 grün**

- `useFiscalVisibility.test.ts` — TN Standard-Copy, DE Fiscal-Required-Copy
- `derivePortalSetupSteps.test.ts` — unverändert grün

### Manuell (nach Migration `020`)

1. `pnpm db:migrate` in `apps/cloud-api`
2. Portal: Business speichern → `config_version` in DB +1
3. `GET /pos/config` mit gebundenem Gerät → vollständiger Payload
4. Admin Customer Detail → Business-Karte mit Firmendaten aus Portal

---

## 6. Offene Punkte für POS (Phase V Client)

1. **Client anpassen:** Neues Response-Schema parsen (`business`, `fiscal`, `license`, `device`, `sync`).
2. **Cache:** `configVersion` / `updatedAt` lokal speichern; bei Sync vergleichen.
3. **Read-only UI:** Country/Currency/Firmendaten nicht lokal editieren.
4. **Receipts:** `business.*` + `fiscal.receiptMode` + `business.currency` für Bon-Header.
5. **Breaking:** Altes `response.config` Feld existiert nicht mehr — POS 0.3.x bricht ohne Update.
6. **Heartbeat:** Optional später `configVersion`-Hint — API noch nicht erweitert.
7. **Lizenz-Änderungen:** `config_version` bump aktuell nur bei Portal-Business-PATCH; reine Lizenz-Updates ohne Business-Änderung erhöhen Version noch nicht (License-Block ist bei jedem Pull aktuell).

---

## Migration

```bash
cd apps/cloud-api
pnpm db:migrate   # wendet 020_business_profiles_config_version.sql an
```

---

*Nächster Schritt: POS-Repo mit Prompt „POS Phase V — Business Sync Client“.*
