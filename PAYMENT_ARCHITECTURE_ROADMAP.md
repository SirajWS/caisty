# 🏗️ Payment-Architektur & Stripe Integration - Roadmap

## 📊 Aktuelle Situation (Analyse)

### ✅ Was bereits existiert:

1. **PayPal Integration** (in `apps/cloud-api/src/routes/portal-upgrade.ts`)
   - PayPal OAuth Token Flow
   - PayPal Order Creation
   - PayPal Capture
   - Return/Cancel Handlers

2. **DB-Schemas** (teilweise vorhanden):
   - `payments` - existiert, aber unvollständig
   - `subscriptions` - existiert, aber fehlt Provider-Felder
   - `invoices` - existiert, aber fehlt Provider-Felder
   - `webhooks` - existiert, aber unvollständig
   - `customers` - existiert (aber kein separater `billing_customers`)

3. **Frontend** (`apps/caisty-site/src/routes/PortalCheckoutPage.tsx`)
   - Payment-Method-Auswahl (PayPal / Karte)
   - Karte ist aktuell disabled
   - Ruft `/portal/upgrade/start` auf

4. **Webhook-Handling** (`apps/cloud-api/src/routes/webhooks.ts`)
   - PayPal Webhooks werden empfangen
   - Aber keine saubere Struktur für Multi-Provider

### ❌ Was fehlt:

1. **Provider-Abstraktion** - PayPal ist direkt in Route eingebettet
2. **Stripe Integration** - komplett fehlend
3. **Idempotency** - keine Doppelzahlung-Schutz
4. **Saubere DB-Struktur** für Multi-Provider:
   - `billing_customers` (Provider-spezifische Customer-IDs)
   - `invoice_lines` (für detaillierte Rechnungen)
   - `idempotency_keys` (für sichere Wiederholbarkeit)
   - Erweiterte `webhook_events` Tabelle
5. **Billing Service** - zentrale Logik für Provider-Routing
6. **Testmode/Live Trennung** - aktuell nur PayPal Sandbox

---

## 🎯 Ziel-Architektur

```
Frontend (PortalCheckoutPage)
    ↓
POST /api/billing/checkout { planId, paymentMethod, ... }
    ↓
BillingService (Provider-agnostisch)
    ↓
    ├─→ PayPalProvider (test/live)
    └─→ StripeProvider (test/live)
    ↓
DB: billing_customers, subscriptions, payments, invoices, idempotency_keys
    ↓
Webhooks: /webhooks/paypal, /webhooks/stripe
    ↓
WebhookHandler → BillingService → DB Update
```

---

## 📋 Schritt-für-Schritt Implementierung

### **Phase 1: DB-Schema Erweiterung (Tag 1)**

#### 1.1 Neue Tabellen erstellen

**Datei:** `apps/cloud-api/src/db/schema/billingCustomers.ts`
- `id`, `orgId`, `email`
- `provider` (`stripe|paypal`)
- `providerEnv` (`test|live`)
- `providerCustomerId`
- Unique: `(provider, providerEnv, providerCustomerId)`

**Datei:** `apps/cloud-api/src/db/schema/invoiceLines.ts`
- `id`, `invoiceId`
- `description`, `quantity`
- `unitAmountNet`, `amountNet`, `taxRate`, `amountTax`, `amountGross`

**Datei:** `apps/cloud-api/src/db/schema/idempotencyKeys.ts`
- `id`, `key` (unique)
- `orgId`, `scope`, `requestHash`
- `responseJson`, `expiresAt`

#### 1.2 Bestehende Tabellen erweitern

**`subscriptions.ts`:**
- `provider` (`stripe|paypal`)
- `providerEnv` (`test|live`)
- `providerSubscriptionId`
- `cancelAtPeriodEnd` (boolean)
- `canceledAt` (timestamp)
- Unique: `(provider, providerEnv, providerSubscriptionId)`

**`payments.ts`:**
- `providerEnv` (`test|live`)
- `amountNet`, `amountTax` (zusätzlich zu `amountCents`)
- `failureCode`, `failureMessage`
- Unique: `(provider, providerEnv, providerPaymentId)`

**`invoices.ts`:**
- `provider` (`stripe|paypal`)
- `providerEnv` (`test|live`)
- `providerInvoiceId`
- `pdfUrl`
- `paidAt` (timestamp)
- Unique: `(provider, providerEnv, providerInvoiceId)`

**`webhooks.ts` → `webhookEvents.ts`:**
- Umbenennen zu `webhookEvents`
- `eventId` (unique pro Provider)
- `processedAt`, `processStatus`
- Unique: `(provider, providerEnv, eventId)`

#### 1.3 Migration erstellen

**Datei:** `apps/cloud-api/drizzle/009_payment_architecture.sql`
- Alle neuen Tabellen
- Alle Erweiterungen
- Alle Constraints & Indexes

---

### **Phase 2: Provider Interface & Billing Service (Tag 2)**

#### 2.1 Provider Interface definieren

**Datei:** `apps/cloud-api/src/billing/providers/PaymentProvider.ts`

```typescript
interface PaymentProvider {
  name: "stripe" | "paypal";
  env: "test" | "live";
  
  createCheckoutSession(input: CreateCheckoutInput): Promise<CheckoutResult>;
  createSubscription(input: CreateSubscriptionInput): Promise<SubscriptionResult>;
  cancelSubscription(subscriptionId: string): Promise<void>;
  parseAndVerifyWebhook(rawBody: Buffer, headers: Record<string, string>): VerifiedEvent;
}
```

#### 2.2 PayPal Provider (Refactoring)

**Datei:** `apps/cloud-api/src/billing/providers/PayPalProvider.ts`
- PayPal-Logik aus `portal-upgrade.ts` extrahieren
- Implementiert `PaymentProvider` Interface
- Test/Live Trennung über `env`

#### 2.3 Stripe Provider (Neu)

**Datei:** `apps/cloud-api/src/billing/providers/StripeProvider.ts`
- Stripe SDK Integration
- Checkout Sessions
- Customer Creation
- Billing Address Collection
- 3DS Support
- Test/Live Trennung

#### 2.4 Billing Service

**Datei:** `apps/cloud-api/src/billing/BillingService.ts`
- Provider-Routing (PayPal vs Stripe)
- DB Upserts (billing_customers, subscriptions, etc.)
- Idempotency-Prüfung
- Domain Events (für Notifications)

---

### **Phase 3: API Endpoints & Idempotency (Tag 3-4)**

#### 3.1 Neue Billing Endpoints

**Datei:** `apps/cloud-api/src/routes/billing.ts`

**POST /api/billing/checkout**
- Body: `{ planId, billingPeriod, paymentMethod, successUrl, cancelUrl }`
- Idempotency Key: `orgId:planId:period:method`
- Returns: `{ redirectUrl }`

**POST /api/billing/cancel**
- Body: `{ subscriptionId, atPeriodEnd: true }`
- Idempotency Key: `orgId:subscriptionId:cancel`

**GET /api/billing/subscription**
- Returns: aktuelle Subscription aus DB

#### 3.2 Idempotency Implementierung

**Datei:** `apps/cloud-api/src/billing/IdempotencyService.ts`
- Key-Generierung
- Request-Hash (für Duplikat-Erkennung)
- Response-Caching
- Expiration-Handling

#### 3.3 Portal-Upgrade Route refactoren

**Datei:** `apps/cloud-api/src/routes/portal-upgrade.ts`
- Nutzt jetzt `BillingService` statt direkter PayPal-Calls
- Payment-Method wird aus Request gelesen
- Routing zu entsprechendem Provider

---

### **Phase 4: Webhook-Handling erweitern (Tag 4)**

#### 4.1 Webhook-Handler refactoren

**Datei:** `apps/cloud-api/src/routes/webhooks.ts`
- `/webhooks/paypal` → nutzt `PayPalProvider.parseAndVerifyWebhook()`
- `/webhooks/stripe` → neu, nutzt `StripeProvider.parseAndVerifyWebhook()`
- Beide → `BillingService.handleWebhook()`

#### 4.2 Webhook-Event-Processing

**Datei:** `apps/cloud-api/src/billing/WebhookHandler.ts`
- Event-Parsing (Provider-spezifisch)
- DB Updates (payments, subscriptions, invoices)
- Idempotency für Events
- Notifications

---

### **Phase 5: Frontend Integration (Tag 5)**

#### 5.1 PortalCheckoutPage anpassen

**Datei:** `apps/caisty-site/src/routes/PortalCheckoutPage.tsx`
- Payment-Method wird an API gesendet
- Karte-Button aktivieren
- `paymentMethod` Parameter zu `startPortalUpgrade()` hinzufügen

#### 5.2 PortalApi erweitern

**Datei:** `apps/caisty-site/src/lib/portalApi.ts`
- `startPortalUpgrade(plan, paymentMethod)` erweitern
- `paymentMethod: "paypal" | "card"` Parameter

---

### **Phase 6: Stripe Setup & Testing (Tag 6-7)**

#### 6.1 Stripe Account Setup
- Stripe Account erstellen
- Testmode API Keys holen
- Products & Prices in Stripe Dashboard anlegen
- Webhook Endpoint konfigurieren (Stripe CLI für lokal)

#### 6.2 Environment Variables
```env
# Stripe
STRIPE_SECRET_KEY_TEST=sk_test_...
STRIPE_SECRET_KEY_LIVE=sk_live_...
STRIPE_WEBHOOK_SECRET_TEST=whsec_...
STRIPE_WEBHOOK_SECRET_LIVE=whsec_...

# PayPal (bereits vorhanden)
PAYPAL_CLIENT_ID=...
PAYPAL_CLIENT_SECRET=...
PAYPAL_BASE_URL=https://api-m.sandbox.paypal.com
```

#### 6.3 Testzahlungen
- Stripe Testkarten testen
- PayPal Sandbox testen
- 3DS Flow testen
- Webhook-Delivery prüfen
- DB-Audit (alle Tabellen prüfen)

---

## 📁 Dateistruktur (Ziel)

```
apps/cloud-api/src/
├── billing/
│   ├── BillingService.ts          # Zentrale Logik
│   ├── IdempotencyService.ts       # Idempotency-Handling
│   ├── WebhookHandler.ts           # Webhook-Processing
│   └── providers/
│       ├── PaymentProvider.ts      # Interface
│       ├── PayPalProvider.ts       # PayPal-Implementierung
│       └── StripeProvider.ts       # Stripe-Implementierung
│
├── db/schema/
│   ├── billingCustomers.ts        # NEU
│   ├── invoiceLines.ts            # NEU
│   ├── idempotencyKeys.ts         # NEU
│   ├── subscriptions.ts           # ERWEITERT
│   ├── payments.ts                # ERWEITERT
│   ├── invoices.ts                # ERWEITERT
│   └── webhookEvents.ts           # UMBENANNT & ERWEITERT
│
└── routes/
    ├── billing.ts                 # NEU: /api/billing/*
    ├── portal-upgrade.ts          # REFACTORED
    └── webhooks.ts                # ERWEITERT
```

---

## 🔄 Migration-Strategie

### Schritt 1: DB-Migration (keine Breaking Changes)
- Neue Tabellen hinzufügen
- Bestehende Tabellen erweitern (nullable Felder)
- Alte Daten bleiben erhalten

### Schritt 2: Provider-Interface (Parallel-Betrieb)
- PayPal-Provider erstellen
- Alte PayPal-Logik bleibt temporär
- Neue Route `/api/billing/checkout` parallel testen

### Schritt 3: Stripe-Provider (Testmode)
- Stripe-Provider implementieren
- Nur Testmode aktivieren
- End-to-End Tests

### Schritt 4: Migration der alten Route
- `portal-upgrade.ts` nutzt jetzt `BillingService`
- Alte PayPal-Logik entfernen
- Frontend auf neue Route umstellen

### Schritt 5: Live-Mode
- Live-Keys konfigurieren
- Webhook-Endpoints in Production
- Monitoring & Alerts

---

## ✅ Definition of Done (Checkliste)

### Phase 1: DB & Schema
- [ ] Alle neuen Tabellen erstellt
- [ ] Alle bestehenden Tabellen erweitert
- [ ] Migration läuft ohne Fehler
- [ ] Constraints & Indexes korrekt

### Phase 2: Provider & Service
- [ ] PaymentProvider Interface definiert
- [ ] PayPalProvider implementiert
- [ ] StripeProvider implementiert
- [ ] BillingService implementiert
- [ ] Provider-Routing funktioniert

### Phase 3: API & Idempotency
- [ ] `/api/billing/checkout` Endpoint
- [ ] `/api/billing/cancel` Endpoint
- [ ] `/api/billing/subscription` Endpoint
- [ ] Idempotency implementiert & getestet
- [ ] Portal-Upgrade Route refactored

### Phase 4: Webhooks
- [ ] PayPal Webhooks funktionieren
- [ ] Stripe Webhooks funktionieren
- [ ] Event-Idempotency
- [ ] DB-Updates korrekt

### Phase 5: Frontend
- [ ] Payment-Method wird gesendet
- [ ] Karte-Button aktiv
- [ ] Stripe Checkout funktioniert
- [ ] PayPal Checkout funktioniert

### Phase 6: Testing
- [ ] Stripe Testmode vollständig getestet
- [ ] PayPal Sandbox getestet
- [ ] Testzahlungen erfolgreich
- [ ] Webhook-Delivery geprüft
- [ ] DB-Audit erfolgreich

---

## 🚨 Wichtige Hinweise

1. **Testmode First**: Immer zuerst Testmode implementieren und testen
2. **Idempotency ist kritisch**: Verhindert Doppelzahlungen und Chaos
3. **Webhook-Verification**: Immer Signatur prüfen (Sicherheit!)
4. **DB-Audit**: Jede Transaktion muss nachvollziehbar sein
5. **Error-Handling**: Provider-Fehler müssen sauber behandelt werden
6. **Logging**: Alle Payment-Aktionen loggen (für Support)

---

## 📝 Nächste Schritte

1. **Stripe Account erstellen** (du machst das jetzt)
2. **Phase 1 starten**: DB-Schema erweitern
3. **Schritt für Schritt** durch die Phasen gehen
4. **Testen, testen, testen** - besonders Idempotency!

---

## 🔗 Wichtige Links

- [Stripe API Docs](https://stripe.com/docs/api)
- [Stripe Checkout](https://stripe.com/docs/payments/checkout)
- [Stripe Webhooks](https://stripe.com/docs/webhooks)
- [PayPal API Docs](https://developer.paypal.com/docs/api/overview/)
- [Drizzle ORM](https://orm.drizzle.team/)

