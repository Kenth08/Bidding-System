import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { verifyToken, signAccessToken } from "@/lib/auth";

export async function POST(request: Request) {
  const body = await request.json();
  const refreshToken = body.refresh;
  if (!refreshToken) return NextResponse.json({ error: "Refresh token required." }, { status: 400 });

  const payload = await verifyToken(refreshToken);
  if (!payload?.sub) return NextResponse.json({ error: "Invalid or expired refresh token." }, { status: 401 });

  const user = await db.user.findUnique({ where: { id: payload.sub } });
  if (!user) return NextResponse.json({ error: "User not found." }, { status: 401 });

  const access = await signAccessToken({ id: user.id, email: user.email, role: user.role });
  const response = NextResponse.json({ access });
  response.cookies.set("access_token", access, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 15,
  });
  return response;
}
