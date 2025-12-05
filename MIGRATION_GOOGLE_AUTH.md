# Google OAuth Integration - Migration & Setup

## 📋 Übersicht

Diese Integration fügt Google OAuth als zusätzliche Authentifizierungsmethode zum Caisty Portal hinzu. Kunden können sich nun entweder mit E-Mail+Passwort oder mit Google anmelden.

## 🗄️ Datenbank-Migration

### Neue Tabelle: `customer_auth_providers`

```sql
CREATE TABLE customer_auth_providers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  provider TEXT NOT NULL, -- 'password' | 'google'
  provider_user_id TEXT, -- Bei Google: sub (Subject ID)
  provider_email TEXT, -- E-Mail vom Provider
  provider_data TEXT, -- JSON als String (z.B. Google Profile Picture)
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX uniq_provider_user ON customer_auth_providers(provider, provider_user_id);
```

**Migration ausführen:**
```bash
# Mit Drizzle Kit (falls konfiguriert)
pnpm drizzle-kit push

# Oder manuell mit psql
psql $DATABASE_URL -f migration.sql
```

## 🔧 Umgebungsvariablen

### Option 1: `.env.example` kopieren

```bash
# In apps/cloud-api/
cp .env.example .env
```

Dann die Werte in `.env` anpassen.

### Option 2: Manuell hinzufügen

Füge folgende Variablen zu deiner `apps/cloud-api/.env` hinzu:

```env
# Google OAuth Credentials
GOOGLE_CLIENT_ID=deine-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=dein-client-secret

# OAuth Redirect URI (muss in Google Console registriert sein)
GOOGLE_REDIRECT_URI=http://localhost:3333/portal/auth/google/callback

# Portal Base URL (für Redirects nach Login)
PORTAL_BASE_URL=http://localhost:5175
```

**Wichtig:** Nach Änderungen an `.env` muss der Server neu gestartet werden!

## 🔐 Google Cloud Console Setup

1. Gehe zu [Google Cloud Console](https://console.cloud.google.com/)
2. Erstelle ein neues Projekt oder wähle ein bestehendes
3. Aktiviere **Google+ API** (oder **Google Identity Services**)
4. Gehe zu **APIs & Services > Credentials**
5. Erstelle **OAuth 2.0 Client ID**
6. **Authorized redirect URIs** hinzufügen:
   - Development: `http://localhost:3333/portal/auth/google/callback`
   - Production: `https://deine-domain.com/portal/auth/google/callback`
7. Kopiere **Client ID** und **Client Secret** in `.env`

## 🚀 Funktionalität

### Login-Flows

1. **E-Mail + Passwort** (wie bisher)
   - Funktioniert weiterhin wie gewohnt
   - Erstellt automatisch Provider-Verknüpfung `provider='password'`

2. **Google OAuth** (neu)
   - Klick auf "Mit Google anmelden"
   - Redirect zu Google
   - Nach Bestätigung: Callback mit Token
   - **3 Fälle:**
     - **Fall 1:** Provider-Verknüpfung existiert → Login
     - **Fall 2:** Customer existiert (andere E-Mail), aber keine Google-Verknüpfung → Verknüpfung hinzufügen
     - **Fall 3:** Neuer Customer → Organisation + Customer + Provider-Verknüpfung anlegen

### Keine Doppel-Accounts

- **E-Mail ist die Identität**: Ein Customer pro E-Mail
- Google-Login wird an bestehenden Customer mit derselben E-Mail angehängt
- Wenn Customer nur Google-Auth hat → Login mit Passwort zeigt Fehlermeldung

## 📝 API Endpoints

### `GET /portal/auth/google`
- Redirect zu Google OAuth

### `GET /portal/auth/google/callback?code=...`
- Google Callback Handler
- Tauscht Code gegen Access Token
- Holt User Info von Google
- Erstellt/verknüpft Customer
- Redirect zu `/portal/login/success?token=...`

## 🎨 Frontend

### Login & Register Pages
- Google Login Button hinzugefügt
- Trenner "oder" zwischen Formular und Google Button
- Google Icon (SVG)

### Success Page
- `/portal/login/success` Route
- Speichert Token automatisch
- Redirect zu Dashboard

## ✅ Testing

1. **Neue Registrierung mit Google:**
   - Klick auf "Mit Google anmelden"
   - Wähle Google Account
   - Sollte automatisch Konto erstellen

2. **Login mit bestehendem Google-Account:**
   - Klick auf "Mit Google anmelden"
   - Wähle bereits verknüpften Account
   - Sollte direkt einloggen

3. **Verknüpfung bestehender E-Mail:**
   - Erstelle Account mit E-Mail+Passwort: `test@example.com`
   - Logge dich mit Google aus (gleiche E-Mail)
   - Sollte Account verknüpfen, nicht neu erstellen

4. **Passwort-Login für Google-User:**
   - Erstelle Account mit Google
   - Versuche mit E-Mail+Passwort zu loggen
   - Sollte Fehlermeldung zeigen: "Dieses Konto wurde mit Google erstellt..."

## 🔄 Migration bestehender Accounts

Bestehende Accounts ohne Provider-Verknüpfung:
- Beim nächsten Login wird automatisch `provider='password'` Verknüpfung erstellt
- Keine manuelle Migration nötig

## 📚 Nächste Schritte (Optional)

- [ ] Passwort-Reset Funktionalität
- [ ] E-Mail-Verifizierung
- [ ] Account-Linking UI (mehrere Provider pro Account)
- [ ] Refresh Tokens für längere Sessions

