# 📧 E-Mail-Versand Setup (Zoho Mail)

## Konfiguration

Das Password-Reset-System nutzt **Zoho Mail** über SMTP. Die E-Mail-Funktionalität funktioniert sowohl lokal als auch nach Deploy.

## 🔧 Zoho Mail SMTP-Einstellungen

### 1. Zoho App-Passwort erstellen

1. Gehe zu [Zoho Account Security](https://accounts.zoho.com/home#security/app-passwords)
2. Klicke auf "Generate New Password"
3. Gib einen Namen ein (z.B. "Caisty API")
4. Kopiere das generierte App-Passwort (wird nur einmal angezeigt!)

### 2. ENV-Variablen setzen

Füge folgende Variablen zu deiner `.env` Datei hinzu:

```env
# SMTP / E-Mail-Konfiguration (Zoho Mail)
# Ein App-Passwort reicht für alle E-Mails (Portal, Admin, etc.)
SMTP_HOST=smtp.zoho.eu
SMTP_PORT=587
SMTP_USER=admin@caisty.com
SMTP_PASSWORD=UiEgEkrRxUw5
SMTP_FROM="Caisty Support <support@caisty.com>"
```

**Wichtig:**
- `SMTP_HOST`: `smtp.zoho.eu` (für EU-Server) oder `smtp.zoho.com` (für US-Server)
- `SMTP_USER`: Die E-Mail-Adresse, mit der du dich am SMTP-Server anmeldest (z.B. `admin@caisty.com`)
- `SMTP_PASSWORD`: Das **App-Passwort** (nicht dein normales Passwort!)
- `SMTP_FROM`: Absender im Format `"Name <email@domain.com>"` - kann jede Alias-Adresse sein (support@, billing@, etc.)

**💡 Tipp:** Ein App-Passwort reicht! Du kannst mit `admin@caisty.com` einloggen, aber E-Mails als `support@caisty.com`, `billing@caisty.com`, etc. versenden, solange diese Aliase sind.

### 3. Alternative: Andere E-Mail-Provider

Du kannst auch andere SMTP-Provider verwenden:

**Gmail:**
```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=deine-email@gmail.com
SMTP_PASSWORD=app-passwort
```

**Resend (API-basiert):**
- Aktuell nicht implementiert, aber möglich
- Würde `nodemailer` durch Resend SDK ersetzen

## 🧪 Testing

### Lokal testen

1. Setze die ENV-Variablen in `.env`
2. Starte den Server: `pnpm dev`
3. Teste Password Reset im Portal oder Admin
4. Prüfe dein E-Mail-Postfach

### Ohne SMTP-Credentials (Development)

Wenn `SMTP_USER` oder `SMTP_PASSWORD` nicht gesetzt sind:
- E-Mails werden **nicht** versendet
- In Development wird der Reset-Link in der Response zurückgegeben
- In Production würde ein Fehler geloggt werden

## 📝 E-Mail-Templates

Die E-Mail-Templates sind in `apps/cloud-api/src/lib/email.ts` definiert:
- `sendPasswordResetEmail()` - Für Portal-Kunden
- `sendAdminPasswordResetEmail()` - Für Admin-User

Beide Templates sind HTML-basiert und enthalten:
- Professionelles Design
- Reset-Link als Button
- Plain-Text-Fallback
- Sicherheitshinweise

## 🚀 Production

Nach Deploy:
1. Setze die ENV-Variablen in deinem Hosting-Provider (Vercel, Render, etc.)
2. Verwende das **App-Passwort** (nicht das normale Passwort!)
3. Teste einmalig, ob E-Mails ankommen

## ⚠️ Troubleshooting

**E-Mails kommen nicht an:**
1. Prüfe, ob `SMTP_USER` und `SMTP_PASSWORD` gesetzt sind
2. Prüfe die Server-Logs auf Fehler
3. Stelle sicher, dass du ein **App-Passwort** verwendest (nicht das normale Passwort)
4. Prüfe Spam-Ordner

**"Email sending failed" in Logs:**
- SMTP-Credentials falsch
- Firewall blockiert Port 587
- Zoho Account hat 2FA nicht aktiviert (benötigt für App-Passwörter)

