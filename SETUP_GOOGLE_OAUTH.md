# 🚀 Google OAuth Setup - Schnellstart

## Problem: "Google OAuth not configured"

Wenn du auf "Mit Google anmelden" klickst und eine schwarze Seite mit `{"error":"Google OAuth not configured"}` siehst, fehlen die ENV-Variablen.

## ✅ Lösung in 3 Schritten

### 1. `.env` Datei erstellen/bearbeiten

Öffne oder erstelle `apps/cloud-api/.env` und füge hinzu:

```env
# Google OAuth (für Login mit Google)
GOOGLE_CLIENT_ID=deine-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=dein-client-secret
GOOGLE_REDIRECT_URI=http://localhost:3333/portal/auth/google/callback
PORTAL_BASE_URL=http://localhost:5175
```

**Wichtig:** Ersetze `deine-client-id` und `dein-client-secret` mit echten Werten aus Google Cloud Console!

### 2. Google Cloud Console Setup

1. Gehe zu [Google Cloud Console](https://console.cloud.google.com/)
2. Erstelle ein neues Projekt (oder wähle ein bestehendes)
3. Aktiviere **Google+ API** oder **Google Identity Services**
4. Gehe zu **APIs & Services > Credentials**
5. Klicke auf **+ CREATE CREDENTIALS > OAuth client ID**
6. Wähle **Web application**
7. Füge **Authorized redirect URIs** hinzu:
   - `http://localhost:3333/portal/auth/google/callback` (für Development)
   - `https://deine-domain.com/portal/auth/google/callback` (für Production)
8. Kopiere **Client ID** und **Client Secret** in deine `.env`

### 3. Server neu starten

**Wichtig:** Nach Änderungen an `.env` muss der Server neu gestartet werden!

```bash
# Stoppe den Server (Ctrl+C)
# Dann neu starten:
pnpm dev
```

## ✅ Testen

1. Öffne `http://localhost:5175/login`
2. Klicke auf "Mit Google anmelden"
3. Du solltest jetzt zu Google weitergeleitet werden (nicht mehr die schwarze Fehlerseite)

## 🔍 Troubleshooting

### Immer noch "Google OAuth not configured"?

- ✅ Prüfe, ob `.env` im richtigen Verzeichnis liegt (`apps/cloud-api/.env`)
- ✅ Prüfe, ob die Variablennamen **exakt** so heißen (Groß-/Kleinschreibung beachten!)
- ✅ Prüfe, ob keine Leerzeichen vor/nach den Werten sind
- ✅ **Server neu gestartet?** (Wichtig!)

### Redirect URI Mismatch?

- Die `GOOGLE_REDIRECT_URI` in `.env` muss **exakt** mit der in Google Console übereinstimmen
- Gleiche Domain, gleicher Port, http vs https

### Weitere Hilfe

Siehe `MIGRATION_GOOGLE_AUTH.md` für detaillierte Dokumentation.

