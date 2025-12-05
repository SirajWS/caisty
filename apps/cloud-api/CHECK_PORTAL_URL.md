# ⚠️ WICHTIG: PORTAL_BASE_URL prüfen

## Problem: Admin-Seite öffnet sich statt Portal

Wenn nach dem Google Login die **Admin-Seite** (Port 5173) statt des **Kundenportals** (Port 5175) öffnet, liegt das an einer falschen `PORTAL_BASE_URL`.

## ✅ Lösung

### 1. Prüfe `.env` Datei

Öffne `apps/cloud-api/.env` und stelle sicher, dass:

```env
PORTAL_BASE_URL=http://localhost:5175
```

**NICHT:**
- ❌ `http://localhost:5173` (das ist die Admin-App!)
- ✅ `http://localhost:5175` (das ist die Portal-App!)

### 2. Ports im Überblick

- **5173** = `cloud-admin` (Admin-Dashboard für Caisty-Mitarbeiter)
- **5175** = `caisty-site` (Kundenportal für Endkunden)

### 3. Server neu starten

Nach Änderung der `.env`:

```bash
# Stoppe Server (Ctrl+C)
# Starte neu:
pnpm dev
```

### 4. Testen

1. Öffne `http://localhost:5175/login` (Portal, nicht Admin!)
2. Klicke "Mit Google anmelden"
3. Du solltest jetzt im **Kundenportal** landen, nicht im Admin!

## 🔍 Prüfen, welche App läuft

- Admin: `http://localhost:5173` → zeigt "Caisty Admin" im Header
- Portal: `http://localhost:5175` → zeigt "Caisty POS & Cloud Platform" im Header

