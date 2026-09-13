import { Pool } from "pg";
import { json } from "@/lib/api-utils";

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

export async function GET() {
  const client = await pool.connect();
  try {
    const [totalResult, activeResult] = await Promise.all([
      client.query('SELECT COUNT(*)::int AS count FROM projects_project'),
      client.query("SELECT COUNT(*)::int AS count FROM projects_project WHERE status = 'active'"),
    ]);

    return json({
      total_projects: totalResult.rows[0]?.count ?? 0,
      active_bidding: activeResult.rows[0]?.count ?? 0,
    });
  } finally {
    client.release();
  }
}
