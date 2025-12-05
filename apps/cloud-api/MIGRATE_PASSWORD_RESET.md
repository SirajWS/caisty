# 🔐 Passwort-Reset Migration & Setup

## 📋 Übersicht

Diese Implementierung fügt die "Passwort vergessen" Funktionalität zum Caisty Portal hinzu. Kunden können jetzt ihr Passwort zurücksetzen, wenn sie es vergessen haben.

## 🗄️ Datenbank-Migration

### Neue Tabelle: `portal_password_resets`

```sql
CREATE TABLE IF NOT EXISTS portal_password_resets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  token_hash TEXT NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  used_at TIMESTAMP,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_password_resets_token_hash
  ON portal_password_resets(token_hash);

CREATE INDEX IF NOT EXISTS idx_password_resets_customer_expires
  ON portal_password_resets(customer_id, expires_at, used_at);
```

**Migration ausführen:**
```bash
# Mit psql
psql $env:DATABASE_URL -f drizzle/008_add_password_resets.sql

# Oder manuell in psql:
\i drizzle/008_add_password_resets.sql
```

## 🚀 Funktionalität

### Flow

1. **Passwort vergessen**
   - Kunde klickt auf "Passwort vergessen?" auf der Login-Seite
   - Gibt E-Mail ein
   - Backend generiert Reset-Token (1 Stunde gültig)
   - **Development:** Token-Link wird in Logs ausgegeben
   - **Production:** Token-Link wird per E-Mail gesendet (TODO)

2. **Passwort zurücksetzen**
   - Kunde klickt auf Reset-Link
   - Gibt neues Passwort ein (2x zur Bestätigung)
   - Backend validiert Token (nicht abgelaufen, nicht verwendet)
   - Passwort wird geändert
   - Kunde wird automatisch eingeloggt

### Sicherheitsfeatures

- ✅ Token wird gehasht in DB gespeichert (nicht das rohe Token)
- ✅ Token läuft nach 1 Stunde ab
- ✅ Token kann nur einmal verwendet werden
- ✅ E-Mail-Enumeration verhindert (immer "OK" zurückgeben)
- ✅ Google-User werden ignoriert (haben kein Passwort)

## 📝 API Endpoints

### `POST /portal/auth/forgot-password`
- **Input:** `{ email: string }`
- **Output:** `{ ok: true, message: string, resetLink?: string }` (resetLink nur in Development)

### `POST /portal/auth/reset-password`
- **Input:** `{ token: string, newPassword: string }`
- **Output:** `{ ok: true, token: string, message: string }` (Portal-JWT für automatisches Login)

## 🎨 Frontend

### Neue Seiten

1. **`/forgot-password`** - E-Mail eingeben
2. **`/reset-password?token=...`** - Neues Passwort setzen

### Login-Seite

- "Passwort vergessen?" Link hinzugefügt

## ✅ Testing

1. **Passwort-Reset anfordern:**
   - Gehe zu `/login`
   - Klicke "Passwort vergessen?"
   - Gib eine existierende E-Mail ein
   - In Development: Siehst du den Reset-Link in der Antwort

2. **Passwort zurücksetzen:**
   - Öffne den Reset-Link
   - Gib neues Passwort ein (2x)
   - Du wirst automatisch eingeloggt

3. **Token-Validierung:**
   - Versuche einen bereits verwendeten Token → Fehler
   - Warte 1 Stunde → Token abgelaufen → Fehler

## 🔄 Nächste Schritte (Optional)

- [ ] E-Mail-Versand implementieren (für Production)
- [ ] Rate-Limiting für Reset-Anfragen (z.B. max 3 pro Stunde)
- [ ] Passwort-Stärke-Prüfung (optional)
- [ ] E-Mail-Verifizierung vor Reset (optional)

