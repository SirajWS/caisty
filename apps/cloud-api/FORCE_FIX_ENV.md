# 🔧 FORCE FIX: PORTAL_BASE_URL auf 5173 setzen

## Problem
Nach Google Login landet man auf Admin (5175) statt Kundenportal (5173).

## ✅ Lösung (garantiert)

### Schritt 1: Öffne `apps/cloud-api/.env`

### Schritt 2: Suche nach `PORTAL_BASE_URL`

Falls diese Zeile existiert:
```env
PORTAL_BASE_URL=http://localhost:5175
```

**LÖSCHE sie komplett** oder ändere zu:
```env
PORTAL_BASE_URL=http://localhost:5173
```

### Schritt 3: Stelle sicher, dass diese Zeilen drin sind:

```env
# Kundenportal (caisty-site) - Port 5173
PORTAL_BASE_URL=http://localhost:5173

# Admin (cloud-admin) - Port 5175
ADMIN_BASE_URL=http://localhost:5175
```

### Schritt 4: Backend **SOFORT neu starten**

```bash
# 1. Stoppe Backend (Ctrl+C)
# 2. Dann:
cd apps/cloud-api
pnpm dev
```

### Schritt 5: Prüfen beim Start

Beim Backend-Start solltest du sehen:
```
portalBaseUrl: http://localhost:5173
```

**KEINE** Warnung mehr!

---

## 🚨 Wenn es IMMER NOCH nicht funktioniert

### Option A: ENV komplett entfernen (nutzt dann Default)

1. Öffne `apps/cloud-api/.env`
2. **Lösche** die Zeile `PORTAL_BASE_URL=...` komplett
3. Backend neu starten
4. Dann wird automatisch `http://localhost:5173` verwendet (Default)

### Option B: Hardcoded Fix (temporär)

Falls nichts hilft, können wir temporär in `env.ts` hardcoden:

```ts
PORTAL_BASE_URL: "http://localhost:5173", // Hardcoded für jetzt
```

Aber das sollte nicht nötig sein - die ENV sollte funktionieren.

---

## 🔍 Debug: Was passiert wirklich?

### Browser DevTools → Network Tab

1. Öffne DevTools → Network
2. Logge dich mit Google ein
3. Schaue nach dem **Redirect-Request** (302 oder 307)
4. Prüfe den **Location** Header:
   - ✅ Sollte sein: `http://localhost:5173/portal/login/success?token=...`
   - ❌ Falsch wäre: `http://localhost:5175/...`

Wenn der Location Header auf `5173` zeigt, aber du trotzdem auf `5175` landest, ist es ein Frontend-Problem.

---

## ✅ Test

Nach dem Fix:

1. Backend neu gestartet? ✅
2. `node check-env.js` zeigt `http://localhost:5173`? ✅
3. Google Login → Redirect zu `localhost:5173`? ✅

Dann sollte es funktionieren! 🎉

