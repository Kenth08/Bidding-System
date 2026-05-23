import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { v4 as uuid } from "uuid";
import { db } from "@/lib/db";
import { logAudit, notifyAdmins } from "@/lib/actions";
import { writeFile, mkdir } from "fs/promises";
import path from "path";

async function saveFile(file: File, folder: string): Promise<string> {
  const dir = path.join(process.cwd(), "public", "uploads", folder);
  await mkdir(dir, { recursive: true });
  const ext = path.extname(file.name) || ".bin";
  const filename = `${uuid()}${ext}`;
  const buffer = Buffer.from(await file.arrayBuffer());
  await writeFile(path.join(dir, filename), buffer);
  return `/uploads/${folder}/${filename}`;
}

export async function POST(request: Request) {
  const formData = await request.formData();
  const full_name = String(formData.get("full_name") || "").trim();
  const email = String(formData.get("email") || "").trim().toLowerCase();
  const password = String(formData.get("password") || "").trim();
  const company_name = String(formData.get("company_name") || "").trim();
  const company_address = String(formData.get("company_address") || "").trim();
  const phone = String(formData.get("phone") || "").trim();
  const business_type = String(formData.get("business_type") || "Other").trim();

  if (!full_name || !email || !password || !company_name) {
    return NextResponse.json({ error: "Please fill in all required fields." }, { status: 400 });
  }
  if (password.length < 6) {
    return NextResponse.json({ error: "Password must be at least 6 characters." }, { status: 400 });
  }

  const existing = await db.user.findUnique({ where: { email } });
  if (existing) return NextResponse.json({ error: "This email is already registered." }, { status: 409 });

  // Save business permit document if provided
  let permitPath: string | null = null;
  const permitFile = formData.get("business_permit_document") as File | null;
  if (permitFile && permitFile.size > 0) {
    permitPath = await saveFile(permitFile, "permits");
  }

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
      business_permit_document: permitPath,
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
