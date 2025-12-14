# 🔄 Phase 2.2 - PayPal Code Extraction Plan

## ✅ Phase 2.1 abgeschlossen

- ✅ Ordnerstruktur erstellt
- ✅ Code-Skeletons erstellt
- ✅ Committed: `feat(billing): add provider interface + billing/idempotency skeleton`

---

## 📋 PayPal-Code aus `portal-upgrade.ts` extrahieren

### Datei: `apps/cloud-api/src/routes/portal-upgrade.ts`

### 1. PayPal Helper Functions (Zeilen 40-180)

**Diese Funktionen müssen in `PayPalProvider.ts` verschoben werden:**

#### `getPaypalAccessToken()` (Zeilen 57-88)
```typescript
async function getPaypalAccessToken(): Promise<string> {
  if (!PAYPAL_CLIENT_ID || !PAYPAL_CLIENT_SECRET) {
    throw new Error("PAYPAL_CLIENT_ID / PAYPAL_CLIENT_SECRET not configured");
  }

  const res = await nodeFetch(`${PAYPAL_BASE_URL}/v1/oauth2/token`, {
    method: "POST",
    headers: {
      Authorization:
        "Basic " +
        Buffer.from(
          `${PAYPAL_CLIENT_ID}:${PAYPAL_CLIENT_SECRET}`,
          "utf8",
        ).toString("base64"),
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: "grant_type=client_credentials",
  });

  if (!res.ok) {
    const txt = await res.text();
    throw new Error(
      `PayPal token request failed: ${res.status} ${res.statusText} – ${txt}`,
    );
  }

  const data = (await res.json()) as { access_token: string };
  if (!data.access_token) {
    throw new Error("PayPal token missing in response");
  }
  return data.access_token;
}
```

#### `createPaypalOrder()` (Zeilen 95-149)
```typescript
type PaypalOrderResult = {
  id: string;
  approvalUrl: string;
};

async function createPaypalOrder(opts: {
  amount: number; // EUR, z.B. 0.01
  currency: string;
  description: string;
  returnUrl: string;
  cancelUrl: string;
}): Promise<PaypalOrderResult> {
  const accessToken = await getPaypalAccessToken();

  const res = await nodeFetch(`${PAYPAL_BASE_URL}/v2/checkout/orders`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      intent: "CAPTURE",
      purchase_units: [
        {
          amount: {
            currency_code: opts.currency,
            value: opts.amount.toFixed(2),
          },
          description: opts.description,
        },
      ],
      application_context: {
        return_url: opts.returnUrl,
        cancel_url: opts.cancelUrl,
      },
    }),
  });

  if (!res.ok) {
    const txt = await res.text();
    throw new Error(
      `PayPal order create failed: ${res.status} ${res.statusText} – ${txt}`,
    );
  }

  const data = (await res.json()) as any;

  const approvalLink = (data.links || []).find(
    (l: any) => l.rel === "approve",
  );

  if (!data.id || !approvalLink?.href) {
    throw new Error("PayPal order missing id or approval link");
  }

  return {
    id: String(data.id),
    approvalUrl: String(approvalLink.href),
  };
}
```

#### `capturePaypalOrder()` (Zeilen 152-180)
```typescript
// *** DEV-Bypass: ermöglicht lokale Tests ohne echtes PayPal-Capture ***
async function capturePaypalOrder(orderId: string): Promise<boolean> {
  // Wenn wir von außen ein Token wie DEV_OK schicken, einfach "success"
  if (orderId.startsWith("DEV_")) {
    return true;
  }

  const accessToken = await getPaypalAccessToken();

  const res = await nodeFetch(
    `${PAYPAL_BASE_URL}/v2/checkout/orders/${orderId}/capture`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
    },
  );

  if (!res.ok) {
    const txt = await res.text();
    throw new Error(
      `PayPal capture failed: ${res.status} ${res.statusText} – ${txt}`,
    );
  }

  const data = (await res.json()) as any;
  return data.status === "COMPLETED";
}
```

### 2. PayPal Order Creation in Route (Zeilen 435-459)

**Dieser Block wird später durch `BillingService.checkout()` ersetzt:**

```typescript
// 3) PayPal-Order (Fehler hier brechen das Upgrade NICHT ab)
const returnUrl = `${PUBLIC_API_BASE_URL}/portal/upgrade/paypal-return?invoiceId=${encodeURIComponent(
  String(inv.id),
)}`;
const cancelUrl = `${PUBLIC_API_BASE_URL}/portal/upgrade/paypal-cancel?invoiceId=${encodeURIComponent(
  String(inv.id),
)}`;

let redirectUrl: string | undefined;
let paypalOrderId: string | undefined;

try {
  const order = await createPaypalOrder({
    amount: pricing.monthlyAmount,
    currency: currency,
    description: pricing.description,
    returnUrl,
    cancelUrl,
  });
  redirectUrl = order.approvalUrl;
  paypalOrderId = order.id;
} catch (err) {
  app.log.error({ err }, "PayPal order creation failed");
  // redirectUrl bleibt undefined → Frontend kann zu /portal/invoices schicken
}
```

### 3. PayPal Return Handler (Zeilen 508-698)

**Dieser Handler wird später durch Webhook-Handling ersetzt (Phase 2.4), aber für jetzt bleibt er:**

```typescript
// GET /portal/upgrade/paypal-return
app.get("/portal/upgrade/paypal-return", async (request, reply) => {
  const query = request.query as any;
  const invoiceId = query.invoiceId as string | undefined;
  const token = query.token as string | undefined; // PayPal-Order-ID

  if (!invoiceId || !token) {
    reply.code(400).send("Missing invoiceId or token");
    return;
  }

  try {
    const ok = await capturePaypalOrder(token);
    // ... rest of handler
  } catch (err) {
    // ... error handling
  }
});
```

---

## 🔧 Environment Variables

**Diese müssen in `PayPalProvider` verwendet werden:**

```typescript
const PAYPAL_BASE_URL = process.env.PAYPAL_BASE_URL ?? "https://api-m.sandbox.paypal.com";
const PAYPAL_CLIENT_ID = process.env.PAYPAL_CLIENT_ID ?? "";
const PAYPAL_CLIENT_SECRET = process.env.PAYPAL_CLIENT_SECRET ?? "";
```

**Plus für Return/Cancel URLs:**
```typescript
const PUBLIC_API_BASE_URL = process.env.PUBLIC_API_BASE_URL ?? "http://127.0.0.1:3333";
const PORTAL_BASE_URL = process.env.PORTAL_BASE_URL ?? "http://localhost:5175";
```

---

## 📝 Nächste Schritte für Phase 2.2

1. **PayPalProvider.checkout() implementieren**
   - `getPaypalAccessToken()` → private Methode
   - `createPaypalOrder()` → in `checkout()` integrieren
   - Return `CheckoutResponse` mit `checkoutUrl`

2. **PayPalProvider.handleWebhook() implementieren**
   - `capturePaypalOrder()` → private Methode
   - Signature verification (später)
   - Event-ID extrahieren und speichern

3. **BillingService.checkout() erweitern**
   - DB-Persistierung (invoices, subscriptions, etc.)
   - Idempotency-Integration

4. **Neue Route `/api/billing/checkout`**
   - Ruft `BillingService.checkout()` auf
   - Idempotency-Key aus Header

5. **portal-upgrade.ts refactoren**
   - PayPal-Logik entfernen
   - Nutzt jetzt `BillingService.checkout()`

---

## 🎯 Wichtige Hinweise

- **DEV-Bypass** (`capturePaypalOrder` mit `DEV_` Prefix) muss erhalten bleiben
- **Return/Cancel URLs** müssen weiterhin funktionieren
- **Error-Handling** muss robust bleiben (PayPal-Fehler brechen nicht das Upgrade ab)
- **nodeFetch** wird weiterhin verwendet (kein PayPal SDK nötig)

