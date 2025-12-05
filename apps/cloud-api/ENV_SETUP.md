# 🔐 Google OAuth - ENV Setup

## ✅ Deine Google OAuth Credentials

Trage folgende Werte in `apps/cloud-api/.env` ein:

```env
GOOGLE_CLIENT_ID=1050646575618-q3914dm02c3nptcerj0ihd7u58mu58v1.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=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
GOOGLE_REDIRECT_URI=http://127.0.0.1:3333/portal/auth/google/callback
PORTAL_BASE_URL=http://localhost:5175
```

## 📝 Anleitung

1. Öffne `apps/cloud-api/.env` in deinem Editor
2. Füge die obigen Zeilen hinzu (oder ersetze die Platzhalter, falls bereits vorhanden)
3. **Wichtig:** Verwende `127.0.0.1` (nicht `localhost`) für `GOOGLE_REDIRECT_URI`, da du es so in Google Console eingetragen hast
4. Speichere die Datei
5. **Server neu starten** (siehe unten)

## 🚀 Server neu starten

Nach dem Speichern der `.env` Datei:

1. Stoppe den Server: `Ctrl + C` im Terminal
2. Starte neu:
   ```bash
   cd C:\Users\T460\Desktop\caisty
   pnpm dev
   ```

## ✅ Testen

1. Öffne `http://localhost:5175/login`
2. Klicke auf "Mit Google anmelden"
3. Du solltest jetzt zu Google weitergeleitet werden! 🎉

