const { Client } = require('pg');
(async()=>{
  const c = new Client({ connectionString: 'postgresql://postgres:Biddingsystem2026@db.qdmhlkyaarkbabtbbioo.supabase.co:5432/postgres', ssl: { rejectUnauthorized: false } });
  await c.connect();
  const r = await c.query("SELECT pg_get_constraintdef(oid) AS def FROM pg_constraint WHERE conname = 'procurements_status_check'");
  console.log(r.rows);
  await c.end();
})().catch(e => { console.error(e); process.exit(1); });
