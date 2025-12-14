# 🔧 Lokale Entwicklung - ENV Setup

## Port-Konfiguration

- **Kundenportal (caisty-site)**: Port **5173** - Landing Page + Portal
- **Admin (cloud-admin)**: Port **5175** - Admin-Interface

## Problem: Portal läuft auf Prod-URL statt lokal

Wenn du nach dem Login auf `https://www.caisty.com` umgeleitet wirst statt auf `http://localhost:5173`, sind die ENV-Variablen falsch konfiguriert.

---

## ✅ Lösung (5 Minuten)

### 1. Frontend ENV (`apps/caisty-site/.env.local`)

**Erstelle die Datei:** `apps/caisty-site/.env.local`

```env
# API Base URL (Backend)
VITE_CLOUD_API_URL=http://localhost:3333

# Portal Base URL (für Redirects)
VITE_PORTAL_BASE_URL=http://localhost:5173
```

**Wichtig:** Vite liest `.env.local` nur beim Start. **Dev-Server neu starten!**

```bash
# Stoppe den Server (Ctrl+C)
# Dann neu starten:
cd apps/caisty-site
pnpm dev
```

### 2. Backend ENV (`apps/cloud-api/.env`)

**Öffne oder erstelle:** `apps/cloud-api/.env`

**Stelle sicher, dass diese Zeilen drin sind:**

```env
# Development URLs
PUBLIC_API_BASE_URL=http://localhost:3333
PORTAL_BASE_URL=http://localhost:5173  # Kundenportal (caisty-site)
ADMIN_BASE_URL=http://localhost:5175   # Admin (cloud-admin)

# PayPal (Testmode)
PAYPAL_ENV=test
PAYPAL_CLIENT_ID=deine-paypal-client-id
PAYPAL_CLIENT_SECRET=dein-paypal-secret

# Google OAuth (Development)
GOOGLE_CLIENT_ID=deine-google-client-id
GOOGLE_CLIENT_SECRET=dein-google-secret
GOOGLE_REDIRECT_URI=http://localhost:3333/portal/auth/google/callback
```

**Wichtig:** Backend **neu starten** nach ENV-Änderungen!

```bash
# Stoppe den Server (Ctrl+C)
# Dann neu starten:
cd apps/cloud-api
pnpm dev
```

### 3. Google OAuth Redirect URI (wenn du Google Login nutzt)

**In Google Cloud Console:**

1. Gehe zu [Google Cloud Console](https://console.cloud.google.com/)
2. APIs & Services > Credentials
3. Öffne deine OAuth 2.0 Client ID
4. Füge **Authorized redirect URIs** hinzu:
   - ✅ `http://localhost:3333/portal/auth/google/callback` (Development)
   - ✅ `https://api.caisty.com/portal/auth/google/callback` (Production)

**Wichtig:** Beide URIs müssen eingetragen sein!

---

## 🔍 Prüfen ob es funktioniert

### Frontend prüfen:

1. Öffne Browser DevTools → Console
2. Suche nach: `Caisty Portal API_BASE =`
3. Sollte zeigen: `http://localhost:3333` (nicht `https://api.caisty.com`)

### Backend prüfen:

1. Backend-Logs beim Start prüfen
2. Suche nach: `PORTAL_BASE_URL`
3. Sollte zeigen: `http://localhost:5173` (Kundenportal, nicht Admin 5175, nicht Prod)

### Test:

1. Öffne `http://localhost:5173/login`
2. Logge dich ein (Google oder Email/Passwort)
3. Nach Login solltest du auf `http://localhost:5173/portal` landen
4. **NICHT** auf `https://www.caisty.com/portal` oder `http://localhost:5175`

---

## 🚨 Häufige Fehler

### "Immer noch auf Prod-URL?"

1. ✅ **Dev-Server neu gestartet?** (Vite liest ENV nur beim Start)
2. ✅ **Backend neu gestartet?** (Node liest ENV nur beim Start)
3. ✅ **`.env.local` im richtigen Verzeichnis?** (`apps/caisty-site/.env.local`)
4. ✅ **Keine `.env` mit Prod-Werten?** (`.env.local` überschreibt `.env`)

### "Google OAuth redirectet auf Prod?"

1. ✅ **`GOOGLE_REDIRECT_URI` in `.env` auf localhost?**
2. ✅ **Google Console hat localhost URI eingetragen?**
3. ✅ **Backend neu gestartet?**

### "Checkout redirectet auf Prod?"

1. ✅ **`PORTAL_BASE_URL` in Backend `.env` auf localhost?**
2. ✅ **`PUBLIC_API_BASE_URL` in Backend `.env` auf localhost?**
3. ✅ **Backend neu gestartet?**

---

## 📝 Quick Check

Führe aus und prüfe die Ausgabe:

```bash
# Frontend ENV prüfen
cd apps/caisty-site
cat .env.local 2>/dev/null || echo "⚠️ .env.local fehlt!"

# Backend ENV prüfen
cd ../cloud-api
grep -E "PORTAL_BASE_URL|PUBLIC_API_BASE_URL" .env 2>/dev/null || echo "⚠️ .env fehlt oder Variablen nicht gesetzt!"
```

---

## 🎯 Nach dem Fix

Wenn alles korrekt ist:

1. ✅ Login funktioniert lokal
2. ✅ Redirect nach Login bleibt auf `localhost:5173` (Kundenportal, NICHT Admin 5175)
3. ✅ Checkout funktioniert lokal
4. ✅ PayPal Return/Cancel URLs sind lokal
5. ✅ Google OAuth funktioniert lokal
6. ✅ Admin läuft separat auf `localhost:5175`

**Dann kannst du Payment-Tests lokal durchführen!** 🎉

