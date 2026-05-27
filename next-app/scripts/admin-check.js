(async ()=>{
  const base = process.env.BASE_URL || 'http://localhost:3000';
  const res = await fetch(base + '/api/auth/login', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ email: 'admin@gmail.com', password: 'admin123' }) });
  const j = await res.json().catch(()=>null);
  console.log('login', res.status, j);
  const token = j?.access;
  const sup = await fetch(base + '/api/auth/suppliers', { headers: { Authorization: token ? `Bearer ${token}` : '' } });
  const sdata = await sup.json().catch(()=>null);
  console.log('/api/auth/suppliers', sup.status, sdata?.data?.slice?.(0,5) || sdata);
})();
