# 🔍 Debug: Redirect auf falschen Port (5175 statt 5173)

## Problem
Nach Login im Kundenportal (5173) landet man auf Admin (5175).

## ✅ Schnell-Fix (3 Schritte)

### 1. Backend `.env` prüfen

Öffne `apps/cloud-api/.env` und stelle sicher, dass **KEINE** dieser Zeilen drin ist:
```env
PORTAL_BASE_URL=http://localhost:5175  # ❌ FALSCH - entfernen!
```

Oder setze explizit:
```env
PORTAL_BASE_URL=http://localhost:5173  # ✅ RICHTIG
ADMIN_BASE_URL=http://localhost:5175    # ✅ RICHTIG
```

### 2. Backend **neu starten** (wichtig!)

ENV-Variablen werden nur beim Start geladen:

```bash
# Stoppe Backend (Ctrl+C)
# Dann neu starten:
cd apps/cloud-api
pnpm dev
```

### 3. Backend-Logs prüfen

Beim Start sollte im Log stehen:
```
portalBaseUrl: http://localhost:5173
```

**NICHT** `http://localhost:5175`!

---

## 🔍 Debug: Was passiert wirklich?

### Backend-Log prüfen

Wenn du Google OAuth nutzt, schaue in die Backend-Logs nach:
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

### Prüfe, ob `.env` die ENV überschreibt

Die ENV-Logik ist:
1. `process.env.PORTAL_BASE_URL` (aus `.env` Datei)
2. Falls nicht gesetzt: `http://localhost:5173` (Default)

**Problem:** Wenn in `.env` `PORTAL_BASE_URL=http://localhost:5175` steht, wird das verwendet!

**Lösung:** Entweder:
- Entferne die Zeile aus `.env` (dann wird Default verwendet)
- Oder setze explizit: `PORTAL_BASE_URL=http://localhost:5173`

### Prüfe, ob mehrere `.env` Dateien existieren

```bash
cd apps/cloud-api
ls -la .env*
```

Sollte nur `.env` geben (oder `.env.local`). Wenn mehrere existieren, prüfe welche Werte drin stehen.

---

## ✅ Test

1. Backend neu gestartet? ✅
2. `.env` hat `PORTAL_BASE_URL=http://localhost:5173`? ✅
3. Backend-Log zeigt `portalBaseUrl: http://localhost:5173`? ✅
4. Login → Redirect geht zu `localhost:5173`? ✅

Dann sollte es funktionieren! 🎉

