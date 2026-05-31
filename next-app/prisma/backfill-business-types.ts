import "dotenv/config";
import pg from "pg";

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });

async function main() {
  const client = await pool.connect();
  try {
    // Get suppliers with a business_type but no junction table entries
    const { rows: suppliers } = await client.query(`
      SELECT u.id, u.email, u.business_type
      FROM users u
      WHERE u.role = 'supplier' AND u.business_type != ''
        AND NOT EXISTS (SELECT 1 FROM supplier_business_types sbt WHERE sbt.supplier_id = u.id)
    `);

    const { rows: businessTypes } = await client.query(`SELECT id, name FROM business_types`);
    const btMap = new Map(businessTypes.map((bt) => [bt.name.toLowerCase(), bt.id]));

    let count = 0;
    for (const supplier of suppliers) {
      const btId = btMap.get(supplier.business_type.toLowerCase());
      if (!btId) {
        console.log(`⚠️  No matching BusinessType for "${supplier.business_type}" (${supplier.email})`);
        continue;
      }
      await client.query(
        `INSERT INTO supplier_business_types (supplier_id, business_type_id) VALUES ($1, $2) ON CONFLICT DO NOTHING`,
        [supplier.id, btId]
      );
      count++;
      console.log(`✅ ${supplier.email} → ${supplier.business_type}`);
    }
    console.log(`\nDone. Backfilled ${count} supplier(s).`);
  } finally {
    client.release();
    await pool.end();
  }
}

main().catch(console.error);
