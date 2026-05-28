import { NextResponse } from "next/server";
import { dbDirect } from "@/lib/db-direct";
import { signAccessToken, signRefreshToken } from "@/lib/auth";

const isLocalMode = process.env.LOCAL_MODE === "true" || process.env.NEXT_PUBLIC_LOCAL_MODE === "true";

export async function POST(request: Request) {
  if (isLocalMode) {
    return NextResponse.json({ redirect: "/login?error=local_mode" }, { status: 403 });
  }

  const { email: rawEmail } = await request.json();
  if (!rawEmail) return NextResponse.json({ error: "Missing email" }, { status: 400 });

  const email = String(rawEmail).toLowerCase();

  // Check if user exists in our DB
  const existingUser = await dbDirect.user.findUnique({ email });

  const hasRealAccount = Boolean(
    existingUser && (
      existingUser.password_hash ||
      existingUser.role !== "viewer" ||
      existingUser.company_name ||
      existingUser.company_profile ||
      existingUser.business_permit_document ||
      existingUser.philgeps_registration ||
      existingUser.supporting_documents
    )
  );

  if (!hasRealAccount) {
    return NextResponse.json({ redirect: `/register?email=${encodeURIComponent(email)}&from=google&message=no_account` }, { status: 404 });
  }

  if (existingUser.status === "pending") {
    return NextResponse.json({ redirect: "/login?error=pending" }, { status: 403 });
  }

  if (existingUser.role === "supplier" && !existingUser.email_verified) {
    return NextResponse.json({ redirect: `/verify-email?email=${encodeURIComponent(existingUser.email)}` }, { status: 403 });
  }

  if (existingUser.status === "rejected") {
    return NextResponse.json({ redirect: "/login?error=rejected" }, { status: 403 });
  }

  if (!existingUser.is_active || existingUser.status === "inactive") {
    return NextResponse.json({ redirect: "/login?error=inactive" }, { status: 403 });
  }

  // User is valid — generate tokens
  const access = await signAccessToken({ id: existingUser.id, email: existingUser.email, role: existingUser.role });
  const refresh = await signRefreshToken(existingUser.id);

  const { password_hash, ...safeUser } = existingUser as any;
  const response = NextResponse.json({ access, refresh, user: safeUser });
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
