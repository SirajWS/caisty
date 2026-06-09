# Auth: Lokal vs. Production (Caisty)

Kurzreferenz für `https://www.caisty.com` (Frontend), `https://api.caisty.com` (API), `https://admin.caisty.com` (Admin).

## 1. API-Base-URL (caisty-site)

| Variable (Build-Zeit) | Verwendung |
|----------------------|------------|
| `VITE_CLOUD_API_URL` | Optional. Wenn gesetzt, **exakte** API-Origin ohne trailing slash, z. B. `https://api.caisty.com`. |

**Fallback im Code** (`apps/caisty-site/src/lib/portalApi.ts`):

- `import.meta.env.DEV === true` → `http://localhost:3333`
- sonst → `https://api.caisty.com`

Alle Portal-Auth-Requests gehen an **`${API_BASE}/portal/...`** (kein `/api`-Prefix für Login/Register/Me/Google-Start).

**Billing** (`PortalCheckoutPage.tsx`, `PortalCheckoutSuccessPage.tsx`): `fetch(\`${API_BASE}/api/billing/checkout\`)` — Pfad ist absichtlich `/api/billing/...` und zeigt auf dieselbe API-Origin.

**Lokal:** Vite-Proxy `apps/caisty-site/vite.config.ts` leitet nur **`/api`** → `localhost:3333` um. **`/portal/*` läuft nicht über diesen Proxy** — lokal muss `VITE_CLOUD_API_URL=http://localhost:3333` gesetzt sein (siehe `LOCAL_DEV_SETUP.md`) oder der Browser spricht direkt Port 3333 an.

## 2. Tokens / Cookies

- Portal-JWT liegt im **localStorage** unter `caisty.portal.token` (`portalApi.ts` / `authStorage.ts`).
- **Keine** HttpOnly-Cookies für das Portal-JWT → **kein** SameSite/Secure/Cookie-Domain-Problem für normale `fetch`-Aufrufe mit `Authorization: Bearer …`.
- **Google OAuth:** Full-Page-Redirect Browser → `api.caisty.com` → Google → Callback wieder `api.caisty.com` → Redirect zurück auf **`PORTAL_BASE_URL`** (siehe unten).

## 3. CORS (cloud-api)

`apps/cloud-api/src/server.ts`: `@fastify/cors` mit **`origin: true`** (reflektiert die Request-Origin). Damit sind u. a. `https://www.caisty.com`, `https://caisty.com`, `https://admin.caisty.com` erlaubt, solange der Browser eine Origin sendet.

Portal-`fetch` nutzt standardmäßig **kein** `credentials: "include"` — CORS mit Credentials ist hier kein Thema.

Optional (härter): später `origin` auf eine Whitelist setzen.

## 4. Google OAuth

| Setting | Production-Wert |
|---------|-----------------|
| **Authorized redirect URI (Google Console)** | `https://api.caisty.com/portal/auth/google/callback` |
| **GOOGLE_REDIRECT_URI** (API `.env`) | Muss **bytegenau** dieselbe URI sein wie in Google Console (Default in Code: `https://api.caisty.com/portal/auth/google/callback` wenn `NODE_ENV=production`). |
| **GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET** | In Production-Umgebung der API gesetzt; sonst liefert `GET /portal/auth/google` eine JSON-Fehlermeldung (kein Redirect zu Google). |

**Nach erfolgreichem Login** leitet die API auf:

`{PORTAL_BASE_URL}/portal/login/success?token=...`

**`PORTAL_BASE_URL`** (`apps/cloud-api/src/config/env.ts`):

- Default Production: `https://www.caisty.com`
- Muss die **öffentliche URL des React-Portals** sein (ohne trailing slash), **nicht** `https://admin.caisty.com`.

Fehler in `MIGRATION_GOOGLE_AUTH.md`: dort steht teils `PORTAL_BASE_URL=http://localhost:5175` — für dieses Repo ist das Kundenportal **5173**, nicht Admin 5175.

## 5. Umgebungsvariablen (Überblick)

### cloud-api (Runtime)

| Variable | Pflicht | Hinweis |
|----------|---------|---------|
| `DATABASE_URL` | ja | |
| `JWT_SECRET` | ja | Muss stabil sein; Wechsel invalidiert alle Portal-JWTs. |
| `NODE_ENV` | empfohlen | `production` aktiviert sinnvolle Defaults für Redirect-URIs. |
| `PORT` | nein | Default 3333. |
| `PORTAL_BASE_URL` | empfohlen | Production: `https://www.caisty.com` (Reset-Mail-Links, Google-Return). |
| `GOOGLE_CLIENT_ID` | für Google | |
| `GOOGLE_CLIENT_SECRET` | für Google | |
| `GOOGLE_REDIRECT_URI` | empfohlen | Production: `https://api.caisty.com/portal/auth/google/callback` |
| `ADMIN_BASE_URL` | nein | Default `https://admin.caisty.com` in Production (Admin-E-Mails). |
| SMTP_* | für E-Mail | Ohne SMTP schlägt Versand fehl; Forgot-Password kann trotzdem `ok: true` zurückgeben, Link nur in Dev in der Response. |

Es gibt **kein** separates `CORS_ORIGIN` im Code — alles über `origin: true`.

### caisty-site (Build)

| Variable | Hinweis |
|----------|---------|
| `VITE_CLOUD_API_URL` | Setzen, wenn die API nicht unter `https://api.caisty.com` liegt. |

### cloud-admin (Build)

| Variable | Hinweis |
|----------|---------|
| `VITE_API_BASE_URL` | Production: `https://api.caisty.com` (siehe `apps/cloud-admin/.env.production`). |

## 6. NGINX / Routing

Im Repo ist **keine** Production-Nginx-Config versioniert. Typisch:

- `https://api.caisty.com` → Proxy auf Node (cloud-api), Pfade **`/portal/*`**, **`/api/billing/*`**, **`/health`**, … unverändert durchreichen.
- `https://www.caisty.com` → statisches SPA (caisty-site); **keine** Rewrite-Regel, die `/portal/register` zur API schickt.

Google startet mit **voller Navigation** zu `https://api.caisty.com/portal/auth/google` — die API muss von außen erreichbar sein.

## 7. Typische Ursachen „nur Production kaputt“

1. **`VITE_CLOUD_API_URL`** beim Build auf eine falsche / leere API gesetzt (oder CDN cached altes Bundle).
2. **`JWT_SECRET` / `DATABASE_URL`** auf Production anders oder fehlerhaft → 500 bei Login.
3. **Google:** `GOOGLE_REDIRECT_URI` ≠ Google Console, oder Secrets fehlen.
4. **`PORTAL_BASE_URL`** = Admin-URL oder Tippfehler → Redirect nach OAuth auf falsche Host/Port (**im Code für Production inzwischen nach `https://www.caisty.com` abgesichert**, wenn „admin“/5175 erkannt wird).
5. **orgId null** bei `signPortalToken` nach Passwort-Reset / seltenen Accounts → prüfen DB `customers.org_id`.

## 8. Tests (Production)

1. Netzwerk-Tab: `POST https://api.caisty.com/portal/login` mit 200/401 (kein CORS-Fehler, keine falsche Host-URL).
2. Konsole: Zeile `Caisty Portal API_BASE =` aus `portalApi.ts` — muss `https://api.caisty.com` sein (oder bewusst andere API).
3. Google: `GET https://api.caisty.com/portal/auth/google?state=login` → 302 zu Google (nicht JSON-Fehler).
4. Nach Google: Landung auf `https://www.caisty.com/portal/login/success?token=...` → Redirect nach `/portal`.
5. Forgot Password: E-Mail-Link beginnt mit `https://www.caisty.com/reset-password?token=...`.
