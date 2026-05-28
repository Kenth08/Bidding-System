import dotenv from "dotenv";
import pg from "pg";

dotenv.config({ path: ".env.local" });

const { Client } = pg;

async function main() {
  const client = new Client({ connectionString: process.env.DATABASE_URL });
  await client.connect();

  const res = await client.query(
    "UPDATE users SET email_verified=true, email_verified_at=NOW() WHERE email=$1 RETURNING id,email,email_verified,status",
    ["supplier@gmail.com"]
  );

  console.log(res.rows);
  await client.end();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
