# 📊 Drizzle Schema Struktur - Analyse

## ✅ Aktuelle Struktur

**Schema-Verzeichnis:** `apps/cloud-api/src/db/schema/`

**Drizzle Config:** `apps/cloud-api/drizzle.config.ts`
```typescript
schema: "./src/db/schema/*"
out: "./drizzle"
```

**Migrationen:** `apps/cloud-api/drizzle/`
- Letzte Migration: `008_add_password_resets.sql`
- Nächste Migration: `009_payment_architecture.sql` (zu erstellen)

---

## 📁 Bestehende Schema-Dateien

### ✅ Bereits vorhanden:

1. **`orgs.ts`** - Organisationen
2. **`customers.ts`** - Kunden
3. **`subscriptions.ts`** - Abonnements (⚠️ muss erweitert werden)
4. **`invoices.ts`** - Rechnungen (⚠️ muss erweitert werden)
5. **`payments.ts`** - Zahlungen (⚠️ muss erweitert werden)
6. **`webhooks.ts`** - Webhooks (⚠️ muss umbenannt & erweitert werden)
7. **`licenses.ts`** - Lizenzen
8. **`devices.ts`** - Geräte
9. **`notifications.ts`** - Benachrichtigungen
10. **`users.ts`** - Benutzer
11. **`adminUsers.ts`** - Admin-Benutzer
12. **`passwordResets.ts`** - Passwort-Resets
13. **`customerAuthProviders.ts`** - Auth-Provider
14. **`supportMessages.ts`** - Support-Nachrichten

---

## 🔍 Detaillierte Analyse der Payment-relevanten Tabellen

### 1. `subscriptions.ts` (MUSS ERWEITERT WERDEN)

**Aktuell:**
```typescript
- id, orgId, customerId
- plan, status, priceCents, currency
- startedAt, currentPeriodEnd, createdAt
```

**Fehlt:**
- ❌ `provider` (`stripe|paypal`)
- ❌ `providerEnv` (`test|live`)
- ❌ `providerSubscriptionId`
- ❌ `cancelAtPeriodEnd` (boolean)
- ❌ `canceledAt` (timestamp)
- ❌ Unique Constraint: `(provider, providerEnv, providerSubscriptionId)`

### 2. `payments.ts` (MUSS ERWEITERT WERDEN)

**Aktuell:**
```typescript
- id, orgId, customerId, subscriptionId
- provider, providerPaymentId, providerStatus
- amountCents, currency, status, createdAt
```

**Fehlt:**
- ❌ `providerEnv` (`test|live`)
- ❌ `amountNet` (in cents)
- ❌ `amountTax` (in cents)
- ❌ `failureCode`, `failureMessage`
- ❌ Unique Constraint: `(provider, providerEnv, providerPaymentId)`

**Hinweis:** `provider` existiert bereits als `text`, sollte zu `varchar` mit Type werden.

### 3. `invoices.ts` (MUSS ERWEITERT WERDEN)

**Aktuell:**
```typescript
- id, orgId, customerId, subscriptionId
- number, amountCents, currency, status
- issuedAt, dueAt, createdAt
```

**Fehlt:**
- ❌ `provider` (`stripe|paypal`)
- ❌ `providerEnv` (`test|live`)
- ❌ `providerInvoiceId`
- ❌ `amountNet` (in cents)
- ❌ `amountTax` (in cents)
- ❌ `pdfUrl`
- ❌ `paidAt` (timestamp)
- ❌ Unique Constraint: `(provider, providerEnv, providerInvoiceId)`

### 4. `webhooks.ts` (MUSS UMBENANNT & ERWEITERT WERDEN)

**Aktuell:**
```typescript
- id, orgId, provider, eventType, status
- payload, errorMessage, createdAt
```

**Fehlt:**
- ❌ Umbenennung zu `webhookEvents`
- ❌ `providerEnv` (`test|live`)
- ❌ `eventId` (unique pro Provider)
- ❌ `processedAt` (timestamp)
- ❌ `processStatus` (`pending|ok|failed`)
- ❌ `error` (text, statt `errorMessage`)
- ❌ Unique Constraint: `(provider, providerEnv, eventId)`

---

## 🆕 Neue Tabellen (zu erstellen)

### 1. `billingCustomers.ts` (NEU)

**Zweck:** Provider-spezifische Customer-IDs speichern

**Felder:**
- `id`, `orgId`, `email`
- `provider` (`stripe|paypal`)
- `providerEnv` (`test|live`)
- `providerCustomerId`
- `createdAt`, `updatedAt`
- Unique: `(provider, providerEnv, providerCustomerId)`

### 2. `invoiceLines.ts` (NEU)

**Zweck:** Detaillierte Rechnungszeilen

**Felder:**
- `id`, `invoiceId`
- `description`, `quantity`
- `unitAmountNet`, `amountNet`
- `taxRate`, `amountTax`, `amountGross`

### 3. `idempotencyKeys.ts` (NEU)

**Zweck:** Idempotency für sichere Wiederholbarkeit

**Felder:**
- `id`, `key` (unique)
- `orgId`, `scope`
- `requestHash`
- `responseJson`
- `createdAt`, `expiresAt`

---

## 📝 Schema-Export in `index.ts`

**Aktuell exportiert:**
```typescript
export * from "./orgs";
export * from "./users";
export * from "./customers";
// ... etc
export * from "./payments";
export * from "./webhooks";
```

**Muss hinzugefügt werden:**
```typescript
export * from "./billingCustomers";
export * from "./invoiceLines";
export * from "./idempotencyKeys";
export * from "./webhookEvents"; // statt webhooks
```

---

## 🔧 Migration-Strategie

### Schritt 1: Neue Tabellen erstellen
- ✅ `billingCustomers` - komplett neu
- ✅ `invoiceLines` - komplett neu
- ✅ `idempotencyKeys` - komplett neu

### Schritt 2: Bestehende Tabellen erweitern
- ⚠️ `subscriptions` - neue Felder hinzufügen (nullable für Migration)
- ⚠️ `payments` - neue Felder hinzufügen (nullable für Migration)
- ⚠️ `invoices` - neue Felder hinzufügen (nullable für Migration)

### Schritt 3: Webhooks umbenennen
- ⚠️ `webhooks` → `webhookEvents`
- ⚠️ Neue Felder hinzufügen
- ⚠️ Alte Tabelle migrieren oder parallel laufen lassen

### Schritt 4: Constraints hinzufügen
- Unique Constraints für Provider-IDs
- Indexes für Performance

---

## 🎯 Nächste Schritte

1. ✅ **Struktur verstanden** - Schema-Dateien liegen in `apps/cloud-api/src/db/schema/`
2. ⏭️ **Neue Tabellen erstellen** - `billingCustomers.ts`, `invoiceLines.ts`, `idempotencyKeys.ts`
3. ⏭️ **Bestehende Tabellen erweitern** - `subscriptions.ts`, `payments.ts`, `invoices.ts`
4. ⏭️ **Webhooks umbenennen** - `webhooks.ts` → `webhookEvents.ts`
5. ⏭️ **Migration generieren** - `pnpm drizzle-kit generate`
6. ⏭️ **Migration ausführen** - `psql $DATABASE_URL -f drizzle/009_payment_architecture.sql`

---

## 📋 Checkliste für Schema-Änderungen

### Neue Dateien:
- [ ] `apps/cloud-api/src/db/schema/billingCustomers.ts`
- [ ] `apps/cloud-api/src/db/schema/invoiceLines.ts`
- [ ] `apps/cloud-api/src/db/schema/idempotencyKeys.ts`
- [ ] `apps/cloud-api/src/db/schema/webhookEvents.ts` (neu, statt webhooks.ts)

### Zu erweitern:
- [ ] `apps/cloud-api/src/db/schema/subscriptions.ts` (Felder hinzufügen)
- [ ] `apps/cloud-api/src/db/schema/payments.ts` (Felder hinzufügen)
- [ ] `apps/cloud-api/src/db/schema/invoices.ts` (Felder hinzufügen)

### Zu aktualisieren:
- [ ] `apps/cloud-api/src/db/schema/index.ts` (Exports aktualisieren)
- [ ] Code, der `webhooks` importiert → `webhookEvents` ändern

---

## ⚠️ Breaking Changes

1. **`webhooks` → `webhookEvents`**
   - Alle Imports müssen aktualisiert werden
   - Route-Handler müssen angepasst werden
   - Migration muss Daten migrieren

2. **Neue Required Fields (später)**
   - Nach Migration können neue Felder required werden
   - Aber erstmal nullable für sanfte Migration

---

## 🔗 Wichtige Dateien

- **Schema-Verzeichnis:** `apps/cloud-api/src/db/schema/`
- **Schema-Index:** `apps/cloud-api/src/db/schema/index.ts`
- **Drizzle Config:** `apps/cloud-api/drizzle.config.ts`
- **Migrationen:** `apps/cloud-api/drizzle/`

