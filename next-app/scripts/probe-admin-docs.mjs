async function main() {
  const loginRes = await fetch("http://localhost:3000/api/auth/login", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ email: "admin@gmail.com", password: "admin123" }),
  });

  const setCookies = loginRes.headers.getSetCookie?.() || [];
  const cookie = setCookies.map((v) => String(v).split(";")[0]).join("; ");
  console.log("login", loginRes.status);

  const suppliersRes = await fetch("http://localhost:3000/api/auth/suppliers", {
    headers: { cookie },
  });
  const suppliersPayload = await suppliersRes.json();
  const supplier = (suppliersPayload?.data || []).find(
    (x) => String(x.email).toLowerCase() === "supplier@gmail.com"
  );

  if (!supplier?.id) {
    console.error("supplier@gmail.com not found");
    process.exit(1);
  }

  console.log("supplier", supplier.id);

  const docsRes = await fetch(`http://localhost:3000/api/auth/suppliers/${supplier.id}/documents`, {
    headers: { cookie },
  });

  console.log("docs", docsRes.status);
  const body = await docsRes.text();
  console.log(body.slice(0, 1000));
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
