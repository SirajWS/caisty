# Analyse: Account-Seite — Customer Portal Cleanup (Sprint 1.4)

**Stand:** 2026-07-07  
**Branch:** `staging`  
**Scope:** Nur `/portal/account` — read-only Code- und UX-Analyse  
**Methode:** Review von `PortalAccountPage`, Account-Komponenten, `deriveAccountState`, Übersetzungen, API-Anbindung; Abgleich mit Dashboard-, Business-, Support- und Billing-Seiten  
**Wichtig:** Dieses Dokument ist **nur Analyse**. Keine Code-, UI- oder API-Änderungen.

---

## Executive Summary

Die Account-Seite wurde als **„Account & Security Center“** mit 8 Sektionen und 6 Summary-KPIs aufgebaut. Funktional stark sind **Profile** (Name/Email speichern) und **Password & Security** (Passwort ändern) — beides echte API-Calls.

Das Hauptproblem ist **Überbauung ohne Mehrwert:**

- **6 KPI-Karten** wiederholen Inhalte aus Formularen und Checkliste.
- **5 Sektionen** enthalten Coming-soon- oder Platzhalter-Inhalte als sichtbaren Hauptinhalt.
- Die Seite ist **~1.200–1.500 px** lang — auf einem typischen Desktop mit Portal-Chrome **nicht ohne Scrollen** nutzbar.
- **Legal Documents** (6 Links) und **Security Checklist** (5 Zeilen) verbrauchen viel vertikalen Raum für wenig Interaktion.

**Empfehlung Sprint 1.4:** Auf **3 Kernkarten** fokussieren (Profile · Security · Preferences), Summary-KPIs stark reduzieren oder entfernen, alle Coming-soon-Blöcke aus dem Hauptfluss nehmen, Legal/Support als schmale Footer-Zeile.

---

## 1. Zweck der Account-Seite

### Zielbild (vom Nutzer)

> **„Meine Identität, Login, Sicherheit und Portal-Präferenzen.“**

### Aktueller Subtitle (Code)

*"Your identity, security, and portal preferences — separate from your business profile."*

→ Die Copy trifft das Zielbild **inhaltlich**, die UI **nicht**.

### Ist-Zustand: Welche Frage beantwortet die Seite heute?

| Frage | Beantwortet? | Wo |
|-------|--------------|-----|
| Wer bin ich? (Name, Email) | **Ja** | KPIs + Profile-Formular |
| Wie ändere ich Name/Email? | **Ja** | Profile-Formular (`updatePortalAccount`) |
| Wie ändere ich mein Passwort? | **Ja** | Password-Formular (`changePortalPassword`) |
| Welche Sprache / welches Theme? | **Ja** | Preferences (Selector funktioniert) |
| Bin ich sicher? | **Teilweise** | KPIs + Checklist — viel Placeholder |
| Wo sind meine Sessions? | **Nein** (nur Client-Browser-Guess) | Sessions & Devices |
| Wo sind Legal Docs? | **Ja** (Links) | Eigene große Karte — gehört eher Support/Legal |
| Kann ich Daten exportieren/löschen? | **Nein** | Coming soon |

### Was die Seite **nicht** sein soll (und aktuell auch nicht ist)

| Bereich | Auf Account? |
|---------|--------------|
| Business-Profil | Nein (eigene Seite `/portal/business`) |
| Billing | Nein |
| POS / Geräte | Nein (Sessions zeigt nur Browser-Label) |
| Support-Tickets | Nein (eigene Support-Seite) |

**Fazit:** Die Seite **versucht** Identität + Sicherheit + Präferenzen abzudecken, **überfrachtet** das aber mit Legal Center, Data Export, Session-Platzhalter und doppelten Status-Anzeigen.

---

## 2. Aktuelle Bereiche — vollständige Inventur

Reihenfolge in `PortalAccountPage.tsx`:

| # | Sektion | Komponente | Zweck | Account-relevant? | Wichtig? | Redundant? | Echte Funktion? | Empfehlung |
|---|---------|------------|-------|-------------------|----------|------------|-----------------|------------|
| 1 | **Header** | Inline | Titel + Subtitle | Ja | Ja | Nein | Copy | **Behalten** (Subtitle leicht kürzen) |
| 2 | **Account Summary** | `AccountOverview` | 6 KPI-Karten: Name, Email, Email Status, Role, Language, Security | Teilweise | Niedrig | **Ja** — dupliziert Profile, Prefs, Checklist | Echte Werte aus `customer` | **Entfernen oder max. 3 Status-Pills** |
| 3 | **Profile** | `AccountProfileForm` | Name + Email editieren, Speichern | **Ja** | **Hoch** | Nein | **Ja** — `PATCH /portal/account` | **Behalten** (Kern) |
| 4 | **Password & Security** | `PasswordSecurity` | Passwort ändern + 3 Coming-soon-Zeilen | **Ja** | **Hoch** | Teilweise (2FA in Checklist) | Passwort: **Ja** — API; Rest: Coming soon | **Behalten** — Coming-soon-Liste **entfernen** |
| 5 | **Sessions & Devices** | `AccountSessions` | Browser, „This browser“, „Active now“ + Logout-all | Grenzfall | Niedrig | Ja (Devices-Seite für POS-Geräte) | **Nein** — nur `navigator.userAgent`, keine Session-API | **Entfernen** |
| 6 | **Preferences** | `AccountPreferences` | Sprache, Theme, Notifications | **Ja** | **Hoch** | Nein (Language in KPIs) | Sprache/Theme: **Ja**; Notifications: Coming soon | **Behalten** — Notifications-Zeile **entfernen** |
| 7 | **Legal Documents** | `LegalDocuments` | 6 Legal-Links mit Subtitle | Niedrig | Mittel (Compliance) | Ja (Support `KnowledgeBase` hat Legal-Links) | Links funktionieren | **Verschieben/kompakt** — Footer-Zeile |
| 8 | **Security Checklist** | `SecurityChecklist` | 5 Security-Items mit Status-Badges | Teilweise | Mittel | **Ja** — KPIs + Password-Placeholders | 1 echt (Email), 1 misleading (Password „Pending“), 3 Coming soon | **Reduzieren** → kompakte Security-Status-Zeile |
| 9 | **Data & Export** | `AccountDataExport` | Export, Delete (disabled), Contact support | Niedrig | Niedrig | Support auch auf Support-Seite | Export/Delete: Coming soon; Support: mailto | **Entfernen** — nur Support-Link im Footer |

**Gesamt:** 9 Blöcke, davon **2 funktional zentral**, **3 mit dominierenden Coming-soon-Anteilen**, **4 überwiegend redundant oder falsch platziert**.

---

## 3. Kernbereiche — Fokussierung

### A) Profile ✅ (behalten)

| Feld | Status |
|------|--------|
| Name | Editierbar, API |
| Email | Editierbar, API |
| Save changes | Funktioniert |

→ **Keine strukturelle Änderung nötig**, evtl. kompakteres Panel (weniger Hint-Text).

### B) Password & Security ✅ (behalten, bereinigen)

| Feld | Status |
|------|--------|
| Current password | Funktioniert |
| New password | Funktioniert |
| Repeat password | Funktioniert |
| Change password | Funktioniert |
| 2FA / Login alerts / Recovery email | **Coming soon Liste unter Formular** |

→ Formular **behalten**. Placeholder-Liste (`account-placeholder-list`) **entfernen** — 3 Coming-soon-Zeilen unter einem funktionierenden Formular wirken unfertig.

### C) Preferences ✅ (behalten, straffen)

| Feld | Status |
|------|--------|
| Portal language | `LanguageSelector` — funktioniert |
| Theme | `ThemeToggle` — funktioniert |
| Notifications | **Coming soon** |

→ **Behalten** ohne Notifications-Zeile.

### D) Security status (neu fokussiert statt Checklist + KPIs)

Empfohlene kompakte Darstellung (inline oder kleine Zeile unter Password):

| Status | Quelle | Anzeige |
|--------|--------|---------|
| Email verified | `customer.portalStatus === "active"` | Badge: Verified / Pending |
| Security protected | `securityStatusLabel()` | Badge: Protected / Review |
| 2FA | Nicht implementiert | **Nicht anzeigen** bis Feature da |

**Nicht** als 5-Zeilen-Checklist mit 3× „Coming soon“.

---

## 4. Entfernen / Verschieben / Reduzieren

| Bereich | Aktion | Begründung |
|---------|--------|------------|
| **Sessions & Devices** | **Entfernen** | Keine Session-API; „Active now“ ist erfunden; POS-Geräte gehören auf Devices |
| **Security Checklist** (5 Zeilen) | **Ersetzen** durch 2–3 Status-Badges | Redundant zu KPIs; 60 % Coming soon |
| **Account Summary** (6 KPIs) | **Entfernen oder → 3 Pills** | Name/Email/Language doppelt in Formularen |
| **Legal Documents** (große Karte) | **Verschieben** → Footer „Legal“ | Support/Knowledge Base hat dieselben Links; nicht Account-Kern |
| **Data & Export** (eigene Sektion) | **Entfernen** | 2/3 Actions disabled; Support-Link reicht als Footer |
| **Login alerts** | **Entfernen** | Coming soon |
| **Recovery email** | **Entfernen** | Coming soon (2×: Password + Checklist) |
| **Two-factor authentication** | **Entfernen** aus UI | Coming soon (2×: Password + Checklist) |
| **Logout all devices** | **Entfernen** | Coming soon |
| **Export account data** | **Entfernen** | Coming soon |
| **Delete account request** | **Entfernen** | Coming soon |
| **Notifications** | **Entfernen** | Coming soon |
| **Strong password** (Checklist „Pending“) | **Entfernen** | Keine echte Prüfung — irreführend |

---

## 5. Top Summary Cards — Bewertung

### Aktuell (`deriveOverview`)

| KPI | Wertquelle | Redundant mit |
|-----|------------|---------------|
| Account name | `customer.name` | Profile-Formular |
| Email | `customer.email` | Profile-Formular |
| Email status | `portalStatus` | Security Checklist + Security KPI |
| Role | Statisch „Account owner" | — (einziger Unique-Wert) |
| Language | `languageLabel` | Preferences |
| Security | `securityStatusLabel` | Security Checklist |

### Bewertung

**6 KPIs sind für eine Account-Seite mit Formularen zu viel.** Sie erzeugen den Eindruck eines Dashboards, nicht einer Einstellungsseite.

### Empfehlung

| Option | Beschreibung | Bewertung |
|--------|--------------|-----------|
| **A: Komplett entfernen** | Formulare + kleine Status-Zeile reichen | **Bevorzugt** — Stripe/Linear zeigen keine KPI-Leiste auf Settings |
| **B: 3 kompakte Pills** | Email verified · Role · Security protected | Akzeptabel wenn visueller Anker gewünscht |
| **C: Behalten (6 KPIs)** | Status quo | **Nicht empfohlen** |

---

## 6. Layout-Ziel — Kompakte Seite ohne Scrollen

### Geschätzte Höhe aktuell (Desktop ~1280×800, Portal-Inhalt)

| Block | ca. Höhe |
|-------|----------|
| Header | 70 px |
| 6 KPIs (2 Zeilen) | 140 px |
| Profile + Password (2 Spalten) | 420–480 px |
| Sessions + Preferences | 220 px |
| Legal + Checklist | 320 px |
| Data & Export | 90 px |
| Gaps (6×16px) | 96 px |
| **Summe** | **~1.350–1.450 px** |

→ **Scrollen unvermeidlich** bei ~600–700 px nutzbarem Content-Bereich.

### Option A: Zwei-Spalten (empfohlen)

```
┌─────────────────────────────────────────────────────────┐
│ Account                                                  │
│ Identity, security, and portal preferences.              │
├──────────────────────────┬──────────────────────────────┤
│ PROFILE                  │ PASSWORD & SECURITY          │
│ Name, Email, Save        │ 3 fields, Change password    │
│                          │ [Email ✓] [Protected]        │
├──────────────────────────┼──────────────────────────────┤
│ PREFERENCES              │ (leer oder Security-Status)  │
│ Language, Theme          │                              │
├──────────────────────────┴──────────────────────────────┤
│ Legal · Privacy · Terms · …          Contact support →  │
└─────────────────────────────────────────────────────────┘
```

**Geschätzte Höhe:** ~650–750 px → **passt auf Desktop ohne Scrollen**.

### Option B: Drei Hauptkarten (eine Spalte, breit)

```
Profile
Password & Security (+ inline status)
Preferences
Footer links
```

**Geschätzte Höhe:** ~750–850 px → **knapp**, auf kleineren Laptops evtl. minimales Scrollen.

### Empfehlung Sprint 1.4

**Option A** — maximale Kompaktheit, klare Spaltenlogik (Identität links · Sicherheit rechts).

---

## 7. Legal Documents

### Ist-Zustand

- Eigene `dashboard-panel`-Karte mit Titel, Subtitle und **6 Links** (`PORTAL_LEGAL_DOCUMENTS`)
- Gleiche Dokumente in `deriveSupportState` → Knowledge Base auf Support-Seite
- `PortalLegalDocumentsSection.tsx` existiert, wird im Portal aber **nirgends** gerendert

### Gehört Legal auf Account?

| Argument | Bewertung |
|----------|-----------|
| GDPR / Compliance — Nutzer muss Docs finden | Ja, aber nicht prominent |
| Account = persönliche Einstellungen | Legal ist **plattformweit**, nicht identitätsbezogen |
| Duplikat Support | **Ja** |

### Empfehlung

- **Nicht** als große Karte auf Account
- **Kompakte Footer-Zeile:** `Terms · Privacy · Cookies · …` (inline, 1 Zeile, kleine Schrift)
- Vollständige Legal-Übersicht: **Support** oder dedizierte Legal-Sektion (bereits in Support Knowledge Base)

---

## 8. Data & Export

### Ist-Zustand (`deriveDataActions`)

| Action | Status |
|--------|--------|
| Export account data | `disabled: true`, Coming soon |
| Delete account request | `disabled: true`, Coming soon |
| Contact support | `mailto:` — **funktioniert** |

### Empfehlung

| Maßnahme | Begründung |
|----------|------------|
| **Ganze Sektion entfernen** | 2/3 sind tote Buttons — widerspricht SaaS-UX-Prinzip |
| **Contact support** in Footer verschieben | Link zu `/portal/support` oder mailto |
| Export/Delete | Erst wieder anzeigen wenn API existiert — ggf. unter Support oder Account-Footer als einzelner Textlink |

---

## 9. Coming Soon — vollständiges Inventar

| # | Element | Ort | Sichtbarkeit | Empfehlung |
|---|---------|-----|--------------|------------|
| 1 | Two-factor authentication | PasswordSecurity placeholder list | Unter Passwort-Formular | **Entfernen** |
| 2 | Login alerts | PasswordSecurity placeholder list | Unter Passwort-Formular | **Entfernen** |
| 3 | Recovery email | PasswordSecurity placeholder list | Unter Passwort-Formular | **Entfernen** |
| 4 | Log out all devices | AccountSessions | Disabled Button mit Badge | **Sektion entfernen** |
| 5 | Notifications | AccountPreferences | Text „Coming soon" | **Zeile entfernen** |
| 6 | Two-factor authentication | SecurityChecklist | Badge „Coming soon" | **Checklist entfernen** |
| 7 | Recovery email | SecurityChecklist | Badge „Coming soon" | **Checklist entfernen** |
| 8 | Recent login reviewed | SecurityChecklist | Badge „Coming soon" | **Checklist entfernen** |
| 9 | Strong password | SecurityChecklist | Badge „Pending" (keine echte Prüfung) | **Entfernen** |
| 10 | Export account data | AccountDataExport | Disabled Button | **Entfernen** |
| 11 | Delete account request | AccountDataExport | Disabled Button | **Entfernen** |

**Summe: 11 Coming-soon-/Placeholder-Elemente** — davon **0 mit Funktion**.

---

## 10. SaaS UX Bewertung

| Kriterium | Note (1–5) | Kommentar |
|-----------|------------|-----------|
| **Klarheit** | 2/5 | Zu viele Sektionen; unklar was editierbar vs. informativ ist |
| **Fokus** | 2/5 | Profile/Password gehen unter zwischen KPIs, Legal, Checklist |
| **Scroll-Länge** | 2/5 | Deutlich zu lang für eine Settings-Seite |
| **Professionalität** | 3/5 | Design-System gut; Inhalt wirkt wie Beta mit Coming-soon-Wand |
| **Funktionalität** | 4/5 | Kernfunktionen (Profile, Password, Lang, Theme) **funktionieren gut** |
| **Vertrauen / Security** | 3/5 | Passwort-Formular seriös; fake Session-Daten und „Pending" Password untergraben Vertrauen |
| **Redundanz** | 2/5 | Name/Email/Language/Security 2–3× sichtbar |

### Vergleich Referenzprodukte

| Produkt | Account/Settings-Muster |
|---------|-------------------------|
| **Stripe** | Wenige Sektionen, keine KPI-Leiste, keine Coming-soon-Buttons |
| **Linear** | Kompakte Forms, Sidebar-Settings, minimal scroll |
| **Shopify** | Account getrennt von Store Settings — klarer Scope |
| **Notion** | My account: Name, Email, Password — fertig |

Caisty Account sollte näher an **Settings-Formular** als an **Operations Dashboard** rutschen.

---

## 11. Empfehlung Sprint 1.4 — Prioritäten

### HIGH (unbedingt)

| # | Maßnahme | Dateien (voraussichtlich) |
|---|----------|--------------------------|
| 1 | **AccountOverview (6 KPIs) entfernen** oder durch 2–3 Inline-Status-Badges ersetzen | `PortalAccountPage`, `deriveAccountState`, `AccountOverview` |
| 2 | **Sessions & Devices Sektion entfernen** | `PortalAccountPage`, `deriveAccountState` |
| 3 | **Security Checklist entfernen** → kompakte Status-Zeile in/nach Password | `PortalAccountPage`, `SecurityChecklist`, `PasswordSecurity` |
| 4 | **Coming-soon-Liste unter Password entfernen** (2FA, Alerts, Recovery) | `PasswordSecurity` |
| 5 | **Data & Export Sektion entfernen** (disabled Actions) | `PortalAccountPage`, `AccountDataExport` |
| 6 | **Zwei-Spalten-Layout** Profile links / Password rechts | `PortalAccountPage`, `index.css` |
| 7 | **Preferences** ohne Notifications-Zeile | `AccountPreferences`, `deriveAccountState` |

### MEDIUM (kompakter machen)

| # | Maßnahme |
|---|----------|
| 8 | Legal Documents → **Footer-Zeile** statt große Karte |
| 9 | Contact support als **Textlink** im Footer (nicht eigene Sektion) |
| 10 | Subtitle kürzen: *„Your identity, security, and preferences."* |
| 11 | Profile/Password Hints (`profileHint`, `securityHint`) optional kürzen oder entfernen |
| 12 | `account-center` Gap und Panel-Padding straffen für Above-the-fold |

### LOW (später)

| # | Maßnahme | Wann |
|---|----------|------|
| 13 | 2FA aktivieren | Wenn API existiert |
| 14 | Session-Management / Logout all | Wenn Session-API existiert |
| 15 | Export / Delete account | Wenn GDPR-Workflow existiert |
| 16 | Notifications preferences | Wenn Notification-System existiert |
| 17 | Strong-password-Indikator | Wenn echte Policy-Prüfung existiert |

---

## 12. Zielbild nach Sprint 1.4

### Behalten (funktional)

- Profile: Name, Email, Save changes
- Password & Security: Current / New / Repeat, Change password
- Preferences: Portal language, Theme
- Kompakte Security-Status-Anzeige (Email verified, Security protected)
- Footer: Legal links + Contact support

### Entfernen

- 6 KPI Summary Cards (oder stark reduzieren)
- Sessions & Devices
- Security Checklist (5 Zeilen)
- Data & Export (Coming-soon-Buttons)
- Alle Coming-soon-Zeilen in Password und Preferences
- Legal Documents als große Karte

### Layout (Ziel)

```
Header
┌─────────────────┬─────────────────┐
│ Profile         │ Password        │
├─────────────────┼─────────────────┤
│ Preferences     │ Security status │
└─────────────────┴─────────────────┘
Footer: Legal links · Contact support
```

**Ergebnis:** ~4 sichtbare Bereiche statt 9, **kein Scrollen** auf Standard-Desktop, **keine deaktivierten Hauptaktionen**.

---

## Technische Referenz (für Implementierung)

### Relevante Dateien

| Datei | Rolle |
|-------|-------|
| `src/routes/PortalAccountPage.tsx` | Seiten-Orchestrierung (9 Blöcke) |
| `src/lib/account/deriveAccountState.ts` | KPIs, Session, Checklist, Legal, Data actions |
| `src/components/account/AccountProfileForm.tsx` | **Kern** — editierbar |
| `src/components/account/PasswordSecurity.tsx` | **Kern** + 3 Coming-soon-Zeilen |
| `src/components/account/AccountPreferences.tsx` | Sprache/Theme + Notifications CS |
| `src/components/account/AccountOverview.tsx` | 6 KPI-Karten |
| `src/components/account/AccountSessions.tsx` | Session-Platzhalter |
| `src/components/account/SecurityChecklist.tsx` | 5-Item-Liste |
| `src/components/account/LegalDocuments.tsx` | 6 Legal-Links |
| `src/components/account/AccountDataExport.tsx` | Export/Delete disabled |
| `src/lib/translations/portal/*.ts` | `account.center.*` |
| `src/index.css` | `.account-*` Styles |

### Funktionierende APIs (nicht ändern in Sprint 1.4)

| API | Verwendung |
|-----|------------|
| `PATCH /portal/account` | Name, Email speichern |
| `POST` change password | Passwort ändern |

### Tests

`deriveAccountState.test.ts` — 2 Tests; bei Cleanup anpassen (weniger overview items, keine session/checklist).

---

## Anhang: Redundanz-Matrix

| Information | Overview KPI | Profile | Preferences | Checklist | Sessions |
|-------------|-------------|---------|-------------|-----------|----------|
| Name | ✓ | ✓ (edit) | — | — | — |
| Email | ✓ | ✓ (edit) | — | — | — |
| Email status | ✓ | — | — | ✓ | — |
| Role | ✓ | — | — | — | — |
| Language | ✓ | — | ✓ | — | — |
| Security | ✓ | — | — | ✓ (2FA etc.) | — |
| Browser | — | — | — | — | ✓ |
| 2FA | — | ✓ (CS) | — | ✓ (CS) | — |

**Fazit:** Mindestens **4 Informationen** erscheinen doppelt; **2FA/Recovery** sogar dreifach (Password list + Checklist + implizit Security KPI).

---

*Ende der Analyse — Sprint 1.4 Implementierung folgt separat auf Basis dieses Dokuments.*
