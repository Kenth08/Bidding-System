import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";
import { supabaseServer } from "@/lib/supabase-server";
import { signAccessToken, signRefreshToken } from "@/lib/auth";
import { logAudit } from "@/lib/actions";

export async function POST(request: Request) {
  const body = await request.json();
  const email = String(body.email || "").trim().toLowerCase();
  const password = String(body.password || "").trim();

  if (!email || !password) {
    return NextResponse.json({ error: "Please enter your email and password." }, { status: 400 });
  }

  let user = await db.user.findUnique({ where: { email } });
  if (!user && email === "head@gmail.com") {
    user = await db.user.findUnique({ where: { email: "schoolhead@gmail.com" } });
  }
  if (!user) return NextResponse.json({ error: "Wrong email or password." }, { status: 401 });

  if (user.role === "supplier" && user.status === "incomplete_registration") {
    const { password_hash, ...safeUser } = user as any;
    return NextResponse.json({ error: "Please complete your registration first.", user: safeUser, incomplete: true }, { status: 403 });
  }

  const isPasswordValid = await bcrypt.compare(password, user.password_hash);

  if (process.env.NODE_ENV === "development") {
    console.log("[login debug]", {
      emailFound: !!user,
      hasPasswordHash: !!user?.password_hash,
      hashLooksValid: user?.password_hash?.startsWith("$2"),
      passwordValid: isPasswordValid,
      role: user?.role,
      status: user?.status,
      verificationStatus: user?.verification_status,
    });
  }

  if (!isPasswordValid) return NextResponse.json({ error: "Wrong email or password." }, { status: 401 });

  // --- From here on, password is valid. Use 403 for account restrictions. ---

  if (user.role === "supplier" && !user.email_verified) {
    return NextResponse.json({ error: "Please verify your email before signing in.", email_verification_required: true, email: user.email }, { status: 403 });
  }

  // Supplier verification status gate
  if (user.role === "supplier") {
    // Determine effective verification status.
    // If status is "approved" or "active", treat as verified (admin already approved).
    const approvedStatuses = ["approved", "active", "verified"];
    const vs = approvedStatuses.includes(user.status)
      ? (user.verification_status === "verified" ? "verified" : "verified")
      : (user.verification_status || user.status);

    if (vs === "waiting_admin_approval" || vs === "pending") {
      return NextResponse.json({ error: "Your supplier account is currently under admin review." }, { status: 403 });
    }
    if (vs === "waiting_admin_review") {
      return NextResponse.json({ error: "Your corrected documents are currently under admin review." }, { status: 403 });
    }
    if (vs === "rejected") {
      return NextResponse.json({ error: "Your registration has been rejected." }, { status: 403 });
    }
    // revision_required and verified: allow login (redirect handled by frontend)
  }

  // Workflow lock check (Supabase table)
  if (user.role === "supplier") {
    try {
      const { data: workflow, error } = await supabaseServer
        .from("supplier_document_workflows")
        .select("account_locked")
        .eq("supplier_id", user.id)
        .maybeSingle();
      if (error) throw error;
      const isLocked = Boolean(workflow?.account_locked);

      if (isLocked && user.status !== "revision_required" && !["approved", "active", "verified"].includes(user.status)) {
        return NextResponse.json({
          error: "Your account is temporarily locked. Please revise and resubmit flagged documents from your profile.",
        }, { status: 403 });
      }
    } catch {
      // Ignore if the workflow table is not available in this environment.
    }
  }

  if (!user.is_active || user.status === "inactive") {
    return NextResponse.json({ error: "Your account is inactive." }, { status: 403 });
  }

  // --- Issue token ---
  const access = await signAccessToken({ id: user.id, email: user.email, role: user.role, status: user.status });
  const refresh = await signRefreshToken(user.id);

  await logAudit("LOGIN", user.id, `${user.full_name} logged in`, "auth", user.id).catch(() => {});

  // Determine redirect path for supplier based on verification_status
  let redirectPath: string | undefined;
  if (user.role === "supplier") {
    if (user.verification_status === "revision_required" || user.status === "revision_required") {
      redirectPath = "/supplier/revision-required";
    } else {
      redirectPath = "/supplier/dashboard";
    }
  }

  const { password_hash, ...safeUser } = user as any;
  const response = NextResponse.json({ access, refresh, user: safeUser, redirectPath });
  response.cookies.set("access_token", access, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24,
  });
  response.cookies.set("refresh_token", refresh, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });
  return response;
}
