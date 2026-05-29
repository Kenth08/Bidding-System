import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { v4 as uuid } from "uuid";
import { db } from "@/lib/db";
import { logAudit, notifyAdmins } from "@/lib/actions";
import { buildVerificationCodePayload, sendVerificationCodeEmail } from "@/lib/email-verification";
import { writeFile, mkdir } from "fs/promises";
import path from "path";

const isLocalMode = process.env.LOCAL_MODE === "true" || process.env.NEXT_PUBLIC_LOCAL_MODE === "true";

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
  try {
    const formData = await request.formData();
  const full_name = String(formData.get("full_name") || "").trim();
  const email = String(formData.get("email") || "").trim().toLowerCase();
  const password = String(formData.get("password") || "").trim();
  const company_name = String(formData.get("company_name") || "").trim();
  const company_address = String(formData.get("company_address") || "").trim();
  const phone = String(formData.get("phone") || "").trim();
  const business_type = String(formData.get("business_type") || "Other").trim();
  // Support multiple business type ids or names as repeated fields `business_type_ids`
  const rawBusinessTypeIds = formData.getAll("business_type_ids").map(String).filter(Boolean);

  async function resolveBusinessTypeIds(items: string[]) {
    const resolved: string[] = [];
    for (const item of items) {
      // try by id first
      let bt = null as any;
      try {
        bt = item.match?.(/[0-9a-fA-F\-]{36}/) ? await db.businessType.findUnique({ where: { id: item } }) : null;
      } catch (e) {
        bt = null;
      }
      if (!bt) {
        bt = await db.businessType.findFirst({ where: { name: { equals: item, mode: "insensitive" } } });
      }
      if (!bt) {
        // create a new business type (admin can later edit)
        bt = await db.businessType.create({ data: { id: uuid(), name: item, description: "", is_active: true } });
      }
      if (bt) resolved.push(bt.id);
    }
    return resolved;
  }
  const representative_name = String(formData.get("representative_name") || "").trim();
  const tin = String(formData.get("tin") || "").trim();
  const company_profile = String(formData.get("company_profile") || "").trim();
  const fromGoogle = formData.get("from_google") === "true";

  const mayors_permit_expiry_raw = formData.get("mayors_permit_expiry");
  const mayors_permit_expiry = mayors_permit_expiry_raw ? new Date(String(mayors_permit_expiry_raw)) : null;
  const tax_clearance_expiry_raw = formData.get("tax_clearance_expiry");
  const tax_clearance_expiry = tax_clearance_expiry_raw ? new Date(String(tax_clearance_expiry_raw)) : null;

  const philgeps_registration_expiry_raw = formData.get("philgeps_registration_expiry");
  const philgeps_registration_expiry = philgeps_registration_expiry_raw ? new Date(String(philgeps_registration_expiry_raw)) : null;
  const valid_id_type = String(formData.get("valid_id_type") || "").trim();
  const valid_id_number = String(formData.get("valid_id_number") || "").trim();
  const representative_job_title = String(formData.get("representative_job_title") || "").trim();
  const iso_certificate_type = String(formData.get("iso_certificate_type") || "").trim();
  const iso_certificate_expiry_raw = formData.get("iso_certificate_expiry");
  const iso_certificate_expiry = iso_certificate_expiry_raw ? new Date(String(iso_certificate_expiry_raw)) : null;
  const bank_name = String(formData.get("bank_name") || "").trim();
  const bank_account_name = String(formData.get("bank_account_name") || "").trim();
  const bank_account_number = String(formData.get("bank_account_number") || "").trim();
  const not_blacklisted_declaration = formData.get("not_blacklisted_declaration") === "true";
  const financial_statement_year = formData.get("financial_statement_year") ? Number(formData.get("financial_statement_year")) : null;
  const track_record_description = String(formData.get("track_record_description") || "").trim();

  if (!full_name || !email || !company_name || !representative_name || !tin || !company_profile) {
    return NextResponse.json({ error: "Please fill in all required fields." }, { status: 400 });
  }
  if (!fromGoogle && (!password || password.length < 6)) {
    return NextResponse.json({ error: "Password must be at least 6 characters." }, { status: 400 });
  }

  const requiredDocumentKeys = [
    "sec_dti_certificate",
    "mayors_permit",
    "philgeps_registration",
    "valid_id",
    "tax_clearance",
    "audited_financial_statements",
    "bank_reference_document",
    "representative_authorization_document",
  ] as const;

  const hasMissingRequiredDocument = requiredDocumentKeys.some((key) => {
    const file = formData.get(key) as File | null;
    return !file || file.size <= 0;
  }) || !not_blacklisted_declaration;

  if (hasMissingRequiredDocument) {
    return NextResponse.json(
      { error: "You must upload all required documents before registering." },
      { status: 400 }
    );
  }

  const existing = await db.user.findUnique({ where: { email } });

  const hasRealAccount = Boolean(
    existing && (
      existing.password_hash ||
      existing.role !== "viewer" ||
      existing.company_name ||
      existing.company_profile ||
      existing.business_permit_document ||
      existing.philgeps_registration ||
      existing.supporting_documents
    )
  );

  // Google flow: create new user without password
  if (fromGoogle) {
    const docFields = [
      "sec_dti_certificate",
      "mayors_permit",
      "business_permit_document",
      "philgeps_registration",
      "tax_clearance",
      "valid_id",
      "supporting_documents",
      "bir_form_2303",
      "iso_certificate",
      "blacklisting_declaration_document",
      "audited_financial_statements",
      "bank_reference_document",
      "performance_certificates",
      "past_contracts_document",
      "representative_authorization_document",
    ] as const;
    const docPaths: Record<string, string | null> = {};
    for (const key of docFields) {
      const file = formData.get(key) as File | null;
      docPaths[key] = file && file.size > 0 ? await saveFile(file, "documents") : null;
    }

    const profileData = {
      full_name,
      email,
      password_hash: existing?.password_hash || "",
      role: existing?.role || "supplier",
      status: "pending",
      company_name,
      company_address,
      phone,
      business_type,
      representative_name,
      tin,
      company_profile,
      sec_dti_certificate: docPaths.sec_dti_certificate,
      mayors_permit: docPaths.mayors_permit,
      mayors_permit_expiry,
      business_permit_document: docPaths.business_permit_document,
      philgeps_registration: docPaths.philgeps_registration,
      philgeps_registration_expiry: philgeps_registration_expiry,
      bir_form_2303: docPaths.bir_form_2303,
      valid_id: docPaths.valid_id,
      valid_id_type,
      valid_id_number,
      supporting_documents: docPaths.supporting_documents,
      representative_job_title,
      iso_certificate_type,
      iso_certificate: docPaths.iso_certificate,
      iso_certificate_expiry,
      bank_name,
      bank_account_name,
      bank_account_number,
      tax_clearance: docPaths.tax_clearance,
      tax_clearance_expiry,
      not_blacklisted_declaration,
      blacklisting_declaration_document: docPaths.blacklisting_declaration_document,
      audited_financial_statements: docPaths.audited_financial_statements,
      financial_statement_year,
      bank_reference_document: docPaths.bank_reference_document,
      performance_certificates: docPaths.performance_certificates,
      past_contracts_document: docPaths.past_contracts_document,
      track_record_description,
      representative_authorization_document: docPaths.representative_authorization_document,
    };

    const user = existing
      ? await db.user.update({ where: { id: existing.id }, data: profileData })
      : await db.user.create({
          data: {
            id: uuid(),
            ...profileData,
          },
        });

    // Link supplier to selected business types (if provided)
    if (rawBusinessTypeIds.length > 0) {
      const resolved = await resolveBusinessTypeIds(rawBusinessTypeIds);
      if (resolved.length > 0) {
        await db.supplierBusinessType.createMany({
          data: resolved.map((btId) => ({ supplier_id: user.id, business_type_id: btId })),
          skipDuplicates: true,
        });
        // keep legacy single string for quick reads
        const firstBt = await db.businessType.findUnique({ where: { id: resolved[0] } });
        if (firstBt) {
          await db.user.update({ where: { id: user.id }, data: { business_type: firstBt.name } });
        }
      }
    }

    await db.user.update({
      where: { id: user.id },
      data: {
        email_verified: true,
        email_verified_at: new Date(),
        email_verification_code_hash: null,
        email_verification_expires_at: null,
        email_verification_attempts: 0,
      },
    });

    await logAudit("CREATE", user.id, `Supplier registration completed for ${company_name}`, "supplier", user.id).catch(() => {});
    await notifyAdmins("new_supplier", "New Supplier Registration", `${full_name} from ${company_name} has registered and is pending approval.`, "/admin/suppliers", user.id).catch(() => {});

    return NextResponse.json({ message: "Registration submitted. Pending admin approval." }, { status: 201 });
  }

  // Normal email/password flow
  if (existing) {
    if (hasRealAccount) {
      return NextResponse.json({ error: "This email is already registered." }, { status: 409 });
    }
    return NextResponse.json({ error: "This email already has a pending Google registration. Please continue with Google." }, { status: 409 });
  }

  // Save uploaded documents
  const docFields = [
    "sec_dti_certificate",
    "mayors_permit",
    "business_permit_document",
    "philgeps_registration",
    "tax_clearance",
    "valid_id",
    "supporting_documents",
    "bir_form_2303",
    "iso_certificate",
    "blacklisting_declaration_document",
    "audited_financial_statements",
    "bank_reference_document",
    "performance_certificates",
    "past_contracts_document",
    "representative_authorization_document",
  ] as const;
  const docPaths: Record<string, string | null> = {};
  for (const key of docFields) {
    const file = formData.get(key) as File | null;
    docPaths[key] = file && file.size > 0 ? await saveFile(file, "documents") : null;
  }

  const password_hash = await bcrypt.hash(password, 12);
  const verification = isLocalMode ? null : buildVerificationCodePayload(email);

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
      representative_name,
      tin,
      company_profile,
      sec_dti_certificate: docPaths.sec_dti_certificate,
      mayors_permit: docPaths.mayors_permit,
      mayors_permit_expiry,
      business_permit_document: docPaths.business_permit_document,
      philgeps_registration: docPaths.philgeps_registration,
      philgeps_registration_expiry: philgeps_registration_expiry,
      bir_form_2303: docPaths.bir_form_2303,
      valid_id: docPaths.valid_id,
      valid_id_type,
      valid_id_number,
      supporting_documents: docPaths.supporting_documents,
      representative_job_title,
      iso_certificate_type,
      iso_certificate: docPaths.iso_certificate,
      iso_certificate_expiry,
      bank_name,
      bank_account_name,
      bank_account_number,
      tax_clearance: docPaths.tax_clearance,
      tax_clearance_expiry,
      not_blacklisted_declaration,
      blacklisting_declaration_document: docPaths.blacklisting_declaration_document,
      audited_financial_statements: docPaths.audited_financial_statements,
      financial_statement_year,
      bank_reference_document: docPaths.bank_reference_document,
      performance_certificates: docPaths.performance_certificates,
      past_contracts_document: docPaths.past_contracts_document,
      track_record_description,
      representative_authorization_document: docPaths.representative_authorization_document,
    },
  });

  await db.user.update({
    where: { id: user.id },
    data: {
      email_verified: isLocalMode,
      email_verified_at: isLocalMode ? new Date() : null,
      email_verification_code_hash: verification?.codeHash || null,
      email_verification_expires_at: verification?.expiresAt || null,
      email_verification_attempts: 0,
      email_verification_sent_at: new Date(),
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

  if (not_blacklisted_declaration) {
    await db.documentUpload.create({
      data: {
        user_id: user.id,
        document_type: "not_blacklisted_declaration",
        file_name: "Good Standing Declaration",
        file: "DECLARED",
        verification_status: "Pending",
      },
    });
  }

  await logAudit("CREATE", user.id, `Supplier registration submitted for ${company_name}`, "supplier", user.id).catch(() => {});
  await notifyAdmins("new_supplier", "New Supplier Registration", `${full_name} from ${company_name} has registered and is pending approval.`, "/admin/suppliers", user.id).catch(() => {});

  // Persist business types selection (required)
  let finalBusinessTypeIds: string[] = [];
  if (rawBusinessTypeIds.length > 0) {
    finalBusinessTypeIds = await resolveBusinessTypeIds(rawBusinessTypeIds);
  } else if (business_type) {
    // fallback to legacy single string
    const bt = await db.businessType.findFirst({ where: { name: { equals: business_type, mode: "insensitive" } } });
    if (bt) finalBusinessTypeIds = [bt.id];
    else {
      const nb = await db.businessType.create({ data: { id: uuid(), name: business_type, description: "", is_active: true } });
      finalBusinessTypeIds = [nb.id];
    }
  }

  if (finalBusinessTypeIds.length === 0) {
    return NextResponse.json({ error: "Please select at least one business category." }, { status: 400 });
  }

  await db.supplierBusinessType.createMany({ data: finalBusinessTypeIds.map((btId) => ({ supplier_id: user.id, business_type_id: btId })), skipDuplicates: true });

  // update legacy business_type text with first selection for compatibility
  const firstBT = await db.businessType.findUnique({ where: { id: finalBusinessTypeIds[0] } });
  if (firstBT) {
    await db.user.update({ where: { id: user.id }, data: { business_type: firstBT.name } });
  }

  if (!isLocalMode && verification) {
    await sendVerificationCodeEmail({
      to: email,
      fullName: full_name,
      code: verification.code,
    });
  }

    return NextResponse.json({
      message: isLocalMode ? "Registration submitted. Your account is ready for local sign-in after admin approval." : "Registration submitted. Check your email for the verification code.",
      verification_required: !isLocalMode,
      email,
    }, { status: 201 });
  } catch (e: any) {
    console.error('[register] uncaught error', e);
    return NextResponse.json({ error: e?.message || String(e), stack: e?.stack || null }, { status: 500 });
  }
}
