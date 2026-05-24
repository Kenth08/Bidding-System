import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { db } from "@/lib/db";
import { signAccessToken, signRefreshToken } from "@/lib/auth";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");

  if (!code) {
    return NextResponse.redirect(new URL("/login?error=missing_code", request.url));
  }

  // Exchange code for session via Supabase
  const { data: authData, error: authError } = await supabase.auth.exchangeCodeForSession(code);

  if (authError || !authData.user?.email) {
    return NextResponse.redirect(new URL("/login?error=auth_failed", request.url));
  }

  const email = authData.user.email.toLowerCase();

  // Check if user exists in our DB
  const existingUser = await db.user.findUnique({ where: { email } });

  if (!existingUser) {
    // Create minimal record with incomplete_registration status
    await db.user.create({
      data: {
        email,
        full_name: authData.user.user_metadata?.full_name || "",
        password_hash: "",
        role: "supplier",
        status: "incomplete_registration",
      },
    });
    // Redirect to registration form with email pre-filled
    return NextResponse.redirect(new URL(`/register?email=${encodeURIComponent(email)}&from=google`, request.url));
  }

  // User exists — check status
  if (existingUser.status === "incomplete_registration") {
    return NextResponse.redirect(new URL(`/register?email=${encodeURIComponent(email)}&from=google`, request.url));
  }

  if (existingUser.status === "pending") {
    return NextResponse.redirect(new URL("/login?error=pending", request.url));
  }

  if (existingUser.status === "rejected") {
    return NextResponse.redirect(new URL("/login?error=rejected", request.url));
  }

  if (existingUser.role !== "supplier") {
    // Non-supplier roles (admin, school_head) — log them in
    const access = await signAccessToken({ id: existingUser.id, email: existingUser.email, role: existingUser.role });
    const refresh = await signRefreshToken(existingUser.id);
    const redirectPath = existingUser.role === "admin" ? "/admin" : existingUser.role === "school_head" ? "/school-head" : "/";
    const response = NextResponse.redirect(new URL(redirectPath, request.url));
    response.cookies.set("access_token", access, { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax", path: "/", maxAge: 60 * 60 * 24 });
    // Pass tokens via URL hash for client-side storage
    return NextResponse.redirect(new URL(`${redirectPath}#access=${access}&refresh=${refresh}`, request.url));
  }

  // Supplier with approved/active status — log them in
  if (existingUser.status === "approved" || existingUser.status === "active") {
    const access = await signAccessToken({ id: existingUser.id, email: existingUser.email, role: existingUser.role });
    const refresh = await signRefreshToken(existingUser.id);
    const response = NextResponse.redirect(new URL(`/auth/callback?access=${access}&refresh=${refresh}`, request.url));
    response.cookies.set("access_token", access, { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax", path: "/", maxAge: 60 * 60 * 24 });
    return response;
  }

  // Fallback — inactive or unknown status
  return NextResponse.redirect(new URL("/login?error=inactive", request.url));
}
