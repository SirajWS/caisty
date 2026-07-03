import postgres from 'postgres';

const url = process.env.DATABASE_URL || 'postgres://caisty:devpassword@localhost:5432/caisty';
const sql = postgres(url);

try {
  const cols = await sql`
    SELECT column_name FROM information_schema.columns
    WHERE table_name = 'business_profiles' ORDER BY ordinal_position
  `;
  const colNames = cols.map((c) => c.column_name);
  console.log('=== business_profiles columns ===');
  console.log(colNames.join(', '));
  console.log('config_version present:', colNames.includes('config_version'));

  const rows = await sql`
    SELECT id, org_id, company_name, country, currency, updated_at
    FROM business_profiles LIMIT 5
  `;
  console.log('\n=== business_profiles rows ===');
  console.log(JSON.stringify(rows, null, 2));

  const customers = await sql`
    SELECT id, name, email, org_id FROM customers
    WHERE email ILIKE '%caisty%' OR email ILIKE '%siraj%' OR email ILIKE '%demo%'
  `;
  console.log('\n=== customers ===');
  console.log(JSON.stringify(customers, null, 2));

  for (const c of customers) {
    const bp = await sql`
      SELECT id, org_id, company_name, country FROM business_profiles
      WHERE org_id = ${c.org_id} LIMIT 1
    `;
    console.log(`profile for ${c.email}:`, bp.length ? bp[0] : 'NONE');
  }

  const migTables = await sql`
    SELECT schemaname, tablename FROM pg_tables
    WHERE tablename LIKE '%drizzle%' OR tablename LIKE '%migration%'
  `;
  console.log('\n=== migration-related tables ===');
  console.log(migTables);
} finally {
  await sql.end();
}
