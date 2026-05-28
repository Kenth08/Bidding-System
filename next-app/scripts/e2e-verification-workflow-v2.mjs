const BASE = "http://localhost:3000";

function assert(cond, msg) {
  if (!cond) throw new Error(msg);
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function cookieFromResponse(res) {
  const arr = res.headers.getSetCookie?.() || [];
  return arr.map((v) => String(v).split(";")[0]).join("; ");
}

async function postJson(path, body, cookie = "") {
  const res = await fetch(`${BASE}${path}`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      ...(cookie ? { cookie } : {}),
    },
    body: JSON.stringify(body || {}),
  });
  const data = await res.json().catch(() => ({}));
  return { res, data };
}

async function patchJson(path, body, cookie = "") {
  const res = await fetch(`${BASE}${path}`, {
    method: "PATCH",
    headers: {
      "content-type": "application/json",
      ...(cookie ? { cookie } : {}),
    },
    body: JSON.stringify(body || {}),
  });
  const data = await res.json().catch(() => ({}));
  return { res, data };
}

async function getJson(path, cookie = "") {
  const res = await fetch(`${BASE}${path}`, {
    headers: cookie ? { cookie } : {},
  });
  const data = await res.json().catch(() => ({}));
  return { res, data };
}

async function postForm(path, form, cookie = "") {
  const res = await fetch(`${BASE}${path}`, {
    method: "POST",
    headers: cookie ? { cookie } : {},
    body: form,
  });
  const data = await res.json().catch(() => ({}));
  return { res, data };
}

async function registerSupplier(adminCookie, email) {
  const form = new FormData();
  form.append("full_name", "E2E Supplier");
  form.append("email", email);
  form.append("company_name", "E2E Co");
  form.append("company_address", "123 Test Street");
  form.append("phone", "09170000000");
  form.append("business_type", "Construction");
  form.append("representative_name", "Test Rep");
  form.append("tin", "123456789");
  form.append("company_profile", "Automated test supplier");
  form.append("from_google", "true");
  form.append("not_blacklisted_declaration", "true");

  const requiredDocs = [
    "sec_dti_certificate",
    "mayors_permit",
    "philgeps_registration",
    "valid_id",
    "tax_clearance",
    "audited_financial_statements",
    "bank_reference_document",
    "representative_authorization_document",
  ];

  for (const key of requiredDocs) {
    form.append(key, new Blob([`dummy ${key}`], { type: "application/pdf" }), `${key}.pdf`);
  }

  const res = await fetch(`${BASE}/api/auth/register`, {
    method: "POST",
    headers: adminCookie ? { cookie: adminCookie } : {},
    body: form,
  });
  const data = await res.json().catch(() => ({}));
  assert(res.ok, `Register failed: ${JSON.stringify(data)}`);
  return data;
}

async function adminSetPassword(adminCookie, supplierId, password) {
  const { res, data } = await patchJson(
    `/api/auth/users/${supplierId}`,
    { password, email_verified: true },
    adminCookie
  );
  assert(res.ok, `Set password failed: ${JSON.stringify(data)}`);
}

async function adminApproveSupplier(adminCookie, supplierId) {
  const { res, data } = await patchJson(
    `/api/auth/suppliers/${supplierId}/status`,
    { status: "approved" },
    adminCookie
  );
  assert(res.ok, `Approve supplier failed: ${JSON.stringify(data)}`);
}

async function main() {
  console.log("1) Admin login");
  const adminLogin = await postJson("/api/auth/login", { email: "admin@gmail.com", password: "admin123" });
  assert(adminLogin.res.ok, `Admin login failed: ${JSON.stringify(adminLogin.data)}`);
  const adminCookie = cookieFromResponse(adminLogin.res);

  const supplierEmail = `e2e_supplier_${Date.now()}@example.com`;

  console.log("2) Register supplier");
  await registerSupplier(adminCookie, supplierEmail);
  await sleep(500);

  console.log("3) Find supplier");
  const suppliersRes = await getJson("/api/auth/suppliers", adminCookie);
  assert(suppliersRes.res.ok, `Suppliers fetch failed: ${JSON.stringify(suppliersRes.data)}`);
  const supplier = (suppliersRes.data?.data || []).find((u) => String(u.email).toLowerCase() === supplierEmail.toLowerCase());
  assert(supplier?.id, `${supplierEmail} not found`);

  console.log("4) Set password + approve supplier");
  await adminSetPassword(adminCookie, supplier.id, "supplier123");
  await adminApproveSupplier(adminCookie, supplier.id);

  console.log("5) Open verification (auto-flag)");
  const verify = await getJson(`/api/auth/suppliers/${supplier.id}/documents`, adminCookie);
  assert(verify.res.ok, `Verification fetch failed: ${JSON.stringify(verify.data)}`);

  console.log("6) Notify supplier");
  const notify = await postJson(`/api/auth/suppliers/${supplier.id}/notify-flagged`, {}, adminCookie);
  assert(notify.res.ok, `Notify failed: ${JSON.stringify(notify.data)}`);

  console.log("7) Supplier login (revision_required should allow)");
  const supplierLogin = await postJson("/api/auth/login", { email: supplierEmail, password: "supplier123" });
  assert(supplierLogin.res.ok, `Supplier login failed in revision_required: ${JSON.stringify(supplierLogin.data)}`);
  const supplierCookie = cookieFromResponse(supplierLogin.res);

  console.log("8) Fetch supplier docs and reupload flagged required");
  const myDocs = await getJson("/api/auth/supplier-documents", supplierCookie);
  assert(myDocs.res.ok, `Supplier docs fetch failed: ${JSON.stringify(myDocs.data)}`);

  const flaggedRequired = (myDocs.data?.documents || []).filter((d) => d.required && d.state === "flagged");
  for (const d of flaggedRequired) {
    const form = new FormData();
    form.append("file", new Blob([`dummy ${d.id}`], { type: "application/pdf" }), `${d.id}.pdf`);
    const up = await postForm(`/api/supplier/documents/${encodeURIComponent(d.id)}/reupload`, form, supplierCookie);
    assert(up.res.ok, `Reupload failed for ${d.id}: ${JSON.stringify(up.data)}`);
  }

  console.log("9) Submit revision");
  const submit = await postJson("/api/supplier/submit-revision", {}, supplierCookie);
  assert(submit.res.ok, `Submit revision failed: ${JSON.stringify(submit.data)}`);
  assert(Boolean(submit.data?.forceLogout), "forceLogout expected on submit revision");

  console.log("10) Supplier login blocked while waiting_admin_review");
  const blocked = await postJson("/api/auth/login", { email: supplierEmail, password: "supplier123" });
  assert(!blocked.res.ok, "Supplier login should be blocked in waiting_admin_review");

  console.log("11) Admin approve required docs + final unlock");
  const verify2 = await getJson(`/api/auth/suppliers/${supplier.id}/documents`, adminCookie);
  assert(verify2.res.ok, `Verification fetch #2 failed: ${JSON.stringify(verify2.data)}`);

  const requiredPending = (verify2.data?.documents || []).filter((d) => d.required && d.state !== "approved");
  for (const d of requiredPending) {
    const ap = await patchJson(`/api/auth/suppliers/${supplier.id}/documents`, {
      documentType: d.id,
      action: "approve",
    }, adminCookie);
    assert(ap.res.ok, `Approve failed for ${d.id}: ${JSON.stringify(ap.data)}`);
  }

  const final = await postJson(`/api/auth/suppliers/${supplier.id}/approve-all-unlock`, {}, adminCookie);
  assert(final.res.ok, `Final unlock failed: ${JSON.stringify(final.data)}`);

  console.log("12) Supplier login allowed after verified");
  const finalLogin = await postJson("/api/auth/login", { email: supplierEmail, password: "supplier123" });
  assert(finalLogin.res.ok, `Supplier final login failed: ${JSON.stringify(finalLogin.data)}`);

  console.log("E2E workflow PASSED");
}

main().catch((e) => {
  console.error("E2E workflow FAILED:", e.message);
  process.exit(1);
});
