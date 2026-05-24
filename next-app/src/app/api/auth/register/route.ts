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
  const fromGoogle = formData.get("from_google") === "true";

  if (!full_name || !email || !company_name) {
    return NextResponse.json({ error: "Please fill in all required fields." }, { status: 400 });
  }
  if (!fromGoogle && (!password || password.length < 6)) {
    return NextResponse.json({ error: "Password must be at least 6 characters." }, { status: 400 });
  }

  const existing = await db.user.findUnique({ where: { email } });

  // Google flow: create new user without password
  if (fromGoogle) {
    if (existing) return NextResponse.json({ error: "This email is already registered." }, { status: 409 });

    const docFields = ["business_permit_document", "philgeps_registration", "tax_clearance", "valid_id"] as const;
    const docPaths: Record<string, string | null> = {};
    for (const key of docFields) {
      const file = formData.get(key) as File | null;
      docPaths[key] = file && file.size > 0 ? await saveFile(file, "documents") : null;
    }

    const user = await db.user.create({
      data: {
        id: uuid(),
        full_name,
        email,
        password_hash: "",
        role: "supplier",
        status: "pending",
        company_name,
        company_address,
        phone,
        business_type,
        business_permit_document: docPaths.business_permit_document,
        philgeps_registration: docPaths.philgeps_registration,
        tax_clearance: docPaths.tax_clearance,
        valid_id: docPaths.valid_id,
      },
    });

    await logAudit("CREATE", user.id, `Supplier registration completed for ${company_name}`, "supplier", user.id).catch(() => {});
    await notifyAdmins("new_supplier", "New Supplier Registration", `${full_name} from ${company_name} has registered and is pending approval.`, "/admin/suppliers", user.id).catch(() => {});

    return NextResponse.json({ message: "Registration submitted. Pending admin approval." }, { status: 201 });
  }

  // Normal email/password flow
  if (existing) return NextResponse.json({ error: "This email is already registered." }, { status: 409 });

  // Save uploaded documents
  const docFields = ["business_permit_document", "philgeps_registration", "tax_clearance", "valid_id"] as const;
  const docPaths: Record<string, string | null> = {};
  for (const key of docFields) {
    const file = formData.get(key) as File | null;
    docPaths[key] = file && file.size > 0 ? await saveFile(file, "documents") : null;
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
      business_permit_document: docPaths.business_permit_document,
      philgeps_registration: docPaths.philgeps_registration,
      tax_clearance: docPaths.tax_clearance,
      valid_id: docPaths.valid_id,
    },
  });

  // Save document uploads
  for (const key of docFields) {
    if (docPaths[key]) {
      await db.documentUpload.create({
        data: { user_id: user.id, document_type: key, file_name: key, file: docPaths[key] },
      });
    }
  }

  await logAudit("CREATE", user.id, `Supplier registration submitted for ${company_name}`, "supplier", user.id).catch(() => {});
  await notifyAdmins("new_supplier", "New Supplier Registration", `${full_name} from ${company_name} has registered and is pending approval.`, "/admin/suppliers", user.id).catch(() => {});

  return NextResponse.json({ message: "Registration submitted. Pending admin approval." }, { status: 201 });
}
