import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { v4 as uuid } from "uuid";
import { db } from "@/lib/db";
import { logAudit, notifyAdmins } from "@/lib/actions";

export async function POST(request: Request) {
  const body = await request.json();
  const full_name = String(body.full_name || "").trim();
  const email = String(body.email || "").trim().toLowerCase();
  const password = String(body.password || "").trim();
  const company_name = String(body.company_name || "").trim();
  const company_address = String(body.company_address || "").trim();
  const phone = String(body.phone || "").trim();
  const business_type = String(body.business_type || "Other").trim();

  if (!full_name || !email || !password || !company_name) {
    return NextResponse.json({ error: "Please fill in all required fields." }, { status: 400 });
  }
  if (password.length < 6) {
    return NextResponse.json({ error: "Password must be at least 6 characters." }, { status: 400 });
  }

  const existing = await db.user.findUnique({ where: { email } });
  if (existing) return NextResponse.json({ error: "This email is already registered." }, { status: 409 });

  const password_hash = await bcrypt.hash(password, 12);
  const user = await db.user.create({
    data: {
      id: uuid(),
      full_name,
      email,
      password_hash,
      role: "supplier",
      status: "pending",
      company_name,
      company_address,
      phone,
      business_type,
    },
  });

  await logAudit("CREATE", user.id, `Supplier registration submitted for ${company_name}`, "supplier", user.id).catch(() => {});
  await notifyAdmins(
    "new_supplier",
    "New Supplier Registration",
    `${full_name} from ${company_name} has registered and is pending approval.`,
    "/admin/suppliers",
    user.id
  ).catch(() => {});

  return NextResponse.json({ message: "Registration submitted. Pending admin approval." }, { status: 201 });
}
