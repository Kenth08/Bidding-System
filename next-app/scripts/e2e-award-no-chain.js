// E2E flow: register -> approve -> bid -> evaluate -> close -> award -> report
// Blockchain writes are intentionally skipped in API when ENABLE_BLOCKCHAIN != true.

const { Client } = require('pg');

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';
const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error('DATABASE_URL is required for this script.');
  process.exit(2);
}

function logStep(name, status, detail) {
  console.log(`${name} => ${status}${detail ? ' ' + detail : ''}`);
}

async function parse(res) {
  try { return await res.json(); } catch { return null; }
}

async function api(path, options = {}) {
  const res = await fetch(`${BASE_URL}${path}`, options);
  const body = await parse(res);
  return { res, body };
}

async function login(email, password) {
  const { res, body } = await api('/api/auth/login', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  return { status: res.status, body };
}

async function withAuth(token, path, options = {}) {
  const headers = Object.assign({}, options.headers || {}, { Authorization: `Bearer ${token}` });
  return api(path, Object.assign({}, options, { headers }));
}

async function closeProjectViaDb(projectId) {
  const client = new Client({ connectionString: DATABASE_URL, ssl: { rejectUnauthorized: false } });
  await client.connect();
  try {
    await client.query(
      `UPDATE projects_project
       SET deadline = NOW() - INTERVAL '1 day', updated_at = NOW()
       WHERE id = $1`,
      [projectId]
    );
  } finally {
    await client.end();
  }
}

(async function main() {
  try {
    // 1) Admin login
    const adminLogin = await login('admin@gmail.com', 'admin123');
    if (adminLogin.status !== 200 || !adminLogin.body?.access) throw new Error('Admin login failed');
    const adminToken = adminLogin.body.access;
    logStep('Admin login', adminLogin.status, 'ok');

    // 2) Register supplier (google flow, auto email_verified)
    const supplierEmail = `award_supplier_${Date.now()}@example.com`;
    const fd = new FormData();
    fd.append('full_name', 'Award Supplier');
    fd.append('email', supplierEmail);
    fd.append('company_name', 'Award Co');
    fd.append('representative_name', 'Award Rep');
    fd.append('tin', '987654321');
    fd.append('company_profile', 'Award test profile');
    fd.append('from_google', 'true');
    const doc = new Blob(['permit'], { type: 'text/plain' });
    fd.append('business_permit_document', doc, 'permit.txt');

    const reg = await api('/api/auth/register', { method: 'POST', body: fd });
    logStep('Supplier register', reg.res.status, reg.body?.message || reg.body?.error || '');
    if (reg.res.status !== 201) throw new Error('Supplier registration failed');

    // 3) Find supplier id via admin suppliers list
    const suppliers = await withAuth(adminToken, '/api/auth/suppliers', { method: 'GET' });
    if (suppliers.res.status !== 200) throw new Error('Could not list suppliers');
    const supplier = (suppliers.body?.data || []).find((s) => s.email === supplierEmail);
    if (!supplier) throw new Error('Registered supplier not found');

    // 4) Set supplier password + approve
    const setPass = await withAuth(adminToken, `/api/auth/users/${supplier.id}`, {
      method: 'PATCH',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ password: 'supplier123' }),
    });
    logStep('Set supplier password', setPass.res.status, setPass.body?.error || 'ok');
    if (setPass.res.status !== 200) throw new Error('Set supplier password failed');

    const approve = await withAuth(adminToken, `/api/auth/suppliers/${supplier.id}/status`, {
      method: 'PATCH',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ status: 'approved' }),
    });
    logStep('Approve supplier', approve.res.status, approve.body?.error || 'ok');
    if (approve.res.status !== 200) throw new Error('Approve supplier failed');

    // 5) Create + publish project
    const createProject = await withAuth(adminToken, '/api/projects', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        title: `Award Test Project ${Date.now()}`,
        budget: 1000000,
        deadline: new Date(Date.now() + 3 * 24 * 3600 * 1000).toISOString(),
        procurement_type: 'Goods',
        requirements: 'Award flow requirements',
      }),
    });
    logStep('Create project', createProject.res.status, createProject.body?.id || createProject.body?.error || '');
    if (createProject.res.status !== 201) throw new Error('Create project failed');
    const projectId = createProject.body.id;

    const publish = await withAuth(adminToken, `/api/projects/${projectId}/publish`, { method: 'PATCH' });
    logStep('Publish project', publish.res.status, publish.body?.error || 'ok');
    if (publish.res.status !== 200) throw new Error('Publish failed');

    // 6) Supplier login + bid
    const supplierLogin = await login(supplierEmail, 'supplier123');
    logStep('Supplier login', supplierLogin.status, supplierLogin.body?.error || 'ok');
    if (supplierLogin.status !== 200 || !supplierLogin.body?.access) throw new Error('Supplier login failed');
    const supplierToken = supplierLogin.body.access;

    const bidFd = new FormData();
    bidFd.append('project', projectId);
    bidFd.append('bid_amount', '450000');
    bidFd.append('supplier_declaration', 'true');
    bidFd.append('no_conflict_of_interest', 'true');
    bidFd.append('signature_name', 'Award Signer');
    const bidDoc = new Blob(['quotation'], { type: 'application/pdf' });
    bidFd.append('quotation_document', bidDoc, 'quote.pdf');
    bidFd.append('technical_proposal_document', bidDoc, 'tech.pdf');

    const bidCreate = await withAuth(supplierToken, '/api/bids', { method: 'POST', body: bidFd });
    logStep('Submit bid', bidCreate.res.status, bidCreate.body?.id || bidCreate.body?.error || '');
    if (bidCreate.res.status !== 201) throw new Error('Bid submit failed');
    const bidId = bidCreate.body.id;

    // 7) Admin review + compliant
    const review = await withAuth(adminToken, `/api/bids/${bidId}/review`, { method: 'PATCH' });
    logStep('Mark under evaluation', review.res.status, review.body?.error || 'ok');
    if (review.res.status !== 200) throw new Error('Review route failed');

    const remarks = await withAuth(adminToken, `/api/bids/${bidId}/remarks`, {
      method: 'PATCH',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ technical_compliance: true, evaluation_remarks: 'Compliant for award test' }),
    });
    logStep('Mark compliant', remarks.res.status, remarks.body?.error || 'ok');
    if (remarks.res.status !== 200) throw new Error('Remarks/compliance failed');

    // 8) Simulate deadline pass and auto-close through GET /api/projects
    await closeProjectViaDb(projectId);
    const projectList = await withAuth(adminToken, '/api/projects', { method: 'GET' });
    logStep('Auto-close pass', projectList.res.status, 'triggered');
    if (projectList.res.status !== 200) throw new Error('Project auto-close trigger failed');

    // 9) Award winner (no blockchain write expected)
    const select = await withAuth(adminToken, `/api/bids/${bidId}/select`, { method: 'PATCH' });
    logStep('Select winner', select.res.status, select.body?.error || 'ok');
    if (select.res.status !== 200) throw new Error('Select winner failed');

    // 10) Reporting endpoint check
    const report = await withAuth(adminToken, '/api/reports/procurement', { method: 'GET' });
    logStep('Procurement report', report.res.status, report.body?.error || 'ok');
    if (report.res.status !== 200) throw new Error('Procurement report failed');

    console.log('Award flow completed successfully without blockchain writes.');
    console.log(JSON.stringify({ projectId, bidId, supplierId: supplier.id }, null, 2));
  } catch (e) {
    console.error('E2E award flow failed:', e.message || e);
    process.exit(1);
  }
})();
