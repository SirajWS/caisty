# Phase 2.2 – Cloud Foundation for POS Synchronisation

**Stand:** 2026-07-08  
**Scope:** Cloud API + PostgreSQL only (no Portal UI, no Desktop POS changes)

---

## Summary

Phase 2.2 prepares the backend to receive POS sales events through a single batch endpoint. Billing tables (`payments`, `invoices`) are unchanged. POS sale payments are stored in `pos_sale_payments`.

---

## PostgreSQL Tables

| Table | Purpose |
|-------|---------|
| `pos_sync_batches` | One row per POS upload batch (audit + idempotency anchor) |
| `pos_sync_events` | One row per sync event (`sync_event_id` from POS) |
| `pos_orders` | Sales orders from POS |
| `pos_order_lines` | Optional line items for an order |
| `pos_receipts` | Fiscal/sales receipts |
| `pos_sale_payments` | POS checkout payments (cash/card/…) — **not** SaaS `payments` |

### Device columns (migration `022_devices_sync_fields.sql`)

| Column | Purpose |
|--------|---------|
| `devices.app_version` | POS app version from batch telemetry |
| `devices.last_sales_sync_at` | Updated on successful batch ingestion |
| `devices.offline_queue_count` | Queue depth reported by POS |

---

## Important Constraints

| Entity | Unique key | Notes |
|--------|------------|-------|
| Sync batch | `(org_id, device_id, pos_batch_id)` | `pos_batch_id` = POS `batch.batchId` |
| Sync event | `sync_event_id` | UUID from POS `events[].eventId` |
| Order | `(org_id, device_id, local_order_id)` | `local_order_id` = POS-local ID |
| Receipt | `(org_id, device_id, local_receipt_id)` | |
| Sale payment | `(org_id, device_id, local_payment_id)` | |
| Order line | `(order_id, line_index)` | |

All sales rows include `org_id` (mandatory tenant scope) and `device_id`.

Foreign keys cascade on org/device delete. Legacy billing tables are not modified.

---

## API

### `POST /pos/sync/batch`

Public route (no JWT). Same trust model as `GET /pos/config`:

- Body: `deviceId` + `licenseKey`
- Device must be bound to the license; license must be `active`
- All ingested rows are scoped to the device's `org_id`

**Optional header:** `Idempotency-Key` — reuses `idempotency_keys` + `IdempotencyService` with scope `pos.sync.batch`.

**Success:** `201 Created`

**Errors:**

| HTTP | `error` | When |
|------|---------|------|
| 400 | `invalid_request` | Schema/validation failure |
| 403 | `invalid_license` | Unknown or inactive license |
| 403 | `device_not_bound` | Device not linked to license |
| 409 | `idempotency_conflict` | Same key, different payload hash |
| 500 | `server_error` | Unexpected failure |

---

## Request Payload

```json
{
  "deviceId": "00000000-0000-0000-0000-000000000099",
  "licenseKey": "CSTY-XXXX-XXXX-XXXX",
  "batch": {
    "batchId": "11111111-1111-4111-8111-111111111111",
    "sequence": 1,
    "sentAt": "2026-07-08T10:00:00.000Z"
  },
  "telemetry": {
    "appVersion": "0.3.2",
    "offlineQueueCount": 0
  },
  "events": [
    {
      "eventId": "22222222-2222-4222-8222-222222222222",
      "type": "order",
      "payload": {
        "localOrderId": "pos-order-42",
        "status": "closed",
        "totalCents": 1250,
        "currency": "EUR",
        "soldAt": "2026-07-08T10:00:00.000Z",
        "lines": [
          {
            "lineIndex": 0,
            "productName": "Espresso",
            "quantity": 2,
            "unitPriceCents": 250,
            "lineTotalCents": 500
          }
        ]
      }
    },
    {
      "eventId": "33333333-3333-4333-8333-333333333333",
      "type": "receipt",
      "payload": {
        "localReceiptId": "pos-rcpt-42",
        "localOrderId": "pos-order-42",
        "receiptNumber": "R-2026-0042",
        "netCents": 1050,
        "taxCents": 200,
        "grossCents": 1250,
        "currency": "EUR",
        "soldAt": "2026-07-08T10:00:05.000Z",
        "fiscalStatus": "pending"
      }
    },
    {
      "eventId": "44444444-4444-4444-8444-444444444444",
      "type": "payment",
      "payload": {
        "localPaymentId": "pos-pay-42",
        "localOrderId": "pos-order-42",
        "localReceiptId": "pos-rcpt-42",
        "method": "cash",
        "amountCents": 1250,
        "currency": "EUR",
        "paidAt": "2026-07-08T10:00:06.000Z"
      }
    }
  ]
}
```

### ID conventions

| ID | Source | Usage |
|----|--------|-------|
| `deviceId` | Cloud (from `POST /devices/bind`) | Auth + row scope |
| `batch.batchId` | POS-generated UUID | Batch deduplication |
| `events[].eventId` | POS-generated UUID | Event deduplication (`sync_event_id`) |
| `localOrderId` / `localReceiptId` / `localPaymentId` | POS-local strings | Entity deduplication per device |
| Cloud `batchId` (response) | PostgreSQL `pos_sync_batches.id` | Cloud batch reference |

### Event types (Phase 2.2)

| `type` | Required payload fields |
|--------|-------------------------|
| `order` | `localOrderId`, `totalCents`, `soldAt` |
| `receipt` | `localReceiptId`, `netCents`, `grossCents`, `soldAt` |
| `payment` | `localPaymentId`, `method`, `amountCents`, `paidAt` |

Shifts, refunds, and granular endpoints are deferred to later sprints.

---

## Response Payload

```json
{
  "ok": true,
  "batchId": "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
  "posBatchId": "11111111-1111-4111-8111-111111111111",
  "status": "completed",
  "accepted": ["22222222-2222-4222-8222-222222222222"],
  "duplicate": [],
  "failed": [],
  "counts": {
    "accepted": 3,
    "duplicate": 0,
    "failed": 0
  }
}
```

If the same `(org_id, device_id, pos_batch_id)` is submitted again:

- `status`: `duplicate_batch`
- No duplicate entity rows are created
- Counts reflect the original batch totals

Per-event retries with the same `eventId` are reported in `duplicate[]`.

---

## Idempotency Strategy

1. **Batch header:** `Idempotency-Key` → `idempotency_keys` scope `pos.sync.batch` (24h TTL, same as billing)
2. **Batch body:** unique `(org_id, device_id, pos_batch_id)`
3. **Events:** unique `sync_event_id`
4. **Entities:** unique `(org_id, device_id, local_*_id)` — insert with conflict → `duplicate`

---

## Migrations

| File | Content |
|------|---------|
| `drizzle/021_pos_sync_core.sql` | POS sync + sales tables |
| `drizzle/022_devices_sync_fields.sql` | Device telemetry columns |

Apply manually or via your existing migration workflow. No legacy table renames.

---

## Code Locations

| Area | Path |
|------|------|
| Drizzle schema | `src/db/schema/posSync.ts` |
| Device auth | `src/lib/posDeviceAuth.ts` |
| Validation | `src/posSync/validateSyncBatch.ts` |
| Ingestion service | `src/posSync/PosSyncService.ts` |
| Route | `src/routes/pos-sync.ts` |
| Server registration | `src/server.ts` |

---

## Out of Scope (Phase 2.2)

- Portal Dashboard / Orders / Reports UI or read APIs
- Desktop POS offline queue implementation
- Shifts, refunds, aggregates, admin sync views
- `POST /pos/sync/orders` etc. (granular endpoints)

---

## Manual Test Checklist

1. Run migrations `021` and `022`
2. Bind a device → obtain `deviceId` + `licenseKey`
3. `POST /pos/sync/batch` with one order event → `201`, `accepted` contains `eventId`
4. Resend same batch → `duplicate_batch` or cached idempotency response
5. Resend same `eventId` in a new batch → event in `duplicate[]`
6. Wrong `licenseKey` → `403 invalid_license`
7. `GET /pos/config` and verify/bind/heartbeat still work
