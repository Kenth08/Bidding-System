const BASE_URL = process.env.E2E_BASE_URL || "http://localhost:3000";

class SessionClient {
  constructor(baseUrl) {
    this.baseUrl = baseUrl;
    this.cookies = new Map();
  }

  _cookieHeader() {
    return Array.from(this.cookies.entries())
      .map(([k, v]) => `${k}=${v}`)
      .join("; ");
  }

  _storeSetCookies(res) {
    const getSetCookie = res.headers.getSetCookie?.bind(res.headers);
    const values = getSetCookie ? getSetCookie() : [];
    for (const raw of values) {
      const first = String(raw).split(";")[0] || "";
      const idx = first.indexOf("=");
      if (idx > 0) {
        const name = first.slice(0, idx).trim();
        const value = first.slice(idx + 1).trim();
        if (value) this.cookies.set(name, value);
        else this.cookies.delete(name);
      }
    }
  }

  async request(path, options = {}) {
    console.log(`   -> ${options.method || "GET"} ${path}`);
    const headers = new Headers(options.headers || {});
    const cookieHeader = this._cookieHeader();
    if (cookieHeader) headers.set("cookie", cookieHeader);

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 30000);

    const res = await fetch(`${this.baseUrl}${path}`, {
      ...options,
      headers,
      signal: controller.signal,
    });
    clearTimeout(timeout);

    this._storeSetCookies(res);

    const text = await res.text();
    let data = null;
    try {
      data = text ? JSON.parse(text) : null;
    } catch {
      data = text;
    }

    console.log(`   <- ${res.status} ${path}`);
    return { status: res.status, ok: res.ok, data };
  }

  get(path) {
    return this.request(path, { method: "GET" });
  }

  postJson(path, body) {
    return this.request(path, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body || {}),
    });
  }

  patchJson(path, body) {
    return this.request(path, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body || {}),
    });
  }

  postForm(path, formData) {
    return this.request(path, {
      method: "POST",
      body: formData,
    });
  }
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

async function main() {
  const admin = new SessionClient(BASE_URL);
  const supplier = new SessionClient(BASE_URL);

  console.log("1) Admin login");
  const adminLogin = await admin.postJson("/api/auth/login", {
    email: "admin@gmail.com",
    password: "admin123",
  });
  assert(adminLogin.ok, `Admin login failed: ${JSON.stringify(adminLogin.data)}`);

  console.log("2) Fetch suppliers and target supplier@gmail.com");
  const suppliersRes = await admin.get("/api/auth/suppliers");
  assert(suppliersRes.ok, `Fetching suppliers failed: ${JSON.stringify(suppliersRes.data)}`);
  const suppliers = suppliersRes?.data?.data || [];
  const target = suppliers.find((s) => String(s.email).toLowerCase() === "supplier@gmail.com");
  assert(target?.id, "Target supplier@gmail.com not found.");
  const supplierId = target.id;
  console.log(`   Supplier ID: ${supplierId}`);

  console.log("3) Admin open verification (triggers required auto-flag)");
  const verifyRes = await admin.get(`/api/auth/suppliers/${supplierId}/documents`);
  assert(verifyRes.ok, `Verification fetch failed: ${JSON.stringify(verifyRes.data)}`);

  const docs = verifyRes.data?.documents || [];
  const flaggedRequired = docs.filter((d) => d.required && d.state === "flagged");
  console.log(`   Flagged required docs: ${flaggedRequired.length}`);

  console.log("4) Notify supplier of flagged required docs");
  const notifyRes = await admin.postJson(`/api/auth/suppliers/${supplierId}/notify-flagged`, {});
  assert(notifyRes.ok, `Notify failed: ${JSON.stringify(notifyRes.data)}`);

  console.log("5) Supplier login should be allowed in revision_required");
  const supplierLogin = await supplier.postJson("/api/auth/login", {
    email: "supplier@gmail.com",
    password: "supplier123",
  });
  assert(supplierLogin.ok, `Supplier login failed in revision_required: ${JSON.stringify(supplierLogin.data)}`);

  console.log("6) Supplier fetch own verification docs");
  let myDocsRes = await supplier.get("/api/auth/supplier-documents");
  assert(myDocsRes.ok, `Supplier docs fetch failed: ${JSON.stringify(myDocsRes.data)}`);
  let myDocs = myDocsRes.data?.documents || [];
  let myFlaggedRequired = myDocs.filter((d) => d.required && d.state === "flagged");
  console.log(`   Supplier flagged required docs to re-upload: ${myFlaggedRequired.length}`);

  console.log("7) Re-upload all flagged required docs");
  for (const doc of myFlaggedRequired) {
    const form = new FormData();
    const blob = new Blob([`dummy content for ${doc.id}`], { type: "application/pdf" });
    form.append("file", blob, `${doc.id}.pdf`);

    const upRes = await supplier.postForm(`/api/supplier/documents/${encodeURIComponent(doc.id)}/reupload`, form);
    assert(upRes.ok, `Re-upload failed for ${doc.id}: ${JSON.stringify(upRes.data)}`);
    console.log(`   Re-uploaded: ${doc.id}`);
  }

  console.log("8) Submit revision package");
  const submitRes = await supplier.postJson("/api/supplier/submit-revision", {});
  assert(submitRes.ok, `Submit revision failed: ${JSON.stringify(submitRes.data)}`);
  assert(Boolean(submitRes.data?.forceLogout), "Expected forceLogout=true after submit revision.");

  console.log("9) Supplier login should now be blocked (waiting_admin_review)");
  const blockedLogin = await supplier.postJson("/api/auth/login", {
    email: "supplier@gmail.com",
    password: "supplier123",
  });
  assert(!blockedLogin.ok, "Supplier login unexpectedly allowed during waiting_admin_review.");

  console.log("10) Admin approve each required doc then approve all unlock");
  const verifyRes2 = await admin.get(`/api/auth/suppliers/${supplierId}/documents`);
  assert(verifyRes2.ok, `Verification fetch #2 failed: ${JSON.stringify(verifyRes2.data)}`);
  const docs2 = verifyRes2.data?.documents || [];
  const requiredPending = docs2.filter((d) => d.required && d.state !== "approved");

  for (const doc of requiredPending) {
    const approveRes = await admin.patchJson(`/api/auth/suppliers/${supplierId}/documents`, {
      documentType: doc.id,
      action: "approve",
    });
    assert(approveRes.ok, `Approve required doc failed for ${doc.id}: ${JSON.stringify(approveRes.data)}`);
  }

  const finalApprove = await admin.postJson(`/api/auth/suppliers/${supplierId}/approve-all-unlock`, {});
  assert(finalApprove.ok, `Final approve/unlock failed: ${JSON.stringify(finalApprove.data)}`);

  console.log("11) Supplier login should be allowed with full access (verified)");
  const finalSupplierLogin = await supplier.postJson("/api/auth/login", {
    email: "supplier@gmail.com",
    password: "supplier123",
  });
  assert(finalSupplierLogin.ok, `Supplier final login failed: ${JSON.stringify(finalSupplierLogin.data)}`);

  console.log("\nE2E workflow check PASSED");
}

main().catch((err) => {
  console.error("\nE2E workflow check FAILED:");
  console.error(err?.message || err);
  process.exit(1);
});
