(async ()=>{
  const base = process.env.BASE_URL || 'http://localhost:3000';
  const login = await fetch(base + '/api/auth/login', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ email: 'admin@gmail.com', password: 'admin123' }) });
  const lj = await login.json().catch(()=>null);
  console.log('login', login.status, lj?.access?.slice?.(0,20));
  const token = lj?.access;
  const supplierId = process.argv[2] || '1470ff49-308d-4e48-9471-f8adc33d2fc3';
  const res = await fetch(base + `/api/auth/suppliers/${supplierId}/status`, { method: 'PATCH', headers: { 'content-type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify({ status: 'approved' }) });
  const j = await res.json().catch(()=>null);
  console.log('approve', res.status, j);
})();
