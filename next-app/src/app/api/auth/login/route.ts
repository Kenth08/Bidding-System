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
  if (!user) return NextResponse.json({ error: "Account not found." }, { status: 404 });

  if (user.role === "supplier" && user.status === "incomplete_registration") {
    const { password_hash, ...safeUser } = user as any;
    return NextResponse.json({ error: "Please complete your registration first.", user: safeUser, incomplete: true }, { status: 403 });
  }

  const valid = await bcrypt.compare(password, user.password_hash);
  if (!valid) return NextResponse.json({ error: "Wrong password." }, { status: 401 });

  if (user.role === "supplier" && !user.email_verified) {
    return NextResponse.json({ error: "Please verify your email before signing in.", email_verification_required: true, email: user.email }, { status: 403 });
  }

  if (user.role === "supplier" && user.status === "pending") {
    return NextResponse.json({ error: "Your account is pending admin approval." }, { status: 403 });
  }
  if (user.role === "supplier" && user.status === "rejected") {
    return NextResponse.json({ error: "Your registration has been rejected." }, { status: 403 });
  }

  if (user.role === "supplier") {
    try {
      const { data: workflow, error } = await supabaseServer
        .from("supplier_document_workflows")
        .select("account_locked")
        .eq("supplier_id", user.id)
        .maybeSingle();
      if (error) throw error;
      const isLocked = Boolean(workflow?.account_locked);
      if (isLocked) {
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

  const access = await signAccessToken({ id: user.id, email: user.email, role: user.role });
  const refresh = await signRefreshToken(user.id);

  await logAudit("LOGIN", user.id, `${user.full_name} logged in`, "auth", user.id).catch(() => {});

  const { password_hash, ...safeUser } = user as any;
  const response = NextResponse.json({ access, refresh, user: safeUser });
  response.cookies.set("access_token", access, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24, // 24 hours
  });
  response.cookies.set("refresh_token", refresh, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7, // 7 days
  });
  return response;
}
