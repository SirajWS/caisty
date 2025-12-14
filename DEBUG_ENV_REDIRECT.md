# 🔍 Debug: Redirect auf Admin statt Kundenportal

## Schritt 1: ENV-Variablen prüfen

Führe aus:

```bash
cd apps/cloud-api
node check-env.js
```

**Erwartete Ausgabe:**
```
✅ Final PORTAL_BASE_URL: http://localhost:5173
✅ PORTAL_BASE_URL ist korrekt!
```

**Wenn Fehler:**
```
❌ ERROR: PORTAL_BASE_URL zeigt auf Admin-Port!
   Ändere in .env: PORTAL_BASE_URL=http://localhost:5173
```

---

## Schritt 2: `.env` Datei prüfen

Öffne `apps/cloud-api/.env` und suche nach:

```env
# ❌ FALSCH - entfernen oder ändern:
PORTAL_BASE_URL=http://localhost:5175

# ✅ RICHTIG:
PORTAL_BASE_URL=http://localhost:5173
ADMIN_BASE_URL=http://localhost:5175
```

**Wichtig:** Wenn `PORTAL_BASE_URL` in `.env` auf `5175` steht, wird das verwendet!

---

## Schritt 3: Backend-Logs beim Start prüfen

Starte Backend neu:

```bash
cd apps/cloud-api
pnpm dev
```

**Suche nach:**
- `⚠️ WARNING: PORTAL_BASE_URL zeigt auf Admin-Port!` → Dann ist ENV falsch
- `portalBaseUrl: http://localhost:5173` → Dann ist ENV korrekt

---

## Schritt 4: Browser DevTools prüfen

1. Öffne Browser DevTools → **Network** Tab
2. Logge dich ein (Google oder Email/Passwort)
3. Schaue nach dem **Redirect-Request** (Status 302 oder 307)
4. Prüfe den **Location** Header:
   - ✅ Sollte sein: `http://localhost:5173/portal/login/success?token=...`
   - ❌ Falsch wäre: `http://localhost:5175/...`

---

## Schritt 5: Frontend prüfen

Öffne Browser DevTools → **Console** und prüfe:

1. Nach Login: Wird `navigate("/portal")` aufgerufen?
2. Auf welcher URL landest du dann?

---

## Häufige Ursachen

### 1. `.env` hat falschen Wert
→ Lösung: Ändere `PORTAL_BASE_URL=http://localhost:5173` in `.env`

### 2. Backend nicht neu gestartet
→ Lösung: Backend neu starten (ENV wird nur beim Start geladen)

### 3. Mehrere `.env` Dateien
→ Lösung: Prüfe, ob `.env.local` oder andere ENV-Dateien existieren

### 4. Browser-Cache
→ Lösung: Hard Refresh (Ctrl+Shift+R) oder Incognito-Modus

---

## Quick Fix

Wenn alles andere fehlschlägt:

1. **Entferne** `PORTAL_BASE_URL` komplett aus `.env`
2. Backend neu starten
3. Dann wird der Default (`http://localhost:5173`) verwendet

