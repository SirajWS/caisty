# Hotfix: Portal Business API + POS Portal Links (Production)

**Date:** July 4, 2026

## Root cause (confirmed)

Live probe of `https://api.caisty.com`:

```json
GET /health        → 200 OK (database connected)
GET /portal/me     → 401 invalid_token (route exists)
GET /portal/business → 404 {"message":"Route GET:/portal/business not found"}
```

The **frontend is correct** — `portalApi.ts` calls `https://api.caisty.com/portal/business` in production builds.

The **production cloud-api deployment is outdated** and does not include `registerPortalBusinessRoutes()` from `portal-business.ts` (added in commit `5b7daa1`).

The SPA route `https://www.caisty.com/portal/business` works; only the **API** behind the portal page fails.

---

## Required production actions

### 1. Redeploy `cloud-api` from current `main`

Ensure the running process includes:

- `import { registerPortalBusinessRoutes } from "./routes/portal-business.js"`
- `await registerPortalBusinessRoutes(app)` in `server.ts`

After deploy, verify:

```bash
curl https://api.caisty.com/health
# Expect: "portalBusinessRoute": true

curl https://api.caisty.com/portal/business
# Expect: 401 {"ok":false,"error":"unauthorized"}  (NOT Fastify route 404)
```

### 2. Run DB migration (if not applied)

```bash
# Migration 017 — business_profiles table
apps/cloud-api/drizzle/017_business_profiles.sql
```

Without this table, the route returns **503 migration_required**, not 404.

### 3. Rebuild & redeploy `caisty-site` (optional but recommended)

Added `apps/caisty-site/.env.production`:

```env
VITE_CLOUD_API_URL=https://api.caisty.com
```

### 4. Rebuild POS 0.3.1+ installer

In `Caisty-Pos/` added `.env.production`:

```env
VITE_CLOUD_API_URL=https://api.caisty.com
VITE_CLOUD_PORTAL_URL=https://www.caisty.com/portal
```

Fixes in POS:

- `cloud.js` — `VITE_CLOUD_PORTAL_URL=https://www.caisty.com/portal` now resolves to business URL `…/portal/business`
- `openExternal.js` — uses `@tauri-apps/plugin-shell` `open()` (shell plugin is registered; opener plugin was not)

---

## Code changes (this hotfix)

| Repo / path | Change |
|-------------|--------|
| `apps/cloud-api/src/routes/health.ts` | `portalBusinessRoute` flag in `/health` |
| `apps/cloud-api/src/server.ts` | Startup log if `/portal/business` missing |
| `apps/caisty-site/.env.production` | Explicit API URL for Vercel builds |
| `apps/caisty-site/.env.example` | Document env vars |
| `Caisty-Pos/src/config/cloud.js` | Normalize `VITE_CLOUD_PORTAL_URL` |
| `Caisty-Pos/src/utils/openExternal.js` | Shell plugin open |
| `Caisty-Pos/.env.production` | Production portal + API URLs |

---

## Frontend API URL (verified)

`apps/caisty-site/src/lib/portalApi.ts`:

```typescript
const RAW_API_BASE = import.meta.env.VITE_CLOUD_API_URL ||
  (import.meta.env.DEV ? "http://localhost:3333" : "https://api.caisty.com");
```

Production builds **do not** hit `www.caisty.com` for API calls unless `VITE_CLOUD_API_URL` is wrongly set to the site origin.

Vercel rewrites `/portal/*` → `index.html` only; they do not proxy API traffic.

---

## POS portal buttons

| Component | URL used |
|-----------|----------|
| `CloudAdminUi.jsx` → Open Customer Portal | `CLOUD_PORTAL_BUSINESS_URL` |
| `LicenseSeats.jsx`, `LicenseLock.jsx`, `POS.jsx` | `CLOUD_PORTAL_LOGIN_URL` |

Production defaults (no env): `https://www.caisty.com/portal/business` and `https://www.caisty.com/login`.

---

## Checklist after deploy

- [ ] `curl https://api.caisty.com/health` → `"portalBusinessRoute": true`
- [ ] Log in at `https://www.caisty.com/portal/business` — no route 404
- [ ] Save business profile — PATCH succeeds
- [ ] POS 0.3.1+ — “Open Customer Portal” opens `https://www.caisty.com/portal/business`
