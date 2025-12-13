# 🚨 Quick Fix: Redirect auf Admin statt Kundenportal

## Problem
Nach Login im Kundenportal (5173) landet man auf Admin (5175).

## ✅ Lösung in 2 Schritten

### 1. Backend `.env` prüfen und korrigieren

Öffne `apps/cloud-api/.env` und prüfe:

```env
# ❌ FALSCH - entfernen oder ändern:
PORTAL_BASE_URL=http://localhost:5175

# ✅ RICHTIG - so sollte es sein:
PORTAL_BASE_URL=http://localhost:5173
ADMIN_BASE_URL=http://localhost:5175
```

**Wichtig:** Wenn `PORTAL_BASE_URL` auf `5175` steht, wird das verwendet und überschreibt den Default!

### 2. Backend **neu starten** (wichtig!)

ENV-Variablen werden nur beim Start geladen:

```bash
# Stoppe Backend (Ctrl+C im Terminal)
# Dann neu starten:
cd apps/cloud-api
pnpm dev
```

### 3. Prüfen ob es funktioniert

Beim Backend-Start solltest du in den Logs sehen:
```
portalBaseUrl: http://localhost:5173
```

**NICHT** `http://localhost:5175`!

---

## 🔍 Debug: Was passiert wirklich?

### Backend-Log prüfen

Wenn du Google OAuth nutzt, schaue in die Backend-Logs beim Start nach:
```
Google OAuth config check { portalBaseUrl: '...' }
```

Das sollte `http://localhost:5173` zeigen.

### Browser DevTools prüfen

1. Öffne DevTools → Network
2. Logge dich ein
3. Schaue nach dem Redirect-Request
4. Die `Location` Header sollte `http://localhost:5173/portal/login/success?token=...` sein

---

## 🚨 Wenn es immer noch nicht funktioniert

### Prüfe, ob mehrere `.env` Dateien existieren

```bash
cd apps/cloud-api
ls -la .env*
```

Sollte nur `.env` geben. Wenn mehrere existieren, prüfe welche Werte drin stehen.

### Prüfe, ob ENV wirklich geladen wird

Füge temporär in `apps/cloud-api/src/config/env.ts` ein Log hinzu:

```ts
console.log("🔍 DEBUG PORTAL_BASE_URL:", ENV.PORTAL_BASE_URL);
```

Dann Backend neu starten und prüfen, was geloggt wird.

---

## ✅ Test

1. Backend neu gestartet? ✅
2. `.env` hat `PORTAL_BASE_URL=http://localhost:5173`? ✅
3. Backend-Log zeigt `portalBaseUrl: http://localhost:5173`? ✅
4. Login → Redirect geht zu `localhost:5173`? ✅

Dann sollte es funktionieren! 🎉

