# Analyse: Fiskal-Umbau & Ländersteuerung — Caisty Cloud

**Stand:** 01.07.2026  
**Scope:** `apps/caisty-site`, `apps/cloud-admin`, `apps/cloud-api`  
**Methode:** Read-only Code-Analyse (keine Refactorings durchgeführt)  
**Ausnahme:** Dieses Dokument wurde als Analyse-Ergebnis neu angelegt.

---

## 1. Executive Summary

Caisty Cloud ist ein **pnpm/Turbo-Monorepo** mit drei Apps (Site+Portal, Admin, API) und **keinem Shared Package** (`packages/*` konfiguriert, aber leer). Länder- und Fiskal-Logik ist **dreifach verteilt** (`businessProfileRules.ts`, `buildFiscalConfiguration.ts`, `businessDisplay.ts`) statt in einer zentralen `country_config`.

**Registrierung erfasst kein Land** — nur Name, E-Mail, Passwort (`portalAuthRoutes.ts`, `RegisterPage.tsx`). Land wird erst post-login auf `/portal/business` gesetzt. Billing nutzt **Site-Währung** (`useCurrency`), nicht Business-Land.

**Fiskal-UI wird nicht ausgeblendet:** `fiscalRequired` kommt aus der API, wird im Portal aber **nirgends für Conditional Rendering** genutzt. Nicht-fiskalische Kunden (TN, MA, …) sehen trotzdem Fiscal-Karten, Provider-Labels und Fachbegriffe.

**Preise:** Basis 14,99 €/Monat / 149 €/Jahr (Starter EUR) in Backend und Frontend identisch; **kein Fiskal-Zuschlag** implementiert. Stripe-Preise über Env-Vars (`stripePrices.ts`), PayPal parallel.

**POS-Contract:** `GET /pos/config` liefert `SafePosFiscalConfig` (Land, Währung, Fiskal-Status, Belegmodus, Provider). POS Desktop-Code liegt **außerhalb dieses Repos**; Vertrag dokumentiert in `docs/api-handshake.md` + `pos-config.ts`.

**Größte Chance:** Eine `country_config` als Single Source of Truth ermöglicht Land-gesteuertes Pricing, UI-Gating, Billing-Zuschlag und POS-Sync ohne neue if-Blöcke — und bereitet POS Web App vor.

**Größtes Risiko:** Billing-Land entkoppelt von Business-Land + License erst nach Zahlung (`ensurePaidLicenseAfterSuccessfulPayment`) → Dashboard „No active license" bei offener PayPal-Rechnung ist **architektonisch erwartbar**, aber UX-verwirrend.

---

## 2. Ist-Architektur

```mermaid
flowchart TB
  subgraph clients [Clients]
    Site["caisty-site<br/>Marketing + Auth + Portal"]
    Admin["cloud-admin<br/>Internes Dashboard"]
    POS["Caisty POS Desktop 0.3.1<br/>außerhalb Repo"]
    POSWeb["Caisty POS Web — geplant"]
  end

  subgraph api [cloud-api :3333]
    PortalRoutes["/portal/*"]
    BillingRoutes["/api/billing/*"]
    AdminRoutes["/admin/*"]
    PosPublic["GET /pos/config<br/>POST /licenses/verify<br/>POST /devices/*"]
    Rules["businessProfileRules.ts"]
    FiscalBuild["buildFiscalConfiguration.ts"]
  end

  subgraph db [(PostgreSQL)]
    BP["business_profiles"]
    FC["fiscal_configurations"]
    Cust["customers"]
    Lic["licenses"]
    Sub["subscriptions"]
    Inv["invoices"]
  end

  Site -->|REST Bearer JWT| PortalRoutes
  Site -->|REST Bearer JWT| BillingRoutes
  Admin -->|REST Bearer JWT| AdminRoutes
  POS -->|REST ohne JWT| PosPublic
  POSWeb -.->|gleicher Contract geplant| PosPublic

  PortalRoutes --> BP
  PortalRoutes --> Rules
  Rules --> FiscalBuild
  FiscalBuild --> FC
  BillingRoutes --> Sub
  BillingRoutes --> Inv
  BillingRoutes --> Lic
  PosPublic --> BP
  PosPublic --> FiscalBuild
```

### Apps im Repo

| App | Pfad | Stack | Rolle |
|-----|------|-------|-------|
| **caisty-site** | `apps/caisty-site` | React 19, Vite 7, React Router 7, Tailwind 4 | Marketing, Auth, Kundenportal (`/portal/*`) |
| **cloud-admin** | `apps/cloud-admin` | React 19, Vite 7, Recharts | Admin-Dashboard |
| **cloud-api** | `apps/cloud-api` | Fastify 5, Drizzle ORM, PostgreSQL | REST-Backend |
| **packages/** | — | *nicht vorhanden* | Workspace in `pnpm-workspace.yaml` deklariert, leer |

**State-Management (Frontends):** React Context (`LanguageContext`, `ThemeProvider`/`AuthContext`), kein Redux/React Query. Data Fetching per Page via `useEffect` + `fetch`.

**Kommunikation:** REST über `portalApi.ts` (Portal) bzw. `api.ts` (Admin). Keine gemeinsame DB-Zugriff von Frontends — alles über API. POS synchronisiert per **Pull** (`GET /pos/config` bei Bedarf; Heartbeat über `POST /devices/heartbeat` laut `docs/api-handshake.md`).

---

## 3. Befunde pro Bereich

### A. Repo- und Architektur-Überblick

#### Kommunikationswege

| Von | Nach | Mechanismus | Datei |
|-----|------|-------------|-------|
| Portal | API | `fetch` + Bearer `caisty.portal.token` | `apps/caisty-site/src/lib/portalApi.ts` |
| Admin | API | `request()` + Bearer `caisty.admin.token`, Dev-Proxy `/api` | `apps/cloud-admin/src/lib/api.ts` |
| Site Marketing | API | Gleicher Client für Auth | `portalApi.ts` |
| POS Desktop | API | Öffentliche Endpoints, kein JWT | `apps/cloud-api/src/server.ts` (Public-Whitelist Z. 70–83) |

#### POS ↔ Cloud Contract (nicht brechen)

**Dokumentation:** `docs/api-handshake.md` (Stand 20.11.2025)

**Implementierte öffentliche Endpoints** (in `server.ts` whitelisted):

| Endpoint | Datei | Zweck |
|----------|-------|-------|
| `POST /licenses/verify` | `apps/cloud-api/src/routes/public-license.ts` | Lizenz prüfen |
| `POST /devices/bind` | `apps/cloud-api/src/routes/public-license.ts` | Gerät binden |
| `POST /devices/heartbeat` | `apps/cloud-api/src/routes/public-license.ts` | Online-Status |
| `GET /pos/config?deviceId=&licenseKey=` | `apps/cloud-api/src/routes/pos-config.ts` | Fiskal/Business-Config |

**`SafePosFiscalConfig`-Payload** (via `toSafePosFiscalConfig`, `apps/cloud-api/src/fiscal/types.ts` Z. 52–66, `buildFiscalConfiguration.ts` Z. 201–218):

```typescript
{
  country, currency, fiscalRequired, providerKey, providerLabel,
  providerType, fiscalStatus, receiptMode, fiscalConfigurationLabel,
  posDownloadAllowed, fiscalNotice, supportedExports, mode
}
```

**Nicht im POS-Payload:** VAT/Tax-IDs, Provider-Secrets, `fiscalEnvironment`, interner `fiscalProfileKey`, `posConfigurationStatus`.

**Portal-Variante:** `GET /portal/business/pos-config` — gleiche Shape (`portal-business.ts` Z. 493–524).

> **Hinweis:** POS Desktop App (v0.3.1) liegt nicht in diesem Repo. Verhalten bei `fiscalStatus: pending_setup` oder fehlendem `business_profile` muss am Desktop-Client validiert werden. API liefert bei fehlendem Profil HTTP 404 `business_profile_missing` (`pos-config.ts` Z. 77–83).

---

### B. Datenmodell

#### Tabellen-Übersicht

| Tabelle | Schema-Datei | Land/Fiskal-relevant |
|---------|--------------|----------------------|
| `customers` | `apps/cloud-api/src/db/schema/customers.ts` | **Kein** `country`; `profile` JSONB optional |
| `orgs` | `apps/cloud-api/src/db/schema/orgs.ts` | Nur `name`, `slug` |
| `business_profiles` | `apps/cloud-api/src/db/schema/businessProfiles.ts` | **Source of Truth:** `country`, `currency`, `vatId`, `taxId`, `fiscalStatus`, `fiscalProvider`, `complianceStatus`, `posConfigurationStatus` |
| `fiscal_configurations` | `apps/cloud-api/src/db/schema/fiscalConfigurations.ts` | **Derived Snapshot:** `fiscalRequired`, `provider`, `receiptMode`, `fiscalProfileKey`, `lastSyncAt` |
| `licenses` | `apps/cloud-api/src/db/schema/licenses.ts` | `plan`, `status`, `validUntil` — **kein Land** |
| `subscriptions` | `apps/cloud-api/src/db/schema/subscriptions.ts` | `plan`, `priceCents`, `currency` — **kein Land** |
| `invoices` | `apps/cloud-api/src/db/schema/invoices.ts` | `amountCents`, `currency`, `status` — **kein Land** |
| `devices` | `apps/cloud-api/src/db/schema/devices.ts` | Gerätebindung an License |

Migrationen: `apps/cloud-api/drizzle/017_business_profiles.sql`, `018_fiscal_configurations.sql`.

#### Hartcodierte Länder-Logik (if country === 'DE')

| Datei | Was |
|-------|-----|
| `apps/cloud-api/src/lib/businessProfileRules.ts` | `applyCountryFiscalRules()` Z. 173–207: DE → Fiskaly/pending; `EU_STRICT_SOON` → required_soon; Rest → not_required |
| `apps/cloud-api/src/lib/businessProfileRules.ts` | `computePosConfigurationStatus()` Z. 310–335: **DE blockiert `ready`** bei pending_setup |
| `apps/cloud-api/src/fiscal/buildFiscalConfiguration.ts` | `EU_STRICT_SOON` Set Z. 23–31; `fiscalRequiredForCountry()` Z. 61–68 |
| `apps/caisty-site/src/lib/businessDisplay.ts` | Spiegel-Logik für Form-Preview Z. 6–77 |
| `apps/caisty-site/src/config/businessCountries.ts` | Statische Länderliste Z. 1–23 |

**Unterstützte Länder heute** (`businessProfileRules.ts` Z. 69–87): DE, AT, FR, IT, ES, PT, NL, BE, CH, GB, IE, TN, MA, DZ, LY, US, OTHER.

> **Indonesien (ID)** aus dem Soll-Ziel ist **nicht im Code** — müsste als neuer `country_config`-Eintrag ergänzt werden.

#### Gibt es `country_config`?

**Nein.** Grep nach `country_config`, `countryConfig`, `CountryConfig` — **0 Treffer**.

Nächste Analogie: `fiscalProfileKey` auf `fiscal_configurations` (z. B. `de_fiskaly_api`, `at_coming_soon`, `generic_standard`) — berechnet, nicht editierbar.

#### Fiskal-Status-Modell

**Intern** (`businessProfileRules.ts` Z. 3–50):

| Status | Bedeutung | Typische Länder |
|--------|-----------|-----------------|
| `not_required` | Keine Fiskalisierung | TN, MA, DZ, LY, US, OTHER |
| `pending_setup` | Fiskal erforderlich, Setup läuft | DE (initial) |
| `required_soon` | Demnächst Pflicht | AT, FR, IT, ES, PT, NL, BE |
| `active` | Fiskal aktiv | DE (nach Fiskaly-Onboarding) |
| `error` | Fehler | Alle |
| `required` | Explizit erforderlich | — |

**Kunden-facing** via `customerFacingFiscalStatus()` (`businessProfileRules.ts` Z. 358–377): mappt `required_soon` → `required_coming_soon`.

**Compliance** (`complianceStatus`): `incomplete` | `ready` | `action_required` — abhängig von Profil-Vollständigkeit + Fiskal-Status (`computeComplianceStatus`, Z. 276–308).

**POS-Readiness** (`posConfigurationStatus`): `not_ready` | `ready` — DE mit pending_setup → `not_ready` (Z. 325–331).

---

### C. Billing / Preise

#### Aktuelle Preisstruktur

**Backend** (`apps/cloud-api/src/config/pricing.ts`):

| Plan | EUR monthly | EUR yearly |
|------|-------------|------------|
| Starter | 14,99 | 149 |
| Pro | 24,99 | 299 |
| Trial | 0 | 0 |

**Frontend** (`apps/caisty-site/src/config/pricing.ts`): EUR identisch; **TND abweichend** (Frontend Starter 29/296 vs Backend 39/398).

#### Payment-Provider

| Provider | Integration | Datei |
|----------|-------------|-------|
| **Stripe** | Checkout Sessions, Billing Portal, Webhooks | `apps/cloud-api/src/billing/providers/stripe/` |
| **PayPal** | Checkout + Capture | `apps/cloud-api/src/billing/providers/paypal/` |

Stripe-Produkte/Preise: Env-Vars in `apps/cloud-api/src/config/stripePrices.ts` (z. B. `STRIPE_PRICE_STARTER_MONTHLY_EUR`). Keine Fiskal-Add-on-Preise vorhanden.

Checkout-Flow (`apps/cloud-api/src/routes/billing.ts`):

1. `POST /api/billing/checkout` — erstellt Subscription `status: pending` (Z. 244–259)
2. **PayPal:** Rechnung sofort `status: open` (Z. 277–294)
3. **Stripe:** Rechnung erst nach Zahlung (`ensureStripePaidInvoiceFromCheckoutSession`)
4. `POST /api/billing/capture` — bei Erfolg: Subscription `active`, dann `ensurePaidLicenseAfterSuccessfulPayment()` (Z. 615–651)

**Währung beim Checkout:** `body.currency ?? "EUR"` (Z. 127) — **nicht** aus `business_profiles.country` abgeleitet.

#### Optionen für Fiskal-Zuschlag (+5 €/Monat)

| Option | Vorteile | Nachteile |
|--------|----------|-----------|
| **Stripe Add-on Price** (zweites Subscription Item) | Saubere Trennung Basis/Fiskal; upgrade/downgrade pro Item; Stripe Billing Portal kompatibel | Zwei Price IDs pro Land/Plan; Webhook-Logik komplexer |
| **Composite Price** (ein höherer Preis pro Land) | Einfacher Checkout (1 Line Item) | Viele Stripe Prices (Plan × Periode × Land × Fiskal); schwer wartbar ohne `country_config` |
| **Line Item im Checkout** | Flexibel, transparenter Aufschlag sichtbar | Custom Checkout UI nötig; PayPal-Support prüfen |
| **Separater „Fiscal Plan"** | Klare Produktlogik | Verwirrende Plan-Matrix; Upgrade-Pfade kompliziert |

> **Empfehlung aus Analyse (noch keine Entscheidung):** Mit zentraler `country_config` (Feld `fiscal_addon_cents`) lässt sich zunächst **Composite Price** oder **Add-on** evaluieren — beides erfordert Stripe-Catalog-Erweiterung.

#### License ↔ Subscription — „No active license" trotz Rechnung

**Ursache im Code:**

| Zustand | Subscription | Invoice | License |
|---------|-------------|---------|---------|
| Checkout gestartet, nicht bezahlt | `pending` | PayPal: `open` | **Keine** |
| Zahlung erfolgreich | `active` | `paid` | **Erstellt** via `ensurePaidLicenseAfterSuccessfulPayment` |
| Trial aktiv | — or — | — | `plan: trial`, `status: active` |

Dashboard-Logik (`PortalDashboard.tsx` Z. 128–131): `pickPrimaryPortalLicense()` aus `apps/caisty-site/src/lib/portalLicensePick.ts` — zeigt „No active license" wenn keine aktive License in `/portal/licenses`-Response.

**Szenario „offene Rechnung, keine License":** Erwartbar bei abgebrochenem PayPal-Checkout (Rechnung `open` in DB, Z. 277–294 in `billing.ts`) oder wenn Capture/Webhook fehlschlägt. Subscription bleibt `pending`, License wird **erst nach erfolgreichem Capture** erzeugt (`finalizePaidLicenseAfterPayment.ts` Z. 19–27).

Zusätzlich: `docs/api-handshake.md` Z. 210–211 dokumentiert explizit, dass **License-Plan unabhängig** vom Subscription-Plan sein kann.

---

### D. Registrierung & Onboarding

#### Ist-Flow

```
Website /register (name, email, password)
  → POST /portal/register (portalAuthRoutes.ts Z. 33–37: kein country)
  → E-Mail-Verifikation (/verify-email)
  → /login → JWT
  → /portal (PortalLayout: fetchPortalMe)
  → Dashboard (Fiscal: „Not configured" / Business unvollständig)
  → /portal/business (Land-Auswahl)
  → /portal/plan oder /portal/install
```

**Registrierung:** `RegisterPage.tsx` Z. 58 — `portalRegister({ name, email, password })`. Kein Land, kein Preis-Hinweis.

**Google OAuth:** `GET /portal/auth/google` → Callback `/portal/login/success` (`App.tsx` Z. 71).

#### Was für Land bei Registrierung nötig wäre

| Schicht | Änderung |
|---------|----------|
| `RegisterPage.tsx` | Land-Dropdown aus `country_config` |
| `portalApi.ts` / `portalAuthRoutes.ts` | `country` im Register-Body; `business_profiles`-Row anlegen |
| `country_config` | Preis-Vorschau: Basis + ggf. Fiskal-Zuschlag |
| Billing | Checkout-Preis aus Land ableiten, nicht nur Site-Currency |

#### Landwechsel nach Registrierung

**Heute erlaubt** auf `/portal/business` (`portal-business.ts` Z. 356–395):

Bei `countryChanged`:
- Währung auto auf `defaultCurrencyForCountry()` wenn nicht mitgesendet (Z. 377–380)
- Fiskal-Felder **zurückgesetzt** (`resolveFiscalFields` mit `null` stored status, Z. 388–395)
- Compliance + POS-Status neu berechnet
- `syncFiscalConfigurationForOrg()` bei jedem GET/PUT

**Risiken Landwechsel bei aktivem Abo:**

| Risiko | Begründung (Code) |
|--------|-------------------|
| Falscher Checkout-Preis | Billing nutzt `body.currency`, nicht Business-Land |
| Fiskal-Setup invalidiert | DE → TN: Fiskaly-Status verworfen; TN → DE: pending_setup neu |
| Stripe-Preis passt nicht | Keine landabhängigen Stripe Price IDs |
| POS-Config ändert sich | POS pullt neue Config; Belegmodus wechselt |
| Rechtliche Bindung | **Nicht im Code** — Product-Owner-Frage |

---

### E. Kundenportal UI (Ist-Zustand)

#### Dashboard — Status-Karten (`PortalDashboard.tsx` Z. 217–275)

| Karte | Tone-Quelle | Kunde braucht? | Bewertung |
|-------|---------------|----------------|-----------|
| **Account** | `accountStatusTone(portalStatus)` | Ja | ✅ Sinnvoll |
| **Business** | `businessCompletenessTone()` | Ja | ✅ Sinnvoll, aber Fachbegriff „Compliance" |
| **License** | `licenseStatusTone()` | Ja | ✅ Sinnvoll |
| **Devices** | `deviceConnectionTone()` | Ja | ✅ Sinnvoll |
| **Fiscal** | `fiscalStatusTone()` | Nur Fiskal-Länder | ❌ Überflüssig für TN/MA/… |

Zusätzlich **Business-Status-Panel** (weiter unten im Dashboard): Country, Currency, **Fiscal status**, **POS readiness**, **Compliance** — wiederholte Fachsprache.

Tone-Labels: `OK` | `ATTENTION` | `ACTION REQUIRED` | `UNKNOWN` (`caistyTerminology.ts` Z. 157–167) — **5 gleichzeitige Badges** im Cloud-Overview-Grid.

**Fiskal-Terminologie sichtbar** (sollte vereinfacht/ausgeblendet werden):

| String | Quelle |
|--------|--------|
| „Fiskaly pending" | `PortalDashboard.tsx` + `translations/portal/en.ts` |
| „Fiscal setup pending" | Dashboard CTA |
| „Standard receipt mode · Standard receipts" | Auch bei TN sichtbar |
| „Synced from Caisty Cloud — fiscal setup pending" | `formatCloudSyncStatus()` |
| „Caisty Fiscal Germany powered by Fiskaly" | `caistyTerminology.ts` Z. 48–49 |

**`fiscalRequired` ungenutzt:** API liefert Feld (`portal-business.ts` Z. 109), kein `grep`-Treffer in Portal-Pages für Conditional UI.

#### Business-Seite (`PortalBusinessPage.tsx`)

| Sektion | Pflicht? | Nur Fiskal-Länder? |
|---------|----------|-------------------|
| Company name, legal name | Empfohlen | Nein |
| Country, currency, language | Country → Compliance | Nein |
| Address | Für Compliance `ready` | Nein |
| VAT ID, Tax number | Optional | Relevant für EU/DE, aber Felder immer sichtbar |
| Fiscal status / provider badges | Read-only | **Ja — sollte ausgeblendet** |
| POS: Fiscal configuration, Receipt mode | Read-only | **Ja — sollte ausgeblendet** |
| Fiscal information explainer | Textblock | **Ja — kollabierbar/ausblenden** |
| POS Download | — | Nein (alle Länder) |

#### Wiederverwendbare Wizard-Komponenten

| Vorhanden | Wiederverwendbar für Stepper? |
|-----------|-------------------------------|
| `portalInputClass()`, `portalCardShell()` | ✅ Layout |
| `PortalBusinessPage` Formularfelder | ⚠️ Extraktion nötig |
| `LegalAgreementCheckbox` | ✅ Schritt „AGB" |
| `businessCountries.ts` Dropdown-Daten | ✅ Schritt „Land" |
| `PortalInstallPage` Download-Block | ✅ Schritt „POS installieren" |
| `PortalPlanBillingPage` Plan-Karten | ✅ Schritt „Plan wählen" |
| Stepper/Progress | ❌ **Nicht vorhanden** |

---

### F. Admin-Portal UI

#### Fiscal Compliance (`FiscalCompliancePage.tsx`)

**Summary Cards:** totalProfiles, germanyFiskalyPending, activeSetups, comingSoonCountries, standardReceiptMode (Z. 22–28).

**Filter:** country, provider, fiscalStatus, providerType, posDownload, customerId, Freitext-Suche (Z. 101–118).

**Tabellen-Spalten:** customerName, country, currency, provider, fiscalStatus, receiptMode, posDownload, lastSyncAt + deaktivierte Actions (Z. 63–88).

**API:** `GET /admin/fiscal/overview` (`apps/cloud-api/src/routes/admin/fiscal.ts` Z. 43+).

#### Customer Detail (`CustomerDetailPage.tsx`)

Business-Block + Fiscal-Block aus `GET /admin/fiscal/customers/:id` — immer gerendert wenn Daten da.

#### Customers List (`CustomersListPage.tsx`)

Spalten Country, Fiscal status, Provider + Filter — nur in Active-Tab.

#### Gruppierung „Fiskal erforderlich" vs. „Keine Fiskalisierung"

**Heute:** Filterbar über `fiscalStatus` und `country`, aber **keine Tab-Gruppierung** oder Ampel-Dashboard.

**Nötig für Soll:**
- Filter/Tab auf `fiscalRequired === true/false` (Feld existiert in API-Response)
- Ampel: rot = action_required/error, gelb = pending_setup, grün = active/not_required

#### country_config CRUD im Admin

**Empfohlener Platz:** Neuer Menüpunkt unter **Settings** oder **Fiscal → Country Rules** (`/admin/settings/countries` o. ä.), da:
- Fiscal-Seite bereits Domain-Kontext hat
- Länder-Regeln operativ + fiscal sind
- Alternative: `/admin/settings` (`admin-settings.ts` existiert)

**Heute:** Keine CRUD-UI — Regeln nur im Code (`businessProfileRules.ts`).

---

### G. Sync zur POS Desktop App

#### Welche Daten POS heute erhält

Quelle: `GET /pos/config` → `SafePosFiscalConfig` (siehe Abschnitt A).

Zusätzlich über Lizenz-Flow (`docs/api-handshake.md`):
- `POST /licenses/verify` → Plan, validUntil, device slots
- `POST /devices/bind` → deviceId
- `POST /devices/heartbeat` → lastSeenAt

#### Pull vs. Push

| Mechanismus | Typ | Frequenz |
|-------------|-----|----------|
| `/pos/config` | **Pull** (POS fragt ab) | Bei Start / manuell — **nicht im Repo definiert** |
| `/devices/heartbeat` | **Push** vom POS | „alle X Minuten" laut Doku (`api-handshake.md` Z. 50–51) |
| Business-Änderung Portal | Kein Push zur POS | POS muss erneut pullen |

#### „Fiskal pending" — blockiert POS?

**API-Seite:**
- `GET /pos/config` liefert Config **auch bei** `fiscalStatus: pending_setup` (kein Block in `pos-config.ts`)
- `posDownloadAllowed: true` immer (`buildFiscalConfiguration.ts` Z. 194)
- `posConfigurationStatus: not_ready` für DE+pending ist im **internen** Snapshot, **nicht** in `SafePosFiscalConfig` enthalten

**Fazit:** Ob POS bei pending blockiert, ist **Desktop-Verhalten (außerhalb Repo)**. API liefert `fiscalStatus` und `fiscalNotice`, blockiert den Endpoint aber nicht.

**Für Soll (Trainingsmodus):** API müsste ggf. `mode: training` o. ä. explizit setzen — Feld existiert heute nicht.

#### POS Web App — zusätzliche Anforderungen

| Thema | Desktop-heute | Web bräuchte |
|-------|---------------|--------------|
| Auth | licenseKey + deviceId | vermutlich OAuth/Portal-Session — **neuer Endpoint nötig** |
| Config-Abruf | `/pos/config` public | Gleicher Contract möglich mit Session-Token |
| Device Binding | Hardware-Fingerprint | Browser-Session / anderes Device-Modell |
| Offline-Grace | Lokal (`api-handshake.md` Z. 59–69) | Web evtl. nicht offline — andere Regeln |

Nichts im Repo ist explizit „desktop-only" im `SafePosFiscalConfig` — Contract ist **client-neutral**.

---

## 4. Gap-Analyse: Ist vs. Soll

| Dimension | Ist | Soll | Gap |
|-----------|-----|------|-----|
| **Land bei Registrierung** | Nein | Ja, steuert alles | 🔴 Hoch |
| **country_config** | 3× hardcoded | Zentral, CRUD-fähig | 🔴 Hoch |
| **Fiskal-UI** | Immer sichtbar | Ausblenden wenn nicht required | 🔴 Hoch |
| **Preis-Transparenz** | Feste Pläne | Basis + Fiskal-Zuschlag pro Land | 🔴 Hoch |
| **Billing-Land** | Site-Currency (EUR/TND) | Business-Country | 🟠 Mittel |
| **Onboarding** | Dashboard mit 5 Badges | Setup-Wizard | 🟠 Mittel |
| **Admin-Gruppierung** | Flache Fiscal-Tabelle | Ampel + Fiskal/Non-Fiskal Tabs | 🟡 Mittel |
| **POS Trainingsmodus** | Unklar (Desktop) | Start trotz pending | 🟡 Mittel (API erweiterbar) |
| **Indonesien** | Nicht in Länderliste | Unterstützt | 🟡 Mittel |
| **Shared Package** | Leer | `@caisty/country-config` | 🟠 Mittel |
| **POS Web** | Nicht gebaut | Gleicher Cloud-Contract | 🟢 Architektur vorbereitet |

---

## 5. Vorschlag Datenmodell `country_config`

### Ziel-Struktur (TypeScript-Skizze)

```typescript
// Vorschlag: packages/country-config/src/types.ts (neu)
export type CountryConfig = {
  code: string;                    // ISO 3166-1 alpha-2
  name: string;                    // Anzeigename
  defaultCurrency: string;         // ISO 4217
  allowedCurrencies: string[];

  fiscalRequired: boolean;
  fiscalProvider: "none" | "fiskaly" | string;
  fiscalProviderLabel: string;
  receiptMode: "standard" | "certified" | "standard_until_certified";
  fiscalProfileKey: string;

  /** Monatlicher Aufschlag in Cent (Basiswährung des Landes) */
  fiscalAddonCentsMonthly: number;
  fiscalAddonCentsYearly: number;  // optional Rabatt

  /** UI */
  showFiscalUi: boolean;           // Portal: Fiscal-Karten/Wizard-Schritte
  registrationNotice: string | null;  // z. B. "+5 €/Monat Fiskal-Paket"
  posTrainingAllowed: boolean;     // POS darf vor active starten

  /** Billing */
  stripePriceSuffix?: string;      // Mapping-Hilfe für Stripe Catalog

  enabled: boolean;
  sortOrder: number;
};
```

### Felder, die heute hineinwandern

| Heutige Quelle | Feld in country_config |
|----------------|------------------------|
| `SUPPORTED_COUNTRIES` | `code`, `enabled` |
| `defaultCurrencyForCountry()` | `defaultCurrency` |
| `allowedCurrenciesForCountry()` | `allowedCurrencies` |
| `applyCountryFiscalRules()` | `fiscalRequired`, `fiscalProvider`, initial `fiscalStatus` |
| `fiscalRequiredForCountry()` | `fiscalRequired` |
| `deriveReceiptMode()` | `receiptMode` |
| `fiscalProfileKey()` | `fiscalProfileKey` |
| `fiscalConfigurationLabel()` | `fiscalProviderLabel` |
| `businessCountries.ts` | Dropdown-Metadaten |
| *(neu)* | `fiscalAddonCents*` |

### Beispieldaten

| Feld | DE | TN | MA | DZ | LY |
|------|----|----|----|----|-----|
| `code` | DE | TN | MA | DZ | LY |
| `defaultCurrency` | EUR | TND | MAD | DZD | LYD |
| `fiscalRequired` | true | false | false | false | false |
| `fiscalProvider` | fiskaly | none | none | none | none |
| `receiptMode` | certified | standard | standard | standard | standard |
| `fiscalProfileKey` | de_fiskaly_api | generic_standard | generic_standard | generic_standard | generic_standard |
| `fiscalAddonCentsMonthly` | 500 | 0 | 0 | 0 | 0 |
| `fiscalAddonCentsYearly` | 5000 | 0 | 0 | 0 | 0 |
| `showFiscalUi` | true | false | false | false | false |
| `registrationNotice` | „In Deutschland ist das Fiskal-Paket gesetzlich erforderlich (+5 €/Monat)" | null | null | null | null |
| `posTrainingAllowed` | true | true | true | true | true |
| `enabled` | true | true | true | true | true |

> Preise Beispiel — **Product-Owner muss final bestätigen** (Abschnitt 7).

---

## 6. Umbau-Plan in Phasen (risikoarm zuerst)

### Phase 1 — `country_config` einführen (risikoarm)

| Schritt | Aufwand | Risiko |
|---------|---------|--------|
| Package `packages/country-config` mit JSON/TS-Registry | 2–3 Tage | 🟢 Niedrig |
| `businessProfileRules.ts` liest aus Registry (Feature-Flag Fallback) | 2 Tage | 🟢 Niedrig |
| `businessDisplay.ts` importiert aus Package | 1 Tag | 🟢 Niedrig |
| Admin: Read-only Country-Rules-Seite | 2 Tage | 🟢 Niedrig |

**Kein Breaking Change** für POS — gleiche abgeleiteten Werte.

### Phase 2 — Portal: Fiskal-UI gating + Copy (risikoarm)

| Schritt | Aufwand | Risiko |
|---------|---------|--------|
| `fiscalRequired` / `showFiscalUi` prüfen in Dashboard, Business | 2–3 Tage | 🟢 Niedrig |
| Dashboard: Fiscal-Karte nur wenn `showFiscalUi` | 0,5 Tag | 🟢 Niedrig |
| Vereinfachte Status-Sprache (kein „Fiskaly pending" für Non-Fiscal) | 1–2 Tage | 🟢 Niedrig |

### Phase 3 — Setup-Wizard (mittel)

| Schritt | Aufwand | Risiko |
|---------|---------|--------|
| `/portal/setup` Stepper: Land → Firma → Plan → Download | 1–2 Wochen | 🟡 Mittel |
| Dashboard redirect wenn Setup incomplete | 1 Tag | 🟡 Mittel |
| Bestehende Pages als Wizard-Steps extrahieren | inkl. oben | 🟡 Mittel |

### Phase 4 — Registrierung + Land (mittel)

| Schritt | Aufwand | Risiko |
|---------|---------|--------|
| Land in Register + `business_profiles` Seed | 2–3 Tage | 🟡 Mittel |
| Preis-Hinweis aus `country_config.registrationNotice` | 1 Tag | 🟡 Mittel |
| Landwechsel-Policy (sperren nach erstem Abo?) | 1 Tag Policy + Code | 🟠 Mittel-Hoch |

### Phase 5 — Billing-Zuschlag (höher)

| Schritt | Aufwand | Risiko |
|---------|---------|--------|
| Stripe Catalog: Fiskal-Prices / Add-ons | 2–3 Tage | 🟠 Mittel |
| Checkout: Preis aus Business-Country | 3–5 Tage | 🟠 Mittel |
| Frontend/Backend TND-Sync fix | 1 Tag | 🟡 Mittel |
| PayPal-Parität prüfen | 2–3 Tage | 🟠 Mittel |

### Phase 6 — Admin-Gruppierung + CRUD (mittel)

| Schritt | Aufwand | Risiko |
|---------|---------|--------|
| Fiscal Overview: Tabs Fiskal / Standard | 2–3 Tage | 🟢 Niedrig |
| country_config CRUD (Admin API + UI) | 1 Woche | 🟡 Mittel |
| DB-Persistenz vs. Code-Registry entscheiden | — | 🟡 Mittel |

### Phase 7 — POS-Anpassung (außerhalb Repo + API)

| Schritt | Aufwand | Risiko |
|---------|---------|--------|
| API: optionales `trainingMode` in SafePosFiscalConfig | 1–2 Tage | 🟡 Mittel |
| POS Desktop 0.3.x: Trainingsmodus bei pending | **Außerhalb Repo** | 🟠 Mittel |
| POS Web: Auth-Modell definieren | Konzept | 🟠 Hoch |

---

## 7. Offene Fragen an den Product Owner

### Recht & Compliance
1. Darf ein Kunde das **Land nach Registrierung wechseln**, wenn bereits ein aktives Stripe-Abo läuft?
2. Was passiert mit **bestehenden DE-Fiskaly-Setups** bei Landwechsel zu TN?
3. Ist **Indonesien** geplant? Welche Fiskal-Regeln gelten dort (nicht im Code)?
4. Welche **EU-Länder** sollen wann live gehen (AT, FR, … — heute „coming soon")?

### Preise & Billing
5. Ist **+5 €/Monat** fix für alle Fiskal-Länder oder nur DE? Gilt der Zuschlag auch für **Pro**?
6. Jährlicher Fiskal-Zuschlag: **50 €/Jahr** (10× Monat) oder proportional?
7. **TND-Kunden:** Abrechnung weiter in EUR (laut `pricing.ts` Z. 5–6 Frontend) — bleibt das so?
8. **Stripe vs. PayPal:** Beide Provider für Fiskal-Zuschlag pflichtig?

### UX & Onboarding
9. Soll das **Setup-Wizard** Pflicht sein oder optional (Dashboard weiter erreichbar)?
10. Welche Felder sind **Pflicht vor erstem POS-Start** — nur Land oder volle Adresse?
11. Soll **VAT ID** für Nicht-EU-Länder ausgeblendet werden?

### POS & Fiskaly
12. Darf POS bei **Fiskal pending** im Trainingsmodus verkaufen oder nur Demo-Belege?
13. Wer triggert **Fiskaly-Onboarding** — Caisty intern (automatisch) oder Kunde?
14. **POS Web App:** Gleiche Device-Limits wie Desktop (maxDevices aus License)?

### Admin & Betrieb
15. Soll `country_config` **in der DB editierbar** sein oder Git-deployed (Code-as-Config)?
16. Brauchen Admins **Alerts** bei Land-Config-Änderungen?

---

## Anhang: Wichtige Dateipfade

| Thema | Pfad |
|-------|------|
| Länder-/Fiskal-Regeln (Backend) | `apps/cloud-api/src/lib/businessProfileRules.ts` |
| Fiscal Build | `apps/cloud-api/src/fiscal/buildFiscalConfiguration.ts` |
| Fiscal Sync | `apps/cloud-api/src/fiscal/fiscalConfigurationService.ts` |
| Portal Business API | `apps/cloud-api/src/routes/portal-business.ts` |
| POS Config | `apps/cloud-api/src/routes/pos-config.ts` |
| Billing Checkout | `apps/cloud-api/src/routes/billing.ts` |
| License nach Zahlung | `apps/cloud-api/src/lib/finalizePaidLicenseAfterPayment.ts` |
| Preise Backend | `apps/cloud-api/src/config/pricing.ts` |
| Preise Frontend | `apps/caisty-site/src/config/pricing.ts` |
| Stripe Prices | `apps/cloud-api/src/config/stripePrices.ts` |
| Registrierung Backend | `apps/cloud-api/src/routes/portalAuthRoutes.ts` |
| Registrierung Frontend | `apps/caisty-site/src/routes/RegisterPage.tsx` |
| Portal Dashboard | `apps/caisty-site/src/routes/PortalDashboard.tsx` |
| Portal Business | `apps/caisty-site/src/routes/PortalBusinessPage.tsx` |
| Fiscal Preview (Client) | `apps/caisty-site/src/lib/businessDisplay.ts` |
| Länder-Dropdown | `apps/caisty-site/src/config/businessCountries.ts` |
| Admin Fiscal | `apps/cloud-admin/src/pages/Fiscal/FiscalCompliancePage.tsx` |
| POS API-Doku | `docs/api-handshake.md` |

---

*Erstellt durch Code-Analyse am 01.07.2026. Keine Produktionscode-Änderungen außer diesem Dokument.*
