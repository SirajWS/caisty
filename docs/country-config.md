# country_config — Länder- und Fiskal-Regeln

**Stand:** Phase 1 (Juli 2026)  
**Quelle der Wahrheit:** PostgreSQL-Tabelle `country_config` in `cloud-api`, gelesen über `CountryConfigService` (In-Memory-Cache nach Server-Start).

## Zweck

Ein Eintrag pro unterstütztem Land steuert:

| Feld | Bedeutung |
|------|-----------|
| `code` | ISO-3166-1 alpha-2 (PK), z. B. `DE`, `TN`, `OTHER` |
| `name_de` / `name_en` | Anzeigenamen |
| `currency` | Standard-Währung (ISO-4217) |
| `allowed_currencies_json` | Erlaubte Währungen im Business-Profil (z. B. CH: CHF + EUR) |
| `fiscal_required` | Fiskalisierung gesetzlich/ produktseitig erforderlich |
| `fiscal_provider` | z. B. `fiskaly` oder `NULL` |
| `receipt_mode` | `certified`, `standard`, `standard_until_certified` |
| `fiscal_surcharge_cents` | Monatlicher Fiskal-Zuschlag in Cent (Billing Phase 4) |
| `pos_download_allowed` | POS-Installer freigegeben |
| `status` | `active` oder `coming_soon` |
| `sort_order` | Reihenfolge in Dropdowns |

## API (öffentlich, ohne Auth)

| Endpoint | Beschreibung |
|----------|--------------|
| `GET /country-config` | Alle Einträge `{ ok, items[] }` |
| `GET /country-config/:code` | Ein Land `{ ok, country }` oder 404 |

Implementierung: `apps/cloud-api/src/routes/country-config.ts`

## Neues Land hinzufügen

1. Zeile in `apps/cloud-api/drizzle/019_country_config.sql` ergänzen (oder neues Migration-SQL)
2. Migration ausführen: `pnpm --filter cloud-api db:migrate` bzw. `db:push`
3. Server neu starten (Cache wird beim Start geladen)

**Kein neuer `if (country === '…')` Code** in Portal, Admin oder Fiskal-Build — Verhalten kommt aus der Tabelle.

## Unbekanntes Land

Wenn ein Business-Profil einen Code enthält, der nicht in `country_config` steht:

- Fallback: `fiscal_required=false`, `receipt_mode=standard`, `currency=EUR`
- Warn-Log: `country_config: unknown country code`

## Dateien

| Pfad | Rolle |
|------|-------|
| `apps/cloud-api/src/db/schema/countryConfig.ts` | Drizzle-Schema |
| `apps/cloud-api/drizzle/019_country_config.sql` | Migration + Seed |
| `apps/cloud-api/src/countryConfig/CountryConfigService.ts` | Cache + Lookup |
| `apps/cloud-api/src/countryConfig/deriveFiscalFromCountryConfig.ts` | Ableitung Fiskal-Status |
| `apps/cloud-api/src/lib/businessProfileRules.ts` | Nutzt Service statt Hardcode |
| `apps/caisty-site/src/lib/countryConfigClient.ts` | Frontend-Cache via API |

## POS-Contract

`GET /pos/config` liefert weiterhin `SafePosFiscalConfig` unverändert. Nur die **interne Herleitung** nutzt `country_config` (siehe `buildFiscalConfiguration.ts`).
