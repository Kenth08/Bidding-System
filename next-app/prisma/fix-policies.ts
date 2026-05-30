import "dotenv/config";
import pg from "pg";

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });

async function main() {
  const client = await pool.connect();
  try {
    // Get all policies on all tables
    const { rows } = await client.query(`
      SELECT schemaname, tablename, policyname 
      FROM pg_policies 
      WHERE schemaname = 'public'
    `);
    
    for (const row of rows) {
      await client.query(`DROP POLICY IF EXISTS "${row.policyname}" ON "${row.tablename}"`);
      console.log(`Dropped: ${row.policyname} on ${row.tablename}`);
    }

    // Disable RLS on all tables
    const { rows: tables } = await client.query(`
      SELECT tablename FROM pg_tables WHERE schemaname = 'public'
    `);
    for (const t of tables) {
      await client.query(`ALTER TABLE "${t.tablename}" DISABLE ROW LEVEL SECURITY`);
    }

    console.log("\nAll RLS policies dropped and RLS disabled.");
  } finally {
    client.release();
    await pool.end();
  }
}

main().catch(console.error);
