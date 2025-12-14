# 🔐 Stripe Setup - Schritt für Schritt

## ⚠️ WICHTIG: Secret Key rotieren!

Falls du deinen Stripe Secret Key (`sk_test_...`) irgendwo öffentlich gepostet hast:

1. Gehe zu [Stripe Dashboard](https://dashboard.stripe.com/test/apikeys)
2. Klicke auf deinen Secret Key → **"Roll key"** oder **"Rotate"**
3. Der alte Key ist dann ungültig

> **Publishable Key (`pk_test_...`)** darf geteilt werden, **Secret Key nicht!**

---

## 1️⃣ Stripe Products & Prices anlegen

### Im Stripe Dashboard:

1. Gehe zu **Products** → **Add product**
2. Erstelle für jeden Plan einen Product:

   **Product 1: Caisty Starter**
   - Name: `Caisty Starter`
   - Description: `Starter Plan - Ideal für eine Filiale oder einen Standort`
   - Add Price:
     - **Monthly**: €14.99 / month (Recurring)
     - **Yearly**: €152.00 / year (Recurring)
   - Kopiere die **Price IDs** (z.B. `price_1234567890abcdef`)

   **Product 2: Caisty Pro**
   - Name: `Caisty Pro`
   - Description: `Pro Plan - Für Betriebe mit mehreren Kassen`
   - Add Price:
     - **Monthly**: €29.99 / month (Recurring)
     - **Yearly**: €306.00 / year (Recurring)
   - Kopiere die **Price IDs**

### Für TND (falls benötigt):

Wiederhole das gleiche mit TND-Preisen.

---

## 2️⃣ ENV-Variablen setzen

### Backend: `apps/cloud-api/.env`

```env
# Stripe Testmode
STRIPE_ENV=test
STRIPE_SECRET_KEY_TEST=sk_test_DEIN_NEUER_KEY_HIER

# Stripe Price IDs (EUR)
STRIPE_PRICE_STARTER_MONTHLY_EUR=price_1234567890abcdef
STRIPE_PRICE_STARTER_YEARLY_EUR=price_abcdef1234567890
STRIPE_PRICE_PRO_MONTHLY_EUR=price_9876543210fedcba
STRIPE_PRICE_PRO_YEARLY_EUR=price_fedcba0987654321

# Stripe Price IDs (TND) - optional
STRIPE_PRICE_STARTER_MONTHLY_TND=price_...
STRIPE_PRICE_STARTER_YEARLY_TND=price_...
STRIPE_PRICE_PRO_MONTHLY_TND=price_...
STRIPE_PRICE_PRO_YEARLY_TND=price_...
```

### Frontend: `apps/caisty-site/.env.local` (optional, für Stripe Elements später)

```env
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_DEIN_KEY_HIER
```

---

## 3️⃣ Backend neu starten

```bash
cd apps/cloud-api
pnpm dev
```

---

## 4️⃣ Testen

1. Öffne `http://localhost:5173/portal/checkout?plan=starter`
2. Wähle **Kreditkarte**
3. Klicke **"Mit Kreditkarte bezahlen"**
4. Du solltest zu Stripe Checkout weitergeleitet werden

### Stripe Testkarten:

- **Success**: `4242 4242 4242 4242`
- **Decline**: `4000 0000 0000 0002`
- **3DS Required**: `4000 0025 0000 3155`

Beliebige zukünftige Daten für Ablaufdatum, beliebige 3-stellige CVC.

---

## 5️⃣ Webhooks (später)

Für Production brauchst du Webhooks:

1. Stripe Dashboard → **Developers → Webhooks**
2. Add endpoint: `https://api.caisty.com/webhooks/stripe`
3. Events:
   - `checkout.session.completed`
   - `invoice.paid`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
4. Kopiere **Webhook Secret** → `STRIPE_WEBHOOK_SECRET_TEST` in `.env`

---

## ✅ Checkliste

- [ ] Secret Key rotiert (falls öffentlich gepostet)
- [ ] Products & Prices in Stripe angelegt
- [ ] Price IDs kopiert
- [ ] ENV-Variablen gesetzt
- [ ] Backend neu gestartet
- [ ] Testzahlung durchgeführt

---

## 🚨 Troubleshooting

### "Stripe Price ID not configured"

→ Prüfe, ob alle `STRIPE_PRICE_*` Variablen in `.env` gesetzt sind

### "Stripe secret key not configured"

→ Prüfe `STRIPE_SECRET_KEY_TEST` in `.env`

### "Invalid API Key"

→ Key rotiert? Dann neuen Key in `.env` setzen

### Checkout Session fehlgeschlagen

→ Prüfe Backend-Logs für detaillierte Fehlermeldung

