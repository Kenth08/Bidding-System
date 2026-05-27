#!/usr/bin/env node
const { Pool } = require('pg');
const fs = require('fs').promises;
const path = require('path');

async function main() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    console.error('ERROR: DATABASE_URL is not set. Set it and re-run.');
    process.exit(2);
  }

  const pool = new Pool({ connectionString: databaseUrl, ssl: { rejectUnauthorized: false } });
  const migrationsDir = path.join(__dirname, 'migrations');

  try {
    const items = await fs.readdir(migrationsDir, { withFileTypes: true });
    const folders = items.filter((d) => d.isDirectory()).map((d) => d.name).sort();
    for (const folder of folders) {
      const sqlPath = path.join(migrationsDir, folder, 'migration.sql');
      try {
        const sql = await fs.readFile(sqlPath, 'utf8');
        if (!sql.trim()) continue;
        console.log(`Applying migration: ${folder}`);
        const client = await pool.connect();
        try {
          await client.query('BEGIN');
          await client.query(sql);
          await client.query('COMMIT');
          console.log(`Applied: ${folder}`);
        } catch (e) {
          await client.query('ROLLBACK');
          const msg = e && e.message ? String(e.message) : String(e);
          // If migration objects already exist, skip and continue
          if (/already exists|duplicate column|column .* already exists/i.test(msg)) {
            console.warn(`Warning: migration ${folder} partial - ${msg}. Skipping.`);
          } else {
            console.error(`Failed to apply ${folder}:`, msg);
            client.release();
            process.exit(3);
          }
        } finally {
          client.release();
        }
      } catch (e) {
        // skip if no migration.sql
        // eslint-disable-next-line no-console
        console.warn(`No migration.sql in ${folder}, skipping.`);
      }
    }

    console.log('All migrations applied.');
  } finally {
    await pool.end();
  }
}

main().catch((e) => { console.error(e); process.exit(1); });
