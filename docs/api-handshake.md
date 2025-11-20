# Caisty Cloud – POS Handshake & Licensing API

**Version:** 0.1  
**Stand:** 20.11.2025

Dieses Dokument beschreibt, wie **Caisty POS** mit **Caisty Cloud** spricht:

- Lizenz prüfen
- Gerät binden (Device an License hängen)
- Heartbeats senden (damit Cloud weiß: POS lebt)
- Offline-Regeln (wie lange darf POS ohne Internet laufen)

Die Endpoints in diesem Dokument sind **öffentlich** (KEIN JWT):

- `POST /licenses/verify`
- `POST /devices/bind`
- `POST /devices/heartbeat`

> Diese Doku ist nur eine Beschreibung.  
> Die Implementierung im Code passiert in den nächsten Schritten (M6).

---

## 1. Überblick – Ablauf in einfachen Worten

### 1.1 Erster Start von Caisty POS

1. Benutzer startet den POS zum allerersten Mal.
2. POS zeigt einen Bildschirm:
   - „Bitte Lizenzschlüssel eingeben“
   - „Bitte Gerätenamen eingeben“ (z. B. „POS Kasse 1“)
3. POS ruft `POST /licenses/verify` auf:
   - Ist der Key gültig?
   - Ist die Lizenz aktiv?
   - Gibt es noch freie Geräte-Slots?
4. Wenn alles ok:
   - POS ruft `POST /devices/bind` auf.
   - Server erstellt ein Device.
   - Server verknüpft Device mit License.
5. POS speichert lokal:
   - `deviceId`
   - `licenseKey`
   - `licensePlan`
   - `licenseValidUntil`
   - `lastSuccessfulOnlineCheckAt`

### 1.2 Normaler Betrieb

- POS läuft normal.
- Im Hintergrund sendet der POS alle X Minuten:
  - `POST /devices/heartbeat`
- Server aktualisiert:
  - `lastHeartbeatAt`
  - `status` des Geräts.
- Admin sieht im Backend:
  - Geräte mit letztem Signal
  - kann erkennen: online / stale / offline.

### 1.3 Offline-Betrieb

- Wenn Cloud nicht erreichbar ist (kein Internet / Server down):
  - POS benutzt nur lokale Daten:
    - `licenseValidUntil`
    - `lastSuccessfulOnlineCheckAt`
  - Ist die Lizenz noch gültig?
  - Ist die Offline-Zeit kleiner als die erlaubte „Offline-Grace-Periode“?
- Wenn ja → POS darf offline weiterlaufen.
- Wenn nein → POS blockiert und sagt:
  - „Bitte Internet verbinden, Lizenz kann nicht verifiziert werden.“

---

## 2. Allgemeine Konventionen

### 2.1 Base URL (Entwicklung)

In der Entwicklung spricht der POS mit:

    http://127.0.0.1:3333

In Produktion kommt später eine echte Domain für Caisty Cloud.

### 2.2 JSON / Content-Type

Alle Endpoints:

- Request:
  - Header: `Content-Type: application/json`
  - Body: JSON-Objekt
- Response:
  - JSON-Objekt

### 2.3 Zeitformat

Zeitstempel im ISO-Format, zum Beispiel:

    "2025-11-20T08:15:30.123Z"

### 2.4 Fehlerarten (aus Sicht von POS)

Es gibt **zwei Arten von Fehlern**:

1. **Technische Fehler (Netzwerk / Transport)**  
   Beispiele:
   - Server nicht erreichbar
   - Timeout
   - DNS-Fehler
   - keine gültige JSON-Antwort

   Für den POS bedeutet das: **„Cloud offline“**  
   → Dann greift die **Offline-Logik** (siehe unten).

2. **Logische Fehler (Lizenz / Device Probleme)**  
   Beispiele:
   - ungültiger Lizenz-Key
   - Lizenz abgelaufen
   - max. Geräte erreicht
   - Device nicht gefunden  

   Diese Fehler kommen als JSON:

       {
         "ok": false,
         "reason": "some_reason",
         "message": "Lesbare Erklärung",
         "meta": {}
       }

   POS darf das **nicht** als „Cloud offline“ behandeln, sondern als Business-Fehler.

---

## 3. Endpoint: `POST /licenses/verify`

Lizenz prüfen und Geräte-Auslastung anzeigen.

### 3.1 Zweck

- Ist der Lizenzschlüssel gültig?
- Ist die Lizenz aktiv, nicht abgelaufen, nicht revoked?
- Wieviele Devices sind schon an dieser License gebunden?
- Rückgabe von:
  - Plan (`starter`, `pro`, …)
  - gültig von / bis
  - `devices.used`, `devices.limit`, `devices.remaining`

### 3.2 Request

**URL**

    POST /licenses/verify

**Headers**

    Content-Type: application/json

**Body**

    {
      "key": "CSTY-XXXX-XXXX-XXXX",
      "deviceName": "POS Kasse 1",
      "deviceType": "pos",
      "fingerprint": "optional-hardware-or-installation-id"
    }

Felder:

- `key` (string, Pflicht)  
  Der Lizenzschlüssel, den der Benutzer eingibt.

- `deviceName` (string, optional aber empfohlen)  
  Schöner Name für das Gerät (z. B. „POS Kasse 1“), erscheint im Admin.

- `deviceType` (string, optional, Default `"pos"`)  
  Gerätetyp: z. B. `"pos"`, `"kitchen-display"`.  
  Aktuell verwenden wir vor allem `"pos"`.

- `fingerprint` (string, optional)  
  Hardware- oder Installations-ID.  
  Später nützlich für „doppeltes Binden“ erkennen.

### 3.3 Erfolgreiche Antwort

HTTP-Status: `200 OK`

    {
      "ok": true,
      "license": {
        "id": "lic_123",
        "key": "CSTY-KW8Z-BSM3-Y6KN",
        "plan": "starter",
        "status": "active",
        "maxDevices": 1,
        "validFrom": "2025-01-01T00:00:00.000Z",
        "validUntil": "2026-01-01T00:00:00.000Z",
        "createdAt": "2025-01-01T12:00:00.000Z",
        "updatedAt": "2025-01-01T12:00:00.000Z",
        "customerId": "cus_123",
        "subscriptionId": "sub_123"
      },
      "devices": {
        "used": 1,
        "limit": 1,
        "remaining": 0
      }
    }

Wichtig:

- `plan` der License ist **unabhängig** vom Subscription-Plan.  
  Kunde kann Abo `pro` haben, aber License `starter`.
- `devices.used` = Anzahl Devices, die schon mit dieser License verknüpft sind.
- `devices.limit` = `license.maxDevices`.
- `devices.remaining` = `max(0, limit - used)`.

### 3.4 Fehler (`ok: false`)

Wir benutzen absichtlich **`200 OK`** als HTTP-Status und codieren die Business-Fehler im JSON.

**Allgemeine Struktur:**

    {
      "ok": false,
      "reason": "reason_code",
      "message": "Lesbarer Text",
      "meta": {}
    }

Mögliche `reason`-Werte:

| reason               | Bedeutung                                         | meta-Beispiele      |
|----------------------|---------------------------------------------------|---------------------|
| `license_not_found`  | Lizenzschlüssel existiert nicht.                  | —                   |
| `invalid_or_expired` | Lizenz ist abgelaufen oder nicht gültig.         | `validUntil`        |
| `license_revoked`    | Lizenz wurde im Admin revoked.                    | `revokedAt`         |
| `license_inactive`   | Lizenzstatus ist nicht `active`.                  | `status`            |
| `internal_error`     | Unerwarteter Serverfehler.                        | z. B. `errorId`     |

**Beispiele**

Lizenz nicht gefunden:

    {
      "ok": false,
      "reason": "license_not_found",
      "message": "License key not found."
    }

Lizenz abgelaufen:

    {
      "ok": false,
      "reason": "invalid_or_expired",
      "message": "License has expired.",
      "meta": {
        "validUntil": "2025-01-01T00:00:00.000Z"
      }
    }

Lizenz revoked:

    {
      "ok": false,
      "reason": "license_revoked",
      "message": "License has been revoked by the administrator."
    }

---

## 4. Endpoint: `POST /devices/bind`

Gerät an eine License binden.

### 4.1 Zweck

- License-Key prüfen (ähnlich wie `POST /licenses/verify`).
- Prüfen: gibt es noch freie Slots (`maxDevices`)?
- Neues Device in der DB anlegen.
- `license_event` vom Typ `activated` erzeugen.

### 4.2 Request

**URL**

    POST /devices/bind

**Headers**

    Content-Type: application/json

**Body**

    {
      "licenseKey": "CSTY-KW8Z-BSM3-Y6KN",
      "deviceName": "POS Kasse 1",
      "deviceType": "pos",
      "fingerprint": "optional-hardware-or-installation-id"
    }

Felder:

- `licenseKey` (string, Pflicht)  
  Lizenzschlüssel (wie `key` bei `/licenses/verify`).

- `deviceName` (string, Pflicht)  
  Anzeigename des Geräts im Admin.

- `deviceType` (string, optional, Default `"pos"`)  
  Gerätetyp.

- `fingerprint` (string, optional)  
  Später nutzbar, um doppelte Bindung desselben Geräts zu erkennen.

### 4.3 Erfolgreiche Antwort

HTTP-Status: `200 OK`

    {
      "ok": true,
      "device": {
        "id": "dev_123",
        "name": "POS Kasse 1",
        "type": "pos",
        "status": "active",
        "licenseId": "lic_123",
        "fingerprint": "optional-hardware-or-installation-id",
        "lastHeartbeatAt": "2025-11-20T08:15:30.000Z",
        "createdAt": "2025-11-20T08:15:30.000Z"
      },
      "license": {
        "id": "lic_123",
        "key": "CSTY-KW8Z-BSM3-Y6KN",
        "plan": "starter",
        "maxDevices": 1,
        "status": "active",
        "validFrom": "2025-01-01T00:00:00.000Z",
        "validUntil": "2026-01-01T00:00:00.000Z"
      }
    }

### 4.4 Fehler (`ok: false`)

Struktur wie vorher:

    {
      "ok": false,
      "reason": "reason_code",
      "message": "Lesbarer Text",
      "meta": {}
    }

Mögliche `reason`:

| reason                 | Bedeutung                                           | meta-Beispiele                           |
|------------------------|-----------------------------------------------------|------------------------------------------|
| `license_not_found`    | Lizenz existiert nicht.                            | —                                        |
| `invalid_or_expired`   | Lizenz nicht aktiv oder abgelaufen.                | `validUntil`                             |
| `license_revoked`      | Lizenz revoked.                                     | `revokedAt`                              |
| `max_devices_reached`  | `devices.used >= license.maxDevices`.              | `used`, `limit`                          |
| `fingerprint_conflict` | (später) Fingerprint schon an anderer License.     | `existingDeviceId`, `existingLicenseKey` |
| `internal_error`       | Unerwarteter Serverfehler.                         | `errorId`                                |

Beispiel: Max Devices erreicht

    {
      "ok": false,
      "reason": "max_devices_reached",
      "message": "Maximum number of devices for this license has been reached.",
      "meta": {
        "used": 1,
        "limit": 1
      }
    }

---

## 5. Endpoint: `POST /devices/heartbeat`

Heartbeat für ein existierendes Device senden.

### 5.1 Zweck

- `lastHeartbeatAt` aktualisieren.
- Device-Status auf `active` setzen.
- `license_event` vom Typ `heartbeat` erzeugen.
- Admin sehen lassen: Device lebt.

### 5.2 Request

**URL**

    POST /devices/heartbeat

**Headers**

    Content-Type: application/json

**Body**

    {
      "deviceId": "dev_123"
    }

Felder:

- `deviceId` (string, Pflicht)  
  Device-ID, die bei `POST /devices/bind` zurückgegeben wurde.

### 5.3 Erfolgreiche Antwort

HTTP-Status: `200 OK`

    {
      "ok": true,
      "device": {
        "id": "dev_123",
        "status": "active",
        "lastHeartbeatAt": "2025-11-20T08:20:00.000Z"
      }
    }

### 5.4 Fehler (`ok: false`)

Mögliche `reason`:

| reason             | Bedeutung                               |
|--------------------|-----------------------------------------|
| `device_not_found` | Device-ID existiert nicht.             |
| `license_revoked`  | Lizenz des Devices wurde revoked.      |
| `license_expired`  | Lizenz des Devices ist abgelaufen.     |
| `internal_error`   | Unerwarteter Serverfehler.             |

Beispiel:

    {
      "ok": false,
      "reason": "device_not_found",
      "message": "Device not found."
    }

---

## 6. Offline-Regeln im POS (Client-Seite)

Diese Logik passiert **nur im POS**, nicht im Server.

### 6.1 Was speichert der POS lokal?

Mindestens:

- `licenseKey` (string)
- `licensePlan` (string, z. B. `"starter"`)
- `licenseValidUntil` (ISO-String)
- `deviceId` (string)
- `lastSuccessfulOnlineCheckAt` (ISO-String)

`lastSuccessfulOnlineCheckAt` wird gesetzt/aktualisiert bei:

- erfolgreichem `POST /licenses/verify`
- erfolgreichem `POST /devices/bind`
- erfolgreichem `POST /devices/heartbeat`

### 6.2 Konstante für Grace-Periode

Im POS-Code (Konzept):

    OFFLINE_GRACE_DAYS = 7

(Später konfigurierbar, aber fürs Konzept erst mal fix.)

### 6.3 Entscheidung beim POS-Start (wenn Cloud nicht erreichbar)

Wenn der POS startet und Cloud **nicht** erreichbar ist:

1. Lokale Werte laden:
   - `licenseValidUntil`
   - `lastSuccessfulOnlineCheckAt`
2. Zwei Checks:
   - `now <= licenseValidUntil`
   - `now - lastSuccessfulOnlineCheckAt <= OFFLINE_GRACE_DAYS`
3. Wenn **beide** Bedingungen erfüllt:
   - POS darf im **Offline-Modus** starten.
4. Wenn **eine** Bedingung nicht erfüllt:
   - POS muss blockieren:
     - Meldung: „Lizenz konnte nicht verifiziert werden. Bitte Internetverbindung herstellen.“

---

## 7. Beispiel-Flows

### 7.1 Erstes Gerät registrieren

1. POS startet ohne gespeicherte `deviceId`.
2. POS zeigt Lizenz-Setup-Screen.
3. User gibt `licenseKey` + `deviceName` ein.
4. POS ruft `POST /licenses/verify` auf.
5. Bei `ok: true`:
   - POS zeigt Plan, Gültigkeit, Devices used/limit.
   - Button „Dieses Gerät binden“ → `POST /devices/bind`.
6. Bei Erfolg:
   - POS speichert `deviceId`, `licenseKey`, `licensePlan`, `licenseValidUntil`, `lastSuccessfulOnlineCheckAt`.
   - POS wechselt in normalen Modus.

### 7.2 POS-Neustart mit gespeichertem Gerät

1. POS startet.
2. Lokale `deviceId` + `licenseKey` sind vorhanden.
3. POS geht direkt in normalen Modus.
4. Im Hintergrund:
   - Heartbeat-Job sendet regelmäßig `POST /devices/heartbeat`.

### 7.3 Offline-Neustart innerhalb der Grace-Periode

1. POS hat vorher schon einmal erfolgreich Cloud erreicht.
2. User startet POS, aber:
   - Internet ist weg oder Cloud offline.
3. POS prüft Offline-Regeln:
   - Wenn `licenseValidUntil` noch nicht überschritten.
   - Und `lastSuccessfulOnlineCheckAt` nicht länger her ist als `OFFLINE_GRACE_DAYS`.
4. Wenn ok → POS startet im Offline-Modus.
5. Wenn nicht → POS blockiert mit Hinweis, dass Internet benötigt wird.

---
