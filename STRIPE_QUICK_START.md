# ⚡ Stripe Quick Start - Keys setzen

## Problem
Fehlermeldung: "Stripe secret key not configured"

## ✅ Lösung (2 Minuten)

### 1. Öffne `apps/cloud-api/.env`

### 2. Füge diese Zeilen hinzu:

```env
# Stripe Testmode
STRIPE_ENV=test
STRIPE_SECRET_KEY_TEST=sk_test_DEIN_KEY_HIER

# Stripe Price IDs (EUR) - erstmal optional, wenn du nur TND testest
STRIPE_PRICE_STARTER_MONTHLY_EUR=price_...
STRIPE_PRICE_STARTER_YEARLY_EUR=price_...
STRIPE_PRICE_PRO_MONTHLY_EUR=price_...
STRIPE_PRICE_PRO_YEARLY_EUR=price_...

# Stripe Price IDs (TND) - wenn du TND testest
STRIPE_PRICE_STARTER_MONTHLY_TND=price_...
STRIPE_PRICE_STARTER_YEARLY_TND=price_...
STRIPE_PRICE_PRO_MONTHLY_TND=price_...
STRIPE_PRICE_PRO_YEARLY_TND=price_...
```

### 3. ⚠️ WICHTIG: Secret Key rotieren!

Falls du deinen Stripe Secret Key (`sk_test_...`) irgendwo öffentlich gepostet hast:

1. Gehe zu [Stripe Dashboard](https://dashboard.stripe.com/test/apikeys)
2. Klicke auf deinen Secret Key → **"Roll key"** oder **"Rotate"**
3. Kopiere den **neuen** Key
4. Setze ihn in `.env` als `STRIPE_SECRET_KEY_TEST`

### 4. Stripe Products & Prices anlegen

Im Stripe Dashboard:

1. Gehe zu **Products** → **Add product**
2. Erstelle für jeden Plan:

   **Product: Caisty Starter**
   - Price: **39 TND / month** (Recurring)
   - Kopiere die **Price ID** (`price_...`)
   - Setze in `.env`: `STRIPE_PRICE_STARTER_MONTHLY_TND=price_...`

   **Product: Caisty Pro**
   - Price: **99 TND / month** (Recurring)
   - Kopiere die **Price ID**
   - Setze in `.env`: `STRIPE_PRICE_PRO_MONTHLY_TND=price_...`

### 5. Backend neu starten

```bash
# Stoppe Backend (Ctrl+C)
cd apps/cloud-api
pnpm dev
```

### 6. Testen

1. Öffne `http://localhost:5173/portal/checkout?plan=starter`
2. Wähle **Kreditkarte**
3. Klicke **"Mit Kreditkarte bezahlen"**
4. Du solltest zu Stripe Checkout weitergeleitet werden ✅

---

## 🚨 Wenn "Stripe Price ID not configured" Fehler kommt

→ Du musst die Price IDs in Stripe Dashboard anlegen und in `.env` setzen.

Siehe `STRIPE_SETUP.md` für vollständige Anleitung.

