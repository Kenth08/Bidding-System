// E2E smoke test (no blockchain write)
// Usage: node scripts/e2e-smoke.js
const base = process.env.BASE_URL || 'http://localhost:3001';
const util = require('util');
const fs = require('fs');

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

async function fetchWithCookies(url, options = {}, jar = {}) {
  options.headers = options.headers || {};
  if (jar.cookieString) options.headers['cookie'] = jar.cookieString;
  const res = await fetch(url, options);
  // capture set-cookie
  const sc = res.headers.get('set-cookie');
  if (sc) {
    // simplistic: replace cookieString
    jar.cookieString = sc.split(',').map(s => s.split(';')[0]).join('; ');
  }
  return res;
}

async function parseResponse(res) {
  try { return await res.json(); } catch (e) { try { return await res.text(); } catch { return null; } }
}

async function ensureAdmin(jar) {
  const url = `${base}/api/create-admin`;
  console.log('Ensure admin exists:', url);
  const res = await fetchWithCookies(url, { method: 'GET' }, jar);
  const j = await parseResponse(res);
  console.log('create-admin =>', res.status, typeof j === 'string' ? j.slice(0,200) : (j?.message || j?.error || JSON.stringify(j)) );
}

async function adminLogin(jar) {
  const url = `${base}/api/auth/login`;
  const body = { email: 'admin@gmail.com', password: 'admin123' };
  const res = await fetchWithCookies(url, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) }, jar);
  const j = await parseResponse(res);
  console.log('/api/auth/login =>', res.status, typeof j === 'string' ? j.slice(0,200) : (j?.error ? j.error : 'ok'));
  if (j && j.access) {
    jar.access = j.access;
    jar.refresh = j.refresh;
  }
}

async function registerSupplier(jar, email) {
  const url = `${base}/api/auth/register`;
  const fd = new FormData();
  fd.append('full_name', 'E2E Supplier');
  fd.append('email', email);
  fd.append('company_name', 'E2E Co');
  fd.append('representative_name', 'Rep');
  fd.append('tin', '123456789');
  fd.append('company_profile', 'Test profile');
  fd.append('from_google', 'true');
  // add small doc
  const blob = new Blob(['test document content'], { type: 'text/plain' });
  fd.append('business_permit_document', blob, 'permit.txt');

  const res = await fetchWithCookies(url, { method: 'POST', body: fd }, jar);
  const j = await parseResponse(res);
  console.log('/api/auth/register =>', res.status, typeof j === 'string' ? j.slice(0,200) : (j?.message || j?.error || JSON.stringify(j)));
}

async function findSupplierByEmail(jar, email) {
  const url = `${base}/api/auth/suppliers`;
  const res = await fetchWithCookies(url, { method: 'GET' }, jar);
  const j = await parseResponse(res);
  if (res.status !== 200) { console.log('Failed to list suppliers', res.status, j); return null; }
  const found = (j.data || []).find(s => s.email === email);
  console.log('findSupplierByEmail =>', !!found);
  return found;
}

async function adminSetPassword(jar, supplierId, password) {
  const url = `${base}/api/auth/users/${supplierId}`;
  const res = await fetchWithCookies(url, { method: 'PATCH', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ password }) }, jar);
  const j = await parseResponse(res);
  console.log('Set supplier password =>', res.status, typeof j === 'string' ? j.slice(0,200) : (j?.error || 'ok'));
}

async function adminApproveSupplier(jar, supplierId) {
  const url = `${base}/api/auth/suppliers/${supplierId}/status`;
  const res = await fetchWithCookies(url, { method: 'PATCH', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ status: 'approved' }) }, jar);
  const j = await parseResponse(res);
  console.log('Approve supplier =>', res.status, typeof j === 'string' ? j.slice(0,200) : (j?.error || 'ok'));
}

async function createProject(jar) {
  const url = `${base}/api/projects`;
  const body = { title: 'E2E Test Project', budget: 1000000, deadline: new Date(Date.now()+3*24*3600*1000).toISOString(), procurement_type: 'Goods', requirements: 'Test requirements' };
  const res = await fetchWithCookies(url, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) }, jar);
  const j = await parseResponse(res);
  console.log('Create project =>', res.status, j?.id ? j.id : j?.error || JSON.stringify(j));
  return j;
}

async function publishProject(jar, projectId) {
  const url = `${base}/api/projects/${projectId}/publish`;
  const res = await fetchWithCookies(url, { method: 'PATCH' }, jar);
  const j = await parseResponse(res);
  console.log('Publish project =>', res.status, typeof j === 'string' ? j.slice(0,200) : (j.error || 'ok'));
}

async function supplierLogin(jar, email, password) {
  const url = `${base}/api/auth/login`;
  const res = await fetchWithCookies(url, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ email, password }) }, jar);
  const j = await parseResponse(res);
  console.log('Supplier login =>', res.status, typeof j === 'string' ? j.slice(0,200) : (j.error || 'ok'));
  if (j && j.access) {
    jar.supplierAccess = j.access;
    jar.supplierCookie = jar.cookieString;
  }
}

async function submitBid(jar, projectId) {
  // use supplier cookie stored in jar.supplierCookie
  const localJar = { cookieString: jar.cookieString };
  const url = `${base}/api/bids`;
  const fd = new FormData();
  fd.append('project', projectId);
  fd.append('bid_amount', '500000');
  fd.append('supplier_declaration', 'true');
  fd.append('no_conflict_of_interest', 'true');
  fd.append('signature_name', 'Signer');
  const blob = new Blob(['quotation'], { type: 'application/pdf' });
  fd.append('quotation_document', blob, 'quote.pdf');
  fd.append('technical_proposal_document', blob, 'tech.pdf');
  const res = await fetchWithCookies(url, { method: 'POST', body: fd }, localJar);
  const j = await parseResponse(res);
  console.log('Submit bid =>', res.status, typeof j === 'string' ? j.slice(0,200) : (j.id ? j.id : j.error || JSON.stringify(j)));
}

(async function main(){
  try {
    const jar = {};
    await ensureAdmin(jar);
    await adminLogin(jar);

    const supplierEmail = `e2e_supplier_${Date.now()}@example.com`;
    console.log('Registering supplier:', supplierEmail);
    await registerSupplier(jar, supplierEmail);
    await sleep(500);

    const supplier = await findSupplierByEmail(jar, supplierEmail);
    if (!supplier) throw new Error('Supplier not found in admin list');

    await adminSetPassword(jar, supplier.id, 'supplier123');
    await adminApproveSupplier(jar, supplier.id);

    const project = await createProject(jar);
    await publishProject(jar, project.id);

    // Supplier login using updated password
    const supplierJar = {};
    await supplierLogin(supplierJar, supplierEmail, 'supplier123');
    // copy cookie string to main jar for supplier operations
    if (!supplierJar.cookieString) supplierJar.cookieString = supplierJar.supplierCookie || supplierJar.cookieString;
    // submit bid
    await submitBid(supplierJar, project.id);

    console.log('E2E steps up to bid submission completed. Stopping before winner selection to avoid blockchain writes.');
  } catch (e) {
    console.error('E2E error:', e);
    process.exit(1);
  }
})();
