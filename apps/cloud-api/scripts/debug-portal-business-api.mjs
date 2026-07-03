/**
 * Debug: reproduce GET/PATCH /portal/business failures.
 * Usage: node scripts/debug-portal-business-api.mjs
 */
import 'dotenv/config';
import jwt from 'jsonwebtoken';

const API = 'http://localhost:3333';
const customerId = 'd3443f8f-60e7-49e7-88c3-ceed88cd139c';
const orgId = '20389d16-8b9b-4329-9c62-e84701867bd9';

const secret = process.env.JWT_SECRET;
if (!secret) {
  console.error('JWT_SECRET missing in .env');
  process.exit(1);
}

const token = jwt.sign({ customerId, orgId }, secret, { expiresIn: '1h' });

async function call(method, body) {
  const res = await fetch(`${API}/portal/business`, {
    method,
    headers: {
      Authorization: `Bearer ${token}`,
      ...(body ? { 'Content-Type': 'application/json' } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  let json;
  try {
    json = JSON.parse(text);
  } catch {
    json = text;
  }
  console.log(`\n=== ${method} /portal/business ===`);
  console.log('Status:', res.status);
  console.log('Body:', JSON.stringify(json, null, 2));
}

await call('GET');
await call('PATCH', { companyName: 'Caisty Test GmbH', country: 'DE', currency: 'EUR' });

// Admin endpoint (no auth in dev? check)
const adminRes = await fetch(
  `${API}/admin/fiscal/customers/${customerId}`,
).catch((e) => ({ error: e.message }));
if (adminRes.error) {
  console.log('\n=== GET /admin/fiscal/customers/:id ===');
  console.log('Error:', adminRes.error);
} else {
  const text = await adminRes.text();
  console.log('\n=== GET /admin/fiscal/customers/:id ===');
  console.log('Status:', adminRes.status);
  console.log('Body:', text.slice(0, 500));
}
