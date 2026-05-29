const { Pool } = require('pg');

const databaseUrl = "postgresql://postgres:Biddingsystem2026@db.qdmhlkyaarkbabtbbioo.supabase.co:5432/postgres";
const pool = new Pool({
  connectionString: databaseUrl,
  ssl: { rejectUnauthorized: false }
});

async function main() {
  const client = await pool.connect();
  try {
    const usersRes = await client.query("SELECT id, email, full_name, company_name, role, status, verification_status FROM users");
    console.log('All Live Users:');
    console.log(usersRes.rows.map(u => ({
      id: u.id,
      email: u.email,
      full_name: u.full_name,
      company_name: u.company_name,
      role: u.role,
      status: u.status,
      verification_status: u.verification_status
    })));
  } finally {
    client.release();
  }
}

main().catch(console.error).finally(() => pool.end());
