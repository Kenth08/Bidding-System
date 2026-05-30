import "dotenv/config";
import pg from "pg";

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });

async function main() {
  const client = await pool.connect();
  try {
    const queries = [
      "DELETE FROM audit_logs WHERE user_id IS NOT NULL AND user_id NOT IN (SELECT id FROM users)",
      "DELETE FROM document_uploads WHERE user_id NOT IN (SELECT id FROM users)",
      "DELETE FROM notifications WHERE recipient_id NOT IN (SELECT id FROM users)",
      "DELETE FROM bids_bid WHERE supplier_id NOT IN (SELECT id FROM users)",
      "DELETE FROM bids_bid WHERE project_id NOT IN (SELECT id FROM projects_project)",
      "DELETE FROM supplier_business_types WHERE supplier_id NOT IN (SELECT id FROM users)",
      "DELETE FROM blockchain_blockchainrecord WHERE winner_id NOT IN (SELECT id FROM users)",
      "DELETE FROM blockchain_blockchainrecord WHERE project_id NOT IN (SELECT id FROM projects_project)",
    ];
    for (const q of queries) {
      try {
        const r = await client.query(q);
        if (r.rowCount && r.rowCount > 0) console.log(`${r.rowCount} rows cleaned: ${q.slice(0, 60)}...`);
      } catch (e: any) {
        // Table might not exist, skip
        if (!e.message.includes("does not exist")) console.error(e.message);
      }
    }
    console.log("Done - orphaned records cleaned.");
  } finally {
    client.release();
    await pool.end();
  }
}

main().catch(console.error);
