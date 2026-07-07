# Analyse: Business-Seite — Customer Portal Cleanup (Sprint 1.5)

**Stand:** 2026-07-07  
**Branch:** `staging`  
**Scope:** Nur `/portal/business` — read-only Code- und UX-Analyse  
**Methode:** Review von `PortalBusinessPage`, `deriveBusinessState`, Business-Komponenten, Übersetzungen, Datenquellen; Abgleich mit Dashboard, Account, Devices, Licenses, Billing, Reports, POS Hub  
**Wichtig:** Dieses Dokument ist **nur Analyse**. Keine Code-, UI- oder API-Änderungen.

---

## Executive Summary

Die Business-Seite ist als **„Business Management Center“** und **„Single Source of Truth“** für Firma, Fiskal, POS und Cloud konzipiert. Der **einzige funktional zentrale Block** ist `BusinessEditForm` — ein editierbares Formular für Firmenname, Adresse, Land, Währung, Sprache und Steuer-IDs (`updatePortalBusiness`).

Darum herum wurden **8 weitere Sektionen** gestapelt, von denen die meisten **read-only Info-Grids**, **Dashboard-Duplikate** oder **Coming-soon-Roadmaps** sind. Die Seite ist mit geschätzt **~1.800–2.200 px** vertikaler Höhe **deutlich länger** als Account oder Orders nach Cleanup — auf Desktop **mehrfaches Scrollen** nötig.

**Kernproblem:** Die Seite beantwortet nicht eine klare Frage, sondern zeigt parallel:

- Setup-Formular (gut),
- Operations-Status (Cloud/POS → gehört Devices/Dashboard),
- Onboarding-Checklist (→ Dashboard),
- Produkt-Roadmap (7× Coming soon),
- und tote Read-only-Felder (`deriveCompany` / `deriveAddress` werden **gar nicht gerendert**).

**Empfehlung Sprint 1.5:** Business auf **„Firmenprofil & Compliance-Setup“** reduzieren — ein kompaktes Formular + schlanke Fiscal-Zusammenfassung + optional Fortschrittsanzeige. Alles andere entfernen oder als Link zu Devices/Licenses/Dashboard.

---

## 1. Informationsarchitektur

### Welche Frage soll die Business-Seite beantworten?

**Zielbild (SaaS):**

> **„Wer ist mein Unternehmen rechtlich und steuerlich — und ist es für POS & Fiscal bereit?“**

**Aktueller Subtitle:**

*"Your company profile — the single source of truth for Portal, POS, fiscal, and cloud."*

→ Anspruch ist korrekt, UI zeigt aber auch Cloud-Betrieb, Store-Betrieb, Lizenz-Setup und Produkt-Roadmap.

### Was gehört wirklich auf Business?

| Information | Gehört auf Business? | Begründung |
|-------------|---------------------|------------|
| Firmenname, Legal name | **Ja** | Kern-Identität |
| Adresse | **Ja** | Pflicht für Fiscal/Rechnungen |
| Land, Währung, Default language | **Ja** | Steuert Fiscal & POS-Verhalten |
| VAT ID, Tax number | **Ja** | Compliance |
| Fiscal provider, Status, Receipt mode | **Ja** (kompakt) | Konfiguration, nicht Betrieb |
| Business email (vs. Account email) | **Später** | Noch nicht editierbar |
| Phone, Website, Support email | **Später** | Coming soon |
| Store ID, Environment | **Nein** | POS/Cloud-Infrastruktur |
| Cloud connected, POS connected, API, Last sync | **Nein** | Operations → Dashboard/Devices |
| License, Device, Cloud in Checklist | **Nein** (als Link) | Eigene Seiten |
| Multi Store, CRM, Loyalty… | **Nein** | Produkt-Roadmap, nicht Settings |

### Duplikate zu anderen Seiten

| Information | Business | Auch auf | Bewertung |
|-------------|----------|----------|-----------|
| Business name | KPI + Form + Store name | Dashboard Alerts | **3× auf Business allein** |
| Country / Currency | KPI + Form + Fiscal + Store | Dashboard, Billing | Redundant |
| Fiscal provider / status | KPI + Fiscal card | Dashboard Business Status, Devices Alerts, Support | Redundant |
| Completion % | KPI + Checklist header | Dashboard Alert „profile incomplete“ | Redundant |
| POS connected / Cloud / Last sync | Cloud Status card | Dashboard KPIs, Devices, POS Hub | **Falsch platziert** |
| License / Device setup | Checklist items | Licenses, Devices, Install | Redundant |
| Account email | Contact „Business email“ | Account Profile | Verwirrend (nicht Business-email) |
| Environment | Store Information | POS Hub, global config | Redundant |
| Compliance status | KPI „Business status“ | Form hint | Akzeptabel wenn einmal |

### Was gehört woanders hin?

| Bereich | Richtige Hauptseite |
|---------|---------------------|
| Cloud API, Last sync, POS online | **Devices** oder **Dashboard** |
| License aktiv / Device installiert | **Licenses** / **Devices** / **Install** |
| Live fiscal **Auswertung** (Umsatzsteuer) | **Reports** (wenn Sync da) |
| Account-Inhaber Email | **Account** |
| POS Version / Release | **Caisty POS** |
| Admin-Fiscal-Deep-Config | **Cloud Admin** (nicht Kundenportal) |

---

## 2. Scroll-Länge

### Aktuelle Sektionen (Reihenfolge in `PortalBusinessPage.tsx`)

| # | Sektion | Geschätzte Höhe | Pflicht? | Sekundär? | Entfernen? |
|---|---------|-----------------|----------|-----------|------------|
| 1 | Header | ~70 px | Ja | — | Nein (kürzen) |
| 2 | KPI Overview (6) | ~140 px | Nein | Ja | **Ja** oder → 1 Fortschrittszeile |
| 3 | **BusinessEditForm** | ~500–650 px | **Ja** | — | **Behalten** (Kern) |
| 4 | Contact | ~200 px | Nein | Ja | **Ja** (bis API da) |
| 5 | Fiscal Configuration (read-only grid) | ~220 px | Teilweise | Ja | **Kompakt** unter Formular |
| 6 | Store Information | ~200 px | Nein | — | **Ja** |
| 7 | Cloud Status | ~180 px | Nein | — | **Ja** |
| 8 | Completion Checklist (8 items) | ~280 px | Teilweise | Ja | **Reduzieren** oder → Dashboard |
| 9 | Quick Actions (4× CS) | ~90 px | Nein | — | **Ja** |
| 10 | Future Modules (7× CS) | ~160 px | Nein | — | **Ja** |
| | Gaps | ~130 px | | | |
| | **Summe** | **~1.950–2.200 px** | | | |

**Ziel:** ~700–900 px (ein Formular + Fiscal-Kompakt + schmale Progress-Zeile) → **minimal scroll** auf 1080p mit Portal-Chrome.

### Pflicht vs. sekundär vs. entfernen

| Kategorie | Bereiche |
|-----------|----------|
| **Pflicht (jetzt)** | Company Edit Form (Name, Legal, Country, Currency, Language, Address, VAT/Tax, Save) |
| **Sekundär (kompakt)** | Fiscal read-only summary, Completion hint (1 Zeile) |
| **Entfernen (Sprint 1.5)** | KPI-Leiste, Contact, Store, Cloud, Checklist (8 Zeilen), Quick Actions, Future Modules |
| **Später reaktivieren** | Contact fields (wenn API), Fiscal actions (wenn Workflow), Multi-store (wenn Produkt) |

---

## 3. KPI-Leiste

### Aktuell (`deriveOverview` — 6 KPIs)

| KPI | Quelle | Echt? |
|-----|--------|-------|
| Business name | `business.companyName` | Ja |
| Business status | `complianceStatus` | Ja |
| Country | `business.country` | Ja |
| Currency | `business.currency` | Ja |
| Fiscal provider | `fiscalProvider` + labels | Ja |
| Completion | Checklist-Berechnung % | Abgeleitet |

### Bewertung

| Frage | Antwort |
|-------|---------|
| Notwendig? | **Nein** — alle Werte sind im Formular oder Fiscal sichtbar |
| Redundant? | **Ja** — 5/6 wiederholen Formular/Fiscal/Checklist |
| Sinnvoll als Dashboard-KPI? | Nein — Business ist **Settings**, kein Monitoring |

### Empfehlung

| Option | Bewertung |
|--------|-----------|
| **Komplett entfernen** | Bevorzugt (Stripe Settings hat keine KPI-Leiste) |
| **1 Zeile „Profile X% complete“** | Akzeptabel als Setup-Fortschritt |
| **6 KPIs behalten** | **Nicht empfohlen** |

---

## 4. Company Information (BusinessEditForm)

### Ist-Zustand — **wichtigster und einziger editierbarer Block**

`BusinessEditForm` enthält drei Gruppen:

1. **Company:** Name*, Legal name, Country, Currency, Default language  
2. **Address:** Street, City, ZIP  
3. **Tax & compliance:** VAT ID, Tax number (+ Warning wenn `complianceStatus === incomplete`)

`*` required

### Read-only Grids (`deriveCompany`, `deriveAddress`) — **toter Code**

`deriveBusinessState` berechnet `company` (9 Felder) und `address` (5 Felder), aber **`PortalBusinessPage` rendert sie nicht**. `CompanyInformation.tsx` und `BusinessAddress.tsx` existieren, sind **ungenutzt**.

Zusätzlich listet `deriveCompany` Felder, die **immer „Not configured“** sind:

- Owner, Registration, Business type, Founded, Timezone

### Feld-Bewertung

| Feld | Im Formular | Pflicht | Optional | Anmerkung |
|------|-------------|---------|----------|-----------|
| Company name | ✅ edit | **Ja** | | Kern |
| Legal name | ✅ edit | Empfohlen | | Rechnungen/Fiscal |
| Country | ✅ edit | **Ja** | | Steuert Fiscal |
| Currency | ✅ edit | **Ja** | | POS/Reports |
| Default language | ✅ edit | Empfohlen | | POS-Default, nicht Portal-UI |
| Street, City, ZIP | ✅ edit | Empfohlen | | Checklist „Address“ |
| VAT ID, Tax ID | ✅ edit | Landabhängig | | DE: wichtig |
| Owner, Registration, etc. | Nur derive (unused) | Nein | | **Nicht anzeigen bis API** |

### UX-Bewertung Formular

| Aspekt | Bewertung |
|--------|-----------|
| Reihenfolge | Gut: Company → Address → Tax |
| Gruppierung | Klar durch Section-Labels |
| Abstände | Großzügig — ok für Kern, aber trägt zur Scroll-Länge bei |
| Verständlichkeit | Gut; `companyHint` hilft |
| Unnötige Felder | Keine im Formular — gut |

### Empfehlung

- **Formular behalten** als Seitenkern (evtl. etwas kompaktere Abstände)
- **Ungenutzte read-only Company/Address-Grids nicht einführen**
- Compliance-Warning unter Tax behalten

---

## 5. Contact

### Ist-Zustand (`deriveContact` + `BusinessContact`)

| Feld | Wertquelle | Status |
|------|------------|--------|
| Business email | `customer.email` | Echt — aber **Account-Email**, nicht Business-Kontakt |
| Phone | — | **Not configured** |
| Website | — | **Not configured** |
| Support email | — | **Not configured** |

Footer-Note: *"Phone, website, and support email editing — Coming soon. Account email is shown for reference."*

### Bewertung

| Frage | Antwort |
|-------|---------|
| Notwendig jetzt? | **Nein** — 3/4 Felder leer, Email ist Account-Duplikat |
| Besser integrieren? | Später als Teil des Formulars wenn `updatePortalBusiness` erweitert wird |
| Entfernen? | **Ja (Sprint 1.5)** — mit Hinweis „Kontakt über Account“ oder Link |
| Später aktivieren? | Wenn Business-Kontaktfelder in API existieren |

---

## 6. Fiscal Configuration

### Ist-Zustand (read-only `BusinessInfoGrid`, 7 Felder)

| Feld | Daten |
|------|-------|
| Fiscal provider | Echt aus Profile |
| Fiscal country | Echt |
| Fiscal status | Echt (`pending_setup`, `active`, …) |
| Signature status | **Not configured** (Platzhalter) |
| Business profile / fiscal package | Echt wenn gesetzt |
| Receipt mode | Echt |
| VAT configuration | Zeigt VAT ID oder Not configured |

### Gehört Fiscal hierher?

| Perspektive | Antwort |
|-------------|---------|
| **Konfiguration** (Was ist eingestellt?) | **Ja** — Business ist richtige Seite |
| **Compliance-Admin** (TSE-Sessions, Zertifikate) | Nein — Admin/Provider-Portal |
| **Auswertung** (Steuer-Reports) | Nein — Reports |

### Redundanz

- KPI „Fiscal provider“
- Dashboard „Fiscal“ in Business Status
- Devices Alerts bei Fiscal-Problemen
- Support „Fiscal provider“ System Status
- Formular zeigt bereits Land + VAT

### Empfehlung

- **Behalten, aber kompakt** — eine Zeile oder kleine Karte **unter** dem Formular (nicht eigene große Split-Karte)
- **Signature status** ausblenden bis echter Wert existiert
- Kein separates Panel neben Contact

---

## 7. Store Information

### Felder (`deriveStore`)

| Feld | Wert | Bewertung |
|------|------|-----------|
| Store name | = `companyName` | **Duplikat** Formular |
| Store ID | Not configured | Platzhalter |
| Environment | `getPortalEnvironmentLabel()` | **POS/Cloud**, nicht Business |
| Language | = `defaultLanguage` | **Duplikat** Formular |
| Currency | = `currency` | **Duplikat** Formular |
| Region | = `country` | **Duplikat** |

### Fazit

**Kein Business-Inhalt** — Mischung aus Formular-Duplikaten und Infrastruktur-Metadaten.

**Empfehlung: Komplett entfernen** von Business. Store/POS-Metadaten gehören zu **Devices** oder **Caisty POS**, wenn überhaupt.

---

## 8. Cloud Status

### Felder (`deriveCloud`)

| Feld | Quelle | Echt? |
|------|--------|-------|
| Cloud connected | `!error && !loading` | Portal-Fetch-Status |
| Last sync | `lastSyncedAt` | Portal-Fetch-Zeit, **nicht** Device-Heartbeat |
| POS connected | `countOnlineDevices` | Device-Heartbeat |
| API status | `!error` | Portal-API-Erreichbarkeit |

### Gehört das auf Business?

**Nein.** Das ist **Live-Betriebsstatus** — identisch zu Dashboard/Devices.

**Empfehlung: Entfernen.** Optional ein Link „View devices →“ unter Formular-Footer.

---

## 9. Completion Checklist

### 8 Items (`deriveCompletion`)

| Item | Prüft | Gehört eher zu |
|------|-------|----------------|
| Business profile | `isStepCompanyDone` | **Business** ✓ |
| Fiscal pack | `deriveFiscalVisibility` | **Business** ✓ |
| License | `isStepLicensePlanDone` | **Licenses / Billing** |
| Device | `devices.length` | **Devices / Install** |
| Cloud | `!error` (Portal load) | **Dashboard / Devices** |
| Business address | Address fields | **Business** ✓ |
| VAT | `vatId` | **Business** ✓ |
| Contact | `customer.email` | **Account** (irreführend) |

### Bewertung

| Frage | Antwort |
|-------|---------|
| Sinnvoll? | **Teilweise** — 3–4 Items sind Business-relevant |
| Auf Dashboard? | **Ja** für License/Device/Cloud — Dashboard zeigt bereits „profile incomplete“ Alert |
| Auf Business? | Max. **kompakte Setup-Zeile** mit 3–4 Business-only Items |

**Empfehlung:** Große 8-Zeilen-Checklist **entfernen**. Optional: „3 of 4 business steps complete“ mit Links zu Licenses/Devices.

---

## 10. Quick Actions

| Action | Status |
|--------|--------|
| Edit business | **Funktioniert** (scroll to form) |
| Fiscal settings | Coming soon |
| Download company data | Coming soon |
| Export configuration | Coming soon |
| Print profile | Coming soon |

**4 von 5 sind Coming soon.** „Edit business“ ist redundant (Formular ist bereits sichtbar).

**Empfehlung: Komplett entfernen.**

---

## 11. Future Modules

7 Karten, **alle** mit „Coming soon“ Badge:

Multi store · Branches · Warehouse · Accounting · CRM · Loyalty · Gift cards

### Bewertung

| Frage | Antwort |
|-------|---------|
| Auf Settings-Seite zeigen? | **Nein** — wirkt wie unfertiges Produkt |
| Stripe/Shopify/Linear? | Zeigen **keine** Roadmap auf Business Settings |
| Entfernen bis Release? | **Ja** |

---

## 12. Empty States — vollständiges Inventar

### Globale Labels

| Text | Vorkommen |
|------|-----------|
| `Not configured` | Default für leere read-only Felder |
| `Coming soon` | Quick Actions (4), Future Modules (7), Contact note |
| `Waiting for profile` | KPI Completion hint wenn kein Profile |
| `Pending` | Checklist-Status |
| `Incomplete` | Checklist-Status |

### Pro Sektion

| Sektion | Placeholder / leer |
|---------|-------------------|
| **KPI** | Completion hint „Waiting for profile“ |
| **deriveCompany** (unused) | Owner, Registration, Business type, Founded, Timezone → always Not configured |
| **deriveAddress** (unused) | State → Not configured |
| **Contact** | Phone, Website, Support email → Not configured; Note Coming soon |
| **Fiscal** | Signature status → Not configured; VAT config wenn keine VAT ID |
| **Store** | Store ID → Not configured; Rest Duplikat |
| **Cloud** | Werte während loading → Not configured |
| **Checklist** | Items incomplete/pending je nach Setup-Stand |
| **Quick Actions** | 4× Coming soon badge |
| **Future Modules** | 7× Coming soon badge |

### Irreführende Zustände

| Problem | Detail |
|---------|--------|
| Contact „Business email“ | Zeigt Account-Email, nicht editierbares Business-Feld |
| Cloud „Last sync“ | Portal-Fetch, nicht POS-Sync |
| Checklist „Contact“ | Pending wenn Account-Email existiert — kein Business-Kontakt |
| Checklist „Cloud“ | Complete wenn Portal lädt — sagt nichts über POS |

**Geschätzt: 40+ „Not configured“ / Coming-soon-Anzeigen** auf einer Seite mit einem funktionierenden Formular.

---

## 13. Wiederholungen (Cross-Page)

| Information | Business | Dashboard | Account | Devices | Licenses | Reports | Orders |
|-------------|----------|-----------|---------|---------|----------|---------|--------|
| Business name | KPI, Form, Store | Alert | — | — | — | — | — |
| Country/Currency | KPI, Form, Store, Fiscal | — | — | — | — | — | — |
| Fiscal status | KPI, Fiscal, Checklist | Business Status | — | Alerts | — | Taxes (placeholder) | — |
| Profile incomplete | Checklist, Form hint | Alert | — | — | — | — | — |
| POS/Cloud/Sync | Cloud card, Checklist | KPI, Status | — | KPI, Grid | — | — | — |
| License | Checklist | Activity | — | Device card | **Haupt** | — | — |
| Email | Contact | — | Profile | — | — | — | — |
| Completion % | KPI + Checklist | health (hidden) | — | — | — | — | — |

---

## 14. Zielbild — professionelle SaaS Business-Seite

### Wie Stripe / Shopify / Square es strukturieren würden

**Shopify:** Settings → Business details = Legal entity, Address, Tax — **eine** fokussierte Seite, keine Ops-Metriken.

**Stripe:** Account → Business profile = Form + Verification status — kein „Future modules“ Grid.

**Square:** Business information = Company + Location — Locations separat wenn Multi-store.

### Empfohlenes Caisty-Zielbild

```
Business
Your legal entity and tax setup for POS and fiscal compliance.

[ Optional: Setup progress — 75% · Fiscal pending ]

┌─────────────────────────────────────────────────────┐
│ COMPANY PROFILE                          [Save]      │
│  Company name · Legal name · Country · Currency    │
│  Default language                                    │
│  Address (street, city, zip)                         │
│  VAT ID · Tax number                                 │
│  ⚠ Fiscal setup pending (if applicable)              │
└─────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────┐
│ FISCAL (read-only, compact)                          │
│  Provider · Status · Receipt mode                    │
│  [Link: Learn more / Contact support]                │
└─────────────────────────────────────────────────────┘

Need a license or device? → Licenses · Devices
```

**Geschätzte Höhe:** ~750–900 px — **passt auf Desktop mit minimalem Scroll**.

### Behalten

| Bereich | Form |
|---------|------|
| BusinessEditForm (voll) | Kern |
| Fiscal summary | Kompakt, read-only |
| Setup progress (optional) | 1 Zeile, nur Business-relevante Steps |
| Links zu Licenses / Devices | Footer-Zeile |

### Entfernen (Sprint 1.5)

| Bereich |
|---------|
| KPI Overview (6 cards) |
| Contact card |
| Store Information |
| Cloud Status |
| Completion Checklist (8 rows) |
| Quick Actions |
| Future Modules |

### Kompakter machen

| Bereich | Maßnahme |
|---------|----------|
| Formular | Etwas weniger vertikales Padding |
| Fiscal | Von 7-Feld-Grid → 3–4 Zeilen |
| Header subtitle | Kürzer: „Legal entity and tax setup.“ |

### Zusammenführen

| Alt | Neu |
|-----|-----|
| KPI Completion + Checklist | Eine Fortschrittszeile |
| Fiscal KPI + Fiscal card | Nur Fiscal-Kompaktblock |
| Contact email + Account | Nur Account (Link) |

---

## Problemliste nach Priorität

### HIGH

| # | Problem | Maßnahme |
|---|---------|----------|
| H1 | Seite ~2.000 px lang | 6 von 10 Sektionen entfernen |
| H2 | Future Modules — 7× Coming soon | Komplett entfernen |
| H3 | Quick Actions — 4× Coming soon | Komplett entfernen |
| H4 | Cloud Status auf Business | Entfernen → Devices/Dashboard |
| H5 | Store Information — reine Duplikate | Entfernen |
| H6 | 6 KPI-Karten redundant zum Formular | Entfernen oder 1 Progress-Zeile |
| H7 | Contact — 3/4 Not configured + falsche Email | Entfernen bis API |

### MEDIUM

| # | Problem | Maßnahme |
|---|---------|----------|
| M1 | Completion Checklist 8 Zeilen (License/Device/Cloud) | Entfernen oder auf 3–4 Business-Items kürzen |
| M2 | Fiscal als große eigene Karte | Unter Formular, kompakt |
| M3 | Signature status immer Not configured | Feld ausblenden |
| M4 | deriveCompany/deriveAddress ungenutzt | Code nicht rendern (Cleanup derive) |
| M5 | Subtitle zu lang / zu viele Versprechen | Kürzen |

### LOW

| # | Problem | Maßnahme |
|---|---------|----------|
| L1 | Formular-Abstände | Leicht straffen |
| L2 | „Edit business“ Quick Action redundant | Entfällt mit Quick Actions |
| L3 | Ungenutzte `CompanyInformation.tsx` etc. | Optional Dateien später löschen |
| L4 | Owner/Registration Felder in derive | Nie anzeigen bis Backend |

---

## Empfohlenes Ziel-Layout (Sprint 1.5)

```
Header (title + short subtitle)

[ optional: Business setup 4/6 complete — compact bar ]

┌──────────────────────────────┐
│ BusinessEditForm (full width) │
│  Company · Address · Tax      │
│  [Save company information]   │
└──────────────────────────────┘

┌──────────────────────────────┐
│ Fiscal summary (compact)      │
│  Provider | Status | Receipt  │
└──────────────────────────────┘

Footer links: Licenses · Devices · Support
```

**Desktop:** Single column, max ~900 px — **kein oder minimales Scrollen**.

---

## Empfohlene Sprint-1.5-Aufgaben

| # | Task | Aufwand |
|---|------|---------|
| 1 | `PortalBusinessPage` — nur Form + Fiscal compact + Footer links | Gering |
| 2 | `BusinessOverview` aus Page entfernen | Gering |
| 3 | `BusinessContact`, `StoreInformation`, `CloudStatus` aus Page entfernen | Gering |
| 4 | `CompletionChecklist`, `BusinessQuickActions`, `FutureModules` entfernen | Gering |
| 5 | Neue `FiscalSummary` kompakt (oder `FiscalConfiguration` vereinfachen) | Mittel |
| 6 | Optional `BusinessSetupProgress` — 1 Zeile aus derive | Mittel |
| 7 | `deriveBusinessState` — tote derives entfernen (company, address, store, cloud, quickActions, futureModules) | Mittel |
| 8 | Übersetzungen kürzen (`pageSubtitle`, Contact-Keys optional behalten) | Gering |
| 9 | CSS `.business-center` — single column, weniger gap | Gering |
| 10 | Tests `deriveBusinessState.test.ts` anpassen | Gering |
| 11 | `npm run build` + manuelle Tests | Gering |

**Nicht in Sprint 1.5:** API-Erweiterung Contact-Felder, echte Signature status, Multi-store.

---

## Betroffene Komponenten & Dateien

### Direkt auf Business-Seite gerendert

| Datei | Rolle | Sprint 1.5 |
|-------|-------|------------|
| `src/routes/PortalBusinessPage.tsx` | Orchestrierung | **Ändern** |
| `src/components/business/BusinessEditForm.tsx` | **Kern** — editierbar | Behalten |
| `src/components/business/BusinessOverview.tsx` | 6 KPIs | **Entfernen** aus Page |
| `src/components/business/BusinessContact.tsx` | Contact grid | **Entfernen** |
| `src/components/business/FiscalConfiguration.tsx` | Fiscal read-only | **Kompakt** |
| `src/components/business/StoreInformation.tsx` | Store grid | **Entfernen** |
| `src/components/business/CloudStatus.tsx` | Cloud/POS status | **Entfernen** |
| `src/components/business/CompletionChecklist.tsx` | 8-item checklist | **Entfernen** |
| `src/components/business/BusinessQuickActions.tsx` | Quick actions | **Entfernen** |
| `src/components/business/FutureModules.tsx` | Roadmap grid | **Entfernen** |

### State & Data

| Datei | Rolle |
|-------|-------|
| `src/lib/business/deriveBusinessState.ts` | State-Ableitung — stark vereinfachen |
| `src/lib/business/types.ts` | Types anpassen |
| `src/lib/business/usePortalBusinessData.ts` | Alias `usePortalPosHubData` — unverändert |
| `src/lib/business/deriveBusinessState.test.ts` | Tests anpassen |

### Ungenutzt (existiert, nicht gerendert)

| Datei |
|-------|
| `src/components/business/CompanyInformation.tsx` |
| `src/components/business/BusinessAddress.tsx` |
| `src/components/business/BusinessInfoGrid.tsx` (von mehreren genutzt — bleibt für Fiscal) |

### Übersetzungen & Styles

| Datei |
|-------|
| `src/lib/translations/portal/en.ts` (+ de, fr, ar) — `business.center.*` |
| `src/index.css` — `.business-*` |

### API (unverändert lassen)

| API | Verwendung |
|-----|------------|
| `GET /portal/business` | Laden |
| `PATCH /portal/business` via `updatePortalBusiness` | Speichern |

---

## SaaS UX Bewertung (Ist-Zustand)

| Kriterium | Note (1–5) | Kommentar |
|-----------|------------|-----------|
| **Klarheit** | 2/5 | Zu viele parallele Konzepte (Setup + Ops + Roadmap) |
| **Fokus** | 2/5 | Formular geht unter |
| **Scroll-Länge** | 1/5 | Extrem lang für Settings-Seite |
| **Professionalität** | 2/5 | Design ok, Inhalt wirkt Beta/Roadmap |
| **Funktionalität** | 4/5 | **Formular funktioniert gut** |
| **Vertrauen** | 3/5 | Echte Fiscal-Daten; aber viele „Not configured“ |
| **Redundanz** | 1/5 | Stark — KPI, Store, Checklist, Dashboard |

---

## Manuelle Test-Checkliste (Ist-Zustand / Baseline)

Nach Sprint 1.5 erneut prüfen. Aktuell dokumentieren:

- [ ] `/portal/business` lädt ohne Fehler
- [ ] 6 KPI-Karten sichtbar oben
- [ ] Company Edit Form: alle Felder editierbar, Save funktioniert
- [ ] Contact zeigt Account-Email + Coming-soon-Note
- [ ] Fiscal grid zeigt Provider/Status (Signature = Not configured)
- [ ] Store dupliziert Formular-Werte
- [ ] Cloud Status zeigt Connected/Last sync/POS/API
- [ ] Checklist 8 Items mit Prozentanzeige
- [ ] Quick Actions: nur Edit funktioniert, Rest Coming soon
- [ ] Future Modules: 7 Karten alle Coming soon
- [ ] Seite erfordert mehrfaches Scrollen auf 1080p
- [ ] Dashboard Alert bei incomplete profile verlinkt hierher
- [ ] Keine Regression: Fiscal-Hinweis bei incomplete compliance

### Nach Sprint 1.5 (Ziel)

- [ ] Nur Formular + Fiscal compact + optional progress
- [ ] Keine KPI-Leiste, Store, Cloud, Contact, Checklist, Quick Actions, Future Modules
- [ ] Save weiterhin funktional
- [ ] Desktop: minimal scroll
- [ ] Links zu Licenses/Devices im Footer

---

*Ende der Analyse — Sprint 1.5 Implementierung folgt separat auf Basis dieses Dokuments.*
