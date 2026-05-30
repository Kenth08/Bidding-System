import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";
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
  if (!isPasswordValid) return NextResponse.json({ error: "Wrong email or password." }, { status: 401 });

  // --- From here on, password is valid. Use 403 for account restrictions. ---

  if (user.role === "supplier" && !user.email_verified) {
    return NextResponse.json({ error: "Please verify your email before signing in.", email_verification_required: true, email: user.email }, { status: 403 });
  }

  // Supplier verification_status gate — single source of truth
  if (user.role === "supplier") {
    const vs = user.verification_status;

    if (vs === "waiting_admin_approval") {
      return NextResponse.json({ error: "Your supplier account is currently under admin review." }, { status: 403 });
    }
    if (vs === "waiting_admin_review") {
      return NextResponse.json({ error: "Your corrected documents are currently under admin review." }, { status: 403 });
    }
    if (vs === "rejected") {
      return NextResponse.json({ error: "Your registration has been rejected." }, { status: 403 });
    }
    // revision_required: allow login (limited access enforced by middleware/layout)
    // verified: allow full login
  }

  if (!user.is_active || user.status === "inactive") {
    return NextResponse.json({ error: "Your account is inactive." }, { status: 403 });
  }

  // --- Issue token ---
  const access = await signAccessToken({ id: user.id, email: user.email, role: user.role, status: user.verification_status, session_version: user.session_version });
  const refresh = await signRefreshToken(user.id);

  await logAudit("LOGIN", user.id, `${user.full_name} logged in`, "auth", user.id).catch(() => {});

  // Determine redirect path for supplier based on verification_status
  let redirectPath: string | undefined;
  if (user.role === "supplier") {
    if (user.verification_status === "revision_required") {
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
