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

  const user = await db.user.findUnique({ where: { email } });
  if (!user) return NextResponse.json({ error: "Account not found." }, { status: 404 });

  const valid = await bcrypt.compare(password, user.password_hash);
  if (!valid) return NextResponse.json({ error: "Wrong password." }, { status: 401 });

  if (user.role === "supplier" && user.status === "pending") {
    return NextResponse.json({ error: "Your account is pending admin approval." }, { status: 403 });
  }
  if (user.role === "supplier" && user.status === "rejected") {
    return NextResponse.json({ error: "Your registration has been rejected." }, { status: 403 });
  }
  if (!user.is_active || user.status === "inactive") {
    return NextResponse.json({ error: "Your account is inactive." }, { status: 403 });
  }

  const access = await signAccessToken({ id: user.id, email: user.email, role: user.role });
  const refresh = await signRefreshToken(user.id);

  await logAudit("LOGIN", user.id, `${user.full_name} logged in`, "auth", user.id).catch(() => {});

  const { password_hash: _, ...safeUser } = user;
  const response = NextResponse.json({ access, refresh, user: safeUser });
  response.cookies.set("access_token", access, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24, // 24 hours
  });
  return response;
}
