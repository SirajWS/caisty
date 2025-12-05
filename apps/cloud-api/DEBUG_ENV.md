# 🔍 Debug: Google OAuth ENV-Variablen prüfen

## Problem: "Google OAuth not configured" erscheint weiterhin

Wenn die Fehlermeldung weiterhin erscheint, prüfe folgendes:

## ✅ Checkliste

### 1. `.env` Datei existiert und liegt im richtigen Verzeichnis?

**Pfad:** `C:\Users\T460\Desktop\caisty\apps\cloud-api\.env`

Die Datei muss **genau** hier liegen, nicht im Root-Verzeichnis!

### 2. `.env` Datei enthält die richtigen Zeilen?

Öffne `apps/cloud-api/.env` und prüfe, ob folgende Zeilen vorhanden sind:

```env
GOOGLE_CLIENT_ID=1050646575618-q3914dm02c3nptcerj0ihd7u58mu58v1.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=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
GOOGLE_REDIRECT_URI=http://127.0.0.1:3333/portal/auth/google/callback
PORTAL_BASE_URL=http://localhost:5175
```

**Wichtig:**
- ✅ Keine Leerzeichen vor/nach `=`
- ✅ Keine Anführungszeichen um die Werte
- ✅ Keine Kommentare am Ende der Zeilen (z.B. `# comment`)
- ✅ Jede Variable auf einer eigenen Zeile

### 3. Server wurde neu gestartet?

**Nach JEDER Änderung an `.env` muss der Server neu gestartet werden!**

1. Stoppe: `Ctrl + C` im Terminal
2. Starte neu: `pnpm dev`

### 4. Server-Logs prüfen

Wenn du den Server startest, solltest du in den Logs sehen:
- `Cloud API listening on http://127.0.0.1:3333`

Wenn du dann `/portal/auth/google` aufrufst, siehst du in den Logs:
- `Google OAuth config check` mit den Werten

### 5. Manuelle Prüfung

Falls es immer noch nicht funktioniert, teste manuell:

1. Öffne ein neues Terminal
2. Führe aus:
   ```bash
   cd apps/cloud-api
   node -e "require('dotenv/config'); console.log('CLIENT_ID:', process.env.GOOGLE_CLIENT_ID);"
   ```
3. Du solltest deine Client ID sehen

## 🐛 Häufige Fehler

### Fehler 1: `.env` im falschen Verzeichnis
- ❌ `C:\Users\T460\Desktop\caisty\.env` (falsch)
- ✅ `C:\Users\T460\Desktop\caisty\apps\cloud-api\.env` (richtig)

### Fehler 2: Leerzeichen in `.env`
- ❌ `GOOGLE_CLIENT_ID = 1050646575618...` (falsch - Leerzeichen)
- ✅ `GOOGLE_CLIENT_ID=1050646575618...` (richtig)

### Fehler 3: Server nicht neu gestartet
- Nach `.env` Änderungen **IMMER** Server neu starten!

### Fehler 4: Falsche Dateiendung
- ❌ `.env.txt` (falsch)
- ✅ `.env` (richtig - keine Endung!)

## 📝 Beispiel `.env` Datei

```env
DATABASE_URL=postgresql://user:password@localhost:5432/caisty
JWT_SECRET=your-secret-key-here
PORT=3333
NODE_ENV=development

GOOGLE_CLIENT_ID=1050646575618-q3914dm02c3nptcerj0ihd7u58mu58v1.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=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
GOOGLE_REDIRECT_URI=http://127.0.0.1:3333/portal/auth/google/callback
PORTAL_BASE_URL=http://localhost:5175
```

## ✅ Wenn alles korrekt ist

Nach dem Neustart des Servers:
1. Öffne `http://localhost:5175/login`
2. Klicke "Mit Google anmelden"
3. Du solltest zu Google weitergeleitet werden! 🎉

