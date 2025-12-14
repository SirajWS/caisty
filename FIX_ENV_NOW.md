# 🚨 SOFORT-FIX: PORTAL_BASE_URL in .env ändern

## Problem
Das ENV-Check zeigt: `PORTAL_BASE_URL=http://localhost:5175` (Admin-Port)

## ✅ Lösung (2 Minuten)

### 1. Öffne `apps/cloud-api/.env`

### 2. Suche nach dieser Zeile:
```env
PORTAL_BASE_URL=http://localhost:5175
```

### 3. Ändere zu:
```env
PORTAL_BASE_URL=http://localhost:5173
ADMIN_BASE_URL=http://localhost:5175
```

### 4. Speichere die Datei

### 5. Backend **neu starten** (wichtig!)

```bash
# Stoppe Backend (Ctrl+C im Terminal wo Backend läuft)
# Dann neu starten:
cd apps/cloud-api
pnpm dev
```

### 6. Prüfen

Beim Start solltest du sehen:
```
portalBaseUrl: http://localhost:5173
```

**KEINE** Warnung mehr!

---

## 🔍 Prüfen ob es funktioniert hat

Führe aus:
```bash
cd apps/cloud-api
node check-env.js
```

**Sollte zeigen:**
```
✅ Final PORTAL_BASE_URL: http://localhost:5173
✅ PORTAL_BASE_URL ist korrekt!
```

**NICHT mehr:**
```
❌ ERROR: PORTAL_BASE_URL zeigt auf Admin-Port!
```

---

## 🚨 Wenn es immer noch nicht funktioniert

### Prüfe, ob mehrere `.env` Dateien existieren:

```bash
cd apps/cloud-api
ls -la .env*
```

Sollte nur `.env` geben. Wenn mehrere existieren, prüfe welche Werte drin stehen.

### Prüfe, ob `.env.local` existiert:

Manchmal überschreibt `.env.local` die `.env`. Prüfe beide Dateien.

