# 🔍 Phase 2 Vorbereitung - Codebase-Analyse

## 📊 Git Grep Ergebnisse

### Gefundene Dateien (14 Dateien):

#### Schema-Dateien (bereits Phase 1):
- ✅ `apps/cloud-api/src/db/schema/billingCustomers.ts` (NEU)
- ✅ `apps/cloud-api/src/db/schema/invoiceLines.ts` (NEU)
- ✅ `apps/cloud-api/src/db/schema/idempotencyKeys.ts` (NEU)
- ✅ `apps/cloud-api/src/db/schema/webhooks.ts` (erweitert)
- ✅ `apps/cloud-api/src/db/schema/invoices.ts` (erweitert)
- ✅ `apps/cloud-api/src/db/schema/subscriptions.ts` (erweitert)
- ✅ `apps/cloud-api/src/db/schema/payments.ts` (erweitert)
- ✅ `apps/cloud-api/src/db/schema/index.ts` (exports aktualisiert)

#### Route-Dateien (müssen refactored werden):
- 🔄 **`apps/cloud-api/src/routes/portal-upgrade.ts`** ⚠️ **HAUPTPROBLEM**
  - Enthält direkte PayPal-Integration (Zeilen 40-180)
  - PayPal Helper Functions (getPaypalAccessToken, createPaypalOrder, capturePaypalOrder)
  - Route `/portal/upgrade/start` erstellt PayPal-Orders direkt
  - Routes `/portal/upgrade/paypal-return` und `/portal/upgrade/paypal-cancel`
  - **→ Muss refactored werden: PayPal-Logik in PayPalProvider extrahieren**

- 🔄 **`apps/cloud-api/src/routes/webhooks.ts`** ⚠️ **MUSS ERWEITERT WERDEN**
  - Aktuell nur PayPal-Webhooks (`/webhooks/paypal`)
  - Nutzt `webhooks` Tabelle (bereits erweitert)
  - `verifyPaypalSignature()` ist Stub (TODO)
  - **→ Muss Stripe-Webhook-Handler hinzufügen**

#### Server/Index-Dateien:
- 🔄 **`apps/cloud-api/src/server.ts`**
  - Registriert `registerWebhooksRoutes` (Zeile 18, 157)
  - Registriert `registerPortalUpgradeRoutes` (Zeile 123)
  - Webhook-Route ist öffentlich (Zeile 66: `/webhooks/paypal`)

- 🔄 **`apps/cloud-api/src/routes/index.ts`**
  - Registriert `webhooksRoutes` (Zeile 11, 52)

#### Sonstige:
- 📄 `apps/cloud-api/src/db/seed-payments-webhooks.ts` (Seed-Datei, kann ignoriert werden)
- 📄 `apps/cloud-api/src/routes/licenses.ts` (nur Kommentar-Erwähnung)

---

## 🎯 Phase 2.1 - Dateien die wir anfassen werden

### 1. Neue Dateien (zu erstellen):

```
apps/cloud-api/src/billing/
├── BillingService.ts          # Zentrale Logik
├── IdempotencyService.ts       # Idempotency-Handling
└── providers/
    ├── PaymentProvider.ts      # Interface
    ├── PayPalProvider.ts        # PayPal-Implementierung (aus portal-upgrade.ts extrahieren)
    └── StripeProvider.ts       # Stripe-Implementierung (neu)
```

### 2. Zu refactoren:

- **`apps/cloud-api/src/routes/portal-upgrade.ts`**
  - PayPal-Logik extrahieren → `PayPalProvider`
  - Route `/portal/upgrade/start` → nutzt `BillingService`
  - Routes `/portal/upgrade/paypal-return` → nutzt `BillingService`

- **`apps/cloud-api/src/routes/webhooks.ts`**
  - Stripe-Webhook-Handler hinzufügen (`/webhooks/stripe`)
  - Beide Handler nutzen `BillingService.handleWebhook()`

### 3. Neue Route (zu erstellen):

- **`apps/cloud-api/src/routes/billing.ts`** (NEU)
  - `POST /api/billing/checkout` (mit Idempotency)
  - `POST /api/billing/cancel`
  - `GET /api/billing/subscription`

### 4. Server-Registrierung:

- **`apps/cloud-api/src/server.ts`**
  - `registerBillingRoutes()` hinzufügen

---

## 📋 PayPal-Logik die extrahiert werden muss

### Aus `portal-upgrade.ts`:

1. **PayPal Helper Functions:**
   - `getPaypalAccessToken()` (Zeile 57-88)
   - `createPaypalOrder()` (Zeile 95-149)
   - `capturePaypalOrder()` (Zeile 152-180)

2. **PayPal Environment Variables:**
   - `PAYPAL_BASE_URL`
   - `PAYPAL_CLIENT_ID`
   - `PAYPAL_CLIENT_SECRET`

3. **PayPal Order Creation** (in Route `/portal/upgrade/start`):
   - Zeilen 435-459: PayPal-Order wird direkt erstellt
   - Return/Cancel URLs werden generiert

4. **PayPal Return Handler** (`/portal/upgrade/paypal-return`):
   - Zeilen 508-698: Capture-Logik

---

## 🔧 .gitignore Update

**Vorher:**
```gitignore
# Drizzle Migrations (kannst du auch tracken, wenn du willst)
drizzle
```

**Nachher:**
```gitignore
# Drizzle intern (Meta/Cache)
apps/cloud-api/drizzle/meta/
apps/cloud-api/drizzle/_journal.json

# NICHT ignorieren: apps/cloud-api/drizzle/*.sql (Migrationen versionieren!)
```

**✅ Bereits aktualisiert!**

---

## 🚀 Nächste Schritte für Phase 2.1

1. ✅ **Codebase-Analyse abgeschlossen**
2. ⏭️ **Ordnerstruktur erstellen**: `apps/cloud-api/src/billing/`
3. ⏭️ **PaymentProvider Interface** definieren
4. ⏭️ **PayPalProvider** erstellen (Logik aus `portal-upgrade.ts` extrahieren)
5. ⏭️ **StripeProvider** erstellen (neu)
6. ⏭️ **BillingService** erstellen (Provider-Routing)
7. ⏭️ **IdempotencyService** erstellen
8. ⏭️ **Billing Routes** erstellen
9. ⏭️ **portal-upgrade.ts refactoren** (nutzt jetzt BillingService)
10. ⏭️ **webhooks.ts erweitern** (Stripe-Handler)

---

## 📝 Wichtige Erkenntnisse

1. **PayPal ist direkt in Route eingebettet** - muss extrahiert werden
2. **Keine Stripe-Integration** - komplett neu zu implementieren
3. **Webhook-Handler** - nur PayPal, Stripe fehlt
4. **Keine Idempotency** - muss komplett neu implementiert werden
5. **Keine Provider-Abstraktion** - alles hardcoded

**→ Phase 2 wird die größte Refactoring-Phase!**

