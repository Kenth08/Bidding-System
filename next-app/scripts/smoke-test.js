// Lightweight smoke test for read-only endpoints
// Usage: node scripts/smoke-test.js
const base = process.env.BASE_URL || 'http://localhost:3000';
const paths = [
  '/',
  '/api/auth/suppliers',
  '/api/procurement-requests',
  '/api/projects',
  '/api/bids'
];

async function waitForServer(timeout = 60000) {
  const start = Date.now();
  while (Date.now() - start < timeout) {
    try {
      const res = await fetch(base + '/api/healthcheck').catch(() => null);
      if (res && (res.status === 200 || res.status === 204)) return true;
      const r2 = await fetch(base + '/').catch(() => null);
      if (r2 && r2.status === 200) return true;
    } catch (e) {}
    await new Promise(r => setTimeout(r, 1000));
  }
  throw new Error('Server did not become ready in time');
}

async function run() {
  console.log('Base URL:', base);
  try {
    await waitForServer(60000);
  } catch (err) {
    console.error('Server not ready:', err.message);
    process.exit(2);
  }

  for (const p of paths) {
    const url = base + p;
    try {
      const res = await fetch(url);
      const text = await res.text();
      console.log(p, '=>', res.status);
      if (res.headers.get('content-type')?.includes('application/json')) {
        try { console.log(JSON.stringify(JSON.parse(text), null, 2)); } catch { console.log(text.slice(0,200)); }
      } else {
        console.log(text.slice(0,200));
      }
    } catch (e) {
      console.error(p, 'error:', e.message);
    }
  }
}

run().catch(e => { console.error(e); process.exit(1); });
