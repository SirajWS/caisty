# 🗄️ Migration: customer_auth_providers Tabelle

## Problem

Wenn du auf "Mit Google anmelden" klickst und zu Google weitergeleitet wirst, aber dann zurück zu `/login?error=oauth_error` kommst, fehlt wahrscheinlich die `customer_auth_providers` Tabelle in der Datenbank.

## ✅ Lösung: Migration ausführen

### Option 1: Mit psql (Empfohlen)

1. **Öffne ein Terminal** (PowerShell oder Command Prompt)

2. **Verbinde dich zur Datenbank:**
   ```powershell
   psql $env:DATABASE_URL
   ```
   
   Oder manuell:
   ```powershell
   psql -h localhost -U caisty -d caisty
   ```
   
   Passwort: `devpassword` (oder was in deiner `DATABASE_URL` steht)

3. **Führe die Migration aus:**
   ```sql
   \i drizzle/007_add_customer_auth_providers.sql
   ```
   
   Oder kopiere den Inhalt der Datei direkt in psql:
   ```sql
   CREATE TABLE IF NOT EXISTS customer_auth_providers (
     id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
     customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
     provider TEXT NOT NULL,
     provider_user_id TEXT,
     provider_email TEXT,
     provider_data TEXT,
     created_at TIMESTAMP NOT NULL DEFAULT NOW()
   );
   
   CREATE UNIQUE INDEX IF NOT EXISTS uniq_provider_user
     ON customer_auth_providers(provider, provider_user_id);
   
   CREATE INDEX IF NOT EXISTS idx_customer_auth_providers_customer_id
     ON customer_auth_providers(customer_id);
   ```

4. **Prüfe, ob die Tabelle erstellt wurde:**
   ```sql
   \dt customer_auth_providers
   ```
   
   Du solltest eine Zeile sehen → ✅

5. **Verlasse psql:**
   ```sql
   \q
   ```

### Option 2: Mit Drizzle Kit (falls konfiguriert)

```bash
cd apps/cloud-api
pnpm drizzle-kit push
```

## ✅ Nach der Migration

1. **Server neu starten:**
   ```bash
   cd C:\Users\T460\Desktop\caisty
   pnpm dev
   ```

2. **Google Login testen:**
   - Öffne `http://localhost:5175/login`
   - Klicke "Mit Google anmelden"
   - Wähle deinen Google Account
   - Du solltest jetzt erfolgreich eingeloggt werden! 🎉

## 🔍 Troubleshooting

### Fehler: "relation customer_auth_providers does not exist"

→ Die Migration wurde noch nicht ausgeführt. Führe Option 1 oder 2 oben aus.

### Fehler: "duplicate key value violates unique constraint"

→ Die Tabelle existiert bereits. Das ist OK, du kannst fortfahren.

### Fehler: "permission denied"

→ Prüfe, ob dein Datenbank-User die nötigen Rechte hat. Normalerweise sollte das mit dem Standard-User funktionieren.

## 📝 SQL-Datei

Die Migration liegt unter:
```
apps/cloud-api/drizzle/007_add_customer_auth_providers.sql
```

