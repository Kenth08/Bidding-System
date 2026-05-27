const { Client } = require('pg');
(async ()=>{
  const conn = process.env.DATABASE_URL || 'postgresql://postgres:Biddingsystem2026@db.qdmhlkyaarkbabtbbioo.supabase.co:5432/postgres';
  const client = new Client({ connectionString: conn, ssl: { rejectUnauthorized: false } });
  await client.connect();
  const id = process.argv[2] || '1470ff49-308d-4e48-9471-f8adc33d2fc3';
  const res = await client.query('SELECT id, email, role, status, created_at FROM public.users WHERE id=$1', [id]);
  console.log(res.rows);
  await client.end();
})();
