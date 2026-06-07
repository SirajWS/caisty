# Invoice amounts (gross vs legacy rows)

From this change onward, **new** portal checkouts store `invoices.amount_cents` as the **gross** amount (net list price × 1.19), matching the portal checkout UI and PayPal order totals.

Older rows may still show e.g. **€14.99** (1499 cents) or net-only amounts from earlier builds. That is historical data in the database.

## Optional: fix open test invoices (dev only)

Review before running in any shared environment. Adjust `plan_name` / amounts if your data differs.

```sql
-- Example: align open EUR Starter monthly invoices to current gross (9.99 + 19% VAT ≈ 11.89 → 1189 cents)
UPDATE invoices
SET amount_cents = 1189
WHERE status = 'open'
  AND currency = 'EUR'
  AND plan_name = 'Starter'
  AND amount_cents IN (999, 1499);

-- Pro monthly gross: 19.99 * 1.19 ≈ 23.79 → 2379 cents
UPDATE invoices
SET amount_cents = 2379
WHERE status = 'open'
  AND currency = 'EUR'
  AND plan_name = 'Pro'
  AND amount_cents IN (1999, 2999);
```

Paid or closed invoices should **not** be rewritten without accounting review.
