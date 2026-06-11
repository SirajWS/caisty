# Debug: Google OAuth ENV-Variablen prüfen

## Problem: "Google OAuth not configured" oder 500 bei `/portal/auth/google`

Die **echten** Werte kommen **nur** aus `apps/cloud-api/.env` (bzw. Server-Umgebung) — **nicht** aus dem Anwendungscode. Ohne `GOOGLE_CLIENT_ID` und `GOOGLE_CLIENT_SECRET` antwortet die Route mit **500** und JSON-Hinweis statt Redirect zu Google.

## Checkliste

### 1. `.env` liegt unter `apps/cloud-api/.env`

Nicht nur im Repo-Root (außer ihr ladet sie explizit anders).

### 2. Variablen (Beispiel — Platzhalter ersetzen)

**Lokal:**

```env
GOOGLE_CLIENT_ID=DEINE_CLIENT_ID.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=DEIN_CLIENT_SECRET
GOOGLE_REDIRECT_URI=http://127.0.0.1:3333/portal/auth/google/callback
PORTAL_BASE_URL=http://localhost:5173
```

**Production (API unter `https://api.caisty.com`):**

```env
GOOGLE_CLIENT_ID=DEINE_CLIENT_ID.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=DEIN_CLIENT_SECRET
GOOGLE_REDIRECT_URI=https://api.caisty.com/portal/auth/google/callback
PORTAL_BASE_URL=https://www.caisty.com
```

Die **Redirect URI** muss in der **Google Cloud Console** unter „Authorized redirect URIs“ **exakt** so eingetragen sein wie `GOOGLE_REDIRECT_URI`.

**Wichtig:** Keine Leerzeichen um `=`, keine Anführungszeichen um die Werte, Server nach Änderung **neu starten**.

### 3. Manuell prüfen

```bash
cd apps/cloud-api
node -e "require('dotenv/config'); console.log('CLIENT_ID set:', !!process.env.GOOGLE_CLIENT_ID);"
```

### 4. Erwartung bei funktionierendem Setup

```bash
curl -I "https://api.caisty.com/portal/auth/google"
# HTTP/1.1 302
# location: https://accounts.google.com/...
```

## Sicherheit

**Niemals** echte `GOOGLE_CLIENT_SECRET`-Werte in Git committen. Wenn ein Secret je in einem Repo gelandet ist: in der Google Console **neues Secret** erzeugen und das alte widerrufen.
