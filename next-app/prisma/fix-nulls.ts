import "dotenv/config";
import pg from "pg";

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });

async function main() {
  const client = await pool.connect();
  try {
    const result = await client.query(`
      UPDATE users SET
        company_name = COALESCE(company_name, ''),
        company_address = COALESCE(company_address, ''),
        phone = COALESCE(phone, ''),
        business_type = COALESCE(business_type, ''),
        not_blacklisted_declaration = COALESCE(not_blacklisted_declaration, false),
        verification_status = COALESCE(verification_status, 'pending'),
        email_verified = COALESCE(email_verified, false),
        email_verification_attempts = COALESCE(email_verification_attempts, 0),
        is_staff = COALESCE(is_staff, false),
        is_superuser = COALESCE(is_superuser, false)
    `);
    console.log("Rows updated:", result.rowCount);
  } finally {
    client.release();
    await pool.end();
  }
}

main().catch(console.error);
