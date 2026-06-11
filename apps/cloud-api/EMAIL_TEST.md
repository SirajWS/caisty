# 🧪 E-Mail-Test Anleitung

## ✅ SMTP-Variablen wurden gesetzt

Die folgenden Variablen wurden in `apps/cloud-api/.env` hinzugefügt:

```env
SMTP_HOST=smtp.zoho.eu
SMTP_PORT=587
SMTP_USER=admin@caisty.com
SMTP_PASSWORD=UiEgEkrRxUw5
SMTP_FROM="Caisty Support <support@caisty.com>"
```

## 🔄 Nächste Schritte

### 1. Server neu starten

**Wichtig:** Der Server muss neu gestartet werden, damit die neuen ENV-Variablen geladen werden!

```bash
# Im Terminal, wo der Server läuft:
# 1. Server stoppen (Ctrl+C)
# 2. Neu starten:
cd apps/cloud-api
pnpm dev
```

### 2. Test-E-Mail senden

Nach dem Neustart kannst du eine Test-E-Mail senden:

**Option A: Test-Endpoint (empfohlen)**
```
GET http://localhost:3333/test-email?to=siraj@caisty.com
```

Oder im Browser öffnen:
```
http://localhost:3333/test-email?to=siraj@caisty.com
```

**Option B: Password Reset testen**
1. Gehe zu `http://localhost:5175/forgot-password`
2. Gib eine E-Mail-Adresse ein (z.B. `siraj@caisty.com`)
3. Prüfe dein Zoho Postfach

### 3. Server-Logs prüfen

Im Server-Terminal solltest du folgende Logs sehen:

**Bei erfolgreichem Versand:**
```
[EMAIL] 🔧 Konfiguriere SMTP: smtp.zoho.eu:587 (User: admin@caisty.com)
[EMAIL] 📧 Versende E-Mail an siraj@caisty.com...
[EMAIL] Von: Caisty Support <support@caisty.com>
[EMAIL] Betreff: Reset your password - Caisty Portal
[EMAIL] ✅ E-Mail erfolgreich gesendet an siraj@caisty.com
[EMAIL] Message-ID: <...>
[EMAIL] Response: 250 Message queued for delivery
```

**Bei Fehler:**
```
[EMAIL] ❌ Fehler beim Senden der E-Mail:
[EMAIL] Error Code: ...
[EMAIL] Error Message: ...
```

## ⚠️ Häufige Probleme

### Problem: "SMTP_USER oder SMTP_PASSWORD nicht gesetzt"
**Lösung:** Server neu starten! Die ENV-Variablen werden nur beim Start geladen.

### Problem: "Authentication failed"
**Lösung:** 
- Prüfe, ob das App-Passwort korrekt ist
- Stelle sicher, dass 2FA für den Zoho-Account aktiviert ist
- Prüfe, ob `admin@caisty.com` als SMTP_USER korrekt ist

### Problem: "Connection timeout"
**Lösung:**
- Prüfe Firewall-Einstellungen (Port 587 muss offen sein)
- Versuche Port 465 mit `secure: true` (SSL statt TLS)

### Problem: E-Mail kommt nicht an
**Lösung:**
- Prüfe Spam-Ordner
- Prüfe Server-Logs auf Fehler
- Stelle sicher, dass die E-Mail-Adresse existiert

## 📧 E-Mail sollte ankommen

Nach erfolgreichem Versand solltest du im Zoho Postfach eine E-Mail von "Caisty Support <support@caisty.com>" erhalten.

