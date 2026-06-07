# Admin-Login einrichten (Fehler "Fehler beim Login" / 500)

Damit du dich mit **admin@caisty.com** einloggen kannst, müssen diese Schritte einmalig erledigt werden.

---

## 1. PostgreSQL starten

Die API braucht eine laufende **PostgreSQL**-Datenbank.

- **Windows:** PostgreSQL-Dienst starten (Dienste-App oder `pg_ctl`) oder z.B. [PostgreSQL Installer](https://www.postgresql.org/download/windows/) nutzen.
- **Docker:**  
  `docker run -d -p 5432:5432 -e POSTGRES_USER=caisty -e POSTGRES_PASSWORD=devpassword -e POSTGRES_DB=caisty postgres:15`
- **Repo `docker-compose.yml`:** Postgres ist auf **127.0.0.1:5432** gemappt, damit `cloud-api` auf dem Host mit `DATABASE_URL=...localhost:5432...` dieselbe DB wie der Container nutzen kann. Danach Migration + Admin-Seed ausführen (siehe unten).
- **Oder:** Eine bestehende Datenbank-URL (z.B. von einem Hoster) in `.env` eintragen (siehe Schritt 2).

---

## 2. Umgebung prüfen

In `apps/cloud-api` muss eine Datei **`.env`** existieren mit mindestens:

```env
DATABASE_URL=postgres://caisty:devpassword@localhost:5432/caisty
JWT_SECRET=ein-geheimes-langes-passwort-min-32-zeichen
PORT=3333
```

- `DATABASE_URL` muss zu deiner laufenden Datenbank passen (Host, Port, User, Passwort, DB-Name).
- `JWT_SECRET` muss gesetzt sein (mind. 32 Zeichen), sonst startet die API nicht.

---

## 3. Migrationen ausführen (falls nötig)

Im Projektroot (oder in `apps/cloud-api`):

```bash
cd apps/cloud-api
pnpm db:migrate
```

Damit werden u.a. die Tabellen `admin_users`, `admin_permissions`, `admin_password_resets` angelegt.

**Hinweis:** Wenn du die Meldung `relation "admin_password_resets" already exists` bekommst, sind die Tabellen bereits vorhanden. In dem Fall Migration überspringen und direkt **Schritt 4 (Seed)** ausführen.

---

## 4. Admin-User anlegen (Seed)

```bash
cd apps/cloud-api
pnpm db:seed:admin
```

Das legt u.a. an:

- **admin@caisty.com** – Passwort: **CaistyAdmin123!**
- siraj@caisty.com, support@caisty.com (gleiches Passwort)

---

## 5. API und Admin-Frontend starten

**Terminal 1 – Backend:**

```bash
cd apps/cloud-api
pnpm dev
```

Erwartung: Meldung wie „Database connection established“ und Server auf Port 3333.

**Terminal 2 – Admin-Frontend:**

```bash
cd apps/cloud-admin
pnpm dev
```

Admin-App läuft auf http://localhost:5175.

---

## 6. Einloggen

- URL: **http://localhost:5175/login**
- E-Mail: **admin@caisty.com**
- Passwort: **CaistyAdmin123!**

---

## Wenn es weiterhin 500 gibt

- Im **Terminal der cloud-api** steht die genaue Fehlermeldung (z.B. DB-Fehler).
- In **Development** steht die Fehlermeldung auch in der Login-Fehlermeldung im Browser.
- Prüfen: Ist PostgreSQL erreichbar? Stimmt `DATABASE_URL` in `.env`? Wurden `pnpm db:migrate` und `pnpm db:seed:admin` ohne Fehler ausgeführt?
