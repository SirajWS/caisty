# Google OAuth — ENV Setup (cloud-api)

## Wo die Werte leben

- **`GOOGLE_CLIENT_ID`** und **`GOOGLE_CLIENT_SECRET`** werden in **`apps/cloud-api/.env`** (oder per Hosting-ENV) gesetzt.
- Der Code liest sie über `process.env` in `src/config/env.ts` — **es gibt keine fest eingebauten Production-Secrets im Code.**

## `.env` Beispiel

**Lokal (Kundenportal Vite Port 5173, API 3333):**

```env
GOOGLE_CLIENT_ID=DEINE_CLIENT_ID.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=DEIN_CLIENT_SECRET
GOOGLE_REDIRECT_URI=http://127.0.0.1:3333/portal/auth/google/callback
PORTAL_BASE_URL=http://localhost:5173
```

**Production:**

```env
GOOGLE_CLIENT_ID=DEINE_CLIENT_ID.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=DEIN_CLIENT_SECRET
GOOGLE_REDIRECT_URI=https://api.caisty.com/portal/auth/google/callback
PORTAL_BASE_URL=https://www.caisty.com
```

Nach Änderungen: **API neu starten.**

## Google Cloud Console

Unter **OAuth 2.0 Client** → **Authorized redirect URIs** muss dieselbe URL stehen wie `GOOGLE_REDIRECT_URI` (z. B. Production: `https://api.caisty.com/portal/auth/google/callback`).

## Test

```bash
curl -I "https://api.caisty.com/portal/auth/google"
```

Bei korrekter Konfiguration: **302** nach `https://accounts.google.com/...`.
